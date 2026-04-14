import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchNotices, createNotice, deleteNotice } from '../services/noticeService'

const IconBell = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75
         a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0
         01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
)

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

const timeUntil = (dateStr) => {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return null
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 24) return `${hrs}h restantes`
  const days = Math.floor(hrs / 24)
  return `${days}d restantes`
}

const isNew = (dateStr) =>
  Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000

const ROLES = ['ADMIN', 'EXPEDICAO', 'VENDEDOR', 'MOTORISTA']
const ROLE_LABELS = { ADMIN: 'Admin', EXPEDICAO: 'Expedição', VENDEDOR: 'Vendedor', MOTORISTA: 'Motorista' }

const Notices = () => {
  const { user } = useAuth()
  const canCreate = user?.role === 'ADMIN' || user?.role === 'EXPEDICAO'

  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', expiresAt: '', visibleTo: [] })
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    fetchNotices()
      .then(setNotices)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) return
    setSubmitting(true)
    try {
      await createNotice({
        title: form.title.trim(),
        body: form.body.trim(),
        expiresAt: form.expiresAt || null,
        visibleTo: form.visibleTo.length > 0 ? form.visibleTo : [],
      })
      setForm({ title: '', body: '', expiresAt: '', visibleTo: [] })
      setShowModal(false)
      load()
    } catch {
      // silently handled
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Apagar este aviso?')) return
    try {
      await deleteNotice(id)
      setNotices(prev => prev.filter(n => n.id !== id))
    } catch {
      // silently handled
    }
  }

  const canDelete = (notice) =>
    user?.role === 'ADMIN' || notice.createdById === user?.id

  return (
    <div className="flex flex-col gap-5 p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconBell />
          <h1 className="text-lg font-bold text-primary m-0">Avisos</h1>
          {notices.length > 0 && (
            <span className="text-xs text-secondary">({notices.length})</span>
          )}
        </div>
        {canCreate && (
          <button
            className="flex items-center gap-2 bg-red text-white text-sm font-bold uppercase tracking-wider px-4 py-2.5 rounded cursor-pointer border-0 transition-colors duration-150 hover:bg-red-hover"
            onClick={() => setShowModal(true)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Novo Aviso
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-secondary py-8 text-center">A carregar...</p>
      ) : notices.length === 0 ? (
        <div className="bg-surface border border-border rounded-md p-8 text-center">
          <p className="text-sm text-secondary m-0">Nenhum aviso no momento.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notices.map(notice => (
            <div key={notice.id} className="bg-surface border border-border rounded-md p-5 shadow-card relative">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {isNew(notice.createdAt) && (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-ok/10 text-ok text-[0.625rem] font-bold uppercase tracking-wider">
                        Novo
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-primary m-0">{notice.title}</h3>
                  </div>
                  <p className="text-sm text-primary leading-relaxed m-0 whitespace-pre-wrap">{notice.body}</p>
                  <div className="flex items-center gap-3 mt-3 text-[0.6875rem] text-secondary flex-wrap">
                    <span>Por: {notice.createdBy?.name || notice.createdBy?.email || 'Sistema'}</span>
                    <span>{timeAgo(notice.createdAt)} atras</span>
                    {notice.visibleTo?.length > 0 && (
                      <span className="text-info">
                        Para: {notice.visibleTo.map(r => ROLE_LABELS[r] || r).join(', ')}
                      </span>
                    )}
                    {(!notice.visibleTo || notice.visibleTo.length === 0) && (
                      <span className="text-info">Para: Todos</span>
                    )}
                    {notice.expiresAt && (
                      <span className="text-warn">
                        {timeUntil(notice.expiresAt) || 'Expirado'}
                      </span>
                    )}
                  </div>
                </div>
                {canCreate && canDelete(notice) && (
                  <button
                    className="p-1.5 text-secondary hover:text-error bg-transparent border-0 cursor-pointer rounded transition-colors duration-150 hover:bg-error-bg shrink-0"
                    onClick={() => handleDelete(notice.id)}
                    title="Apagar aviso"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <form
            onSubmit={handleSubmit}
            className="relative bg-surface border border-border rounded-md p-6 w-full max-w-md shadow-xl z-10 flex flex-col gap-4"
          >
            <h2 className="text-base font-bold text-primary m-0">Novo Aviso</h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-secondary">Titulo</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="bg-input border border-border-input rounded px-3 py-2.5 text-sm text-primary outline-none focus:border-red transition-colors"
                placeholder="Ex: Novo container chegando"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-secondary">Mensagem</label>
              <textarea
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                className="bg-input border border-border-input rounded px-3 py-2.5 text-sm text-primary outline-none focus:border-red transition-colors resize-y min-h-[100px]"
                placeholder="Descreva o aviso..."
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Visivel para <span className="font-normal text-secondary">(vazio = todos)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(role => (
                  <label key={role} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.visibleTo.includes(role)}
                      onChange={() => setForm(f => ({
                        ...f,
                        visibleTo: f.visibleTo.includes(role)
                          ? f.visibleTo.filter(r => r !== role)
                          : [...f.visibleTo, role],
                      }))}
                      className="accent-[var(--red-base)]"
                    />
                    <span className="text-sm text-primary">{ROLE_LABELS[role]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Expira em <span className="font-normal text-secondary">(opcional)</span>
              </label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="bg-input border border-border-input rounded px-3 py-2.5 text-sm text-primary outline-none focus:border-red transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="bg-transparent border border-border-input text-secondary px-4 py-2.5 text-sm rounded cursor-pointer transition-colors duration-150 hover:bg-hover"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-red text-white text-sm font-bold uppercase tracking-wider px-5 py-2.5 rounded cursor-pointer border-0 transition-colors duration-150 hover:bg-red-hover disabled:opacity-50"
              >
                {submitting ? 'A criar...' : 'Criar Aviso'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Notices
