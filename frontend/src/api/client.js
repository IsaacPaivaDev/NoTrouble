const API_BASE_URL = 'http://127.0.0.1:8000/api'

// Função auxiliar para montar os cabeçalhos
const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('access_token')
  const headers = {}
  
  // Se não for envio de arquivo (FormData), coloca o tipo como JSON
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  
  // Se tiver o crachá (token), adiciona na requisição
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

// 🚀 O NOSSO NOVO FETCH SUPERPODEROSO
export async function apiFetch(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData
  
  const config = {
    ...options,
    headers: {
      ...getHeaders(isFormData),
      ...options.headers, // Mantém qualquer header extra que passar
    },
  }

  // 1. Tenta fazer a requisição original
  let response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  // 2. INTERCEPTOR: Se der 401 (Não Autorizado / Token Expirado)
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token')
    
    if (refreshToken) {
      try {
        // Tenta ir no backend pegar um token novo usando o refresh_token
        const refreshRes = await fetch(`${API_BASE_URL}/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken })
        })

        if (refreshRes.ok) {
          const data = await refreshRes.json()
          // Salva o token novinho em folha
          localStorage.setItem('access_token', data.access) 

          // 3. Atualiza os cabeçalhos e refaz a requisição original silenciosamente!
          config.headers = {
            ...getHeaders(isFormData),
            ...options.headers,
          }
          response = await fetch(`${API_BASE_URL}${endpoint}`, config)
          
        } else {
          // O refresh token também expirou (geralmente dura dias ou semanas)
          throw new Error('Sessão expirada')
        }
      } catch (err) {
        // Se der qualquer pau na renovação, limpa a casa e expulsa pro login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(err)
      }
    } else {
      // Tomou 401 e nem refresh token tem. Expulsa.
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
  }

  return response
}