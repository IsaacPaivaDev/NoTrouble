import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * 🛡️ Guarda de rota para áreas que exigem login.
 *
 * Usa o padrão "layout route" do React Router v6: envolva um grupo de
 * <Route> com <Route element={<ProtectedRoute />}> e o Outlet renderiza
 * o filho correto se o usuário estiver autenticado.
 *
 * Se NÃO estiver autenticado, redireciona pro /login E guarda a rota
 * original em location.state.from para que o Login possa mandar de
 * volta após o sucesso.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Enquanto verifica auth (ex: chamada /me), evita o "flash" de redirect.
  // Hoje loading começa false, mas deixei pronto pra quando você quiser
  // validar o token contra o backend no boot da app.
  if (loading) return null

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

/**
 * 🚪 Inverso do ProtectedRoute: bloqueia páginas públicas de usuários
 * já logados. Ex: se o usuário logado tentar abrir /login manualmente,
 * é mandado pra home em vez de ver o form de login de novo.
 */
export function GuestOnlyRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return null
  if (isAuthenticated) return <Navigate to="/" replace />

  return <Outlet />
}