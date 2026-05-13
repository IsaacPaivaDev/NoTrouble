import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'
import { safeParseFloat } from '../utils/formatters'

// 🚀 Adicionamos o updateLocalCard aqui nos parâmetros para ele funcionar nas Tags
export function useCardModal({ isOpen, onClose, cardId, setAvailableTags, refreshBoards, updateLocalCard, showNotification, showError }) {
  const [selectedCard, setSelectedCard] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Estados do Formulário
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editStageId, setEditStageId] = useState("")
  const [editDueDate, setEditDueDate] = useState("")
  const [editEstimatedValue, setEditEstimatedValue] = useState("")
  const [editInvestedValue, setEditInvestedValue] = useState("")
  const [editPaymentMethod, setEditPaymentMethod] = useState("")
  const [editPaymentMethodCustom, setEditPaymentMethodCustom] = useState(false)
  const [editAssigneeId, setEditAssigneeId] = useState(null)
  
  // Estados dos Anexos, Checklist, Tags e Comentários
  const [checklist, setChecklist] = useState([])
  const [newChecklistItem, setNewChecklistItem] = useState("")
  
  // 🚀 NOVOS ESTADOS PARA TAGS MAIS PODEROSAS
  const [cardTags, setCardTags] = useState([])
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3B82F6") // Cor Padrão
  const [editingTag, setEditingTag] = useState(null) // Para o modo edição

  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [attachments, setAttachments] = useState([])
  const [isUploading, setIsUploading] = useState(false)

  const paymentMethods = ['Pix', 'Cartão de Crédito', 'Boleto Bancário', 'Transferência (TED/DOC)', 'Permuta', 'Pendente / Não Definido']

  useEffect(() => {
    if (isOpen && cardId && cardId !== 'undefined' && cardId !== 'null') {
      setIsLoading(true)
      setIsTagMenuOpen(false)
      setEditingTag(null)
      
      apiFetch(`/cards/${cardId}/`)
        .then(res => { if(!res.ok) throw new Error(); return res.json() })
        .then(data => {
          setSelectedCard(data)
          setEditTitle(data.title || "")
          setEditDescription(data.description || "")
          setEditStageId(data.stage_id || "")
          setEditDueDate(data.due_date || "")
          setEditEstimatedValue(safeParseFloat(data.estimated_value))
          setEditInvestedValue(safeParseFloat(data.invested_value))
          setEditPaymentMethod(data.payment_method || "")
          setEditPaymentMethodCustom(data.payment_method && !paymentMethods.includes(data.payment_method))
          setEditAssigneeId(data.assignee?.id || null)
          setChecklist(data.checklist || [])
          setCardTags(data.tags || [])
          setComments(data.comments || [])
          setAttachments(data.attachments || [])
        })
        .catch(() => {
          showError("Erro ao carregar os detalhes do card.")
          onClose() 
        })
        .finally(() => setIsLoading(false))
    } else {
      setSelectedCard(null)
    }
  }, [isOpen, cardId])

  const saveAndCloseModal = () => {
    if (!selectedCard) return
    if (!editTitle.trim()) { showError("⚠️ O título do card não pode estar vazio!"); return }

    setIsSaving(true)
    apiFetch(`/cards/${selectedCard.id}/`, {
      method: 'PUT',
      body: JSON.stringify({
        title: editTitle, description: editDescription, stage_id: editStageId, due_date: editDueDate || null,
        estimated_value: editEstimatedValue ? parseFloat(editEstimatedValue) : null, 
        invested_value: editInvestedValue ? parseFloat(editInvestedValue) : null,
        payment_method: editPaymentMethod, assignee_id: editAssigneeId
      })
    })
    .then((res) => {
      if(!res.ok) throw new Error()
      onClose()
      refreshBoards()
      showNotification('Alterações salvas com sucesso!')
    })
    .catch(() => showError('Erro ao salvar as alterações do card.'))
    .finally(() => setIsSaving(false))
  }

  // --- Funções de Checklist ---
  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return
    apiFetch(`/cards/${selectedCard.id}/checklist/`, { method: 'POST', body: JSON.stringify({ title: newChecklistItem }) })
    .then(res => res.json()).then(newItem => { setChecklist([...checklist, newItem]); setNewChecklistItem("") })
  }

  const handleToggleChecklistItem = (itemId, currentStatus) => {
    apiFetch(`/checklist/${itemId}/`, { method: 'PUT', body: JSON.stringify({ is_done: !currentStatus }) })
    .then(res => res.json()).then(updatedItem => { setChecklist(checklist.map(i => i.id === itemId ? updatedItem : i)) })
  }

  // --- 🚀 SISTEMA DE TAGS MELHORADO ---
  const toggleTag = (tag) => {
    const hasTag = cardTags.some(t => t.id === tag.id)
    if (hasTag) {
      const newTags = cardTags.filter(t => t.id !== tag.id);
      setCardTags(newTags);
      // 🚀 Agora usa o updateLocalCard limpo, sem o "props." na frente
      if (updateLocalCard) updateLocalCard(selectedCard.id, { tags: newTags });
      
      apiFetch(`/cards/${selectedCard.id}/tags/${tag.id}/`, { method: 'DELETE' });
    } else {
      const newTags = [...cardTags, tag];
      setCardTags(newTags);
      if (updateLocalCard) updateLocalCard(selectedCard.id, { tags: newTags });
      
      apiFetch(`/cards/${selectedCard.id}/tags/`, { method: 'POST', body: JSON.stringify({ tag_id: tag.id }) });
    }
  }

  const createTag = () => {
    if (!newTagName.trim()) return
    apiFetch('/tags/', { method: 'POST', body: JSON.stringify({ name: newTagName, color: newTagColor }) })
      .then(res => res.json())
      .then(newTag => { 
        if (setAvailableTags) setAvailableTags(prev => [...prev, newTag]); 
        setNewTagName(""); 
        setNewTagColor("#3B82F6"); // Reseta a cor pro padrão
        toggleTag(newTag) 
      }).catch(() => showError('Erro ao criar etiqueta.'))
  }

  const updateTagAPI = () => {
    if (!editingTag || !editingTag.name.trim()) return;
    apiFetch(`/tags/${editingTag.id}/`, { method: 'PUT', body: JSON.stringify({ name: editingTag.name, color: editingTag.color })})
      .then(res => res.json())
      .then(updated => {
          if (setAvailableTags) setAvailableTags(prev => prev.map(t => t.id === updated.id ? updated : t));
          setCardTags(prev => prev.map(t => t.id === updated.id ? updated : t));
          refreshBoards();
          setEditingTag(null);
      }).catch(() => showError('Erro ao editar etiqueta.'))
  }

  const deleteTagAPI = (tagId) => {
    if(!window.confirm("Excluir esta tag de todos os quadros permanentemente?")) return;
    apiFetch(`/tags/${tagId}/`, { method: 'DELETE' })
      .then(() => {
          if(setAvailableTags) setAvailableTags(prev => prev.filter(t => t.id !== tagId));
          setCardTags(prev => prev.filter(t => t.id !== tagId));
          refreshBoards();
      }).catch(() => showError('Erro ao excluir etiqueta.'))
  }

  // --- Outras Funções ---
  const handleAddComment = () => {
    if (!newComment.trim()) return
    apiFetch(`/cards/${selectedCard.id}/comments/`, { method: 'POST', body: JSON.stringify({ text: newComment }) })
      .then(res => res.json()).then(comment => { setComments([...comments, comment]); setNewComment("") })
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]; if (!file) return
    setIsUploading(true)
    const formData = new FormData(); formData.append('file', file)
    apiFetch(`/cards/${selectedCard.id}/attachments/`, { method: 'POST', body: formData })
      .then(res => res.json()).then(attachment => { setAttachments([...attachments, attachment]); showNotification('Arquivo anexado!') })
      .finally(() => setIsUploading(false))
  }

  const checklistProgress = checklist.length === 0 ? 0 : Math.round((checklist.filter(i => i.is_done).length / checklist.length) * 100)

  // 🚀 SENSOR DE MUDANÇAS NÃO SALVAS
  const hasUnsavedChanges = () => {
    if (!selectedCard) return false;
    if (editTitle !== (selectedCard.title || "")) return true;
    if (editDescription !== (selectedCard.description || "")) return true;
    if (editStageId !== (selectedCard.stage_id || "")) return true;
    if (editDueDate !== (selectedCard.due_date || "")) return true;
    if (parseFloat(editEstimatedValue || 0) !== (selectedCard.estimated_value ? parseFloat(selectedCard.estimated_value) : 0)) return true;
    if (parseFloat(editInvestedValue || 0) !== (selectedCard.invested_value ? parseFloat(selectedCard.invested_value) : 0)) return true;
    if (editPaymentMethod !== (selectedCard.payment_method || "")) return true;
    if (editAssigneeId !== (selectedCard.assignee?.id || null)) return true;
    return false;
  }

  // 🚀 FECHAMENTO SEGURO
  const handleSafeClose = () => {
    if (hasUnsavedChanges()) {
      if (window.confirm("⚠️ Você tem alterações não salvas!\n\nClique em 'OK' para DESCARTAR as mudanças e sair.\nClique em 'Cancelar' para voltar e SALVAR.")) {
        onClose();
      }
    } else {
      onClose();
    }
  }

  return {
    selectedCard, isLoading, isSaving, paymentMethods, checklistProgress,
    editTitle, setEditTitle, editDescription, setEditDescription,
    editStageId, setEditStageId, editDueDate, setEditDueDate,
    editEstimatedValue, setEditEstimatedValue, editInvestedValue, setEditInvestedValue,
    editPaymentMethod, setEditPaymentMethod, editPaymentMethodCustom, setEditPaymentMethodCustom,
    editAssigneeId, setEditAssigneeId,
    checklist, newChecklistItem, setNewChecklistItem,
    cardTags, isTagMenuOpen, setIsTagMenuOpen, 
    newTagName, setNewTagName, newTagColor, setNewTagColor, 
    editingTag, setEditingTag, updateTagAPI, deleteTagAPI, 
    comments, newComment, setNewComment, attachments, isUploading,
    saveAndCloseModal, handleAddChecklistItem, handleToggleChecklistItem,
    toggleTag, createTag, handleAddComment, handleFileSelect,
    handleSafeClose // 🚀 Exportado aqui para o Modal principal usar!
  }
}