"""
Thin wrapper around the OpenAI SDK. Mistral's API is OpenAI-compatible, so the
same SDK works unchanged against:

  - Mistral (default)          (LLM_BASE_URL=https://api.mistral.ai/v1)
  - OpenAI directly            (LLM_BASE_URL=https://api.openai.com/v1)
  - Ollama running locally     (LLM_BASE_URL=http://localhost:11434/v1)
  - Any other OpenAI-compatible gateway (Groq, Together, OpenRouter, etc.)

To switch provider, only backend/.env changes — no code here changes.
"""
import json
import logging
from openai import OpenAI
from app.config import settings

logger = logging.getLogger("llm")

client = OpenAI(api_key=settings.LLM_API_KEY, base_url=settings.LLM_BASE_URL)


class LLMGenerationError(Exception):
    """Raised when the LLM call fails or returns unparsable output."""


def generate_json(system_prompt: str, user_prompt: str, max_retries: int = 2) -> dict:
    """
    Calls the LLM and forces a JSON object response. Retries once on a
    parse failure by re-asking the model to fix its own output — this is
    the single most effective trick for keeping structured-output pipelines
    reliable without a heavier framework.
    """
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    last_error = None
    for attempt in range(max_retries + 1):
        try:
            response = client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.7,
            )
            raw = response.choices[0].message.content
            return json.loads(raw)
        except json.JSONDecodeError as e:
            last_error = e
            logger.warning("JSON parse failed on attempt %s: %s", attempt, e)
            # Ask the model to correct itself instead of failing outright
            messages.append({"role": "assistant", "content": raw})
            messages.append({
                "role": "user",
                "content": "That was not valid JSON. Return ONLY a valid JSON object, no markdown fences, no commentary."
            })
        except Exception as e:
            last_error = e
            logger.error("LLM call failed on attempt %s: %s", attempt, e)

    raise LLMGenerationError(f"LLM generation failed after {max_retries + 1} attempts: {last_error}")


def generate_text(system_prompt: str, user_prompt: str, history: list = None) -> str:
    """Plain text generation — used for the AI tutor chat, which is conversational."""
    messages = [{"role": "system", "content": system_prompt}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": user_prompt})

    try:
        response = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=messages,
            temperature=0.6,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error("LLM text generation failed: %s", e)
        raise LLMGenerationError(str(e))
