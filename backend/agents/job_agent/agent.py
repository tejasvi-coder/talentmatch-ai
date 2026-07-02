from google.adk.agents import Agent


def find_matching_jobs(skills_and_role: str) -> dict:
    """Finds job openings that match the given skills or target role.

    Args:
        skills_and_role: A description of the candidate's skills, experience
            level, and/or target job role (e.g. "React, Node.js, 2 years
            experience, looking for frontend roles").

    Returns:
        A dictionary with a list of mock job postings relevant to the query.
        In a production system, this would call a real job search API
        (e.g. LinkedIn, Indeed, Google Jobs).
    """
    # Mock job database for demo purposes.
    sample_jobs = [
        {
            "title": "Frontend Developer",
            "company": "PixelCraft Technologies",
            "location": "Remote",
            "required_skills": ["React", "JavaScript", "CSS", "Git"],
            "experience": "1-3 years",
        },
        {
            "title": "Full Stack Engineer",
            "company": "NimbusWorks",
            "location": "Bangalore, India",
            "required_skills": ["React", "Node.js", "MongoDB", "REST APIs"],
            "experience": "2-4 years",
        },
        {
            "title": "Junior Software Engineer",
            "company": "Skyline Systems",
            "location": "Hybrid - Pune",
            "required_skills": ["JavaScript", "TypeScript", "Git", "Problem Solving"],
            "experience": "0-2 years",
        },
        {
            "title": "Product Manager - Growth",
            "company": "CommerceFlow",
            "location": "Remote",
            "required_skills": ["Product Strategy", "Agile", "Jira", "Stakeholder Management"],
            "experience": "2-5 years",
        },
        {
            "title": "Associate Product Manager",
            "company": "LaunchPad Labs",
            "location": "Mumbai, India",
            "required_skills": ["Roadmap Planning", "Scrum", "Wireframing"],
            "experience": "1-3 years",
        },
    ]

    return {"status": "success", "jobs": sample_jobs, "query": skills_and_role}


root_agent = Agent(
    name="job_agent",
    model="gemini-2.5-flash",
    description="Matches candidate skills and experience to relevant job openings.",
    instruction=(
        "You are the Opportunity Discovery Agent for TalentMatch AI. When the "
        "user describes their skills, role, or resume content, call the "
        "find_matching_jobs tool with a concise summary of their skills and "
        "target role. Then, from the returned jobs, present the TOP 3 best "
        "matches. For each match, give: 1) Job title and company, "
        "2) A match score out of 100 based on skill overlap, "
        "3) A one-line reason why it's a good fit. "
        "Be honest — if a job is a weak match, say so or exclude it."
    ),
    tools=[find_matching_jobs],
)