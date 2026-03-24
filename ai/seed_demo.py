#!/usr/bin/env python3
"""
Seed para desarrollo de IA - Genera datos realistas de UNA clínica
Ejecutar: python seed_demo.py
"""
import os
import random
import psycopg2
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://atiende:atiende_secret@localhost:5432/atiende_ai_dev")

CREATE_TABLES_SQL = """
DROP TABLE IF EXISTS queue_events CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS specialties CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE specialties (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    email VARCHAR(100),
    password_hash VARCHAR(255),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20),
    phone VARCHAR(20),
    active BOOLEAN DEFAULT true
);

CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    user_id INTEGER REFERENCES users(id),
    specialty_id INTEGER REFERENCES specialties(id),
    license_number VARCHAR(50),
    active BOOLEAN DEFAULT true
);

CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    doctor_id INTEGER REFERENCES doctors(id),
    day_of_week INTEGER,
    start_time TIME,
    end_time TIME,
    slot_duration INTEGER DEFAULT 30,
    active BOOLEAN DEFAULT true
);

CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    patient_id INTEGER REFERENCES users(id),
    doctor_id INTEGER REFERENCES doctors(id),
    schedule_id INTEGER REFERENCES schedules(id),
    date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id)
);

CREATE TABLE queue_events (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id),
    event_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER
);

CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_appointments_status ON appointments(status);
"""

SPECIALTIES = ["Medicina General", "Pediatría", "Ginecología", "Cardiología", "Dermatología"]

def get_connection():
    return psycopg2.connect(DATABASE_URL)

def init_database(conn):
    print("🔧 Creando estructura...")
    cur = conn.cursor()
    cur.execute(CREATE_TABLES_SQL)
    conn.commit()
    cur.close()
    print("✅ Estructura creada")

def seed_clinica_demo(conn):
    """Crea UNA clínica demo con datos realistas"""
    print("🏥 Creando clínica demo...")
    cur = conn.cursor()
    
    # 1. Tenant
    cur.execute("""
        INSERT INTO tenants (name, email, status)
        VALUES ('Clínica Demo Principal', 'demo@atiende.com', 'active')
        RETURNING id
    """)
    tenant_id = cur.fetchone()[0]
    
    # 2. Especialidades
    spec_ids = {}
    for spec in SPECIALTIES:
        cur.execute("""
            INSERT INTO specialties (tenant_id, name, description)
            VALUES (%s, %s, %s) RETURNING id
        """, (tenant_id, spec, f"Servicio de {spec}"))
        spec_ids[spec] = cur.fetchone()[0]
    
    # 3. Doctores (1 por especialidad)
    doctor_ids = {}
    for i, (spec_name, spec_id) in enumerate(spec_ids.items()):
        # Usuario
        cur.execute("""
            INSERT INTO users (tenant_id, email, first_name, last_name, role)
            VALUES (%s, %s, %s, %s, 'medico') RETURNING id
        """, (tenant_id, f"dr.{spec_name.lower().replace(' ', '.')}@clinica.com", 
              f"Dr. {spec_name}", "Apellido"))
        user_id = cur.fetchone()[0]
        
        # Doctor
        cur.execute("""
            INSERT INTO doctors (tenant_id, user_id, specialty_id, license_number)
            VALUES (%s, %s, %s, %s) RETURNING id
        """, (tenant_id, user_id, spec_id, f"LIC{10000+i}"))
        doctor_ids[spec_name] = cur.fetchone()[0]
        
        # Horarios: Lunes a Sábado, 8am-6pm
        for day in range(0, 6):  # 0=Lunes, 5=Sábado
            for hour in range(8, 18, 2):
                cur.execute("""
                    INSERT INTO schedules (tenant_id, doctor_id, day_of_week, start_time, end_time)
                    VALUES (%s, %s, %s, %s::time, (%s::time + interval '2 hours'))
                """, (tenant_id, doctor_ids[spec_name], day, f"{hour:02d}:00", f"{hour:02d}:00"))
    
    # 4. Pacientes
    patient_ids = []
    for i in range(50):
        cur.execute("""
            INSERT INTO users (tenant_id, email, first_name, last_name, role, phone)
            VALUES (%s, %s, %s, %s, 'paciente', %s) RETURNING id
        """, (tenant_id, f"paciente{i}@mail.com", f"Paciente{i}", "Apellido", 
              f"555-{random.randint(1000,9999)}"))
        patient_ids.append(cur.fetchone()[0])
    
    conn.commit()
    cur.close()
    
    return tenant_id, spec_ids, doctor_ids, patient_ids

