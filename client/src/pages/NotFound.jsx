import { Link } from 'react-router-dom'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md px-4">
                <div className="text-8xl font-bold text-blue-600 mb-4">404</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Página no encontrada
                </h1>
                <p className="text-gray-600 mb-8">
                    La página que estás buscando no existe.
                </p>
                <Link
                    to="/"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Volver al inicio
                </Link>
            </div>
        </div>
    )
}