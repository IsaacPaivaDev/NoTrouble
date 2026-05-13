import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

export default function Verify() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDarkMode, toggleTheme } = useTheme()
  
  // Pega o e-mail da tela anterior
  const email = location.state?.email || ''
  
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Se o cara tentar acessar essa tela sem ter passado pelo cadastro, manda pro login
  useEffect(() => {
    if (!email) {
      navigate('/login')
    }
  }, [email, navigate])

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (code.length !== 6) {
      setError('O código deve conter exatamente 6 números.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess('Conta validada! Você já pode entrar.')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        setError(data.message || 'Código inválido. Verifique e tente novamente.')
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <button onClick={toggleTheme} className="absolute top-6 right-6 text-2xl hover:scale-110 transition-transform" title="Trocar Tema">
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      <div className={`max-w-md w-full rounded-2xl shadow-2xl p-8 transform transition-all text-center ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
        <div className="mb-8">
          <div className="text-6xl mb-4">📧</div>
          <h1 className={`text-2xl font-extrabold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Verifique seu E-mail</h1>
          <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Enviamos um código de segurança de 6 dígitos para o e-mail: <br/> <span className="text-blue-500">{email}</span>
          </p>
        </div>

        {error && <div className="mb-6 p-3 bg-red-500/10 rounded-lg text-red-500 text-sm font-bold animate-fade-in">⚠️ {error}</div>}
        {success && <div className="mb-6 p-3 bg-green-500/10 rounded-lg text-green-500 text-sm font-bold animate-fade-in">✅ {success}</div>}

        <form onSubmit={handleVerify} className="flex flex-col gap-6">
          <input 
            type="text" 
            maxLength="6"
            value={code} 
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // Aceita só números
            className={`w-full p-4 rounded-lg border text-center text-3xl tracking-[1em] font-mono focus:outline-none focus:ring-4 focus:ring-blue-500 transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`} 
            placeholder="000000" 
            autoFocus
            required 
          />

          <button type="submit" disabled={isLoading || code.length !== 6} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:pointer-events-none">
            {isLoading ? 'Verificando...' : 'Validar Código'}
          </button>
        </form>

        <div className={`mt-8 text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          <Link to="/login" className="hover:text-blue-500 hover:underline">Voltar para o Login</Link>
        </div>
      </div>
    </div>
  )
}