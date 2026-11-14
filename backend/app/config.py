"""
Central configuration for the backend.
All values are read from environment variables (loaded from a .env file
via python-dotenv). Nothing here is hardcoded so the same code can run
against OpenAI, an Ollama local server, or Postgres in production.
"""
import os
from dotenv import load_dotenv

load_dotenv(override=True)  # reads backend/.env — override=True ensures it always
                             # wins over any stray OS-level environment variable of
                             # the same name (a common source of "my .env change
                             # isn't taking effect" bugs on Windows)


class Settings:
    # --- LLM provider settings -------------------------------------------------
    # Mistral's API is OpenAI-compatible, so the same client code in llm/client.py
    # works unchanged — just point it at Mistral's endpoint and use a Mistral model.
    # Also works with OpenAI or Ollama by changing these same three values.
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.mistral.ai/v1")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "mistral-small-latest")

    # --- Database ----------------------------------------------------------
    # Defaults to local SQLite file so the project runs with zero setup.
    # Swap to Postgres by setting DATABASE_URL=postgresql://user:pass@host/db
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./course_generator.db")

    # --- Auth ----------------------------------------------------------------
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-this-secret-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))  # 24h

    # --- CORS ----------------------------------------------------------------
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")


settings = Settings()
