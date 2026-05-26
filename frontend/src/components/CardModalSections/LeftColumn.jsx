import { useState } from 'react'
import ChecklistSection from './ChecklistSection'
import AttachmentsSection from './AttachmentsSection'
import CommentsSection from './CommentsSection'
import { IconCheck, IconClip, IconChat, IconChevron, IconSave, IconTrash, IconFile } from '../../utils/icons'

// Header de secao colapsavel
function SectionToggle({ label, icon: Icon, count, isOpen, onToggle, isDarkMode }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between py-3 border-t transition-colors ${isDarkMode ? 'border-slate-700 hover:bg-slate-700/30' : 'border-slate-200 hover:bg-slate-50'}`}
    >
      <span className={`flex items-center gap-2 text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
        <Icon className="w-4 h-4" /> {label}
        {count > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>{count}</span>}
      </span>
      <IconChevron className="w-4 h-4" open={isOpen} />
    </button>
  )
}

export default function LeftColumn(props) {
  const {
    isDarkMode, editTitle, setEditTitle, isSaving, cardTags, toggleTag,
    editDescription, setEditDescription, saveAndCloseModal, saveDescriptionOnly,
    deleteCard, selectedCard, onClose, checklist, comments, attachments
  } = props

  const [sections, setSections] = useState({ checklist: false, attachments: false, comments: false })
  const toggle = (key) => setSections(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 max-h-[calc(100vh-140px)]" style={{ scrollbarWidth: 'thin' }}>

      {/* Titulo + Tags */}
      <div>
        <input
          type="text"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          className={`w-full bg-transparent border-b-2 focus:border-blue-500 rounded-none focus:outline-none font-bold text-xl py-2 transition-colors ${isDarkMode ? 'border-slate-600 text-white' : 'border-slate-200 text-slate-800'}`}
          disabled={isSaving}
          placeholder="Titulo do Card"
        />
        {cardTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {cardTags.map(tag => (
              <span key={tag.id} className="px-2 py-0.5 text-[10px] font-bold text-white rounded-full flex items-center gap-1.5" style={{ backgroundColor: tag.color }}>
                {tag.name}
                <button onClick={() => toggleTag(tag)} className="opacity-60 hover:opacity-100">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Descricao — sempre visivel, compacta */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Descricao</span>
          <span className={`text-[10px] italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Ctrl+V cola imagens</span>
        </div>
        <textarea
          rows="3"
          value={editDescription}
          onChange={e => setEditDescription(e.target.value)}
          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium resize-y min-h-[80px] max-h-[200px] transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
          placeholder="Informacoes detalhadas..."
          disabled={isSaving}
          style={{ scrollbarWidth: 'thin' }}
        />
        <button
          onClick={saveDescriptionOnly}
          disabled={isSaving}
          className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${isDarkMode ? 'border-slate-600 hover:bg-slate-700 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}
        >
          <IconSave className="w-3 h-3" /> {isSaving ? 'Salvando...' : 'Salvar Descricao'}
        </button>
      </div>

      {/* Secoes colapsaveis */}
      <div className="flex flex-col">
        <SectionToggle label="Checklist" icon={IconCheck} count={checklist.length} isOpen={sections.checklist} onToggle={() => toggle('checklist')} isDarkMode={isDarkMode} />
        {sections.checklist && <div className="pb-4"><ChecklistSection {...props} /></div>}

        <SectionToggle label="Anexos" icon={IconClip} count={attachments.length} isOpen={sections.attachments} onToggle={() => toggle('attachments')} isDarkMode={isDarkMode} />
        {sections.attachments && <div className="pb-4"><AttachmentsSection {...props} /></div>}

        <SectionToggle label="Comentarios" icon={IconChat} count={comments.length} isOpen={sections.comments} onToggle={() => toggle('comments')} isDarkMode={isDarkMode} />
        {sections.comments && <div className="pb-4"><CommentsSection {...props} /></div>}
      </div>

      {/* Botoes de acao */}
      <div className={`pt-4 mt-auto border-t flex gap-3 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <button
          onClick={saveAndCloseModal}
          disabled={isSaving}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all"
        >
          {isSaving ? 'Salvando...' : 'Salvar Tudo e Fechar'}
        </button>
        <button
          onClick={() => { if (window.confirm("Excluir card?")) { deleteCard(selectedCard.id); onClose() } }}
          disabled={isSaving}
          className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isDarkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/60' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
          title="Excluir Card"
        >
          <IconTrash />
        </button>
      </div>
    </div>
  )
}