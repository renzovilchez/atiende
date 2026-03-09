const jwt = require('jsonwebtoken');
const { AppError } = require('./error.middleware');

/**
 * Verifica el JWT y adjunta user + tenant al request.
 * Todos los controllers acceden a req.user y req.tenantId sin pensarlo.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No autorizado', 401));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId || null,
    };
    req.tenantId = payload.tenantId || null;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expirado', 401));
    }
    return next(new AppError('Token inválido', 401));
  }
}

/**
 * Restricción por roles. Uso: authorize('admin', 'super_admin')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('No autenticado', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Sin permisos para esta acción', 403));
    }
    next();
  };
}

/**
 * Asegura que el recurso solicitado pertenece al tenant del usuario.
 * Para super_admin, pasa siempre.
 */
function requireTenant(req, res, next) {
  if (req.user?.role === 'super_admin') return next();
  if (!req.tenantId) return next(new AppError('Tenant requerido', 403));
  next();
}

module.exports = { authenticate, authorize, requireTenant };
