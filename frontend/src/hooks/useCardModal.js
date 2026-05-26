import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../api/client'
import { safeParseFloat } from '../utils/formatters'

export function useCardModal({ isOpen, onClose, cardId, setAvailableTags, refreshBoards, updateLocalCard, showNotification, showError }) {
  const [selectedCard, setSelectedCard] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editStageId, setEditStageId] = useState("")
  const [editDueDate, setEditDueDate] = useState("")
  const [editPriority, setEditPriority] = useState("medium")
  const [editEstimatedValue, setEditEstimatedValue] = useState("")
  const [editInvestedValue, setEditInvestedValue] = useState("")
  const [editPaymentMethod, setEditPaymentMethod] = useState("")
  const [editPaymentMethodCustom, setEditPaymentMethodCustom] = useState(false)
  const [editPaymentDate, setEditPaymentDate] = useState("")
  const [editAssigneeId, setEditAssigneeId] = useState(null)

  // Sections
  const [checklist, setChecklist] = useState([])
  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [editingChecklistId, setEditingChecklistId] = useState(null)
  const [editingChecklistTitle, setEditingChecklistTitle] = useState("")
  const [cardTags, setCardTags] = useState([])
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3B82F6")
  const [editingTag, setEditingTag] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [attachments, setAttachments] = useState([])
  const [isUploading, setIsUploading] = useState(false)

  const paymentMethods = ['Pix', 'Cartao de Credito', 'Boleto Bancario', 'Transferencia (TED/DOC)', 'Permuta', 'Pendente / Nao Definido']

  // Load card data
  useEffect(() => {
    if (isOpen && cardId && cardId !== 'undefined' && cardId !== 'null') {
      setIsLoading(true)
      setIsTagMenuOpen(false)
      setEditingTag(null)
      setEditingChecklistId(null)

      apiFetch(`/cards/${cardId}/`)
        .then(res => { if(!res.ok) throw new Error(); return res.json() })
        .then(data => {
          setSelectedCard(data)
          setEditTitle(data.title || "")
          setEditDescription(data.description || "")
          setEditStageId(data.stage_id || "")
          setEditPriority(data.priority || "medium")

          // Converte datetime UTC do backend para formato local do input datetime-local
          if (data.due_date) {
            const d = new Date(data.due_date)
            const offset = d.getTimezoneOffset() * 60000
            const localISOTime = new Date(d.getTime() - offset).toISOString().slice(0, 16)
            setEditDueDate(localISOTime)
          } else {
            setEditDueDate("")
          }

          setEditEstimatedValue(safeParseFloat(data.estimated_value))
          setEditInvestedValue(safeParseFloat(data.invested_value))
          setEditPaymentMethod(data.payment_method || "")
          setEditPaymentMethodCustom(data.payment_method && !paymentMethods.includes(data.payment_method))
          setEditPaymentDate(data.payment_date || "")
          setEditAssigneeId(data.assignee?.id || null)
          setChecklist(data.checklist || [])
          setCardTags(data.tags || [])
          setComments(data.comments || [])
          setAttachments(data.attachments || [])
        })
        .catch(() => { showError("Erro ao carregar card."); onClose() })
        .finally(() => setIsLoading(false))
    } else {
      setSelectedCard(null)
    }
  }, [isOpen, cardId])

  // ---- SAVE ----

  const saveDescriptionOnly = useCallback(() => {
    if (!selectedCard) return
    setIsSaving(true)
    apiFetch(`/cards/${selectedCard.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ description: editDescription })
    })
    .then(() => showNotification('Descricao salva!'))
    .catch(() => showError('Erro ao salvar descricao.'))
    .finally(() => setIsSaving(false))
  }, [selectedCard, editDescription, showNotification, showError])

  const saveAndCloseModal = useCallback(() => {
    if (!selectedCard) return
    if (!editTitle.trim()) { showError("O titulo nao pode estar vazio!"); return }

    setIsSaving(true)
    apiFetch(`/cards/${selectedCard.id}/`, {
      method: 'PUT',
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        stage_id: editStageId,
        due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
        priority: editPriority,
        estimated_value: editEstimatedValue ? parseFloat(editEstimatedValue) : null,
        invested_value: editInvestedValue ? parseFloat(editInvestedValue) : null,
        payment_method: editPaymentMethod,
        payment_date: editPaymentDate || null,
        assignee_id: editAssigneeId,
      })
    })
    .then(res => {
      if(!res.ok) throw new Error()
      onClose()
      refreshBoards()
      showNotification('Alteracoes salvas!')
    })
    .catch(() => showError('Erro ao salvar card.'))
    .finally(() => setIsSaving(false))
  }, [selectedCard, editTitle, editDescription, editStageId, editDueDate, editPriority, editEstimatedValue, editInvestedValue, editPaymentMethod, editPaymentDate, editAssigneeId, onClose, refreshBoards, showNotification, showError])

  // ---- ATTACHMENTS ----

  const uploadFile = useCallback((file) => {
    if (!file || !selectedCard) return
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    apiFetch(`/cards/${selectedCard.id}/attachments/`, { method: 'POST', body: formData })
      .then(res => res.json())
      .then(att => { setAttachments(prev => [...prev, att]); showNotification('Arquivo anexado!') })
      .catch(() => showError('Erro ao enviar arquivo.'))
      .finally(() => setIsUploading(false))
  }, [selectedCard, showNotification, showError])

  const handleFileSelect = useCallback((e) => uploadFile(e.target.files[0]), [uploadFile])

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        uploadFile(items[i].getAsFile())
      }
    }
  }, [uploadFile])

  // ---- CHECKLIST ----

  const handleAddChecklistItem = useCallback(() => {
    if (!newChecklistItem.trim() || !selectedCard) return
    apiFetch(`/cards/${selectedCard.id}/checklist/`, { method: 'POST', body: JSON.stringify({ title: newChecklistItem }) })
      .then(res => res.json())
      .then(item => { setChecklist(prev => [...prev, item]); setNewChecklistItem("") })
      .catch(() => showError('Erro ao adicionar item.'))
  }, [selectedCard, newChecklistItem, showError])

  const handleToggleChecklistItem = useCallback((itemId, currentStatus) => {
    apiFetch(`/checklist/${itemId}/`, { method: 'PUT', body: JSON.stringify({ is_done: !currentStatus }) })
      .then(res => res.json())
      .then(updated => setChecklist(prev => prev.map(i => i.id === itemId ? updated : i)))
      .catch(() => showError('Erro ao atualizar item.'))
  }, [showError])

  const handleEditChecklistItem = useCallback((itemId, newTitle) => {
    if (!newTitle.trim()) return
    apiFetch(`/checklist/${itemId}/`, { method: 'PUT', body: JSON.stringify({ title: newTitle }) })
      .then(res => res.json())
      .then(updated => { setChecklist(prev => prev.map(i => i.id === itemId ? updated : i)); setEditingChecklistId(null) })
      .catch(() => showError('Erro ao editar item.'))
  }, [showError])

  const handleDeleteChecklistItem = useCallback((itemId) => {
    apiFetch(`/checklist/${itemId}/`, { method: 'DELETE' })
      .then(res => { if(!res.ok) throw new Error(); setChecklist(prev => prev.filter(i => i.id !== itemId)) })
      .catch(() => showError('Erro ao excluir item.'))
  }, [showError])

  // ---- TAGS ----

  const toggleTag = useCallback((tag) => {
    if (!selectedCard) return
    const hasTag = cardTags.some(t => t.id === tag.id)
    if (hasTag) {
      const newTags = cardTags.filter(t => t.id !== tag.id)
      setCardTags(newTags)
      if (updateLocalCard) updateLocalCard(selectedCard.id, { tags: newTags })
      apiFetch(`/cards/${selectedCard.id}/tags/${tag.id}/`, { method: 'DELETE' })
    } else {
      const newTags = [...cardTags, tag]
      setCardTags(newTags)
      if (updateLocalCard) updateLocalCard(selectedCard.id, { tags: newTags })
      apiFetch(`/cards/${selectedCard.id}/tags/`, { method: 'POST', body: JSON.stringify({ tag_id: tag.id }) })
    }
  }, [selectedCard, cardTags, updateLocalCard])

  const createTag = useCallback(() => {
    if (!newTagName.trim()) return
    apiFetch('/tags/', { method: 'POST', body: JSON.stringify({ name: newTagName, color: newTagColor }) })
      .then(res => res.json())
      .then(newTag => { if (setAvailableTags) setAvailableTags(prev => [...prev, newTag]); setNewTagName(""); setNewTagColor("#3B82F6"); toggleTag(newTag) })
      .catch(() => showError('Erro ao criar etiqueta.'))
  }, [newTagName, newTagColor, setAvailableTags, toggleTag, showError])

  const updateTagAPI = useCallback(() => {
    if (!editingTag || !editingTag.name.trim()) return
    apiFetch(`/tags/${editingTag.id}/`, { method: 'PUT', body: JSON.stringify({ name: editingTag.name, color: editingTag.color }) })
      .then(res => res.json())
      .then(updated => { if (setAvailableTags) setAvailableTags(prev => prev.map(t => t.id === updated.id ? updated : t)); setCardTags(prev => prev.map(t => t.id === updated.id ? updated : t)); refreshBoards(); setEditingTag(null) })
      .catch(() => showError('Erro ao editar etiqueta.'))
  }, [editingTag, setAvailableTags, refreshBoards, showError])

  const deleteTagAPI = useCallback((tagId) => {
    if (!window.confirm("Excluir esta tag permanentemente?")) return
    apiFetch(`/tags/${tagId}/`, { method: 'DELETE' })
      .then(() => { if (setAvailableTags) setAvailableTags(prev => prev.filter(t => t.id !== tagId)); setCardTags(prev => prev.filter(t => t.id !== tagId)); refreshBoards() })
      .catch(() => showError('Erro ao excluir etiqueta.'))
  }, [setAvailableTags, refreshBoards, showError])

  // ---- COMMENTS ----

  const handleAddComment = useCallback(() => {
    if (!newComment.trim() || !selectedCard) return
    apiFetch(`/cards/${selectedCard.id}/comments/`, { method: 'POST', body: JSON.stringify({ text: newComment }) })
      .then(res => res.json())
      .then(comment => { setComments(prev => [...prev, comment]); setNewComment("") })
      .catch(() => showError('Erro ao comentar.'))
  }, [selectedCard, newComment, showError])

  const handleDeleteComment = useCallback((commentId) => {
    if (!window.confirm("Excluir comentario?")) return
    apiFetch(`/comments/${commentId}/`, { method: 'DELETE' })
      .then(res => { if(!res.ok) throw new Error(); setComments(prev => prev.filter(c => c.id !== commentId)); showNotification('Comentario excluido.') })
      .catch(() => showError('Erro ao excluir comentario.'))
  }, [showNotification, showError])

  // ---- UNSAVED CHANGES ----

  const checklistProgress = checklist.length === 0 ? 0 : Math.round((checklist.filter(i => i.is_done).length / checklist.length) * 100)

  const hasUnsavedChanges = useCallback(() => {
    if (!selectedCard) return false
    if (editTitle !== (selectedCard.title || "")) return true
    if (editDescription !== (selectedCard.description || "")) return true
    if (editStageId !== (selectedCard.stage_id || "")) return true
    if (editPriority !== (selectedCard.priority || "medium")) return true
    if (editPaymentDate !== (selectedCard.payment_date || "")) return true
    if (editPaymentMethod !== (selectedCard.payment_method || "")) return true
    if (parseFloat(editEstimatedValue || 0) !== (selectedCard.estimated_value ? parseFloat(selectedCard.estimated_value) : 0)) return true
    if (parseFloat(editInvestedValue || 0) !== (selectedCard.invested_value ? parseFloat(selectedCard.invested_value) : 0)) return true
    if (editAssigneeId !== (selectedCard.assignee?.id || null)) return true
    // due_date: compara o valor do input com o valor original convertido
    const originalDueDate = selectedCard.due_date ? (() => {
      const d = new Date(selectedCard.due_date)
      const offset = d.getTimezoneOffset() * 60000
      return new Date(d.getTime() - offset).toISOString().slice(0, 16)
    })() : ""
    if (editDueDate !== originalDueDate) return true
    return false
  }, [selectedCard, editTitle, editDescription, editStageId, editPriority, editDueDate, editPaymentDate, editPaymentMethod, editEstimatedValue, editInvestedValue, editAssigneeId])

  const handleSafeClose = useCallback(() => {
    if (hasUnsavedChanges()) {
      if (window.confirm("Salvar as alteracoes antes de fechar?\n\nOK = Salvar Tudo\nCancelar = Descartar")) {
        saveAndCloseModal()
      } else {
        onClose()
      }
    } else {
      onClose()
    }
  }, [hasUnsavedChanges, saveAndCloseModal, onClose])

  return {
    selectedCard, isLoading, isSaving, paymentMethods, checklistProgress,
    editTitle, setEditTitle, editDescription, setEditDescription,
    editStageId, setEditStageId, editDueDate, setEditDueDate,
    editPriority, setEditPriority,
    editEstimatedValue, setEditEstimatedValue, editInvestedValue, setEditInvestedValue,
    editPaymentMethod, setEditPaymentMethod, editPaymentMethodCustom, setEditPaymentMethodCustom,
    editPaymentDate, setEditPaymentDate,
    editAssigneeId, setEditAssigneeId,
    checklist, newChecklistItem, setNewChecklistItem,
    editingChecklistId, setEditingChecklistId, editingChecklistTitle, setEditingChecklistTitle,
    cardTags, isTagMenuOpen, setIsTagMenuOpen,
    newTagName, setNewTagName, newTagColor, setNewTagColor,
    editingTag, setEditingTag, updateTagAPI, deleteTagAPI,
    comments, newComment, setNewComment, attachments, isUploading,
    saveAndCloseModal, saveDescriptionOnly,
    handleAddChecklistItem, handleToggleChecklistItem, handleEditChecklistItem, handleDeleteChecklistItem,
    toggleTag, createTag, handleAddComment, handleDeleteComment,
    handleFileSelect, handlePaste, handleSafeClose,
  }
}