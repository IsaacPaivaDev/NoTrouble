import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useBoards } from '../hooks/useBoards'
import { apiFetch } from '../api/client'
import PageLayout from '../components/PageLayout'
import { getColorFromString } from '../utils/formatters'
import { IconX } from '../utils/icons'

// ---------------------------------------------------------------------------
// Status: o SERVIDOR decide, o cliente so desenha.
// Todo status tem rotulo em texto — cor nunca carrega significado sozinha.
// ---------------------------------------------------------------------------
const STATUS = {
  feito:      { rotulo: 'Concluido',  dark: 'bg-emerald-900/40 text-emerald-300 border-emerald-800', light: 'bg-emerald-50 text-emerald-700 border-emerald-200', ponto: 'bg-emerald-500' },
  bloqueado:  { rotulo: 'Bloqueado',  dark: 'bg-amber-900/40 text-amber-300 border-amber-800',       light: 'bg-amber-50 text-amber-700 border-amber-200',       ponto: 'bg-amber-500' },
  vencido:    { rotulo: 'Vencido',    dark: 'bg-red-900/40 text-red-300 border-red-800',             light: 'bg-red-50 text-red-700 border-red-200',             ponto: 'bg-red-500' },
  sem_prazo:  { rotulo: 'Sem prazo',  dark: 'bg-slate-800 text-slate-400 border-slate-700',          light: 'bg-slate-100 text-slate-500 border-slate-200',      ponto: 'bg-slate-400' },
  a_fazer:    { rotulo: 'A fazer',    dark: 'bg-blue-900/40 text-blue-300 border-blue-800',          light: 'bg-blue-50 text-blue-700 border-blue-200',          ponto: 'bg-blue-500' },
  _sync:      { rotulo: 'Atualizando', dark: 'bg-slate-800 text-slate-500 border-slate-700',         light: 'bg-slate-100 text-slate-400 border-slate-200',      ponto: 'bg-slate-300' },
}

const PRIORIDADE = { high: 'Alta', medium: 'Media', low: 'Baixa' }

