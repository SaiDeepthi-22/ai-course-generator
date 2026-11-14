"""
Prompt templates — one function per pipeline stage. Kept as plain string
builders (not a templating engine) so they're easy to read and tweak.
Every prompt that must return structured data explicitly specifies the
JSON schema in the instructions, since that's what keeps `generate_json`
reliable.
"""


def syllabus_prompt(topic: str, difficulty: str, duration: str, learning_goal: str | None):
    system = (
        "You are an expert curriculum designer and instructional architect. "
        "You design complete, well-scoped course syllabi for any topic, calibrated "
        "precisely to the learner's stated difficulty level and available time."
    )
    goal_line = f"\nThe learner's specific goal: {learning_goal}" if learning_goal else ""
    user = f"""
Design a course syllabus for the topic: "{topic}"
Difficulty level: {difficulty}
Total learning duration available: {duration}{goal_line}

Return ONLY a JSON object with this exact structure:
{{
  "title": "a compelling, specific course title (not just the raw topic)",
  "description": "2-3 sentence description of what the learner will achieve",
  "modules": [
    {{
      "title": "module title",
      "objectives": ["learning objective 1", "learning objective 2"],
      "subtopics": ["subtopic 1", "subtopic 2", "subtopic 3"]
    }}
  ]
}}

Rules:
- Number of modules should fit the given duration (roughly 3-4 modules for short durations, up to 8-10 for longer ones).
- Modules must be in logical learning order, each building on the previous one.
- Subtopics must be specific and actionable, not vague.
- Calibrate depth and vocabulary strictly to the "{difficulty}" level.
"""
    return system, user


def module_content_prompt(course_title: str, difficulty: str, module_title: str,
                           subtopics: list, objectives: list):
    system = (
        "You are an expert technical instructor writing self-contained lesson "
        "content. Your explanations are clear, well-structured, and appropriate "
        "for the learner's stated level. Include code examples only when the "
        "topic is technical/programming-related."
    )
    user = f"""
Course: "{course_title}"
Difficulty: {difficulty}
Module: "{module_title}"
Subtopics to cover: {subtopics}
Learning objectives: {objectives}

Return ONLY a JSON object with this exact structure:
{{
  "content_md": "the full lesson explanation in markdown, covering every subtopic with headings, at least 400 words",
  "examples": [
    {{
      "type": "real_world",
      "title": "short title",
      "explanation": "a real-world example or analogy illustrating the concept"
    }},
    {{
      "type": "code",
      "title": "short title",
      "language": "python (or appropriate language, omit this example entirely if the topic is non-technical)",
      "code": "a short, runnable, well-commented code snippet",
      "explanation": "what the code demonstrates"
    }}
  ]
}}
Only include a "code" example if the topic is programming/technical in nature. Otherwise include two "real_world" examples instead.
"""
    return system, user


def quiz_prompt(module_title: str, subtopics: list, objectives: list, difficulty: str, num_questions: int = 5):
    system = (
        "You are an assessment designer who writes fair, unambiguous multiple-choice "
        "quiz questions that test real understanding, not trivia recall."
    )
    user = f"""
Module: "{module_title}"
Difficulty: {difficulty}
Subtopics covered: {subtopics}
Learning objectives: {objectives}

Generate {num_questions} multiple-choice quiz questions AND one short-answer assignment question
that test the subtopics and objectives above.

Return ONLY a JSON object with this exact structure:
{{
  "quiz": [
    {{
      "id": "q1",
      "question": "question text",
      "options": {{"a": "option A", "b": "option B", "c": "option C", "d": "option D"}},
      "correct_answer": "a",
      "explanation": "why this answer is correct"
    }}
  ],
  "assignment": {{
    "title": "assignment title",
    "instructions": "a practical task or open-ended question the learner completes to apply this module's concepts",
    "evaluation_criteria": ["criterion 1", "criterion 2"]
  }}
}}
"""
    return system, user


def tutor_system_prompt(course_title: str, difficulty: str, module_context: str | None):
    context_line = f"\nThe learner is currently on this module:\n{module_context[:1500]}" if module_context else ""
    return f"""
You are a friendly, patient AI tutor for the course "{course_title}" (difficulty: {difficulty}).
Answer the learner's questions clearly, using examples and analogies suited to their level.
Keep answers focused and not overly long unless the learner asks for depth.
If a question is unrelated to the course, gently redirect to the course topic.{context_line}
"""


def regeneration_prompt(module_title: str, weak_reason: str, difficulty: str):
    system = (
        "You are an expert instructor improving a lesson based on a learner's "
        "demonstrated weak areas. Rewrite the module to be clearer and add more "
        "scaffolding around the concepts the learner struggled with."
    )
    user = f"""
Module: "{module_title}"
Difficulty: {difficulty}
Learner struggled with: {weak_reason}

Return ONLY a JSON object with this exact structure (same shape as normal module content):
{{
  "content_md": "improved lesson explanation in markdown, with extra clarity and scaffolding around the weak areas, at least 400 words",
  "examples": [
    {{"type": "real_world", "title": "short title", "explanation": "..."}}
  ]
}}
"""
    return system, user
