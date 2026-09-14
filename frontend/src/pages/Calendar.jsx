import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useBoards } from '../hooks/useBoards'
import { apiFetch } from '../api/client'
import PageLayout from '../components/PageLayout'
import { isOverdue } from '../utils/dates'
import { IconChevron, IconPlus, IconX } from '../utils/icons'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const MONTHS = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function Calendar() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const showNotification = useCallback((msg) => console.log(msg), [])
  const showError = useCallback((msg) => console.error(msg), [])
  const { boards, currentUser, loading, fetchBoards } = useBoards(showError, showNotification)

  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  // Form de criacao de card
  const [creatingOn, setCreatingOn] = useState(null) // dateString do dia clicado
  const [newTitle, setNewTitle] = useState('')
  const [selectedBoardId, setSelectedBoardId] = useState('')
  const [selectedStageId, setSelectedStageId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const titleInputRef = useRef(null)

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) } else setCurrentMonth(m => m - 1) }
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) } else setCurrentMonth(m => m + 1) }
  const goToday = () => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()) }

  // Stages do board selecionado
  const selectedBoard = boards.find(b => b.id === selectedBoardId)
  const availableStages = selectedBoard?.stages || []

  // Auto-seleciona primeiro board/stage
  useEffect(() => {
    if (creatingOn && boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0].id)
      if (boards[0].stages?.length > 0) setSelectedStageId(boards[0].stages[0].id)
    }
  }, [creatingOn, boards])

  useEffect(() => {
    if (selectedBoardId) {
      const b = boards.find(b => b.id === selectedBoardId)
      if (b?.stages?.length > 0) setSelectedStageId(b.stages[0].id)
    }
  }, [selectedBoardId])

  // Foca no input quando abre o form
  useEffect(() => {
    if (creatingOn) setTimeout(() => titleInputRef.current?.focus(), 100)
  }, [creatingOn])

  // Todos os cards com due_date
  const allCards = useMemo(() => {
    const cards = []
    boards.forEach(board => {
      board.stages?.forEach(stage => {
        stage.cards?.forEach(card => {
          if (card.due_date) {
            cards.push({
              ...card,
              boardId: board.id,
              boardName: board.name,
              stageName: stage.name,
              dateObj: new Date(card.due_date),
            })
          }
        })
      })
    })
    return cards
  }, [boards])

  // Dias do mes
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startPad = firstDay.getDay()
    const days = []

    const prevLastDay = new Date(currentYear, currentMonth, 0).getDate()
    for (let i = startPad - 1; i >= 0; i--) {
      days.push({ day: prevLastDay - i, inMonth: false, date: new Date(currentYear, currentMonth - 1, prevLastDay - i) })
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ day: d, inMonth: true, date: new Date(currentYear, currentMonth, d) })
    }
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, inMonth: false, date: new Date(currentYear, currentMonth + 1, i) })
    }
    return days
  }, [currentMonth, currentYear])

  const getCardsForDay = (date) => {
    return allCards.filter(c =>
      c.dateObj.getDate() === date.getDate() &&
      c.dateObj.getMonth() === date.getMonth() &&
      c.dateObj.getFullYear() === date.getFullYear()
    )
  }

  const isToday = (date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  const toDateStr = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`

  const goToCard = (card) => navigate(`/board?id=${card.boardId}&card=${card.id}`)

  // Abre form de criacao no dia clicado
  const startCreating = (date) => {
    setCreatingOn(toDateStr(date))
    setNewTitle('')
    setSelectedBoardId(boards.length > 0 ? boards[0].id : '')
  }

  const cancelCreating = () => { setCreatingOn(null); setNewTitle('') }

  // Cria o card com due_date pre-preenchida
  const handleCreateCard = async () => {
    if (!newTitle.trim() || !selectedStageId) return
    setIsSaving(true)
    try {
      // Cria o card
      const res = await apiFetch('/cards/', { method: 'POST', body: JSON.stringify({ title: newTitle, stage_id: selectedStageId }) })
      if (!res.ok) throw new Error()
      const card = await res.json()

      // Seta a due_date
      const dueDate = new Date(creatingOn + 'T12:00:00')
      await apiFetch(`/cards/${card.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ due_date: dueDate.toISOString() })
      })

      cancelCreating()
      fetchBoards()
    } catch {
      showError('Erro ao criar card')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500 bg-slate-900">Carregando...</div>

  return (
    <PageLayout boards={boards} currentUser={currentUser}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Calendario</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-2" />
            <p className={`mt-2 text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Clique em um dia para criar um card com prazo.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={goToday} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Hoje</button>
            <button onClick={prevMonth} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}><IconChevron className="w-5 h-5 rotate-90" /></button>
            <span className={`text-lg font-bold min-w-[200px] text-center ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{MONTHS[currentMonth]} {currentYear}</span>
            <button onClick={nextMonth} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}><IconChevron className="w-5 h-5 -rotate-90" /></button>
          </div>
        </div>

        {/* Grid */}
        <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>

          {/* Dias da semana */}
          <div className={`grid grid-cols-7 border-b ${isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
            {WEEKDAYS.map(d => (
              <div key={d} className={`p-3 text-center text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{d}</div>
            ))}
          </div>

          {/* Dias */}
          <div className="grid grid-cols-7">
            {calendarDays.map((dayInfo, i) => {
              const dayCards = getCardsForDay(dayInfo.date)
              const _isToday = isToday(dayInfo.date)
              const dayStr = toDateStr(dayInfo.date)
              const isCreatingHere = creatingOn === dayStr

              return (
                <div
                  key={i}
                  className={`min-h-[110px] md:min-h-[130px] p-1.5 border-b border-r transition-colors relative group/day ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'} ${!dayInfo.inMonth ? (isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50/50') : ''} ${_isToday ? (isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50/50') : ''}`}
                >
                  {/* Header do dia: numero + botao + */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-full ${!dayInfo.inMonth ? 'opacity-30' : ''} ${_isToday ? 'bg-blue-600 text-white' : (isDarkMode ? 'text-slate-300' : 'text-slate-700')}`}>{dayInfo.day}</span>
                    {dayInfo.inMonth && !isCreatingHere && (
                      <button
                        onClick={() => startCreating(dayInfo.date)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover/day:opacity-100 transition-all ${isDarkMode ? 'bg-blue-600/30 text-blue-400 hover:bg-blue-600 hover:text-white' : 'bg-blue-100 text-blue-500 hover:bg-blue-500 hover:text-white'}`}
                        title="Criar card neste dia"
                      >
                        <IconPlus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Form de criacao inline */}
                  {isCreatingHere && (
                    <div className={`absolute left-0 top-0 w-[280px] p-3 rounded-xl border shadow-2xl z-50 flex flex-col gap-2 ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{dayInfo.day} {MONTHS[dayInfo.date.getMonth()]}</span>
                        <button onClick={cancelCreating} className="text-slate-400 hover:text-red-500"><IconX className="w-3.5 h-3.5" /></button>
                      </div>
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleCreateCard(); if (e.key === 'Escape') cancelCreating() }}
                        placeholder="Titulo do card..."
                        className={`w-full p-2 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-800'}`}
                      />
                      <select
                        value={selectedBoardId}
                        onChange={e => setSelectedBoardId(e.target.value)}
                        className={`w-full p-2 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-700'}`}
                      >
                        {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                      <select
                        value={selectedStageId}
                        onChange={e => setSelectedStageId(e.target.value)}
                        className={`w-full p-2 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-700'}`}
                      >
                        {availableStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <button
                        onClick={handleCreateCard}
                        disabled={isSaving || !newTitle.trim()}
                        className="w-full py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-40"
                      >
                        {isSaving ? 'Criando...' : 'Criar Card'}
                      </button>
                    </div>
                  )}

                  {/* Cards do dia */}
                  <div className="flex flex-col gap-0.5 overflow-y-auto max-h-[80px]" style={{ scrollbarWidth: 'thin' }}>
                    {dayCards.slice(0, 3).map(card => {
                      const overdue = !card.is_completed && isOverdue(card.due_date)
                      const completed = card.is_completed
                      return (
                        <button
                          key={card.id}
                          onClick={() => goToCard(card)}
                          className={`w-full text-left px-1.5 py-1 rounded text-[10px] font-semibold truncate transition-colors ${completed ? (isDarkMode ? 'bg-emerald-900/40 text-emerald-400 line-through' : 'bg-emerald-50 text-emerald-600 line-through') : overdue ? (isDarkMode ? 'bg-red-900/40 text-red-400' : 'bg-red-50 text-red-600') : (isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-blue-50 text-blue-700 hover:bg-blue-100')}`}
                          title={`${card.title} — ${card.boardName} / ${card.stageName}`}
                        >
                          {card.tags?.[0] && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: card.tags[0].color }} />}
                          {card.title}
                        </button>
                      )
                    })}
                    {dayCards.length > 3 && (
                      <span className={`text-[9px] font-bold text-center ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>+{dayCards.length - 3} mais</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-6 mt-4 justify-center">
          {[
            { label: 'No prazo', cls: isDarkMode ? 'bg-slate-700' : 'bg-blue-50 border border-blue-200' },
            { label: 'Atrasado', cls: isDarkMode ? 'bg-red-900/40' : 'bg-red-50 border border-red-200' },
            { label: 'Concluido', cls: isDarkMode ? 'bg-emerald-900/40' : 'bg-emerald-50 border border-emerald-200' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <div className={`w-4 h-3 rounded ${l.cls}`} />
              <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  )
}