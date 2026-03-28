import { useState, useEffect, useCallback } from 'react'
import { fetchContainers, fetchProducts } from '../../services/inventoryService'
import ContainerEditModal from './ContainerEditModal'
import styles from './InventoryGrid.module.css'

/* ── Helpers ── */
const getStatus = (quantity, capacity) => {
  if (quantity === 0)       return 'empty'
  if (quantity >= capacity) return 'full'
  return 'partial'
}

const STATUS_LABEL = { empty: 'Vazio', partial: 'Parcial', full: 'Cheio' }

const SearchIcon = () => (
  <svg className={styles.searchIcon} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
  </svg>
)

/* ── ContainerCard ── */
const ContainerCard = ({ container, highlighted, onClick }) => {
  const { label, capacity, quantity, product } = container
  const status = getStatus(quantity, capacity)
  const pct    = capacity > 0 ? Math.round((quantity / capacity) * 100) : 0

  return (
    <div
      className={`${styles.card} ${highlighted ? styles.highlighted : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      title="Clique para editar"
    >
      <div className={styles.cardHead}>
        <span className={styles.cardLabel}>{label}</span>
        <span className={`${styles.badge} ${styles[status]}`}>
          <span className={styles.badgeDot} />
          {STATUS_LABEL[status]}
        </span>
      </div>

      {product ? (
        <>
          <p className={styles.productName}>{product.name}</p>
          <p className={styles.productType}>{product.type}</p>
        </>
      ) : (
        <p className={styles.emptySlot}>Sem produto</p>
      )}

      <div className={styles.progressWrapper}>
        <div className={styles.progressTrack}>
          <div
            className={`${styles.progressFill} ${styles[status]}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={styles.progressLabel}>{quantity} / {capacity} cxs</span>
      </div>
    </div>
  )
}

/* ── InventoryGrid ── */
const InventoryGrid = () => {
  const [containers,        setContainers]        = useState([])
  const [products,          setProducts]          = useState([])
  const [loading,           setLoading]           = useState(true)
  const [error,             setError]             = useState('')
  const [search,            setSearch]            = useState('')
  const [selectedContainer, setSelectedContainer] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    Promise.all([fetchContainers(), fetchProducts()])
      .then(([c, p]) => { setContainers(c); setProducts(p) })
      .catch(() => setError('Erro ao carregar inventário. Verifique a ligação ao servidor.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const query = search.trim().toLowerCase()

  const isHighlighted = (c) =>
    query.length > 0 &&
    (
      c.product?.name.toLowerCase().includes(query) ||
      c.product?.type.toLowerCase().includes(query) ||
      c.label.toLowerCase().includes(query)
    )

  const matchCount = query ? containers.filter(isHighlighted).length : null

  /* After saving, replace the updated container in-place (no full reload) */
  const handleSaved = (updated) => {
    setContainers(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSelectedContainer(null)
  }

  return (
    <div className={styles.wrapper}>

      {/* Search bar */}
      <div className={styles.searchBar}>
        <SearchIcon />
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Buscar por produto, tipo ou contêiner…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {matchCount !== null && (
          <span className={styles.searchCount}>
            {matchCount} resultado{matchCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {loading && <p className={styles.stateBox}>A carregar contêineres…</p>}

        {!loading && error && (
          <p className={`${styles.stateBox} ${styles.error}`}>{error}</p>
        )}

        {!loading && !error && containers.map(c => (
          <ContainerCard
            key={c.id}
            container={c}
            highlighted={isHighlighted(c)}
            onClick={() => setSelectedContainer(c)}
          />
        ))}
      </div>

      {/* Edit modal */}
      {selectedContainer && (
        <ContainerEditModal
          container={selectedContainer}
          products={products}
          onClose={() => setSelectedContainer(null)}
          onSaved={handleSaved}
        />
      )}

    </div>
  )
}

export default InventoryGrid
