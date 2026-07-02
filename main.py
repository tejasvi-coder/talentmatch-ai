import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from google.adk.runners import InMemoryRunner
from google.genai import types

from agents.resume_agent.agent import root_agent as resume_agent
from agents.job_agent.agent import root_agent as job_agent

app = FastAPI(title="TalentMatch AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResumeRequest(BaseModel):
    resume_text: str


class JobMatchRequest(BaseModel):
    skills_and_role: str


async def run_agent(agent, user_text: str) -> str:
    runner = InMemoryRunner(agent=agent, app_name="talentmatch-ai")

    session = await runner.session_service.create_session(
        app_name="talentmatch-ai", user_id="api_user"
    )

    user_message = types.Content(role="user", parts=[types.Part(text=user_text)])

    final_response = ""
    async for event in runner.run_async(
        user_id="api_user",
        session_id=session.id,
        new_message=user_message,
    ):
        if event.is_final_response() and event.content and event.content.parts:
            final_response = event.content.parts[0].text

    return final_response


@app.get("/")
def health_check():
    return {"status": "ok", "service": "TalentMatch AI Backend"}


@app.post("/api/resume/analyze")
async def analyze_resume(payload: ResumeRequest):
    result = await run_agent(resume_agent, payload.resume_text)
    return {"analysis": result}


@app.post("/api/jobs/match")
async def match_jobs(payload: JobMatchRequest):
    result = await run_agent(job_agent, payload.skills_and_role)
    return {"matches": result}