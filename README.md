# ATIENDE

Plataforma web multitenant de gestión de citas médicas para clínicas privadas.

## Estado actual: Fase 6 — Reportes y pulido

## Requisitos

- Docker + Docker Compose
- Node.js + npm
- Python 3.11+ (para desarrollo local del microservicio IA)
- Git

## Setup

```bash
git clone https://github.com/renzovilchez/atiende.git
cd atiende

# Levantar todos los servicios (Postgres, Redis, Server, Client, AI)
docker-compose up -d

# Migraciones y datos de prueba del servidor
docker-compose exec server npm run migrate
docker-compose exec server npm run seed

# Datos de prueba para el microservicio IA
docker-compose exec ai python seed_demo.py

# Verificar servicios
curl http://localhost:4000/health    # API principal
curl http://localhost:8000/health    # Microservicio IA
```

## Usuarios de prueba (password: `password123`)

| Email                   | Rol          | Clínica            |
| ----------------------- | ------------ | ------------------ |
| super@atiende.com       | super_admin  | —                  |
| admin@sanmarcos.com     | admin        | Clínica San Marcos |
| recepcion@sanmarcos.com | receptionist | Clínica San Marcos |
| dr.garcia@sanmarcos.com | doctor       | Clínica San Marcos |
| dr.perez@sanmarcos.com  | doctor       | Clínica San Marcos |
| paciente1@gmail.com     | patient      | Clínica San Marcos |
| admin@vita.com          | admin        | Centro Médico Vita |
| recepcion@vita.com      | receptionist | Centro Médico Vita |
| paciente2@gmail.com     | patient      | Centro Médico Vita |

## Estructura

```
atiende/
├── server/         Node.js + Express + Socket.io
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── db/
│   │   └── utils/
│   ├── migrations/
│   └── .env.example
├── client/         React + Vite
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── router/
│   │   └── store/          Zustand
│   ├── Dockerfile.dev
│   └── .env.example
├── ai/             FastAPI + scikit-learn
│   ├── src/
│   │   ├── database.py
│   │   ├── train.py
│   │   └── predict.py
│   ├── seed_demo.py
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile.dev
├── infra/          nginx, producción       (Fase 6 — pendiente)
└── docker-compose.yml
```

## Fases

| Fase                        | Semanas | Estado         |
| --------------------------- | ------- | -------------- |
| 1 — Base multitenant + Auth | S1-S3   | ✅ Completada  |
| 2 — Agendamiento            | S4-S6   | ✅ Completada  |
| 3 — Tiempo real (Socket.io) | S7-S9   | ✅ Completada  |
| 4 — Canvas interactivo      | S10-S12 | ✅ Completada  |
| 5 — Microservicio IA        | S13-S16 | ✅ Completada  |
| 6 — Reportes y pulido       | S17-S20 | 🔄 En progreso |

---

## Notas de desarrollo

### Agregar una dependencia nueva

El `node_modules` vive en dos lugares: local (para el editor) y dentro del contenedor Docker (para el servidor). Hay que actualizar ambos.

```bash
cd server                                    # o cd client según corresponda
npm install <paquete>                        # instala Y registra en package.json
docker-compose down -v                       # baja contenedores y borra volúmenes (node_modules incluido)
docker-compose up --build                    # reconstruye la imagen con el package.json actualizado
docker-compose exec server npm run migrate   # ejecuta migraciones pendientes
docker-compose exec server npm run seed      # ejecuta seeders pendientes
```

### Python (ai):

```bash
cd ai
pip install <paquete>
echo "<paquete>==<version>" >> requirements.txt
docker-compose build ai
docker-compose up -d ai
```

### Correr migraciones nuevas

Cada migración nueva es un archivo `.sql` numerado en `server/migrations/`. El sistema registra cuáles ya se aplicaron — correr el comando múltiples veces es seguro.

```bash
docker-compose exec server npm run migrate
```

### Resetear la base de datos en desarrollo

#### BD del servidor (atiende_dev):

```bash
docker-compose down -v          # baja los contenedores y borra los volúmenes
docker-compose up -d            # vuelve a levantar todo
docker-compose exec server npm run migrate
docker-compose exec server npm run seed
```

#### BD del microservicio IA (atiende_ai_dev):

```bash
docker-compose exec postgres psql -U atiende -c "DROP DATABASE IF EXISTS atiende_ai_dev;"
docker-compose exec postgres psql -U atiende -c "CREATE DATABASE atiende_ai_dev;"
docker-compose exec ai python seed_demo.py
```

### Probar endpoints

| Servicio   | URL de documentación                               |
| ---------- | -------------------------------------------------- |
| Server API | `docs/api.http` (extensión REST Client de VS Code) |
| AI Service | Swagger UI: `http://localhost:8000/docs`           |
| AI Service | ReDoc: `http://localhost:8000/redoc`               |

---

## Debugging

### Ver estado de los contenedores

```bash
docker-compose ps                # estado y puertos de todos los servicios
docker stats                     # uso de CPU y memoria en tiempo real
```

Ver logs por servicio

| Servicio | Puerto | Comando                         |
| -------- | ------ | ------------------------------- |
| server   | 4000   | `docker-compose logs -f server` |
| client   | 5173   | `docker-compose logs -f client` |
| ai       | 8000   | `docker-compose logs -f ai`     |
| postgres | 5432   | `docker-compose logs postgres`  |
| redis    | 6379   | `docker-compose logs redis`     |

```bash
# Todos los servicios
docker-compose logs -f

# Últimas 50 líneas
docker-compose logs --tail=50 server
```

### Ver qué hay dentro del contenedor

#### Server (Node.js):

```bash
docker-compose exec server sh
docker-compose exec server cat package.json
docker-compose exec server ls src/
```

#### Client (React):

```bash
docker-compose exec client sh
docker-compose exec client cat package.json
```

#### AI (Python):

```bash
docker-compose exec ai bash
docker-compose exec ai cat requirements.txt
docker-compose exec ai python -c "from src.train import train; train('1')"
```

### Conectarse a Postgres

| Base de datos | Comando                                                          |
| ------------- | ---------------------------------------------------------------- |
| Principal     | `docker-compose exec postgres psql -U atiende -d atiende_dev`    |
| AI/Test       | `docker-compose exec postgres psql -U atiende -d atiende_ai_dev` |

#### Comandos útiles dentro de psql:

```sql
\dt                         -- listar tablas
\d users                    -- ver estructura de una tabla
SELECT * FROM users;        -- consultar datos
SELECT * FROM _migrations;  -- ver migraciones aplicadas
\q                          -- salir
```

### Conectarse a Redis

```bash
docker-compose exec redis redis-cli
```

#### Comandos útiles dentro de redis-cli:

```
KEYS *              -- ver todas las claves
GET <clave>         -- leer una clave
FLUSHALL            -- borrar todo (solo en desarrollo)
exit                -- salir
```

### Reiniciar un servicio específico

```bash
docker-compose restart server
docker-compose restart ai
docker-compose restart client
```

### Forzar reconstrucción completa

Solo necesario si cambias el `Dockerfile` o hay problemas graves con la imagen. No usar para dependencias.

```bash
docker-compose down
docker-compose build --no-cache server
docker-compose build --no-cache ai
docker-compose build --no-cache client
docker-compose up -d
```

### El warning de `version` obsoleto

Si ves este aviso en cada comando de Docker:

```
the attribute `version` is obsolete, it will be ignored
```

Se soluciona borrando la línea `version: '3.9'` del `docker-compose.yml` — las versiones modernas de Docker Compose no la necesitan.
