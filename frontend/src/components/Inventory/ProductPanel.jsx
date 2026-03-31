import { useState, useEffect, useCallback } from 'react'
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../services/inventoryService'
import styles from './ProductPanel.module.css'

const TYPES    = ['Bovino', 'Suíno', 'Frango', 'Cordeiro', 'Outro']
const EMPTY    = { name: '', type: 'Bovino', pricePerBox: '' }

/* ── ProductPanel ── */
const ProductPanel = () => {
  const [products,     setProducts]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [fetchError,   setFetchError]   = useState('')
  const [open,         setOpen]         = useState(true)

  /* Add form */
  const [form,         setForm]         = useState(EMPTY)
  const [adding,       setAdding]       = useState(false)
  const [addError,     setAddError]     = useState('')

  /* Inline edit */
  const [editId,       setEditId]       = useState(null)
  const [editForm,     setEditForm]     = useState({})
  const [saving,       setSaving]       = useState(false)
  const [editError,    setEditError]    = useState('')

  /* Delete feedback */
  const [deleteError,  setDeleteError]  = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setFetchError('')
    fetchProducts()
      .then(setProducts)
      .catch(() => setFetchError('Erro ao carregar produtos.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  /* ── Add ── */
  const handleAdd = async (e) => {
    e.preventDefault()
    setAddError('')
    if (!form.name.trim()) { setAddError('Nome é obrigatório.'); return }
    setAdding(true)
    try {
      await createProduct({
        name:        form.name.trim(),
        type:        form.type,
        pricePerBox: form.pricePerBox === '' ? 0 : Number(form.pricePerBox),
      })
      setForm(EMPTY)
      load()
    } catch {
      setAddError('Erro ao criar produto. Tente novamente.')
    } finally {
      setAdding(false)
    }
  }

  /* ── Edit ── */
  const startEdit = (p) => {
    setEditId(p.id)
    setEditForm({ name: p.name, type: p.type, pricePerBox: p.pricePerBox })
    setEditError('')
    setDeleteError('')
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditForm({})
    setEditError('')
  }

  const handleSaveEdit = async () => {
    setEditError('')
    if (!editForm.name?.trim()) { setEditError('Nome é obrigatório.'); return }
    setSaving(true)
    try {
      await updateProduct(editId, {
        name:        editForm.name.trim(),
        type:        editForm.type,
        pricePerBox: Number(editForm.pricePerBox),
      })
      cancelEdit()
      load()
    } catch {
      setEditError('Erro ao guardar.')
    } finally {
      setSaving(false)
    }
  }

  /* ── Delete ── */
  const handleDelete = async (id) => {
    setDeleteError('')
    try {
      await deleteProduct(id)
      load()
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erro ao apagar produto.'
      setDeleteError(msg)
    }
  }

  return (
    <div className={styles.panel}>

      {/* Toggle header */}
      <button className={styles.toggle} onClick={() => setOpen(o => !o)}>
        <span className={styles.toggleLeft}>
          <span className={styles.eyebrow}>Módulo A</span>
          <span className={styles.toggleTitle}>Gestão de Produtos</span>
        </span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>▾</span>
      </button>

      {open && (
        <div className={styles.body}>

          {/* ── Add form ── */}
          <form className={styles.addForm} onSubmit={handleAdd}>
            <p className={styles.sectionLabel}>Novo Produto</p>
            <div className={styles.addRow}>
              <input
                className={styles.input}
                placeholder="Nome do produto"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <select
                className={styles.select}
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              >
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                className={styles.input}
                type="number"
                min="0"
                step="0.01"
                placeholder="Preço / cx ($)"
                value={form.pricePerBox}
                onChange={e => setForm(f => ({ ...f, pricePerBox: e.target.value }))}
              />
              <button className={styles.addBtn} type="submit" disabled={adding}>
                {adding ? 'A adicionar…' : '+ Adicionar'}
              </button>
            </div>
            {addError && <p className={styles.errMsg}>{addError}</p>}
          </form>

          {/* Delete error banner */}
          {deleteError && (
            <div className={styles.errorBanner}>{deleteError}</div>
          )}

          {/* ── Table ── */}
          {loading ? (
            <p className={styles.stateMsg}>A carregar produtos…</p>
          ) : fetchError ? (
            <p className={`${styles.stateMsg} ${styles.errMsg}`}>{fetchError}</p>
          ) : products.length === 0 ? (
            <p className={styles.stateMsg}>Sem produtos registados.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Preço / Cx</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    editId === p.id ? (

                      /* ── Edit row ── */
                      <tr key={p.id} className={styles.editRow}>
                        <td>
                          <input
                            className={styles.input}
                            value={editForm.name}
                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                          />
                        </td>
                        <td>
                          <select
                            className={styles.select}
                            value={editForm.type}
                            onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                          >
                            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </td>
                        <td>
                          <input
                            className={styles.input}
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.pricePerBox}
                            onChange={e => setEditForm(f => ({ ...f, pricePerBox: e.target.value }))}
                          />
                        </td>
                        <td className={styles.actions}>
                          <button
                            className={styles.saveBtn}
                            onClick={handleSaveEdit}
                            disabled={saving}
                          >
                            {saving ? '…' : 'Guardar'}
                          </button>
                          <button
                            className={styles.cancelBtn}
                            onClick={cancelEdit}
                            disabled={saving}
                          >
                            Cancelar
                          </button>
                          {editError && (
                            <span className={styles.inlineErr}>{editError}</span>
                          )}
                        </td>
                      </tr>

                    ) : (

                      /* ── Normal row ── */
                      <tr key={p.id}>
                        <td className={styles.cellName}>{p.name}</td>
                        <td>
                          <span className={styles.typeBadge}>{p.type}</span>
                        </td>
                        <td className={styles.cellPrice}>
                          $ {p.pricePerBox.toFixed(2)}
                        </td>
                        <td className={styles.actions}>
                          <button
                            className={styles.editBtn}
                            onClick={() => startEdit(p)}
                          >
                            Editar
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(p.id)}
                          >
                            Apagar
                          </button>
                        </td>
                      </tr>

                    )
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

export default ProductPanel
