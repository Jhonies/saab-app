import { useState, useEffect, useMemo } from 'react'
import { fetchProducts, fetchProductStock } from '../services/inventoryService'
import { fetchClients, createOrder } from '../services/orderService'
import { useAuth } from '../context/AuthContext'
import ClientPanel from '../components/Orders/ClientPanel'
import styles from './OrderEntry.module.css'

/* ── Helpers ── */
const CATEGORIES = [
  'Bovino', 'Suíno', 'Aves', 'Miúdos', 'Laticínios',
  'Congelados', 'Secos', 'Bebidas', 'Outros',
]

const fmt = (n) =>
  Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const Spinner = () => (
  <svg className={styles.spinner} fill="none" viewBox="0 0 24 24">
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

/* ── OrderEntry ── */
const OrderEntry = () => {
  const { user }     = useAuth()
  const isClient     = user?.role === 'CLIENTE'

  const [clients,    setClients]    = useState([])
  const [products,   setProducts]   = useState([])
  const [loading,    setLoading]    = useState(true)

  const [clientId,   setClientId]   = useState('')
  const [productId,  setProductId]  = useState('')
  const [quantity,   setQuantity]   = useState('')
  const [priceType,  setPriceType]  = useState('PER_LB')
  const [price,      setPrice]      = useState('')

  // Stock info for selected product
  const [stock,      setStock]      = useState(null)
  const [stockLoading, setStockLoading] = useState(false)

  // Cart
  const [cart,       setCart]       = useState([])

  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  useEffect(() => {
    if (isClient) {
      setClientId(String(user.id))
      fetchProducts()
        .then(setProducts)
        .catch(() => setError('Erro ao carregar dados.'))
        .finally(() => setLoading(false))
    } else {
      Promise.all([fetchClients(), fetchProducts()])
        .then(([cls, prods]) => { setClients(cls); setProducts(prods) })
        .catch(() => setError('Erro ao carregar dados.'))
        .finally(() => setLoading(false))
    }
  }, [isClient, user?.id])

  // Fetch stock when product changes
  useEffect(() => {
    if (!productId) { setStock(null); return }
    setStockLoading(true)
    fetchProductStock(productId)
      .then(setStock)
      .catch(() => setStock(null))
      .finally(() => setStockLoading(false))
  }, [productId])

  // Available stock considering cart
  const effectiveStock = useMemo(() => {
    if (!stock) return 0
    const cartQty = cart
      .filter(item => item.productId === Number(productId))
      .reduce((s, item) => s + item.quantity, 0)
    return stock.totalBoxes - cartQty
  }, [stock, cart, productId])

  const selectedProduct = useMemo(
    () => products.find(p => p.id === Number(productId)) || null,
    [products, productId]
  )

  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped = {}
    for (const cat of CATEGORIES) {
      const prods = products.filter(p => p.type === cat && p.active !== false)
      if (prods.length > 0) grouped[cat] = prods
    }
    // 'Outros' catch-all
    const knownTypes = new Set(CATEGORIES)
    const other = products.filter(p => !knownTypes.has(p.type) && p.active !== false)
    if (other.length > 0) {
      grouped['Outros'] = [...(grouped['Outros'] || []), ...other]
    }
    return grouped
  }, [products])

  const qty       = Number(quantity)
  const qtyValid  = Number.isInteger(qty) && qty > 0 && qty <= effectiveStock
  const priceNum  = parseFloat(price)
  const priceValid = !isNaN(priceNum) && priceNum > 0
  const canAdd    = productId && qtyValid && priceValid

  // Cart totals
  const cartTotals = useMemo(() => ({
    boxes: cart.reduce((s, i) => s + i.quantity, 0),
    items: cart.length,
  }), [cart])

  const canSubmit = clientId && cart.length > 0 && !submitting

  const handleAddItem = () => {
    if (!canAdd) return
    setError('')
    setSuccess('')

    const product = products.find(p => p.id === Number(productId))
    setCart(prev => [...prev, {
      productId:   Number(productId),
      quantity:    qty,
      priceType,
      pricePerLb:  priceType === 'PER_LB'  ? priceNum : null,
      pricePerBox: priceType === 'PER_BOX' ? priceNum : null,
      // Display data
      productName: product.name,
      productType: product.type,
    }])

    setProductId('')
    setQuantity('')
    setPrice('')
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
      const order = await createOrder({
        clientId: Number(clientId),
        items: cart.map(({ productId, quantity, priceType, pricePerLb, pricePerBox }) => ({
          productId, quantity, priceType, pricePerLb, pricePerBox,
        })),
      })

      setSuccess(`Pedido #${order.id} criado com sucesso (${cart.length} ${cart.length === 1 ? 'item' : 'itens'}) — Status: PENDENTE`)
      setCart([])
      setProductId('')
      setQuantity('')
      setPrice('')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar pedido.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <h1 className={styles.title}>Novo Pedido</h1>
      </div>

      <div className={styles.body}>

        {/* ── Form card ── */}
        <div className={`${styles.card} ${styles.form}`}>
          <p className={styles.cardTitle}>Adicionar Produto</p>

          <div className={styles.formFields}>

            {/* Cliente (visível para ADMIN e VENDEDOR) */}
            {!isClient && (
              <div className={styles.field}>
                <label className={styles.label}>Restaurante</label>
                <select
                  className={styles.select}
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Selecione um restaurante…</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.email}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Produto */}
            <div className={styles.field}>
              <label className={styles.label}>Produto</label>
              <select
                className={styles.select}
                value={productId}
                onChange={e => { setProductId(e.target.value); setQuantity('') }}
                disabled={loading}
              >
                <option value="">Selecione um produto…</option>
                {Object.entries(productsByCategory).map(([cat, prods]) => (
                  <optgroup key={cat} label={cat}>
                    {prods.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {productId && !stockLoading && stock && (
                <p className={`${styles.stockHint} ${effectiveStock === 0 ? styles.danger : effectiveStock <= 20 ? styles.warning : styles.ok}`}>
                  Stock disponível: {effectiveStock} cxs
                  {effectiveStock <= 20 && effectiveStock > 0 ? ' — Stock baixo' : ''}
                </p>
              )}
              {stockLoading && (
                <p className={styles.stockHint}>A verificar stock...</p>
              )}
            </div>

            {/* Quantidade */}
            <div className={styles.field}>
              <label className={styles.label}>Quantidade (caixas)</label>
              <input
                className={styles.input}
                type="number"
                min="1"
                max={effectiveStock || undefined}
                step="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder={effectiveStock ? `Máx. ${effectiveStock}` : '—'}
                disabled={!productId || loading}
              />
            </div>

            {/* Tipo de preço + Preço */}
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Tipo de Preço</label>
                <select
                  className={styles.select}
                  value={priceType}
                  onChange={e => setPriceType(e.target.value)}
                >
                  <option value="PER_LB">Por Libra (lb)</option>
                  <option value="PER_BOX">Por Caixa</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  {priceType === 'PER_LB' ? 'Preço/lb ($)' : 'Preço/cx ($)'}
                </label>
                <input
                  className={styles.input}
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

            {quantity && !qtyValid && productId && (
              <p className={`${styles.banner} ${styles.error}`}>
                {qty <= 0
                  ? 'A quantidade deve ser maior que zero.'
                  : `Stock insuficiente. Máximo disponível: ${effectiveStock} cxs.`}
              </p>
            )}

            <button
              type="button"
              className={styles.addBtn}
              onClick={handleAddItem}
              disabled={!canAdd}
            >
              + Adicionar ao Pedido
            </button>
          </div>

          {/* ── Cart ── */}
          {cart.length > 0 && (
            <div className={styles.cartSection}>
              <p className={styles.cardTitle}>
                Itens no Pedido ({cart.length})
              </p>
              <div className={styles.cartList}>
                {cart.map((item, i) => (
                  <div key={i} className={styles.cartItem}>
                    <div className={styles.cartItemInfo}>
                      <span className={styles.cartItemName}>{item.productName}</span>
                      <span className={styles.cartItemMeta}>
                        {item.quantity} cxs · {item.priceType === 'PER_LB'
                          ? `${fmt(item.pricePerLb)}/lb`
                          : `${fmt(item.pricePerBox)}/cx`}
                      </span>
                    </div>
                    <button
                      className={styles.cartRemoveBtn}
                      onClick={() => handleRemoveItem(i)}
                      aria-label="Remover item"
                    >
                      <IconTrash />
                    </button>
                  </div>
                ))}
              </div>

              {error   && <p className={`${styles.banner} ${styles.error}`}>{error}</p>}
              {success && <p className={`${styles.banner} ${styles.success}`}>{success}</p>}

              <button
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {submitting ? <><Spinner /> A processar…</> : `Confirmar Pedido (${cart.length} ${cart.length === 1 ? 'item' : 'itens'})`}
              </button>
            </div>
          )}

          {cart.length === 0 && error && <p className={`${styles.banner} ${styles.error}`}>{error}</p>}
          {cart.length === 0 && success && <p className={`${styles.banner} ${styles.success}`}>{success}</p>}
        </div>

        {/* ── Summary card ── */}
        <div className={`${styles.card} ${styles.summary}`}>
          <p className={styles.cardTitle}>Resumo</p>

          <div className={styles.summaryRow}>
            <span>Restaurante</span>
            <span>
              {isClient
                ? user.email
                : clientId
                  ? clients.find(c => c.id === Number(clientId))?.email ?? '—'
                  : '—'}
            </span>
          </div>

          <div className={styles.summaryRow}>
            <span>Itens</span>
            <span>{cart.length > 0 ? cart.length : '—'}</span>
          </div>

          {cart.map((item, i) => (
            <div key={i} className={styles.summaryRow}>
              <span className={styles.summaryItemLabel}>{item.productName}</span>
              <span>{item.quantity} cxs</span>
            </div>
          ))}

          <div className={styles.summaryTotal}>
            <span>Total caixas</span>
            <span>{cartTotals.boxes > 0 ? `${cartTotals.boxes} cxs` : '—'}</span>
          </div>
        </div>

      </div>

      {!isClient && <ClientPanel />}

    </div>
  )
}

export default OrderEntry
