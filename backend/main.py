from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS setup
origins = ["*"]
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

@app.post("/analyze")
async def analyze_symptoms(request: SymptomRequest):
    try:
        # Initialize model with safety settings relaxed for medical content
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",  # Use stable gemini-1.5-flash
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=200,
                temperature=0.7,
            ),
            safety_settings={
                genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
                genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: genai.types.HarmBlockThreshold.BLOCK_NONE,
                genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: genai.types.HarmBlockThreshold.BLOCK_NONE,
                genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: genai.types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,  # Allow medical content
            }
        )

        # Construct prompt dynamically
        prompt = (
            f"You are AfyaChecker, a friendly, funny, and compassionate Health AI Assistant. "
            f"Analyze the following symptoms in {request.language}, provide a possible diagnosis, "
            f"and Tanzania-specific advice (e.g., local diseases like malaria, clinics like Aga Khan Hospital). "
            f"Disclaimer: This is not medical advice; consult a doctor. Symptoms: {request.symptoms}"
        )

        # Generate response
        response = model.generate_content(prompt)

        # Check for safety block
        if response.candidates and response.candidates[0].finish_reason == genai.types.FinishReason.SAFETY:
            return {
                "error": "Response blocked due to safety filters. Please rephrase symptoms or try again.",
                "details": response.candidates[0].safety_ratings
            }

        # Extract text safely
        if not response.text:
            return {"error": "No valid response content returned. Try different symptoms."}
        
        analysis = response.text.strip()
        return {"analysis": analysis}

    except Exception as e:
        return {"error": str(e), "details": "An unexpected error occurred. Check API key or input."}

@app.get("/")
async def root():
    return {"message": "Welcome to AfyaChecker API. Powered by Gemini"}

# Optional: List available models for debugging
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