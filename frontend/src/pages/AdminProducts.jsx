import { useState, useEffect, useMemo } from 'react'
import {
  fetchAllProducts,
  createProduct,
  updateProduct,
} from '../services/inventoryService'
import styles from './AdminProducts.module.css'

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
const ProductModal = ({ initial, onClose, onSaved }) => {
  const isEdit = !!initial

  const [name,        setName]        = useState(initial?.name        ?? '')
  const [type,        setType]        = useState(initial?.type        ?? '')
  const [active,      setActive]      = useState(initial?.active      ?? true)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const data = {
      name: name.trim(),
      type: type.trim(),
      ...(isEdit && { active }),
    }

    setSaving(true)
    try {
      const saved = isEdit
        ? await updateProduct(initial.id, data)
        : await createProduct(data)
      onSaved(saved)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Erro ao guardar produto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEdit ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><IconClose /></button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">Nome do Produto</label>
            <input
              id="name"
              type="text"
              required
              className={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex: Picanha, Cerveja Heineken 600ml, Carvão 5kg"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="type">
              Categoria
              <span className={styles.hint}> — texto livre</span>
            </label>
            <input
              id="type"
              type="text"
              required
              className={styles.input}
              value={type}
              onChange={e => setType(e.target.value)}
              placeholder="ex: Bovino, Bebidas, Acessórios, Suíno"
              list="type-suggestions"
            />
            <datalist id="type-suggestions">
              <option value="Bovino" />
              <option value="Suíno" />
              <option value="Aves" />
              <option value="Miúdos" />
              <option value="Laticínios" />
              <option value="Congelados" />
              <option value="Secos" />
              <option value="Bebidas" />
              <option value="Outros" />
            </datalist>
          </div>

          {isEdit && (
            <div className={styles.fieldRow}>
              <label className={styles.label}>Estado</label>
              <div className={styles.toggleRow}>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${active ? styles.toggleActive : ''}`}
                  onClick={() => setActive(true)}
                >
                  Activo
                </button>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${!active ? styles.toggleInactive : ''}`}
                  onClick={() => setActive(false)}
                >
                  Inactivo
                </button>
              </div>
            </div>
          )}

          {error && <p className={styles.errorMsg}>{error}</p>}

          <div className={styles.formActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'A guardar...' : isEdit ? 'Guardar Alterações' : 'Criar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── AdminProducts ── */
const AdminProducts = () => {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)
  const [filter,   setFilter]   = useState('active') // 'active' | 'all'

  useEffect(() => {
    fetchAllProducts()
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() =>
    filter === 'active' ? products.filter(p => p.active !== false) : products,
    [products, filter]
  )

  // group by type for display
  const categories = useMemo(() => {
    const map = {}
    visible.forEach(p => {
      if (!map[p.type]) map[p.type] = 0
      map[p.type]++
    })
    return map
  }, [visible])

  const handleSaved = (saved) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      return idx >= 0
        ? prev.map(p => p.id === saved.id ? saved : p)
        : [saved, ...prev]
    })
    setModal(null)
  }

  return (
    <div className={styles.page}>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h1 className={styles.pageTitle}>Produtos</h1>
          <div className={styles.filters}>
            <button
              className={`${styles.filterBtn} ${filter === 'active' ? styles.filterActive : ''}`}
              onClick={() => setFilter('active')}
            >
              Activos
              <span className={styles.filterCount}>{products.filter(p => p.active !== false).length}</span>
            </button>
            <button
              className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos
              <span className={styles.filterCount}>{products.length}</span>
            </button>
          </div>
        </div>
        <button className={styles.btnPrimary} onClick={() => setModal('new')}>
          <IconPlus /> Novo Produto
        </button>
      </div>

      {!loading && visible.length > 0 && (
        <div className={styles.categories}>
          {Object.entries(categories).map(([cat, count]) => (
            <span key={cat} className={styles.catChip}>
              {cat} <span className={styles.catCount}>{count}</span>
            </span>
          ))}
        </div>
      )}

      <div className={styles.tableWrap}>
        <div className={styles.tableHeader}>
          <span>ID</span>
          <span>Nome</span>
          <span>Categoria</span>
          <span>Estado</span>
          <span />
        </div>

        {loading ? (
          <p className={styles.empty}>A carregar...</p>
        ) : visible.length === 0 ? (
          <p className={styles.empty}>Nenhum produto encontrado.</p>
        ) : (
          visible.map(product => (
            <div key={product.id} className={`${styles.tableRow} ${product.active === false ? styles.rowInactive : ''}`}>
              <span className={styles.productId}>#{product.id}</span>
              <span className={styles.productName}>{product.name}</span>
              <span className={styles.productType}>{product.type}</span>
              <span>
                {product.active !== false
                  ? <span className={`${styles.badge} ${styles.badgeActive}`}>Activo</span>
                  : <span className={`${styles.badge} ${styles.badgeInactive}`}>Inactivo</span>
                }
              </span>
              <span className={styles.actionCell}>
                <button className={styles.btnEdit} onClick={() => setModal(product)}>
                  Editar
                </button>
              </span>
            </div>
          ))
        )}
      </div>

      {modal && (
        <ProductModal
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

    </div>
  )
}

export default AdminProducts
