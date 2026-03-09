/**
 * Error personalizado con statusCode
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

/**
 * Handler global. Debe ser el ÚLTIMO middleware en index.js.
 */
function errorHandler(err, req, res, next) {
  // Errores de Zod (validación)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  // Errores de Postgres
  if (err.code === '23505') {
    return res.status(409).json({ success: false, error: 'Ya existe un registro con esos datos' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ success: false, error: 'Referencia inválida' });
  }

  // Errores operacionales (AppError)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // Errores inesperados
  console.error('💥 Unexpected error:', err);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
}

module.exports = { AppError, errorHandler };
