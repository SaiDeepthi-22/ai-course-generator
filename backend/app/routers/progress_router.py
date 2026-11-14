from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/{course_id}", response_model=schemas.ProgressResponse)
def get_progress(course_id: int, db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    course = db.query(models.Course).filter(
        models.Course.id == course_id, models.Course.owner_id == user.id
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    module_ids = [m.id for m in course.modules]
    total_modules = len(module_ids)

    completed_modules = db.query(models.ModuleProgress).filter(
        models.ModuleProgress.user_id == user.id,
        models.ModuleProgress.module_id.in_(module_ids),
        models.ModuleProgress.completed == True,  # noqa: E712
    ).count() if module_ids else 0

    avg_score = db.query(func.avg(models.QuizAttempt.score)).filter(
        models.QuizAttempt.user_id == user.id,
        models.QuizAttempt.module_id.in_(module_ids),
    ).scalar() if module_ids else None

    percent = round((completed_modules / total_modules) * 100, 1) if total_modules else 0.0

    return schemas.ProgressResponse(
        course_id=course_id,
        total_modules=total_modules,
        completed_modules=completed_modules,
        average_quiz_score=round(avg_score, 1) if avg_score is not None else None,
        percent_complete=percent,
    )
