import { useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useCardModal } from '../hooks/useCardModal'
import LeftColumn from './CardModalSections/LeftColumn'
import RightColumn from './CardModalSections/RightColumn'

export default function CardModal(props) {
  const { isOpen, onClose, boards, deleteCard } = props
  const { isDarkMode } = useTheme()
  const modalData = useCardModal(props)

  // 🚀 PROTEÇÃO DO BOTÃO 'ESC'
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
    // 🚀 onClick do fundo escuro agora usa o fechamento seguro
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto pt-20 pb-20 modal-backdrop" onClick={modalData.handleSafeClose}>
      <div className={`rounded-2xl w-[900px] max-w-[95%] shadow-2xl relative p-8 flex gap-8 modal-content transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'}`} onClick={(e) => e.stopPropagation()}>
        
        {/* 🚀 onClick do 'X' agora usa o fechamento seguro */}
        <button onClick={modalData.handleSafeClose} className={`absolute top-6 right-6 h-10 w-10 rounded-full flex items-center justify-center font-bold text-2xl transition-all duration-200 hover:scale-110 ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>✕</button>
        
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