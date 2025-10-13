from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
origins = [
    "https://afyaai.netlify.app",  
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

# Configure Google API key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

class SymptomRequest(BaseModel):
    symptoms: str
    language: str

def sanitize_symptoms(symptoms: str) -> str:
    """Sanitize input to reduce safety filter triggers."""
    sensitive_terms = ["suicide", "self-harm", "severe bleeding", "graphic injury"] 
    sanitized = symptoms.lower()
    for term in sensitive_terms:
        sanitized = sanitized.replace(term, "[REDACTED]")
    return sanitized

@app.post("/analyze")
async def analyze_symptoms(request: SymptomRequest):
    try:
        # Initialize model with safety settings for medical content
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=200,
                temperature=0.7,
            ),
            safety_settings={
                genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
                genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: genai.types.HarmBlockThreshold.BLOCK_NONE,
                genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: genai.types.HarmBlockThreshold.BLOCK_NONE,
                genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: genai.types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,  # More permissive for medical
            }
        )

        # Sanitize symptoms to avoid safety triggers
        sanitized_symptoms = sanitize_symptoms(request.symptoms)

        # Construct prompt with explicit medical context
        prompt = (
            f"You are AfyaChecker, a friendly and compassionate Health AI Assistant. "
            f"Your role is to provide general, non-binding health information in {request.language}. "
            f"Analyze the following symptoms, suggest possible common conditions in Tanzania (e.g., malaria, typhoid), "
            f"and recommend seeking care at local clinics like Aga Khan Hospital or Muhimbili National Hospital. "
            f"Always include: 'This is not medical advice; consult a doctor.' "
            f"Symptoms: {sanitized_symptoms}"
        )

        # Generate response
        response = model.generate_content(prompt)

        # Check for safety block
        if hasattr(response, 'prompt_feedback') and response.prompt_feedback and response.prompt_feedback.block_reason is not None:
            return {
                "error": "Response blocked due to safety filters. Try rephrasing symptoms.",
                "details": {
                    "block_reason": str(response.prompt_feedback.block_reason),
                    "safety_ratings": [
                        {"category": str(r.category), "probability": str(r.probability)}
                        for r in response.prompt_feedback.safety_ratings
                    ] if hasattr(response.prompt_feedback, 'safety_ratings') else []
                },
                "input_symptoms": request.symptoms
            }

        # Extract text safely
        if not hasattr(response, 'text') or not response.text:
            return {
                "error": "No valid response content returned.",
                "details": "Response may have been blocked or empty.",
                "input_symptoms": request.symptoms
            }

        analysis = response.text.strip()
        return {"analysis": analysis}

    except Exception as e:
        return {
            "error": str(e),
            "details": "An unexpected error occurred. Check API key or input.",
            "input_symptoms": request.symptoms
        }

@app.get("/")
async def root():
    return {"message": "Welcome to AfyaChecker API. Powered by Gemini"}

@app.get("/models")
async def list_models():
    try:
        models = genai.list_models()
        return {"available_models": [m.name for m in models if 'generateContent' in m.supported_generation_methods]}
    except Exception as e:
        return {"error": str(e)}


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