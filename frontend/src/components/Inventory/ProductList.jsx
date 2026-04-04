import { useState, useEffect, useMemo } from 'react'
import { fetchAllProducts, updateProduct, createProduct } from '../../services/inventoryService'
import styles from './ProductList.module.css'

const IconEdit = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '0.875rem', height: '0.875rem' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18.75V8.25a2.25 2.25 0 012.25-2.25H11" />
  </svg>
)

const IconPlus = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)

const IconClose = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '1.125rem', height: '1.125rem' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const CreateModal = ({ onClose, onSaved }) => {
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [pricePerBox, setPricePerBox] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const saved = await createProduct({
        name: name.trim(),
        type: type.trim(),
        pricePerBox: pricePerBox !== '' ? Number(pricePerBox) : 0,
        active: true,
      })
      onSaved(saved)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Erro ao criar produto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Novo Produto</h2>
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
              placeholder="ex: Picanha, Cerveja Heineken 600ml"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="type">Categoria</label>
            <input
              id="type"
              type="text"
              required
              className={styles.input}
              value={type}
              onChange={e => setType(e.target.value)}
              list="type-suggestions"
              placeholder="ex: Bovino, Bebidas"
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

          <div className={styles.field}>
            <label className={styles.label} htmlFor="price">Preço por Caixa ($)</label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              className={styles.input}
              value={pricePerBox}
              onChange={e => setPricePerBox(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <div className={styles.formActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'A criar...' : 'Criar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const EditModal = ({ product, onClose, onSaved }) => {
  const [name, setName] = useState(product.name)
  const [type, setType] = useState(product.type)
  const [pricePerBox, setPricePerBox] = useState(product.pricePerBox)
  const [active, setActive] = useState(product.active !== false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const saved = await updateProduct(product.id, {
        name: name.trim(),
        type: type.trim(),
        pricePerBox: pricePerBox !== '' ? Number(pricePerBox) : 0,
        active,
      })
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
          <h2 className={styles.modalTitle}>Editar Produto</h2>
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
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="type">Categoria</label>
            <input
              id="type"
              type="text"
              required
              className={styles.input}
              value={type}
              onChange={e => setType(e.target.value)}
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

          <div className={styles.field}>
            <label className={styles.label} htmlFor="price">Preço por Caixa ($)</label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              className={styles.input}
              value={pricePerBox}
              onChange={e => setPricePerBox(e.target.value)}
            />
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.label}>Estado (override manual)</label>
            <div className={styles.toggleRow}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${active ? styles.toggleActive : ''}`}
                onClick={() => setActive(true)}
              >
                Em Estoque
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${!active ? styles.toggleInactive : ''}`}
                onClick={() => setActive(false)}
              >
                Sem Estoque
              </button>
            </div>
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <div className={styles.formActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'A guardar...' : 'Guardar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ProductList = ({ containers }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchAllProducts()
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  const productData = useMemo(() => {
    const map = {}
    for (const p of products) {
      const productContainers = containers.filter(c => c.productId === p.id)
      const totalQty = productContainers.reduce((sum, c) => sum + c.quantity, 0)
      
      const formatLocation = (label, zone, subZone) => {
        const match = label.match(/^([A-Z]+)-\d+$/)
        const prefix = match ? match[1] : label
        
        let location = ''
        switch (prefix) {
          case 'CT33':
            location = 'Container 33'
            break
          case 'CT32':
            location = 'Container 32'
            break
          case 'CT31':
            location = 'Container 31'
            break
          case 'OB':
            location = 'Open Box'
            break
          case 'SN':
            location = 'Secos - NASSIF'
            break
          case 'SS':
            location = 'Secos - SAAB'
            break
          case 'SB':
            location = 'Bebidas'
            break
          default:
            location = zone || 'Outros'
        }
        
        return location
      }
      
      const rawLocations = productContainers.map(c => formatLocation(c.label, c.zone, c.subZone))
      const locations = [...new Set(rawLocations)]
      map[p.id] = { totalQty, locations }
    }
    return map
  }, [products, containers])

  const handleSaved = (saved) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      return idx >= 0
        ? prev.map(p => p.id === saved.id ? saved : p)
        : [saved, ...prev]
    })
    setSelected(null)
    setCreating(false)
  }

  if (loading) {
    return <p className={styles.loading}>A carregar produtos...</p>
  }

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Produtos</h2>
        <button className={styles.addBtn} onClick={() => setCreating(true)}>
          <IconPlus /> Novo Produto
        </button>
      </div>
      
      <div className={styles.list}>
        <div className={styles.listHeader}>
          <span>Produto</span>
          <span>Categoria</span>
          <span>Local</span>
          <span className={styles.right}>Qtd</span>
          <span className={styles.right}>Preço / cx</span>
          <span>Estado</span>
          <span />
        </div>

        {products.map(product => {
          const data = productData[product.id]
          const qty = data?.totalQty || 0
          const locations = data?.locations || []
          const hasManualStock = product.active !== false
          const hasAutoStock = qty > 0
          const inStock = hasManualStock && hasAutoStock

          return (
            <div key={product.id} className={`${styles.listRow} ${!inStock ? styles.rowInactive : ''}`}>
              <span className={styles.productName}>{product.name}</span>
              <span className={styles.productType}>{product.type}</span>
              <span className={styles.locations}>
                {locations.length > 0 
                  ? locations.map((loc, i) => <span key={i} className={styles.locationTag}>{loc}</span>)
                  : '—'
                }
              </span>
              <span className={`${styles.qty} ${styles.right}`}>
                {qty} cxs
              </span>
              <span className={`${styles.price} ${styles.right}`}>
                $ {Number(product.pricePerBox).toFixed(2)}
              </span>
              <span>
                <span className={`${styles.badge} ${inStock ? styles.badgeStock : styles.badgeNoStock}`}>
                  {inStock ? 'Em Estoque' : 'Sem Estoque'}
                </span>
              </span>
              <span className={styles.action}>
                <button className={styles.editBtn} onClick={() => setSelected(product)}>
                  <IconEdit /> Editar
                </button>
              </span>
            </div>
          )
        })}
      </div>

      {selected && (
        <EditModal
          product={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
        />
      )}

      {creating && (
        <CreateModal
          onClose={() => setCreating(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

export default ProductList