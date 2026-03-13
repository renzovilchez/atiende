# ATIENDE — Client

Frontend React + Vite del sistema de gestión de citas médicas.

## Requisitos

- Node.js 20+
- Docker (para correr junto al stack completo)

## Correr en desarrollo

### Con Docker (recomendado)

Desde la raíz del proyecto:

```bash
docker-compose up -d
```

El cliente estará disponible en `http://localhost:5173`.

### Sin Docker (solo frontend)

```bash
cd client
npm install
npm run dev
```

Requiere que el servidor esté corriendo en `http://localhost:4000`.

## Estructura

```
client/src/
├── api/
│   └── axios.js          — instancia axios con interceptor de refresh token automático
├── store/
│   └── auth.store.js     — estado global de autenticación con Zustand
├── router/
│   └── index.jsx         — rutas protegidas por rol
├── pages/
│   └── Login.jsx         — pantalla de login
├── components/
│   └── ProtectedRoute.jsx — guard de rutas por autenticación y rol
└── main.jsx              — entry point, monta providers y verifica sesión
```

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar si es necesario:

```bash
cp .env.example .env
```

| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_API_URL` | URL base del backend | `http://localhost:4000/api` |

## Roles y rutas protegidas

| Ruta | Roles permitidos |
|------|-----------------|
| `/` | todos los autenticados |
| `/admin` | admin, super_admin |
| `/recepcion` | receptionist |
| `/doctor` | doctor |

## Notas de desarrollo

### Agregar una dependencia nueva

```bash
cd client
npm install <paquete>                        # actualiza local + package.json
docker-compose exec client npm install       # instala dentro del contenedor
```

### El accessToken vive en memoria

El `accessToken` se guarda en `window.__accessToken` — no en localStorage ni en una cookie. Se pierde al recargar la página pero `checkSession()` en `main.jsx` lo renueva automáticamente usando el refresh token (cookie httpOnly). Esto protege contra ataques XSS.

---

## Debugging

### Ver logs del cliente

```bash
docker-compose logs -f client           # logs en tiempo real
docker-compose logs --tail=50 client    # últimas 50 líneas
```

### El cliente no carga

```bash
# 1. Verificar que el contenedor está Up
docker-compose ps

# 2. Ver el error
docker-compose logs client

# 3. Reiniciar
docker-compose restart client

# 4. Si falta una dependencia
docker-compose exec client npm install
```

### Vite no detecta cambios en tiempo real

El volumen montado en Docker debería hacer que Vite recargue automáticamente. Si no funciona, verificar que el `Dockerfile.dev` incluye `--host` en el comando:

```dockerfile
CMD ["npm", "run", "dev", "--", "--host"]
```

Sin `--host` Vite escucha solo dentro del contenedor y no es accesible desde el navegador.

### Abrir shell dentro del contenedor

```bash
docker-compose exec client sh
```