import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useBoards } from '../hooks/useBoards' 
import { apiFetch } from '../api/client'
import { formatDate, getInitials, getColorFromString } from '../utils/formatters' 

export default function Team() {
  const navigate = useNavigate()
  const { isDarkMode, toggleTheme } = useTheme()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const { currentUser, users: teamMembers, fetchUsers: fetchTeamMembers } = useBoards(console.error, console.log)
  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

  const [invites, setInvites] = useState([])
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')
  const [inviteError, setInviteError] = useState(null)
  const [inviteSuccess, setInviteSuccess] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // O Total de licenças compradas vs utilizadas
  // Se o backend futuramente mandar o MAX_USERS no currentUser.company.max_users, a gente puxa de lá. Por enquanto fica o limite fixo aqui.
  const MAX_USERS = currentUser?.company?.max_users || 2 
  const totalUsedLicenses = (teamMembers?.length || 0) + invites.length

  useEffect(() => {
    fetchTeamMembers()
    fetchPendingInvites()
  }, [])

  const fetchPendingInvites = () => {
    apiFetch('/team/invites/')
      .then(res => res.json())
      .then(data => setInvites(Array.isArray(data) ? data : []))
      .catch(err => console.error("Erro ao carregar convites", err))
  }

  const handleLogout = () => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); navigate('/login') }

  const handleSendInvite = () => {
    setInviteError(null); setInviteSuccess(null); setIsLoading(true);
    if (!inviteEmail) { setInviteError("Digite um e-mail válido."); setIsLoading(false); return; }

    apiFetch('/team/invite/', {
      method: 'POST',
      body: JSON.stringify({ email: inviteEmail, role: inviteRole })
    })
    .then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erro ao enviar convite')
      setInviteSuccess(data.message)
      setInviteEmail('')
      fetchPendingInvites()
      setTimeout(() => setIsInviteModalOpen(false), 2000)
    })
    .catch(err => setInviteError(err.message))
    .finally(() => setIsLoading(false))
  }

  // 🚀 AQUI ESTÁ A NOVA FUNÇÃO DE CANCELAR O CONVITE!
  const handleCancelInvite = (inviteId) => {
    if (!window.confirm("Deseja realmente cancelar este convite? Isso liberará a licença imediatamente.")) return;
    
    apiFetch(`/team/invites/${inviteId}/`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error()
        fetchPendingInvites() // Atualiza a lista na hora!
      })
      .catch(() => alert("Erro ao cancelar convite."))
  }

  const handleRemoveMember = (userId) => {
    if(!window.confirm("Remover este membro revogará o acesso dele a todos os quadros da empresa. Confirma?")) return;
    apiFetch(`/team/users/${userId}/`, { method: 'DELETE' })
      .then(res => {
        if(!res.ok) throw new Error()
        fetchTeamMembers()
      })
      .catch(() => alert("Erro ao remover membro. Apenas admins podem fazer isso."))
  }

  const getRoleBadge = (role) => {
    switch(role) {
      case 'ADMIN': return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase rounded-md dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">👑 Admin</span>
      case 'MANAGER': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-md dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">Gerencial</span>
      case 'MEMBER': return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-md dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Operacional</span>
      default: return null
    }
  }

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${isDarkMode ? 'bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 text-slate-200' : 'bg-white text-slate-700'} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-500/20">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">Notrouble</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded hover:bg-slate-500/20 px-1">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex flex-col gap-2 px-4">
            <button onClick={() => navigate('/')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>🏠 Início / Painel</button>
            <button onClick={() => navigate('/board')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>📊 Ir para os Quadros</button>
            <button onClick={() => navigate('/data')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>📈 Relatórios</button>
            <button onClick={() => navigate('/team')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>👥 Equipe</button>
            <button onClick={() => navigate('/settings')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>⚙️ Configurações</button>
          </nav>
        </div>
        <div className="p-6 border-t border-slate-500/20"><button onClick={handleLogout} className="w-full p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg font-bold">🚪 Sair</button></div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className={`p-6 flex items-center justify-between shadow-sm z-10 transition-colors ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-md border-b border-slate-700' : 'bg-white/90 backdrop-blur-md'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className={`p-2 rounded-lg font-bold transition-colors ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}>☰ Menu</button>
            <h1 className={`text-xl md:text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'} flex items-center gap-3 tracking-tight`}>
              {currentUser?.company?.name ? (
                <><span className="uppercase">{currentUser.company.name}</span><span className="text-xs font-normal opacity-40 border-l-2 border-slate-500 pl-3 tracking-widest hidden md:inline-block">POWERED BY NOTROUBLE</span></>
              ) : (<span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Notrouble</span>)}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={toggleTheme} className="text-2xl hover:scale-110 transition-transform">{isDarkMode ? '☀️' : '🌙'}</button>
            {currentUser ? (
              <div className={`h-10 w-10 rounded-full shadow-lg overflow-hidden flex items-center justify-center font-bold text-sm ${isDarkMode ? 'border border-slate-700 text-slate-100' : 'border border-slate-100 text-white'}`} style={{ backgroundColor: !currentUser.avatar_url ? (getColorFromString(currentUser.username) || '#3B82F6') : 'transparent' }}>
                {currentUser.avatar_url ? <img src={`${API_BASE}${currentUser.avatar_url}`} alt="Avatar" className="h-full w-full object-cover" /> : ((currentUser.first_name ? getInitials(currentUser.first_name, currentUser.last_name, currentUser.username) : '') || currentUser.username?.substring(0, 2).toUpperCase() || 'U')}
              </div>
            ) : <div className="h-10 w-10 rounded-full bg-slate-300 animate-pulse"></div>}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 relative custom-scrollbar">
          <div className="max-w-5xl mx-auto animate-fade-in">
            
            {/* CABEÇALHO DA EQUIPE & LICENÇAS */}
            <div className={`p-6 md:p-8 rounded-3xl shadow-sm border mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div>
                <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Membros da Equipe</h2>
                <p className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Gerencie acessos e controle o nível de permissão da sua operação.</p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Licenças Utilizadas</p>
                  <p className={`text-xl font-black ${totalUsedLicenses >= MAX_USERS ? 'text-red-500' : 'text-blue-500'}`}>{totalUsedLicenses} / {MAX_USERS}</p>
                </div>
                {/* O BOTÃO DE CONVIDAR */}
                <button 
                  onClick={() => setIsInviteModalOpen(true)}
                  className="px-6 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <span className="text-xl">+</span> Adicionar Membro
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LISTA DE USUÁRIOS ATIVOS */}
              <div className={`lg:col-span-2 rounded-3xl border shadow-sm overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className={`p-6 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Usuários Ativos</h3>
                </div>
                <div className="divide-y dark:divide-slate-700/50 divide-slate-100">
                  {teamMembers.map(member => (
                    <div key={member.id} className={`p-6 flex items-center justify-between transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: !member.avatar_url ? (getColorFromString(member.username) || '#3B82F6') : 'transparent' }}>
                          {member.avatar_url ? <img src={`${API_BASE}${member.avatar_url}`} alt="Avatar" className="h-full w-full object-cover" /> : getInitials(member.first_name, member.last_name, member.username) || member.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{member.first_name ? `${member.first_name} ${member.last_name}` : member.username}</p>
                          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{member.email || member.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getRoleBadge(member.role)}
                        {currentUser?.role === 'ADMIN' && currentUser.id !== member.id && (
                          <button onClick={() => handleRemoveMember(member.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Remover Membro">🗑️</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* LISTA DE CONVITES PENDENTES COM BOTÃO CANCELAR */}
              <div className={`rounded-3xl border shadow-sm overflow-hidden h-fit ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className={`p-6 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <h3 className={`text-lg font-bold flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    Convites Pendentes <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">{invites.length}</span>
                  </h3>
                </div>
                <div className="p-2">
                  {invites.length === 0 ? (
                    <div className="p-6 text-center text-sm italic opacity-50">Nenhum convite pendente.</div>
                  ) : (
                    invites.map(invite => (
                      <div key={invite.id} className={`p-4 m-2 rounded-xl border flex flex-col gap-2 transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-700 hover:border-slate-500' : 'bg-slate-50 border-slate-200 hover:border-blue-200'}`}>
                        <p className={`font-bold text-sm truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{invite.email}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col md:flex-row gap-2 md:items-center">
                            {getRoleBadge(invite.role)}
                            <span className={`text-[10px] uppercase font-bold tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{formatDate(invite.created_at)}</span>
                          </div>
                          
                          {/* 🚀 O BOTÃO DE CANCELAR AQUI */}
                          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') && (
                            <button 
                              onClick={() => handleCancelInvite(invite.id)} 
                              className="text-slate-400 hover:text-red-500 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-800/50" 
                              title="Cancelar este convite"
                            >
                              ❌
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* MODAL DE CONVITE */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl flex flex-col animate-fade-in ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <h2 className="text-xl font-bold">Convidar Novo Membro</h2>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-500 hover:text-red-500 text-2xl font-bold">×</button>
            </div>
            
            <div className="p-6 flex flex-col gap-5">
              {inviteError && <div className="p-3 bg-red-100 text-red-700 text-sm font-bold rounded-lg border border-red-200">⚠️ {inviteError}</div>}
              {inviteSuccess && <div className="p-3 bg-green-100 text-green-700 text-sm font-bold rounded-lg border border-green-200">✅ {inviteSuccess}</div>}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2 opacity-80">E-mail do Membro</label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} autoFocus className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} placeholder="joao@empresa.com" />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2 opacity-80">Nível de Acesso (Papel)</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm cursor-pointer appearance-none ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}>
                  <option value="MEMBER">Operacional (Apenas a sua baia e OKRs)</option>
                  <option value="MANAGER">Gerencial (Visão total, cria quadros, convida pessoas)</option>
                  {currentUser?.role === 'ADMIN' && <option value="ADMIN">Administrador (Acesso Financeiro e Pagamentos)</option>}
                </select>
              </div>
            </div>

            <div className={`p-6 border-t flex justify-end gap-3 ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50/50'}`}>
              <button onClick={() => setIsInviteModalOpen(false)} className={`px-5 py-2 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}>Cancelar</button>
              <button onClick={handleSendInvite} disabled={isLoading} className="px-5 py-2 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center gap-2">
                {isLoading ? 'Enviando...' : '✉️ Enviar Convite'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}