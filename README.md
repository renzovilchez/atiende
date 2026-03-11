# ATIENDE

Plataforma web multitenant de gestión de citas médicas para clínicas privadas.

## Estado actual: Fase 2 — Agendamiento

## Requisitos

- Docker + Docker Compose
- Node.js + npm
- Git

## Setup

```bash
git clone https://github.com/renzovilchez/atiende.git
cd atiende

# Levantar Postgres + Redis + servidor
docker-compose up -d

# Migraciones y datos de prueba
docker-compose exec server npm run migrate
docker-compose exec server npm run seed

# Verificar
curl http://localhost:4000/health
```

## Usuarios de prueba (password: `password123`)

| Email | Rol | Clínica |
|-------|-----|---------|
| super@atiende.com | super_admin | — |
| admin@sanmarcos.com | admin | Clínica San Marcos |
| recepcion@sanmarcos.com | receptionist | Clínica San Marcos |
| dr.garcia@sanmarcos.com | doctor | Clínica San Marcos |
| dr.perez@sanmarcos.com | doctor | Clínica San Marcos |
| paciente1@gmail.com | patient | Clínica San Marcos |
| admin@vita.com | admin | Centro Médico Vita |
| recepcion@vita.com | receptionist | Centro Médico Vita |
| paciente2@gmail.com | patient | Centro Médico Vita |

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
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── router/
│   │   └── store/          Zustand
│   ├── Dockerfile.dev
│   └── .env.example
├── ai/             FastAPI + scikit-learn  (Fase 5 — pendiente)
├── infra/          nginx, producción       (Fase 6 — pendiente)
└── docker-compose.yml
```

## Fases

| Fase | Semanas | Estado |
|------|---------|--------|
| 1 — Base multitenant + Auth | S1-S3 | ✅ Completada |
| 2 — Agendamiento | S4-S6 | 🔄 En progreso |
| 3 — Tiempo real (Socket.io) | S7-S9 | ⏳ Pendiente |
| 4 — Canvas interactivo | S10-S12 | ⏳ Pendiente |
| 5 — Microservicio IA | S13-S16 | ⏳ Pendiente |
| 6 — Reportes y pulido | S17-S20 | ⏳ Pendiente |

---

## Notas de desarrollo

### Agregar una dependencia nueva a server

El `node_modules` vive en dos lugares: local (para el editor) y dentro del contenedor Docker (para el servidor). Hay que actualizar ambos.

```bash
cd server
npm install <paquete>                        # actualiza local + package.json
docker-compose exec server npm install       # instala dentro del contenedor
```

No usar `--build` para dependencias — el caché de Docker lo bloquea. El `exec npm install` es más directo y siempre funciona.

Para verificar que quedó instalada en el contenedor:

```bash
docker-compose exec server node -e "require('<paquete>'); console.log('ok')"
```

### Correr migraciones nuevas

Cada migración nueva es un archivo `.sql` numerado en `server/migrations/`. El sistema registra cuáles ya se aplicaron — correr el comando múltiples veces es seguro.

```bash
docker-compose exec server npm run migrate
```

### Resetear la base de datos en desarrollo

```bash
docker-compose down -v          # baja los contenedores y borra los volúmenes
docker-compose up -d            # vuelve a levantar todo
docker-compose exec server npm run migrate
docker-compose exec server npm run seed
```

### Probar endpoints

Los endpoints están documentados en `docs/api.http`. Requiere la extensión **REST Client** (Huachao Mao) en VS Code. Abrir el archivo y hacer click en `Send Request` sobre cada bloque.

Flujo básico: hacer login → copiar el `accessToken` del response → pegarlo en la variable `@accessToken` al inicio del archivo → usar los demás endpoints.

---

## Debugging

### Ver estado de los contenedores

```bash
docker-compose ps                # estado y puertos de todos los servicios
docker stats                     # uso de CPU y memoria en tiempo real
```

### Ver logs

```bash
docker-compose logs -f                      # todos los servicios en tiempo real
docker-compose logs -f server               # solo el servidor en tiempo real
docker-compose logs --tail=50 server        # últimas 50 líneas del servidor
docker-compose logs postgres                # logs de Postgres
docker-compose logs redis                   # logs de Redis
# Cuando existan:
# docker-compose logs client               # logs del frontend (Fase 1)
# docker-compose logs ai                   # logs del microservicio IA (Fase 5)
```

### Ver qué hay dentro del contenedor

```bash
docker-compose exec server sh                                            # abrir shell
docker-compose exec server cat package.json                              # leer un archivo
docker-compose exec server ls src/                                       # listar carpeta
docker-compose exec server node -e "console.log(process.env.NODE_ENV)"  # inspeccionar variable de entorno
```

### Conectarse a Postgres directamente

```bash
docker-compose exec postgres psql -U atiende -d atiende_dev
```

Comandos útiles dentro de psql:

```sql
\dt                         -- listar tablas
\d users                    -- ver estructura de una tabla
SELECT * FROM users;        -- consultar datos
SELECT * FROM _migrations;  -- ver migraciones aplicadas
\q                          -- salir
```

### Conectarse a Redis directamente

```bash
docker-compose exec redis redis-cli
```

Comandos útiles dentro de redis-cli:

```
KEYS *              -- ver todas las claves
GET <clave>         -- leer una clave
FLUSHALL            -- borrar todo (solo en desarrollo)
exit                -- salir
```

### El servidor no responde

```bash
# 1. Verificar que los contenedores están Up
docker-compose ps

# 2. Ver qué error tiene el servidor
docker-compose logs server

# 3. Reiniciar solo el servidor
docker-compose restart server

# 4. Si el error es dependencia no encontrada
docker-compose exec server npm install
```

### Forzar reconstrucción completa

Solo necesario si cambias el `Dockerfile` o hay problemas graves con la imagen. No usar para dependencias.

```bash
docker-compose down
docker-compose build --no-cache server
docker-compose up -d
```

### El warning de `version` obsoleto

Si ves este aviso en cada comando de Docker:

```
the attribute `version` is obsolete, it will be ignored
```

Se soluciona borrando la línea `version: '3.9'` del `docker-compose.yml` — las versiones modernas de Docker Compose no la necesitan.