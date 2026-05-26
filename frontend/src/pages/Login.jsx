import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { API_BASE_URL } from '../api/client'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // 🛡️ Trava de Segurança: Garante que a rota /api exista na URL,
      // independente de como a variável de ambiente foi preenchida.
      const baseUrl = API_BASE_URL.endsWith('/api') 
        ? API_BASE_URL 
        : `${API_BASE_URL.replace(/\/$/, '')}/api`

      // Agora a chamada vai corretamente para /api/token/
      const response = await fetch(`${baseUrl}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Salva tokens + estado via contexto (que também escreve no localStorage)
        login({
          access: data.access,
          refresh: data.refresh,
          user: { username }, // O endpoint /token/ não retorna user; salva só o username por enquanto
        })

        // 🎯 Volta pra rota que o usuário tentou abrir antes do redirect.
        // Ex: tentou abrir /board sem login → caiu aqui → após login volta pra /board.
        // Se veio direto pro /login, vai pra home.
        const from = location.state?.from?.pathname || '/'
        navigate(from, { replace: true })
      } else {
        // Mensagens mais úteis baseadas no status real do backend
        if (response.status === 401) {
          setError('Usuário ou senha incorretos. Tente novamente.')
        } else {
          setError(data.detail || 'Não foi possível autenticar. Tente novamente.')
        }
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor. Verifique sua conexão.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>

      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 text-2xl hover:scale-110 transition-transform"
        title="Trocar Tema"
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      <div className={`max-w-md w-full rounded-2xl shadow-2xl p-8 transform transition-all ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent mb-2">
            Notrouble
          </h1>
          <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Faça login para acessar seus quadros
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm font-bold text-center animate-fade-in">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Usuário (Email)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full p-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              placeholder="Digite seu usuário..."
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? 'Autenticando...' : 'Entrar no Sistema 🚀'}
          </button>
        </form>

        <div className={`mt-8 text-center text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Ainda não tem uma conta? <Link to="/register" className="text-blue-500 hover:text-blue-600 hover:underline">Crie grátis aqui</Link>
        </div>

      </div>
    </div>
  )
}