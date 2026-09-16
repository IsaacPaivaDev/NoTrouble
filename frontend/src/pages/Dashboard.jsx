import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBoards } from '../hooks/useBoards'
import { useTheme } from '../contexts/ThemeContext'
import PageLayout from '../components/PageLayout'
import { apiFetch } from '../api/client'
import { mediaUrl } from '../utils/media'
import Avatar from '../components/Avatar'
import { IconPlus } from '../utils/icons'

const STATUS = {
  vencido:   { rotulo: 'Vencido',   dark: 'bg-red-900/40 text-red-300 border-red-800',       light: 'bg-red-50 text-red-700 border-red-200',       ponto: 'bg-red-500' },
  bloqueado: { rotulo: 'Parado',    dark: 'bg-amber-900/40 text-amber-300 border-amber-800', light: 'bg-amber-50 text-amber-700 border-amber-200', ponto: 'bg-amber-500' },
  a_fazer:   { rotulo: 'Hoje',      dark: 'bg-blue-900/40 text-blue-300 border-blue-800',    light: 'bg-blue-50 text-blue-700 border-blue-200',    ponto: 'bg-blue-500' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const noop = useCallback(() => {}, [])
  const { boards, currentUser, loading } = useBoards(noop, noop)

  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(false)
  const [filtro, setFiltro] = useState('todos')

  // Fundo da empresa. Os temas animados e a troca de cor vivem em
  // Configuracoes > Aparencia — personalizacao nao disputa espaco com operacao.
  const wallpaperUrl = currentUser?.company?.wallpaper_url || null

  useEffect(() => {
    let vivo = true
    apiFetch('/analytics/inicio/')
      .then(res => { if (!res.ok) throw new Error(); return res.json() })
      .then(d => { if (vivo) { setDados(d); setErro(false) } })
      .catch(() => { if (vivo) setErro(true) })
    return () => { vivo = false }
  }, [])

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

  const usarWallpaper = localStorage.getItem('notrouble_bg') === 'wallpaper' && wallpaperUrl
  const bgClass = usarWallpaper ? '' : (isDarkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100')
  const bgStyle = usarWallpaper ? { backgroundImage: `url(${mediaUrl(wallpaperUrl)})` } : undefined

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
              <Avatar
                url={currentUser.avatar_url}
                firstName={currentUser.first_name}
                lastName={currentUser.last_name}
                username={currentUser.username}
                size="h-12 w-12" textSize="text-base" rounded="rounded-2xl"
                className="shadow-md"
              />
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
        </div>

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
                    <Avatar nome={p.nome} username={p.nome} size="h-8 w-8" />
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