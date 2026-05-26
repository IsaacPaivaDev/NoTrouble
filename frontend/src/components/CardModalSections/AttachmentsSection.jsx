import { mediaUrl } from '../../utils/media'
import { IconFile, IconClip } from '../../utils/icons'

export default function AttachmentsSection({ isDarkMode, attachments, isUploading, handleFileSelect }) {
  return (
    <div className="flex flex-col gap-3">
      {attachments.map(att => (
        <div key={att.id} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <IconFile className="w-5 h-5 text-blue-500 shrink-0" />
            <a href={mediaUrl(att.url)} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-500 hover:text-blue-400 truncate underline">{att.filename}</a>
          </div>
        </div>
      ))}
      <input type="file" id="fileUpload" className="hidden" onChange={handleFileSelect} />
      <label htmlFor="fileUpload" className={`w-full py-3 border-2 border-dashed rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''} ${isDarkMode ? 'border-slate-600 text-slate-400 hover:bg-slate-700 hover:border-blue-500 hover:text-blue-400' : 'border-slate-300 text-slate-500 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600'}`}>
        <IconClip className={`w-4 h-4 ${isUploading ? '' : 'group-hover:scale-110'}`} />
        <span>{isUploading ? 'Enviando...' : 'Clique ou cole (Ctrl+V) para anexar'}</span>
      </label>
    </div>
  )
}