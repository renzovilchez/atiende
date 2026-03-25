const BaseRepository = require("./base.repository");

/**
 * Repository para comunicación con el servicio de IA (FastAPI)
 * No requiere base de datos, solo HTTP al microservicio de Python
 */
class PredictRepository extends BaseRepository {
  constructor() {
    // No necesita tabla ni tenantId, es solo proxy a IA
    super(null, null);
    this.aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
  }

  /**
   * Obtiene predicción de demanda del servicio de IA
   */
  async getDemandPrediction(tenantId, specialty) {
    const url = new URL(`${this.aiServiceUrl}/api/v1/predict`);
    url.searchParams.append("tenant_id", tenantId);
    url.searchParams.append("specialty", specialty);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`IA service error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Obtiene información del modelo para un tenant
   */
  async getModelInfo(tenantId) {
    const url = new URL(`${this.aiServiceUrl}/api/v1/model/info`);
    url.searchParams.append("tenant_id", tenantId);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`IA service error: ${response.status}`);
    }

    return await response.json();
  }
}

module.exports = PredictRepository;
