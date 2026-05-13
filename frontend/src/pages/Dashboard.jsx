import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBoards } from '../hooks/useBoards'
import { useTheme } from '../contexts/ThemeContext'
import { getInitials, getColorFromString } from '../utils/formatters'

// Ícones Minimalistas em SVG
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

export default function Dashboard() {
  const navigate = useNavigate()
  const { isDarkMode, toggleTheme } = useTheme()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // 🚀 Menu Dropdown de Quadros Ativado
  const [isBoardsDropdownOpen, setIsBoardsDropdownOpen] = useState(false) 

  const showNotification = useCallback((message, type = 'success') => { console.log(message) }, [])
  const showError = useCallback((message) => { console.error(message) }, [])

  const { boards, users, currentUser, loading } = useBoards(showError, showNotification)

  const [bgTheme, setBgTheme] = useState(localStorage.getItem('notrouble_bg') || 'default')
  useEffect(() => { localStorage.setItem('notrouble_bg', bgTheme) }, [bgTheme])

  const themeClasses = {
    default: isDarkMode ? 'bg-slate-900' : 'bg-slate-50',
    ocean: 'bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900',
    midnight: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-black',
    forest: 'bg-gradient-to-br from-emerald-900 via-slate-900 to-black',
  }

  let totalCards = 0;
  let delayedCards = 0;
  let completedCards = 0;
  const today = new Date().toISOString().split('T')[0];

  boards.forEach(board => {
    const lastStageId = board.stages.length > 0 ? board.stages[board.stages.length - 1].id : null;
    board.stages.forEach(stage => {
      totalCards += stage.cards.length;
      stage.cards.forEach(card => {
        if (stage.id === lastStageId) completedCards++;
        else if (card.due_date && card.due_date < today) delayedCards++;
      });
    });
  });

  const handleLogout = () => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); navigate('/login') }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500 bg-slate-900">Carregando sua Mesa de Trabalho...</div>

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${themeClasses[bgTheme]}`}>
      
      {/* --- SIDEBAR FAXINADA --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${isDarkMode ? 'bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 text-slate-200' : 'bg-white text-slate-700'} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-500/20">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent tracking-tight">Notrouble</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded hover:bg-slate-500/20 text-slate-400 hover:text-slate-200 transition-colors">✕</button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex flex-col gap-2 px-4">
            <button onClick={() => { navigate('/'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <Icons.Home /> Início / Painel
            </button>
            
            {/* 🚀 DROPDOWN DE QUADROS ADICIONADO AO DASHBOARD */}
            <div>
              <button onClick={() => setIsBoardsDropdownOpen(!isBoardsDropdownOpen)} className={`w-full flex items-center justify-between p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                <span className="flex items-center gap-3"><Icons.Board /> Quadros</span>
                <span className="text-xs">{isBoardsDropdownOpen ? '▲' : '▼'}</span>
              </button>
              {isBoardsDropdownOpen && (
                <div className="ml-8 mt-2 flex flex-col gap-2 border-l-2 border-blue-500/30 pl-3">
                  {boards.map(b => (
                    <button key={b.id} onClick={() => navigate('/board')} className={`text-left p-2 text-sm font-semibold hover:text-blue-500 transition-colors truncate rounded-md ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {b.name}
                    </button>
                  ))}
                  <button onClick={() => navigate('/board')} className="text-left p-2 text-sm font-bold text-blue-500 hover:text-blue-700 transition-colors mt-2 flex items-center gap-1">
                    <span className="text-lg">+</span> Novo Quadro
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => { navigate('/data'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
              <Icons.Chart /> Relatórios
            </button>
            
            <button onClick={() => { navigate('/team'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
              <Icons.Users /> Equipe
            </button>
            
            {/* 🚀 OPÇÃO DE CONFIGURAÇÕES ADICIONADA */}
            <button onClick={() => { navigate('/settings'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
              <Icons.Settings /> Configurações
            </button>

          </nav>
        </div>
        
        <div className="p-6 border-t border-slate-500/20">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg font-bold transition-colors">
            <Icons.Logout /> Sair
          </button>
        </div>
      </aside>

      {/* --- ÁREA PRINCIPAL --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className={`p-6 flex items-center justify-between shadow-sm z-10 transition-colors ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-md border-b border-slate-700' : 'bg-white/90 backdrop-blur-md'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className={`p-2 rounded-lg font-bold transition-colors ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              <Icons.Menu />
            </button>
            <h1 className={`text-xl md:text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'} flex items-center gap-3 tracking-tight`}>
            {currentUser?.company?.name ? (
              <>
                <span className="uppercase">{currentUser.company.name}</span>
                <span className="text-xs font-normal opacity-40 border-l-2 border-slate-500 pl-3 tracking-widest hidden md:inline-block">POWERED BY NOTROUBLE</span>
              </>
            ) : (
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Notrouble</span>
            )}
          </h1>
          </div>
          <button onClick={toggleTheme} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>
            {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
          </button>
        </header>

        <main className="flex-1 overflow-auto p-8 relative custom-scrollbar">
          <div className="max-w-6xl mx-auto animate-fade-in">
            
            <div className={`p-8 rounded-3xl shadow-lg mb-8 border flex flex-col md:flex-row items-center justify-between gap-6 transition-colors ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-lg border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-6">
                {currentUser ? (
                  <div className="h-24 w-24 rounded-full shadow-2xl border-4 border-slate-500/30 overflow-hidden flex items-center justify-center font-bold text-3xl text-white" style={{ backgroundColor: !currentUser.avatar_url ? getColorFromString(currentUser.username) : 'transparent' }}>
                    {currentUser.avatar_url ? <img src={`http://127.0.0.1:8000${currentUser.avatar_url}`} alt="Avatar" className="h-full w-full object-cover" /> : getInitials(currentUser.first_name, currentUser.last_name, currentUser.username)}
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-full bg-slate-300 animate-pulse"></div>
                )}
                <div>
                  <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    Olá, {currentUser?.first_name || currentUser?.username?.split('@')[0] || 'Membro'}!
                  </h2> 
                  <p className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Aqui está o resumo da sua operação hoje.</p>
                </div>
              </div>

              {isDarkMode && (
                <div className="flex flex-col items-center md:items-end gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tema de Fundo</span>
                  <div className="flex gap-2">
                    <button onClick={() => setBgTheme('default')} className={`h-8 w-8 rounded-full border-2 bg-slate-900 ${bgTheme === 'default' ? 'border-blue-500 scale-110' : 'border-slate-600 hover:scale-105'}`} title="Padrão"></button>
                    <button onClick={() => setBgTheme('ocean')} className={`h-8 w-8 rounded-full border-2 bg-gradient-to-br from-blue-600 to-slate-900 ${bgTheme === 'ocean' ? 'border-blue-500 scale-110' : 'border-slate-600 hover:scale-105'}`} title="Oceano"></button>
                    <button onClick={() => setBgTheme('midnight')} className={`h-8 w-8 rounded-full border-2 bg-gradient-to-br from-purple-600 to-black ${bgTheme === 'midnight' ? 'border-blue-500 scale-110' : 'border-slate-600 hover:scale-105'}`} title="Nebulosa"></button>
                    <button onClick={() => setBgTheme('forest')} className={`h-8 w-8 rounded-full border-2 bg-gradient-to-br from-emerald-600 to-black ${bgTheme === 'forest' ? 'border-blue-500 scale-110' : 'border-slate-600 hover:scale-105'}`} title="Floresta"></button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total de Quadros</p>
                <p className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{boards.length}</p>
              </div>
              <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">Cards Concluídos</p>
                <p className="text-4xl font-black text-blue-500">{completedCards}</p>
              </div>
              <div className={`p-6 rounded-2xl border shadow-sm ${delayedCards > 0 ? (isDarkMode ? 'bg-rose-900/30 border-rose-800' : 'bg-red-50 border-red-200') : (isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200')}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${delayedCards > 0 ? 'text-red-500' : 'text-slate-500'}`}>Cards Atrasados</p>
                <p className={`text-4xl font-black ${delayedCards > 0 ? 'text-red-500 animate-pulse' : (isDarkMode ? 'text-white' : 'text-slate-800')}`}>{delayedCards}</p>
              </div>
              <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total de Cards</p>
                <p className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{totalCards}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Seus Projetos / Quadros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {boards.map(board => (
                    <div key={board.id} onClick={() => navigate('/board')} className={`p-5 rounded-2xl border shadow-sm cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md group ${isDarkMode ? 'bg-slate-800/80 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-400'}`}>
                      <h4 className={`font-bold text-lg mb-2 truncate group-hover:text-blue-500 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{board.name}</h4>
                      <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-500">
                        <span>{board.stages.length} Etapas</span>
                        <span>{board.stages.reduce((acc, stage) => acc + stage.cards.length, 0)} Cards</span>
                      </div>
                    </div>
                  ))}
                  <div onClick={() => navigate('/board')} className={`p-5 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors ${isDarkMode ? 'border-slate-700 text-slate-500 hover:text-blue-400 hover:border-blue-500 bg-slate-800/30' : 'border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-400 bg-slate-50/50'}`}>
                    <span className="font-bold text-sm flex items-center gap-2"><span className="text-xl">+</span> Criar Novo Quadro</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`text-lg font-bold mb-4 flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  Membros da Equipe <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">{users.length}</span>
                </h3>
                <div className={`p-6 rounded-2xl border shadow-sm flex flex-col gap-4 ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                  {users.map(user => (
                    <div key={user.id} className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                      <div className="h-10 w-10 rounded-full shadow-sm border border-slate-500/20 overflow-hidden flex items-center justify-center font-bold text-xs text-white" style={{ backgroundColor: !user.avatar_url ? getColorFromString(user.username) : 'transparent' }}>
                        {user.avatar_url ? <img src={`http://127.0.0.1:8000${user.avatar_url}`} alt="Avatar" className="h-full w-full object-cover" /> : getInitials(user.first_name, user.last_name, user.username)}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-slate-500">@{user.username.split('@')[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  )
}