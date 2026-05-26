import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBoards } from '../hooks/useBoards'
import { useTheme } from '../contexts/ThemeContext'
import PageLayout from '../components/PageLayout'
import { apiFetch } from '../api/client'
import { mediaUrl } from '../utils/media'
import { isOverdue } from '../utils/dates'
import { getInitials, getColorFromString } from '../utils/formatters'
import { IconPlus, IconX } from '../utils/icons'

// Gradientes de fundo — o usuario escolhe qual aplicar
const BG_THEMES = {
  default:  { label: 'Padrao',   dark: 'bg-slate-900',                                              light: 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100', preview: 'bg-slate-900' },
  ocean:    { label: 'Oceano',   dark: 'bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900', light: 'bg-gradient-to-br from-blue-100 via-sky-50 to-slate-100',  preview: 'bg-gradient-to-br from-blue-600 to-slate-900' },
  midnight: { label: 'Nebulosa', dark: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-black',  light: 'bg-gradient-to-br from-indigo-100 via-purple-50 to-white', preview: 'bg-gradient-to-br from-purple-600 to-black' },
  forest:   { label: 'Floresta', dark: 'bg-gradient-to-br from-emerald-900 via-slate-900 to-black',  light: 'bg-gradient-to-br from-emerald-100 via-green-50 to-white', preview: 'bg-gradient-to-br from-emerald-600 to-black' },
}

// Cores para cards de projetos — cicla entre elas
const BOARD_COLORS = [
  'from-blue-600 to-blue-700',
  'from-emerald-600 to-emerald-700',
  'from-purple-600 to-purple-700',
  'from-amber-500 to-orange-600',
  'from-rose-600 to-pink-700',
  'from-cyan-600 to-teal-700',
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()

  const showNotification = useCallback((msg) => console.log(msg), [])
  const showError = useCallback((msg) => console.error(msg), [])

  const { boards, users, currentUser, loading } = useBoards(showError, showNotification)

  // Tema de fundo
  const [bgTheme, setBgTheme] = useState(localStorage.getItem('notrouble_bg') || 'default')
  useEffect(() => { localStorage.setItem('notrouble_bg', bgTheme) }, [bgTheme])

  // Wallpaper customizado
  const [wallpaperUrl, setWallpaperUrl] = useState(null)
  const [uploadingWp, setUploadingWp] = useState(false)

  useEffect(() => {
    if (currentUser?.company?.wallpaper_url) setWallpaperUrl(currentUser.company.wallpaper_url)
  }, [currentUser])

  const handleWallpaperUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingWp(true)
    const fd = new FormData()
    fd.append('file', file)
    apiFetch('/company/wallpaper/', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(d => { if (d.wallpaper_url) { setWallpaperUrl(d.wallpaper_url); setBgTheme('wallpaper') } })
      .catch(() => showError('Erro ao enviar wallpaper'))
      .finally(() => setUploadingWp(false))
  }

  const clearWallpaper = () => { setWallpaperUrl(null); setBgTheme('default') }

  // Metricas
  let totalCards = 0, delayedCards = 0, completedCards = 0
  boards.forEach(board => {
    const lastId = board.stages.length > 0 ? board.stages[board.stages.length - 1].id : null
    board.stages.forEach(stage => {
      totalCards += stage.cards.length
      stage.cards.forEach(card => {
        if (stage.id === lastId) completedCards++
        else if (isOverdue(card.due_date)) delayedCards++
      })
    })
  })

  // Background pro PageLayout
  const theme = BG_THEMES[bgTheme] || BG_THEMES.default
  const isWallpaper = bgTheme === 'wallpaper' && wallpaperUrl
  const bgClass = isWallpaper ? '' : (isDarkMode ? theme.dark : theme.light)
  const bgStyle = isWallpaper ? { backgroundImage: `url(${mediaUrl(wallpaperUrl)})` } : undefined

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500 bg-slate-900">Carregando...</div>

  return (
    <PageLayout boards={boards} currentUser={currentUser} bgClass={bgClass} bgStyle={bgStyle}>
      <div className="max-w-6xl mx-auto">

        {/* Hero: perfil + personalizacao */}
        <div className={`p-6 md:p-8 rounded-3xl shadow-lg mb-8 border flex flex-col md:flex-row items-center justify-between gap-6 transition-colors ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-lg border-slate-700' : 'bg-white/90 backdrop-blur-lg border-slate-200'}`}>
          <div className="flex items-center gap-5">
            {currentUser ? (
              <div className="h-20 w-20 rounded-2xl shadow-xl border-2 border-slate-500/20 overflow-hidden flex items-center justify-center font-bold text-2xl text-white" style={{ backgroundColor: !currentUser.avatar_url ? getColorFromString(currentUser.username) : 'transparent' }}>
                {currentUser.avatar_url ? <img src={mediaUrl(currentUser.avatar_url)} alt="" className="h-full w-full object-cover" /> : getInitials(currentUser.first_name, currentUser.last_name, currentUser.username)}
              </div>
            ) : <div className="h-20 w-20 rounded-2xl bg-slate-300 animate-pulse" />}
            <div>
              <h2 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Ola, {currentUser?.first_name || currentUser?.username?.split('@')[0] || 'Membro'}!</h2>
              <p className={`text-sm mt-1 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Resumo da sua operacao.</p>
            </div>
          </div>

          {/* Personalizacao de fundo */}
          <div className="flex flex-col items-center md:items-end gap-3">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Personalizar fundo</span>
            <div className="flex items-center gap-2">
              {Object.entries(BG_THEMES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => setBgTheme(key)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${t.preview} ${bgTheme === key && !isWallpaper ? 'border-blue-500 scale-110 ring-2 ring-blue-500/30' : 'border-slate-600 hover:scale-105'}`}
                  title={t.label}
                />
              ))}

              {/* Wallpaper */}
              {wallpaperUrl ? (
                <div className="relative">
                  <button
                    onClick={() => setBgTheme('wallpaper')}
                    className={`h-8 w-8 rounded-full border-2 overflow-hidden transition-all ${isWallpaper ? 'border-blue-500 scale-110 ring-2 ring-blue-500/30' : 'border-slate-600 hover:scale-105'}`}
                    title="Wallpaper"
                  >
                    <img src={mediaUrl(wallpaperUrl)} alt="" className="h-full w-full object-cover" />
                  </button>
                  <button onClick={clearWallpaper} className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center" title="Remover wallpaper">
                    <IconX className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <label className={`h-8 w-8 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-all hover:scale-105 ${isDarkMode ? 'border-slate-600 text-slate-500 hover:border-blue-500 hover:text-blue-400' : 'border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500'}`} title="Enviar wallpaper">
                  <IconPlus className="w-3.5 h-3.5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleWallpaperUpload} disabled={uploadingWp} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Metricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Quadros', value: boards.length, color: '' },
            { label: 'Concluidos', value: completedCards, color: 'text-blue-500' },
            { label: 'Atrasados', value: delayedCards, color: delayedCards > 0 ? 'text-red-500' : '', alert: delayedCards > 0 },
            { label: 'Total Cards', value: totalCards, color: '' },
          ].map((m, i) => (
            <div key={i} className={`p-5 rounded-2xl border shadow-sm transition-colors ${m.alert ? (isDarkMode ? 'bg-rose-900/30 border-rose-800' : 'bg-red-50 border-red-200') : (isDarkMode ? 'bg-slate-800/80 backdrop-blur-sm border-slate-700' : 'bg-white/90 backdrop-blur-sm border-slate-200')}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${m.color || 'text-slate-500'}`}>{m.label}</p>
              <p className={`text-3xl font-black ${m.color || (isDarkMode ? 'text-white' : 'text-slate-800')} ${m.alert ? 'animate-pulse' : ''}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Projetos + membros */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Seus Projetos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boards.map((board, i) => {
                const cardCount = board.stages.reduce((a, s) => a + s.cards.length, 0)
                const gradient = BOARD_COLORS[i % BOARD_COLORS.length]
                return (
                  <div
                    key={board.id}
                    onClick={() => navigate(`/board?id=${board.id}`)}
                    className="rounded-2xl shadow-md cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg overflow-hidden group"
                  >
                    {/* Barra de cor no topo — estilo Trello */}
                    <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                    <div className={`p-5 transition-colors ${isDarkMode ? 'bg-slate-800/90 backdrop-blur-sm group-hover:bg-slate-800' : 'bg-white/90 backdrop-blur-sm group-hover:bg-white'}`}>
                      <h4 className={`font-bold text-base mb-3 truncate group-hover:text-blue-500 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{board.name}</h4>
                      <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                        <span>{board.stages.length} Etapas</span>
                        <span>{cardCount} Cards</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Criar novo quadro */}
              <div
                onClick={() => navigate('/board')}
                className={`rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors min-h-[100px] ${isDarkMode ? 'border-slate-700 text-slate-500 hover:text-blue-400 hover:border-blue-500 bg-slate-800/30' : 'border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-400'}`}
              >
                <span className="flex items-center gap-2 font-semibold text-sm"><IconPlus /> Novo Quadro</span>
              </div>
            </div>
          </div>

          {/* Membros */}
          <div>
            <h3 className={`text-lg font-bold mb-4 flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              Equipe <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">{users.length}</span>
            </h3>
            <div className={`p-5 rounded-2xl border shadow-sm flex flex-col gap-3 ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-sm border-slate-700' : 'bg-white/90 backdrop-blur-sm border-slate-200'}`}>
              {users.map(user => (
                <div key={user.id} className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                  <div className="h-9 w-9 rounded-full shadow-sm border border-slate-500/20 overflow-hidden flex items-center justify-center font-bold text-[10px] text-white" style={{ backgroundColor: !user.avatar_url ? getColorFromString(user.username) : 'transparent' }}>
                    {user.avatar_url ? <img src={mediaUrl(user.avatar_url)} alt="" className="h-full w-full object-cover" /> : getInitials(user.first_name, user.last_name, user.username)}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user.first_name} {user.last_name}</p>
                    <p className="text-[10px] text-slate-500">@{user.username.split('@')[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </PageLayout>
  )
}