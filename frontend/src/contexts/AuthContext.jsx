import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

// 🔍 Verifica se um JWT ainda está dentro do prazo de validade (client-side)
// NÃO substitui a validação do backend, mas evita renderizar tela protegida
// com um token obviamente expirado.
function isAccessTokenValid(token) {
  if (!token) return false
  try {
    const [, payload] = token.split('.')
    // atob não lida bem com base64url; troca os caracteres antes
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(atob(normalized))
    return typeof decoded.exp === 'number' && decoded.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

// 🎬 Estado inicial LAZY: lê o localStorage UMA VEZ na primeira renderização.
// Sem isso, o ProtectedRoute roda antes do useEffect carregar o token
// e manda o usuário pro /login mesmo estando logado (o famoso "flash de logout").
function getInitialAuthState() {
  try {
    const accessToken = localStorage.getItem('access_token')
    const refreshToken = localStorage.getItem('refresh_token')
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null

    // Considera autenticado se tem QUALQUER um dos tokens:
    // - access válido → vai direto
    // - access expirado + refresh existente → apiFetch renova na primeira chamada
    // - nenhum token → não autenticado
    const isAuthenticated = isAccessTokenValid(accessToken) || !!refreshToken

    return { accessToken, refreshToken, user, isAuthenticated }
  } catch {
    return { accessToken: null, refreshToken: null, user: null, isAuthenticated: false }
  }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(getInitialAuthState)
  const [loading, setLoading] = useState(false) // espaço pra futura chamada /me

  // 🔐 LOGIN: salva tokens + user e atualiza o estado
  const login = useCallback(({ access, refresh, user }) => {
    if (access) localStorage.setItem('access_token', access)
    if (refresh) localStorage.setItem('refresh_token', refresh)
    if (user) localStorage.setItem('user', JSON.stringify(user))

    setAuthState({
      accessToken: access || null,
      refreshToken: refresh || null,
      user: user || null,
      isAuthenticated: true,
    })
  }, [])

  // 🧹 LOGOUT: limpa tudo
  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')

    setAuthState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    })
  }, [])

  // 🔄 Sincroniza entre abas: se logar/deslogar numa aba, as outras refletem
  useEffect(() => {
    function handleStorageChange(e) {
      if (e.key === 'access_token' || e.key === 'refresh_token') {
        setAuthState(getInitialAuthState())
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const value = {
    ...authState,
    loading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 🎣 Hook de conveniência
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  }
  return ctx
}