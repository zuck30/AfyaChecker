from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from groq import Groq
import os
import time
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AfyaChecker API", version="2.0.0")

# CORS setup for Netlify frontend
origins = [
    "https://afyachecker.netlify.app",  
    "http://localhost:3000",
    "http://localhost:3001",
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
    language: str = "English"
    user_context: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    response_time: float
    model: str

# Emergency keywords for immediate referral
EMERGENCY_KEYWORDS = {
    'en': [
        'chest pain', 'heart attack', 'stroke', 'severe bleeding', 'unconscious',
        'difficulty breathing', 'suicide', 'self-harm', 'severe burn',
        'poisoning', 'seizure', 'paralysis', 'severe head injury'
    ],
    'sw': [
        'maumivu ya kifua', 'mshtuko wa moyo', 'kiharusi', 'kutokwa na damu nyingi',
        'kukosa fahamu', 'shida ya kupumua', 'kujiua', 'kujidhuru', 'choma kali',
        'sumu', 'dege', 'kupooza', 'jeraha kubwa la kichwa'
    ]
}

def detect_emergency(symptoms: str, language: str) -> bool:
    """Check if symptoms indicate emergency situation."""
    symptoms_lower = symptoms.lower()
    keywords = EMERGENCY_KEYWORDS.get('sw' if language == 'Swahili' else 'en', [])
    return any(keyword in symptoms_lower for keyword in keywords)

def sanitize_symptoms(symptoms: str) -> str:
    """Sanitize input for safety and clarity."""
    # Remove potentially harmful characters but keep medical descriptions
    import re
    cleaned = re.sub(r'[<>{}[\]]', '', symptoms)
    return cleaned.strip()

def get_system_prompt(language: str) -> str:
    """Get appropriate system prompt based on language."""
    if language == "Swahili":
        return """Wewe ni AfyaChecker, msaidizi wa afya wa kisasa na mwenye huruma na mcheshi. 
Toa ushauri wa awali tu wa afya kulingana na dalili. 
Wasilisha majibu yako kwa muundo wazi na rahisi kusoma:
1. Maelezo mafupi ya dalili
2. Uwezekano wa magonjwa ya kawaida
3. Mapendekezo ya hatua za kuchukua (kupumzika, kunywa maji, dawa za kawaida)
4. Dalili za kuhitaji matibabu ya haraka
5. Ombi la wazi la kumwona daktari

MUHIMU: 
- Toa ushauri wa jumla tu, usitoe utambuzi maalum
- Onyesha wazi kuwa huu si ushauri wa matibabu
- Rejea hospitali, vituo vya afya vya Tanzania 
- Kwa dharura, pendekeza kuita namba za dharura (112/911)"""
    else:
        return """You are AfyaChecker, a modern , funny and compassionate health assistant.
Provide only preliminary health guidance based on symptoms.
Structure your response in clear, easy-to-read format:
1. Brief symptom analysis
2. Possible common conditions in Tanzania
3. Recommended immediate actions (rest, hydration, OTC medications)
4. Red flags requiring urgent care
5. Clear recommendation to see a doctor

CRITICAL GUIDELINES:
- Provide general guidance only, no specific diagnoses
- Explicitly state this is not medical advice
- Reference Tanzanian healthcare facilities.
- For emergencies, recommend calling emergency services (112/911)"""

def get_user_prompt(symptoms: str, language: str, is_emergency: bool) -> str:
    """Construct optimized user prompt for faster, accurate responses."""
    base_symptoms = sanitize_symptoms(symptoms)
    
    if language == "Swahili":
        emergency_note = "**DHARURA:** Hii inaonekana kuwa hali ya dharura ya matibabu. " if is_emergency else ""
        
        return f"""{emergency_note}Chambua dalili zifuatazo na toa mwongozo wa awali:

Dalili: {base_symptoms}

Tafadhali toa:
- Uchambuzi mfupi wa dalili
- Magonjwa ya kawaida yanayowezekana Tanzania
- Shauri la hatua za kuchukua mara moja
- Ombi la wazi la kumtazama daktari

Jibu kwa Kiswahili kwa muundo wazi na rahisi kusoma."""
    else:
        emergency_note = "**EMERGENCY:** This appears to be a medical emergency. " if is_emergency else ""
        
        return f"""{emergency_note}Analyze these symptoms and provide preliminary guidance:

Symptoms: {base_symptoms}

Please provide:
- Brief symptom analysis
- Possible common conditions in Tanzania
- Recommended immediate actions
- Clear recommendation to consult a doctor

Respond in clear, easy-to-read format in {language}."""

@app.post("/analyze")
async def analyze_symptoms(request: SymptomRequest):
    start_time = time.time()
    
    try:
        # Validate input
        if not request.symptoms.strip():
            error_msg = "Hitilafu: Maelezo ya dalili hayapo." if request.language == "Swahili" else "Error: Symptoms description is empty."
            return {
                "error": error_msg,
                "details": "Please provide symptom description",
                "input_symptoms": request.symptoms
            }

        if len(request.symptoms.strip()) < 3:
            error_msg = "Hitilafu: Maelezo ya dalili ni mafupi sana." if request.language == "Swahili" else "Error: Symptom description is too short."
            return {
                "error": error_msg,
                "details": "Please provide more detailed symptoms",
                "input_symptoms": request.symptoms
            }

        # Check for emergency situations
        is_emergency = detect_emergency(request.symptoms, request.language)
        
        # Get optimized prompts
        system_prompt = get_system_prompt(request.language)
        user_prompt = get_user_prompt(request.symptoms, request.language, is_emergency)

        logger.info(f"Processing request - Language: {request.language}, Emergency: {is_emergency}, Length: {len(request.symptoms)}")

        # Generate response with Groq - optimized for speed
        chat_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Using fastest available model
            messages=[
                {
                    "role": "system", 
                    "content": system_prompt
                },
                {
                    "role": "user", 
                    "content": user_prompt
                }
            ],
            max_tokens=350,  # Balanced for completeness and speed
            temperature=0.5,  # Lower temperature for more consistent, accurate responses
            top_p=0.8,
            stream=False,
            timeout=30  # Add timeout for faster failure
        )

        analysis = chat_completion.choices[0].message.content.strip()
        
        # Add emergency warning if detected
        if is_emergency:
            if request.language == "Swahili":
                emergency_warning = "\n\n⚠️ **ONYO LA DHARURA:** Dalili hizi zinaonyesha hali ya dharura ya matibabu. Tafadhali tafuta usaidizi wa matibabu mara moja au piga 112/911."
            else:
                emergency_warning = "\n\n⚠️ **EMERGENCY WARNING:** These symptoms indicate a medical emergency. Please seek immediate medical attention or call 112/911."
            
            analysis = emergency_warning + "\n\n" + analysis

        response_time = time.time() - start_time
        logger.info(f"Request processed successfully in {response_time:.2f}s")

        return {
            "analysis": analysis,
            "is_emergency": is_emergency,
            "response_time": round(response_time, 2),
            "model": "llama-3.3-70b-versatile"
        }

    except Exception as e:
        response_time = time.time() - start_time
        logger.error(f"Error processing request: {str(e)}")
        
        # Language-specific error messages
        if request.language == "Swahili":
            base_error = "Hitilafu imetokea wakati wa kuchambua dalili."
            suggestions = [
                "Hakikisha umeeleza dalizi zako kwa uwazi",
                "Punguza urefu wa maelezo yako",
                "Jaribu tena baada ya sekunde chache"
            ]
        else:
            base_error = "An error occurred while analyzing symptoms."
            suggestions = [
                "Ensure your symptom description is clear",
                "Try shortening your description",
                "Try again in a few seconds"
            ]

        error_details = {
            "error": base_error,
            "details": str(e),
            "suggestions": suggestions,
            "response_time": round(response_time, 2)
        }

        # Add specific error context
        error_str = str(e).lower()
        if "authentication" in error_str:
            error_details["hint"] = "API configuration issue. Please contact support."
        elif "rate limit" in error_str:
            error_details["hint"] = "Service busy. Please wait a moment and try again."
        elif "connection" in error_str:
            error_details["hint"] = "Network issue. Please check your connection."
        elif "timeout" in error_str:
            error_details["hint"] = "Request timeout. Please try a shorter description."

        return error_details

