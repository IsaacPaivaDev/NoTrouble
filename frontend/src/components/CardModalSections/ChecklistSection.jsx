import { IconPencil, IconTrash, IconPlus, IconCheck } from '../../utils/icons'

export default function ChecklistSection({ isDarkMode, checklistProgress, checklist, handleToggleChecklistItem, handleEditChecklistItem, handleDeleteChecklistItem, editingChecklistId, setEditingChecklistId, editingChecklistTitle, setEditingChecklistTitle, isSaving, newChecklistItem, setNewChecklistItem, handleAddChecklistItem }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Progress */}
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{checklistProgress}% concluido</span>
        <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{checklist.filter(i=>i.is_done).length}/{checklist.length}</span>
      </div>
      <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
        <div className="h-1.5 rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${checklistProgress}%` }} />
      </div>

      {/* Items */}
      <div className="flex flex-col gap-1 mt-2">
        {checklist.map(item => (
          <div key={item.id} className={`flex items-center gap-2 p-2 rounded-lg group transition-colors ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
            <input
              type="checkbox"
              checked={item.is_done}
              onChange={() => handleToggleChecklistItem(item.id, item.is_done)}
              className="w-4 h-4 cursor-pointer accent-blue-600 rounded shrink-0"
              disabled={isSaving}
            />

            {editingChecklistId === item.id ? (
              <input
                type="text"
                value={editingChecklistTitle}
                onChange={e => setEditingChecklistTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleEditChecklistItem(item.id, editingChecklistTitle); if (e.key === 'Escape') setEditingChecklistId(null) }}
                onBlur={() => { if (editingChecklistTitle.trim()) handleEditChecklistItem(item.id, editingChecklistTitle); else setEditingChecklistId(null) }}
                autoFocus
                className={`flex-1 p-1 rounded border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'}`}
              />
            ) : (
              <span className={`text-sm font-medium flex-1 cursor-text ${item.is_done ? (isDarkMode ? 'text-slate-500 line-through' : 'text-slate-400 line-through') : (isDarkMode ? 'text-slate-200' : 'text-slate-700')}`}
                onDoubleClick={() => { setEditingChecklistId(item.id); setEditingChecklistTitle(item.title) }}
              >
                {item.title}
              </span>
            )}

            {editingChecklistId !== item.id && (
              <div className="hidden group-hover:flex gap-1 shrink-0">
                <button onClick={() => { setEditingChecklistId(item.id); setEditingChecklistTitle(item.title) }} className="text-slate-400 hover:text-blue-500 p-0.5" title="Editar"><IconPencil /></button>
                <button onClick={() => handleDeleteChecklistItem(item.id)} className="text-slate-400 hover:text-red-500 p-0.5" title="Excluir"><IconTrash className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="flex gap-2 mt-1">
        <input
          type="text"
          value={newChecklistItem}
          onChange={e => setNewChecklistItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem()}
          placeholder="Novo item..."
          className={`flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`}
          disabled={isSaving}
        />
        <button onClick={handleAddChecklistItem} disabled={isSaving} className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
          <IconPlus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}