import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from google.adk.runners import InMemoryRunner
from google.genai import types

from agents.resume_agent.agent import root_agent as resume_agent

app = FastAPI(title="TalentMatch AI API")

# Allow Next.js frontend (running on localhost:3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResumeRequest(BaseModel):
    resume_text: str


@app.get("/")
def health_check():
    return {"status": "ok", "service": "TalentMatch AI Backend"}


@app.post("/api/resume/analyze")
async def analyze_resume(payload: ResumeRequest):
    runner = InMemoryRunner(agent=resume_agent, app_name="talentmatch-ai")

    session = await runner.session_service.create_session(
        app_name="talentmatch-ai", user_id="api_user"
    )

    user_message = types.Content(
        role="user", parts=[types.Part(text=payload.resume_text)]
    )

    final_response = ""
    async for event in runner.run_async(
        user_id="api_user",
        session_id=session.id,
        new_message=user_message,
    ):
        if event.is_final_response() and event.content and event.content.parts:
            final_response = event.content.parts[0].text

    return {"analysis": final_response}