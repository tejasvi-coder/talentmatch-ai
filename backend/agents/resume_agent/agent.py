from google.adk.agents import Agent


def analyze_resume_text(resume_text: str) -> dict:
    """Analyzes the given resume text and returns structured feedback.

    Args:
        resume_text: The full text content of the user's resume.

    Returns:
        A dictionary containing the analysis status and the resume text
        that should be reviewed by the agent's reasoning.
    """
    return {
        "status": "success",
        "resume_text": resume_text,
        "note": "Resume text received. Analyze ATS score, missing keywords, and structure.",
    }


root_agent = Agent(
    name="resume_agent",
    model="gemini-2.5-flash",
    description="Analyzes resumes for ATS compatibility, structure, and improvement areas.",
    instruction=(
        "You are the Resume Intelligence Agent for TalentMatch AI. When the user "
        "pastes their resume text, call the analyze_resume_text tool with that text. "
        "Then, based on the resume content, provide: "
        "1) An estimated ATS compatibility score out of 100, "
        "2) 3-5 missing keywords or skills relevant to their likely target role, "
        "3) 2-3 concrete suggestions to improve the resume. "
        "Be specific and reference actual content from their resume, not generic advice."
    ),
    tools=[analyze_resume_text],
)