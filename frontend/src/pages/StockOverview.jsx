import { useState, useEffect, useMemo, useCallback } from 'react'
import { fetchConsolidatedStock, fetchAllProducts, createProduct, updateProduct, deleteProduct } from '../services/inventoryService'
import { ZONE_LABELS } from '../constants/zones'
import { fmtDate, fmtRelative } from '../utils/dateFormatters'
import { useAuth } from '../context/AuthContext'

/* ── Icons ── */
const SearchIcon = () => (
  <svg className="w-4 h-4 text-muted shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
  </svg>
)

const ClearIcon = () => (
  <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const IconPlus = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)

const IconClose = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-[1.125rem] h-[1.125rem]">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const Spinner = () => (
  <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
    <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
  </svg>
)

const IconEdit = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
  </svg>
)

/* ── Sort options ── */
const SORT_OPTIONS = [
  { key: 'az',     label: 'A → Z' },
  { key: 'za',     label: 'Z → A' },
  { key: 'recent', label: 'Recente' },
  { key: 'lowest', label: 'Menor Stock' },
]

/* ── Stock health helper ── */
const getStockHealth = (qty) => {
  if (qty === 0) return { color: 'text-error', bg: 'bg-error', dot: 'bg-error', label: 'Sem estoque' }
  if (qty <= 10) return { color: 'text-warn', bg: 'bg-warn', dot: 'bg-warn', label: 'Estoque baixo' }
  return { color: 'text-ok', bg: 'bg-ok', dot: 'bg-ok', label: 'OK' }
}

