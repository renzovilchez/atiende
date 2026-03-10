ALTER TABLE appointments 
DROP CONSTRAINT appointments_tenant_id_doctor_id_patient_id_date_key;

CREATE UNIQUE INDEX idx_appointments_unique_active
ON appointments (tenant_id, doctor_id, patient_id, date)
WHERE status NOT IN ('cancelled', 'no_show');