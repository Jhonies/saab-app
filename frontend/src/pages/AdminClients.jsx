import { useState, useEffect } from 'react'
import { fetchClients, createClient, updateClient, deleteClient } from '../services/clientService'

/* ── Icons ── */
const IconPlus = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)

const IconClose = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '1.125rem', height: '1.125rem' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const gridCols = 'grid items-center gap-3 px-5 grid-cols-[40px_1fr_72px] md:grid-cols-[60px_1fr_1fr_130px_88px]'

/* ── Modal ── */
const ClientModal = ({ initial, onClose, onSaved }) => {
  const isEdit = !!initial

  const [name,    setName]    = useState(initial?.name    ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Nome é obrigatório.')
      return
    }

    setSaving(true)
    try {
      const saved = isEdit
        ? await updateClient(initial.id, { name, address })
        : await createClient({ name, address })
      onSaved(saved)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Erro ao guardar cliente.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-md shadow-elevated w-full max-w-[440px] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-[0.9375rem] font-bold text-primary m-0">
            {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button
            className="bg-transparent border-none text-muted cursor-pointer p-1 flex items-center transition-colors duration-150 hover:text-primary"
            onClick={onClose}
          >
            <IconClose />
          </button>
        </div>

        <form className="p-6 flex flex-col gap-[1.125rem]" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-secondary" htmlFor="r-name">Nome</label>
            <input
              id="r-name"
              type="text"
              required
              className="bg-input border border-border-input rounded px-3 py-[0.5625rem] text-sm text-primary transition-[border-color,box-shadow] duration-150 w-full placeholder:text-muted focus:outline-none focus:border-red focus:ring-[3px] focus:ring-red/20"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome do cliente / loja"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-secondary" htmlFor="r-address">Endereço</label>
            <input
              id="r-address"
              type="text"
              className="bg-input border border-border-input rounded px-3 py-[0.5625rem] text-sm text-primary transition-[border-color,box-shadow] duration-150 w-full placeholder:text-muted focus:outline-none focus:border-red focus:ring-[3px] focus:ring-red/20"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Ex: 7600 Dr Phillips Blvd, Orlando, FL"
              autoComplete="off"
            />
          </div>

          {error && (
            <p className="text-[0.8125rem] text-error bg-error-bg border border-red/25 rounded px-3.5 py-2.5 m-0">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1.5">
            <button
              type="button"
              className="bg-transparent border border-border-input rounded px-[1.125rem] py-2 text-[0.8125rem] font-semibold text-secondary cursor-pointer transition-[border-color,color] duration-150 hover:enabled:border-muted hover:enabled:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-red border-none rounded px-[1.125rem] py-2 text-[0.8125rem] font-bold uppercase tracking-[0.05em] text-on-red cursor-pointer transition-colors duration-[180ms] hover:enabled:bg-red-h active:enabled:bg-red-a disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'A guardar...' : isEdit ? 'Guardar Alterações' : 'Criar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── AdminClients ── */
const AdminClients = () => {
  const [clients,  setClients]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)

  useEffect(() => {
    fetchClients()
      .then(setClients)
      .finally(() => setLoading(false))
  }, [])

  const handleSaved = (saved) => {
    setClients(prev => {
      const idx = prev.findIndex(r => r.id === saved.id)
      return idx >= 0
        ? prev.map(r => r.id === saved.id ? saved : r)
        : [saved, ...prev]
    })
    setModal(null)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Apagar este cliente?')) return
    try {
      await deleteClient(id)
      setClients(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      alert(err?.response?.data?.message ?? 'Erro ao apagar.')
    }
  }

  return (
    <div className="p-6 flex flex-col gap-5">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-base font-bold text-primary m-0">Clientes Cadastrados</h1>
        <button
          className="inline-flex items-center gap-2 bg-red border-none rounded px-[1.125rem] py-2 text-[0.8125rem] font-bold uppercase tracking-[0.05em] text-on-red cursor-pointer transition-colors duration-[180ms] hover:enabled:bg-red-h active:enabled:bg-red-a disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => setModal('new')}
        >
          <IconPlus /> Novo Cliente
        </button>
      </div>

      <div className="bg-surface border border-border rounded-md overflow-hidden shadow-card">
        <div className={`${gridCols} py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted border-b border-border`}>
          <span>ID</span>
          <span>Nome</span>
          <span className="hidden md:inline">Endereço</span>
          <span className="hidden md:inline">Criado em</span>
          <span />
        </div>

        {loading ? (
          <p className="py-10 px-5 text-sm text-muted m-0 text-center">A carregar...</p>
        ) : clients.length === 0 ? (
          <p className="py-10 px-5 text-sm text-muted m-0 text-center">Nenhum cliente cadastrado.</p>
        ) : (
          clients.map(r => (
            <div
              key={r.id}
              className={`${gridCols} py-3.5 border-b border-border last:border-b-0 transition-colors duration-[120ms] hover:bg-hover`}
            >
              <span className="font-mono text-sm font-bold text-secondary">#{r.id}</span>
              <span className="text-sm text-primary overflow-hidden text-ellipsis whitespace-nowrap">{r.name}</span>
              <span className="hidden md:inline text-[0.8125rem] text-secondary overflow-hidden text-ellipsis whitespace-nowrap">{r.address || '—'}</span>
              <span className="hidden md:inline text-xs text-muted">
                {new Date(r.createdAt).toLocaleDateString('pt-PT', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })}
              </span>
              <span className="flex justify-end gap-2">
                <button
                  className="bg-transparent border border-border-input rounded px-3 py-1.5 text-xs font-semibold text-secondary cursor-pointer transition-[border-color,color] duration-150 hover:border-muted hover:text-primary"
                  onClick={() => setModal(r)}
                >
                  Editar
                </button>
                <button
                  className="bg-transparent border border-border-input rounded px-3 py-1.5 text-xs font-semibold text-secondary cursor-pointer transition-[border-color,color] duration-150 hover:border-error hover:text-error"
                  onClick={() => handleDelete(r.id)}
                >
                  Apagar
                </button>
              </span>
            </div>
          ))
        )}
      </div>

      {modal && (
        <ClientModal
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

    </div>
  )
}

export default AdminClients
