import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

export default function Login() {
  const navigate = useNavigate()
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
      const response = await fetch('http://127.0.0.1:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        navigate('/board')
      } else {
        setError('Usuário ou senha incorretos. Tente novamente.')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor. Verifique se o backend está rodando.')
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

        {/* --- O LINK PARA CRIAR CONTA AQUI --- */}
        <div className={`mt-8 text-center text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Ainda não tem uma conta? <Link to="/register" className="text-blue-500 hover:text-blue-600 hover:underline">Crie grátis aqui</Link>
        </div>

      </div>
    </div>
  )
}