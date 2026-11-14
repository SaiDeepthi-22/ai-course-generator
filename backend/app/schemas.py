"""
Pydantic schemas — define the shape of every request body and response.
Keeping these separate from the ORM models lets the API contract stay
stable even if the DB schema changes internally.
"""
from typing import List, Optional, Any
from pydantic import BaseModel, EmailStr, Field
import datetime


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(default=None, min_length=6)


class ProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ---------- Courses ----------
class CourseCreateRequest(BaseModel):
    topic: str = Field(min_length=2, max_length=200)
    difficulty: str = Field(pattern="^(beginner|intermediate|advanced)$")
    duration: str = Field(min_length=2, max_length=50)   # e.g. "2 weeks", "5 hours"
    learning_goal: Optional[str] = Field(default=None, max_length=300)


class ModuleSummary(BaseModel):
    id: int
    order_index: int
    title: str
    subtopics: List[str] = []
    is_generated: bool
    is_completed: bool = False

    class Config:
        from_attributes = True


class CourseSummary(BaseModel):
    id: int
    topic: str
    difficulty: str
    duration: str
    title: Optional[str]
    description: Optional[str]
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class CourseDetail(CourseSummary):
    modules: List[ModuleSummary] = []


class ModuleContent(BaseModel):
    id: int
    title: str
    objectives: List[str]
    content_md: str
    examples: List[Any]
    is_generated: bool


# ---------- Quiz / Assignment ----------
class QuizSubmitRequest(BaseModel):
    assessment_id: int
    answers: dict  # {"q1": "b", "q2": "a", ...}


class QuizResult(BaseModel):
    score: float
    correct: int
    total: int
    feedback: List[dict]


# ---------- Tutor ----------
class TutorChatRequest(BaseModel):
    course_id: int
    module_id: Optional[int] = None
    message: str = Field(min_length=1, max_length=1000)


class TutorChatResponse(BaseModel):
    reply: str


# ---------- Progress ----------
class ProgressResponse(BaseModel):
    course_id: int
    total_modules: int
    completed_modules: int
    average_quiz_score: Optional[float]
    percent_complete: float
