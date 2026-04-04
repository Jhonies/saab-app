import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchContainers, fetchProducts } from '../../services/inventoryService'
import { ZONE_CONFIG } from '../../constants/zones'
import ContainerEditModal from './ContainerEditModal'
import styles from './InventoryGrid.module.css'

/* ── Icons ── */
const SearchIcon = () => (
  <svg className={styles.searchIcon} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
  </svg>
)

const ClearIcon = () => (
  <svg className={styles.clearIcon} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ChevronIcon = ({ open }) => (
  <svg
    className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
    fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
)

const EditIcon = () => (
  <svg className={styles.editIcon} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.147l-3.167 1.056 1.056-3.167a4.5 4.5 0 011.147-1.89l12.884-12.88z" />
  </svg>
)

/* ── ListRow ── */
const ListRow = ({ container, onClick }) => {
  const { label, quantity, product, zone, unit } = container

  const qtyLabel = unit || 'caixas'

  return (
    <div className={styles.listRow}>
      <div className={styles.colQty}>
        <span className={styles.quantityBadge}>{quantity} {qtyLabel}</span>
      </div>
      <div className={styles.colProduct}>
        {product ? (
          <span className={styles.productName}>{product.name}</span>
        ) : (
          <span className={styles.emptySlot}>Sem produto</span>
        )}
      </div>
      <div className={styles.colAction}>
        <button className={styles.editBtn} onClick={onClick} title="Editar quantidade/produto">
          <EditIcon /> Editar
        </button>
      </div>
    </div>
  )
}

/* ── ContainerList — renders a list of rows ── */
const ContainerList = ({ containers, onSelect }) => (
  <div className={styles.listContainer}>
    {containers.map(c => (
      <ListRow
        key={c.id}
        container={c}
        onClick={() => onSelect(c)}
      />
    ))}
  </div>
)

/* ── ZoneSection — collapsible zone panel ── */
const ZoneSection = ({ zone, containers, onSelect, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={styles.zoneSection}>
      <button className={styles.zoneToggle} onClick={() => setOpen(o => !o)}>
        <div className={styles.zoneToggleLeft}>
          <span className={styles.zoneName}>{zone.label}</span>
          <span className={styles.zoneStats}>
            {containers.length} itens
          </span>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className={styles.zoneBody}>
          <ContainerList
            containers={containers}
            onSelect={onSelect}
          />
        </div>
      )}
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

  const matchesQuery = useCallback((c) =>
    c.product?.name.toLowerCase().includes(query) ||
    c.product?.type.toLowerCase().includes(query) ||
    c.label.toLowerCase().includes(query)
  , [query])

  const isSearching = query.length > 0

  const filtered = useMemo(() =>
    isSearching ? containers.filter(matchesQuery) : []
  , [isSearching, containers, matchesQuery])

  const filteredGrouped = useMemo(() => {
    if (!isSearching) return {}
    const map = {}
    for (const c of filtered) {
      const key = c.zone || 'SECOS'
      if (!map[key]) map[key] = []
      map[key].push(c)
    }
    return map
  }, [isSearching, filtered])

  const grouped = useMemo(() => {
    const map = {}
    for (const c of containers) {
      const key = c.zone || 'SECOS'
      if (!map[key]) map[key] = []
      map[key].push(c)
    }
    return map
  }, [containers])

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
        {isSearching && (
          <>
            <span className={styles.searchCount}>
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </span>
            <button
              className={styles.clearBtn}
              onClick={() => setSearch('')}
              aria-label="Limpar busca"
            >
              <ClearIcon />
            </button>
          </>
        )}
      </div>

      {/* States */}
      {loading && <p className={styles.stateBox}>A carregar contêineres…</p>}
      {!loading && error && <p className={`${styles.stateBox} ${styles.error}`}>{error}</p>}

      {/* Search results grouped by zone */}
      {!loading && !error && isSearching && (
        <div className={styles.searchResults}>
          {filtered.length === 0 ? (
            <p className={styles.stateBox}>Nenhum resultado para "{search.trim()}"</p>
          ) : (
            ZONE_CONFIG.map(zone => {
              const zoneContainers = filteredGrouped[zone.key]
              if (!zoneContainers || zoneContainers.length === 0) return null
              return (
                <ZoneSection
                  key={zone.key}
                  zone={zone}
                  containers={zoneContainers}
                  onSelect={setSelectedContainer}
                  defaultOpen={true}
                />
              )
            })
          )}
        </div>
      )}

      {/* Zone sections */}
      {!loading && !error && !isSearching && ZONE_CONFIG.map(zone => {
        const zoneContainers = grouped[zone.key] || []
        if (zoneContainers.length === 0) return null

        return (
          <ZoneSection
            key={zone.key}
            zone={zone}
            containers={zoneContainers}
            onSelect={setSelectedContainer}
            defaultOpen={true}
          />
        )
      })}

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
