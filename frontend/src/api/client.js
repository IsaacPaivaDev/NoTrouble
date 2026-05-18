// 🚀 BASE URL via variável de ambiente do Vite
// IMPORTANTE: variáveis VITE_* são injetadas em BUILD TIME, não em runtime.
// Configure VITE_API_URL no painel da Vercel ANTES do deploy/build.
// Se a env var não existir, cai no fallback localhost (modo dev local).
//
// Exportada para que páginas públicas (Login, Register, Verify) possam
// chamar endpoints sem precisar passar pelo interceptor do apiFetch.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://notrouble-vdgi.onrender.com'

// Controle de concorrência para o refresh:
// Se 5 requisições derem 401 ao mesmo tempo, queremos UM refresh só,
// não 5 refreshes em paralelo (que invalidariam o token uns dos outros).
let refreshPromise = null

// Função auxiliar para montar os cabeçalhos
const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('access_token')
  const headers = {}

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

// 🔄 Renovação de token com proteção contra chamadas concorrentes
async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) throw new Error('Sem refresh token salvo')

      const res = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      })

      if (!res.ok) throw new Error('Refresh token inválido ou expirado')

      const data = await res.json()
      localStorage.setItem('access_token', data.access)
      return data.access
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// 🧹 Limpa tudo e redireciona pro login (sem causar loop infinito)
function forceLogout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')

  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login'
  }
}

// 🚀 O NOSSO FETCH SUPERPODEROSO (use só para endpoints AUTENTICADOS)
export async function apiFetch(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData

  const buildConfig = () => ({
    ...options,
    headers: {
      ...getHeaders(isFormData),
      ...options.headers,
    },
  })

  let response = await fetch(`${API_BASE_URL}${endpoint}`, buildConfig())

  if (response.status === 401) {
    try {
      await refreshAccessToken()
      response = await fetch(`${API_BASE_URL}${endpoint}`, buildConfig())
    } catch (err) {
      forceLogout()
      return Promise.reject(err)
    }
  }

  return response
}