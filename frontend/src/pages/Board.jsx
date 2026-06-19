import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useBoards } from '../hooks/useBoards'
import { useTheme } from '../contexts/ThemeContext'
import { apiFetch } from '../api/client'
import PageLayout from '../components/PageLayout'
import CardModal from '../components/CardModal'
import { mediaUrl } from '../utils/media'
import { isOverdue } from '../utils/dates'
import { formatCurrency, formatDate, getInitials, getColorFromString } from '../utils/formatters'
import { IconTrash, IconPencil, IconPlus, IconCalendar, IconCheck, IconKanban, IconList, IconPrioHigh, IconPrioLow, IconDollar } from '../utils/icons'

const BG_MAP = {
  default:  { dark: 'bg-slate-900', light: 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100' },
  ocean:    { dark: 'bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900', light: 'bg-gradient-to-br from-blue-100 via-sky-50 to-slate-100' },
  midnight: { dark: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-black', light: 'bg-gradient-to-br from-indigo-100 via-purple-50 to-white' },
  forest:   { dark: 'bg-gradient-to-br from-emerald-900 via-slate-900 to-black', light: 'bg-gradient-to-br from-emerald-100 via-green-50 to-white' },
}

const IconSort = ({className="w-3.5 h-3.5"}) => <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/></svg>

const SORT_OPTIONS = [
  { key: 'date_asc', label: 'Prazo mais proximo' },
  { key: 'date_desc', label: 'Prazo mais distante' },
  { key: 'payment_asc', label: 'Pagamento mais proximo' },
  { key: 'created_desc', label: 'Mais recente primeiro' },
  { key: 'tag', label: 'Por tag (A-Z)' },
]

export default function Board() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isDarkMode } = useTheme()
  const savedBg = localStorage.getItem('notrouble_bg') || 'default'

  const [viewMode, setViewMode] = useState('kanban')
  const [activeBoardId, setActiveBoardId] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')

  const [stageSort, setStageSort] = useState({})
  const getSortMode = (stageId) => stageSort[stageId] || 'date_asc'
  const setSortMode = (stageId, mode) => setStageSort(prev => ({ ...prev, [stageId]: mode }))
  const [openSortMenu, setOpenSortMenu] = useState(null)

  // Edicao do nome do quadro
  const [editingBoardName, setEditingBoardName] = useState(false)
  const [editBoardNameValue, setEditBoardNameValue] = useState("")

  const [isDragging, setIsDragging] = useState(false)
  const [draggingType, setDraggingType] = useState(null)
  const [draggedStageId, setDraggedStageId] = useState(null)
  const [dragOverStageId, setDragOverStageId] = useState(null)

  const [notification, setNotification] = useState(null)
  const [error, setError] = useState(null)
  const showNotification = useCallback((msg) => { setNotification({ message: msg }); setTimeout(() => setNotification(null), 3000) }, [])
  const showError = useCallback((msg) => { setError(msg); setTimeout(() => setError(null), 5000) }, [])

  const { boards, users, availableTags, setAvailableTags, loading, currentUser, fetchBoards, updateLocalCard, createBoard, deleteBoard, createCard, moveCard, deleteCard, createStage, updateStage, deleteStage, reorderStages, createTag } = useBoards(showError, showNotification)

  const [addingToStageId, setAddingToStageId] = useState(null)
  const [newCardTitle, setNewCardTitle] = useState("")
  const [addingStageToBoardId, setAddingStageToBoardId] = useState(null)
  const [newStageName, setNewStageName] = useState("")
  const [editingStageId, setEditingStageId] = useState(null)
  const [editStageName, setEditStageName] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [newBoardStages, setNewBoardStages] = useState(["A Fazer", "Em Andamento", "Concluido"])

  const handleCreateNewCard = (stageId) => { if (!newCardTitle.trim()) { setAddingToStageId(null); return }; createCard(stageId, newCardTitle); setNewCardTitle(""); setAddingToStageId(null) }
  const handleCreateNewStage = (boardId) => { if (!newStageName.trim()) { setAddingStageToBoardId(null); return }; createStage(boardId, newStageName); setNewStageName(""); setAddingStageToBoardId(null) }
  const saveStageEdit = (stageId) => { if (editStageName.trim()) { updateStage(stageId, editStageName) }; setEditingStageId(null) }
  const openModal = (cardId) => { setSelectedCardId(cardId); setIsModalOpen(true) }
  const cleanupDrag = useCallback(() => { setIsDragging(false); setDraggingType(null); setDraggedStageId(null); setDragOverStageId(null) }, [])

  // Renomear quadro
  const startEditBoardName = () => { if (!activeBoard) return; setEditBoardNameValue(activeBoard.name); setEditingBoardName(true) }
  const saveBoardName = () => {
    if (editBoardNameValue.trim() && activeBoard && editBoardNameValue !== activeBoard.name) {
      apiFetch(`/boards/${activeBoard.id}/`, { method: 'PUT', body: JSON.stringify({ name: editBoardNameValue }) })
        .then(r => { if (!r.ok) throw new Error(); fetchBoards(); showNotification('Quadro renomeado!') })
        .catch(() => showError('Erro ao renomear quadro'))
    }
    setEditingBoardName(false)
  }

  // Toggle concluido
  const toggleCardComplete = useCallback((e, cardId) => {
    e.stopPropagation()
    apiFetch(`/cards/${cardId}/toggle-complete/`, { method: 'PATCH' })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(() => fetchBoards())
      .catch(() => showError('Erro ao atualizar status'))
  }, [fetchBoards, showError])

  const urlBoardId = searchParams.get('id')
  useEffect(() => {
    if (boards.length === 0) return
    if (urlBoardId) { const f = boards.find(b => b.id === urlBoardId); if (f) { setActiveBoardId(f.id); return } }
    if (!activeBoardId || !boards.find(b => b.id === activeBoardId)) setActiveBoardId(boards[0].id)
  }, [boards, urlBoardId])

  // Abre card direto pela URL (vindo da busca global)
  const urlCardId = searchParams.get('card')
  useEffect(() => {
    if (urlCardId && boards.length > 0) {
      openModal(urlCardId)
      const p = new URLSearchParams(searchParams)
      p.delete('card')
      setSearchParams(p, { replace: true })
    }
  }, [urlCardId, boards])

  const activeBoard = boards.find(b => b.id === activeBoardId) ?? null

  const submitNewBoard = () => {
    if (!newBoardName.trim()) { showError("O quadro precisa de um nome!"); return }
    createBoard(newBoardName, newBoardStages.filter(s => s.trim() !== ""))
    setIsCreateBoardModalOpen(false); setNewBoardName(""); setNewBoardStages(["A Fazer", "Em Andamento", "Concluido"])
  }

  const filteredStages = useMemo(() => {
    if (!activeBoard) return []
    const lastId = activeBoard.stages.length > 0 ? activeBoard.stages[activeBoard.stages.length - 1].id : null
    return activeBoard.stages.map(stage => {
      let cards = stage.cards.filter(card => {
        if (activeFilter === 'all') return true
        // Concluido = is_completed OU ultima etapa
        if (activeFilter === 'completed') return card.is_completed || stage.id === lastId
        // Atrasado = tem data vencida E NAO esta concluido
        if (activeFilter === 'delayed') return isOverdue(card.due_date) && !card.is_completed && stage.id !== lastId
        return true
      })
      const mode = getSortMode(stage.id)
      cards = [...cards].sort((a, b) => {
        if (mode === 'date_asc') return (a.due_date || '9999') < (b.due_date || '9999') ? -1 : 1
        if (mode === 'date_desc') return (b.due_date || '') < (a.due_date || '') ? -1 : 1
        if (mode === 'payment_asc') return (a.payment_date || '9999') < (b.payment_date || '9999') ? -1 : 1
        if (mode === 'created_desc') return (b.created_at || '') < (a.created_at || '') ? -1 : 1
        if (mode === 'tag') return (a.tags?.[0]?.name || 'zzz').localeCompare(b.tags?.[0]?.name || 'zzz')
        return 0
      })
      return { ...stage, cards }
    })
  }, [activeBoard, activeFilter, stageSort])

  const displayStages = useMemo(() => {
    let stages = [...filteredStages]
    if (draggingType === 'stage' && draggedStageId && dragOverStageId && draggedStageId !== dragOverStageId) {
      const di = stages.findIndex(s => s.id === draggedStageId)
      const oi = stages.findIndex(s => s.id === dragOverStageId)
      if (di > -1 && oi > -1) { const [item] = stages.splice(di, 1); stages.splice(oi, 0, item) }
    }
    return stages
  }, [filteredStages, draggingType, draggedStageId, dragOverStageId])

  // Background
  const wpUrl = currentUser?.company?.wallpaper_url
  const isWp = savedBg === 'wallpaper' && wpUrl
  const bgClass = isWp ? '' : ((BG_MAP[savedBg] || BG_MAP.default)[isDarkMode ? 'dark' : 'light'])
  const bgStyle = isWp ? { backgroundImage: `url(${mediaUrl(wpUrl)})` } : undefined

  const headerActions = (
    <div className={`flex rounded-lg overflow-hidden border ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'}`}>
      <button onClick={() => setViewMode('kanban')} className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : (isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100')}`}><IconKanban /> Kanban</button>
      <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : (isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100')}`}><IconList /> Lista</button>
    </div>
  )

  if (loading && boards.length === 0) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500 bg-slate-900">Carregando...</div>

  // Metricas — is_completed NAO conta como atrasado
  const lastStageId = activeBoard?.stages.length > 0 ? activeBoard.stages[activeBoard.stages.length - 1].id : null
  const totalInBoard = activeBoard?.stages.reduce((a, s) => a + s.cards.length, 0) || 0
  const doneInBoard = activeBoard?.stages.reduce((a, s) => a + s.cards.filter(c => c.is_completed || s.id === lastStageId).length, 0) || 0
  const lateInBoard = activeBoard?.stages.filter(s => s.id !== lastStageId).reduce((a, s) => a + s.cards.filter(c => isOverdue(c.due_date) && !c.is_completed).length, 0) || 0

  // ---- MINI CARD ----
  const MiniCard = ({ card }) => {
    const result = parseFloat(card.estimated_value || 0) - parseFloat(card.invested_value || 0)
    const hasFinancial = card.estimated_value || card.invested_value
    const completed = card.is_completed
    const overdue = !completed && isOverdue(card.due_date)

    return (
      <div
        draggable
        onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('type', 'card'); e.dataTransfer.setData('card_id', card.id); setIsDragging(true); setDraggingType('card') }}
        onDragEnd={cleanupDrag}
        onClick={() => openModal(card.id)}
        className={`card-hover p-3 rounded-lg border cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md group animate-fade-in transition-all ${completed ? (isDarkMode ? 'bg-slate-700/50 border-emerald-800/50' : 'bg-emerald-50/50 border-emerald-200') : (isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200')}`}
      >
        {/* Titulo + prioridade + toggle concluido */}
        <div className="flex items-start gap-2 mb-2">
          <button
            onClick={(e) => toggleCardComplete(e, card.id)}
            className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${completed ? 'bg-emerald-500 border-emerald-500 text-white' : (isDarkMode ? 'border-slate-500 hover:border-emerald-500' : 'border-slate-300 hover:border-emerald-500')}`}
            title={completed ? 'Reabrir card' : 'Marcar como concluido'}
          >
            {completed && <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
          </button>
          <p className={`font-semibold text-sm leading-snug group-hover:text-blue-500 flex-1 ${completed ? 'line-through opacity-60' : ''} ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{card.title}</p>
          <div className="shrink-0 flex items-center gap-1">
            {card.priority === 'high' && <IconPrioHigh />}
            {card.priority === 'low' && <IconPrioLow />}
          </div>
        </div>

        {/* Tags com nome */}
        {card.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {card.tags.slice(0, 4).map(t => (
              <span key={t.id} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold text-white leading-none whitespace-nowrap" style={{ backgroundColor: t.color }}>{t.name || 'Sem nome'}</span>
            ))}
            {card.tags.length > 4 && <span className={`text-[10px] font-bold self-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>+{card.tags.length - 4}</span>}
          </div>
        )}

        {/* Metadados */}
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] font-semibold ${completed ? 'opacity-50' : ''} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {card.due_date && <span className={`flex items-center gap-1 ${overdue ? 'text-red-500' : ''}`}><IconCalendar /> {formatDate(card.due_date)}</span>}
          {card.payment_date && <span className="flex items-center gap-1 text-green-500"><IconDollar className="w-3 h-3" /> {formatDate(card.payment_date)}</span>}
          {card.checklist_count > 0 && <span className="flex items-center gap-1"><IconCheck /> {card.checklist_done}/{card.checklist_count}</span>}
          {hasFinancial && <span className={`font-bold ${result < 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(result)}</span>}
          {card.assignee && <div className="ml-auto h-5 w-5 rounded-full flex items-center justify-center text-[8px] text-white font-bold" style={{ backgroundColor: getColorFromString(card.assignee.username) }} title={card.assignee.first_name || card.assignee.username}>{getInitials(card.assignee.first_name, card.assignee.last_name, card.assignee.username) || card.assignee.username.substring(0, 2).toUpperCase()}</div>}
        </div>
      </div>
    )
  }

  return (
    <PageLayout boards={boards} currentUser={currentUser} activeBoardId={activeBoardId} onBoardSelect={(id) => { setActiveBoardId(id); setSearchParams({ id }); setActiveFilter('all') }} onCreateBoard={() => setIsCreateBoardModalOpen(true)} headerActions={headerActions} bgClass={bgClass} bgStyle={bgStyle}>
      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .card-hover { transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(59,130,246,0.15); }
        .custom-scrollbar::-webkit-scrollbar { height: 10px; width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.3); border-radius: 10px; border: 3px solid transparent; background-clip: padding-box; }
      `}</style>

      {activeBoard && (
        <div className="mb-12 animate-fade-in">
          <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Nome do quadro editavel */}
            <div>
              {editingBoardName ? (
                <input
                  type="text" autoFocus
                  value={editBoardNameValue}
                  onChange={e => setEditBoardNameValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveBoardName(); if (e.key === 'Escape') setEditingBoardName(false) }}
                  onBlur={saveBoardName}
                  className={`text-2xl font-bold p-1 rounded border-2 focus:outline-none focus:ring-0 w-full max-w-md ${isDarkMode ? 'bg-slate-800 border-blue-500 text-white' : 'bg-white border-blue-500 text-slate-800'}`}
                />
              ) : (
                <div className="flex items-center gap-3 group/title">
                  <h2 className={`text-2xl font-bold cursor-text ${isDarkMode ? 'text-white' : 'text-slate-800'}`} onDoubleClick={startEditBoardName}>{activeBoard.name}</h2>
                  <button onClick={startEditBoardName} className="opacity-0 group-hover/title:opacity-100 transition-opacity text-slate-400 hover:text-blue-500"><IconPencil className="w-4 h-4" /></button>
                </div>
              )}
              <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-2" />
            </div>
            <button onClick={() => deleteBoard(activeBoard.id)} className={`px-3 py-1.5 rounded-lg font-semibold text-xs border transition-all hover:scale-105 flex items-center gap-1.5 ${isDarkMode ? 'bg-red-900/20 border-red-800 text-red-500 hover:bg-red-900/40' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'}`}><IconTrash /> Excluir Quadro</button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'all', label: `Todos (${totalInBoard})`, accent: '' },
                { key: 'completed', label: `Concluidos (${doneInBoard})`, accent: doneInBoard > 0 ? 'text-blue-500' : '' },
                { key: 'delayed', label: `Atrasados (${lateInBoard})`, accent: lateInBoard > 0 ? 'text-red-500' : '' },
              ].map(f => (
                <button key={f.key} onClick={() => setActiveFilter(f.key)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${activeFilter === f.key ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : (isDarkMode ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500' : 'bg-white/80 border-slate-200 text-slate-500 hover:border-blue-300')} ${f.accent && activeFilter !== f.key ? f.accent : ''}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={() => navigate('/data')} className={`text-xs font-semibold transition-colors ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>Ver relatorios completos →</button>
          </div>

          {viewMode === 'list' ? (
            <div className={`rounded-xl shadow-lg border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className={`text-xs uppercase tracking-wider ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                    <tr><th className="p-4 font-bold w-8"></th><th className="p-4 font-bold">Titulo</th><th className="p-4 font-bold">Etapa</th><th className="p-4 font-bold">Tags</th><th className="p-4 font-bold">Prazo</th><th className="p-4 font-bold">Pagamento</th><th className="p-4 font-bold">Resultado</th><th className="p-4 font-bold text-right">Acoes</th></tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700 text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
                    {displayStages.flatMap(s => s.cards.map(c => ({...c, stageName: s.name}))).length === 0 ? (
                      <tr><td colSpan="8" className="p-8 text-center italic opacity-50">Nenhum card neste filtro.</td></tr>
                    ) : displayStages.flatMap(s => s.cards.map(c => ({...c, stageName: s.name}))).map(card => {
                      const result = parseFloat(card.estimated_value||0) - parseFloat(card.invested_value||0)
                      const hasF = card.estimated_value || card.invested_value
                      const overdue = !card.is_completed && isOverdue(card.due_date)
                      return (
                        <tr key={card.id} onClick={() => openModal(card.id)} className={`transition-colors cursor-pointer group ${card.is_completed ? 'opacity-60' : ''} ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                          <td className="p-4"><button onClick={(e) => toggleCardComplete(e, card.id)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${card.is_completed ? 'bg-emerald-500 border-emerald-500 text-white' : (isDarkMode ? 'border-slate-500 hover:border-emerald-500' : 'border-slate-300 hover:border-emerald-500')}`}>{card.is_completed && <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}</button></td>
                          <td className="p-4 font-semibold text-sm group-hover:text-blue-500"><div className={`flex items-center gap-2 ${card.is_completed?'line-through':''}`}>{card.priority==='high'&&<IconPrioHigh/>}{card.priority==='low'&&<IconPrioLow/>}{card.title}</div></td>
                          <td className="p-4"><span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${isDarkMode?'bg-slate-900 text-blue-400':'bg-blue-50 text-blue-600'}`}>{card.stageName}</span></td>
                          <td className="p-4"><div className="flex flex-wrap gap-1">{card.tags?.slice(0,3).map(t=><span key={t.id} className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold text-white" style={{backgroundColor:t.color}}>{t.name||'?'}</span>)}</div></td>
                          <td className={`p-4 text-sm ${overdue?'text-red-500':''}`}>{card.due_date?formatDate(card.due_date):'-'}</td>
                          <td className="p-4 text-sm text-green-500">{card.payment_date?formatDate(card.payment_date):'-'}</td>
                          <td className="p-4 text-sm font-bold">{hasF?<span className={result<0?'text-red-500':'text-green-500'}>{formatCurrency(result)}</span>:'-'}</td>
                          <td className="p-4 text-right"><button onClick={e=>{e.stopPropagation();deleteCard(card.id)}} className="p-2 text-slate-400 hover:text-red-500 rounded-lg"><IconTrash/></button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-6 items-start custom-scrollbar min-h-[calc(100vh-280px)]">
              {displayStages.map((stage) => (
                <div key={stage.id} draggable={draggingType!=='card'}
                  onDragStart={e=>{if(draggingType==='card')return;e.dataTransfer.setData('type','stage');e.dataTransfer.setData('stage_id',stage.id);setDraggingType('stage');setTimeout(()=>setDraggedStageId(stage.id),0)}}
                  onDragOver={e=>{e.preventDefault();if(draggingType==='stage'&&draggedStageId!==stage.id)setDragOverStageId(stage.id)}}
                  onDragEnd={()=>{if(draggingType==='stage'&&draggedStageId&&dragOverStageId&&draggedStageId!==dragOverStageId)reorderStages(activeBoard.id,displayStages.map(s=>s.id));cleanupDrag()}}
                  onDrop={e=>{e.preventDefault();e.stopPropagation();const t=e.dataTransfer.getData('type')||draggingType;if(t==='card'){const cid=e.dataTransfer.getData('card_id');if(cid)moveCard(cid,stage.id)};cleanupDrag()}}
                  className={`rounded-xl p-3 min-w-[280px] w-[280px] shadow-sm border transition-all duration-300 cursor-grab active:cursor-grabbing flex flex-col max-h-[calc(100vh-180px)] ${draggedStageId===stage.id?(isDarkMode?'bg-slate-800/40 border-slate-600 border-dashed opacity-50 scale-95':'bg-slate-200/50 border-slate-400 border-dashed opacity-50 scale-95'):(isDarkMode?'bg-slate-800/80 border-slate-700':'bg-slate-100 border-slate-200')}`}
                >
                  <div className={`transition-opacity duration-200 flex flex-col h-full ${draggedStageId===stage.id?'opacity-0':'opacity-100'}`}>
                    <div className="mb-3 flex items-center justify-between group/header">
                      {editingStageId===stage.id?(
                        <input type="text" autoFocus value={editStageName} onChange={e=>setEditStageName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&saveStageEdit(stage.id)} onBlur={()=>saveStageEdit(stage.id)} className={`w-full p-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold uppercase text-xs tracking-widest ${isDarkMode?'bg-slate-900 border-slate-600 text-white':'bg-white border-blue-300 text-slate-800'}`}/>
                      ):(
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold uppercase text-xs tracking-widest cursor-text ${isDarkMode?'text-slate-100 hover:text-blue-400':'text-slate-700 hover:text-blue-600'}`} onDoubleClick={()=>{setEditingStageId(stage.id);setEditStageName(stage.name)}}>{stage.name}</h3>
                          <div className="opacity-0 group-hover/header:opacity-100 transition-opacity flex gap-1">
                            <button onClick={()=>{setEditingStageId(stage.id);setEditStageName(stage.name)}} className="text-slate-400 hover:text-blue-500 p-0.5"><IconPencil/></button>
                            <button onClick={()=>deleteStage(stage.id)} className="text-slate-400 hover:text-red-500 p-0.5"><IconTrash/></button>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDarkMode?'bg-blue-900/50 text-blue-400':'bg-blue-200 text-blue-800'}`}>{stage.cards?.length||0}</span>
                        <div className="relative">
                          <button onClick={(e)=>{e.stopPropagation();setOpenSortMenu(openSortMenu===stage.id?null:stage.id)}} className={`p-0.5 rounded opacity-0 group-hover/header:opacity-100 transition-opacity ${isDarkMode?'hover:bg-slate-600 text-slate-400':'hover:bg-slate-200 text-slate-500'}`} title="Ordenar"><IconSort/></button>
                          {openSortMenu===stage.id&&(
                            <>
                              <div className="fixed inset-0 z-40" onClick={()=>setOpenSortMenu(null)}/>
                              <div className={`absolute right-0 top-full mt-1 w-48 rounded-lg border shadow-xl z-50 overflow-hidden ${isDarkMode?'bg-slate-800 border-slate-600':'bg-white border-slate-200'}`}>
                                {SORT_OPTIONS.map(opt=>(
                                  <button key={opt.key} onClick={(e)=>{e.stopPropagation();setSortMode(stage.id,opt.key);setOpenSortMenu(null)}} className={`w-full text-left px-3 py-2.5 text-xs font-semibold transition-colors ${getSortMode(stage.id)===opt.key?'bg-blue-600 text-white':(isDarkMode?'text-slate-200 hover:bg-slate-700':'text-slate-700 hover:bg-slate-100')}`}>{opt.label}</button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2.5 pb-2 pr-1 min-h-[50px]">
                      {stage.cards?.length > 0
                        ? stage.cards.map(card => <MiniCard key={card.id} card={card} />)
                        : <div className="h-full w-full opacity-0">.</div>
                      }
                    </div>

                    {addingToStageId===stage.id?(
                      <div className="mt-2"><input type="text" className={`w-full p-2.5 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm font-medium text-[13px] ${isDarkMode?'bg-slate-900 border-slate-600 text-white placeholder-slate-500':'bg-white border-blue-300 text-slate-800'}`} placeholder="Titulo do Card..." autoFocus value={newCardTitle} onChange={e=>setNewCardTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleCreateNewCard(stage.id)} onBlur={()=>handleCreateNewCard(stage.id)}/></div>
                    ):(
                      <button onClick={()=>setAddingToStageId(stage.id)} className={`w-full mt-2 flex items-center gap-2 px-2 py-1.5 rounded-md font-semibold text-[12px] ${isDarkMode?'text-slate-400 hover:bg-slate-700 hover:text-slate-200':'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}><IconPlus className="w-3.5 h-3.5"/> Adicionar Card</button>
                    )}
                  </div>
                </div>
              ))}

              <div onDragOver={e=>e.preventDefault()} className={`min-w-[280px] w-[280px] rounded-xl p-3 flex flex-col justify-start items-center border border-dashed ${isDarkMode?'border-slate-700 hover:border-slate-500 bg-slate-800/30':'border-slate-300 hover:border-slate-400 bg-slate-50/50'}`}>
                {addingStageToBoardId===activeBoard.id?(
                  <div className="w-full"><input type="text" autoFocus value={newStageName} onChange={e=>setNewStageName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleCreateNewStage(activeBoard.id)} onBlur={()=>handleCreateNewStage(activeBoard.id)} className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold text-xs text-center ${isDarkMode?'bg-slate-900 border-slate-600 text-white':'bg-white border-slate-300 text-slate-800'}`} placeholder="Nome da Etapa..."/></div>
                ):(
                  <button onClick={()=>setAddingStageToBoardId(activeBoard.id)} className={`w-full font-semibold text-sm flex items-center justify-center gap-2 p-2 rounded-md ${isDarkMode?'text-slate-400 hover:bg-slate-700':'text-slate-500 hover:bg-slate-200'}`}><IconPlus/> Nova Etapa</button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {isDragging&&draggingType==='card'&&(
        <div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.stopPropagation();const cid=e.dataTransfer.getData('card_id');if(cid)deleteCard(cid);cleanupDrag()}} className="fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-3 bg-red-600/90 backdrop-blur-md text-white rounded-xl shadow-2xl flex items-center gap-3 border border-white/20 z-50">
          <IconTrash className="w-5 h-5"/><span className="font-semibold text-sm">Solte para excluir</span>
        </div>
      )}

      {isCreateBoardModalOpen&&(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl flex flex-col animate-fade-in ${isDarkMode?'bg-slate-800 text-slate-200':'bg-white text-slate-800'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${isDarkMode?'border-slate-700':'border-slate-200'}`}><h2 className="text-xl font-bold">Criar Novo Quadro</h2><button onClick={()=>setIsCreateBoardModalOpen(false)} className="text-slate-400 hover:text-red-500 text-xl font-bold">&times;</button></div>
            <div className="p-6 flex flex-col gap-6">
              <div><label className="block text-xs font-bold uppercase tracking-wide mb-2 opacity-80">Nome do Projeto</label><input type="text" value={newBoardName} onChange={e=>setNewBoardName(e.target.value)} autoFocus className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm ${isDarkMode?'bg-slate-900 border-slate-700 text-white':'bg-slate-50 border-slate-300'}`} placeholder="Ex: Lancamento Site Novo"/></div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2 opacity-80">Etapas (Colunas)</label>
                <div className="flex flex-col gap-2">
                  {newBoardStages.map((s,i)=><div key={i} className="flex gap-2"><input type="text" value={s} onChange={e=>{const ns=[...newBoardStages];ns[i]=e.target.value;setNewBoardStages(ns)}} className={`flex-1 p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm ${isDarkMode?'bg-slate-900 border-slate-700 text-white':'bg-white border-slate-300'}`} placeholder={`Etapa ${i+1}`}/><button onClick={()=>setNewBoardStages(newBoardStages.filter((_,j)=>j!==i))} className={`p-3 rounded-lg border ${isDarkMode?'border-slate-700 hover:bg-red-900/30 text-slate-400 hover:text-red-400':'border-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-500'}`}><IconTrash/></button></div>)}
                  <button onClick={()=>setNewBoardStages([...newBoardStages,""])} className={`mt-2 p-3 rounded-lg border border-dashed font-semibold text-sm flex items-center justify-center gap-2 ${isDarkMode?'border-slate-600 text-blue-400 hover:bg-slate-700':'border-slate-300 text-blue-600 hover:bg-blue-50'}`}><IconPlus/> Adicionar Etapa</button>
                </div>
              </div>
            </div>
            <div className={`p-6 border-t flex justify-end gap-3 ${isDarkMode?'border-slate-700 bg-slate-800/50':'border-slate-200 bg-slate-50/50'}`}>
              <button onClick={()=>setIsCreateBoardModalOpen(false)} className={`px-5 py-2.5 rounded-lg font-semibold text-sm ${isDarkMode?'hover:bg-slate-700':'hover:bg-slate-200'}`}>Cancelar</button>
              <button onClick={submitNewBoard} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg">Criar Quadro</button>
            </div>
          </div>
        </div>
      )}

      <CardModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} cardId={selectedCardId} boards={boards} users={users} availableTags={availableTags} setAvailableTags={setAvailableTags} createTag={createTag} refreshBoards={fetchBoards} updateLocalCard={updateLocalCard} currentUser={currentUser} showNotification={showNotification} showError={showError} deleteCard={deleteCard}/>
    </PageLayout>
  )
}