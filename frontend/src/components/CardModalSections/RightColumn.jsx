import { formatCurrency } from '../../utils/formatters'

export default function RightColumn(props) {
  const {
    isDarkMode, isSaving, users, availableStagesForThisCard, editStageId, setEditStageId,
    editDueDate, setEditDueDate, editAssigneeId, setEditAssigneeId,
    isTagMenuOpen, setIsTagMenuOpen, newTagColor, setNewTagColor, newTagName, setNewTagName, createTag,
    availableTags, cardTags, editingTag, setEditingTag, updateTagAPI, deleteTagAPI, toggleTag,
    editEstimatedValue, setEditEstimatedValue, editInvestedValue, setEditInvestedValue,
    editPaymentMethodCustom, editPaymentMethod, setEditPaymentMethod, setEditPaymentMethodCustom, paymentMethods
  } = props

  return (
    <div className={`w-[280px] flex flex-col gap-6 border-l pl-8 overflow-y-auto ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
      
      <div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Status da Etapa</span>
        <select value={editStageId} onChange={(e) => setEditStageId(e.target.value)} className={`w-full p-3 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer hover:shadow-md transition-all disabled:opacity-50 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gradient-to-r from-slate-100 to-slate-50 border-slate-200 text-slate-700'}`} disabled={isSaving}>
          {availableStagesForThisCard.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
        </select>
      </div>
      
      <div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Prazo (Due Date)</span>
        <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className={`w-full p-3 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer hover:shadow-md transition-all disabled:opacity-50 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gradient-to-r from-slate-100 to-slate-50 border-slate-200 text-slate-700'}`} disabled={isSaving} />
      </div>
      
      <div className={`pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Responsáveis</span>
        <select value={editAssigneeId || ''} onChange={(e) => setEditAssigneeId(e.target.value ? parseInt(e.target.value) : null)} className={`w-full p-3 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer hover:shadow-md transition-all disabled:opacity-50 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gradient-to-r from-slate-100 to-slate-50 border-slate-200 text-slate-700'}`} disabled={isSaving}>
          <option value="">Sem atribuição</option>
          {users.map(user => <option key={user.id} value={user.id}>{user.first_name} {user.last_name} (@{user.username})</option>)}
        </select>
      </div>

      <div className="relative">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Etiquetas (Tags)</span>
        <button onClick={() => setIsTagMenuOpen(!isTagMenuOpen)} className={`w-full flex items-center gap-2 p-3 rounded-lg text-sm font-semibold transition-all duration-200 border hover:border-blue-500 disabled:opacity-50 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' : 'bg-gradient-to-r from-slate-100 to-slate-50 border-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-100'}`} disabled={isSaving}>
          <span className="text-lg">🏷️</span> <span>Gerenciar Tags</span>
        </button>
        {isTagMenuOpen && (
          <div className={`absolute top-full left-0 w-full mt-2 border rounded-lg shadow-xl z-50 p-3 max-h-80 overflow-y-auto ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <p className="text-xs font-bold text-slate-500 mb-2">Criar nova tag:</p>
            <div className={`flex gap-2 mb-3 pb-3 border-b items-center ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} className="w-8 h-8 p-0 border-0 rounded cursor-pointer bg-transparent" title="Escolher cor" />
              <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createTag()} placeholder="Nome da Tag..." className={`flex-1 p-2 border rounded text-xs focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
              <button onClick={createTag} className="px-2 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition-colors">Criar</button>
            </div>

            <p className="text-xs font-bold text-slate-500 mb-2">Clique para adicionar/remover</p>
            <div className="flex flex-col gap-1">
              {availableTags.map(tag => {
                const isSelected = cardTags.some(t => t.id === tag.id)
                if (editingTag?.id === tag.id) {
                  return (
                    <div key={tag.id} className={`flex items-center gap-1 p-2 rounded ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                      <input type="color" value={editingTag.color} onChange={e => setEditingTag({...editingTag, color: e.target.value})} className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent" />
                      <input type="text" value={editingTag.name} onChange={e => setEditingTag({...editingTag, name: e.target.value})} autoFocus className={`flex-1 min-w-0 p-1 rounded text-xs font-bold ${isDarkMode ? 'bg-slate-800 text-white border border-slate-600' : 'bg-white text-black border border-slate-300'}`} />
                      <button onClick={updateTagAPI} className="text-sm hover:scale-110">💾</button>
                      <button onClick={() => setEditingTag(null)} className="text-sm hover:scale-110">❌</button>
                    </div>
                  )
                }
                return (
                  <div key={tag.id} className={`group flex items-center justify-between p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-2 cursor-pointer w-full" onClick={() => toggleTag(tag)}>
                      <input type="checkbox" checked={isSelected} readOnly className="w-4 h-4 accent-blue-600 cursor-pointer" />
                      <span className="px-2 py-1 rounded text-xs font-bold text-white shadow-sm flex-1 truncate" style={{backgroundColor: tag.color}}>{tag.name}</span>
                    </div>
                    <div className="hidden group-hover:flex gap-1 ml-2">
                      <button onClick={(e) => { e.stopPropagation(); setEditingTag(tag); }} className="text-xs opacity-60 hover:opacity-100 transition-opacity" title="Editar Tag">✏️</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteTagAPI(tag.id); }} className="text-xs opacity-60 hover:opacity-100 hover:text-red-500 transition-opacity" title="Excluir Tag">🗑️</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className={`pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 block">💰 Detalhes Financeiros</span>
        
        <div className="mb-4">
          <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wide block mb-2">Valor Estimado / Venda</label>
          <div className={`flex items-center rounded-lg overflow-hidden border focus-within:ring-2 focus-within:ring-green-400 transition-all ${isDarkMode ? 'bg-emerald-900/20 border-emerald-800' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-slate-200'}`}>
            <span className="text-slate-500 pl-3 text-sm font-bold">R$</span>
            <input type="number" value={editEstimatedValue} onChange={(e) => setEditEstimatedValue(e.target.value)} className="w-full bg-transparent p-3 text-sm font-semibold text-green-500 focus:outline-none disabled:opacity-50" placeholder="0.00" disabled={isSaving} step="0.01" min="0" />
          </div>
          {editEstimatedValue && <p className="text-xs text-green-500 font-semibold mt-1">{formatCurrency(editEstimatedValue)}</p>}
        </div>
        
        <div className="mb-4">
          <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wide block mb-2">Valor Investido / Custo</label>
          <div className={`flex items-center rounded-lg overflow-hidden border focus-within:ring-2 focus-within:ring-red-400 transition-all ${isDarkMode ? 'bg-rose-900/20 border-rose-800' : 'bg-gradient-to-r from-red-50 to-orange-50 border-slate-200'}`}>
            <span className="text-slate-500 pl-3 text-sm font-bold">R$</span>
            <input type="number" value={editInvestedValue} onChange={(e) => setEditInvestedValue(e.target.value)} className="w-full bg-transparent p-3 text-sm font-semibold text-red-500 focus:outline-none disabled:opacity-50" placeholder="0.00" disabled={isSaving} step="0.01" min="0" />
          </div>
          {editInvestedValue && <p className="text-xs text-red-500 font-semibold mt-1">{formatCurrency(editInvestedValue)}</p>}
        </div>
        
        {editEstimatedValue && editInvestedValue && (
          <div className={`mb-4 p-3 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Resultado</p>
            <p className={`text-sm font-bold ${parseFloat(editEstimatedValue) - parseFloat(editInvestedValue) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(parseFloat(editEstimatedValue) - parseFloat(editInvestedValue))}
            </p>
          </div>
        )}
        
        <div>
          <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wide block mb-2">Método de Pagamento</label>
          {!editPaymentMethodCustom ? (
            <div className="flex gap-2 items-center w-full">
              <select value={editPaymentMethod} onChange={(e) => setEditPaymentMethod(e.target.value)} className={`flex-1 p-3 min-w-0 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer hover:shadow-md transition-all disabled:opacity-50 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gradient-to-r from-slate-100 to-slate-50 border-slate-200 text-slate-700'}`} disabled={isSaving}>
                <option value="">Selecione...</option>
                {paymentMethods.map(method => <option key={method} value={method}>{method}</option>)}
              </select>
              <button onClick={() => setEditPaymentMethodCustom(true)} className={`flex-shrink-0 px-3 py-3 rounded-lg font-bold text-sm transition-all duration-200 disabled:opacity-50 ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gradient-to-r from-slate-200 to-slate-100 text-slate-700 hover:from-slate-300 hover:to-slate-200'}`} disabled={isSaving} title="Usar campo de texto livre">✏️</button>
            </div>
          ) : (
            <div className="flex gap-2 items-center w-full">
              <input type="text" value={editPaymentMethod} onChange={(e) => setEditPaymentMethod(e.target.value)} placeholder="Ex: Cartão em 12x..." className={`flex-1 p-3 min-w-0 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-700'}`} disabled={isSaving} />
              <button onClick={() => setEditPaymentMethodCustom(false)} className={`flex-shrink-0 px-3 py-3 rounded-lg font-bold text-sm transition-all duration-200 disabled:opacity-50 ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gradient-to-r from-slate-200 to-slate-100 text-slate-700 hover:from-slate-300 hover:to-slate-200'}`} disabled={isSaving} title="Usar dropdown">🔽</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}