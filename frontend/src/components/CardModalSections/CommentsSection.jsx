import { formatTime, getInitials, getColorFromString } from '../../utils/formatters'
import { mediaUrl } from '../../utils/media'
import { IconTrash } from '../../utils/icons'

export default function CommentsSection({ isDarkMode, comments, newComment, setNewComment, isSaving, handleAddComment, handleDeleteComment, currentUser }) {
  return (
    <div className="flex flex-col gap-4">
      {comments.length > 0 && (
        <div className="flex flex-col gap-3 mb-2">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-3 group">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold shrink-0 text-[10px] ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                {(comment.user_name && comment.user_name[0]?.toUpperCase()) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-bold text-xs ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{comment.user_name || 'Usuario'}</span>
                  <span className="text-[10px] text-slate-500">{formatTime(comment.created_at)}</span>
                  {/* Botao excluir: visivel no hover para autor ou admin/manager */}
                  {handleDeleteComment && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="hidden group-hover:block text-slate-400 hover:text-red-500 ml-auto transition-colors"
                      title="Excluir comentario"
                    >
                      <IconTrash className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className={`text-sm p-2.5 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input de novo comentario */}
      <div className="flex gap-3">
        <div
          className="h-7 w-7 rounded-full text-white flex items-center justify-center font-bold shrink-0 text-[10px] overflow-hidden"
          style={{ backgroundColor: currentUser && !currentUser.avatar_url ? getColorFromString(currentUser.username) : '#3B82F6' }}
        >
          {currentUser?.avatar_url
            ? <img src={mediaUrl(currentUser.avatar_url)} alt="" className="h-full w-full object-cover" />
            : currentUser ? getInitials(currentUser.first_name, currentUser.last_name, currentUser.username) : 'U'
          }
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <textarea
            rows="2"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment() } }}
            className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium resize-none ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-700'}`}
            placeholder="Escreva um comentario... (Enter para enviar)"
            disabled={isSaving}
          />
          <div className="flex justify-end">
            <button onClick={handleAddComment} disabled={isSaving || !newComment.trim()} className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors disabled:opacity-30 ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Comentar</button>
          </div>
        </div>
      </div>
    </div>
  )
}