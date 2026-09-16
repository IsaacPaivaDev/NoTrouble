import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBoards } from '../hooks/useBoards'
import { useTheme } from '../contexts/ThemeContext'
import PageLayout from '../components/PageLayout'
import { apiFetch } from '../api/client'
import { mediaUrl } from '../utils/media'
import { getInitials, getColorFromString } from '../utils/formatters'
import { IconPlus, IconX } from '../utils/icons'

const BG_THEMES = {
  default:  { label: 'Padrao',   dark: 'bg-slate-900',                                              light: 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100', preview: 'bg-slate-900' },
  ocean:    { label: 'Oceano',   dark: 'bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900', light: 'bg-gradient-to-br from-blue-100 via-sky-50 to-slate-100',  preview: 'bg-gradient-to-br from-blue-600 to-slate-900' },
  midnight: { label: 'Nebulosa', dark: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-black',  light: 'bg-gradient-to-br from-indigo-100 via-purple-50 to-white', preview: 'bg-gradient-to-br from-purple-600 to-black' },
  forest:   { label: 'Floresta', dark: 'bg-gradient-to-br from-emerald-900 via-slate-900 to-black',  light: 'bg-gradient-to-br from-emerald-100 via-green-50 to-white', preview: 'bg-gradient-to-br from-emerald-600 to-black' },
}

const STATUS = {
  vencido:   { rotulo: 'Vencido',   dark: 'bg-red-900/40 text-red-300 border-red-800',       light: 'bg-red-50 text-red-700 border-red-200',       ponto: 'bg-red-500' },
  bloqueado: { rotulo: 'Parado',    dark: 'bg-amber-900/40 text-amber-300 border-amber-800', light: 'bg-amber-50 text-amber-700 border-amber-200', ponto: 'bg-amber-500' },
  a_fazer:   { rotulo: 'Hoje',      dark: 'bg-blue-900/40 text-blue-300 border-blue-800',    light: 'bg-blue-50 text-blue-700 border-blue-200',    ponto: 'bg-blue-500' },
}

const IconPaleta = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828L13 15.657" />
  </svg>
)

const iniciais = (nome) => {
  const p = String(nome).trim().split(/\s+/).filter(Boolean)
  if (!p.length) return '?'
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const noop = useCallback(() => {}, [])
  const { boards, currentUser, loading } = useBoards(noop, noop)

  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(false)
  const [filtro, setFiltro] = useState('todos')
  const [personalizando, setPersonalizando] = useState(false)

  const [bgTheme, setBgTheme] = useState(localStorage.getItem('notrouble_bg') || 'default')
  useEffect(() => { localStorage.setItem('notrouble_bg', bgTheme) }, [bgTheme])

  const [wallpaperUrl, setWallpaperUrl] = useState(null)
  const [enviandoWp, setEnviandoWp] = useState(false)
  useEffect(() => {
    if (currentUser?.company?.wallpaper_url) setWallpaperUrl(currentUser.company.wallpaper_url)
  }, [currentUser])

  useEffect(() => {
    let vivo = true
    apiFetch('/analytics/inicio/')
      .then(res => { if (!res.ok) throw new Error(); return res.json() })
      .then(d => { if (vivo) { setDados(d); setErro(false) } })
      .catch(() => { if (vivo) setErro(true) })
    return () => { vivo = false }
  }, [])

  const enviarWallpaper = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEnviandoWp(true)
    const fd = new FormData()
    fd.append('file', file)
    apiFetch('/company/wallpaper/', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(d => { if (d.wallpaper_url) { setWallpaperUrl(d.wallpaper_url); setBgTheme('wallpaper') } })
      .finally(() => setEnviandoWp(false))
  }

  const irParaCard = (p) => navigate(`/board?id=${p.board_id}&card=${p.id}`)

  const pendencias = useMemo(() => {
    if (!dados) return []
    if (filtro === 'todos') return dados.pendencias
    if (filtro === 'hoje') return dados.pendencias.filter(p => p.status === 'a_fazer')
    return dados.pendencias.filter(p => p.status === filtro)
  }, [dados, filtro])

  const cargaMaxima = useMemo(
    () => (dados ? Math.max(1, ...dados.semana.map(d => d.carga)) : 1), [dados]
  )

  const tema = BG_THEMES[bgTheme] || BG_THEMES.default
  const comWallpaper = bgTheme === 'wallpaper' && wallpaperUrl
  const bgClass = comWallpaper ? '' : (isDarkMode ? tema.dark : tema.light)
  const bgStyle = comWallpaper ? { backgroundImage: `url(${mediaUrl(wallpaperUrl)})` } : undefined

  const card = isDarkMode ? 'bg-slate-800/80 backdrop-blur-sm border-slate-700' : 'bg-white/90 backdrop-blur-sm border-slate-200'
  const txt = isDarkMode ? 'text-white' : 'text-slate-800'
  const txtFraco = isDarkMode ? 'text-slate-400' : 'text-slate-500'
  const foco = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'

  if (loading) {
    return (
      <PageLayout boards={boards} currentUser={currentUser} bgClass={bgClass} bgStyle={bgStyle}>
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin motion-reduce:animate-none" />
          <p className={`text-sm font-semibold ${txtFraco}`}>Carregando...</p>
        </div>
      </PageLayout>
    )
  }

  const c = dados?.contadores
  const filtros = dados ? [
    { chave: 'vencido',   rotulo: c.vencidos === 1 ? 'vencido' : 'vencidos',   valor: c.vencidos,    cor: isDarkMode ? 'text-red-400' : 'text-red-600' },
    { chave: 'bloqueado', rotulo: c.bloqueados === 1 ? 'parado' : 'parados',   valor: c.bloqueados,  cor: isDarkMode ? 'text-amber-400' : 'text-amber-600' },
    { chave: 'hoje',      rotulo: 'vencem hoje',                               valor: c.vencem_hoje, cor: isDarkMode ? 'text-blue-400' : 'text-blue-600' },
  ] : []

  return (
    <PageLayout boards={boards} currentUser={currentUser} bgClass={bgClass} bgStyle={bgStyle}>
      <div className="max-w-6xl mx-auto pb-10">

        {/* Saudacao — enxuta, para a lista ficar com o topo -------------- */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 min-w-0">
            {currentUser && (
              <div className="h-12 w-12 rounded-2xl shadow-md overflow-hidden flex items-center justify-center font-bold text-white shrink-0"
                   style={{ backgroundColor: !currentUser.avatar_url ? getColorFromString(currentUser.username) : 'transparent' }}>
                {currentUser.avatar_url
                  ? <img src={mediaUrl(currentUser.avatar_url)} alt="" className="h-full w-full object-cover" />
                  : getInitials(currentUser.first_name, currentUser.last_name, currentUser.username)}
              </div>
            )}
            <div className="min-w-0">
              <h2 className={`text-2xl font-black truncate ${txt}`}>
                Ola, {currentUser?.first_name || currentUser?.username?.split('@')[0] || 'Membro'}
              </h2>
              {dados && (
                <p className={`text-sm font-medium ${txtFraco}`}>
                  {dados.escopo === 'proprios' ? 'Seus cards' : 'Sua operacao'} · {c.pendentes} em aberto · {c.concluidas} concluidas
                </p>
              )}
            </div>
          </div>
          <button onClick={() => setPersonalizando(v => !v)} aria-expanded={personalizando} title="Personalizar fundo"
                  className={`p-2 rounded-lg shrink-0 transition-colors motion-reduce:transition-none ${foco} ${isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}>
            <IconPaleta />
          </button>
        </div>

        {personalizando && (
          <div className={`flex items-center gap-2 mb-6 p-3 rounded-xl border ${card}`}>
            {Object.entries(BG_THEMES).map(([k, t]) => (
              <button key={k} onClick={() => setBgTheme(k)} title={t.label}
                      className={`h-8 w-8 rounded-full border-2 transition-all motion-reduce:transition-none ${t.preview} ${foco} ${bgTheme === k && !comWallpaper ? 'border-blue-500 scale-110' : 'border-slate-600'}`} />
            ))}
            {wallpaperUrl ? (
              <div className="relative">
                <button onClick={() => setBgTheme('wallpaper')} title="Wallpaper"
                        className={`h-8 w-8 rounded-full border-2 overflow-hidden ${foco} ${comWallpaper ? 'border-blue-500 scale-110' : 'border-slate-600'}`}>
                  <img src={mediaUrl(wallpaperUrl)} alt="" className="h-full w-full object-cover" />
                </button>
                <button onClick={() => { setWallpaperUrl(null); setBgTheme('default') }} title="Remover wallpaper"
                        className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <IconX className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <label title="Enviar wallpaper"
                     className={`h-8 w-8 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer ${isDarkMode ? 'border-slate-600 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
                <IconPlus className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={enviarWallpaper} disabled={enviandoWp} />
              </label>
            )}
          </div>
        )}

        {erro && (
          <div className={`rounded-2xl border p-6 text-center mb-6 ${card}`}>
            <p className={`font-bold ${txt}`}>O resumo nao carregou</p>
            <p className={`text-sm mt-1 ${txtFraco}`}>Verifique a conexao e recarregue a pagina.</p>
          </div>
        )}

        {/* 1. PRECISA DE VOCE — o topo da tela ---------------------------- */}
        {dados && (
          <section className={`rounded-2xl border overflow-hidden mb-6 ${card}`}>
            <header className={`px-4 md:px-5 py-4 border-b flex items-center gap-2 flex-wrap ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <h3 className={`font-black mr-2 ${txt}`}>Precisa de voce</h3>
              {filtros.map(f => (
                <button key={f.chave} onClick={() => setFiltro(filtro === f.chave ? 'todos' : f.chave)}
                        aria-pressed={filtro === f.chave}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors motion-reduce:transition-none ${foco} ${
                          filtro === f.chave
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : (isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200')
                        }`}>
                  <span className={filtro === f.chave ? 'text-white' : f.cor}>{f.valor}</span>
                  <span className={`ml-1 font-semibold ${filtro === f.chave ? 'text-white' : txtFraco}`}>{f.rotulo}</span>
                </button>
              ))}
            </header>

            {pendencias.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className={`font-bold ${txt}`}>
                  {dados.pendencias.length === 0 ? 'Nada vencido, nada parado' : 'Nada com esse filtro'}
                </p>
                <p className={`text-sm mt-1 ${txtFraco}`}>
                  {dados.pendencias.length === 0
                    ? 'Quando um prazo estourar ou um card travar, ele aparece aqui.'
                    : 'Toque no filtro de novo para ver tudo.'}
                </p>
              </div>
            ) : (
              <ul className={`divide-y ${isDarkMode ? 'divide-slate-700/70' : 'divide-slate-100'}`}>
                {pendencias.map(p => {
                  const st = STATUS[p.status] || STATUS.a_fazer
                  return (
                    <li key={p.id}>
                      <button onClick={() => irParaCard(p)}
                              className={`w-full text-left px-4 md:px-5 py-3 flex items-center gap-3 flex-wrap transition-colors motion-reduce:transition-none ${foco} ${isDarkMode ? 'hover:bg-slate-700/40' : 'hover:bg-slate-50'}`}>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${isDarkMode ? st.dark : st.light}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.ponto}`} />
                          {st.rotulo}
                        </span>
                        <span className={`font-semibold text-sm flex-1 min-w-[10rem] truncate ${txt}`}>{p.titulo}</span>
                        <span className={`text-[11px] px-1.5 py-0.5 rounded shrink-0 ${isDarkMode ? 'bg-slate-900 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>{p.board_nome}</span>
                        <span className={`text-[11px] shrink-0 ${txtFraco}`}>{p.responsavel || 'Sem dono'}</span>
                        <span className={`text-[11px] font-medium shrink-0 ${p.status === 'vencido' ? (isDarkMode ? 'text-red-400' : 'text-red-600') : txtFraco}`}>
                          {p.detalhe}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {dados.pendencias_ocultas > 0 && filtro === 'todos' && (
              <p className={`px-5 py-2.5 text-[11px] border-t ${txtFraco} ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                Mais {dados.pendencias_ocultas} pendencias. Use os quadros ou o Painel para ver todas.
              </p>
            )}
          </section>
        )}

        {/* 2. CARGA DA SEMANA ------------------------------------------- */}
        {dados && (
          <section className={`rounded-2xl border p-3 md:p-4 mb-6 ${card}`}>
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h3 className={`text-sm font-bold ${txt}`}>Carga dos proximos dias uteis</h3>
              <p className={`text-[11px] ${txtFraco}`}>Todos os quadros somados</p>
            </div>
            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1">
              {dados.semana.map(d => (
                <div key={d.data_iso}
                     className={`flex-1 min-w-0 shrink-0 basis-[104px] rounded-xl border p-2.5 ${
                       d.sobrecarga
                         ? (isDarkMode ? 'border-red-800 bg-red-950/30' : 'border-red-300 bg-red-50/60')
                         : (isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50')
                     }`}>
                  <div className="flex items-baseline justify-between gap-1">
                    <span className={`text-xs font-bold truncate ${d.hoje ? (isDarkMode ? 'text-blue-400' : 'text-blue-600') : txt}`}>{d.dia}</span>
                    <span className={`text-[10px] tabular-nums ${txtFraco}`}>{d.rotulo}</span>
                  </div>
                  <div className={`h-1.5 w-full rounded-full overflow-hidden mt-2 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className={`h-full rounded-full transition-all duration-500 motion-reduce:transition-none ${d.sobrecarga ? 'bg-red-500' : 'bg-blue-500'}`}
                         style={{ width: `${Math.round((d.carga / cargaMaxima) * 100)}%` }} />
                  </div>
                  <p className={`text-[10px] font-semibold mt-1 ${txtFraco}`}>
                    {d.carga === 0 ? 'Nada previsto' : `${d.carga} ${d.carga === 1 ? 'card' : 'cards'}`}
                  </p>
                  {d.sobrecarga && (
                    <p className={`text-[10px] font-bold leading-tight mt-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                      {d.responsavel_sobrecarregado} com {d.carga_maxima_responsavel}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. QUADROS + EQUIPE ------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h3 className={`text-sm font-bold mb-3 ${txt}`}>Quadros</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(dados?.quadros || []).map(q => (
                <button key={q.id} onClick={() => navigate(`/board?id=${q.id}`)}
                        className={`text-left rounded-2xl border p-4 transition-colors motion-reduce:transition-none ${foco} ${card} ${isDarkMode ? 'hover:border-blue-600' : 'hover:border-blue-400'}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className={`font-bold text-sm truncate ${txt}`}>{q.nome}</h4>
                    <span className={`text-xs font-black tabular-nums shrink-0 ${txtFraco}`}>{q.progresso}%</span>
                  </div>
                  <div className={`h-1.5 w-full rounded-full overflow-hidden my-2.5 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-500 motion-reduce:transition-none" style={{ width: `${q.progresso}%` }} />
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className={txtFraco}>{q.pendentes} em aberto</span>
                    {q.vencidos > 0 && (
                      <span className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                        {q.vencidos} {q.vencidos === 1 ? 'vencido' : 'vencidos'}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              <button onClick={() => navigate('/board')}
                      className={`rounded-2xl border-2 border-dashed flex items-center justify-center min-h-[104px] font-semibold text-sm gap-2 transition-colors motion-reduce:transition-none ${foco} ${isDarkMode ? 'border-slate-700 text-slate-500 hover:text-blue-400 hover:border-blue-500' : 'border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-400'}`}>
                <IconPlus /> Novo quadro
              </button>
            </div>
          </div>

          {dados && dados.equipe.length > 0 && (
            <div>
              <h3 className={`text-sm font-bold mb-3 ${txt}`}>Equipe</h3>
              <ul className={`rounded-2xl border overflow-hidden ${card}`}>
                {dados.equipe.map(p => (
                  <li key={p.id} className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 ${isDarkMode ? 'border-slate-700/70' : 'border-slate-100'}`}>
                    <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] text-white"
                         style={{ backgroundColor: getColorFromString(p.nome) || '#3B82F6' }}>
                      {iniciais(p.nome)}
                    </div>
                    <span className={`font-semibold text-sm flex-1 min-w-0 truncate ${txt}`}>{p.nome}</span>
                    <span className={`text-[11px] shrink-0 ${txtFraco}`}>{p.abertos} abertos</span>
                    {p.vencidos > 0 && (
                      <span className={`text-[11px] font-bold shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{p.vencidos} atras.</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>
    </PageLayout>
  )
}