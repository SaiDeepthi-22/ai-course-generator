from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth
from app.llm.client import generate_text, LLMGenerationError
from app.llm.prompts import tutor_system_prompt

router = APIRouter(prefix="/tutor", tags=["tutor"])

MAX_HISTORY_MESSAGES = 10  # keep the tutor context window small and cheap


@router.post("/chat", response_model=schemas.TutorChatResponse)
def chat(payload: schemas.TutorChatRequest, db: Session = Depends(get_db),
         user: models.User = Depends(auth.get_current_user)):
    course = db.query(models.Course).filter(
        models.Course.id == payload.course_id, models.Course.owner_id == user.id
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    module_context = None
    if payload.module_id:
        module = db.query(models.Module).filter(models.Module.id == payload.module_id).first()
        if module and module.content_md:
            module_context = f"{module.title}\n{module.content_md}"

    # pull recent chat history for continuity
    history_rows = db.query(models.TutorMessage).filter(
        models.TutorMessage.user_id == user.id, models.TutorMessage.course_id == course.id
    ).order_by(models.TutorMessage.created_at.desc()).limit(MAX_HISTORY_MESSAGES).all()
    history = [{"role": m.role, "content": m.content} for m in reversed(history_rows)]

    system = tutor_system_prompt(course.title, course.difficulty, module_context)
    try:
        reply = generate_text(system, payload.message, history=history)
    except LLMGenerationError as e:
        raise HTTPException(status_code=502, detail=f"Tutor is unavailable right now: {e}")

    db.add(models.TutorMessage(user_id=user.id, course_id=course.id, role="user", content=payload.message))
    db.add(models.TutorMessage(user_id=user.id, course_id=course.id, role="assistant", content=reply))
    db.commit()

    return schemas.TutorChatResponse(reply=reply)


@router.get("/history/{course_id}")
def get_history(course_id: int, db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    rows = db.query(models.TutorMessage).filter(
        models.TutorMessage.user_id == user.id, models.TutorMessage.course_id == course_id
    ).order_by(models.TutorMessage.created_at.asc()).all()
    return [{"role": r.role, "content": r.content} for r in rows]
