from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
import os
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

class SymptomRequest(BaseModel):
    symptoms: str
    language: str

@app.post("/analyze")
async def analyze_symptoms(request: SymptomRequest):
    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-pro-exp-03-25",
            system_instruction=f"You are AfyaChecker, a friendly, funny, and compassionate Health AI Assistant. Analyze symptoms in {request.language}, provide possible diagnosis and Tanzania-specific advice (e.g., local diseases, clinics). Disclaimer: Not medical advice.",
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=200,
                temperature=0.7,
            )
        )
        response = model.generate_content(request.symptoms)
        analysis = response.text.strip()
        return {"analysis": analysis}
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
async def root():
    return {"message": "Welcome to AfyaChecker API. Powered by Gemini"}


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