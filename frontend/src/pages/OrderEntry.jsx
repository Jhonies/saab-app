import { useState, useEffect, useMemo, useRef } from 'react'
import { fetchProducts, fetchProductStock } from '../services/inventoryService'
import { createOrder } from '../services/orderService'
import { fetchClients, createClient } from '../services/clientService'

const fmt = (n) =>
  Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const Spinner = () => (
  <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
    <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
  </svg>
)

const IconTrash = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ width: '0.875rem', height: '0.875rem' }}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166
         m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084
         a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0
         a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165
         m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201
         a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916
         m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
)

const IconClose = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const OrderEntry = () => {
  const [products,   setProducts]   = useState([])
  const [clients,    setClients]    = useState([])
  const [loading,    setLoading]    = useState(true)

  /* ── Loja (searchable + auto-create) ── */
  const [clientQuery,      setClientQuery]      = useState('')
  const [selectedClient,   setSelectedClient]   = useState(null)
  const [showClientDrop,   setShowClientDrop]   = useState(false)
  const [clientHighlight,  setClientHighlight]  = useState(-1)

  /* ── Produto search (local) ── */
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const dropdownRef = useRef(null)

  const [quantity,   setQuantity]   = useState('')
  const [priceType,  setPriceType]  = useState('PER_LB')
  const [price,      setPrice]      = useState('')

  const [stock,      setStock]      = useState(null)
  const [stockLoading, setStockLoading] = useState(false)

  const [cart,       setCart]       = useState([])

  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  const qtyRef = useRef(null)

  useEffect(() => {
    Promise.all([fetchProducts(), fetchClients()])
      .then(([prods, cls]) => { setProducts(prods); setClients(cls) })
      .catch(() => setError('Erro ao carregar dados.'))
      .finally(() => setLoading(false))
  }, [])

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase()
    if (q.length < 1) return clients
    return clients.filter(c => c.name?.toLowerCase().includes(q))
  }, [clientQuery, clients])

  const isNewClient = useMemo(() => {
    if (!clientQuery.trim()) return false
    if (selectedClient) return false
    return !clients.some(c => c.name.toLowerCase() === clientQuery.trim().toLowerCase())
  }, [clientQuery, selectedClient, clients])

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (q.length < 1) return []
    return products
      .filter(p => p.name?.toLowerCase().includes(q) || p.type?.toLowerCase().includes(q))
      .slice(0, 20)
  }, [searchQuery, products])

  useEffect(() => {
    if (!selectedProduct) { setStock(null); return }
    setStockLoading(true)
    fetchProductStock(selectedProduct.id)
      .then(setStock)
      .catch(() => setStock(null))
      .finally(() => setStockLoading(false))
  }, [selectedProduct])

  const effectiveStock = useMemo(() => {
    if (!stock) return 0
    const cartQty = cart
      .filter(item => item.productId === selectedProduct?.id)
      .reduce((s, item) => s + item.quantity, 0)
    return stock.totalBoxes - cartQty
  }, [stock, cart, selectedProduct])

  const qty       = Number(quantity)
  const qtyValid  = Number.isInteger(qty) && qty > 0 && qty <= effectiveStock
  const priceNum  = parseFloat(price)
  const priceValid = !isNaN(priceNum) && priceNum > 0
  const canAdd    = selectedProduct && qtyValid && priceValid

  const cartTotals = useMemo(() => ({
    boxes: cart.reduce((s, i) => s + i.quantity, 0),
    items: cart.length,
  }), [cart])

  const clientName = selectedClient ? selectedClient.name : clientQuery.trim()
  const canSubmit = clientName && cart.length > 0 && !submitting

  const handleSelectProduct = (product) => {
    setSelectedProduct(product)
    setSearchQuery('')
    setShowDropdown(false)
    setHighlightIdx(-1)
    setQuantity('')
    setPrice('')
    setPriceType(product.priceType || 'PER_LB')
    if (product.priceType === 'PER_LB' && product.pricePerLb) setPrice(product.pricePerLb.toString())
    else if (product.priceType === 'PER_BOX' && product.pricePerBox) setPrice(product.pricePerBox.toString())
    else if (product.priceType === 'PER_UNIT' && product.pricePerUnit) setPrice(product.pricePerUnit.toString())
    setTimeout(() => qtyRef.current?.focus(), 50)
  }

  const handleProductKeyDown = (e) => {
    if (!showDropdown || filteredProducts.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx(prev => Math.min(prev + 1, filteredProducts.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault()
      handleSelectProduct(filteredProducts[highlightIdx])
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      setHighlightIdx(-1)
    }
  }

  const handleAddItem = () => {
    if (!canAdd) return
    setError('')
    setSuccess('')

    setCart(prev => [...prev, {
      productId:   selectedProduct.id,
      quantity:    qty,
      priceType,
      pricePerLb:  priceType === 'PER_LB'  ? priceNum : null,
      pricePerBox: priceType === 'PER_BOX' ? priceNum : null,
      pricePerUnit: priceType === 'PER_UNIT' ? priceNum : null,
      productName: selectedProduct.name,
      productType: selectedProduct.type,
    }])

    setSelectedProduct(null)
    setQuantity('')
    setPrice('')
    setSearchQuery('')
    setShowDropdown(false)
  }

  /* ── Loja selection ── */
  const handleSelectClient = (client) => {
    setSelectedClient(client)
    setClientQuery(client.name)
    setShowClientDrop(false)
    setClientHighlight(-1)
  }

  const handleClientKeyDown = (e) => {
    if (!showClientDrop) return
    const list = filteredClients
    if (list.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setClientHighlight(prev => Math.min(prev + 1, list.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setClientHighlight(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && clientHighlight >= 0) {
      e.preventDefault()
      handleSelectClient(list[clientHighlight])
    } else if (e.key === 'Escape') {
      setShowClientDrop(false)
      setClientHighlight(-1)
    }
  }

  const handleRemoveItem = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!canSubmit) return

    setSubmitting(true)
    try {
      let resolvedClientId = selectedClient?.id || null

      if (!resolvedClientId && isNewClient) {
        const newClient = await createClient({ name: clientName })
        setClients(prev => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)))
        resolvedClientId = newClient.id
      }

      const order = await createOrder({
        clientId: resolvedClientId || undefined,
        clientName,
        items: cart.map(({ productId, quantity, priceType, pricePerLb, pricePerBox, pricePerUnit }) => ({
          productId, quantity, priceType, pricePerLb, pricePerBox, pricePerUnit,
        })),
      })

      setSuccess(`Pedido #${order.id} criado com sucesso (${cart.length} ${cart.length === 1 ? 'item' : 'itens'}) — Status: PENDENTE`)
      setCart([])
      setClientQuery('')
      setSelectedClient(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar pedido.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6">

      <div className="flex flex-col gap-5 md:flex-row md:items-start">

        <div className="bg-surface border border-border rounded-[6px] p-6 flex-1 flex flex-col gap-0">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted m-0 mb-5">Adicionar Produto</p>

          <div className="flex flex-col gap-[1.125rem]">

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-secondary">Loja / Cliente</label>
              <div className="relative">
                <input
                  type="text"
                  className="bg-input border border-border-input rounded text-sm text-primary outline-none w-full py-[0.7rem] px-[0.875rem] transition-[border-color,box-shadow] duration-[180ms] focus:border-red focus:ring-2 focus:ring-red/20 placeholder:text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  placeholder="Digite o nome da loja…"
                  value={clientQuery}
                  onChange={e => { setClientQuery(e.target.value); setSelectedClient(null); setShowClientDrop(true); setClientHighlight(-1) }}
                  onKeyDown={handleClientKeyDown}
                  onFocus={() => setShowClientDrop(true)}
                  onBlur={() => setTimeout(() => setShowClientDrop(false), 200)}
                  disabled={loading}
                />
                {showClientDrop && clientQuery.trim().length >= 1 && filteredClients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-elevated max-h-[220px] overflow-y-auto z-50">
                    {filteredClients.map((c, idx) => (
                      <div
                        key={c.id}
                        className={`w-full px-4 py-2.5 text-left text-sm border-b border-border last:border-b-0 flex flex-col cursor-pointer ${idx === clientHighlight ? 'bg-hover' : 'hover:bg-hover'}`}
                        onMouseDown={e => { e.preventDefault(); handleSelectClient(c) }}
                        onMouseEnter={() => setClientHighlight(idx)}
                      >
                        <span className="font-medium text-primary">{c.name}</span>
                        {c.address && (
                          <span className="text-xs text-muted truncate">{c.address}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedClient?.address && (
                <p className="text-xs text-secondary m-0">
                  Endereço: {selectedClient.address}
                </p>
              )}
              {isNewClient && (
                <p className="text-xs text-warn m-0">
                  Nova loja — será criada automaticamente ao confirmar o pedido
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-secondary">Produto</label>
              <div className="relative">
                <input
                  type="text"
                  className="bg-input border border-border-input rounded text-sm text-primary outline-none w-full py-[0.7rem] px-[0.875rem] transition-[border-color,box-shadow] duration-[180ms] focus:border-red focus:ring-2 focus:ring-red/20 placeholder:text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  placeholder="Pesquisar produto por nome ou categoria..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); setHighlightIdx(-1) }}
                  onKeyDown={handleProductKeyDown}
                  onFocus={() => { if (searchQuery.trim().length >= 1) setShowDropdown(true) }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  disabled={loading}
                />
                {showDropdown && searchQuery.trim().length >= 1 && filteredProducts.length > 0 && (
                  <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-elevated max-h-[280px] overflow-y-auto z-50">
                    {filteredProducts.map((p, idx) => (
                      <div
                        key={p.id}
                        className={`w-full px-4 py-2.5 text-left text-sm border-b border-border last:border-b-0 flex items-center justify-between cursor-pointer ${idx === highlightIdx ? 'bg-hover' : 'hover:bg-hover'}`}
                        onMouseDown={e => { e.preventDefault(); handleSelectProduct(p) }}
                        onMouseEnter={() => setHighlightIdx(idx)}
                      >
                        <div>
                          <span className="font-medium text-primary">{p.name}</span>
                          <span className="text-muted ml-2 text-xs">({p.type})</span>
                        </div>
                        {p.pricePerLb != null && (
                          <span className="text-xs text-secondary ml-3 shrink-0">{fmt(p.pricePerLb)}/lb</span>
                        )}
                        {p.pricePerBox != null && !p.pricePerLb && (
                          <span className="text-xs text-secondary ml-3 shrink-0">{fmt(p.pricePerBox)}/cx</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {showDropdown && searchQuery.trim().length >= 1 && filteredProducts.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-elevated p-3 z-50">
                    <p className="text-sm text-muted m-0">Nenhum produto encontrado.</p>
                  </div>
                )}
              </div>

              {selectedProduct && (
                <div className="flex items-center gap-2 p-2.5 bg-hover border border-border rounded-md">
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-primary">{selectedProduct.name}</span>
                    <span className="text-xs text-muted ml-2">({selectedProduct.type})</span>
                  </div>
                  <button
                    className="bg-transparent border-none text-muted cursor-pointer p-1 transition-colors duration-150 hover:text-error"
                    onClick={() => { setSelectedProduct(null); setSearchQuery(''); setShowDropdown(false) }}
                  >
                    <IconClose />
                  </button>
                </div>
              )}

              {selectedProduct && !stockLoading && stock && (
                <p className={`text-xs m-0 py-1.5 px-2.5 rounded bg-hover border border-border ${effectiveStock === 0 ? 'text-error' : effectiveStock <= 20 ? 'text-warn' : 'text-ok'}`}>
                  Stock disponível: {effectiveStock} cxs
                  {effectiveStock <= 20 && effectiveStock > 0 ? ' — Stock baixo' : ''}
                </p>
              )}
              {stockLoading && (
                <p className="text-xs m-0 py-1.5 px-2.5 rounded bg-hover border border-border">A verificar stock...</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-secondary">Quantidade (caixas)</label>
              <input
                ref={qtyRef}
                className="bg-input border border-border-input rounded text-sm text-primary outline-none w-full py-[0.7rem] px-[0.875rem] appearance-none transition-[border-color,box-shadow] duration-[180ms] focus:border-red focus:ring-2 focus:ring-red/20 placeholder:text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                type="number"
                min="1"
                max={effectiveStock || undefined}
                step="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder={effectiveStock ? `Máx. ${effectiveStock}` : '—'}
                disabled={!selectedProduct || loading}
              />
            </div>

            <div className="flex gap-3 [&>*]:flex-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-secondary">Tipo de Preço</label>
                <select
                  className="bg-input border border-border-input rounded text-sm text-primary outline-none w-full py-[0.7rem] px-[0.875rem] appearance-none transition-[border-color,box-shadow] duration-[180ms] focus:border-red focus:ring-2 focus:ring-red/20"
                  value={priceType}
                  onChange={e => setPriceType(e.target.value)}
                >
                  <option value="PER_LB">Por Libra (lb)</option>
                  <option value="PER_BOX">Por Caixa</option>
                  <option value="PER_UNIT">Por Unidade</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-secondary">
                  {priceType === 'PER_LB' ? 'Preço/lb ($)' : priceType === 'PER_BOX' ? 'Preço/cx ($)' : 'Preço/un ($)'}
                </label>
                <input
                  className="bg-input border border-border-input rounded text-sm text-primary outline-none w-full py-[0.7rem] px-[0.875rem] appearance-none transition-[border-color,box-shadow] duration-[180ms] focus:border-red focus:ring-2 focus:ring-red/20 placeholder:text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
            </div>

            {quantity && !qtyValid && selectedProduct && (
              <p className="text-[0.8125rem] py-3 px-4 rounded m-0 leading-[1.45] bg-error-bg border border-red/45 text-error">
                {qty <= 0
                  ? 'A quantidade deve ser maior que zero.'
                  : `Stock insuficiente. Máximo disponível: ${effectiveStock} cxs.`}
              </p>
            )}

            <button
              type="button"
              className="w-full bg-transparent border-2 border-dashed border-border-input rounded py-3 px-4 text-[0.8125rem] font-bold uppercase tracking-[0.05em] text-secondary cursor-pointer transition-[border-color,color] duration-[180ms] hover:enabled:border-red hover:enabled:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={handleAddItem}
              disabled={!canAdd}
            >
              + Adicionar ao Pedido
            </button>
          </div>

          {cart.length > 0 && (
            <div className="mt-5 pt-5 border-t border-border flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted m-0">
                Itens no Pedido ({cart.length})
              </p>
              <div className="flex flex-col gap-2">
                {cart.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 bg-hover border border-border rounded py-2.5 px-3.5">
                    <div className="flex flex-col gap-[0.15rem] min-w-0">
                      <span className="text-[0.8125rem] font-semibold text-primary whitespace-nowrap overflow-hidden text-ellipsis">{item.productName}</span>
                      <span className="text-[0.6875rem] text-secondary">
                        {item.quantity} cxs · {item.priceType === 'PER_LB'
                          ? `${fmt(item.pricePerLb)}/lb`
                          : item.priceType === 'PER_BOX'
                          ? `${fmt(item.pricePerBox)}/cx`
                          : `${fmt(item.pricePerUnit)}/un`}
                      </span>
                    </div>
                    <button
                      className="bg-transparent border-none text-muted cursor-pointer p-1.5 rounded flex shrink-0 transition-[color,background-color] duration-150 hover:text-error hover:bg-error-bg"
                      onClick={() => handleRemoveItem(i)}
                      aria-label="Remover item"
                    >
                      <IconTrash />
                    </button>
                  </div>
                ))}
              </div>

              {error   && <p className="text-[0.8125rem] py-3 px-4 rounded m-0 leading-[1.45] bg-error-bg border border-red/45 text-error">{error}</p>}
              {success && <p className="text-[0.8125rem] py-3 px-4 rounded m-0 leading-[1.45] bg-ok-bg border border-ok/35 text-ok">{success}</p>}

              <button
                className="mt-2 w-full bg-red hover:bg-red-h active:bg-red-a text-on-red font-bold uppercase border-none rounded py-[0.8125rem] px-4 text-sm tracking-[0.05em] cursor-pointer transition-colors duration-[180ms] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {submitting ? <><Spinner /> A processar…</> : `Confirmar Pedido (${cart.length} ${cart.length === 1 ? 'item' : 'itens'})`}
              </button>
            </div>
          )}

          {cart.length === 0 && error && <p className="text-[0.8125rem] py-3 px-4 rounded m-0 leading-[1.45] bg-error-bg border border-red/45 text-error">{error}</p>}
          {cart.length === 0 && success && <p className="text-[0.8125rem] py-3 px-4 rounded m-0 leading-[1.45] bg-ok-bg border border-ok/35 text-ok">{success}</p>}
        </div>

        <div className="bg-surface border border-border rounded-[6px] p-6 w-full md:w-[280px] md:shrink-0">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted m-0 mb-5">Resumo</p>

          <div className="flex justify-between items-baseline py-2 border-b border-border text-[0.8125rem] text-secondary [&>span:last-child]:text-primary [&>span:last-child]:font-semibold">
            <span>Loja / Cliente</span>
            <span>{clientName || '—'}</span>
          </div>

          <div className="flex justify-between items-baseline py-2 border-b border-border text-[0.8125rem] text-secondary [&>span:last-child]:text-primary [&>span:last-child]:font-semibold">
            <span>Itens</span>
            <span>{cart.length > 0 ? cart.length : '—'}</span>
          </div>

          {cart.map((item, i) => (
            <div key={i} className="flex justify-between items-baseline py-2 border-b border-border text-[0.8125rem] text-secondary last:border-b-0 [&>span:last-child]:text-primary [&>span:last-child]:font-semibold">
              <span className="text-xs max-w-[120px] whitespace-nowrap overflow-hidden text-ellipsis">{item.productName}</span>
              <span>{item.quantity} cxs</span>
            </div>
          ))}

          <div className="mt-4 pt-4 border-t border-border flex justify-between items-baseline text-sm font-bold text-primary [&>span:last-child]:text-lg [&>span:last-child]:text-primary">
            <span>Total caixas</span>
            <span>{cartTotals.boxes > 0 ? `${cartTotals.boxes} cxs` : '—'}</span>
          </div>
        </div>

      </div>

    </div>
  )
}

export default OrderEntry