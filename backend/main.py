from fastapi import FastAPI
from pydantic import BaseModel
from groq import Groq
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS setup for Netlify frontend
origins = [
    "https://afyachecker.netlify.app/", 
    "http://localhost:3000",  
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
            model="llama-3.1-70b-versatile",  # Free, strong model
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
        return {
            "error": str(e),
            "details": "An unexpected error occurred. Check API key or input.",
            "input_symptoms": request.symptoms
        }

@app.get("/")
async def root():
    return {"message": "Welcome to AfyaChecker API. Powered by Groq"}

@app.get("/health")
async def health():
    return {"status": "healthy"}


# from fastapi import FastAPI
# from pydantic import BaseModel
# import openai
# import os
# from fastapi.middleware.cors import CORSMiddleware

# app = FastAPI()

# origins = ["*"]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Set OpenAI API key from environment variable
# openai.api_key = os.getenv("OPENAI_API_KEY")

# class SymptomRequest(BaseModel):
#     symptoms: str
#     language: str

# @app.post("/analyze")
# async def analyze_symptoms(request: SymptomRequest):
#     try:
#         # Define the prompt as a system message for the chat model
#         messages = [
#             {
#                 "role": "system",
#                 "content": f"Your name is AfyaChecker or AfyaAI, a friendly, funny, and compassionate Health AI Assistant. Analyze the following symptoms in {request.language} and provide a possible diagnosis and advice, tailored to the context of Tanzania."
#             },
#             {
#                 "role": "user",
#                 "content": request.symptoms
#             }
#         ]

#         # Use the Chat endpoint with a supported model
#         response = openai.ChatCompletion.create(
#             model="gpt-3.5-turbo",
#             messages=messages,
#             max_tokens=200,
#             temperature=0.7,
#             n=1
#         )

#         analysis = response.choices[0].message.content.strip()
#         return {"analysis": analysis}
#     except Exception as e:
#         return {"error": str(e)}

# @app.get("/")
# async def root():
#     return {"message": "Welcome to AfyaChecker API"}