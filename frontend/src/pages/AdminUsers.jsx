import { useState, useEffect } from 'react'
import { fetchUsers, createUser, updateUser } from '../services/userService'

const ROLES = ['ADMIN', 'VENDEDOR', 'EXPEDICAO', 'MOTORISTA']

const ROLE_CONFIG = {
  ADMIN:     { label: 'Admin',     color: '#8b0000', bg: '#8b000018' },
  VENDEDOR:  { label: 'Vendedor',  color: '#b45309', bg: '#b4530918' },
  EXPEDICAO: { label: 'Expedição', color: '#4a4a4a', bg: '#4a4a4a18' },
  MOTORISTA: { label: 'Motorista', color: '#15803d', bg: '#15803d18' },
}

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

/* ── Grid layout classes ── */
const gridCols = 'grid items-center gap-3 px-5 grid-cols-[1fr_110px_72px] min-[480px]:grid-cols-[1fr_110px_80px] md:grid-cols-[1fr_1fr_110px_1fr_80px] lg:grid-cols-[1fr_1fr_130px_1fr_130px_88px]'

/* ── Modal ── */
const UserModal = ({ initial, onClose, onSaved }) => {
  const isEdit = !!initial

  const [name,     setName]     = useState(initial?.name     ?? '')
  const [email,    setEmail]    = useState(initial?.email    ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role,     setRole]     = useState(initial?.role     ?? 'VENDEDOR')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email é obrigatório.')
      return
    }

    if (!name.trim()) {
      setError('Nome é obrigatório.')
      return
    }

    if (!isEdit && !password) {
      setError('Password obrigatória.')
      return
    }

    if (password && password !== confirmPassword) {
      setError('As passwords não coincidem.')
      return
    }

    const data = { name, email, role }
    if (password) data.password = password

    setSaving(true)
    try {
      const saved = isEdit
        ? await updateUser(initial.id, data)
        : await createUser(data)
      onSaved(saved)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Erro ao guardar utilizador.')
    } finally {
      setSaving(false)
    }
  }

  // Fecha com Escape
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
            {isEdit ? 'Editar Utilizador' : 'Novo Utilizador'}
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
            <label className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-secondary" htmlFor="name">Nome</label>
            <input
              id="name"
              type="text"
              required
              className="bg-input border border-border-input rounded px-3 py-[0.5625rem] text-sm text-primary transition-[border-color,box-shadow] duration-150 w-full placeholder:text-muted focus:outline-none focus:border-red focus:ring-[3px] focus:ring-red/20"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome do utilizador"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-secondary" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              className="bg-input border border-border-input rounded px-3 py-[0.5625rem] text-sm text-primary transition-[border-color,box-shadow] duration-150 w-full placeholder:text-muted focus:outline-none focus:border-red focus:ring-[3px] focus:ring-red/20"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="utilizador@saab.com"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-secondary" htmlFor="password">
              Password {isEdit && <span className="text-[0.6875rem] font-normal normal-case tracking-normal text-muted">(deixar em branco para não alterar)</span>}
            </label>
            <input
              id="password"
              type="password"
              className="bg-input border border-border-input rounded px-3 py-[0.5625rem] text-sm text-primary transition-[border-color,box-shadow] duration-150 w-full placeholder:text-muted focus:outline-none focus:border-red focus:ring-[3px] focus:ring-red/20"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isEdit ? '••••••••' : 'Mínimo 6 caracteres'}
              autoComplete="new-password"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-secondary" htmlFor="confirmPassword">
              Confirmar Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="bg-input border border-border-input rounded px-3 py-[0.5625rem] text-sm text-primary transition-[border-color,box-shadow] duration-150 w-full placeholder:text-muted focus:outline-none focus:border-red focus:ring-[3px] focus:ring-red/20"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repetir password"
              autoComplete="new-password"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-secondary" htmlFor="role">Perfil</label>
            <select
              id="role"
              className="bg-input border border-border-input rounded px-3 py-[0.5625rem] text-sm text-primary transition-[border-color,box-shadow] duration-150 w-full appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20fill=%27none%27%20viewBox=%270%200%2024%2024%27%20stroke=%27%23888888%27%20stroke-width=%272%27%3E%3Cpath%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%20d=%27M19%209l-7%207-7-7%27/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:1rem] pr-9 cursor-pointer focus:outline-none focus:border-red focus:ring-[3px] focus:ring-red/20"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
              ))}
            </select>
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
              {saving ? 'A guardar...' : isEdit ? 'Guardar Alterações' : 'Criar Utilizador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── AdminUsers ── */
const AdminUsers = () => {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null) // null | 'new' | { user }

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  const handleSaved = (saved) => {
    setUsers(prev => {
      const idx = prev.findIndex(u => u.id === saved.id)
      return idx >= 0
        ? prev.map(u => u.id === saved.id ? saved : u)
        : [saved, ...prev]
    })
    setModal(null)
  }

  return (
    <div className="p-6 flex flex-col gap-5">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-base font-bold text-primary m-0">Utilizadores</h1>
        <button
          className="inline-flex items-center gap-2 bg-red border-none rounded px-[1.125rem] py-2 text-[0.8125rem] font-bold uppercase tracking-[0.05em] text-on-red cursor-pointer transition-colors duration-[180ms] hover:enabled:bg-red-h active:enabled:bg-red-a disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => setModal('new')}
        >
          <IconPlus /> Novo Utilizador
        </button>
      </div>

      <div className="bg-surface border border-border rounded-md overflow-hidden shadow-card">
        <div className={`${gridCols} py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted border-b border-border`}>
          <span>Nome</span>
          <span className="hidden md:inline">Email</span>
          <span>Perfil</span>
          <span className="hidden md:inline">Endereço</span>
          <span className="hidden lg:inline">Criado em</span>
          <span />
        </div>

        {loading ? (
          <p className="py-10 px-5 text-sm text-muted m-0 text-center">A carregar...</p>
        ) : users.length === 0 ? (
          <p className="py-10 px-5 text-sm text-muted m-0 text-center">Nenhum utilizador encontrado.</p>
        ) : (
          users.map(user => {
            const cfg = ROLE_CONFIG[user.role] ?? { label: user.role, color: '#888', bg: '#88888818' }
            return (
              <div
                key={user.id}
                className={`${gridCols} py-3.5 border-b border-border last:border-b-0 transition-colors duration-[120ms] hover:bg-hover`}
              >
                <span className="text-sm text-primary overflow-hidden text-ellipsis whitespace-nowrap">{user.name || '—'}</span>
                <span className="hidden md:inline text-sm text-primary overflow-hidden text-ellipsis whitespace-nowrap">{user.email}</span>
                <span>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full border text-[0.6875rem] font-semibold uppercase tracking-[0.08em] whitespace-nowrap"
                    style={{ color: cfg.color, borderColor: cfg.color, backgroundColor: cfg.bg }}
                  >
                    {cfg.label}
                  </span>
                </span>
                <span className="hidden md:inline text-[0.8125rem] text-secondary overflow-hidden text-ellipsis whitespace-nowrap">{user.address || '—'}</span>
                <span className="hidden lg:inline text-xs text-muted">
                  {new Date(user.createdAt).toLocaleDateString('pt-PT', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                  })}
                </span>
                <span className="flex justify-end">
                  <button
                    className="bg-transparent border border-border-input rounded px-3 py-1.5 text-xs font-semibold text-secondary cursor-pointer transition-[border-color,color] duration-150 hover:border-muted hover:text-primary"
                    onClick={() => setModal(user)}
                  >
                    Editar
                  </button>
                </span>
              </div>
            )
          })
        )}
      </div>

      {modal && (
        <UserModal
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

    </div>
  )
}

export default AdminUsers