/* ── Product Modal (create/edit) ── */
const ProductModal = ({ initial, onClose, onSaved, onDeleted }) => {
  const isEdit = !!initial

  const [name,   setName]   = useState(initial?.name   ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [stockGeneral, setStockGeneral] = useState(
    Number.isFinite(initial?.stockGeneral) ? initial.stockGeneral : 0
  )
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error,  setError]  = useState('')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const adjustStock = (delta) => {
    setStockGeneral(prev => Math.max(0, Number(prev || 0) + delta))
  }

  const handleStockChange = (e) => {
    const v = e.target.value
    if (v === '') { setStockGeneral(0); return }
    const n = parseInt(v, 10)
    if (!isNaN(n) && n >= 0) setStockGeneral(n)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const data = {
      name: name.trim(),
      ...(isEdit && { active, stockGeneral: Number(stockGeneral) || 0 }),
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

  const handleDelete = async () => {
    setError('')
    setDeleting(true)
    try {
      await deleteProduct(initial.id)
      onDeleted?.(initial.id)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Erro ao eliminar produto.')
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-md shadow-elevated w-full max-w-[480px] flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 className="text-[0.9375rem] font-bold text-primary m-0">{isEdit ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button
            className="bg-transparent border-none text-muted cursor-pointer p-1 flex items-center transition-colors duration-150 hover:text-primary"
            onClick={onClose}
          >
            <IconClose />
          </button>
        </div>

        <form className="p-6 flex flex-col gap-[1.125rem]" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-secondary" htmlFor="prod-name">
              Nome do Produto
            </label>
            <input
              id="prod-name"
              type="text"
              required
              className="bg-input border border-border-input rounded px-3 py-[0.5625rem] text-sm text-primary w-full transition-[border-color,box-shadow] duration-150 placeholder:text-muted focus:outline-none focus:border-red focus:shadow-[0_0_0_3px_rgba(139,0,0,0.22)]"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex: Picanha, Cerveja Heineken 600ml, Carvao 5kg"
            />
          </div>

          {isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-secondary" htmlFor="prod-stock">
                Estoque Geral (caixas)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-9 h-9 flex items-center justify-center bg-input border border-border-input rounded text-base font-bold text-primary cursor-pointer transition-colors duration-150 hover:border-muted hover:bg-hover disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => adjustStock(-1)}
                  disabled={Number(stockGeneral) <= 0}
                  aria-label="Diminuir quantidade"
                >
                  −
                </button>
                <input
                  id="prod-stock"
                  type="number"
                  min="0"
                  className="bg-input border border-border-input rounded px-3 py-[0.5625rem] text-sm text-primary text-center w-full transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-red focus:shadow-[0_0_0_3px_rgba(139,0,0,0.22)]"
                  value={stockGeneral}
                  onChange={handleStockChange}
                />
                <button
                  type="button"
                  className="w-9 h-9 flex items-center justify-center bg-input border border-border-input rounded text-base font-bold text-primary cursor-pointer transition-colors duration-150 hover:border-muted hover:bg-hover"
                  onClick={() => adjustStock(1)}
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {isEdit && (
            <div className="flex items-center justify-between gap-4">
              <label className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-secondary">Estado</label>
              <div className="flex border border-border-input rounded overflow-hidden">
                <button
                  type="button"
                  className={`px-3.5 py-1.5 bg-transparent border-none text-xs font-semibold cursor-pointer transition-[background-color,color] duration-150 ${active ? 'bg-ok text-on-red' : 'text-muted'}`}
                  onClick={() => setActive(true)}
                >
                  Ativo
                </button>
                <button
                  type="button"
                  className={`px-3.5 py-1.5 bg-transparent border-l border-border-input text-xs font-semibold cursor-pointer transition-[background-color,color] duration-150 ${!active ? 'bg-red-light text-error' : 'text-muted border-none'}`}
                  onClick={() => setActive(false)}
                >
                  Inativo
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-[0.8125rem] text-error bg-error-bg border border-red/25 rounded px-3.5 py-2.5 m-0">
              {error}
            </p>
          )}

          {isEdit && confirmDelete && (
            <div className="border border-red/40 bg-error-bg rounded p-3.5 flex flex-col gap-2.5">
              <p className="text-[0.8125rem] text-error m-0 font-semibold">
                Tem certeza que deseja eliminar “{initial.name}”? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="bg-transparent border border-border-input rounded px-3 py-1.5 text-xs font-semibold text-secondary cursor-pointer transition-[border-color,color] duration-150 hover:border-muted hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 bg-red border-none rounded px-3 py-1.5 text-xs font-bold uppercase tracking-[0.05em] text-on-red cursor-pointer transition-colors duration-150 hover:bg-red-h active:bg-red-a disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? <><Spinner /> A eliminar...</> : 'Sim, eliminar'}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1.5">
            {isEdit && !confirmDelete ? (
              <button
                type="button"
                className="bg-transparent border border-red/50 rounded px-[1.125rem] py-2 text-[0.8125rem] font-semibold text-error cursor-pointer transition-colors duration-150 hover:bg-error-bg disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setConfirmDelete(true)}
                disabled={saving || deleting}
              >
                Eliminar
              </button>
            ) : <span />}

            <div className="flex gap-3">
              <button
                type="button"
                className="bg-transparent border border-border-input rounded px-[1.125rem] py-2 text-[0.8125rem] font-semibold text-secondary cursor-pointer transition-[border-color,color] duration-150 hover:border-muted hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={onClose}
                disabled={saving || deleting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-red border-none rounded px-[1.125rem] py-2 text-[0.8125rem] font-bold uppercase tracking-[0.05em] text-on-red cursor-pointer transition-colors duration-150 hover:bg-red-h active:bg-red-a disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={saving || deleting}
              >
                {saving ? <><Spinner /> A guardar...</> : isEdit ? 'Guardar Alterações' : 'Criar Produto'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── ProductRow ── */
const ProductRow = ({ item, expanded, onToggle, isAdmin, onEdit }) => {
  const health = getStockHealth(item.totalQuantity)

  return (
    <div>
      <div
        className="grid grid-cols-[1fr_auto] sm:grid-cols-[8px_1fr_90px_90px_70px_100px_40px] items-center gap-2 px-5 py-3 border-b border-border last:border-b-0 cursor-pointer transition-colors duration-[120ms] hover:bg-hover"
        onClick={onToggle}
      >
        {/* Health dot — desktop */}
        <span className={`hidden sm:block w-2 h-2 rounded-full ${health.dot}`} title={health.label} />

        {/* Product name */}
        <div className="flex items-center gap-2 min-w-0">
          <span className={`sm:hidden w-2 h-2 rounded-full shrink-0 ${health.dot}`} />
          <span className={`text-[0.8125rem] font-medium text-primary truncate ${item.active === false ? 'opacity-50 line-through' : ''}`}>{item.productName}</span>
          {item.active === false && (
            <span className="inline-block px-1.5 py-[0.1rem] rounded text-[0.5625rem] font-semibold uppercase tracking-[0.08em] text-muted bg-input border border-border-input shrink-0">Inativo</span>
          )}
        </div>

        {/* Available — desktop */}
        <span className={`hidden sm:block text-[0.8125rem] font-bold text-right ${health.color}`}>
          {item.totalQuantity}
        </span>

        {/* Reserved — desktop */}
        <span className="hidden sm:block text-[0.8125rem] text-secondary text-right">
          {item.reservedQuantity || 0}
        </span>

        {/* Unit — desktop */}
        <span className="hidden sm:block text-xs text-secondary text-right">{item.unit}</span>

        {/* Modified — desktop */}
        <span className="hidden sm:block text-[0.6875rem] text-muted text-right" title={item.lastUpdatedAt ? fmtDate(item.lastUpdatedAt) : ''}>
          {item.lastUpdatedAt ? fmtRelative(item.lastUpdatedAt) : '—'}
        </span>

        {/* Mobile: qty inline */}
        <span className={`sm:hidden text-sm font-bold text-right ${health.color}`}>
          {item.totalQuantity} {item.unit}
        </span>

        {/* Chevron — desktop */}
        <span className="hidden sm:flex justify-center">
          <svg
            className={`w-4 h-4 text-secondary transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>

      {/* Expanded — container breakdown */}
      {expanded && (
        <div className="bg-hover/50 border-b border-border">
          <div className="px-8 py-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-muted m-0">Locais</p>
              {isAdmin && (
                <button
                  className="inline-flex items-center gap-1.5 bg-transparent border border-border-input rounded px-2.5 py-1 text-[0.6875rem] font-semibold text-secondary cursor-pointer transition-[border-color,color] duration-150 hover:border-muted hover:text-primary"
                  onClick={(e) => { e.stopPropagation(); onEdit() }}
                >
                  <IconEdit /> Editar
                </button>
              )}
            </div>
            {item.containers.map(c => (
              <div key={c.id} className="flex items-center justify-between py-1.5 text-xs">
                <span className="text-secondary">
                  {ZONE_LABELS[c.zone] || c.zone} — {c.label}
                </span>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-primary">{c.quantity} / {c.capacity}</span>
                  {c.updatedAt && (
                    <span className="text-[0.625rem] text-muted whitespace-nowrap" title={fmtDate(c.updatedAt)}>
                      {fmtRelative(c.updatedAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── StockOverview ── */
const StockOverview = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [stock,    setStock]    = useState([])
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [search,   setSearch]   = useState('')
  const [sortBy,   setSortBy]   = useState('az')
  const [expanded, setExpanded] = useState({})
  const [modal,    setModal]    = useState(null)   // null | 'new' | product obj

  const loadAll = useCallback(() => {
    const promises = [fetchConsolidatedStock()]
    if (isAdmin) promises.push(fetchAllProducts())

    Promise.all(promises)
      .then(([stk, prods]) => {
        setStock(stk)
        if (prods) setProducts(prods)
      })
      .catch(() => setError('Erro ao carregar estoque.'))
      .finally(() => setLoading(false))
  }, [isAdmin])

  useEffect(() => { loadAll() }, [loadAll])

  /* Merge product active status into stock items */
  const productMap = useMemo(() => {
    const map = {}
    products.forEach(p => { map[p.id] = p })
    return map
  }, [products])

  const enrichedStock = useMemo(() => {
    return stock.map(s => {
      const prod = productMap[s.productId]
      return {
        ...s,
        active: prod ? prod.active : true,
      }
    })
  }, [stock, productMap])

  /* Products without stock (admin only) */
  const productsWithoutStock = useMemo(() => {
    if (!isAdmin) return []
    const stockIds = new Set(stock.map(s => s.productId))
    return products
      .filter(p => !stockIds.has(p.id))
      .map(p => ({
        productId: p.id,
        productName: p.name,
        productType: p.type || '',
        totalQuantity: 0,
        reservedQuantity: 0,
        unit: '—',
        lastUpdatedAt: null,
        containers: [],
        active: p.active,
      }))
  }, [isAdmin, products, stock])

  const allItems = useMemo(() => [...enrichedStock, ...productsWithoutStock], [enrichedStock, productsWithoutStock])

  const query = search.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!query) return allItems
    return allItems.filter(s => s.productName.toLowerCase().includes(query))
  }, [allItems, query])

  const sorted = useMemo(() => {
    const list = [...filtered]
    switch (sortBy) {
      case 'za':
        return list.sort((a, b) => b.productName.localeCompare(a.productName))
      case 'recent':
        return list.sort((a, b) => {
          const da = a.lastUpdatedAt ? new Date(a.lastUpdatedAt).getTime() : 0
          const db = b.lastUpdatedAt ? new Date(b.lastUpdatedAt).getTime() : 0
          return db - da
        })
      case 'lowest':
        return list.sort((a, b) => a.totalQuantity - b.totalQuantity)
      default: // az
        return list.sort((a, b) => a.productName.localeCompare(b.productName))
    }
  }, [filtered, sortBy])

  const stats = useMemo(() => ({
    totalProducts: filtered.length,
    totalUnits:    filtered.reduce((s, f) => s + f.totalQuantity, 0),
    lowStock:      filtered.filter(f => f.totalQuantity <= 10).length,
  }), [filtered])

  const toggleExpand = (pid) =>
    setExpanded(prev => ({ ...prev, [pid]: !prev[pid] }))

  const handleSaved = (saved) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      return idx >= 0
        ? prev.map(p => p.id === saved.id ? saved : p)
        : [saved, ...prev]
    })
    setModal(null)
    // Reload stock to reflect any changes
    fetchConsolidatedStock().then(setStock).catch(() => {})
  }

  const handleDeleted = (deletedId) => {
    setProducts(prev => prev.filter(p => p.id !== deletedId))
    setStock(prev => prev.filter(s => s.productId !== deletedId))
    setModal(null)
  }

  const handleEdit = (item) => {
    const prod = productMap[item.productId]
    if (prod) {
      setModal(prod)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-secondary">A carregar estoque...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-error">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-primary m-0">Estoque Geral</h1>
          <p className="text-xs text-secondary m-0 mt-1">
            {stats.totalProducts} produtos | {stats.totalUnits} unidades
            {stats.lowStock > 0 && (
              <span className="text-warn"> | {stats.lowStock} em baixa</span>
            )}
          </p>
        </div>

        {isAdmin && (
          <button
            className="inline-flex items-center gap-2 bg-red border-none rounded px-[1.125rem] py-2 text-[0.8125rem] font-bold uppercase tracking-[0.05em] text-on-red cursor-pointer transition-colors duration-150 hover:bg-red-h active:bg-red-a shrink-0"
            onClick={() => setModal('new')}
          >
            <IconPlus /> Novo Produto
          </button>
        )}
      </div>

      {/* Sort buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            className={`px-3 py-1.5 text-xs font-semibold rounded border cursor-pointer transition-colors duration-150 ${
              sortBy === opt.key
                ? 'bg-red border-red text-on-red'
                : 'bg-transparent border-border-input text-secondary hover:border-muted hover:text-primary'
            }`}
            onClick={() => setSortBy(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 bg-surface border border-border rounded-md px-4">
        <SearchIcon />
        <input
          className="flex-1 bg-transparent border-none outline-none py-3 text-sm text-primary placeholder:text-muted"
          type="text"
          placeholder="Buscar produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {query && (
          <>
            <span className="text-xs text-secondary whitespace-nowrap">
              {sorted.length} resultado{sorted.length !== 1 ? 's' : ''}
            </span>
            <button
              className="flex items-center justify-center bg-transparent border-none cursor-pointer p-1 rounded shrink-0 transition-colors duration-150 hover:bg-hover"
              onClick={() => setSearch('')}
              aria-label="Limpar busca"
            >
              <ClearIcon />
            </button>
          </>
        )}
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="bg-surface border border-border rounded-md p-8 text-center">
          <p className="text-sm text-secondary m-0">Nenhum produto em estoque.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden shadow-card">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[8px_1fr_90px_90px_70px_100px_40px] gap-2 px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted border-b border-border">
            <span></span>
            <span>Produto</span>
            <span className="text-right">Disponível</span>
            <span className="text-right">Em Pedidos</span>
            <span className="text-right">Unidade</span>
            <span className="text-right">Modificado</span>
            <span></span>
          </div>

          {sorted.map(item => (
            <ProductRow
              key={item.productId}
              item={item}
              expanded={!!expanded[item.productId]}
              onToggle={() => toggleExpand(item.productId)}
              isAdmin={isAdmin}
              onEdit={() => handleEdit(item)}
            />
          ))}
        </div>
      )}

      {modal && (
        <ProductModal
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}

export default StockOverview
