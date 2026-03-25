const { AppError } = require("../middleware/error.middleware");
const PredictRepository = require("../repositories/predict.repository");
const specialtyService = require("./specialty.service");

/**
 * Servicio de predicción de demanda
 * Orquesta la comunicación con el microservicio de IA
 */
async function getDemandPrediction(tenantId, specialty) {
  if (!specialty) {
    throw new AppError("Especialidad requerida", 400);
  }

  const repo = new PredictRepository();

  try {
    return await repo.getDemandPrediction(tenantId, specialty);
  } catch (err) {
    console.error("Error en predicción:", err.message);

    if (
      err.message.includes("fetch failed") ||
      err.message.includes("ECONNREFUSED")
    ) {
      throw new AppError("Servicio de predicción no disponible", 503);
    }

    throw new AppError("Error al obtener predicción", 500);
  }
}

/**
 * Obtiene especialidades disponibles para predicción
 * Reutiliza el servicio existente de especialidades
 */
async function getSpecialties(tenantId) {
  return await specialtyService.getAll(tenantId);
}

module.exports = { getDemandPrediction, getSpecialties };
