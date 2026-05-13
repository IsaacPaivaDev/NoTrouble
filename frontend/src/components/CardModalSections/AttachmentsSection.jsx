export default function AttachmentsSection({ isDarkMode, attachments, isUploading, handleFileSelect }) {
  return (
    <div className={`pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
      <label className={`block text-sm font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
        <span>📎</span> Anexos
      </label>
      <div className="flex flex-col gap-3">
        {attachments.map(att => (
            <div key={att.id} className={`flex items-center justify-between p-4 border rounded-lg shadow-sm hover:shadow-md transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <a href={`http://127.0.0.1:8000${att.url}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-500 hover:text-blue-400 cursor-pointer transition-colors underline">{att.filename}</a>
              </div>
            </div>
        ))}
        <input type="file" id="fileUpload" className="hidden" onChange={handleFileSelect} />
        <label htmlFor="fileUpload" className={`w-full py-4 border-2 border-dashed rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''} ${isDarkMode ? 'border-slate-600 text-slate-400 hover:bg-slate-700 hover:border-blue-500 hover:text-blue-400' : 'border-slate-300 text-slate-500 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600'}`}>
          <span className="text-xl group-hover:scale-125 transition-transform">{isUploading ? '⏳' : '📤'}</span> 
          <span>{isUploading ? 'Enviando arquivo...' : 'Arrastar arquivo ou clicar para upload'}</span>
        </label>
      </div>
    </div>
  )
}