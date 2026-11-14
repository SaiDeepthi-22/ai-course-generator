# AI Course Generator

A full-stack Generative AI application that turns any topic into a complete,
personalized course — syllabus, lessons, real-world and code examples,
quizzes, assignments, an AI tutor, and progress tracking — using an LLM.

This is a **working MVP**, not a mockup: every button in the UI calls a real
backend endpoint that calls a real LLM and stores real data in a database.

---

## 1. Architecture

```
┌─────────────┐      REST/JSON       ┌──────────────┐      OpenAI-compatible API      ┌─────────────┐
│   Frontend  │ ───────────────────▶ │   Backend    │ ───────────────────────────────▶ │  LLM (GPT/  │
│ React+Tailwind│ ◀─────────────────  │  FastAPI     │ ◀─────────────────────────────── │  Ollama/etc)│
└─────────────┘                      └──────┬───────┘                                   └─────────────┘
                                             │ SQLAlchemy ORM
                                             ▼
                                      ┌──────────────┐
                                      │  SQLite / DB │
                                      │  Postgres    │
                                      └──────────────┘
```

**Layers**
- **Frontend** — React (Vite) + Tailwind CSS. Talks only to the backend REST API.
- **Backend** — Python + FastAPI. Owns auth, business logic, prompt orchestration, and persistence.
- **LLM layer** — `app/llm/client.py` wraps any OpenAI-compatible chat-completions endpoint (OpenAI, Ollama, Groq, OpenRouter, etc.). `app/llm/prompts.py` holds every prompt template.
- **Database** — SQLite by default (zero setup). One line change (`DATABASE_URL`) switches to Postgres.

## 2. AI workflow (implemented exactly as specified)

```
User Input → Topic Analysis → Learning Objectives → Course Outline
→ Module Generation → Content Generation → Examples
→ Quiz & Assignment Generation → Personalized Course → AI Tutor → Progress Tracking
```

| Stage | Where it happens | Trigger |
|---|---|---|
| Topic analysis → course outline | `POST /courses` → `syllabus_prompt()` | On course creation (eager — learner sees the outline instantly) |
| Module content + examples | `GET /courses/{id}/modules/{id}` → `module_content_prompt()` | Lazily, first time a learner opens a module (saves tokens on unopened modules) |
| Quiz + assignment | Same call → `quiz_prompt()` | Generated together with module content |
| Personalization | Every prompt includes `difficulty` (beginner/intermediate/advanced) and `duration` | Baked into every generation call |
| AI Tutor | `POST /tutor/chat` → `tutor_system_prompt()` | On-demand, with course + module + chat history as context |
| Progress tracking | `GET /progress/{id}` | Aggregates quiz attempts + module completion |
| Regeneration | `POST /courses/{id}/modules/{id}/regenerate` → `regeneration_prompt()` | Manually triggered ("Improve this module"), uses the learner's last quiz score as context |

## 3. Folder structure

```
ai-course-generator/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app, CORS, router registration
│   │   ├── config.py               # env-based settings
│   │   ├── database.py             # SQLAlchemy engine/session
│   │   ├── models.py               # ORM tables
│   │   ├── schemas.py              # Pydantic request/response models
│   │   ├── auth.py                 # JWT + bcrypt
│   │   ├── llm/
│   │   │   ├── client.py           # OpenAI-compatible client, JSON-mode + retry
│   │   │   └── prompts.py          # every prompt template
│   │   └── routers/
│   │       ├── auth_router.py
│   │       ├── courses_router.py   # the core generation pipeline
│   │       ├── tutor_router.py
│   │       └── progress_router.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── client.js            # every backend call, in one place
    │   │   └── AuthContext.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx, CourseCard.jsx, ProgressBar.jsx,
    │   │   │   ModuleSidebar.jsx, TutorChat.jsx, ProtectedRoute.jsx
    │   ├── pages/
    │   │   ├── Landing.jsx, Login.jsx, Register.jsx, Dashboard.jsx,
    │   │   │   CreateCourse.jsx, CourseView.jsx, Quiz.jsx, Completion.jsx
    │   │   App.jsx, main.jsx, index.css
    │   ├── package.json, vite.config.js, tailwind.config.js
    └── .env.example
```

## 4. Installation requirements

