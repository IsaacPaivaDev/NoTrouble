import { useState, useEffect, useCallback } from 'react'
import { getColorFromString } from '../utils/formatters'
import { apiFetch } from '../api/client'

export function useBoards(showError, showNotification) {
  const [boards, setBoards] = useState([])
  const [users, setUsers] = useState([])
  const [availableTags, setAvailableTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)

  const fetchBoards = useCallback(() => {
    setLoading(true)
    apiFetch('/boards/')
      .then(res => { if(!res.ok) throw new Error(); return res.json() })
      .then(data => setBoards(data))
      .catch(() => showError('Erro ao carregar quadros'))
      .finally(() => setLoading(false))
  }, [showError])

  const fetchUsers = useCallback(() => { apiFetch('/users/').then(res => res.json()).then(data => setUsers(data)) }, [])
  const fetchTags = useCallback(() => { apiFetch('/tags/').then(res => res.json()).then(data => setAvailableTags(data)) }, [])
  const fetchCurrentUser = useCallback(() => { apiFetch('/users/me/').then(res => res.json()).then(data => setCurrentUser(data)) }, [])
  
  useEffect(() => { 
    fetchBoards(); 
    fetchUsers(); 
    fetchTags(); 
    fetchCurrentUser(); 
  }, [fetchBoards, fetchUsers, fetchTags, fetchCurrentUser])
  
  // --- 🚀 O SEGREDO DA PERFORMANCE: Atualizar um card específico na tela sem recarregar tudo ---
  const updateLocalCard = useCallback((cardId, updatedFields) => {
    setBoards(prev => prev.map(b => ({
      ...b, stages: b.stages.map(s => ({
        ...s, cards: s.cards.map(c => c.id === cardId ? { ...c, ...updatedFields } : c)
      }))
    })))
  }, [])

  // --- Quadros ---
  const createBoard = useCallback((name, stages) => {
    apiFetch('/boards/', { method: 'POST', body: JSON.stringify({ name, stages }) })
      .then(res => { if(!res.ok) throw new Error(); return res.json(); })
      .then(() => { fetchBoards(); showNotification('Quadro criado!'); })
      .catch(() => showError('Erro ao criar quadro'));
  }, [fetchBoards, showNotification, showError]);

  const deleteBoard = useCallback((boardId) => {
    if (!window.confirm("ATENÇÃO: Excluir este quadro apagará TODAS as etapas e CARDS dentro dele permanentemente. Confirma?")) return;
    
    apiFetch(`/boards/${boardId}/`, { method: 'DELETE' })
      .then(res => { if(!res.ok) throw new Error(); showNotification('Quadro excluído!'); fetchBoards(); })
      .catch(() => showError('Erro ao excluir quadro'));
  }, [fetchBoards, showNotification, showError]);


  // --- Cards (AGORA COM OPTIMISTIC UPDATES ⚡) ---
  const createCard = useCallback((stageId, title) => { 
    apiFetch('/cards/', { method: 'POST', body: JSON.stringify({ title, stage_id: stageId }) })
      .then(res => res.json())
      .then(newCard => {
        // Atualiza a tela instantaneamente com o card novo
        setBoards(prev => prev.map(b => ({
          ...b, stages: b.stages.map(s => s.id === stageId ? { ...s, cards: [...s.cards, newCard] } : s)
        })))
        showNotification('Card criado!') 
      }).catch(() => showError('Erro ao criar card')) 
  }, [showNotification, showError])
  
  const moveCard = useCallback((cardId, newStageId) => { 
    // ⚡ Atualização Otimista: Move na interface na mesma hora
    setBoards(prev => {
      let movedCard = null;
      const nextBoards = prev.map(b => {
        const nextStages = b.stages.map(s => {
          const cardIndex = s.cards.findIndex(c => c.id === cardId);
          if (cardIndex > -1) {
            movedCard = { ...s.cards[cardIndex], stage_id: newStageId };
            const newCards = [...s.cards];
            newCards.splice(cardIndex, 1); // Tira da coluna antiga
            return { ...s, cards: newCards };
          }
          return s;
        });
        return { ...b, stages: nextStages };
      });
      if (movedCard) {
        return nextBoards.map(b => ({
          ...b, stages: b.stages.map(s => s.id === newStageId ? { ...s, cards: [...s.cards, movedCard] } : s) // Põe na coluna nova
        }));
      }
      return prev;
    });

    // 🌐 Avisa o banco em background (Se der erro, desfaz a animação)
    apiFetch(`/cards/${cardId}/move/`, { method: 'PUT', body: JSON.stringify({ stage_id: newStageId }) })
      .catch(() => { showError('Erro ao mover card.'); fetchBoards(); }) 
  }, [fetchBoards, showError])
  
  const deleteCard = useCallback((cardId) => { 
    if (!window.confirm("Excluir este card permanentemente?")) return; 
    
    // ⚡ Apaga da interface instantaneamente
    setBoards(prev => prev.map(b => ({ ...b, stages: b.stages.map(s => ({ ...s, cards: s.cards.filter(c => c.id !== cardId) })) })));

    apiFetch(`/cards/${cardId}/`, { method: 'DELETE' })
      .then(res => { if(!res.ok) throw new Error(); showNotification('Card excluído!') })
      .catch(() => { showError('Erro ao excluir card'); fetchBoards(); }) 
  }, [fetchBoards, showNotification, showError])

  // --- Etapas (Colunas) ---
  const createStage = useCallback((boardId, name) => { apiFetch('/stages/', { method: 'POST', body: JSON.stringify({ name, board_id: boardId }) }).then(() => { fetchBoards(); showNotification('Etapa criada!') }).catch(() => showError('Erro ao criar etapa')) }, [fetchBoards, showNotification, showError])
  const updateStage = useCallback((stageId, name) => { apiFetch(`/stages/${stageId}/`, { method: 'PUT', body: JSON.stringify({ name }) }).then(() => { fetchBoards(); showNotification('Etapa renomeada!') }).catch(() => showError('Erro ao editar etapa')) }, [fetchBoards, showNotification, showError])
  const deleteStage = useCallback((stageId) => { if (!window.confirm("ATENÇÃO: Excluir esta etapa apagará TODOS os cards dentro dela. Confirma?")) return; apiFetch(`/stages/${stageId}/`, { method: 'DELETE' }).then(() => { fetchBoards(); showNotification('Etapa excluída!') }).catch(() => showError('Erro ao excluir etapa')) }, [fetchBoards, showNotification, showError])
  
  const reorderStages = useCallback((boardId, stageIds) => {
    // ⚡ Move a coluna na interface instantaneamente
    setBoards(prev => prev.map(b => {
      if (b.id !== boardId) return b;
      const sortedStages = [...b.stages].sort((a, b) => stageIds.indexOf(a.id) - stageIds.indexOf(b.id));
      return { ...b, stages: sortedStages };
    }));
    apiFetch(`/boards/${boardId}/stages/reorder/`, { method: 'PUT', body: JSON.stringify({ stage_ids: stageIds }) })
      .catch(() => { showError('Erro ao reordenar etapas'); fetchBoards(); })
  }, [fetchBoards, showError])

  const createTag = useCallback((newTagName, color = "#3B82F6") => { 
    if (!newTagName.trim()) return Promise.resolve(null); 
    return apiFetch('/tags/', { method: 'POST', body: JSON.stringify({ name: newTagName, color }) })
      .then(res => res.json())
      .then(newTag => { setAvailableTags(prev => [...prev, newTag]); return newTag })
      .catch(() => showError('Erro ao criar tag')) 
  }, [showError])

  return { 
    boards, users, availableTags, setAvailableTags, loading, currentUser, 
    fetchBoards, fetchUsers, // 🚀 AQUI ESTÁ O FIX! Agora a página da Equipe encontra o fetchUsers.
    updateLocalCard, createBoard, deleteBoard, createCard, moveCard, deleteCard, createStage, updateStage, deleteStage, reorderStages, createTag 
  }
}