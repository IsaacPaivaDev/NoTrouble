import { formatTime, getInitials, getColorFromString } from '../../utils/formatters'

export default function CommentsSection({ isDarkMode, comments, newComment, setNewComment, isSaving, handleAddComment, currentUser }) {
  return (
    <div className={`pt-4 border-t pb-4 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
      <label className={`block text-sm font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
        <span>💬</span> Atividades e Comentários
      </label>
      <div className="flex flex-col gap-4 mb-6">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3 animate-fade-in">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 shadow-sm text-xs ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-300 text-slate-600'}`}>
              {comment.user_name[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{comment.user_name}</span>
                <span className="text-xs text-slate-500">{formatTime(comment.created_at)}</span>
              </div>
              <p className={`text-sm p-3 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        
        {/* 🚀 AVATAR INTELIGENTE: FOTO OU INICIAIS */}
        <div 
          className="h-8 w-8 rounded-full text-white flex items-center justify-center font-bold shrink-0 shadow-md text-xs overflow-hidden" 
          style={{ backgroundColor: currentUser && !currentUser.avatar_url ? getColorFromString(currentUser.username) : '#3B82F6' }}
        >
          {currentUser?.avatar_url ? (
            <img src={`http://127.0.0.1:8000${currentUser.avatar_url}`} alt="Me" className="h-full w-full object-cover" />
          ) : (
            currentUser ? getInitials(currentUser.first_name, currentUser.last_name, currentUser.username) : 'U'
          )}
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <textarea rows="2" value={newComment} onChange={(e) => setNewComment(e.target.value)} className={`input-focus w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm shadow-sm font-medium resize-none disabled:opacity-50 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-700'}`} placeholder="Escreva um comentário..." disabled={isSaving} />
          <div className="flex justify-between items-center">
            <button className="text-sm font-bold text-slate-500 hover:text-blue-500 transition-colors flex items-center gap-1">@ Mencionar Usuário</button>
            <button onClick={handleAddComment} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 disabled:opacity-50 ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gradient-to-r from-slate-200 to-slate-100 text-slate-700 hover:from-slate-300 hover:to-slate-200'}`} disabled={isSaving}>Comentar</button>
          </div>
        </div>
      </div>
    </div>
  )
}