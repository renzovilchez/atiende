from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.predict import router as predict_router
from src.train import start_scheduler
import os

app = FastAPI(
    title="ATIENDE AI Service",
    description="Microservicio de predicción de demanda para citas médicas",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(predict_router)

@app.on_event("startup")
async def startup_event():
    """Evento de inicio - inicializa scheduler y precarga modelos"""
    print("🚀 ATIENDE AI Service iniciando...")
    
    # Iniciar scheduler de reentrenamiento
    start_scheduler()
    
    # Precargar modelo del tenant 1 en cache (para respuestas rápidas)
    try:
        from src.predict import load_model_cached
        model, le, meta = load_model_cached("1")
        if model:
            print(f"🔥 Modelo tenant 1 precargado: {meta.get('n_samples', 0)} samples")
        else:
            print("⚠️ Modelo tenant 1 no encontrado, se entrenará en primera request")
    except Exception as e:
        print(f"⚠️ Error precargando modelo: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Evento de cierre"""
    print("👋 ATIENDE AI Service deteniéndose...")

@app.get("/")
def root():
    return {
        "service": "ATIENDE AI",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "health": "/health",
            "predict": "/api/v1/predict",
            "train": "/api/v1/train/{tenant_id}",
            "model_info": "/api/v1/model/info",
            "debug_speed": "/api/v1/debug/speed"
        }
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "atiende-ai",
        "timestamp": os.popen('date').read().strip() if os.name != 'nt' else "N/A"
    }