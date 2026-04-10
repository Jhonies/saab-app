import { useState, useEffect } from 'react'
import { fetchNotices } from '../services/noticeService'

const DISMISSED_KEY = 'saab_dismissed_notices'

const getDismissed = () => {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')
  } catch {
    return []
  }
}

const addDismissed = (id) => {
  const list = getDismissed()
  if (!list.includes(id)) {
    list.push(id)
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(list))
  }
}

const NoticesBanner = () => {
  const [notices, setNotices] = useState([])
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    fetchNotices()
      .then(all => {
        const dismissed = getDismissed()
        const active = all.filter(n => !dismissed.includes(n.id))
        setNotices(active)
        setCurrent(0)
      })
      .catch(() => {})
  }, [])

  const dismiss = (id) => {
    addDismissed(id)
    setNotices(prev => {
      const next = prev.filter(n => n.id !== id)
      if (current >= next.length && next.length > 0) setCurrent(next.length - 1)
      return next
    })
  }

  const dismissAll = () => {
    notices.forEach(n => addDismissed(n.id))
    setNotices([])
  }

  if (notices.length === 0) return null

  const notice = notices[current]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-3 sm:p-4 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        <div className="bg-surface border border-border rounded-lg shadow-xl overflow-hidden">

          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-red/10 border-b border-border">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75
                     a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0
                     01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-red">
                Aviso{notices.length > 1 ? ` (${current + 1}/${notices.length})` : ''}
              </span>
            </div>
            {notices.length > 1 && (
              <button
                onClick={dismissAll}
                className="text-[0.625rem] text-secondary hover:text-primary bg-transparent border-0 cursor-pointer underline"
              >
                Fechar todos
              </button>
            )}
          </div>

          {/* Content */}
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-primary m-0 mb-1">{notice.title}</p>
            <p className="text-[0.8125rem] text-secondary m-0 leading-relaxed whitespace-pre-wrap">{notice.body}</p>
            <p className="text-[0.625rem] text-muted m-0 mt-2">
              {notice.createdBy?.name || notice.createdBy?.email || 'Sistema'}
              {notice.expiresAt && (
                <span> · Expira {new Date(notice.expiresAt).toLocaleDateString('pt-BR')}</span>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center border-t border-border">
            {notices.length > 1 && current > 0 && (
              <button
                onClick={() => setCurrent(c => c - 1)}
                className="flex-1 py-3 text-xs font-semibold text-secondary hover:text-primary hover:bg-hover bg-transparent border-0 border-r border-border cursor-pointer transition-colors"
              >
                Anterior
              </button>
            )}
            {notices.length > 1 && current < notices.length - 1 && (
              <button
                onClick={() => setCurrent(c => c + 1)}
                className="flex-1 py-3 text-xs font-semibold text-secondary hover:text-primary hover:bg-hover bg-transparent border-0 border-r border-border cursor-pointer transition-colors"
              >
                Proximo
              </button>
            )}
            <button
              onClick={() => dismiss(notice.id)}
              className="flex-1 py-3 text-xs font-bold text-red hover:bg-red/10 bg-transparent border-0 cursor-pointer transition-colors"
            >
              OK, entendi
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default NoticesBanner
