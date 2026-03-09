-- ============================================================
-- ATIENDE — Migración 001: Schema base multitenant
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TENANTS (clínicas registradas en la plataforma)
-- ============================================================
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,  -- ej: "clinica-san-marcos"
  ruc         VARCHAR(20),
  phone       VARCHAR(30),
  address     TEXT,
  city        VARCHAR(100),
  logo_url    TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  plan        VARCHAR(50) DEFAULT 'basic',   -- basic, pro, enterprise
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROLES
-- ============================================================
CREATE TYPE user_role AS ENUM (
  'super_admin',    -- Administra toda la plataforma
  'admin',          -- Administra su clínica
  'receptionist',   -- Gestiona el flujo diario
  'doctor',         -- Ve su agenda y lista de espera
  'patient'         -- Agenda y consulta sus citas
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role          user_role NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  phone         VARCHAR(30),
  dni           VARCHAR(20),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  -- Super admin no tiene tenant_id
  CONSTRAINT chk_tenant_role CHECK (
    (role = 'super_admin' AND tenant_id IS NULL) OR
    (role != 'super_admin' AND tenant_id IS NOT NULL)
  )
);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- ============================================================
-- FUNCIÓN: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
