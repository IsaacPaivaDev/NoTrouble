// 🚀 1. Adicionamos o useMemo aqui na primeira linha
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBoards } from '../hooks/useBoards'
import { useTheme } from '../contexts/ThemeContext'
import CardModal from '../components/CardModal'
import BoardHealthMetrics from '../components/BoardHealthMetrics'
import { formatCurrency, formatDate, getInitials, getColorFromString, getPaymentIcon } from '../utils/formatters'

export default function Board() {
  const navigate = useNavigate()
  const { isDarkMode, toggleTheme } = useTheme()
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isBoardsDropdownOpen, setIsBoardsDropdownOpen] = useState(true)
  const [viewMode, setViewMode] = useState('kanban')
  const [activeBoardId, setActiveBoardId] = useState(null)
  
  const [activeFilter, setActiveFilter] = useState('all')

  // 🚀 ESTADOS DE DRAG & DROP NÍVEL TRELLO
  const [isDragging, setIsDragging] = useState(false)
  const [draggingType, setDraggingType] = useState(null)
  const [draggedStageId, setDraggedStageId] = useState(null)
  const [dragOverStageId, setDragOverStageId] = useState(null)

  const [notification, setNotification] = useState(null)
  const [error, setError] = useState(null)
  const showNotification = useCallback((message, type = 'success') => { setNotification({ message, type }); setTimeout(() => setNotification(null), 3000) }, [])
  const showError = useCallback((message) => { setError(message); setTimeout(() => setError(null), 5000) }, [])

  const { boards, users, availableTags, setAvailableTags, loading, currentUser, fetchBoards, updateLocalCard, createBoard, deleteBoard, createCard, moveCard, deleteCard, createStage, updateStage, deleteStage, reorderStages, createTag } = useBoards(showError, showNotification)

  const [addingToStageId, setAddingToStageId] = useState(null)
  const [newCardTitle, setNewCardTitle] = useState("")
  const [addingStageToBoardId, setAddingStageToBoardId] = useState(null)
  const [newStageName, setNewStageName] = useState("")
  const [editingStageId, setEditingStageId] = useState(null)
  const [editStageName, setEditStageName] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [newBoardStages, setNewBoardStages] = useState(["A Fazer", "Em Andamento", "Concluído"])

  const handleLogout = () => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); navigate('/login') }
  const handleCreateNewCard = (stageId) => { if (!newCardTitle.trim()) { setAddingToStageId(null); return }; createCard(stageId, newCardTitle); setNewCardTitle(""); setAddingToStageId(null) }
  const handleCreateNewStage = (boardId) => { if (!newStageName.trim()) { setAddingStageToBoardId(null); return }; createStage(boardId, newStageName); setNewStageName(""); setAddingStageToBoardId(null) }
  const saveStageEdit = (stageId) => { if (editStageName.trim()) { updateStage(stageId, editStageName) }; setEditingStageId(null) }
  const openModal = (cardId) => { setSelectedCardId(cardId); setIsModalOpen(true) }

  useEffect(() => {
    if (boards.length > 0 && !activeBoardId) setActiveBoardId(boards[0].id);
    if (boards.length > 0 && activeBoardId && !boards.find(b => b.id === activeBoardId)) setActiveBoardId(boards[0].id);
  }, [boards, activeBoardId]);

  const activeBoard = boards.find(b => b.id === activeBoardId) ?? null;

  const submitNewBoard = () => {
    if (!newBoardName.trim()) { showError("O quadro precisa de um nome!"); return; }
    createBoard(newBoardName, newBoardStages.filter(s => s.trim() !== ""));
    setIsCreateBoardModalOpen(false); setNewBoardName(""); setNewBoardStages(["A Fazer", "Em Andamento", "Concluído"]);
  }

  const filteredStages = useMemo(() => {
    if (!activeBoard) return [];
    
    const localToday = new Date();
    const todayStr = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, '0')}-${String(localToday.getDate()).padStart(2, '0')}`;
    const lastStageId = activeBoard.stages.length > 0 ? activeBoard.stages[activeBoard.stages.length - 1].id : null;

    return activeBoard.stages.map(stage => {
      return {
        ...stage,
        cards: stage.cards.filter(card => {
          if (activeFilter === 'all') return true;
          if (activeFilter === 'completed') return stage.id === lastStageId;
          if (activeFilter === 'delayed') return card.due_date && card.due_date < todayStr && stage.id !== lastStageId;
          return true;
        })
      }
    });
  }, [activeBoard, activeFilter]);

  // 🚀 AQUI ACONTECE A MÁGICA: Ordena na tela AO VIVO antes de salvar
  const displayStages = useMemo(() => {
    let stages = [...filteredStages];
    if (draggingType === 'stage' && draggedStageId && dragOverStageId && draggedStageId !== dragOverStageId) {
      const draggedIdx = stages.findIndex(s => s.id === draggedStageId);
      const overIdx = stages.findIndex(s => s.id === dragOverStageId);
      if (draggedIdx > -1 && overIdx > -1) {
        const [item] = stages.splice(draggedIdx, 1);
        stages.splice(overIdx, 0, item);
      }
    }
    return stages;
  }, [filteredStages, draggingType, draggedStageId, dragOverStageId]);


  if (loading && boards.length === 0) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500 bg-slate-900">Carregando Notrouble...</div>

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; } 
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } 
        .card-hover { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s; } 
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(59, 130, 246, 0.15); }
        
        .custom-scrollbar::-webkit-scrollbar { height: 12px; width: 12px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(148, 163, 184, 0.4); border-radius: 10px; border: 3px solid transparent; background-clip: padding-box; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(148, 163, 184, 0.8); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.6); border: 3px solid transparent; background-clip: padding-box; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(100, 116, 139, 0.9); }
      `}</style>

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${isDarkMode ? 'bg-slate-900 border-r border-slate-800 text-slate-200' : 'bg-white text-slate-700'} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-500/20">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">Notrouble</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded hover:bg-slate-500/20 transition-colors">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex flex-col gap-2 px-4">
            <button onClick={() => { navigate('/'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>🏠 Início / Painel</button>
            
            <div>
              <button onClick={() => setIsBoardsDropdownOpen(!isBoardsDropdownOpen)} className={`w-full flex items-center justify-between p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-blue-50 text-blue-600'}`}>
                <span className="flex items-center gap-3">📊 Quadros</span><span>{isBoardsDropdownOpen ? '▲' : '▼'}</span>
              </button>
              {isBoardsDropdownOpen && (
                <div className="ml-8 mt-2 flex flex-col gap-2 border-l-2 border-blue-500/30 pl-3">
                  {boards.map(b => (
                    <button key={b.id} onClick={() => {setActiveBoardId(b.id); setActiveFilter('all');}} className={`text-left p-2 text-sm font-semibold hover:text-blue-500 transition-colors truncate rounded-md ${activeBoard?.id === b.id ? (isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700') : ''}`}>
                      {b.name}
                    </button>
                  ))}
                  <button onClick={() => setIsCreateBoardModalOpen(true)} className="text-left p-2 text-sm font-bold text-blue-500 hover:text-blue-700 transition-colors mt-2 flex items-center gap-1"><span>+</span> Novo Quadro</button>
                </div>
              )}
            </div>
            <button onClick={() => { navigate('/data'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>📈 Relatórios</button>
            <button onClick={() => { navigate('/team'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>👥 Equipe</button>
            <button onClick={() => { navigate('/settings'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>⚙️ Configurações</button>
          </nav>
        </div>
        <div className="p-6 border-t border-slate-500/20"><button onClick={handleLogout} className="w-full p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg font-bold transition-colors">🚪 Sair do Sistema</button></div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

      <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100'}`}>
        <header className={`p-6 flex items-center justify-between shadow-sm z-10 transition-colors ${isDarkMode ? 'bg-slate-800 border-b border-slate-700' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className={`p-2 rounded-lg font-bold transition-colors ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>☰ Menu</button>
            <h1 className={`text-xl md:text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'} flex items-center gap-3 tracking-tight`}>
            {currentUser?.company?.name ? (
              <>
                <span className="uppercase">{currentUser.company.name}</span>
                <span className="text-xs font-normal opacity-40 border-l-2 border-slate-500 pl-3 tracking-widest hidden md:inline-block">POWERED BY NOTROUBLE</span>
              </>
            ) : (
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Notrouble</span>
            )}
          </h1>
          </div>
          <div className="flex items-center gap-6">
             <div className={`flex rounded-lg overflow-hidden border ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'}`}>
              <button onClick={() => setViewMode('kanban')} className={`px-4 py-2 text-sm font-bold transition-colors ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : (isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100')}`}>🗂️ Kanban</button>
              <button onClick={() => setViewMode('list')} className={`px-4 py-2 text-sm font-bold transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : (isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100')}`}>📄 Lista</button>
            </div>
            <button onClick={toggleTheme} className="text-2xl hover:scale-110 transition-transform" title="Trocar Tema">{isDarkMode ? '☀️' : '🌙'}</button>
            
            {currentUser ? (
              <div 
                className={`h-10 w-10 rounded-full shadow-lg cursor-pointer overflow-hidden flex items-center justify-center font-bold text-sm ${isDarkMode ? 'border border-slate-700 text-slate-100' : 'border border-slate-100 text-white'}`}
                style={{ backgroundColor: !currentUser.avatar_url ? (getColorFromString(currentUser.username) || '#3B82F6') : 'transparent' }}
                title={currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name}` : currentUser.username}
              >
                {currentUser.avatar_url ? (
                  <img src={`http://127.0.0.1:8000${currentUser.avatar_url}`} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  (currentUser.first_name ? getInitials(currentUser.first_name, currentUser.last_name, currentUser.username) : '') || currentUser.username?.substring(0, 2).toUpperCase() || 'U'
                )}
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-slate-300 animate-pulse"></div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 relative">
          {activeBoard && (
            <div className="mb-12 animate-fade-in">
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{activeBoard.name}</h2>
                <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-2"></div>
              </div>
              <button 
                onClick={() => deleteBoard(activeBoard.id)} 
                className={`px-4 py-2 rounded-lg font-bold text-sm border shadow-sm transition-all hover:scale-105 ${isDarkMode ? 'bg-red-900/20 border-red-800 text-red-500 hover:bg-red-900/40' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'}`}
                title="Excluir Quadro Inteiro"
              >
                🗑️ Excluir Quadro
              </button>
            </div>
                          
              <BoardHealthMetrics board={activeBoard} isDarkMode={isDarkMode} activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

              {viewMode === 'list' ? (
                <div className={`rounded-xl shadow-lg border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className={`text-xs uppercase tracking-wider ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                        <tr>
                          <th className="p-4 font-bold">Título do Card</th>
                          <th className="p-4 font-bold">Etapa (Status)</th>
                          <th className="p-4 font-bold">Responsável</th>
                          <th className="p-4 font-bold">Prazo</th>
                          <th className="p-4 font-bold">Resultado</th>
                          <th className="p-4 font-bold text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700 text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
                        {displayStages.flatMap(stage => stage.cards.map(card => ({...card, stageName: stage.name}))).length === 0 ? (
                          <tr><td colSpan="6" className="p-8 text-center italic opacity-50">Nenhum card encontrado neste filtro.</td></tr>
                        ) : (
                          displayStages.flatMap(stage => stage.cards.map(card => ({...card, stageName: stage.name}))).map(card => {
                            const result = parseFloat(card.estimated_value || 0) - parseFloat(card.invested_value || 0);
                            const hasFinancials = card.estimated_value || card.invested_value;
                            const isLoss = result < 0;

                            return (
                              <tr key={card.id} onClick={() => openModal(card.id)} className={`transition-colors cursor-pointer group ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                                <td className="p-4 font-semibold text-sm group-hover:text-blue-500 transition-colors">{card.title}</td>
                                <td className="p-4"><span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${isDarkMode ? 'bg-slate-900 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>{card.stageName}</span></td>
                                <td className="p-4 text-sm font-medium">{card.assignee ? <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: getColorFromString(card.assignee.username) }}>{getInitials(card.assignee.first_name, card.assignee.last_name, card.assignee.username) || card.assignee.username.substring(0,2).toUpperCase()}</div>{card.assignee.first_name || card.assignee.username}</div> : '-'}</td>
                                <td className="p-4 text-sm font-medium">{card.due_date ? formatDate(card.due_date) : '-'}</td>
                                <td className="p-4 text-sm font-bold">{hasFinancials ? <span className={isLoss ? 'text-red-500' : 'text-green-500'}>{formatCurrency(result)}</span> : '-'}</td>
                                <td className="p-4 text-right"><button onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all">🗑️</button></td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* 🚀 KANBAN: Agora usa displayStages para renderizar ao vivo */
                <div className="flex gap-6 overflow-x-auto pb-6 items-start custom-scrollbar min-h-[calc(100vh-280px)]">
                  {displayStages.map((stage, stageIndex) => (
                    <div 
                      key={stage.id} 
                      draggable={draggingType !== 'card'} 
                      
                      // 1. COMEÇA O ARRASTO
                      onDragStart={(e) => { 
                        if (draggingType === 'card') return; // Se for card, não arrasta a coluna
                        e.dataTransfer.setData('type', 'stage'); 
                        e.dataTransfer.setData('stage_id', stage.id); 
                        setDraggingType('stage');
                        
                        // O truque: Deixa o browser tirar foto da coluna cheia, e só depois transforma ela em placeholder!
                        setTimeout(() => setDraggedStageId(stage.id), 0);
                      }} 

                      // 2. PASSA POR CIMA DE OUTRA COLUNA
                      onDragOver={(e) => { 
                        e.preventDefault();
                        if (draggingType === 'stage' && draggedStageId !== stage.id) {
                          setDragOverStageId(stage.id); // Avisa pro React onde está passando para ele atualizar a tela
                        }
                      }}

                      // 3. FINALIZA O ARRASTO (Salva no Banco!)
                      onDragEnd={() => {
                        if (draggingType === 'stage' && draggedStageId && dragOverStageId && draggedStageId !== dragOverStageId) {
                          // Pega a nova ordem exata que ficou desenhada na tela
                          const newStageIds = displayStages.map(s => s.id);
                          reorderStages(activeBoard.id, newStageIds);
                        }
                        // Limpa a tela
                        setIsDragging(false);
                        setDraggingType(null);
                        setDraggedStageId(null);
                        setDragOverStageId(null);
                      }}

                      // 4. QUANDO SOLTA UM CARD DENTRO
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const type = e.dataTransfer.getData('type') || draggingType;
                        
                        if (type === 'card') {
                          const cardId = e.dataTransfer.getData('card_id');
                          if (cardId) moveCard(cardId, stage.id);
                        }
                      }}

                      // ESTILOS: Se for o estágio que está sendo arrastado, vira um pontilhado fantasma Trello Style
                      className={`stage-card rounded-xl p-4 min-w-[320px] w-[320px] shadow-md border transition-all duration-300 ease-in-out cursor-grab active:cursor-grabbing 
                        ${draggedStageId === stage.id ? 
                          (isDarkMode ? 'bg-slate-800/40 border-slate-600 border-dashed opacity-50 scale-95' : 'bg-slate-200/50 border-slate-400 border-dashed opacity-50 scale-95') 
                          : (isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200')
                        }`}
                      style={{ animationDelay: `${stageIndex * 0.05}s` }}
                    >
                      {/* O CONTEÚDO SÓ FICA INVISÍVEL NO PLACEHOLDER, MANTENDO O TAMANHO (TRELLO EFFECT) */}
                      <div className={`transition-opacity duration-200 ${draggedStageId === stage.id ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="mb-4">
                          <div className="flex items-center justify-between group/header">
                            {editingStageId === stage.id ? (
                              <input type="text" autoFocus value={editStageName} onChange={e => setEditStageName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveStageEdit(stage.id)} onBlur={() => saveStageEdit(stage.id)} className={`w-full p-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold uppercase text-xs tracking-widest ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-blue-300 text-slate-800'}`} />
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`cursor-grab text-lg ${isDarkMode ? 'text-slate-200 hover:text-slate-100' : 'text-slate-400 hover:text-slate-500'}`} title="Arraste para reordenar">⋮⋮</span>
                                <h3 className={`font-bold uppercase text-xs tracking-widest cursor-text ${isDarkMode ? 'text-slate-100 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'}`} onDoubleClick={() => { setEditingStageId(stage.id); setEditStageName(stage.name) }}>{stage.name}</h3>
                                <div className="opacity-0 group-hover/header:opacity-100 transition-opacity flex gap-1"><button onClick={() => { setEditingStageId(stage.id); setEditStageName(stage.name) }} className="text-slate-400 hover:text-blue-500 px-1">✏️</button><button onClick={() => deleteStage(stage.id)} className="text-slate-400 hover:text-red-500 px-1">🗑️</button></div>
                              </div>
                            )}
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>{stage.cards?.length || 0}</span>
                          </div>
                          <div className="h-0.5 bg-gradient-to-r from-blue-500 to-transparent rounded-full mt-2"></div>
                        </div>
                        
                        <div className="min-h-[200px] flex flex-col gap-3">
                          {stage.cards && stage.cards.length > 0 ? (
                            stage.cards.map((card, cardIndex) => {
                              const result = parseFloat(card.estimated_value || 0) - parseFloat(card.invested_value || 0);
                              const hasFinancials = card.estimated_value || card.invested_value;
                              const isLoss = result < 0;

                              return (
                                <div key={card.id} draggable onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('type', 'card'); e.dataTransfer.setData('card_id', card.id); setIsDragging(true); setDraggingType('card') }} onDragEnd={() => { setIsDragging(false); setDraggingType(null) }} onClick={() => openModal(card.id)} className={`card-hover p-3 rounded-lg border cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md group animate-fade-in transition-colors ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'}`} style={{ animationDelay: `${cardIndex * 0.02}s` }}>
                                  <div className="flex items-start justify-between gap-2"><p className={`font-semibold text-sm group-hover:text-blue-500 transition-colors flex-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{card.title}</p></div>
                                  
                                  <div className={`flex flex-wrap items-center gap-2 border-t mt-3 pt-3 ${isDarkMode ? 'border-slate-600' : 'border-slate-100'}`}>
                                    {card.assignee && <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: getColorFromString(card.assignee.username) }} title={card.assignee.username}>{getInitials(card.assignee.first_name, card.assignee.last_name, card.assignee.username) || card.assignee.username.substring(0,2).toUpperCase()}</div>}
                                    
                                    {card.tags && card.tags.length > 0 && <div className="flex flex-wrap gap-1">{card.tags.slice(0, 2).map(tag => <span key={tag.id} className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: tag.color }}>{tag.name}</span>)}{card.tags.length > 2 && <span className="text-[10px] font-bold text-slate-500 flex items-center">+{card.tags.length - 2}</span>}</div>}
                                    
                                    {card.payment_method && <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}><span>{getPaymentIcon(card.payment_method)}</span><span>{card.payment_method.substring(0, 12)}</span></div>}
                                    {card.checklist_count > 0 && <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}><span>✅</span><span>{card.checklist_done}/{card.checklist_count}</span></div>}
                                    {card.due_date && <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}><span>📅</span><span>{formatDate(card.due_date)}</span></div>}
                                    {hasFinancials && <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${isDarkMode ? (isLoss ? 'bg-rose-900/40 text-rose-400' : 'bg-emerald-900/40 text-emerald-400') : (isLoss ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}`}><span>{isLoss ? '📉' : '💰'}</span><span>{formatCurrency(result)}</span></div>}
                                  </div>
                                </div>
                              )
                            })
                          ) : (<div className={`text-sm italic text-center mt-8 mb-8 flex items-center justify-center h-full ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}><div><p className="text-2xl mb-2">📭</p><p>Solte os cards aqui...</p></div></div>)}
                        </div>

                        {addingToStageId === stage.id ? (
                          <div className="mt-4"><input type="text" className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm font-medium text-sm transition-colors cursor-text ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-blue-300 text-slate-800'}`} placeholder="Título do Card..." autoFocus value={newCardTitle} onChange={(e) => setNewCardTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateNewCard(stage.id)} onBlur={() => handleCreateNewCard(stage.id)} /></div>
                        ) : (
                          <button onClick={() => setAddingToStageId(stage.id)} className={`w-full mt-4 flex items-center justify-center gap-2 p-3 rounded-lg transition-all duration-200 font-semibold text-sm border border-dashed group cursor-pointer ${isDarkMode ? 'text-slate-400 border-slate-600 hover:text-blue-400 hover:border-blue-500 hover:bg-slate-700' : 'text-slate-600 border-slate-300 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50'}`}><span className="text-lg group-hover:scale-125 transition-transform">+</span> <span>Adicionar Card</span></button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div 
                    onDragOver={(e) => e.preventDefault()} 
                    className={`min-w-[320px] w-[320px] rounded-xl p-4 flex flex-col justify-center items-center border-2 border-dashed transition-colors ${isDarkMode ? 'border-slate-700 hover:border-slate-500 bg-slate-800/30' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'}`}
                  >
                    {addingStageToBoardId === activeBoard.id ? (
                      <div className="w-full">
                        <input type="text" autoFocus value={newStageName} onChange={e => setNewStageName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateNewStage(activeBoard.id)} onBlur={() => handleCreateNewStage(activeBoard.id)} className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold text-sm text-center cursor-text ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'}`} placeholder="Nome da Nova Etapa..." />
                      </div>
                    ) : (
                      <button onClick={() => setAddingStageToBoardId(activeBoard.id)} className={`font-bold flex items-center gap-2 group transition-colors cursor-pointer ${isDarkMode ? 'text-slate-500 hover:text-blue-400' : 'text-slate-400 hover:text-blue-600'}`}><span className="text-2xl group-hover:scale-125 transition-transform">+</span> Nova Etapa</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {isDragging && (
        <div 
          onDragOver={(e) => e.preventDefault()} 
          onDrop={(e) => { 
            e.stopPropagation(); 
            const cardId = e.dataTransfer.getData('card_id'); 
            if(cardId) deleteCard(cardId); 
            setIsDragging(false); 
            setDraggingType(null) 
          }} 
          className="fixed bottom-10 left-1/2 transform -translate-x-1/2 w-72 p-4 bg-red-600/90 backdrop-blur-md text-white rounded-2xl shadow-2xl flex justify-center items-center gap-3 border-2 border-dashed border-white/50 z-50 animate-slide-in-up"
        >
          <span className="text-3xl">🗑️</span><span className="font-bold text-lg tracking-wide">Solte para excluir</span>
        </div>
      )}

      {isCreateBoardModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl flex flex-col animate-fade-in ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <h2 className="text-2xl font-bold">Criar Novo Quadro</h2>
              <button onClick={() => setIsCreateBoardModalOpen(false)} className="text-slate-500 hover:text-red-500 text-2xl font-bold">×</button>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2 opacity-80">Nome do Projeto/Quadro</label>
                <input type="text" value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} autoFocus className={`w-full p-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} placeholder="Ex: Lançamento Site Novo" />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2 opacity-80">Quais serão as Etapas (Colunas)?</label>
                <div className="flex flex-col gap-2">
                  {newBoardStages.map((stage, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input type="text" value={stage} onChange={(e) => { const newStages = [...newBoardStages]; newStages[idx] = e.target.value; setNewBoardStages(newStages); }} className={`flex-1 p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`} placeholder={`Etapa ${idx + 1}`} />
                      <button onClick={() => setNewBoardStages(newBoardStages.filter((_, i) => i !== idx))} className={`p-3 rounded-lg border transition-colors ${isDarkMode ? 'border-slate-700 hover:bg-red-900/30 text-slate-400 hover:text-red-400' : 'border-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-500'}`} title="Remover Etapa">🗑️</button>
                    </div>
                  ))}
                  <button onClick={() => setNewBoardStages([...newBoardStages, ""])} className={`mt-2 p-3 rounded-lg border border-dashed font-bold text-sm transition-colors ${isDarkMode ? 'border-slate-600 text-blue-400 hover:bg-slate-700' : 'border-slate-300 text-blue-600 hover:bg-blue-50'}`}>+ Adicionar Etapa</button>
                </div>
              </div>
            </div>
            <div className={`p-6 border-t flex justify-end gap-3 ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50/50'}`}>
              <button onClick={() => setIsCreateBoardModalOpen(false)} className={`px-6 py-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}>Cancelar</button>
              <button onClick={submitNewBoard} className="px-6 py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-transform hover:-translate-y-0.5">Criar Quadro 🚀</button>
            </div>
          </div>
        </div>
      )}

      <CardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} cardId={selectedCardId} boards={boards} users={users} availableTags={availableTags} setAvailableTags={setAvailableTags} createTag={createTag} refreshBoards={fetchBoards} updateLocalCard={updateLocalCard} currentUser={currentUser} showNotification={showNotification} showError={showError} deleteCard={deleteCard} />
    </div>
  )
}