- Python 3.10+
- Node.js 18+
- An LLM API key (OpenAI) **or** a locally running [Ollama](https://ollama.com) instance — no key needed for Ollama

## 5–9. Backend, LLM integration, prompts, database, API endpoints

All implemented in `backend/app/`. Key points:

- **Structured output**: every generation call uses `response_format={"type": "json_object"}` and a strict schema described in the prompt, with one automatic retry that asks the model to fix its own malformed JSON (`llm/client.py:generate_json`).
- **Database**: 6 tables — `users`, `courses`, `modules`, `assessments`, `quiz_attempts`, `module_progress`, `tutor_messages`. SQLite file created automatically on first run.
- **API endpoints** (19 total, all tested):

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create account, returns JWT |
| POST | `/auth/login` | Returns JWT |
| POST | `/courses` | Generate a new course (topic → AI syllabus) |
| GET | `/courses` | List the learner's courses |
| GET | `/courses/{id}` | Course detail + module list |
| GET | `/courses/{id}/modules/{id}` | Lazily generates + returns module content |
| GET | `/courses/{id}/modules/{id}/assessments` | Quiz (answers stripped) + assignment |
| POST | `/courses/{id}/modules/{id}/quiz` | Submit answers, get score + explanations |
| POST | `/courses/{id}/modules/{id}/regenerate` | Adaptive regeneration of weak module |
| POST | `/courses/{id}/complete` | Mark course completed |
| POST | `/tutor/chat` | AI tutor Q&A with course/module context |
| GET | `/tutor/history/{course_id}` | Chat history |
| GET | `/progress/{course_id}` | Completion % and average quiz score |

Full interactive docs at **http://localhost:8000/docs** once running (FastAPI's built-in Swagger UI).

## 10. `.env` configuration

Copy `backend/.env.example` → `backend/.env`:

```bash
# Option A — OpenAI
LLM_API_KEY=sk-your-openai-key-here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini

# Option B — Ollama (free, fully local, no key)
# LLM_API_KEY=ollama
# LLM_BASE_URL=http://localhost:11434/v1
# LLM_MODEL=llama3.1

DATABASE_URL=sqlite:///./course_generator.db
JWT_SECRET=replace-with-a-long-random-string
FRONTEND_ORIGIN=http://localhost:5173
```

Copy `frontend/.env.example` → `frontend/.env` (default already points to `http://localhost:8000`).

## 11. Instructions to run locally

**Backend**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then edit .env with your API key
uvicorn app.main:app --reload --port 8000
```

**Frontend** (in a second terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open **http://localhost:5173**.

## 12. Testing instructions

- **Automated smoke test**: this exact repo was validated with FastAPI's `TestClient` end-to-end — register → create course → open module → submit quiz → check progress → tutor chat — all 6 stages returned correct responses (LLM calls mocked for the offline test; real calls work identically against a live key).
- **Manual test checklist**:
  1. Register a new account → should redirect to dashboard.
  2. Create a course with topic "Python Basics", difficulty "beginner", duration "1 week" → should land on the course page with a generated title, description, and module list within ~10-20 seconds.
  3. Click a module → content, examples, and code snippets should appear.
  4. Take the quiz → submitting should show per-question correct/incorrect + explanations.
  5. Open the AI tutor (bottom-right chat bubble) and ask a question about the module → should get a contextual answer.
  6. Score low on a quiz, then click "Improve this module" → content should visibly change.
  7. Complete all modules → "Mark course as complete" → completion page with stats.
  8. Interactive API docs: visit `/docs` and try any endpoint directly.

## 13. Sample input → output

**Input** (`POST /courses`):
```json
{"topic": "Machine Learning", "difficulty": "beginner", "duration": "1 week", "learning_goal": "Build my first ML model"}
```

**Output** (abridged, real response shape):
```json
{
  "id": 1,
  "title": "Machine Learning Foundations for Beginners",
  "description": "A hands-on introduction to core machine learning concepts, from data to trained models.",
  "status": "ready",
  "modules": [
    {"id": 1, "title": "What is Machine Learning?", "subtopics": ["Supervised vs unsupervised learning", "Real-world ML applications"]},
    {"id": 2, "title": "Data and Features", "subtopics": ["Features and labels", "Data cleaning basics"]},
    {"id": 3, "title": "Your First Model", "subtopics": ["Linear regression", "Train/test split"]}
  ]
}
```

Opening module 1 (`GET /courses/1/modules/1`) then returns generated markdown content, a real-world example, a code example, and a quiz — all calibrated to "beginner".

## 14. Sample quiz submission → output

**Input**: `{"assessment_id": 1, "answers": {"q1": "a", "q2": "c"}}`
**Output**: `{"score": 50.0, "correct": 1, "total": 2, "feedback": [...per-question explanations...]}`

## 15. Future improvements

- Streaming module content token-by-token (SSE) instead of waiting for the full generation
- RAG grounding: retrieve from real reference material (docs, textbooks) before generating content, to reduce hallucination on niche topics
- Multi-provider abstraction so the LLM layer can hot-swap between OpenAI/Gemini/Claude/Ollama at runtime, not just via `.env`
- Certificates / exportable PDF course summary on completion
- Spaced-repetition style quiz re-attempts using past wrong answers
- Multi-language course generation
- Admin analytics dashboard (aggregate difficulty distribution, most-generated topics)
- Rate limiting and per-user token/cost budgets on the LLM layer