@app.get("/")
async def root():
    return {
        "message": "Welcome to AfyaChecker API v2.0", 
        "status": "operational",
        "features": [
            "Multi-language support (English/Swahili)",
            "Emergency detection",
            "Fast AI-powered analysis",
            "Tanzania-specific health guidance"
        ]
    }

@app.get("/health")
async def health() -> HealthResponse:
    start_time = time.time()
    
    # Test basic functionality
    try:
        # Quick test query to verify API connectivity
        test_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "Say 'OK' if working."}],
            max_tokens=5,
            temperature=0.1
        )
        status = "healthy"
    except Exception as e:
        status = f"degraded: {str(e)}"
    
    response_time = time.time() - start_time
    
    return HealthResponse(
        status=status,
        response_time=round(response_time, 2),
        model="llama-3.3-70b-versatile"
    )

@app.get("/models")
async def available_models():
    """List available Groq models for potential optimization."""
    return {
        "recommended": "llama-3.3-70b-versatile",
        "alternatives": [
            "llama-3.1-8b-instant",
            "mixtral-8x7b-32768",
            "gemma2-9b-it"
        ],
        "criteria": "Speed, accuracy, and cost efficiency for medical guidance"
    }

# Error handlers
@app.exception_handler(500)
async def internal_server_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "details": "Please try again later"
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)