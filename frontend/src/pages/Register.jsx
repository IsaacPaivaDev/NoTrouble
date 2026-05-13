import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

export default function Register() {
  const navigate = useNavigate()
  const { isDarkMode, toggleTheme } = useTheme()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          company_name: formData.companyName,
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess('Conta pré-criada! Enviando código...')
        
        // 🚀 AQUI ELE CHAMA A TELA DE VERIFICAÇÃO LEVANDO O E-MAIL JUNTO
        setTimeout(() => {
          navigate('/verify', { state: { email: formData.email } })
        }, 1500)
        
      } else {
        setError(data.message || 'Erro ao criar conta. Tente novamente.')
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

      <div className={`max-w-xl w-full rounded-2xl shadow-2xl p-8 transform transition-all ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent mb-2">
            Notrouble
          </h1>
          <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Crie sua conta e organize seus processos
          </p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm font-bold text-center animate-fade-in">⚠️ {error}</div>}
        {success && <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm font-bold text-center animate-fade-in">✅ {success}</div>}

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Nome</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={`w-full p-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="Seu nome" required />
            </div>
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Sobrenome</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={`w-full p-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="Seu sobrenome" required />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Nome da Empresa / Equipe</label>
            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className={`w-full p-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="Ex: Minha Startup" required />
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Email (Seu Login)</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full p-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="voce@empresa.com" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Senha</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className={`w-full p-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="••••••••" required minLength="6" />
            </div>
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Confirmar Senha</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={`w-full p-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="••••••••" required minLength="6" />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:pointer-events-none">
            {isLoading ? 'Criando conta...' : 'Criar Conta Grátis ✨'}
          </button>
        </form>

        <div className={`mt-8 text-center text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Já tem uma conta? <Link to="/login" className="text-blue-500 hover:text-blue-600 hover:underline">Faça login aqui</Link>
        </div>

      </div>
    </div>
  )
}