import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'
import { formatDate } from '../utils/formatters'

export default function BoardHealthMetrics({ board, isDarkMode, activeFilter, setActiveFilter }) {
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    if (!board?.id) return;
    apiFetch(`/analytics/boards/${board.id}/health/`)
      .then(res => res.json())
      .then(data => setMetrics(data))
  }, [board]) 

  if (!metrics) return null;

  const lastStage = board?.stages[board.stages.length - 1];
  
  // 🚀 CORREÇÃO DO FUSO HORÁRIO: Forçamos a pegar o dia atual LOCAL, e não o UTC!
  const localToday = new Date();
  const todayStr = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, '0')}-${String(localToday.getDate()).padStart(2, '0')}`;
  
  const delayedCardsList = board?.stages.flatMap(s => s.cards.map(c => ({...c, stageName: s.name}))).filter(c => c.stage_id !== lastStage?.id && c.due_date && c.due_date < todayStr) || [];

  const getHealthColor = (score) => {
    if (score >= 80) return isDarkMode ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-green-100 text-green-700 border-green-200'
    if (score >= 50) return isDarkMode ? 'bg-yellow-900/40 text-yellow-400 border-yellow-800' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return isDarkMode ? 'bg-red-900/40 text-red-400 border-red-800' : 'bg-red-100 text-red-700 border-red-200'
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-8 animate-fade-in">
        <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 shadow-sm ${getHealthColor(metrics.health_score)}`}>
          <span>🩺 Saúde: {metrics.health_score}%</span>
        </div>
        
        {/* BOTÕES DE FILTRO */}
        <button 
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold shadow-sm transition-all hover:scale-105 ${activeFilter === 'all' ? (isDarkMode ? 'bg-slate-700 border-slate-500 text-white ring-2 ring-slate-400' : 'bg-slate-200 border-slate-400 text-slate-800 ring-2 ring-slate-400') : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500')}`}
        >
          🗂️ Todos ({metrics.total_cards})
        </button>

        <button 
          onClick={() => setActiveFilter('completed')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold shadow-sm transition-all hover:scale-105 ${activeFilter === 'completed' ? (isDarkMode ? 'bg-blue-900/60 border-blue-500 text-blue-300 ring-2 ring-blue-500' : 'bg-blue-100 border-blue-400 text-blue-800 ring-2 ring-blue-400') : (isDarkMode ? 'bg-blue-900/20 border-blue-800 text-blue-500' : 'bg-blue-50 border-blue-200 text-blue-600')}`}
        >
          ✅ Concluídos ({metrics.completed_cards})
        </button>

        <button 
          onClick={() => setActiveFilter('delayed')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold shadow-sm transition-all hover:scale-105 ${activeFilter === 'delayed' ? (isDarkMode ? 'bg-rose-900/60 border-rose-500 text-rose-300 ring-2 ring-rose-500' : 'bg-red-100 border-red-400 text-red-800 ring-2 ring-red-400') : (delayedCardsList.length > 0 ? (isDarkMode ? 'bg-rose-900/30 border-rose-800 text-rose-400 animate-pulse' : 'bg-red-50 border-red-200 text-red-600 animate-pulse') : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500 opacity-50' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50'))}`}
        >
          🚨 Atrasados ({delayedCardsList.length})
        </button>
      </div>
    </>
  )
}