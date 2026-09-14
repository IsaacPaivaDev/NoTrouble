import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useBoards } from '../hooks/useBoards'
import { apiFetch } from '../api/client'
import PageLayout from '../components/PageLayout'
import { isOverdue } from '../utils/dates'
import { getInitials, getColorFromString } from '../utils/formatters'
import { IconChevron, IconPlus, IconX, IconCalendar, IconDollar } from '../utils/icons'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const MONTHS = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

// Cores dos boards no calendario
const BOARD_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#84CC16']

export default function Calendar() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const showNotification = useCallback((msg) => console.log(msg), [])
  const showError = useCallback((msg) => console.error(msg), [])
  const { boards, currentUser, loading, fetchBoards } = useBoards(showError, showNotification)

  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [viewMode, setViewMode] = useState('month') // month | week
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date(today); d.setDate(d.getDate() - d.getDay()); return d
  })

  // Filtros
  const [visibleBoards, setVisibleBoards] = useState({}) // boardId -> bool
  const [showDueDates, setShowDueDates] = useState(true)
  const [showPaymentDates, setShowPaymentDates] = useState(true)

  // Form de criacao
  const [creatingOn, setCreatingOn] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [selectedBoardId, setSelectedBoardId] = useState('')
  const [selectedStageId, setSelectedStageId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const titleInputRef = useRef(null)

  // Hover preview
  const [hoveredCard, setHoveredCard] = useState(null)
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 })

  // Drag
  const [draggingCardId, setDraggingCardId] = useState(null)
  const [draggingType, setDraggingType] = useState(null) // 'due' | 'payment'
  const [dragOverDay, setDragOverDay] = useState(null)

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) } else setCurrentMonth(m => m - 1) }
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) } else setCurrentMonth(m => m + 1) }
  const goToday = () => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); setCurrentWeekStart(() => { const d = new Date(today); d.setDate(d.getDate() - d.getDay()); return d }) }
  const prevWeek = () => setCurrentWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
  const nextWeek = () => setCurrentWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })

  // Inicializa filtro de boards — todos visiveis
  useEffect(() => {
    if (boards.length > 0 && Object.keys(visibleBoards).length === 0) {
      const init = {}; boards.forEach(b => { init[b.id] = true }); setVisibleBoards(init)
    }
  }, [boards])

  const toggleBoard = (id) => setVisibleBoards(prev => ({ ...prev, [id]: !prev[id] }))

  const selectedBoard = boards.find(b => b.id === selectedBoardId)
  const availableStages = selectedBoard?.stages || []

  useEffect(() => {
    if (creatingOn && boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0].id)
    }
  }, [creatingOn, boards])

  useEffect(() => {
    if (selectedBoardId) {
      const b = boards.find(b => b.id === selectedBoardId)
      if (b?.stages?.length > 0) setSelectedStageId(b.stages[0].id)
    }
  }, [selectedBoardId])

  useEffect(() => {
    if (creatingOn) setTimeout(() => titleInputRef.current?.focus(), 100)
  }, [creatingOn])

  // Mapa de cor por board
  const boardColorMap = useMemo(() => {
    const map = {}
    boards.forEach((b, i) => { map[b.id] = BOARD_COLORS[i % BOARD_COLORS.length] })
    return map
  }, [boards])

  // Todos os eventos (due_date + payment_date)
  const allEvents = useMemo(() => {
    const events = []
    boards.forEach(board => {
      if (!visibleBoards[board.id]) return
      board.stages?.forEach(stage => {
        stage.cards?.forEach(card => {
          if (card.due_date && showDueDates) {
            events.push({ ...card, boardId: board.id, boardName: board.name, stageName: stage.name, dateObj: new Date(card.due_date), eventType: 'due', color: boardColorMap[board.id] })
          }
          if (card.payment_date && showPaymentDates) {
            events.push({ ...card, boardId: board.id, boardName: board.name, stageName: stage.name, dateObj: new Date(card.payment_date + 'T12:00:00'), eventType: 'payment', color: '#10B981' })
          }
        })
      })
    })
    return events
  }, [boards, visibleBoards, showDueDates, showPaymentDates, boardColorMap])

  // Dias do mes
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startPad = firstDay.getDay()
    const days = []
    const prevLastDay = new Date(currentYear, currentMonth, 0).getDate()
    for (let i = startPad - 1; i >= 0; i--) days.push({ day: prevLastDay - i, inMonth: false, date: new Date(currentYear, currentMonth - 1, prevLastDay - i) })
    for (let d = 1; d <= lastDay.getDate(); d++) days.push({ day: d, inMonth: true, date: new Date(currentYear, currentMonth, d) })
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) days.push({ day: i, inMonth: false, date: new Date(currentYear, currentMonth + 1, i) })
    return days
  }, [currentMonth, currentYear])

  // Dias da semana
  const weekDays = useMemo(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart); d.setDate(d.getDate() + i)
      days.push({ day: d.getDate(), inMonth: true, date: d })
    }
    return days
  }, [currentWeekStart])

  const getEventsForDay = (date) => allEvents.filter(c => c.dateObj.getDate() === date.getDate() && c.dateObj.getMonth() === date.getMonth() && c.dateObj.getFullYear() === date.getFullYear())

  const isTodayFn = (date) => date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
  const toDateStr = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`

  const goToCard = (card) => navigate(`/board?id=${card.boardId}&card=${card.id}`)

  const startCreating = (date) => { setCreatingOn(toDateStr(date)); setNewTitle(''); setSelectedBoardId(boards.length > 0 ? boards[0].id : '') }
  const cancelCreating = () => { setCreatingOn(null); setNewTitle('') }

  const handleCreateCard = async () => {
    if (!newTitle.trim() || !selectedStageId) return
    setIsSaving(true)
    try {
      const res = await apiFetch('/cards/', { method: 'POST', body: JSON.stringify({ title: newTitle, stage_id: selectedStageId }) })
      if (!res.ok) throw new Error()
      const card = await res.json()
      const dueDate = new Date(creatingOn + 'T12:00:00')
      await apiFetch(`/cards/${card.id}/`, { method: 'PATCH', body: JSON.stringify({ due_date: dueDate.toISOString() }) })
      cancelCreating(); fetchBoards()
    } catch { showError('Erro ao criar card') }
    finally { setIsSaving(false) }
  }

  // Drag to reschedule
  const handleDrop = async (targetDate) => {
    if (!draggingCardId || !targetDate) return
    const newDateStr = toDateStr(targetDate)
    try {
      const field = draggingType === 'payment' ? 'payment_date' : 'due_date'
      const value = draggingType === 'payment' ? newDateStr : new Date(newDateStr + 'T12:00:00').toISOString()
      await apiFetch(`/cards/${draggingCardId}/`, { method: 'PATCH', body: JSON.stringify({ [field]: value }) })
      fetchBoards()
    } catch { showError('Erro ao reagendar') }
    finally { setDraggingCardId(null); setDraggingType(null); setDragOverDay(null) }
  }

  const handleCardHover = (e, card) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setHoverPos({ x: rect.right + 8, y: rect.top })
    setHoveredCard(card)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500 bg-slate-900">Carregando...</div>

  const activeDays = viewMode === 'month' ? calendarDays : weekDays
  const weekLabel = viewMode === 'week' ? `${weekDays[0].date.getDate()} - ${weekDays[6].date.getDate()} ${MONTHS[weekDays[0].date.getMonth()]} ${weekDays[0].date.getFullYear()}` : ''

  // Render de um dia (reutilizado em month e week)
  const renderDay = (dayInfo, isWeekView = false) => {
    const dayEvents = getEventsForDay(dayInfo.date)
    const _isToday = isTodayFn(dayInfo.date)
    const dayStr = toDateStr(dayInfo.date)
    const isCreatingHere = creatingOn === dayStr
    const isDragOver = dragOverDay === dayStr
    const maxShow = isWeekView ? 8 : 3

    return (
      <div
        key={dayStr}
        onDragOver={e => { e.preventDefault(); setDragOverDay(dayStr) }}
        onDragLeave={() => setDragOverDay(null)}
        onDrop={() => handleDrop(dayInfo.date)}
        className={`${isWeekView ? 'min-h-[300px]' : 'min-h-[110px] md:min-h-[130px]'} p-1.5 border-b border-r transition-colors relative group/day ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'} ${!dayInfo.inMonth ? (isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50/50') : ''} ${_isToday ? (isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50/50') : ''} ${isDragOver ? (isDarkMode ? 'bg-blue-900/40 ring-2 ring-inset ring-blue-500' : 'bg-blue-100/80 ring-2 ring-inset ring-blue-400') : ''}`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-full ${!dayInfo.inMonth ? 'opacity-30' : ''} ${_isToday ? 'bg-blue-600 text-white' : (isDarkMode ? 'text-slate-300' : 'text-slate-700')}`}>{dayInfo.day}</span>
          {dayInfo.inMonth && !isCreatingHere && (
            <button onClick={() => startCreating(dayInfo.date)} className={`w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover/day:opacity-100 transition-all ${isDarkMode ? 'bg-blue-600/30 text-blue-400 hover:bg-blue-600 hover:text-white' : 'bg-blue-100 text-blue-500 hover:bg-blue-500 hover:text-white'}`} title="Criar card">
              <IconPlus className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Form inline */}
        {isCreatingHere && (
          <div className={`absolute left-0 top-0 w-[280px] p-3 rounded-xl border shadow-2xl z-50 flex flex-col gap-2 ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{dayInfo.day} {MONTHS[dayInfo.date.getMonth()]}</span>
              <button onClick={cancelCreating} className="text-slate-400 hover:text-red-500"><IconX className="w-3.5 h-3.5" /></button>
            </div>
            <input ref={titleInputRef} type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCreateCard(); if (e.key === 'Escape') cancelCreating() }} placeholder="Titulo do card..." className={`w-full p-2 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-800'}`} />
            <select value={selectedBoardId} onChange={e => setSelectedBoardId(e.target.value)} className={`w-full p-2 rounded-lg border text-xs font-semibold cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-700'}`}>
              {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={selectedStageId} onChange={e => setSelectedStageId(e.target.value)} className={`w-full p-2 rounded-lg border text-xs font-semibold cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-700'}`}>
              {availableStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={handleCreateCard} disabled={isSaving || !newTitle.trim()} className="w-full py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40">{isSaving ? 'Criando...' : 'Criar Card'}</button>
          </div>
        )}

        {/* Eventos */}
        <div className="flex flex-col gap-0.5 overflow-y-auto" style={{ scrollbarWidth: 'thin', maxHeight: isWeekView ? '260px' : '80px' }}>
          {dayEvents.slice(0, maxShow).map((ev, idx) => {
            const overdue = ev.eventType === 'due' && !ev.is_completed && isOverdue(ev.due_date)
            const completed = ev.is_completed
            const isPay = ev.eventType === 'payment'
            return (
              <button
                key={`${ev.id}-${ev.eventType}-${idx}`}
                draggable
                onDragStart={() => { setDraggingCardId(ev.id); setDraggingType(ev.eventType) }}
                onClick={() => goToCard(ev)}
                onMouseEnter={e => handleCardHover(e, ev)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`w-full text-left px-1.5 py-1 rounded text-[10px] font-semibold truncate transition-colors cursor-grab active:cursor-grabbing flex items-center gap-1 ${completed ? (isDarkMode ? 'bg-emerald-900/40 text-emerald-400 line-through' : 'bg-emerald-50 text-emerald-600 line-through') : overdue ? (isDarkMode ? 'bg-red-900/40 text-red-400' : 'bg-red-50 text-red-600') : ''}`}
                style={!completed && !overdue ? { backgroundColor: ev.color + (isDarkMode ? '30' : '20'), color: isDarkMode ? ev.color : undefined } : undefined}
              >
                {isPay ? <IconDollar className="w-2.5 h-2.5 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />}
                <span className="truncate">{ev.title}</span>
              </button>
            )
          })}
          {dayEvents.length > maxShow && (
            <span className={`text-[9px] font-bold text-center block ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>+{dayEvents.length - maxShow} mais</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <PageLayout boards={boards} currentUser={currentUser}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Calendario</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-2" />
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className={`flex rounded-lg overflow-hidden border ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'}`}>
              <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 text-xs font-bold transition-colors ${viewMode === 'month' ? 'bg-blue-600 text-white' : (isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100')}`}>Mes</button>
              <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 text-xs font-bold transition-colors ${viewMode === 'week' ? 'bg-blue-600 text-white' : (isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100')}`}>Semana</button>
            </div>
            <button onClick={goToday} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Hoje</button>
            <button onClick={viewMode === 'month' ? prevMonth : prevWeek} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}><IconChevron className="w-5 h-5 rotate-90" /></button>
            <span className={`text-lg font-bold min-w-[220px] text-center ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{viewMode === 'month' ? `${MONTHS[currentMonth]} ${currentYear}` : weekLabel}</span>
            <button onClick={viewMode === 'month' ? nextMonth : nextWeek} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}><IconChevron className="w-5 h-5 -rotate-90" /></button>
          </div>
        </div>

        {/* Filtros: boards + tipos */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {boards.map((b, i) => (
            <button key={b.id} onClick={() => toggleBoard(b.id)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 ${visibleBoards[b.id] ? 'border-transparent text-white shadow-sm' : (isDarkMode ? 'border-slate-600 text-slate-500 opacity-50' : 'border-slate-300 text-slate-400 opacity-50')}`} style={visibleBoards[b.id] ? { backgroundColor: BOARD_COLORS[i % BOARD_COLORS.length] } : undefined}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BOARD_COLORS[i % BOARD_COLORS.length] }} />{b.name}
            </button>
          ))}
          <div className={`h-5 w-px mx-1 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
          <button onClick={() => setShowDueDates(!showDueDates)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 ${showDueDates ? (isDarkMode ? 'bg-blue-900/40 border-blue-700 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600') : (isDarkMode ? 'border-slate-600 text-slate-500 opacity-50' : 'border-slate-300 text-slate-400 opacity-50')}`}>
            <IconCalendar className="w-3 h-3" /> Prazos
          </button>
          <button onClick={() => setShowPaymentDates(!showPaymentDates)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 ${showPaymentDates ? (isDarkMode ? 'bg-emerald-900/40 border-emerald-700 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600') : (isDarkMode ? 'border-slate-600 text-slate-500 opacity-50' : 'border-slate-300 text-slate-400 opacity-50')}`}>
            <IconDollar className="w-3 h-3" /> Pagamentos
          </button>
        </div>

        {/* Grid */}
        <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`grid grid-cols-7 border-b ${isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
            {WEEKDAYS.map(d => <div key={d} className={`p-3 text-center text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {activeDays.map(dayInfo => renderDay(dayInfo, viewMode === 'week'))}
          </div>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap items-center gap-4 mt-4 justify-center">
          {[
            { label: 'Atrasado', cls: isDarkMode ? 'bg-red-900/40' : 'bg-red-50 border border-red-200' },
            { label: 'Concluido', cls: isDarkMode ? 'bg-emerald-900/40' : 'bg-emerald-50 border border-emerald-200' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <div className={`w-4 h-3 rounded ${l.cls}`} /><span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{l.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <IconDollar className="w-3 h-3 text-emerald-500" /><span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Data de pagamento</span>
          </div>
          <span className={`text-[10px] italic ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Arraste cards entre dias pra reagendar</span>
        </div>
      </div>

      {/* Tooltip de preview */}
      {hoveredCard && (
        <div className={`fixed z-[60] w-56 p-3 rounded-xl border shadow-2xl pointer-events-none ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`} style={{ left: Math.min(hoverPos.x, window.innerWidth - 240), top: Math.min(hoverPos.y, window.innerHeight - 160) }}>
          <p className={`font-bold text-sm mb-1.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{hoveredCard.title}</p>
          <div className="flex flex-col gap-1">
            <span className={`text-[10px] font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{hoveredCard.boardName} / {hoveredCard.stageName}</span>
            {hoveredCard.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">{hoveredCard.tags.slice(0, 3).map(t => <span key={t.id} className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ backgroundColor: t.color }}>{t.name}</span>)}</div>
            )}
            {hoveredCard.assignee && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white font-bold" style={{ backgroundColor: getColorFromString(hoveredCard.assignee.username) }}>{getInitials(hoveredCard.assignee.first_name, hoveredCard.assignee.last_name, hoveredCard.assignee.username)}</div>
                <span className={`text-[10px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{hoveredCard.assignee.first_name || hoveredCard.assignee.username}</span>
              </div>
            )}
            <span className={`text-[9px] mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{hoveredCard.eventType === 'payment' ? 'Data de pagamento' : hoveredCard.is_completed ? 'Concluido' : isOverdue(hoveredCard.due_date) ? 'Atrasado' : 'No prazo'}</span>
          </div>
        </div>
      )}
    </PageLayout>
  )
}