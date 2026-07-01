from google.adk.agents import Agent

root_agent = Agent(
    name="hello_agent",
    model="gemini-2.5-flash",
    description="A simple test agent to verify ADK + Gemini setup.",
    instruction="You are a friendly assistant. Greet the user warmly and confirm that the TalentMatch AI system is ready to build.",
)