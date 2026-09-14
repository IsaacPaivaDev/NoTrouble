import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useBoards } from '../hooks/useBoards'
import PageLayout from '../components/PageLayout'
import { isOverdue } from '../utils/dates'
import { IconChevron } from '../utils/icons'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const MONTHS = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function Calendar() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const showNotification = useCallback((msg) => console.log(msg), [])
  const showError = useCallback((msg) => console.error(msg), [])
  const { boards, currentUser, loading } = useBoards(showError, showNotification)

  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) } else setCurrentMonth(m => m - 1) }
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) } else setCurrentMonth(m => m + 1) }
  const goToday = () => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()) }

  // Extrai todos os cards com due_date de todos os boards
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

  // Gera os dias do mes
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startPad = firstDay.getDay()
    const days = []

    // Dias do mes anterior (padding)
    const prevLastDay = new Date(currentYear, currentMonth, 0).getDate()
    for (let i = startPad - 1; i >= 0; i--) {
      days.push({ day: prevLastDay - i, inMonth: false, date: new Date(currentYear, currentMonth - 1, prevLastDay - i) })
    }

    // Dias do mes atual
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ day: d, inMonth: true, date: new Date(currentYear, currentMonth, d) })
    }

    // Padding final
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, inMonth: false, date: new Date(currentYear, currentMonth + 1, i) })
    }

    return days
  }, [currentMonth, currentYear])

  // Cards por dia
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

  const goToCard = (card) => navigate(`/board?id=${card.boardId}&card=${card.id}`)

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500 bg-slate-900">Carregando...</div>

  return (
    <PageLayout boards={boards} currentUser={currentUser}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Calendario</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-2" />
            <p className={`mt-2 text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Veja os prazos e agendamentos dos seus cards.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={goToday} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Hoje</button>
            <button onClick={prevMonth} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}><IconChevron className="w-5 h-5 rotate-90" /></button>
            <span className={`text-lg font-bold min-w-[200px] text-center ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{MONTHS[currentMonth]} {currentYear}</span>
            <button onClick={nextMonth} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}><IconChevron className="w-5 h-5 -rotate-90" /></button>
          </div>
        </div>

        {/* Grid do calendario */}
        <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>

          {/* Header dias da semana */}
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
              return (
                <div
                  key={i}
                  className={`min-h-[100px] md:min-h-[120px] p-1.5 border-b border-r transition-colors ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'} ${!dayInfo.inMonth ? (isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50/50') : ''} ${_isToday ? (isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50/50') : ''}`}
                >
                  {/* Numero do dia */}
                  <div className={`text-right mb-1 ${!dayInfo.inMonth ? 'opacity-30' : ''}`}>
                    <span className={`inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-full ${_isToday ? 'bg-blue-600 text-white' : (isDarkMode ? 'text-slate-300' : 'text-slate-700')}`}>{dayInfo.day}</span>
                  </div>

                  {/* Cards do dia */}
                  <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
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

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.3); border-radius: 4px; }
      `}</style>
    </PageLayout>
  )
}