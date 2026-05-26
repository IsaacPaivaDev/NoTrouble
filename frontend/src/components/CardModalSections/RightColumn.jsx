import { useState } from 'react'
import { formatCurrency } from '../../utils/formatters'
import { IconTag, IconDollar, IconChevron, IconPencil, IconTrash, IconCalendar, IconUser } from '../../utils/icons'

export default function RightColumn(props) {
  const {
    isDarkMode, isSaving, users, availableStagesForThisCard, editStageId, setEditStageId,
    editDueDate, setEditDueDate, editPriority, setEditPriority, editAssigneeId, setEditAssigneeId,
    editPaymentDate, setEditPaymentDate,
    isTagMenuOpen, setIsTagMenuOpen, newTagColor, setNewTagColor, newTagName, setNewTagName, createTag,
    availableTags, cardTags, editingTag, setEditingTag, updateTagAPI, deleteTagAPI, toggleTag,
    editEstimatedValue, setEditEstimatedValue, editInvestedValue, setEditInvestedValue,
    editPaymentMethodCustom, editPaymentMethod, setEditPaymentMethod, setEditPaymentMethodCustom, paymentMethods
  } = props

  const [showFinancial, setShowFinancial] = useState(false)

  const selectClass = `w-full p-2 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer transition-colors disabled:opacity-50 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`
  const labelClass = `text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5`

  return (
    <div className={`w-[260px] shrink-0 flex flex-col gap-5 border-l pl-6 overflow-y-auto max-h-[calc(100vh-140px)] ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`} style={{ scrollbarWidth: 'thin' }}>

      {/* Status */}
      <div>
        <span className={labelClass}>Status</span>
        <select value={editStageId} onChange={e => setEditStageId(e.target.value)} className={selectClass} disabled={isSaving}>
          {availableStagesForThisCard.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Prioridade */}
      <div>
        <span className={labelClass}>Prioridade</span>
        <select value={editPriority} onChange={e => setEditPriority(e.target.value)} className={selectClass} disabled={isSaving}>
          <option value="low">Baixa</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>
      </div>

      {/* Prazo */}
      <div>
        <span className={labelClass}>Prazo / Agendamento</span>
        <input type="datetime-local" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} className={selectClass} disabled={isSaving} />
      </div>

      {/* Data de Pagamento */}
      <div>
        <span className={labelClass}>Data de Pagamento</span>
        <input type="date" value={editPaymentDate} onChange={e => setEditPaymentDate(e.target.value)} className={selectClass} disabled={isSaving} />
      </div>

      {/* Responsavel */}
      <div>
        <span className={labelClass}>Responsavel</span>
        <select value={editAssigneeId || ''} onChange={e => setEditAssigneeId(e.target.value ? parseInt(e.target.value) : null)} className={selectClass} disabled={isSaving}>
          <option value="">Sem atribuicao</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} (@{u.username})</option>)}
        </select>
      </div>

      {/* Tags com click-outside */}
      <div className="relative">
        <span className={labelClass}>Etiquetas</span>
        <button
          onClick={() => setIsTagMenuOpen(!isTagMenuOpen)}
          className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm font-semibold border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-400'}`}
          disabled={isSaving}
        >
          <IconTag className="w-3.5 h-3.5" /> Gerenciar Tags
        </button>

        {isTagMenuOpen && (
          <>
            {/* Overlay invisivel para fechar ao clicar fora */}
            <div className="fixed inset-0 z-40" onClick={() => setIsTagMenuOpen(false)} />

            <div className={`absolute top-full left-0 w-full mt-1 border rounded-lg shadow-xl z-50 p-3 max-h-72 overflow-y-auto ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`} style={{ scrollbarWidth: 'thin' }}>
              {/* Criar nova */}
              <p className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Criar nova tag</p>
              <div className={`flex gap-2 mb-3 pb-3 border-b items-center ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <input type="color" value={newTagColor} onChange={e => setNewTagColor(e.target.value)} className="w-7 h-7 p-0 border-0 rounded cursor-pointer bg-transparent" />
                <input type="text" value={newTagName} onChange={e => setNewTagName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createTag()} placeholder="Nome..." className={`flex-1 min-w-0 p-1.5 border rounded text-xs focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                <button onClick={createTag} className="px-2 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700">Criar</button>
              </div>

              {/* Lista */}
              <div className="flex flex-col gap-1">
                {availableTags.map(tag => {
                  const isSelected = cardTags.some(t => t.id === tag.id)
                  if (editingTag?.id === tag.id) {
                    return (
                      <div key={tag.id} className={`flex items-center gap-1 p-1.5 rounded ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                        <input type="color" value={editingTag.color} onChange={e => setEditingTag({...editingTag, color: e.target.value})} className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent" />
                        <input type="text" value={editingTag.name} onChange={e => setEditingTag({...editingTag, name: e.target.value})} autoFocus className={`flex-1 min-w-0 p-1 rounded text-xs font-bold ${isDarkMode ? 'bg-slate-800 text-white border border-slate-600' : 'bg-white text-black border border-slate-300'}`} />
                        <button onClick={updateTagAPI} className="text-blue-500 hover:text-blue-400 p-0.5"><IconSave className="w-3 h-3" /></button>
                        <button onClick={() => setEditingTag(null)} className="text-slate-400 hover:text-slate-200 p-0.5">&times;</button>
                      </div>
                    )
                  }
                  return (
                    <div key={tag.id} className={`group flex items-center justify-between p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-2 cursor-pointer w-full" onClick={() => toggleTag(tag)}>
                        <input type="checkbox" checked={isSelected} readOnly className="w-3.5 h-3.5 accent-blue-600 cursor-pointer" />
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white truncate" style={{ backgroundColor: tag.color }}>{tag.name}</span>
                      </div>
                      <div className="hidden group-hover:flex gap-1 ml-2 shrink-0">
                        <button onClick={e => { e.stopPropagation(); setEditingTag(tag) }} className="text-slate-400 hover:text-blue-500"><IconPencil className="w-3 h-3" /></button>
                        <button onClick={e => { e.stopPropagation(); deleteTagAPI(tag.id) }} className="text-slate-400 hover:text-red-500"><IconTrash className="w-3 h-3" /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Financeiro — colapsavel */}
      <div className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <button onClick={() => setShowFinancial(!showFinancial)} className={`w-full flex items-center justify-between py-3 transition-colors ${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}`}>
          <span className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}><IconDollar className="w-3.5 h-3.5" /> Financeiro</span>
          <IconChevron className="w-3.5 h-3.5" open={showFinancial} />
        </button>

        {showFinancial && (
          <div className="flex flex-col gap-3 pb-2">
            <div>
              <label className={`${labelClass}`}>Valor Venda</label>
              <div className={`flex items-center rounded-lg overflow-hidden border focus-within:ring-2 focus-within:ring-green-400 ${isDarkMode ? 'bg-emerald-900/20 border-emerald-800' : 'bg-green-50 border-slate-200'}`}>
                <span className="text-slate-500 pl-3 text-xs font-bold">R$</span>
                <input type="number" value={editEstimatedValue} onChange={e => setEditEstimatedValue(e.target.value)} className="w-full bg-transparent p-2 text-sm font-semibold text-green-500 focus:outline-none" placeholder="0.00" disabled={isSaving} step="0.01" min="0" />
              </div>
            </div>

            <div>
              <label className={`${labelClass}`}>Custo</label>
              <div className={`flex items-center rounded-lg overflow-hidden border focus-within:ring-2 focus-within:ring-red-400 ${isDarkMode ? 'bg-rose-900/20 border-rose-800' : 'bg-red-50 border-slate-200'}`}>
                <span className="text-slate-500 pl-3 text-xs font-bold">R$</span>
                <input type="number" value={editInvestedValue} onChange={e => setEditInvestedValue(e.target.value)} className="w-full bg-transparent p-2 text-sm font-semibold text-red-500 focus:outline-none" placeholder="0.00" disabled={isSaving} step="0.01" min="0" />
              </div>
            </div>

            {editEstimatedValue && editInvestedValue && (
              <div className={`p-2.5 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Resultado</p>
                <p className={`text-sm font-bold ${parseFloat(editEstimatedValue) - parseFloat(editInvestedValue) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(parseFloat(editEstimatedValue) - parseFloat(editInvestedValue))}
                </p>
              </div>
            )}

            <div>
              <label className={`${labelClass}`}>Pagamento</label>
              {!editPaymentMethodCustom ? (
                <div className="flex gap-1.5 items-center">
                  <select value={editPaymentMethod} onChange={e => setEditPaymentMethod(e.target.value)} className={`flex-1 min-w-0 ${selectClass}`} disabled={isSaving}>
                    <option value="">Selecione...</option>
                    {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <button onClick={() => setEditPaymentMethodCustom(true)} className={`shrink-0 p-2 rounded-lg border text-sm transition-colors ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`} disabled={isSaving} title="Texto livre"><IconPencil /></button>
                </div>
              ) : (
                <div className="flex gap-1.5 items-center">
                  <input type="text" value={editPaymentMethod} onChange={e => setEditPaymentMethod(e.target.value)} placeholder="Ex: Boleto 3x..." className={`flex-1 min-w-0 ${selectClass}`} disabled={isSaving} />
                  <button onClick={() => setEditPaymentMethodCustom(false)} className={`shrink-0 p-2 rounded-lg border text-sm transition-colors ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`} disabled={isSaving} title="Voltar para lista">▼</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}