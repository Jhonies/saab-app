import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchContainers, fetchProducts } from '../../services/inventoryService'
import { ZONE_CONFIG, SUBZONE_LABELS } from '../../constants/zones'
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

/* ── Zone stats helper ── */
const zoneStats = (containers) => {
  const total = containers.reduce((s, c) => s + c.capacity, 0)
  const used  = containers.reduce((s, c) => s + c.quantity, 0)
  const pct   = total > 0 ? Math.round((used / total) * 100) : 0
  return { slots: containers.length, used, total, pct }
}

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

/* ── ContainerGrid — renders a grid of cards ── */
const ContainerGrid = ({ containers, isHighlighted, onSelect }) => (
  <div className={styles.grid}>
    {containers.map(c => (
      <ContainerCard
        key={c.id}
        container={c}
        highlighted={isHighlighted(c)}
        onClick={() => onSelect(c)}
      />
    ))}
  </div>
)

/* ── ZoneSection — collapsible zone panel ── */
const ZoneSection = ({ zone, containers, isHighlighted, onSelect, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen)
  const stats = zoneStats(containers)

  return (
    <div className={styles.zoneSection}>
      <button className={styles.zoneToggle} onClick={() => setOpen(o => !o)}>
        <div className={styles.zoneToggleLeft}>
          <span className={styles.zoneName}>{zone.label}</span>
          <span className={styles.zoneStats}>
            {stats.slots} slots — {stats.used} / {stats.total} cxs ({stats.pct}%)
          </span>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className={styles.zoneBody}>
          <ContainerGrid
            containers={containers}
            isHighlighted={isHighlighted}
            onSelect={onSelect}
          />
        </div>
      )}
    </div>
  )
}

/* ── SecosZoneSection — zone with sub-division headers ── */
const SecosZoneSection = ({ containers, isHighlighted, onSelect, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen)
  const stats = zoneStats(containers)

  const grouped = useMemo(() => {
    const map = {}
    for (const c of containers) {
      const sub = c.subZone || 'OTHER'
      if (!map[sub]) map[sub] = []
      map[sub].push(c)
    }
    return map
  }, [containers])

  const subZoneOrder = ['NASSIF', 'SAAB', 'BEBIDAS']

  return (
    <div className={styles.zoneSection}>
      <button className={styles.zoneToggle} onClick={() => setOpen(o => !o)}>
        <div className={styles.zoneToggleLeft}>
          <span className={styles.zoneName}>Secos</span>
          <span className={styles.zoneStats}>
            {stats.slots} slots — {stats.used} / {stats.total} cxs ({stats.pct}%)
          </span>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className={styles.zoneBody}>
          {subZoneOrder.map(sub => {
            const subContainers = grouped[sub]
            if (!subContainers?.length) return null
            const subStats = zoneStats(subContainers)
            return (
              <div key={sub} className={styles.subZoneBlock}>
                <div className={styles.subZoneHeader}>
                  <span className={styles.subZoneName}>{SUBZONE_LABELS[sub]}</span>
                  <span className={styles.subZoneStats}>
                    {subStats.slots} slots — {subStats.used} / {subStats.total} cxs
                  </span>
                </div>
                <ContainerGrid
                  containers={subContainers}
                  isHighlighted={isHighlighted}
                  onSelect={onSelect}
                />
              </div>
            )
          })}
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

  /* Group containers by zone */
  const grouped = useMemo(() => {
    const map = {}
    for (const c of containers) {
      const key = c.zone || 'CONTAINERS'
      if (!map[key]) map[key] = []
      map[key].push(c)
    }
    return map
  }, [containers])

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

      {/* Search results */}
      {!loading && !error && isSearching && (
        <div className={styles.searchResults}>
          {filtered.length === 0 ? (
            <p className={styles.stateBox}>Nenhum resultado para "{search.trim()}"</p>
          ) : (
            <div className={styles.resultsGrid}>
              {filtered.map(c => (
                <ContainerCard
                  key={c.id}
                  container={c}
                  highlighted={false}
                  onClick={() => setSelectedContainer(c)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Zone sections (hidden during search) */}
      {!loading && !error && !isSearching && ZONE_CONFIG.map(zone => {
        const zoneContainers = grouped[zone.key] || []
        if (zoneContainers.length === 0) return null

        if (zone.key === 'SECOS') {
          return (
            <SecosZoneSection
              key={zone.key}
              containers={zoneContainers}
              isHighlighted={() => false}
              onSelect={setSelectedContainer}
              defaultOpen={true}
            />
          )
        }

        return (
          <ZoneSection
            key={zone.key}
            zone={zone}
            containers={zoneContainers}
            isHighlighted={() => false}
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
