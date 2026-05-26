import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { mediaUrl } from '../utils/media'
import { getInitials, getColorFromString } from '../utils/formatters'
import {
  IconMenu, IconHome, IconBoard, IconChart, IconUsers,
  IconSettings, IconLogout, IconSun, IconMoon, IconPlus,
} from '../utils/icons'

const NAV_ITEMS = [
  { path: '/',         label: 'Inicio',         Icon: IconHome },
  { path: '/board',    label: 'Quadros',         Icon: IconBoard, hasBoards: true },
  { path: '/data',     label: 'Relatorios',      Icon: IconChart },
  { path: '/team',     label: 'Equipe',          Icon: IconUsers },
  { path: '/settings', label: 'Configuracoes',   Icon: IconSettings },
]

/**
 * Props:
 *  - children, boards, currentUser, activeBoardId
 *  - onBoardSelect, onCreateBoard, headerActions
 *  - bgClass    classe CSS p/ background do conteudo (override do padrao)
 *  - bgStyle    objeto style p/ background-image (wallpaper)
 */
export default function PageLayout({
  children, boards = [], currentUser = null, activeBoardId = null,
  onBoardSelect, onCreateBoard, headerActions,
  bgClass, bgStyle,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isBoardsOpen, setIsBoardsOpen] = useState(false)

  const currentPath = location.pathname
  const handleLogout = () => { logout(); navigate('/login') }
  const handleNavClick = (path) => { navigate(path); setIsSidebarOpen(false) }
  const handleBoardClick = (boardId) => { if (onBoardSelect) onBoardSelect(boardId); else navigate(`/board?id=${boardId}`); setIsSidebarOpen(false) }
  const handleCreateBoard = () => { if (onCreateBoard) onCreateBoard(); else navigate('/board'); setIsSidebarOpen(false) }
  const isActive = (path) => path === '/' ? currentPath === '/' : currentPath.startsWith(path)

  // Background: props override > theme default
  const defaultBg = isDarkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100'

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${isDarkMode ? 'bg-slate-900 border-r border-slate-800 text-slate-200' : 'bg-white text-slate-700'} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-500/20">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">Notrouble</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded hover:bg-slate-500/20 transition-colors text-slate-400 hover:text-slate-200">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex flex-col gap-1 px-4">
            {NAV_ITEMS.map(({ path, label, Icon, hasBoards: hb }) => {
              const active = isActive(path)
              if (hb && boards.length > 0) {
                return (
                  <div key={path}>
                    <button onClick={() => setIsBoardsOpen(!isBoardsOpen)} className={`w-full flex items-center justify-between p-3 rounded-lg font-semibold text-sm transition-colors ${active ? (isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600') : (isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100')}`}>
                      <span className="flex items-center gap-3"><Icon /> {label}</span>
                      <span className="text-[10px]">{isBoardsOpen ? '▲' : '▼'}</span>
                    </button>
                    {isBoardsOpen && (
                      <div className="ml-8 mt-1 flex flex-col gap-1 border-l-2 border-blue-500/30 pl-3">
                        {boards.map(b => (
                          <button key={b.id} onClick={() => handleBoardClick(b.id)} className={`text-left p-2 text-sm font-medium hover:text-blue-500 transition-colors truncate rounded-md ${activeBoardId === b.id ? (isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700') : ''}`}>{b.name}</button>
                        ))}
                        <button onClick={handleCreateBoard} className="text-left p-2 text-sm font-semibold text-blue-500 hover:text-blue-700 transition-colors mt-1 flex items-center gap-2"><IconPlus /> Novo Quadro</button>
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <button key={path} onClick={() => handleNavClick(path)} className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold text-sm transition-colors ${active ? (isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600') : (isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100')}`}><Icon /> {label}</button>
              )
            })}
          </nav>
        </div>
        <div className="p-6 border-t border-slate-500/20">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-lg font-semibold text-sm text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"><IconLogout /> Sair do Sistema</button>
        </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* MAIN */}
      <div
        className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-500 ${bgClass || defaultBg}`}
        style={{
          ...(bgStyle || {}),
          backgroundSize: bgStyle?.backgroundImage ? 'cover' : undefined,
          backgroundPosition: bgStyle?.backgroundImage ? 'center' : undefined,
        }}
      >
        <header className={`px-6 py-4 flex items-center justify-between shadow-sm z-10 transition-colors ${isDarkMode ? 'bg-slate-800/90 backdrop-blur-md border-b border-slate-700' : 'bg-white/90 backdrop-blur-md'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}><IconMenu /></button>
            <h1 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'} flex items-center gap-3 tracking-tight`}>
              {currentUser?.company?.name ? (
                <>
                  <span className="uppercase">{currentUser.company.name}</span>
                  <span className="text-[10px] font-normal opacity-40 border-l border-slate-500 pl-3 tracking-widest hidden md:inline-block">POWERED BY NOTROUBLE</span>
                </>
              ) : (
                <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Notrouble</span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {headerActions}
            <button onClick={toggleTheme} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>{isDarkMode ? <IconSun /> : <IconMoon />}</button>
            {currentUser && (
              <div className={`h-9 w-9 rounded-full shadow-md overflow-hidden flex items-center justify-center font-bold text-xs ${isDarkMode ? 'border border-slate-700 text-slate-100' : 'border border-slate-100 text-white'}`} style={{ backgroundColor: !currentUser.avatar_url ? (getColorFromString(currentUser.username) || '#3B82F6') : 'transparent' }} title={currentUser.first_name || currentUser.username}>
                {currentUser.avatar_url ? <img src={mediaUrl(currentUser.avatar_url)} alt="" className="h-full w-full object-cover" /> : (getInitials(currentUser.first_name, currentUser.last_name, currentUser.username) || currentUser.username?.substring(0,2).toUpperCase() || 'U')}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 relative" onClick={() => { if(isSidebarOpen) setIsSidebarOpen(false) }}>
          {children}
        </main>
      </div>
    </div>
  )
}