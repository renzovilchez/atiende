import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import Router from './router/index.jsx'
import useAuthStore from './store/auth.store.js'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  },
})

function App() {
  const checkSession = useAuthStore((s) => s.checkSession)

  // Al montar la app, verifica si hay sesión activa via refresh token
  useEffect(() => {
    checkSession()
  }, [])

  return <Router />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)