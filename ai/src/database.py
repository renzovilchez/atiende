# src/database.py
import os
import psycopg2
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    return psycopg2.connect(DATABASE_URL)

def get_appointments_df(tenant_id: str = None, days: int = 90):
    """
    Obtiene citas de los últimos N días para entrenamiento.
    """
    conn = None
    try:
        conn = get_connection()
        
        tenant_filter = ""
        params = [days]
        
        if tenant_id:
            tenant_filter = "AND a.tenant_id = %s"
            params.append(tenant_id)
        
        query = f"""
            SELECT
                a.id,
                a.date::date as appointment_date,
                a.status,
                a.tenant_id,
                EXTRACT(DOW FROM a.date::date) AS day_of_week,
                EXTRACT(MONTH FROM a.date::date) AS month,
                s.start_time,
                COALESCE(EXTRACT(HOUR FROM s.start_time::time), 9) AS hour_of_day,
                COALESCE(sp.name, 'Medicina General') AS specialty
            FROM appointments a
            LEFT JOIN schedules s ON s.id = a.schedule_id
            LEFT JOIN doctors d ON d.id = a.doctor_id
            LEFT JOIN specialties sp ON sp.id = d.specialty_id
            WHERE a.status NOT IN ('cancelled', 'no_show')
            AND a.date >= CURRENT_DATE - INTERVAL '%s days'
            {tenant_filter}
            ORDER BY a.date DESC
        """
        
        df = pd.read_sql(query, conn, params=params)
        
        # Limpieza de datos
        df['hour_of_day'] = df['hour_of_day'].fillna(9).astype(int)
        df['day_of_week'] = df['day_of_week'].fillna(0).astype(int)
        df['month'] = df['month'].fillna(1).astype(int)
        df['specialty'] = df['specialty'].fillna('Medicina General')
        
        return df
        
    except Exception as e:
        print(f"[DB] Error: {e}")
        return pd.DataFrame(columns=['id', 'appointment_date', 'status', 'tenant_id', 
                                   'day_of_week', 'month', 'start_time', 'hour_of_day', 'specialty'])
    finally:
        if conn:
            conn.close()

def get_tenants():
    """Obtiene lista de tenants activos"""
    conn = None
    try:
        conn = get_connection()
        query = "SELECT id, name FROM tenants WHERE status = 'active'"
        df = pd.read_sql(query, conn)
        return df
    except Exception as e:
        print(f"[DB] Error: {e}")
        return pd.DataFrame(columns=['id', 'name'])
    finally:
        if conn:
            conn.close()