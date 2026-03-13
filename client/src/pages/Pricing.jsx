import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PLANES = [
    {
        nombre: 'Básico',
        precioMensual: 'S/ 99',
        precioAnual: 'S/ 990',
        doctores: 'Hasta 3',
        citas: '200/mes',
        descripcion: 'Perfecto para consultorios independientes',
        color: 'gray',
        icono: '🏥',
        features: [
            'Gestión de agenda digital',
            'Recordatorios automáticos por WhatsApp',
            'Historial clínico básico',
            'Soporte por email',
            '1 clínica',
            'App móvil incluida'
        ],
        limitaciones: [
            'Sin reportes avanzados',
            'Sin API'
        ]
    },
    {
        nombre: 'Profesional',
        precioMensual: 'S/ 199',
        precioAnual: 'S/ 1,990',
        doctores: 'Hasta 10',
        citas: '1,000/mes',
        descripcion: 'Ideal para clínicas en crecimiento',
        color: 'blue',
        destacado: true,
        icono: '⚕️',
        features: [
            'Todo lo del plan Básico',
            'Múltiples sedes (hasta 3)',
            'Reportes y analytics',
            'API de integración',
            'Soporte prioritario 24/7',
            'Backups diarios',
            'Personalización de marca'
        ]
    },
    {
        nombre: 'Empresarial',
        precioMensual: 'S/ 399',
        precioAnual: 'S/ 3,990',
        doctores: 'Ilimitados',
        citas: 'Ilimitadas',
        descripcion: 'Para grandes clínicas y cadenas',
        color: 'purple',
        icono: '🏛️',
        features: [
            'Todo lo del plan Profesional',
            'Gerente de cuenta dedicado',
            'Sedes ilimitadas',
            'Capacitación presencial',
            'SLA garantizado 99.9%',
            'Auditoría y compliance',
            'Desarrollo a medida'
        ]
    },
]

