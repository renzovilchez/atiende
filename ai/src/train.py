import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from apscheduler.schedulers.background import BackgroundScheduler
from src.database import get_appointments_df

MODELS_DIR = "models"
os.makedirs(MODELS_DIR, exist_ok=True)

def get_paths(tenant_id: str):
    """Retorna paths específicos para un tenant"""
    return {
        "model": os.path.join(MODELS_DIR, f"model_{tenant_id}.pkl"),
        "encoder": os.path.join(MODELS_DIR, f"encoder_{tenant_id}.pkl"),
        "meta": os.path.join(MODELS_DIR, f"meta_{tenant_id}.pkl")
    }

def train(tenant_id: str):
    """
    Entrena un modelo específico para un tenant.
    Cada clínica tiene su propia IA privada.
    """
    paths = get_paths(tenant_id)
    print(f"[AI][Tenant {tenant_id}] Entrenando modelo...")
    
    try:
        # 1. Obtener datos SOLO de este tenant
        df = get_appointments_df(tenant_id=tenant_id, days=90)
        
        if len(df) < 20:
            print(f"[AI][Tenant {tenant_id}] Datos insuficientes: {len(df)} citas")
            return False
        
        print(f"[AI][Tenant {tenant_id}] {len(df)} citas encontradas")
        
        # 2. Preparar features
        le = LabelEncoder()
        df["specialty_enc"] = le.fit_transform(df["specialty"])
        
        # Agrupar por slot (día, hora, especialidad) → target = cantidad de citas
        features = ["day_of_week", "hour_of_day", "specialty_enc", "month"]
        grouped = df.groupby(features).size().reset_index(name="demand")
        
        X = grouped[features]
        y = grouped["demand"]
        
        print(f"[AI][Tenant {tenant_id}] {len(grouped)} slots únicos para entrenar")
        
        # 3. Entrenar modelo
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=2,
            random_state=42
        )
        model.fit(X, y)
        
        # 4. Guardar todo
        joblib.dump(model, paths["model"])
        joblib.dump(le, paths["encoder"])
        
        # Metadata útil
        meta = {
            "tenant_id": tenant_id,
            "n_samples": len(grouped),
            "specialties": list(le.classes_),
            "avg_demand": float(y.mean()),
            "max_demand": int(y.max()),
            "trained_at": pd.Timestamp.now().isoformat()
        }
        joblib.dump(meta, paths["meta"])
        
        print(f"[AI][Tenant {tenant_id}] ✅ Modelo guardado")
        return True
        
    except Exception as e:
        print(f"[AI][Tenant {tenant_id}] ❌ Error: {e}")
        return False

def predict_demand(tenant_id: str, date_str: str, specialty: str, hour: int):
    """
    Predice demanda para un slot específico.
    """
    paths = get_paths(tenant_id)
    
    if not os.path.exists(paths["model"]):
        raise Exception(f"Modelo no entrenado para tenant {tenant_id}")
    
    model = joblib.load(paths["model"])
    le = joblib.load(paths["encoder"])
    meta = joblib.load(paths["meta"])
    
    # Parsear fecha
    from datetime import datetime
    dt = datetime.fromisoformat(date_str)
    
    # Encode specialty
    if specialty in le.classes_:
        spec_enc = le.transform([specialty])[0]
    else:
        spec_enc = 0  # fallback
    
    X = [[dt.weekday(), hour, spec_enc, dt.month]]
    demand = model.predict(X)[0]
    
    return {
        "demand": round(max(0, demand), 1),
        "confidence": "high" if meta["n_samples"] > 50 else "medium",
        "model_samples": meta["n_samples"]
    }

def start_scheduler():
    """Inicia scheduler que reentrena todos los tenants"""
    def train_all():
        # Aquí deberías obtener la lista de tenants de la BD
        # Por ahora, entrenamos el tenant demo (ID=1)
        train("1")
    
    # Entrenar al inicio
    train_all()
    
    # Reentrenar a las 2am
    scheduler = BackgroundScheduler()
    scheduler.add_job(train_all, "cron", hour=2, minute=0)
    scheduler.start()
    print("[AI] Scheduler activo - Reentrenamiento diario 2:00 AM")