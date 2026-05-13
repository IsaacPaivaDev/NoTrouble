export default function ChecklistSection({ isDarkMode, checklistProgress, checklist, handleToggleChecklistItem, isSaving, newChecklistItem, setNewChecklistItem, handleAddChecklistItem }) {
  return (
    <div className={`pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <label className={`block text-sm font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          <span>✅</span> Checklist
        </label>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
          {checklistProgress}% Concluído
        </span>
      </div>
      <div className={`w-full rounded-full h-2 mb-4 overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
        <div className="progress-bar h-2 rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${checklistProgress}%` }}></div>
      </div>
      <div className="flex flex-col gap-3">
        {checklist.map(item => (
          <div key={item.id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
            <input type="checkbox" checked={item.is_done} onChange={() => handleToggleChecklistItem(item.id, item.is_done)} className="w-5 h-5 cursor-pointer accent-blue-600 rounded transition-all" disabled={isSaving} />
            <span className={`text-sm font-semibold flex-1 ${item.is_done ? (isDarkMode ? 'text-slate-500 line-through' : 'text-slate-400 line-through') : (isDarkMode ? 'text-slate-200' : 'text-slate-700')}`}>
              {item.title}
            </span>
          </div>
        ))}
        <div className="mt-4 flex gap-2">
          <input type="text" value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()} placeholder="Adicionar novo item..." className={`input-focus flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`} disabled={isSaving} />
          <button onClick={handleAddChecklistItem} disabled={isSaving} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 disabled:opacity-50 ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gradient-to-r from-slate-200 to-slate-100 text-slate-700 hover:from-slate-300 hover:to-slate-200'}`}>➕</button>
        </div>
      </div>
    </div>
  )
}