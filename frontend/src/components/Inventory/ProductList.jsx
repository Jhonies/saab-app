import { useState, useEffect, useMemo } from 'react'
import { fetchAllProducts, updateProduct, createProduct } from '../../services/inventoryService'

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
    <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-[1000] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border rounded-md w-full max-w-[400px] shadow-elevated">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold text-primary m-0">Novo Produto</h2>
          <button className="bg-transparent border-none text-muted cursor-pointer p-1 flex hover:text-primary transition-colors duration-150" onClick={onClose}><IconClose /></button>
        </div>

        <form className="p-5 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-secondary" htmlFor="name">Nome do Produto</label>
            <input
              id="name"
              type="text"
              required
              className="bg-input border border-border-input rounded text-sm text-primary px-3 py-2.5 transition-all duration-150 focus:outline-none focus:border-red focus:ring-[3px] focus:ring-red/20"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex: Picanha, Cerveja Heineken 600ml"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-secondary" htmlFor="type">Categoria</label>
            <input
              id="type"
              type="text"
              required
              className="bg-input border border-border-input rounded text-sm text-primary px-3 py-2.5 transition-all duration-150 focus:outline-none focus:border-red focus:ring-[3px] focus:ring-red/20"
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
            </datalist>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-secondary" htmlFor="price">Preco por Caixa ($)</label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              className="bg-input border border-border-input rounded text-sm text-primary px-3 py-2.5 transition-all duration-150 focus:outline-none focus:border-red focus:ring-[3px] focus:ring-red/20"
              value={pricePerBox}
              onChange={e => setPricePerBox(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {error && <p className="text-[0.8125rem] text-error m-0 p-2 bg-error-bg rounded">{error}</p>}

          <div className="flex gap-3 mt-2">
            <button type="button" className="flex-1 bg-transparent border border-border-input rounded px-4 py-2.5 text-[0.8125rem] font-medium text-secondary cursor-pointer transition-all duration-150 hover:border-secondary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="flex-1 bg-red hover:bg-red-h border-none rounded px-4 py-2.5 text-[0.8125rem] font-semibold text-on-red cursor-pointer transition-colors duration-150 disabled:bg-red-a disabled:cursor-not-allowed" disabled={saving}>
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
    <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-[1000] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border rounded-md w-full max-w-[400px] shadow-elevated">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold text-primary m-0">Editar Produto</h2>
          <button className="bg-transparent border-none text-muted cursor-pointer p-1 flex hover:text-primary transition-colors duration-150" onClick={onClose}><IconClose /></button>
        </div>

        <form className="p-5 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-secondary" htmlFor="name">Nome do Produto</label>
            <input
              id="name"
              type="text"
              required
              className="bg-input border border-border-input rounded text-sm text-primary px-3 py-2.5 transition-all duration-150 focus:outline-none focus:border-red focus:ring-[3px] focus:ring-red/20"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-secondary" htmlFor="type">Categoria</label>
            <input
              id="type"
              type="text"
              required
              className="bg-input border border-border-input rounded text-sm text-primary px-3 py-2.5 transition-all duration-150 focus:outline-none focus:border-red focus:ring-[3px] focus:ring-red/20"
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
            </datalist>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-secondary" htmlFor="price">Preco por Caixa ($)</label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              className="bg-input border border-border-input rounded text-sm text-primary px-3 py-2.5 transition-all duration-150 focus:outline-none focus:border-red focus:ring-[3px] focus:ring-red/20"
              value={pricePerBox}
              onChange={e => setPricePerBox(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-secondary">Estado (override manual)</label>
            <div className="flex gap-1">
              <button
                type="button"
                className={`flex-1 border rounded py-2 text-[0.8125rem] font-medium cursor-pointer transition-all duration-150 ${active ? 'bg-ok border-ok text-white' : 'bg-transparent border-border-input text-muted hover:border-secondary'}`}
                onClick={() => setActive(true)}
              >
                Em Estoque
              </button>
              <button
                type="button"
                className={`flex-1 border rounded py-2 text-[0.8125rem] font-medium cursor-pointer transition-all duration-150 ${!active ? 'bg-warn border-warn text-white' : 'bg-transparent border-border-input text-muted hover:border-secondary'}`}
                onClick={() => setActive(false)}
              >
                Sem Estoque
              </button>
            </div>
          </div>

          {error && <p className="text-[0.8125rem] text-error m-0 p-2 bg-error-bg rounded">{error}</p>}

          <div className="flex gap-3 mt-2">
            <button type="button" className="flex-1 bg-transparent border border-border-input rounded px-4 py-2.5 text-[0.8125rem] font-medium text-secondary cursor-pointer transition-all duration-150 hover:border-secondary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="flex-1 bg-red hover:bg-red-h border-none rounded px-4 py-2.5 text-[0.8125rem] font-semibold text-on-red cursor-pointer transition-colors duration-150 disabled:bg-red-a disabled:cursor-not-allowed" disabled={saving}>
              {saving ? 'A guardar...' : 'Guardar Alteracoes'}
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
            location = zone || ''
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
    return <p className="p-8 text-center text-muted text-sm">A carregar produtos...</p>
  }

  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-secondary m-0">Produtos</h2>
        <button className="flex items-center gap-1.5 bg-red hover:bg-red-h border-none rounded px-3.5 py-2 text-[0.8125rem] font-semibold text-white cursor-pointer transition-colors duration-150" onClick={() => setCreating(true)}>
          <IconPlus /> Novo Produto
        </button>
      </div>

      <div className="flex flex-col">
        {/* Desktop header */}
        <div className="hidden md:grid grid-cols-[1.5fr_0.8fr_1.5fr_0.6fr_0.8fr_0.8fr_0.6fr] gap-4 px-5 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted border-b border-border bg-input">
          <span>Produto</span>
          <span>Categoria</span>
          <span>Local</span>
          <span className="text-right">Qtd</span>
          <span className="text-right">Preco / cx</span>
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
            <div
              key={product.id}
              className={`flex flex-col gap-2 items-start md:grid md:grid-cols-[1.5fr_0.8fr_1.5fr_0.6fr_0.8fr_0.8fr_0.6fr] md:gap-4 md:items-center px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-hover transition-colors duration-100 ${!inStock ? 'opacity-60' : ''}`}
            >
              <span className="text-sm font-medium text-primary whitespace-nowrap overflow-hidden text-ellipsis">{product.name}</span>
              <span className="text-[0.8125rem] text-secondary">{product.type}</span>
              <span className="text-xs text-secondary flex flex-wrap gap-1">
                {locations.length > 0
                  ? locations.map((loc, i) => <span key={i} className="bg-input px-1.5 py-0.5 rounded-sm text-[0.6875rem]">{loc}</span>)
                  : '—'
                }
              </span>
              <span className="text-[0.8125rem] font-semibold text-primary text-left md:text-right">
                {qty} cxs
              </span>
              <span className="text-[0.8125rem] text-ok text-left md:text-right font-medium">
                $ {Number(product.pricePerBox).toFixed(2)}
              </span>
              <span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold uppercase tracking-[0.05em] ${inStock ? 'bg-ok text-white' : 'bg-warn text-white'}`}>
                  {inStock ? 'Em Estoque' : 'Sem Estoque'}
                </span>
              </span>
              <span className="flex justify-start md:justify-end w-full md:w-auto mt-2 md:mt-0">
                <button className="flex items-center gap-1.5 bg-transparent border border-border-input rounded px-2.5 py-1.5 text-xs text-secondary cursor-pointer transition-all duration-150 hover:border-secondary hover:text-primary" onClick={() => setSelected(product)}>
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