def generate_appointments(conn, tenant_id, spec_ids, doctor_ids, patient_ids, days=120):
    """Genera citas con patrones REALISTAS para entrenar la IA"""
    print(f"📅 Generando {days} días de citas...")
    cur = conn.cursor()
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Patrones de demanda por especialidad
    demand_patterns = {
        "Medicina General": {"weight": 1.5, "peak_hours": [9, 10, 11, 16, 17]},
        "Pediatría": {"weight": 1.3, "peak_hours": [9, 10, 11]},  # Mañanas
        "Ginecología": {"weight": 1.0, "peak_hours": [10, 11, 15, 16]},
        "Cardiología": {"weight": 0.8, "peak_hours": [9, 10, 11]},
        "Dermatología": {"weight": 0.9, "peak_hours": [10, 11, 15, 16, 17]}
    }
    
    total = 0
    current = start_date
    
    while current <= end_date:
        weekday = current.weekday()  # 0=Lunes
        
        # Más citas Lunes-Martes, menos Viernes tarde, casi nada Domingo
        if weekday in [0, 1]:  # Lunes, Martes
            base_appointments = random.randint(12, 20)
        elif weekday == 4:  # Viernes
            base_appointments = random.randint(6, 12)
        elif weekday in [5, 6]:  # Fin de semana
            base_appointments = random.randint(2, 6)
        else:  # Miércoles, Jueves
            base_appointments = random.randint(8, 15)
        
        for _ in range(base_appointments):
            # Elegir especialidad ponderada
            spec = random.choices(
                list(spec_ids.keys()),
                weights=[demand_patterns[s]["weight"] for s in spec_ids.keys()]
            )[0]
            
            # Elegir hora con preferencia por peak hours
            if random.random() < 0.7:
                hour = random.choice(demand_patterns[spec]["peak_hours"])
            else:
                hour = random.randint(8, 17)
            
            doctor_id = doctor_ids[spec]
            patient_id = random.choice(patient_ids)
            
            appt_date = current.replace(hour=hour, minute=random.choice([0, 30]), second=0)
            
            # Estado: pasado = completado (80%), cancelado (15%), no_show (5%)
            if appt_date < end_date - timedelta(days=7):
                status = random.choices(
                    ['completed', 'cancelled', 'no_show'],
                    weights=[80, 15, 5]
                )[0]
            else:
                status = 'confirmed'
            
            created_at = appt_date - timedelta(days=random.randint(1, 10))
            
            cur.execute("""
                INSERT INTO appointments (tenant_id, patient_id, doctor_id, date, status, created_at, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (tenant_id, patient_id, doctor_id, appt_date, status, created_at, patient_id))
            
            appt_id = cur.fetchone()[0]
            total += 1
            
            if status == 'completed':
                cur.execute("""
                    INSERT INTO queue_events (appointment_id, event_type, created_at, created_by)
                    VALUES (%s, 'completed', %s, %s)
                """, (appt_id, appt_date + timedelta(minutes=random.randint(15, 40)), doctor_id))
        
        current += timedelta(days=1)
    
    conn.commit()
    cur.close()
    print(f"✅ {total} citas generadas")

def verify_data(conn, tenant_id):
    """Verifica que hay datos suficientes para entrenar"""
    print("\n📊 Verificación:")
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) FROM appointments WHERE tenant_id = %s AND status = 'completed'", (tenant_id,))
    completed = cur.fetchone()[0]
    
    cur.execute("""
        SELECT sp.name, COUNT(*) 
        FROM appointments a
        JOIN doctors d ON d.id = a.doctor_id
        JOIN specialties sp ON sp.id = d.specialty_id
        WHERE a.tenant_id = %s AND a.status = 'completed'
        GROUP BY sp.name
    """, (tenant_id,))
    
    print(f"Citas completadas: {completed}")
    print("Por especialidad:")
    for name, count in cur.fetchall():
        print(f"  - {name}: {count}")
    
    cur.close()

def main():
    print("🌱 SEED PARA IA - CLÍNICA DEMO\n")
    
    try:
        conn = get_connection()
        
        init_database(conn)
        tenant_id, spec_ids, doctor_ids, patient_ids = seed_clinica_demo(conn)
        generate_appointments(conn, tenant_id, spec_ids, doctor_ids, patient_ids, days=120)
        verify_data(conn, tenant_id)
        
        conn.close()
        
        print(f"\n{'='*50}")
        print("✅ LISTO - Tenant ID para probar:", tenant_id)
        print(f"{'='*50}")
        print("Endpoints a probar:")
        print(f"  GET /api/v1/predict?tenant_id={tenant_id}")
        print(f"  GET /api/v1/predict/heatmap?tenant_id={tenant_id}")
        print(f"  GET /api/v1/model/info?tenant_id={tenant_id}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()