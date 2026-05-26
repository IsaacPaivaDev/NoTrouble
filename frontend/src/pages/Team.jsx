import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useBoards } from '../hooks/useBoards'
import { apiFetch } from '../api/client'
import PageLayout from '../components/PageLayout'
import { mediaUrl } from '../utils/media'
import { formatDate, getInitials, getColorFromString } from '../utils/formatters'

export default function Team() {
  const { isDarkMode } = useTheme()
  const { boards, currentUser, users: teamMembers, fetchUsers: fetchTeamMembers } = useBoards(console.error, console.log)

  const [invites, setInvites] = useState([])
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')
  const [inviteError, setInviteError] = useState(null)
  const [inviteSuccess, setInviteSuccess] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const MAX_USERS = currentUser?.company?.max_users || 2
  const totalUsedLicenses = (teamMembers?.length || 0) + invites.length

  useEffect(() => { fetchTeamMembers(); fetchPendingInvites() }, [])

  const fetchPendingInvites = () => {
    apiFetch('/team/invites/').then(r => r.json()).then(d => setInvites(Array.isArray(d) ? d : [])).catch(e => console.error("Erro ao carregar convites", e))
  }

  const handleSendInvite = () => {
    setInviteError(null); setInviteSuccess(null); setIsLoading(true)
    if (!inviteEmail) { setInviteError("Digite um e-mail valido."); setIsLoading(false); return }
    apiFetch('/team/invite/', { method: 'POST', body: JSON.stringify({ email: inviteEmail, role: inviteRole }) })
      .then(async r => { const d = await r.json(); if(!r.ok) throw new Error(d.message||'Erro'); setInviteSuccess(d.message); setInviteEmail(''); fetchPendingInvites(); setTimeout(()=>setIsInviteModalOpen(false),2000) })
      .catch(e => setInviteError(e.message))
      .finally(() => setIsLoading(false))
  }

  const handleCancelInvite = (id) => {
    if (!window.confirm("Cancelar este convite?")) return
    apiFetch(`/team/invites/${id}/`, { method: 'DELETE' }).then(r => { if(!r.ok) throw new Error(); fetchPendingInvites() }).catch(() => alert("Erro ao cancelar convite."))
  }

  const handleRemoveMember = (id) => {
    if (!window.confirm("Remover este membro?")) return
    apiFetch(`/team/users/${id}/`, { method: 'DELETE' }).then(r => { if(!r.ok) throw new Error(); fetchTeamMembers() }).catch(() => alert("Erro ao remover membro."))
  }

  const getRoleBadge = (role) => {
    const styles = { ADMIN: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800', MANAGER: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', MEMBER: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' }
    const labels = { ADMIN: 'Admin', MANAGER: 'Gerencial', MEMBER: 'Operacional' }
    return <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md border ${styles[role]||''}`}>{labels[role]||role}</span>
  }

  return (
    <PageLayout boards={boards} currentUser={currentUser}>
      <div className="max-w-6xl mx-auto">

        {/* Header da pagina */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Equipe</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-2" />
            <p className={`mt-3 text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Gerencie membros, convites e licencas da sua empresa.</p>
          </div>
          <div className="flex flex-col items-stretch md:items-end gap-2">
            <div className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Licencas: <span className={totalUsedLicenses >= MAX_USERS ? 'text-red-500' : 'text-blue-500'}>{totalUsedLicenses}</span> / {MAX_USERS}
            </div>
            <button onClick={() => setIsInviteModalOpen(true)} disabled={totalUsedLicenses >= MAX_USERS} className="px-5 py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed">+ Convidar Membro</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ativos */}
          <div className={`lg:col-span-2 rounded-3xl border shadow-sm overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`p-6 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}><h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Usuarios Ativos</h3></div>
            <div className="divide-y dark:divide-slate-700/50 divide-slate-100">
              {teamMembers.map(m => (
                <div key={m.id} className={`p-6 flex items-center justify-between ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: !m.avatar_url ? (getColorFromString(m.username) || '#3B82F6') : 'transparent' }}>
                      {m.avatar_url ? <img src={mediaUrl(m.avatar_url)} alt="" className="h-full w-full object-cover" /> : (getInitials(m.first_name, m.last_name, m.username) || m.username.substring(0,2).toUpperCase())}
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{m.first_name ? `${m.first_name} ${m.last_name}` : m.username}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{m.email || m.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getRoleBadge(m.role)}
                    {currentUser?.role === 'ADMIN' && currentUser.id !== m.id && (
                      <button onClick={() => handleRemoveMember(m.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Remover">✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pendentes */}
          <div className={`rounded-3xl border shadow-sm overflow-hidden h-fit ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`p-6 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <h3 className={`text-lg font-bold flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                Convites Pendentes <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">{invites.length}</span>
              </h3>
            </div>
            <div className="p-2">
              {invites.length === 0 ? <div className="p-6 text-center text-sm italic opacity-50">Nenhum convite pendente.</div> : invites.map(inv => (
                <div key={inv.id} className={`p-4 m-2 rounded-xl border flex flex-col gap-2 ${isDarkMode ? 'bg-slate-900/50 border-slate-700 hover:border-slate-500' : 'bg-slate-50 border-slate-200 hover:border-blue-200'}`}>
                  <p className={`font-bold text-sm truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{inv.email}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col md:flex-row gap-2 md:items-center">{getRoleBadge(inv.role)}<span className={`text-[10px] uppercase font-bold tracking-widest ${isDarkMode?'text-slate-500':'text-slate-400'}`}>{formatDate(inv.created_at)}</span></div>
                    {(currentUser?.role==='ADMIN'||currentUser?.role==='MANAGER')&&<button onClick={()=>handleCancelInvite(inv.id)} className="text-slate-400 hover:text-red-500 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800/50 text-xs">Cancelar</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de convite */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl flex flex-col animate-fade-in ${isDarkMode?'bg-slate-800 text-slate-200':'bg-white text-slate-800'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${isDarkMode?'border-slate-700':'border-slate-200'}`}><h2 className="text-xl font-bold">Convidar Novo Membro</h2><button onClick={()=>setIsInviteModalOpen(false)} className="text-slate-400 hover:text-red-500 text-xl font-bold">&times;</button></div>
            <div className="p-6 flex flex-col gap-5">
              {inviteError && <div className="p-3 bg-red-100 text-red-700 text-sm font-bold rounded-lg border border-red-200">{inviteError}</div>}
              {inviteSuccess && <div className="p-3 bg-green-100 text-green-700 text-sm font-bold rounded-lg border border-green-200">{inviteSuccess}</div>}
              <div><label className="block text-xs font-bold uppercase tracking-wide mb-2 opacity-80">E-mail</label><input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} autoFocus className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${isDarkMode?'bg-slate-900 border-slate-700 text-white':'bg-slate-50 border-slate-300'}`} placeholder="joao@empresa.com"/></div>
              <div><label className="block text-xs font-bold uppercase tracking-wide mb-2 opacity-80">Nivel de Acesso</label><select value={inviteRole} onChange={e=>setInviteRole(e.target.value)} className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm cursor-pointer ${isDarkMode?'bg-slate-900 border-slate-700 text-white':'bg-slate-50 border-slate-300'}`}><option value="MEMBER">Operacional</option><option value="MANAGER">Gerencial</option>{currentUser?.role==='ADMIN'&&<option value="ADMIN">Administrador</option>}</select></div>
            </div>
            <div className={`p-6 border-t flex justify-end gap-3 ${isDarkMode?'border-slate-700 bg-slate-800/50':'border-slate-200 bg-slate-50/50'}`}>
              <button onClick={()=>setIsInviteModalOpen(false)} className={`px-5 py-2 rounded-lg font-bold ${isDarkMode?'hover:bg-slate-700':'hover:bg-slate-200'}`}>Cancelar</button>
              <button onClick={handleSendInvite} disabled={isLoading} className="px-5 py-2 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg disabled:opacity-50">{isLoading ? 'Enviando...' : 'Enviar Convite'}</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}