# src/predict.py
from fastapi import APIRouter, HTTPException, Query
from datetime import date, timedelta
from typing import Optional
import joblib
import os
import time
import numpy as np

router = APIRouter(prefix="/api/v1")

MODELS_DIR = "models"

# CACHE GLOBAL - Cargar una sola vez
_model_cache = {}
_encoder_cache = {}
_meta_cache = {}

def get_paths(tenant_id: str):
    """Retorna paths de archivos del modelo"""
    return {
        "model": os.path.join(MODELS_DIR, f"model_{tenant_id}.pkl"),
        "encoder": os.path.join(MODELS_DIR, f"encoder_{tenant_id}.pkl"),
        "meta": os.path.join(MODELS_DIR, f"meta_{tenant_id}.pkl")
    }

def load_model_cached(tenant_id: str):
    """
    Carga modelo con cache en memoria.
    La primera vez tarda ~1s, las siguientes ~0.001s
    """
    if tenant_id not in _model_cache:
        start = time.time()
        paths = get_paths(tenant_id)
        
        if not os.path.exists(paths["model"]):
            return None, None, None
            
        _model_cache[tenant_id] = joblib.load(paths["model"])
        _encoder_cache[tenant_id] = joblib.load(paths["encoder"])
        _meta_cache[tenant_id] = joblib.load(paths["meta"])
        print(f"[AI] Modelo {tenant_id} cargado en {time.time()-start:.2f}s")
    
    return _model_cache[tenant_id], _encoder_cache[tenant_id], _meta_cache[tenant_id]

def predict_single(model, le, date_obj, hour, specialty):
    """
    Predice demanda para un slot específico.
    """
    if specialty in le.classes_:
        spec_enc = le.transform([specialty])[0]
    else:
        spec_enc = 0
    
    X = np.array([[date_obj.weekday(), hour, spec_enc, date_obj.month]])
    demand = float(model.predict(X)[0])
    
    return max(0, demand)

@router.get("/predict")
def get_prediction(
    tenant_id: str = Query(..., description="ID del tenant (clínica)"),
    target_date: Optional[str] = None,
    specialty: str = "Medicina General"
):
    """
    Predice demanda horaria para una fecha y especialidad.
    Usa cache de modelo para respuesta en <100ms después de primera carga.
    """
    total_start = time.time()
    
    # Cargar modelo (desde cache después de primera vez)
    model, le, meta = load_model_cached(tenant_id)
    if not model:
        raise HTTPException(
            status_code=503,
            detail=f"Modelo no entrenado para tenant {tenant_id}"
        )
    
    # Preparar fechas
    if target_date:
        dates = [date.fromisoformat(target_date)]
    else:
        dates = [date.today() + timedelta(days=i) for i in range(7)]
    
    # Predicciones
    results = []
    for d in dates:
        hourly = []
        
        for hour in range(8, 19):
            demand = predict_single(model, le, d, hour, specialty)
            hourly.append({
                "hour": hour,
                "demand": round(demand, 1),
                "formatted_time": f"{hour:02d}:00"
            })
        
        peak = max(hourly, key=lambda x: x["demand"])
        total_demand = sum(h["demand"] for h in hourly)
        
        results.append({
            "date": d.isoformat(),
            "day_name": ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][d.weekday()],
            "specialty": specialty,
            "hourly": hourly,
            "peak_hour": peak["hour"],
            "peak_demand": peak["demand"],
            "total_expected": round(total_demand, 1),
            "risk_level": "alto" if peak["demand"] > 5 else "medio" if peak["demand"] > 2 else "bajo"
        })
    
    total_time = time.time() - total_start
    print(f"[AI] Predicción total: {total_time:.3f}s")
    
    return {
        "tenant_id": tenant_id,
        "predictions": results,
        "response_time_ms": round(total_time * 1000, 2),
        "cached": tenant_id in _model_cache,
        "privacy_note": "Predicción basada únicamente en datos históricos de esta clínica"
    }

@router.post("/train/{tenant_id}")
def force_train(tenant_id: str):
    """Fuerza el entrenamiento y limpia cache"""
    from src.train import train
    
    # Limpiar cache si existe
    if tenant_id in _model_cache:
        del _model_cache[tenant_id]
        del _encoder_cache[tenant_id]
        del _meta_cache[tenant_id]
    
    success = train(tenant_id)
    if success:
        load_model_cached(tenant_id)
        return {"status": "trained", "tenant_id": tenant_id, "cached": True}
    
    raise HTTPException(status_code=400, detail="Entrenamiento fallido")

@router.get("/model/info")
def model_info(tenant_id: str = Query(...)):
    """Info del modelo"""
    _, _, meta = load_model_cached(tenant_id)
    
    if not meta:
        paths = get_paths(tenant_id)
        if not os.path.exists(paths["meta"]):
            raise HTTPException(status_code=404, detail="Modelo no encontrado")
        meta = joblib.load(paths["meta"])
    
    return {
        "tenant_id": tenant_id,
        "trained_at": meta.get("trained_at"),
        "samples": meta.get("n_samples"),
        "specialties": meta.get("specialties"),
        "cached": tenant_id in _model_cache,
        "privacy": "Datos aislados de otros tenants"
    }

@router.get("/debug/speed")
def debug_speed(tenant_id: str = "1"):
    """Diagnóstico de velocidad"""
    t0 = time.time()
    model, le, _ = load_model_cached(tenant_id)
    t1 = time.time()
    
    if model:
        t2 = time.time()
        for _ in range(100):
            X = np.array([[0, 10, 0, 3]])
            _ = model.predict(X)
        t3 = time.time()
    
    return {
        "load_model_ms": round((t1-t0)*1000, 2),
        "100_predictions_ms": round((t3-t2)*1000, 2) if model else None,
        "model_cached": tenant_id in _model_cache,
        "model_size_mb": round(os.path.getsize(get_paths(tenant_id)["model"]) / (1024*1024), 2) if model else 0
    }