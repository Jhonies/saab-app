import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  fetchAllProducts,
  createProduct,
  updateProduct,
  searchProducts,
} from '../services/inventoryService'

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

const ProductModal = ({ initial, onClose, onSaved }) => {
  const isEdit = !!initial

  const [name,         setName]        = useState(initial?.name         ?? '')
  const [priceType,    setPriceType]   = useState(initial?.priceType    ?? 'PER_LB')
  const [pricePerLb,   setPricePerLb]  = useState(initial?.pricePerLb   ?? '')
  const [pricePerBox,  setPricePerBox] = useState(initial?.pricePerBox  ?? '')
  const [pricePerUnit, setPricePerUnit]= useState(initial?.pricePerUnit ?? '')
  const [active,       setActive]      = useState(initial?.active       ?? true)
  const [saving,       setSaving]      = useState(false)
  const [error,        setError]       = useState('')

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
      priceType,
      pricePerLb: pricePerLb ? parseFloat(pricePerLb) : null,
      pricePerBox: pricePerBox ? parseFloat(pricePerBox) : null,
      pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : null,
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
      <div className="bg-surface border border-border rounded-md shadow-elevated w-full max-w-[520px] flex flex-col max-h-[90vh] overflow-y-auto">
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
            <label className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-secondary" htmlFor="name">Nome do Produto</label>
            <input
              id="name"
              type="text"
              required
              className="bg-input border border-border-input rounded px-3 py-[0.5625rem] text-sm text-primary w-full transition-[border-color,box-shadow] duration-150 placeholder:text-muted focus:outline-none focus:border-red focus:shadow-[0_0_0_3px_rgba(139,0,0,0.22)]"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex: Picanha, Cerveja Heineken 600ml, Carvao 5kg"
            />
          </div>


          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-secondary">Tipo de Preço</label>
            <div className="flex border border-border-input rounded overflow-hidden">
              <button
                type="button"
                className={`flex-1 px-3.5 py-2 bg-transparent border-none text-xs font-semibold cursor-pointer transition-[background-color,color] duration-150 ${priceType === 'PER_LB' ? 'bg-red text-on-red' : 'text-muted hover:text-primary'}`}
                onClick={() => setPriceType('PER_LB')}
              >
                Por Libra (lb)
              </button>
              <button
                type="button"
                className={`flex-1 px-3.5 py-2 bg-transparent border-l border-border-input text-xs font-semibold cursor-pointer transition-[background-color,color] duration-150 ${priceType === 'PER_BOX' ? 'bg-red text-on-red' : 'text-muted hover:text-primary'}`}
                onClick={() => setPriceType('PER_BOX')}
              >
                Por Caixa
              </button>
              <button
                type="button"
                className={`flex-1 px-3.5 py-2 bg-transparent border-l border-border-input text-xs font-semibold cursor-pointer transition-[background-color,color] duration-150 ${priceType === 'PER_UNIT' ? 'bg-red text-on-red' : 'text-muted hover:text-primary'}`}
                onClick={() => setPriceType('PER_UNIT')}
              >
                Por Unidade
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            {(priceType === 'PER_LB' || priceType === 'PER_BOX' || priceType === 'PER_UNIT') && (
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-secondary">
                  Preço {priceType === 'PER_LB' ? 'por lb ($)' : priceType === 'PER_BOX' ? 'por caixa ($)' : 'por unidade ($)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="bg-input border border-border-input rounded px-3 py-[0.5625rem] text-sm text-primary w-full transition-[border-color,box-shadow] duration-150 placeholder:text-muted focus:outline-none focus:border-red focus:shadow-[0_0_0_3px_rgba(139,0,0,0.22)]"
                  value={priceType === 'PER_LB' ? pricePerLb : priceType === 'PER_BOX' ? pricePerBox : pricePerUnit}
                  onChange={e => {
                    const val = e.target.value
                    if (priceType === 'PER_LB') setPricePerLb(val)
                    else if (priceType === 'PER_BOX') setPricePerBox(val)
                    else setPricePerUnit(val)
                  }}
                  placeholder="0.00"
                />
              </div>
            )}
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
                  Activo
                </button>
                <button
                  type="button"
                  className={`px-3.5 py-1.5 bg-transparent border-l border-border-input text-xs font-semibold cursor-pointer transition-[background-color,color] duration-150 ${!active ? 'bg-red-light text-error' : 'text-muted border-none'}`}
                  onClick={() => setActive(false)}
                >
                  Inactivo
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
              {saving ? <><Spinner /> A guardar...</> : isEdit ? 'Guardar Alteracoes' : 'Criar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const AdminProducts = () => {
  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)
  const [filter,    setFilter]    = useState('active')

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const loadProducts = useCallback(() => {
    fetchAllProducts()
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadProducts() }, [loadProducts])

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const timer = setTimeout(() => {
      searchProducts(searchQuery)
        .then(setSearchResults)
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const visible = useMemo(() =>
    filter === 'active' ? products.filter(p => p.active !== false) : products,
    [products, filter]
  )

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return visible
    const q = searchQuery.toLowerCase()
    return visible.filter(p => p.name.toLowerCase().includes(q))
  }, [visible, searchQuery])


  const handleSaved = (saved) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      return idx >= 0
        ? prev.map(p => p.id === saved.id ? saved : p)
        : [saved, ...prev]
    })
    setModal(null)
  }

  const handleSelectProduct = (product) => {
    setSelectedProduct(product)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleAddNew = () => {
    setSelectedProduct(null)
    setModal('new')
  }

  const fmtPrice = (p, type) => {
    if (type === 'PER_LB' && p.pricePerLb) return `$${p.pricePerLb.toFixed(2)}/lb`
    if (type === 'PER_BOX' && p.pricePerBox) return `$${p.pricePerBox.toFixed(2)}/cx`
    if (type === 'PER_UNIT' && p.pricePerUnit) return `$${p.pricePerUnit.toFixed(2)}/un`
    return '—'
  }

  return (
    <div className="p-6 flex flex-col gap-5">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-base font-bold text-primary m-0">Produtos</h1>
          <div className="flex gap-1.5">
            <button
              className={`flex items-center gap-[0.4rem] px-3 py-[0.35rem] bg-transparent border border-border-input rounded text-xs font-medium text-secondary cursor-pointer transition-[border-color,color,background-color] duration-150 hover:border-muted hover:text-primary ${filter === 'active' ? '!bg-red !border-red !text-on-red' : ''}`}
              onClick={() => setFilter('active')}
            >
              Activos
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
        </div>
        <button
          className="inline-flex items-center gap-2 bg-red border-none rounded px-[1.125rem] py-2 text-[0.8125rem] font-bold uppercase tracking-[0.05em] text-on-red cursor-pointer transition-colors duration-150 hover:bg-red-h active:bg-red-a"
          onClick={handleAddNew}
        >
          <IconPlus /> Novo Produto
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative">
          <input
            type="text"
            className="bg-input border border-border-input rounded px-3 py-[0.5625rem] text-sm text-primary w-full md:w-[320px] transition-[border-color,box-shadow] duration-150 placeholder:text-muted focus:outline-none focus:border-red focus:shadow-[0_0_0_3px_rgba(139,0,0,0.22)]"
            placeholder="Pesquisar produto..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Spinner />
            </div>
          )}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-elevated max-h-[280px] overflow-y-auto z-50">
              {searchResults.map(p => (
                <button
                  key={p.id}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover border-b border-border last:border-b-0 transition-colors duration-150"
                  onClick={() => handleSelectProduct(p)}
                >
                  <span className="font-medium text-primary">{p.name}</span>
                </button>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-elevated p-3 z-50">
              <p className="text-sm text-muted m-0">Nenhum produto encontrado.</p>
            </div>
          )}
        </div>

        {selectedProduct && (
          <div className="flex items-center gap-3 p-3 bg-hover border border-border rounded-md">
            <div className="flex-1">
              <span className="text-sm font-semibold text-primary">{selectedProduct.name}</span>
            </div>
            <span className="text-xs font-medium text-secondary px-2 py-1 bg-surface rounded border border-border">
              {fmtPrice(selectedProduct, selectedProduct.priceType)}
            </span>
            <button
              className="bg-transparent border border-border-input rounded px-3 py-1 text-xs font-semibold text-secondary cursor-pointer transition-[border-color,color] duration-150 hover:border-muted hover:text-primary"
              onClick={() => setModal(selectedProduct)}
            >
              Editar
            </button>
            <button
              className="bg-transparent border-none text-muted cursor-pointer p-1 transition-colors duration-150 hover:text-error"
              onClick={() => setSelectedProduct(null)}
            >
              <IconClose />
            </button>
          </div>
        )}
      </div>


      <div className="bg-surface border border-border rounded-md overflow-hidden shadow-card">
        <div className="grid grid-cols-[52px_1fr_110px_100px_90px] md:grid-cols-[52px_1fr_110px_100px_90px] max-md:grid-cols-[1fr_100px_90px] items-center px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted border-b border-border gap-3">
          <span className="max-md:hidden">ID</span>
          <span>Nome</span>
          <span className="max-md:hidden">Preço</span>
          <span>Estado</span>
          <span />
        </div>

        {loading ? (
          <p className="py-10 px-5 text-sm text-muted m-0 text-center">A carregar...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="py-10 px-5 text-sm text-muted m-0 text-center">Nenhum produto encontrado.</p>
        ) : (
          filteredProducts.map(product => (
            <div
              key={product.id}
              className={`grid grid-cols-[52px_1fr_110px_100px_90px] max-md:grid-cols-[1fr_100px_90px] items-center px-5 py-3.5 gap-3 border-b border-border last:border-b-0 transition-colors duration-100 hover:bg-hover ${product.active === false ? 'opacity-50' : ''}`}
            >
              <span className="font-mono text-[0.8125rem] text-muted max-md:hidden">#{product.id}</span>
              <span className="text-sm font-medium text-primary overflow-hidden text-ellipsis whitespace-nowrap">{product.name}</span>
              <span className="text-[0.8125rem] text-secondary max-md:hidden">{fmtPrice(product, product.priceType)}</span>
              <span>
                {product.active !== false
                  ? <span className="inline-block px-2.5 py-[0.2rem] rounded-full border border-ok text-[0.6875rem] font-semibold uppercase tracking-[0.08em] whitespace-nowrap text-ok bg-ok-bg">Activo</span>
                  : <span className="inline-block px-2.5 py-[0.2rem] rounded-full border border-border-input text-[0.6875rem] font-semibold uppercase tracking-[0.08em] whitespace-nowrap text-muted bg-transparent">Inactivo</span>
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