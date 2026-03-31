import { useState, useEffect } from 'react'
import { fetchUsers, createUser, updateUser } from '../services/userService'
import styles from './AdminUsers.module.css'

const ROLES = ['ADMIN', 'EXPEDICAO', 'MOTORISTA', 'CLIENTE']

const ROLE_CONFIG = {
  ADMIN:     { label: 'Admin',     color: '#8b0000', bg: '#8b000018' },
  EXPEDICAO: { label: 'Expedição', color: '#1a6bb5', bg: '#1a6bb518' },
  MOTORISTA: { label: 'Motorista', color: '#15803d', bg: '#15803d18' },
  CLIENTE:   { label: 'Cliente',   color: '#505050', bg: '#50505028' },
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

/* ── Modal ── */
const UserModal = ({ initial, onClose, onSaved }) => {
  const isEdit = !!initial

  const [email,    setEmail]    = useState(initial?.email    ?? '')
  const [password, setPassword] = useState('')
  const [role,     setRole]     = useState(initial?.role     ?? 'CLIENTE')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const data = { email, role }
    if (password) data.password = password
    if (!isEdit)  {
      if (!password) { setError('Password obrigatória.'); return }
    }

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
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {isEdit ? 'Editar Utilizador' : 'Novo Utilizador'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}><IconClose /></button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              className={styles.input}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="utilizador@saab.com"
              autoComplete="off"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password {isEdit && <span className={styles.optional}>(deixar em branco para não alterar)</span>}
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isEdit ? '••••••••' : 'Mínimo 6 caracteres'}
              autoComplete="new-password"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="role">Perfil</label>
            <select
              id="role"
              className={styles.select}
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
              ))}
            </select>
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <div className={styles.formActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
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
    <div className={styles.page}>

      <div className={styles.toolbar}>
        <h1 className={styles.pageTitle}>Utilizadores</h1>
        <button className={styles.btnPrimary} onClick={() => setModal('new')}>
          <IconPlus /> Novo Utilizador
        </button>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.tableHeader}>
          <span>ID</span>
          <span>Email</span>
          <span>Perfil</span>
          <span>Criado em</span>
          <span />
        </div>

        {loading ? (
          <p className={styles.empty}>A carregar...</p>
        ) : users.length === 0 ? (
          <p className={styles.empty}>Nenhum utilizador encontrado.</p>
        ) : (
          users.map(user => {
            const cfg = ROLE_CONFIG[user.role] ?? { label: user.role, color: '#888', bg: '#88888818' }
            return (
              <div key={user.id} className={styles.tableRow}>
                <span className={styles.userId}>#{user.id}</span>
                <span className={styles.userEmail}>{user.email}</span>
                <span>
                  <span
                    className={styles.badge}
                    style={{ color: cfg.color, borderColor: cfg.color, backgroundColor: cfg.bg }}
                  >
                    {cfg.label}
                  </span>
                </span>
                <span className={styles.meta}>
                  {new Date(user.createdAt).toLocaleDateString('pt-PT', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                  })}
                </span>
                <span className={styles.actionCell}>
                  <button
                    className={styles.btnEdit}
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
