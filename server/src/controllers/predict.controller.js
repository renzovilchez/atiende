const { z } = require("zod");
const predictService = require("../services/predict.service");

const demandSchema = z.object({
  specialty: z.string().min(1),
});

/**
 * GET /api/predict/demand
 * Obtiene predicción de demanda para una especialidad específica
 */
async function getDemand(req, res, next) {
  try {
    const { specialty } = demandSchema.parse(req.query);
    const tenantId = req.tenantId;

    const prediction = await predictService.getDemandPrediction(
      tenantId,
      specialty,
    );

    res.json({ success: true, data: prediction });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/predict/specialties
 * Lista especialidades disponibles para el tenant actual
 */
async function getSpecialties(req, res, next) {
  try {
    const specialties = await predictService.getSpecialties(req.tenantId);
    res.json({ success: true, data: specialties });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDemand, getSpecialties };
