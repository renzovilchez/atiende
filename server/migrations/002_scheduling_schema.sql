-- ─── ESPECIALIDADES ────────────────────────────────────────────────────────
CREATE TABLE specialties (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  description      TEXT,
  duration_minutes INT NOT NULL DEFAULT 30,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PISOS ─────────────────────────────────────────────────────────────────
CREATE TABLE floors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       VARCHAR(50) NOT NULL,
  number     INT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CONSULTORIOS ──────────────────────────────────────────────────────────
CREATE TABLE rooms (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  floor_id   UUID REFERENCES floors(id) ON DELETE SET NULL,
  name       VARCHAR(50) NOT NULL,
  number     VARCHAR(10),
  position_x FLOAT,
  position_y FLOAT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PERFILES DE MÉDICO ────────────────────────────────────────────────────
CREATE TABLE doctors (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialty_id   UUID REFERENCES specialties(id) ON DELETE SET NULL,
  license_number VARCHAR(50),
  bio            TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- ─── TURNOS SEMANALES ──────────────────────────────────────────────────────
CREATE TABLE schedules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  doctor_id    UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  room_id      UUID REFERENCES rooms(id) ON DELETE SET NULL,
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  max_patients INT NOT NULL DEFAULT 20,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- ─── EXCEPCIONES DE TURNO ──────────────────────────────────────────────────
CREATE TABLE schedule_overrides (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  schedule_id  UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  is_blocked   BOOLEAN NOT NULL DEFAULT false,
  room_id      UUID REFERENCES rooms(id) ON DELETE SET NULL,
  start_time   TIME,
  end_time     TIME,
  max_patients INT,
  reason       TEXT,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(schedule_id, date)
);

-- ─── CITAS ─────────────────────────────────────────────────────────────────
CREATE TYPE appointment_status AS ENUM (
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TABLE appointments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  doctor_id           UUID NOT NULL REFERENCES doctors(id),
  patient_id          UUID NOT NULL REFERENCES users(id),
  schedule_id         UUID REFERENCES schedules(id) ON DELETE SET NULL,
  room_id             UUID REFERENCES rooms(id) ON DELETE SET NULL,
  date                DATE NOT NULL,
  queue_position      INT NOT NULL,
  status              appointment_status NOT NULL DEFAULT 'scheduled',
  notes               TEXT,
  extra_service       TEXT,
  extra_authorized_by UUID REFERENCES users(id) ON DELETE SET NULL,
  extra_authorized_at TIMESTAMPTZ,
  created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, doctor_id, patient_id, date)
);

-- ─── HISTORIAL DE ESTADOS ──────────────────────────────────────────────────
CREATE TABLE queue_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  from_status    appointment_status,
  to_status      appointment_status NOT NULL,
  changed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  reason         TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ÍNDICES ───────────────────────────────────────────────────────────────
CREATE INDEX idx_specialties_tenant     ON specialties(tenant_id);
CREATE INDEX idx_floors_tenant          ON floors(tenant_id);
CREATE INDEX idx_rooms_tenant           ON rooms(tenant_id);
CREATE INDEX idx_rooms_floor            ON rooms(floor_id);
CREATE INDEX idx_doctors_tenant         ON doctors(tenant_id);
CREATE INDEX idx_doctors_user           ON doctors(user_id);
CREATE INDEX idx_doctors_specialty      ON doctors(specialty_id);
CREATE INDEX idx_schedules_doctor       ON schedules(doctor_id);
CREATE INDEX idx_schedules_tenant_day   ON schedules(tenant_id, day_of_week);
CREATE INDEX idx_overrides_schedule_date ON schedule_overrides(schedule_id, date);
CREATE INDEX idx_appointments_tenant_date ON appointments(tenant_id, date);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, date);
CREATE INDEX idx_appointments_patient   ON appointments(patient_id);
CREATE INDEX idx_appointments_status    ON appointments(tenant_id, status);
CREATE INDEX idx_queue_events_appointment ON queue_events(appointment_id);

-- ─── TRIGGERS updated_at ───────────────────────────────────────────────────
CREATE TRIGGER set_updated_at_specialties
  BEFORE UPDATE ON specialties FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_floors
  BEFORE UPDATE ON floors FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_rooms
  BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_doctors
  BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_schedules
  BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_schedule_overrides
  BEFORE UPDATE ON schedule_overrides FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_appointments
  BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();