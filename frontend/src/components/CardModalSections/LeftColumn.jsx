import ChecklistSection from './ChecklistSection'
import AttachmentsSection from './AttachmentsSection'
import CommentsSection from './CommentsSection'

export default function LeftColumn(props) {
  const { 
    isDarkMode, editTitle, setEditTitle, isSaving, cardTags, toggleTag, 
    editDescription, setEditDescription, saveAndCloseModal, deleteCard, selectedCard, onClose 
  } = props

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-4">
      {/* Título e Tags */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📋</span>
          <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={`input-focus w-full bg-transparent border-b-2 focus:border-blue-500 rounded-none focus:outline-none font-bold text-2xl py-2 transition-colors ${isDarkMode ? 'border-slate-600 text-white' : 'border-slate-200 text-slate-800'}`} disabled={isSaving} />
        </div>
        <div className="flex flex-wrap gap-2 pl-10">
          {cardTags.map(tag => (
            <span key={tag.id} className="px-3 py-1 text-xs font-bold text-white rounded-full flex items-center gap-2 shadow-sm" style={{backgroundColor: tag.color}}>
              {tag.name} <button onClick={() => toggleTag(tag)} className="hover:text-black hover:opacity-50 transition-opacity">&times;</button>
            </span>
          ))}
        </div>
      </div>
      
      {/* Descrição e Botões */}
      <div className={`pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <label className={`block text-sm font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          <span>📝</span> Descrição Completa
        </label>
        <textarea rows="4" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className={`input-focus w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium resize-none disabled:opacity-50 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-700'}`} placeholder="Adicione informações detalhadas aqui..." disabled={isSaving} />
        
        <div className="flex justify-start gap-3 mt-4">
          <button onClick={saveAndCloseModal} disabled={isSaving} className="btn-primary px-6 py-2 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all">
            {isSaving ? '💾 Salvando...' : '💾 Salvar Alterações'}
          </button>
          <button onClick={() => { deleteCard(selectedCard.id); onClose(); }} disabled={isSaving} className={`px-6 py-2 rounded-lg text-sm font-bold shadow-md transition-colors ${isDarkMode ? 'bg-red-900/50 text-red-400 hover:bg-red-900/80' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
            🗑️ Excluir Card
          </button>
        </div>
      </div>

      <ChecklistSection {...props} />
      <AttachmentsSection {...props} />
      <CommentsSection {...props} />
    </div>
  )
}