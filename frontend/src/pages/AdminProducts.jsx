import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  fetchAllProducts,
  createProduct,
  updateProduct,
  fetchConsolidatedStock,
} from '../services/inventoryService'
import { ZONE_LABELS } from '../constants/zones'

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

const IconChevron = ({ open }) => (
  <svg
    className={`w-4 h-4 text-secondary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const Spinner = () => (
  <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
    <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
  </svg>
)

/* ── Modal de criar/editar produto (sem campos de preço) ── */
const ProductModal = ({ initial, onClose, onSaved }) => {
  const isEdit = !!initial

  const [name,   setName]   = useState(initial?.name   ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

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

          <div className="flex justify-end gap-3 pt-1.5">
            <button
              type="button"
              className="bg-transparent border border-border-input rounded px-[1.125rem] py-2 text-[0.8125rem] font-semibold text-secondary cursor-pointer transition-[border-color,color] duration-150 hover:border-muted hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-red border-none rounded px-[1.125rem] py-2 text-[0.8125rem] font-bold uppercase tracking-[0.05em] text-on-red cursor-pointer transition-colors duration-150 hover:bg-red-h active:bg-red-a disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? <><Spinner /> A guardar...</> : isEdit ? 'Guardar Alterações' : 'Criar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Painel "Por Produto" (locais expandíveis) ── */
const ProductStockPanel = ({ stock }) => {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState({})

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return stock.filter(s => !q || s.productName.toLowerCase().includes(q))
  }, [stock, search])

  const toggle = (pid) => setExpanded(prev => ({ ...prev, [pid]: !prev[pid] }))

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Filtrar por produto..."
        className="bg-input border border-border-input rounded px-3 py-[0.5625rem] text-sm text-primary w-full md:w-[320px] transition-[border-color,box-shadow] duration-150 placeholder:text-muted focus:outline-none focus:border-red focus:shadow-[0_0_0_3px_rgba(139,0,0,0.22)]"
      />

      <div className="bg-surface border border-border rounded-md overflow-hidden shadow-card">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[1fr_120px_100px_36px] gap-2 px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted border-b border-border">
          <span>Produto</span>
          <span className="text-right">Quantidade</span>
          <span className="text-right">Unidade</span>
          <span />
        </div>

        {filtered.length === 0 ? (
          <p className="py-10 px-5 text-sm text-muted m-0 text-center">Nenhum produto em stock.</p>
        ) : (
          filtered.map(item => (
            <div key={item.productId}>
              <div
                className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_100px_36px] items-center gap-2 px-5 py-3 border-b border-border last:border-b-0 cursor-pointer transition-colors duration-[120ms] hover:bg-hover"
                onClick={() => toggle(item.productId)}
              >
                <span className="text-[0.8125rem] font-medium text-primary">{item.productName}</span>
                <span className="hidden sm:block text-[0.8125rem] font-bold text-primary text-right">{item.totalQuantity}</span>
                <span className="hidden sm:block text-xs text-secondary text-right">{item.unit}</span>
                {/* Mobile */}
                <span className="sm:hidden text-sm font-bold text-primary text-right">{item.totalQuantity} {item.unit}</span>
                <span className="hidden sm:flex justify-center">
                  <IconChevron open={expanded[item.productId]} />
                </span>
              </div>

              {expanded[item.productId] && (
                <div className="bg-hover/50 border-b border-border">
                  <div className="px-8 py-2">
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-muted mb-2">Locais</p>
                    {item.containers.map(c => (
                      <div key={c.id} className="flex items-center justify-between py-1.5 text-xs">
                        <span className="text-secondary">
                          {ZONE_LABELS[c.zone] || c.zone} — {c.label}
                        </span>
                        <span className="font-medium text-primary">{c.quantity} / {c.capacity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ── AdminProducts ── */
const AdminProducts = () => {
  const [products,  setProducts]  = useState([])
  const [stock,     setStock]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)
  const [filter,    setFilter]    = useState('active')
  const [tab,       setTab]       = useState('lista')   // 'lista' | 'stock'
  const [search,    setSearch]    = useState('')

  const loadAll = useCallback(() => {
    Promise.all([fetchAllProducts(), fetchConsolidatedStock()])
      .then(([prods, stk]) => { setProducts(prods); setStock(stk) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  /* stock por productId para lookup rápido */
  const stockByProduct = useMemo(() => {
    const map = {}
    stock.forEach(s => { map[s.productId] = s })
    return map
  }, [stock])

  const visible = useMemo(() =>
    filter === 'active' ? products.filter(p => p.active !== false) : products,
    [products, filter]
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return visible
    const q = search.toLowerCase()
    return visible.filter(p => p.name.toLowerCase().includes(q))
  }, [visible, search])

  const handleSaved = (saved) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      return idx >= 0
        ? prev.map(p => p.id === saved.id ? saved : p)
        : [saved, ...prev]
    })
    setModal(null)
  }

  const fmtStock = (productId) => {
    const s = stockByProduct[productId]
    if (!s || s.totalQuantity === 0) return { qty: 0, unit: '—' }
    return { qty: s.totalQuantity, unit: s.unit }
  }

  return (
    <div className="p-6 flex flex-col gap-5">

      {/* Topbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-base font-bold text-primary m-0">Produtos</h1>

          {/* Filtros ativo/todos — só visíveis na aba lista */}
          {tab === 'lista' && (
            <div className="flex gap-1.5">
              <button
                className={`flex items-center gap-[0.4rem] px-3 py-[0.35rem] bg-transparent border border-border-input rounded text-xs font-medium text-secondary cursor-pointer transition-[border-color,color,background-color] duration-150 hover:border-muted hover:text-primary ${filter === 'active' ? '!bg-red !border-red !text-on-red' : ''}`}
                onClick={() => setFilter('active')}
              >
                Ativos
                <span className={`inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 rounded-full text-[0.625rem] font-bold ${filter === 'active' ? 'bg-white/20 text-on-red' : 'bg-input text-secondary'}`}>
                  {products.filter(p => p.active !== false).length}
                </span>
              </button>
              <button
                className={`flex items-center gap-[0.4rem] px-3 py-[0.35rem] bg-transparent border border-border-input rounded text-xs font-medium text-secondary cursor-pointer transition-[border-color,color,background-color] duration-150 hover:border-muted hover:text-primary ${filter === 'all' ? '!bg-red !border-red !text-on-red' : ''}`}
                onClick={() => setFilter('all')}
              >
                Todos
                <span className={`inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 rounded-full text-[0.625rem] font-bold ${filter === 'all' ? 'bg-white/20 text-on-red' : 'bg-input text-secondary'}`}>
                  {products.length}
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          <div className="flex border border-border-input rounded overflow-hidden">
            <button
              className={`px-3.5 py-[0.35rem] bg-transparent border-none text-xs font-semibold cursor-pointer transition-[background-color,color] duration-150 ${tab === 'lista' ? 'bg-red text-on-red' : 'text-muted hover:text-primary'}`}
              onClick={() => setTab('lista')}
            >
              Lista
            </button>
            <button
              className={`px-3.5 py-[0.35rem] bg-transparent border-l border-border-input text-xs font-semibold cursor-pointer transition-[background-color,color] duration-150 ${tab === 'stock' ? 'bg-red text-on-red' : 'text-muted hover:text-primary'}`}
              onClick={() => setTab('stock')}
            >
              Por Produto
            </button>
          </div>

          <button
            className="inline-flex items-center gap-2 bg-red border-none rounded px-[1.125rem] py-2 text-[0.8125rem] font-bold uppercase tracking-[0.05em] text-on-red cursor-pointer transition-colors duration-150 hover:bg-red-h active:bg-red-a"
            onClick={() => setModal('new')}
          >
            <IconPlus /> Novo Produto
          </button>
        </div>
      </div>

      {/* ── Aba: Lista ── */}
      {tab === 'lista' && (
        <>
          {/* Barra de pesquisa */}
          <div>
            <input
              type="text"
              className="bg-input border border-border-input rounded px-3 py-[0.5625rem] text-sm text-primary w-full md:w-[320px] transition-[border-color,box-shadow] duration-150 placeholder:text-muted focus:outline-none focus:border-red focus:shadow-[0_0_0_3px_rgba(139,0,0,0.22)]"
              placeholder="Pesquisar produto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Tabela */}
          <div className="bg-surface border border-border rounded-md overflow-hidden shadow-card">
            {/* Header */}
            <div className="grid grid-cols-[52px_1fr_130px_100px_90px] max-md:grid-cols-[1fr_110px_100px_72px] items-center px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted border-b border-border gap-3">
              <span className="max-md:hidden">ID</span>
              <span>Nome</span>
              <span>Stock</span>
              <span>Estado</span>
              <span />
            </div>

            {loading ? (
              <p className="py-10 px-5 text-sm text-muted m-0 text-center">A carregar...</p>
            ) : filtered.length === 0 ? (
              <p className="py-10 px-5 text-sm text-muted m-0 text-center">Nenhum produto encontrado.</p>
            ) : (
              filtered.map(product => {
                const { qty, unit } = fmtStock(product.id)
                return (
                  <div
                    key={product.id}
                    className={`grid grid-cols-[52px_1fr_130px_100px_90px] max-md:grid-cols-[1fr_110px_100px_72px] items-center px-5 py-3.5 gap-3 border-b border-border last:border-b-0 transition-colors duration-100 hover:bg-hover ${product.active === false ? 'opacity-50' : ''}`}
                  >
                    <span className="font-mono text-[0.8125rem] text-muted max-md:hidden">#{product.id}</span>
                    <span className="text-sm font-medium text-primary overflow-hidden text-ellipsis whitespace-nowrap">{product.name}</span>

                    {/* Stock */}
                    <span className="text-[0.8125rem] text-secondary">
                      {qty > 0
                        ? <><span className="font-bold text-primary">{qty}</span> <span className="text-xs">{unit}</span></>
                        : <span className="text-muted">—</span>
                      }
                    </span>

                    {/* Estado */}
                    <span>
                      {product.active !== false
                        ? <span className="inline-block px-2.5 py-[0.2rem] rounded-full border border-ok text-[0.6875rem] font-semibold uppercase tracking-[0.08em] whitespace-nowrap text-ok bg-ok-bg">Ativo</span>
                        : <span className="inline-block px-2.5 py-[0.2rem] rounded-full border border-border-input text-[0.6875rem] font-semibold uppercase tracking-[0.08em] whitespace-nowrap text-muted bg-transparent">Inativo</span>
                      }
                    </span>

                    <span className="flex justify-end">
                      <button
                        className="bg-transparent border border-border-input rounded px-3 py-[0.35rem] text-xs font-semibold text-secondary cursor-pointer transition-[border-color,color] duration-150 hover:border-muted hover:text-primary"
                        onClick={() => setModal(product)}
                      >
                        Editar
                      </button>
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {/* ── Aba: Por Produto ── */}
      {tab === 'stock' && (
        loading
          ? <p className="py-10 text-sm text-muted text-center">A carregar...</p>
          : <ProductStockPanel stock={stock} />
      )}

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