const IconPainel = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h18M7 20V10m5 10V4m5 16v-7" />
  </svg>
)
const IconLock = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)
const IconCheck = ({ className = 'w-3 h-3' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

// Card nao tem campo de codigo no banco. O identificador curto vem do proprio
// UUID: estavel, unico dentro do quadro e util para citar um card no WhatsApp.
const codigoDoCard = (id) => String(id).replace(/-/g, '').slice(0, 5).toUpperCase()

// O painel recebe o responsavel ja montado pelo servidor ("Isaac Paiva"), nao o
// objeto User — por isso as iniciais saem daqui e nao do getInitials do projeto,
// que espera (first_name, last_name, username).
const iniciais = (nome) => {
  const partes = String(nome).trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

const textoBloqueio = (card) => {
  if (!card.bloqueado_por) return null
  const d = card.dias_bloqueado
  if (d === null || d === undefined) return `com ${card.bloqueado_por}`
  if (d === 0) return `com ${card.bloqueado_por} desde hoje`
  if (d === 1) return `com ${card.bloqueado_por} ha 1 dia`
  return `com ${card.bloqueado_por} ha ${d} dias`
}

const rolagemSuave = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

export default function Painel() {
  const { isDarkMode } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const noop = useCallback(() => {}, [])
  const { boards, currentUser, loading: carregandoBoards } = useBoards(noop, noop)

  const [activeBoardId, setActiveBoardId] = useState(null)
  const [dias, setDias] = useState(5)

  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)          // 'plano' | 'rede' | null
  const [aviso, setAviso] = useState(null)

  const [frenteAtiva, setFrenteAtiva] = useState('todas')
  const [statusAtivo, setStatusAtivo] = useState('todos')
  const [busca, setBusca] = useState('')
  const [soPendencias, setSoPendencias] = useState(false)

  const [salvando, setSalvando] = useState({})
  const [destaque, setDestaque] = useState(null)
  const [editandoBloqueio, setEditandoBloqueio] = useState(null)
  const [valorBloqueio, setValorBloqueio] = useState('')

  const linhasRef = useRef({})
  const bloqueioInputRef = useRef(null)

  // --- Board ativo: ?id= na URL, senao o primeiro ---------------------------
  const urlBoardId = searchParams.get('id')
  useEffect(() => {
    if (boards.length === 0) return
    if (urlBoardId && boards.find(b => b.id === urlBoardId)) { setActiveBoardId(urlBoardId); return }
    if (!activeBoardId || !boards.find(b => b.id === activeBoardId)) setActiveBoardId(boards[0].id)
  }, [boards, urlBoardId, activeBoardId])

  // --- Carregamento --------------------------------------------------------
  const carregar = useCallback(async (silencioso = false) => {
    if (!activeBoardId) return
    if (!silencioso) { setCarregando(true); setErro(null) }
    try {
      const res = await apiFetch(`/boards/${activeBoardId}/painel/?dias=${dias}`)
      if (res.status === 403) { setDados(null); setErro('plano'); return }
      if (!res.ok) throw new Error()
      setDados(await res.json())
      setErro(null)
    } catch {
      if (!silencioso) { setDados(null); setErro('rede') }
      else setAviso('Nao foi possivel atualizar o painel. Recarregue a pagina.')
    } finally {
      if (!silencioso) setCarregando(false)
    }
  }, [activeBoardId, dias])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(t)
  }, [aviso])

  useEffect(() => {
    if (editandoBloqueio) setTimeout(() => bloqueioInputRef.current?.focus(), 60)
  }, [editandoBloqueio])

  // --- Acoes ---------------------------------------------------------------
  const mapearCard = (d, cardId, patch) => ({
    ...d,
    frentes: d.frentes.map(f => ({
      ...f, cards: f.cards.map(c => (c.id === cardId ? { ...c, ...patch } : c)),
    })),
  })

  const alternarConcluido = async (card) => {
    const anterior = dados
    const concluindo = !card.concluido
    setSalvando(s => ({ ...s, [card.id]: true }))

    // Otimista. Ao concluir, 'feito' e a regra de precedencia #1 e nao ha duvida.
    // Ao reabrir, o status novo depende de prazo e bloqueio — quem decide e o
    // servidor, entao a linha mostra 'Atualizando' ate o refetch chegar.
    setDados(d => mapearCard(d, card.id, {
      concluido: concluindo,
      status: concluindo ? 'feito' : '_sync',
    }))

    try {
      const res = await apiFetch(`/cards/${card.id}/toggle-complete/`, { method: 'POST' })
      if (!res.ok) throw new Error()
      await carregar(true)
    } catch {
      setDados(anterior)
      setAviso('Nao foi possivel salvar. Verifique a conexao e tente de novo.')
    } finally {
      setSalvando(s => { const n = { ...s }; delete n[card.id]; return n })
    }
  }

  const salvarBloqueio = async (cardId, texto) => {
    setSalvando(s => ({ ...s, [cardId]: true }))
    setEditandoBloqueio(null)
    try {
      const res = await apiFetch(`/cards/${cardId}/bloqueio/`, {
        method: 'POST', body: JSON.stringify({ blocked_by: texto.trim() }),
      })
      if (!res.ok) throw new Error()
      await carregar(true)
    } catch {
      setAviso('Nao foi possivel salvar o bloqueio. Tente de novo.')
    } finally {
      setSalvando(s => { const n = { ...s }; delete n[cardId]; return n })
    }
  }

  const limparFiltros = () => { setFrenteAtiva('todas'); setStatusAtivo('todos'); setBusca(''); setSoPendencias(false) }

  const irParaCard = (cardId) => {
    limparFiltros()
    setTimeout(() => {
      const el = linhasRef.current[cardId]
      if (!el) return
      el.scrollIntoView({ behavior: rolagemSuave(), block: 'center' })
      setDestaque(cardId)
      setTimeout(() => setDestaque(null), 2200)
    }, 80)
  }

  // --- Filtros, tudo client-side, sem refetch -------------------------------
  const frentesFiltradas = useMemo(() => {
    if (!dados) return []
    const q = busca.trim().toLowerCase()
    return dados.frentes
      .filter(f => frenteAtiva === 'todas' || String(f.id) === frenteAtiva)
      .map(f => ({
        ...f,
        cards: f.cards.filter(c => {
          if (soPendencias && c.concluido) return false
          if (statusAtivo !== 'todos' && c.status !== statusAtivo) return false
          if (!q) return true
          return (
            c.titulo.toLowerCase().includes(q) ||
            (c.responsavel || '').toLowerCase().includes(q) ||
            (c.etapa || '').toLowerCase().includes(q) ||
            codigoDoCard(c.id).toLowerCase().includes(q)
          )
        }),
      }))
      .filter(f => f.cards.length > 0)
  }, [dados, frenteAtiva, statusAtivo, busca, soPendencias])

  const bloqueados = useMemo(
    () => (dados ? dados.frentes.flatMap(f => f.cards).filter(c => c.status === 'bloqueado') : []),
    [dados]
  )

  const totalCardsNoQuadro = useMemo(
    () => (dados ? dados.frentes.reduce((n, f) => n + f.cards.length, 0) : 0),
    [dados]
  )
  const totalFiltrado = frentesFiltradas.reduce((n, f) => n + f.cards.length, 0)
  const temFiltro = frenteAtiva !== 'todas' || statusAtivo !== 'todos' || busca.trim() || soPendencias

  const cargaMaxima = useMemo(
    () => (dados ? Math.max(1, ...dados.semana.map(d => d.carga)) : 1),
    [dados]
  )

  // --- Classes reutilizadas ------------------------------------------------
  const card = isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
  const txt = isDarkMode ? 'text-white' : 'text-slate-800'
  const txtFraco = isDarkMode ? 'text-slate-400' : 'text-slate-500'
  const foco = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent'
  const controle = `px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors motion-reduce:transition-none ${foco} ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`
  const esquemaNativo = { colorScheme: isDarkMode ? 'dark' : 'light' }

  const chipStatus = (status) => {
    const s = STATUS[status] || STATUS.sem_prazo
    return `inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${isDarkMode ? s.dark : s.light}`
  }

  // --- Seletor de quadro e janela, no header -------------------------------
  const headerActions = (
    <div className="flex items-center gap-2">
      <select
        value={activeBoardId || ''}
        onChange={e => { setActiveBoardId(e.target.value); setSearchParams({ id: e.target.value }); limparFiltros() }}
        style={esquemaNativo}
        className={`${controle} max-w-[10rem] md:max-w-[14rem] truncate`}
        aria-label="Quadro"
      >
        {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <select
        value={dias}
        onChange={e => setDias(Number(e.target.value))}
        style={esquemaNativo}
        className={controle}
        aria-label="Tamanho da janela"
      >
        <option value={5}>5 dias uteis</option>
        <option value={10}>10 dias uteis</option>
        <option value={15}>15 dias uteis</option>
      </select>
    </div>
  )

  const envolver = (conteudo) => (
    <PageLayout boards={boards} currentUser={currentUser} headerActions={boards.length > 0 ? headerActions : null}>
      <div className="max-w-7xl mx-auto pb-10">{conteudo}</div>
    </PageLayout>
  )

  // --- Estados de excecao --------------------------------------------------
  if (carregandoBoards || (carregando && !dados)) {
    return envolver(
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin motion-reduce:animate-none" />
        <p className={`text-sm font-semibold ${txtFraco}`}>Carregando o painel...</p>
      </div>
    )
  }

  if (erro === 'plano') {
    return envolver(
      <div className={`mt-16 mx-auto max-w-md rounded-2xl border p-8 text-center ${card}`}>
        <h2 className={`text-xl font-black mb-2 ${txt}`}>Painel do plano Business</h2>
        <p className={`text-sm ${txtFraco}`}>
          Peca ao administrador da sua equipe para liberar seu acesso aos relatorios em Configuracoes.
        </p>
      </div>
    )
  }

  if (erro === 'rede') {
    return envolver(
      <div className={`mt-16 mx-auto max-w-md rounded-2xl border p-8 text-center ${card}`}>
        <h2 className={`text-xl font-black mb-2 ${txt}`}>O painel nao carregou</h2>
        <p className={`text-sm mb-5 ${txtFraco}`}>Verifique sua conexao e tente de novo.</p>
        <button onClick={() => carregar()} className={`px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors motion-reduce:transition-none ${foco}`}>
          Tentar de novo
        </button>
      </div>
    )
  }

  if (boards.length === 0) {
    return envolver(
      <div className={`mt-16 mx-auto max-w-md rounded-2xl border p-8 text-center ${card}`}>
        <h2 className={`text-xl font-black mb-2 ${txt}`}>Nenhum quadro ainda</h2>
        <p className={`text-sm ${txtFraco}`}>Crie um quadro em Quadros e o painel passa a mostrar a carga da equipe.</p>
      </div>
    )
  }

  if (!dados) return envolver(null)

  const c = dados.contadores
  const contadores = [
    { chave: 'vencido',   rotulo: 'Vencidos',   valor: c.vencidos,   cor: isDarkMode ? 'text-red-400' : 'text-red-600' },
    { chave: 'bloqueado', rotulo: 'Bloqueados', valor: c.bloqueados, cor: isDarkMode ? 'text-amber-400' : 'text-amber-600' },
    { chave: null,        rotulo: 'Na janela',  valor: c.na_janela,  cor: isDarkMode ? 'text-blue-400' : 'text-blue-600' },
    { chave: null,        rotulo: 'Pendentes',  valor: c.pendentes,  cor: txt },
    { chave: 'feito',     rotulo: 'Concluidas', valor: c.concluidas, cor: isDarkMode ? 'text-emerald-400' : 'text-emerald-600' },
  ]

  return envolver(
    <>
      {/* 1. CABECALHO ---------------------------------------------------- */}
      <div className="mb-5">
        <h2 className={`text-3xl font-black ${txt}`}>{dados.board_nome}</h2>
        <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-2" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 mb-6">
        {contadores.map(k => (
          <div key={k.rotulo} className={`rounded-xl border p-3 md:p-4 ${card}`}>
            <p className={`text-2xl md:text-3xl font-black tabular-nums ${k.cor}`}>{k.valor}</p>
            <p className={`text-[11px] font-semibold mt-0.5 ${txtFraco}`}>{k.rotulo}</p>
          </div>
        ))}
      </div>

      {/* 2. FAIXA DA SEMANA — o elemento principal ------------------------ */}
      <div className={`rounded-2xl border p-3 md:p-4 mb-6 ${card}`}>
        <div className="flex items-baseline justify-between mb-3 gap-3">
          <h3 className={`text-sm font-bold ${txt}`}>Carga dos proximos dias uteis</h3>
          <p className={`text-[11px] ${txtFraco}`}>
            Alerta a partir de {dados.limiar_sobrecarga} cards na mesma pessoa
          </p>
        </div>

        <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1">
          {dados.semana.map(d => (
            <div
              key={d.data_iso}
              className={`flex-1 min-w-0 shrink-0 basis-[116px] rounded-xl border overflow-hidden ${
                d.sobrecarga
                  ? (isDarkMode ? 'border-red-800 bg-red-950/30' : 'border-red-300 bg-red-50/60')
                  : (isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50')
              }`}
            >
              <div className={`h-1.5 w-full ${d.sobrecarga ? 'bg-red-500' : 'bg-transparent'}`} />

              <div className="p-2.5">
                <div className="flex items-baseline justify-between gap-1">
                  <span className={`text-xs font-bold truncate ${d.hoje ? (isDarkMode ? 'text-blue-400' : 'text-blue-600') : txt}`}>
                    {d.dia}
                  </span>
                  <span className={`text-[10px] tabular-nums ${txtFraco}`}>{d.rotulo}</span>
                </div>
                {d.hoje && <span className={`text-[9px] font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>hoje</span>}

                <div className="mt-2">
                  <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 motion-reduce:transition-none ${d.sobrecarga ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.round((d.carga / cargaMaxima) * 100)}%` }}
                    />
                  </div>
                  <p className={`text-[10px] font-semibold mt-1 ${txtFraco}`}>
                    {d.carga === 0 ? 'Nada previsto' : `${d.carga} ${d.carga === 1 ? 'card' : 'cards'}`}
                  </p>
                </div>

                {d.sobrecarga && (
                  <p className={`mt-1.5 text-[10px] font-bold leading-tight ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                    Sobrecarga: {d.responsavel_sobrecarregado} com {d.carga_maxima_responsavel}
                  </p>
                )}

                <div className="mt-2 flex flex-col gap-1">
                  {d.card_ids.slice(0, 6).map(id => {
                    const alvo = dados.frentes.flatMap(f => f.cards).find(x => x.id === id)
                    if (!alvo) return null
                    return (
                      <button
                        key={id}
                        onClick={() => irParaCard(id)}
                        title={alvo.titulo}
                        className={`text-left px-1.5 py-1 rounded text-[10px] font-semibold truncate transition-colors motion-reduce:transition-none ${foco} ${
                          isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {alvo.titulo}
                      </button>
                    )
                  })}
                  {d.card_ids.length > 6 && (
                    <span className={`text-[9px] font-bold text-center ${txtFraco}`}>+{d.card_ids.length - 6} mais</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {dados.semana.every(d => d.carga === 0) && (
          <p className={`text-xs text-center italic mt-3 ${txtFraco}`}>
            Nenhum card com prazo nesta janela. Defina prazos nos cards para ver a carga da equipe aqui.
          </p>
        )}
      </div>

      {/* 3. CONTROLES ----------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por titulo, pessoa, etapa ou codigo"
          style={esquemaNativo}
          className={`${controle} font-medium flex-1 min-w-[12rem] max-w-sm ${isDarkMode ? 'placeholder-slate-500' : 'placeholder-slate-400'}`}
        />
        <select value={frenteAtiva} onChange={e => setFrenteAtiva(e.target.value)} style={esquemaNativo} className={controle} aria-label="Frente">
          <option value="todas">Todas as frentes</option>
          {dados.frentes.map(f => <option key={String(f.id)} value={String(f.id)}>{f.nome}</option>)}
        </select>
        <select value={statusAtivo} onChange={e => setStatusAtivo(e.target.value)} style={esquemaNativo} className={controle} aria-label="Status">
          <option value="todos">Todos os status</option>
          {['vencido', 'bloqueado', 'a_fazer', 'sem_prazo', 'feito'].map(s => (
            <option key={s} value={s}>{STATUS[s].rotulo}</option>
          ))}
        </select>
        <button
          onClick={() => setSoPendencias(v => !v)}
          aria-pressed={soPendencias}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors motion-reduce:transition-none ${foco} ${
            soPendencias
              ? 'bg-blue-600 border-blue-600 text-white'
              : (isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-300 text-slate-600')
          }`}
        >
          So pendencias
        </button>
        {temFiltro && (
          <button onClick={limparFiltros} className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${foco} ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
            Limpar filtros
          </button>
        )}
        <span className={`text-[11px] ml-auto ${txtFraco}`}>
          {totalFiltrado} de {totalCardsNoQuadro} cards
        </span>
      </div>

      {/* 4. BACKLOG POR FRENTE -------------------------------------------- */}
      {totalCardsNoQuadro === 0 ? (
        <div className={`rounded-2xl border p-10 text-center ${card}`}>
          <h3 className={`font-black mb-1 ${txt}`}>Este quadro ainda nao tem cards</h3>
          <p className={`text-sm ${txtFraco}`}>Crie cards em Quadros e eles aparecem aqui agrupados por frente.</p>
        </div>
      ) : frentesFiltradas.length === 0 ? (
        <div className={`rounded-2xl border p-10 text-center ${card}`}>
          <h3 className={`font-black mb-1 ${txt}`}>Nenhum card com esses filtros</h3>
          <button onClick={limparFiltros} className={`mt-3 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors motion-reduce:transition-none ${foco}`}>
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {frentesFiltradas.map(f => (
            <section key={String(f.id)} className={`rounded-2xl border overflow-hidden ${card}`}>
              <header className={`flex items-center gap-2.5 px-4 py-3 border-b ${isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: f.cor }} />
                <h3 className={`font-bold text-sm ${txt}`}>{f.nome}</h3>
                <span className={`text-[11px] tabular-nums ${txtFraco}`}>
                  {f.concluidas} de {f.total} concluidas
                </span>
              </header>

              <ul className={`divide-y ${isDarkMode ? 'divide-slate-700/70' : 'divide-slate-100'}`}>
                {f.cards.map(k => {
                  const emSync = !!salvando[k.id]
                  const st = STATUS[k.status] || STATUS.sem_prazo
                  return (
                    <li
                      key={k.id}
                      ref={el => { linhasRef.current[k.id] = el }}
                      className={`px-3 md:px-4 py-2.5 transition-colors motion-reduce:transition-none ${
                        destaque === k.id ? (isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50') : ''
                      } ${emSync ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => alternarConcluido(k)}
                          disabled={emSync}
                          aria-pressed={k.concluido}
                          aria-label={k.concluido ? `Reabrir ${k.titulo}` : `Concluir ${k.titulo}`}
                          className={`mt-0.5 w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors motion-reduce:transition-none ${foco} ${
                            k.concluido
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : (isDarkMode ? 'border-slate-600 hover:border-blue-500' : 'border-slate-300 hover:border-blue-500')
                          }`}
                        >
                          {k.concluido && <IconCheck />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className={`text-[10px] font-mono tabular-nums shrink-0 ${txtFraco}`}>{codigoDoCard(k.id)}</span>
                            <span className={`text-sm font-semibold break-words ${k.concluido ? 'line-through opacity-60' : ''} ${txt}`}>
                              {k.titulo}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap mt-1.5">
                            <span className={chipStatus(k.status)}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.ponto}`} />
                              {st.rotulo}
                            </span>
                            {k.prazo && <span className={`text-[11px] tabular-nums ${txtFraco}`}>Prazo {k.prazo}</span>}
                            {k.etapa && <span className={`text-[11px] ${txtFraco}`}>{k.etapa}</span>}
                            {k.prioridade === 'high' && (
                              <span className={`text-[10px] font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                Prioridade alta
                              </span>
                            )}
                            {k.tags.map(t => (
                              <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{t}</span>
                            ))}
                          </div>

                          {k.bloqueado_por && (
                            <p className={`text-[11px] mt-1 font-medium ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                              Parado {textoBloqueio(k)}
                            </p>
                          )}

                          {editandoBloqueio === k.id && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <input
                                ref={bloqueioInputRef}
                                type="text"
                                value={valorBloqueio}
                                onChange={e => setValorBloqueio(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') salvarBloqueio(k.id, valorBloqueio)
                                  if (e.key === 'Escape') setEditandoBloqueio(null)
                                }}
                                placeholder="Quem esta segurando?"
                                maxLength={120}
                                style={esquemaNativo}
                                className={`${controle} font-medium w-52`}
                              />
                              <button onClick={() => salvarBloqueio(k.id, valorBloqueio)} className={`px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold ${foco}`}>
                                Salvar
                              </button>
                              <button onClick={() => setEditandoBloqueio(null)} className={`p-1.5 rounded-lg ${foco} ${txtFraco}`} aria-label="Cancelar">
                                <IconX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {k.responsavel ? (
                            <div
                              title={k.responsavel}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                              style={{ backgroundColor: getColorFromString(k.responsavel) || '#3B82F6' }}
                            >
                              {iniciais(k.responsavel)}
                            </div>
                          ) : (
                            <span className={`text-[10px] ${txtFraco}`}>Sem dono</span>
                          )}
                          <button
                            onClick={() => {
                              setValorBloqueio(k.bloqueado_por || '')
                              setEditandoBloqueio(editandoBloqueio === k.id ? null : k.id)
                            }}
                            disabled={emSync}
                            aria-label={k.bloqueado_por ? `Editar bloqueio de ${k.titulo}` : `Marcar ${k.titulo} como bloqueado`}
                            className={`p-1.5 rounded-lg transition-colors motion-reduce:transition-none ${foco} ${
                              k.bloqueado_por
                                ? (isDarkMode ? 'text-amber-400 hover:bg-slate-700' : 'text-amber-600 hover:bg-amber-50')
                                : (isDarkMode ? 'text-slate-500 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-100')
                            }`}
                          >
                            <IconLock />
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* 5. BLOQUEIOS — so aparece se houver algum ------------------------ */}
      {bloqueados.length > 0 && (
        <section className={`rounded-2xl border overflow-hidden mt-6 ${card}`}>
          <header className={`px-4 py-3 border-b ${isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
            <h3 className={`font-bold text-sm ${txt}`}>
              Parados esperando alguem ({bloqueados.length})
            </h3>
          </header>
          <ul className={`divide-y ${isDarkMode ? 'divide-slate-700/70' : 'divide-slate-100'}`}>
            {bloqueados.map(k => (
              <li key={k.id} className="px-4 py-2.5 flex items-center gap-3 flex-wrap">
                <span className={`text-[10px] font-mono tabular-nums ${txtFraco}`}>{codigoDoCard(k.id)}</span>
                <button onClick={() => irParaCard(k.id)} className={`text-sm font-semibold text-left flex-1 min-w-[10rem] hover:underline ${foco} ${txt}`}>
                  {k.titulo}
                </button>
                <span className={`text-[11px] font-medium ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                  {textoBloqueio(k)}
                </span>
                <button
                  onClick={() => salvarBloqueio(k.id, '')}
                  disabled={!!salvando[k.id]}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors motion-reduce:transition-none ${foco} ${
                    isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Desbloquear
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Aviso transitorio de falha de gravacao -------------------------- */}
      {aviso && (
        <div
          role="status"
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl border shadow-2xl text-sm font-semibold ${
            isDarkMode ? 'bg-slate-800 border-red-800 text-red-300' : 'bg-white border-red-200 text-red-700'
          }`}
        >
          {aviso}
        </div>
      )}
    </>
  )
}