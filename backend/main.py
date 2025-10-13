from fastapi import FastAPI
from pydantic import BaseModel
from groq import Groq
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS setup for Netlify frontend
origins = [
    "https://afyachecker.netlify.app",  # Replace with your actual Netlify URL
    "http://localhost:3000",  # For local testing
    "*"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Groq API client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class SymptomRequest(BaseModel):
    symptoms: str
    language: str

def sanitize_symptoms(symptoms: str) -> str:
    """Sanitize input for safety and clarity."""
    sensitive_terms = ["suicide", "self-harm", "severe bleeding", "graphic injury"]
    sanitized = symptoms.lower()
    for term in sensitive_terms:
        sanitized = sanitized.replace(term, "[REDACTED]")
    return sanitized

@app.post("/analyze")
async def analyze_symptoms(request: SymptomRequest):
    try:
        # Validate input
        if not request.symptoms.strip():
            return {
                "error": "Hitilafu: Maelezo ya dalili hayapo. Tafadhali weka dalili.",
                "details": "Symptoms field is empty or invalid.",
                "input_symptoms": request.symptoms
            }

        # Sanitize symptoms
        sanitized_symptoms = sanitize_symptoms(request.symptoms)

        # Construct prompt
        prompt = (
            f"You are AfyaChecker, a friendly and compassionate Health AI Assistant. "
            f"Analyze the following symptoms in {request.language}, suggest possible common conditions in Tanzania "
            f"(e.g., malaria, typhoid), and recommend visiting local clinics like Aga Khan Hospital or Muhimbili National Hospital. "
            f"Always include: 'This is not medical advice; consult a doctor.' "
            f"Symptoms: {sanitized_symptoms}"
        )

        # Generate response with Groq
        chat_completion = client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful health information assistant providing general, non-medical advice."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.7,
        )

        analysis = chat_completion.choices[0].message.content.strip()
        return {"analysis": analysis}

    except Exception as e:
        error_details = {
            "error": "Hitilafu imetokea. Tafadhali jaribu tena.",
            "details": str(e),
            "input_symptoms": request.symptoms,
            "sanitized_input": sanitize_symptoms(request.symptoms)
        }
        # Add specific Groq error context
        if "authentication" in str(e).lower():
            error_details["hint"] = "Invalid or missing GROQ_API_KEY. Check Render environment variables."
        elif "rate limit" in str(e).lower():
            error_details["hint"] = "Groq rate limit reached. Wait 1-2 minutes and retry."
        elif "connection" in str(e).lower():
            error_details["hint"] = "Network issue connecting to Groq. Check Render or Groq status."
        return error_details

@app.get("/")
async def root():
    return {"message": "Welcome to AfyaChecker API. Powered by Groq"}

@app.get("/health")
async def health():
    return {"status": "healthy"}