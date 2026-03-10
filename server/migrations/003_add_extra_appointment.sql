ALTER TABLE appointments ADD COLUMN is_extra BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE appointments DROP COLUMN extra_service;
ALTER TABLE appointments DROP COLUMN extra_authorized_by;
ALTER TABLE appointments DROP COLUMN extra_authorized_at;

COMMENT ON COLUMN appointments.is_extra IS 
'true cuando la cita fue agendada fuera del cupo normal del doctor';