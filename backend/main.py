from fastapi import FastAPI
from pydantic import BaseModel
import openai
import os

app = FastAPI()

# Configure your OpenAI API key
# Make sure to set the OPENAI_API_KEY environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

class SymptomRequest(BaseModel):
    symptoms: str
    language: str

@app.post("/analyze")
async def analyze_symptoms(request: SymptomRequest):
    try:
        prompt = f"Analyze the following symptoms in {request.language} and provide a possible diagnosis and advice: {request.symptoms}"

        response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=200,
            temperature=0.7,
            n=1,
            stop=None,
        )

        analysis = response.choices[0].text.strip()
        return {"analysis": analysis}
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Swahili Health Symptom Checker API"}