export default function PricingPage() {
    const navigate = useNavigate()
    const [billingPeriod, setBillingPeriod] = useState('monthly')
    const [selectedPlan, setSelectedPlan] = useState(null)

    const getPrecio = (plan) => {
        return billingPeriod === 'monthly' ? plan.precioMensual : plan.precioAnual
    }

    const getPeriodText = () => {
        return billingPeriod === 'monthly' ? '/mes' : '/año'
    }

    const getAhorro = (plan) => {
        if (billingPeriod === 'yearly') {
            const mensual = parseInt(plan.precioMensual.replace(/\D/g, ''))
            const anual = parseInt(plan.precioAnual.replace(/\D/g, ''))
            const ahorro = ((mensual * 12) - anual)
            return `Ahorra S/ ${ahorro}`
        }
        return null
    }

    const handleSelectPlan = (planNombre) => {
        setSelectedPlan(planNombre)
        // Aquí puedes redirigir a registro o mostrar modal
        console.log(`Plan seleccionado: ${planNombre}`)
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header/Navigation */}
            <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                                <span className="text-white font-bold text-xl">A</span>
                            </div>
                            <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                ATIENDE
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium"
                            >
                                Iniciar sesión
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                            >
                                Comenzar gratis
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white pt-20 pb-32">
                {/* Decorative elements */}
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-200 to-purple-200 rounded-full blur-3xl opacity-20"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                        Precios simples y
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> transparentes</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Elige el plan que mejor se adapte a tu clínica. Todos incluyen 14 días de prueba gratuita, sin compromiso.
                    </p>

                    {/* Trust badges */}
                    <div className="flex flex-wrap justify-center gap-8 mt-12">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600">Sin tarjeta de crédito</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600">Cancela cuando quieras</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600">Soporte incluido</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing Section */}
            <div className="relative -mt-20 pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Billing Toggle */}
                    <div className="flex justify-center mb-12">
                        <div className="bg-white p-1.5 rounded-2xl shadow-lg border border-gray-100 inline-flex">
                            <button
                                onClick={() => setBillingPeriod('monthly')}
                                className={`px-8 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${billingPeriod === 'monthly'
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                        : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                Mensual
                            </button>
                            <button
                                onClick={() => setBillingPeriod('yearly')}
                                className={`px-8 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative ${billingPeriod === 'yearly'
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                        : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                Anual
                                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                    Ahorra 17%
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {PLANES.map((plan) => (
                            <div
                                key={plan.nombre}
                                className={`
                                    relative group
                                    ${plan.destacado ? 'lg:-mt-8 lg:mb-8' : ''}
                                `}
                            >
                                {/* Popular Badge */}
                                {plan.destacado && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-lg shadow-blue-200">
                                            ⭐ Más popular
                                        </div>
                                    </div>
                                )}

                                {/* Card */}
                                <div className={`
                                    relative h-full bg-white rounded-3xl border-2 overflow-hidden
                                    transition-all duration-300 hover:shadow-2xl hover:scale-105
                                    ${plan.destacado
                                        ? 'border-blue-400 shadow-xl shadow-blue-100'
                                        : `border-gray-200 hover:border-${plan.color}-300`
                                    }
                                `}>
                                    {/* Header with icon */}
                                    <div className={`
                                        p-8 text-center border-b border-gray-100
                                        ${plan.destacado ? 'bg-gradient-to-b from-blue-50/50 to-white' : ''}
                                    `}>
                                        <div className="text-5xl mb-4">{plan.icono}</div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                            {plan.nombre}
                                        </h3>
                                        <p className="text-gray-500 text-sm mb-6">
                                            {plan.descripcion}
                                        </p>
                                        <div className="flex items-end justify-center gap-1">
                                            <span className="text-5xl font-bold text-gray-900">
                                                {getPrecio(plan)}
                                            </span>
                                            <span className="text-gray-400 mb-2">
                                                {getPeriodText()}
                                            </span>
                                        </div>

                                        {/* Savings badge */}
                                        {billingPeriod === 'yearly' && (
                                            <div className="mt-3 inline-block bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                                                {getAhorro(plan)} al año
                                            </div>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <div className="p-8">
                                        <div className="space-y-6">
                                            {/* Key metrics */}
                                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">👥 Doctores</span>
                                                    <span className="font-semibold text-gray-900">{plan.doctores}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">📅 Citas incluidas</span>
                                                    <span className="font-semibold text-gray-900">{plan.citas}</span>
                                                </div>
                                            </div>

                                            {/* Feature list */}
                                            <div className="space-y-4">
                                                <p className="font-semibold text-gray-900 text-sm">Incluye:</p>
                                                {plan.features.map((feature, idx) => (
                                                    <div key={idx} className="flex items-start gap-3">
                                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <span className="text-gray-600 text-sm">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Limitations (if any) */}
                                            {plan.limitaciones && (
                                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                                    <p className="text-xs text-gray-400">No incluye:</p>
                                                    {plan.limitaciones.map((limit, idx) => (
                                                        <div key={idx} className="flex items-start gap-3">
                                                            <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            <span className="text-gray-400 text-sm">{limit}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* CTA Button */}
                                        <button
                                            onClick={() => handleSelectPlan(plan.nombre)}
                                            className={`
                                                w-full mt-8 py-4 px-6 rounded-xl font-semibold text-center
                                                transition-all duration-200 transform hover:scale-105
                                                ${plan.destacado
                                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:from-blue-700 hover:to-purple-700'
                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                                }
                                            `}
                                        >
                                            {plan.destacado ? 'Comenzar prueba gratis' : 'Seleccionar plan'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Enterprise Contact */}
                    <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 lg:p-12 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            ¿Necesitas un plan personalizado?
                        </h2>
                        <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
                            Para grandes cadenas o necesidades específicas, tenemos soluciones a medida.
                        </p>
                        <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200 inline-flex items-center gap-2">
                            Contactar a ventas
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                    </div>

                    {/* FAQ Section */}
                    <div className="mt-24">
                        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
                            Preguntas frecuentes
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                <h3 className="font-semibold text-gray-900 mb-2">¿Puedo cambiar de plan después?</h3>
                                <p className="text-gray-500 text-sm">Sí, puedes actualizar o reducir tu plan en cualquier momento. Los cambios se aplican inmediatamente.</p>
                            </div>
                            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                <h3 className="font-semibold text-gray-900 mb-2">¿Qué pasa cuando termina la prueba?</h3>
                                <p className="text-gray-500 text-sm">Te notificaremos con anticipación. Puedes elegir un plan o exportar tus datos sin costo.</p>
                            </div>
                            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                <h3 className="font-semibold text-gray-900 mb-2">¿Ofrecen descuentos para ONGs?</h3>
                                <p className="text-gray-500 text-sm">Sí, tenemos programas especiales para organizaciones sin fines de lucro. Contáctanos para más información.</p>
                            </div>
                            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                <h3 className="font-semibold text-gray-900 mb-2">¿Los precios incluyen IGV?</h3>
                                <p className="text-gray-500 text-sm">Los precios mostrados no incluyen IGV. Se añadirá según la legislación peruana.</p>
                            </div>
                        </div>
                    </div>

                    {/* Comparison Table Teaser */}
                    <div className="mt-24 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Compara todos los planes
                        </h2>
                        <p className="text-gray-500 mb-8">
                            Revisa en detalle todas las características de cada plan
                        </p>
                        <button className="bg-white border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
                            Ver tabla comparativa completa
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-50 border-t border-gray-100 mt-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold">A</span>
                                </div>
                                <span className="font-bold text-gray-900">ATIENDE</span>
                            </div>
                            <p className="text-sm text-gray-500">
                                Gestiona tu clínica de manera inteligente
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Producto</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li>Características</li>
                                <li>Precios</li>
                                <li>Seguridad</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Compañía</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li>Sobre nosotros</li>
                                <li>Blog</li>
                                <li>Contacto</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li>Términos</li>
                                <li>Privacidad</li>
                                <li>Cookies</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-400">
                        © 2024 ATIENDE. Todos los derechos reservados.
                    </div>
                </div>
            </footer>

            {/* Styles */}
            <style jsx>{`
                .bg-grid-pattern {
                    background-image: linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                        linear-gradient(to bottom, #e5e7eb 1px, transparent 1px);
                    background-size: 50px 50px;
                }
            `}</style>
        </div>
    )
}