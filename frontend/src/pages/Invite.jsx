import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../api/client'

export default function Invite() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Se não tiver token na URL, avisa o usuário
  useEffect(() => {
    if (!token) setError('Link de convite inválido ou ausente.')
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) return
    setError(''); setSuccess(''); setLoading(true)

    try {
      const res = await apiFetch('/team/invite/accept/', {
        method: 'POST',
        body: JSON.stringify({ token, first_name: firstName, last_name: lastName, password })
      })
      const data = await res.json()

      if (res.ok) {
        setSuccess(data.message)
        setTimeout(() => navigate('/login'), 3000)
      } else {
        setError(data.message || 'Erro ao processar o convite.')
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans p-4">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 animate-fade-in">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-2">Notrouble</h1>
          <h2 className="text-xl font-bold text-white">Você foi convidado! 🎉</h2>
          <p className="text-slate-400 text-sm mt-2">Preencha seus dados para acessar a plataforma.</p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm font-bold text-center">{error}</div>}
        {success && <div className="mb-6 p-4 bg-green-900/30 border border-green-800 rounded-lg text-green-400 text-sm font-bold text-center">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Nome</label>
              <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} disabled={loading || !token || success} className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Seu nome" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Sobrenome</label>
              <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} disabled={loading || !token || success} className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Seu sobrenome" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Crie uma Senha</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} disabled={loading || !token || success} className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading || !token || success} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 shadow-lg shadow-blue-900/50 mt-4">
            {loading ? 'Criando conta...' : 'Aceitar Convite e Entrar'}
          </button>
        </form>

      </div>
    </div>
  )
}