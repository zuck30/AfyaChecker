from fastapi import FastAPI
from pydantic import BaseModel
import openai
import os

app = FastAPI()

# Set OpenAI API key from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

class SymptomRequest(BaseModel):
    symptoms: str
    language: str

@app.post("/analyze")
async def analyze_symptoms(request: SymptomRequest):
    try:
        # Define the prompt as a system message for the chat model
        messages = [
            {
                "role": "system",
                "content": f"Your name is AfyaChecker or AfyaAI, a friendly, funny, and compassionate Health AI Assistant. Analyze the following symptoms in {request.language} and provide a possible diagnosis and advice, tailored to the context of Tanzania."
            },
            {
                "role": "user",
                "content": request.symptoms
            }
        ]

        # Use the Chat endpoint with a supported model
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=200,
            temperature=0.7,
            n=1
        )

        analysis = response.choices[0].message.content.strip()
        return {"analysis": analysis}
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
async def root():
    return {"message": "Welcome to AfyaChecker API"}