"""
Core course endpoints. This is where the AI workflow described in the
project spec actually happens:

  User Input -> Topic Analysis -> Learning Objectives -> Course Outline
  -> Module Generation -> Content Generation -> Examples
  -> Quiz & Assignment Generation -> Personalized Course

Syllabus generation happens eagerly (on course creation) because it's
fast and the learner needs to see the outline immediately.
Per-module content/quiz generation happens lazily (on first open) so
course creation stays fast and we don't burn tokens on modules the
learner never opens.
"""
import json
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth
from app.llm.client import generate_json, LLMGenerationError
from app.llm import prompts

router = APIRouter(prefix="/courses", tags=["courses"])


@router.post("", response_model=schemas.CourseDetail)
def create_course(
    payload: schemas.CourseCreateRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    """Stage 1-4 of the pipeline: topic analysis through course outline."""
    try:
        system, user_prompt = prompts.syllabus_prompt(
            payload.topic, payload.difficulty, payload.duration, payload.learning_goal
        )
        syllabus = generate_json(system, user_prompt)
    except LLMGenerationError as e:
        raise HTTPException(status_code=502, detail=f"Course generation failed: {e}")

    if "modules" not in syllabus or not syllabus["modules"]:
        raise HTTPException(status_code=502, detail="AI returned an empty syllabus. Please try again.")

    course = models.Course(
        owner_id=user.id,
        topic=payload.topic,
        difficulty=payload.difficulty,
        duration=payload.duration,
        learning_goal=payload.learning_goal,
        title=syllabus.get("title", payload.topic),
        description=syllabus.get("description", ""),
        status="ready",
    )
    db.add(course)
    db.flush()  # get course.id before adding modules

    for idx, m in enumerate(syllabus["modules"]):
        module = models.Module(
            course_id=course.id,
            order_index=idx,
            title=m.get("title", f"Module {idx + 1}"),
            subtopics_json=json.dumps(m.get("subtopics", [])),
            objectives_json=json.dumps(m.get("objectives", [])),
            is_generated=False,
        )
        db.add(module)

    db.commit()
    db.refresh(course)
    return _course_to_detail(db, course, user.id)


@router.get("", response_model=list[schemas.CourseSummary])
def list_courses(db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    courses = db.query(models.Course).filter(models.Course.owner_id == user.id).order_by(
        models.Course.created_at.desc()
    ).all()
    return courses


@router.get("/{course_id}", response_model=schemas.CourseDetail)
def get_course(course_id: int, db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    course = _get_owned_course(db, course_id, user)
    return _course_to_detail(db, course, user.id)


@router.get("/{course_id}/modules/{module_id}", response_model=schemas.ModuleContent)
def get_module(course_id: int, module_id: int, db: Session = Depends(get_db),
                user: models.User = Depends(auth.get_current_user)):
    """Stage 5-7: lazily generates full content + examples + quiz on first open."""
    course = _get_owned_course(db, course_id, user)
    module = db.query(models.Module).filter(
        models.Module.id == module_id, models.Module.course_id == course.id
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    if not module.is_generated:
        _generate_module_content_and_quiz(db, course, module)

    return schemas.ModuleContent(
        id=module.id,
        title=module.title,
        objectives=json.loads(module.objectives_json or "[]"),
        content_md=module.content_md or "",
        examples=json.loads(module.examples_json or "[]"),
        is_generated=module.is_generated,
    )


@router.get("/{course_id}/modules/{module_id}/assessments")
def get_module_assessments(course_id: int, module_id: int, db: Session = Depends(get_db),
                            user: models.User = Depends(auth.get_current_user)):
    course = _get_owned_course(db, course_id, user)
    module = db.query(models.Module).filter(
        models.Module.id == module_id, models.Module.course_id == course.id
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    if not module.is_generated:
        _generate_module_content_and_quiz(db, course, module)

    assessments = db.query(models.Assessment).filter(models.Assessment.module_id == module.id).all()
    result = []
    for a in assessments:
        payload = json.loads(a.payload_json)
        if a.type == "quiz":
            # strip correct answers before sending to the client
            safe_quiz = [
                {k: v for k, v in q.items() if k not in ("correct_answer", "explanation")}
                for q in payload
            ]
            result.append({"id": a.id, "type": "quiz", "questions": safe_quiz})
        else:
            result.append({"id": a.id, "type": "assignment", "assignment": payload})
    return result


@router.post("/{course_id}/modules/{module_id}/quiz", response_model=schemas.QuizResult)
def submit_quiz(course_id: int, module_id: int, payload: schemas.QuizSubmitRequest,
                 db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    """Stage 9-11: quiz score tracking + progress tracking."""
    course = _get_owned_course(db, course_id, user)
    assessment = db.query(models.Assessment).filter(
        models.Assessment.id == payload.assessment_id, models.Assessment.module_id == module_id
    ).first()
    if not assessment or assessment.type != "quiz":
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = json.loads(assessment.payload_json)
    correct_count = 0
    feedback = []
    for q in questions:
        given = payload.answers.get(q["id"])
        is_correct = given == q["correct_answer"]
        correct_count += int(is_correct)
        feedback.append({
            "id": q["id"],
            "correct": is_correct,
            "correct_answer": q["correct_answer"],
            "explanation": q.get("explanation", ""),
        })

    total = len(questions)
    score = round((correct_count / total) * 100, 1) if total else 0.0

    attempt = models.QuizAttempt(
        user_id=user.id, assessment_id=assessment.id, module_id=module_id,
        score=score, answers_json=json.dumps(payload.answers),
    )
    db.add(attempt)

    # mark module complete if score is reasonable
    if score >= 60:
        _mark_module_complete(db, user.id, module_id)

    db.commit()
    return schemas.QuizResult(score=score, correct=correct_count, total=total, feedback=feedback)


@router.post("/{course_id}/modules/{module_id}/regenerate", response_model=schemas.ModuleContent)
def regenerate_module(course_id: int, module_id: int, db: Session = Depends(get_db),
                       user: models.User = Depends(auth.get_current_user)):
    """Improves a module the learner scored poorly on (adaptive regeneration)."""
    course = _get_owned_course(db, course_id, user)
    module = db.query(models.Module).filter(
        models.Module.id == module_id, models.Module.course_id == course.id
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    last_attempt = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.module_id == module_id, models.QuizAttempt.user_id == user.id
    ).order_by(models.QuizAttempt.attempted_at.desc()).first()
    weak_reason = "general understanding of the module" if not last_attempt else \
        f"scored {last_attempt.score}% on the last quiz attempt"

    try:
        system, user_prompt = prompts.regeneration_prompt(module.title, weak_reason, course.difficulty)
        result = generate_json(system, user_prompt)
    except LLMGenerationError as e:
        raise HTTPException(status_code=502, detail=f"Regeneration failed: {e}")

    module.content_md = result.get("content_md", module.content_md)
    module.examples_json = json.dumps(result.get("examples", []))
    db.commit()
    db.refresh(module)

    return schemas.ModuleContent(
        id=module.id, title=module.title,
        objectives=json.loads(module.objectives_json or "[]"),
        content_md=module.content_md, examples=json.loads(module.examples_json or "[]"),
        is_generated=True,
    )


@router.post("/{course_id}/complete")
def complete_course(course_id: int, db: Session = Depends(get_db),
                     user: models.User = Depends(auth.get_current_user)):
    course = _get_owned_course(db, course_id, user)
    course.status = "completed"
    db.commit()
    return {"status": "completed"}


# ---------------------------------------------------------------- helpers
def _get_owned_course(db: Session, course_id: int, user: models.User) -> models.Course:
    course = db.query(models.Course).filter(
        models.Course.id == course_id, models.Course.owner_id == user.id
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def _course_to_detail(db: Session, course: models.Course, user_id: int) -> schemas.CourseDetail:
    module_ids = [m.id for m in course.modules]
    completed_ids = set()
    if module_ids:
        rows = db.query(models.ModuleProgress.module_id).filter(
            models.ModuleProgress.user_id == user_id,
            models.ModuleProgress.module_id.in_(module_ids),
            models.ModuleProgress.completed == True,  # noqa: E712
        ).all()
        completed_ids = {r[0] for r in rows}

    modules = [
        schemas.ModuleSummary(
            id=m.id, order_index=m.order_index, title=m.title,
            subtopics=json.loads(m.subtopics_json or "[]"), is_generated=m.is_generated,
            is_completed=m.id in completed_ids,
        )
        for m in sorted(course.modules, key=lambda x: x.order_index)
    ]
    return schemas.CourseDetail(
        id=course.id, topic=course.topic, difficulty=course.difficulty, duration=course.duration,
        title=course.title, description=course.description, status=course.status,
        created_at=course.created_at, modules=modules,
    )


def _generate_module_content_and_quiz(db: Session, course: models.Course, module: models.Module):
    """Stages 5-8 combined: lesson content, examples, quiz, and assignment.

    Content and quiz no longer depend on each other's output (the quiz is
    now grounded in subtopics/objectives instead of generated content), so
    both LLM calls run concurrently — this roughly halves the wait for a
    module to load compared to calling them one after another.
    """
    subtopics = json.loads(module.subtopics_json or "[]")
    objectives = json.loads(module.objectives_json or "[]")

    try:
        sys1, user1 = prompts.module_content_prompt(course.title, course.difficulty, module.title,
                                                      subtopics, objectives)
        sys2, user2 = prompts.quiz_prompt(module.title, subtopics, objectives, course.difficulty)

        with ThreadPoolExecutor(max_workers=2) as executor:
            content_future = executor.submit(generate_json, sys1, user1)
            quiz_future = executor.submit(generate_json, sys2, user2)
            content_result = content_future.result()
            quiz_result = quiz_future.result()
    except LLMGenerationError as e:
        raise HTTPException(status_code=502, detail=f"Module generation failed: {e}")

    module.content_md = content_result.get("content_md", "")
    module.examples_json = json.dumps(content_result.get("examples", []))
    module.is_generated = True

    db.add(models.Assessment(module_id=module.id, type="quiz",
                              payload_json=json.dumps(quiz_result.get("quiz", []))))
    db.add(models.Assessment(module_id=module.id, type="assignment",
                              payload_json=json.dumps(quiz_result.get("assignment", {}))))
    db.commit()
    db.refresh(module)


def _mark_module_complete(db: Session, user_id: int, module_id: int):
    record = db.query(models.ModuleProgress).filter(
        models.ModuleProgress.user_id == user_id, models.ModuleProgress.module_id == module_id
    ).first()
    if not record:
        record = models.ModuleProgress(user_id=user_id, module_id=module_id)
        db.add(record)
    record.completed = True
    import datetime
    record.completed_at = datetime.datetime.utcnow()
