import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import { useTenantSlug } from "../../hooks/useTenantSlug";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";

const RISK_COLORS = {
  alto: "#ef4444",
  medio: "#f59e0b",
  bajo: "#10b981",
};

const DAY_NAMES = {
  Lun: "Lunes",
  Mar: "Martes",
  Mié: "Miércoles",
  Jue: "Jueves",
  Vie: "Viernes",
  Sáb: "Sábado",
  Dom: "Domingo",
};

export default function AdminReportes() {
  const navigate = useNavigate();
  const slug = useTenantSlug();
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  // Obtener especialidades dinámicas del tenant
  const { data: specialtiesData, isLoading: isLoadingSpecialties } = useQuery({
    queryKey: ["specialties", slug],
    queryFn: () => api.get("/predict/specialties").then((r) => r.data.data),
    onSuccess: (data) => {
      if (data && data.length > 0 && !selectedSpecialty) {
        setSelectedSpecialty(data[0].name);
      }
    },
  });

  // Obtener predicciones de la IA
  const {
    data: predictionData,
    isLoading: isLoadingPrediction,
    error: predictionError,
  } = useQuery({
    queryKey: ["demand-prediction", selectedSpecialty],
    queryFn: () =>
      api
        .get(
          `/predict/demand?specialty=${encodeURIComponent(selectedSpecialty)}`,
        )
        .then((r) => r.data.data),
    enabled: !!selectedSpecialty,
    retry: 1,
  });

  const forecastData =
    predictionData?.predictions?.map((day) => ({
      day: day.day_name,
      date: day.date,
      total: day.total_expected,
      peak: day.peak_demand,
      risk: day.risk_level,
      peakHour: day.peak_hour,
      hourly: day.hourly,
    })) || [];

  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    if (forecastData.length > 0 && !selectedDay) {
      setSelectedDay(predictionData?.predictions?.[0]);
    }
  }, [forecastData, predictionData]);

  const totalExpectedWeek = forecastData.reduce((sum, d) => sum + d.total, 0);
  const avgDailyDemand =
    forecastData.length > 0 ? totalExpectedWeek / forecastData.length : 0;
  const highRiskDays = forecastData.filter((d) => d.risk === "alto").length;

  const hasError = predictionError || predictionData?.error;

  if (hasError) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-medium text-red-900">Error en predicción</h3>
            <p className="text-sm text-red-700">
              {predictionError?.response?.data?.message ||
                predictionData?.error ||
                "No se pudo obtener la predicción"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/${slug}/admin`)}
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
        >
          ← Volver
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reportes y Predicciones
            </h1>
            <p className="text-gray-500 mt-1">
              Análisis de demanda y predicciones de ocupación
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Especialidad:</span>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              disabled={isLoadingSpecialties}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              {isLoadingSpecialties ? (
                <option>Cargando...</option>
              ) : specialtiesData?.length === 0 ? (
                <option>No hay especialidades</option>
              ) : (
                specialtiesData?.map((spec) => (
                  <option key={spec.id} value={spec.name}>
                    {spec.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
            {isLoadingPrediction ? "..." : Math.round(avgDailyDemand)}
          </div>
          <div className="text-xs md:text-sm text-gray-500">
            Promedio diario
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">
            {isLoadingPrediction ? "..." : totalExpectedWeek.toFixed(0)}
          </div>
          <div className="text-xs md:text-sm text-gray-500">Total semana</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="text-2xl md:text-3xl font-bold text-red-600 mb-1">
            {isLoadingPrediction ? "..." : highRiskDays}
          </div>
          <div className="text-xs md:text-sm text-gray-500">Días críticos</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">
            {isLoadingPrediction ? "..." : forecastData.length}
          </div>
          <div className="text-xs md:text-sm text-gray-500">
            Días pronosticados
          </div>
        </div>
      </div>

      {/* Gráfico y Detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Demanda Proyectada - Próximos 7 días
          </h3>
          <div className="h-64 md:h-80">
            {forecastData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} cursor="pointer">
                    {forecastData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={RISK_COLORS[entry.risk] || "#3b82f6"}
                        onClick={() =>
                          setSelectedDay(predictionData?.predictions?.[index])
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                {isLoadingPrediction ? "Cargando..." : "No hay datos"}
              </div>
            )}
          </div>
        </div>

        {/* Panel de detalle */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detalle por Día
          </h3>
          {selectedDay ? (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-4">
                <div className="text-sm text-gray-500 mb-1">
                  {DAY_NAMES[selectedDay.day_name]} {selectedDay.date}
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedDay.risk_level === "alto"
                      ? "bg-red-100 text-red-700"
                      : selectedDay.risk_level === "medio"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  Riesgo {selectedDay.risk_level}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Total esperado:</span>
                  <span className="font-semibold">
                    {selectedDay.total_expected} pacientes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Hora pico:</span>
                  <span className="font-semibold">
                    {selectedDay.peak_hour}:00 ({selectedDay.peak_demand} pac/h)
                  </span>
                </div>
              </div>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedDay.hourly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="formatted_time"
                      tick={{ fontSize: 10 }}
                      interval={2}
                    />
                    <YAxis hide />
                    <Line
                      type="monotone"
                      dataKey="demand"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              Selecciona un día del gráfico
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {predictionData && (
        <div className="mt-6 text-sm text-gray-500 flex items-center gap-2">
          <span>🤖</span>
          <span>
            Predicción generada en {predictionData.response_time_ms}ms
            {predictionData.cached && " (cacheada)"}
          </span>
        </div>
      )}
    </div>
  );
}
