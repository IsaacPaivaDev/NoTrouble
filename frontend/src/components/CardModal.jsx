import { useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useCardModal } from '../hooks/useCardModal'
import LeftColumn from './CardModalSections/LeftColumn'
import RightColumn from './CardModalSections/RightColumn'

export default function CardModal(props) {
  const { isOpen, onClose, boards, deleteCard } = props
  const { isDarkMode } = useTheme()
  const modalData = useCardModal(props)

  // 🚀 PROTEÇÃO DO BOTÃO 'ESC' (Agora pergunta ou salva)
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') modalData.handleSafeClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, modalData]);

  if (!isOpen) return null

  const allProps = { ...props, ...modalData, isDarkMode }

  const currentBoard = boards.find(b => b.stages.some(s => s.id === modalData.editStageId)) || boards[0];
  const availableStagesForThisCard = currentBoard ? currentBoard.stages : [];

  return (
    // 🚀 onPaste aqui captura CTRL+V em qualquer lugar do modal
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto pt-10 pb-10 modal-backdrop" 
      onClick={modalData.handleSafeClose}
      onPaste={modalData.handlePaste} 
    >
      <div className={`rounded-2xl w-[1000px] max-w-[95%] shadow-2xl relative p-8 flex flex-col md:flex-row gap-8 modal-content transition-colors duration-300 min-h-[500px] ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'}`} onClick={(e) => e.stopPropagation()}>
        
        <button onClick={modalData.handleSafeClose} className={`absolute top-6 right-6 h-10 w-10 rounded-full flex items-center justify-center font-bold text-2xl transition-all duration-200 hover:scale-110 z-10 ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`} title="Fechar (ESC)">✕</button>
        
        {modalData.isLoading || !modalData.selectedCard ? (
          <div className="flex-1 flex justify-center items-center py-20 font-bold opacity-50">Carregando dados...</div>
        ) : (
          <>
            <LeftColumn {...allProps} />
            <RightColumn {...allProps} availableStagesForThisCard={availableStagesForThisCard} />
          </>
        )}
      </div>
    </div>
  )
}