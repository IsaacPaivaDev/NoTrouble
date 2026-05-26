import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useBoards } from '../hooks/useBoards' 
import { apiFetch } from '../api/client'
import { getInitials, getColorFromString } from '../utils/formatters' 

// Ícones Minimalistas em SVG (A Faxina Visual)
const Icons = {
  Home: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Board: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>,
  Chart: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Logout: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Sun: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Moon: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
  Menu: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
}

export default function Settings() {
  const navigate = useNavigate()
  const { isDarkMode, toggleTheme } = useTheme()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const fileInputRef = useRef(null)

  const { currentUser, boards } = useBoards(console.error, console.log)
  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

  const [activeTab, setActiveTab] = useState('profile')
  const [isBoardsDropdownOpen, setIsBoardsDropdownOpen] = useState(false) 

  // 🚀 ESTADOS PARA GUARDAR OS INPUTS
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('') // Opcional
  
  const [companyName, setCompanyName] = useState('')
  const [themeHex, setThemeHex] = useState('#3B82F6')

  const [isSaving, setIsSaving] = useState(false)

  // 🚀 PREENCHE OS CAMPOS QUANDO O USUÁRIO CARREGA
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.first_name || '')
      setLastName(currentUser.last_name || '')
      if (currentUser.company) {
        setCompanyName(currentUser.company.name || '')
        setThemeHex(currentUser.company.theme_hex || '#3B82F6')
      }
    }
  }, [currentUser])

  const handleLogout = () => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); navigate('/login') }

  const handleAvatarClick = () => { fileInputRef.current?.click() }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const formData = new FormData()
      formData.append('file', file)
      apiFetch('/users/me/avatar/', { method: 'POST', body: formData })
      .then(res => res.json())
      .then(data => { if (data.success) window.location.reload() })
      .catch(err => console.error("Erro ao subir foto", err))
    }
  }

  // 🚀 SALVAR PERFIL
  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const payload = { first_name: firstName, last_name: lastName }
      if (password) payload.password = password

      const res = await apiFetch('/users/me/update/', {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        alert("Perfil salvo com sucesso!")
        window.location.reload()
      }
    } catch (e) {
      console.error(e)
      alert("Erro ao salvar perfil.")
    } finally {
      setIsSaving(false)
    }
  }

  // 🚀 SALVAR EMPRESA
  const handleSaveCompany = async () => {
    setIsSaving(true)
    try {
      const res = await apiFetch('/company/update/', {
        method: 'PUT',
        body: JSON.stringify({ name: companyName, theme_hex: themeHex })
      })
      if (res.ok) {
        alert("Empresa salva com sucesso!")
        window.location.reload()
      }
    } catch (e) {
      console.error(e)
      alert("Erro ao atualizar empresa. Verifique se você é Admin.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      
      {/* SIDEBAR FAXINADA */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${isDarkMode ? 'bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 text-slate-200' : 'bg-white text-slate-700'} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-500/20">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent tracking-tight">Notrouble</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded hover:bg-slate-500/20 text-slate-400 hover:text-slate-200 transition-colors">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex flex-col gap-2 px-4">
            <button onClick={() => navigate('/')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><Icons.Home /> Início / Painel</button>
            
            <div>
              <button onClick={() => setIsBoardsDropdownOpen(!isBoardsDropdownOpen)} className={`w-full flex items-center justify-between p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                <span className="flex items-center gap-3"><Icons.Board /> Quadros</span><span className="text-xs">{isBoardsDropdownOpen ? '▲' : '▼'}</span>
              </button>
              {isBoardsDropdownOpen && (
                <div className="ml-8 mt-2 flex flex-col gap-2 border-l-2 border-blue-500/30 pl-3">
                  {boards.map(b => (<button key={b.id} onClick={() => navigate('/board')} className={`text-left p-2 text-sm font-semibold hover:text-blue-500 transition-colors truncate rounded-md ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{b.name}</button>))}
                  <button onClick={() => navigate('/board')} className="text-left p-2 text-sm font-bold text-blue-500 hover:text-blue-700 transition-colors mt-2 flex items-center gap-1"><span className="text-lg">+</span> Novo Quadro</button>
                </div>
              )}
            </div>

            <button onClick={() => navigate('/data')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><Icons.Chart /> Relatórios</button>
            <button onClick={() => navigate('/team')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><Icons.Users /> Equipe</button>
            <button onClick={() => navigate('/settings')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><Icons.Settings /> Configurações</button>
          </nav>
        </div>
        <div className="p-6 border-t border-slate-500/20"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg font-bold transition-colors"><Icons.Logout /> Sair</button></div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className={`p-6 flex items-center justify-between shadow-sm z-10 transition-colors ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-md border-b border-slate-700' : 'bg-white/90 backdrop-blur-md'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className={`p-2 rounded-lg font-bold transition-colors ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}><Icons.Menu /></button>
            <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Configurações do Sistema</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={toggleTheme} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>{isDarkMode ? <Icons.Sun /> : <Icons.Moon />}</button>
            {currentUser ? (
              <div className={`h-10 w-10 rounded-full shadow-lg overflow-hidden flex items-center justify-center font-bold text-sm ${isDarkMode ? 'border border-slate-700 text-slate-100' : 'border border-slate-100 text-white'}`} style={{ backgroundColor: !currentUser.avatar_url ? (getColorFromString(currentUser.username) || '#3B82F6') : 'transparent' }}>
                {currentUser.avatar_url ? <img src={`${API_BASE}${currentUser.avatar_url}`} alt="Avatar" className="h-full w-full object-cover" /> : ((currentUser.first_name ? getInitials(currentUser.first_name, currentUser.last_name, currentUser.username) : '') || currentUser.username?.substring(0, 2).toUpperCase() || 'U')}
              </div>
            ) : <div className="h-10 w-10 rounded-full bg-slate-300 animate-pulse"></div>}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 relative custom-scrollbar">
          <div className="max-w-4xl mx-auto animate-fade-in">
            
            <div className={`rounded-3xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
              
              <div className={`flex border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <button onClick={() => setActiveTab('profile')} className={`flex items-center justify-center gap-2 flex-1 p-4 font-bold tracking-wide transition-colors ${activeTab === 'profile' ? 'border-b-2 border-blue-500 text-blue-500' : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')}`}><Icons.Users /> Meu Perfil</button>
                <button onClick={() => setActiveTab('company')} className={`flex items-center justify-center gap-2 flex-1 p-4 font-bold tracking-wide transition-colors ${activeTab === 'company' ? 'border-b-2 border-blue-500 text-blue-500' : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')}`}><Icons.Home /> Dados da Empresa</button>
              </div>

              <div className="p-8">
                {activeTab === 'profile' && (
                  <div className="space-y-8 animate-fade-in">
                    
                    {/* ZONA DA FOTO DE PERFIL */}
                    <div>
                      <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Sua Foto</h3>
                      <div className="flex items-center gap-6">
                        <div 
                          onClick={handleAvatarClick}
                          className={`h-24 w-24 rounded-full shadow-lg cursor-pointer overflow-hidden flex items-center justify-center font-bold text-2xl border-4 transition-transform hover:scale-105 ${isDarkMode ? 'border-slate-700 text-slate-100 hover:border-blue-500' : 'border-slate-100 text-white hover:border-blue-300'}`}
                          style={{ backgroundColor: currentUser && !currentUser.avatar_url ? (getColorFromString(currentUser.username) || '#3B82F6') : 'transparent' }}
                        >
                          {currentUser?.avatar_url ? (
                            <img src={`${API_BASE}${currentUser.avatar_url}`} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            currentUser ? (getInitials(currentUser.first_name, currentUser.last_name, currentUser.username) || currentUser.username?.substring(0, 2).toUpperCase()) : 'U'
                          )}
                        </div>
                        <div>
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                          <button onClick={handleAvatarClick} className={`px-4 py-2 rounded-lg font-bold text-sm border shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>Carregar Nova Foto</button>
                          <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Recomendado: JPG, PNG. Tamanho máximo 2MB.</p>
                        </div>
                      </div>
                    </div>

                    <div className={`h-px w-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>

                    {/* DADOS PESSOAIS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nome</label>
                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`} />
                      </div>
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sobrenome</label>
                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nova Senha (Opcional)</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Deixe em branco para manter a atual" className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`} />
                      </div>
                    </div>
                    
                    <button onClick={handleSaveProfile} disabled={isSaving} className="px-6 py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                      {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                )}

                {activeTab === 'company' && (
                  <div className="space-y-8 animate-fade-in">
                     <div>
                        <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nome Oficial da Empresa / Workspace</label>
                        <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} disabled={currentUser?.role !== 'ADMIN'} className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white disabled:opacity-50' : 'bg-slate-50 border-slate-300 text-slate-800 disabled:bg-slate-200 disabled:text-slate-500'}`} />
                      </div>

                      {/* 🎨 COLOR PICKER DA EMPRESA */}
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Cor Principal (Tema)</label>
                        <div className="flex items-center gap-4">
                          <input type="color" value={themeHex} onChange={e => setThemeHex(e.target.value)} disabled={currentUser?.role !== 'ADMIN'} className="h-12 w-12 rounded cursor-pointer border-0 p-0 shadow-sm disabled:opacity-50" />
                          <span className={`font-mono text-lg font-bold uppercase ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{themeHex}</span>
                        </div>
                      </div>

                      <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-200'}`}>
                        <p className={`text-sm font-medium flex items-start gap-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                          <span className="mt-0.5"><Icons.Chart /></span>
                          Apenas o Administrador pode alterar os dados da empresa. Alterar a cor ou o nome afetará todos os membros no próximo login.
                        </p>
                      </div>

                      {currentUser?.role === 'ADMIN' && (
                        <button onClick={handleSaveCompany} disabled={isSaving} className="px-6 py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                          {isSaving ? 'Atualizando...' : 'Atualizar Dados da Empresa'}
                        </button>
                      )}
                  </div>
                )}
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  )
}