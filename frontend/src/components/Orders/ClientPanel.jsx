import { useState, useEffect, useCallback } from 'react'
import { registerUser, fetchUsers } from '../../services/authService'
import styles from './ClientPanel.module.css'

const ROLES  = ['CLIENTE', 'MOTORISTA']
const EMPTY  = { email: '', password: '', role: 'CLIENTE' }

const ROLE_LABEL = { CLIENTE: 'Cliente', MOTORISTA: 'Motorista', ADMIN: 'Admin' }

const ClientPanel = () => {
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [open,       setOpen]       = useState(true)

  const [form,       setForm]       = useState(EMPTY)
  const [adding,     setAdding]     = useState(false)
  const [addError,   setAddError]   = useState('')
  const [addSuccess, setAddSuccess] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setFetchError('')
    fetchUsers()
      .then(setUsers)
      .catch(() => setFetchError('Erro ao carregar utilizadores.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async (e) => {
    e.preventDefault()
    setAddError('')
    setAddSuccess('')

    if (!form.email.trim()) { setAddError('Email é obrigatório.'); return }
    if (form.password.length < 6) { setAddError('A password deve ter pelo menos 6 caracteres.'); return }

    setAdding(true)
    try {
      const user = await registerUser({
        email:    form.email.trim(),
        password: form.password,
        role:     form.role,
      })
      setAddSuccess(`Utilizador "${user.email}" criado com sucesso.`)
      setForm(EMPTY)
      load()
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erro ao criar utilizador.'
      setAddError(msg)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className={styles.panel}>

      <button className={styles.toggle} onClick={() => setOpen(o => !o)}>
        <span className={styles.toggleLeft}>
          <span className={styles.toggleTitle}>Gestão de Utilizadores</span>
        </span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>▾</span>
      </button>

      {open && (
        <div className={styles.body}>

          {/* ── Add form ── */}
          <form className={styles.addForm} onSubmit={handleAdd}>
            <p className={styles.sectionLabel}>Novo Utilizador</p>
            <div className={styles.addRow}>
              <input
                className={styles.input}
                type="email"
                placeholder="email@exemplo.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
              <input
                className={styles.input}
                type="password"
                placeholder="Password (mín. 6 chars)"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              <select
                className={styles.select}
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
              <button className={styles.addBtn} type="submit" disabled={adding}>
                {adding ? 'A criar…' : '+ Criar'}
              </button>
            </div>
            {addError   && <p className={styles.errMsg}>{addError}</p>}
            {addSuccess && <p className={styles.successMsg}>{addSuccess}</p>}
          </form>

          {/* ── Table ── */}
          {loading ? (
            <p className={styles.stateMsg}>A carregar utilizadores…</p>
          ) : fetchError ? (
            <p className={`${styles.stateMsg} ${styles.errMsg}`}>{fetchError}</p>
          ) : users.length === 0 ? (
            <p className={styles.stateMsg}>Sem utilizadores registados.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Data de Registo</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className={styles.cellEmail}>{u.email}</td>
                      <td>
                        <span className={`${styles.roleBadge} ${styles[u.role]}`}>
                          {ROLE_LABEL[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className={styles.cellDate}>
                        {new Date(u.createdAt).toLocaleDateString('pt-PT')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

export default ClientPanel
