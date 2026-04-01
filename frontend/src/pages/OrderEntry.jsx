import { useState, useEffect, useMemo } from 'react'
import { fetchContainers } from '../services/inventoryService'
import { fetchClients, createOrder } from '../services/orderService'
import { useAuth } from '../context/AuthContext'
import { ZONE_CONFIG } from '../constants/zones'
import ClientPanel from '../components/Orders/ClientPanel'
import styles from './OrderEntry.module.css'

/* ── Helpers ── */
const stockLevel = (qty) => {
  if (qty === 0)   return 'danger'
  if (qty <= 20)   return 'warning'
  return 'ok'
}

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
  const [containers, setContainers] = useState([])
  const [loading,    setLoading]    = useState(true)

  const [clientId,    setClientId]    = useState('')
  const [containerId, setContainerId] = useState('')
  const [quantity,    setQuantity]    = useState('')
  const [weightKg,    setWeightKg]    = useState('')

  // Carrinho de itens
  const [cart, setCart] = useState([])

  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  useEffect(() => {
    if (isClient) {
      setClientId(String(user.id))
      fetchContainers()
        .then(cts => setContainers(cts))
        .catch(() => setError('Erro ao carregar dados. Verifique a ligação ao servidor.'))
        .finally(() => setLoading(false))
    } else {
      Promise.all([fetchClients(), fetchContainers()])
        .then(([cls, cts]) => { setClients(cls); setContainers(cts) })
        .catch(() => setError('Erro ao carregar dados. Verifique a ligação ao servidor.'))
        .finally(() => setLoading(false))
    }
  }, [isClient, user?.id])

  // Contêineres com stock disponível, descontando itens já no carrinho
  const availableContainers = useMemo(() => {
    const cartQtyMap = {}
    for (const item of cart) {
      cartQtyMap[item.containerId] = (cartQtyMap[item.containerId] || 0) + item.quantity
    }
    return containers
      .map(c => ({ ...c, effectiveQty: c.quantity - (cartQtyMap[c.id] || 0) }))
      .filter(c => c.effectiveQty > 0 && c.product)
  }, [containers, cart])

  const selectedContainer = useMemo(() => {
    const c = containers.find(c => c.id === Number(containerId)) || null
    if (!c) return null
    const cartQty = cart
      .filter(item => item.containerId === c.id)
      .reduce((sum, item) => sum + item.quantity, 0)
    return { ...c, effectiveQty: c.quantity - cartQty }
  }, [containers, containerId, cart])

  const maxQty      = selectedContainer?.effectiveQty ?? 0
  const productId   = selectedContainer?.productId ?? null
  const qty         = Number(quantity)
  const qtyValid    = Number.isInteger(qty) && qty > 0 && qty <= maxQty
  const weightNum   = weightKg ? Number(weightKg) : 0
  const canAdd      = containerId && qtyValid

  // Totais do carrinho
  const cartTotals = useMemo(() => ({
    boxes:  cart.reduce((s, i) => s + i.quantity, 0),
    weight: cart.reduce((s, i) => s + i.weightKg, 0),
  }), [cart])

  const canSubmit = clientId && cart.length > 0 && !submitting

  const handleAddItem = () => {
    if (!canAdd) return
    setError('')
    setSuccess('')

    const container = containers.find(c => c.id === Number(containerId))
    setCart(prev => [...prev, {
      containerId: Number(containerId),
      productId:   Number(productId),
      quantity:    qty,
      weightKg:    weightNum,
      // dados para exibição
      label:       container.label,
      productName: container.product.name,
      productType: container.product.type,
    }])

    setContainerId('')
    setQuantity('')
    setWeightKg('')
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
        items:    cart.map(({ containerId, productId, quantity, weightKg }) => ({
          containerId, productId, quantity, weightKg,
        })),
      })

      setSuccess(`Pedido #${order.id} criado com sucesso (${cart.length} ${cart.length === 1 ? 'item' : 'itens'}) — Status: PENDENTE`)

      // Actualiza stock localmente
      const cartQtyMap = {}
      for (const item of cart) {
        cartQtyMap[item.containerId] = (cartQtyMap[item.containerId] || 0) + item.quantity
      }
      setContainers(prev =>
        prev.map(c =>
          cartQtyMap[c.id]
            ? { ...c, quantity: c.quantity - cartQtyMap[c.id] }
            : c
        )
      )

      setCart([])
      setContainerId('')
      setQuantity('')
      setWeightKg('')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar pedido.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <p className={styles.eyebrow}>Módulo B</p>
        <h1 className={styles.title}>Novo Pedido</h1>
      </div>

      <div className={styles.body}>

        {/* ── Form card ── */}
        <div className={`${styles.card} ${styles.form}`}>
          <p className={styles.cardTitle}>Adicionar Produto</p>

          <div className={styles.formFields}>

            {/* Cliente (só visível para ADMIN) */}
            {!isClient && (
              <div className={styles.field}>
                <label className={styles.label}>Cliente</label>
                <select
                  className={styles.select}
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Selecione um cliente…</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.email}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Contêiner / Produto */}
            <div className={styles.field}>
              <label className={styles.label}>Produto / Contêiner</label>
              <select
                className={styles.select}
                value={containerId}
                onChange={e => { setContainerId(e.target.value); setQuantity('') }}
                disabled={loading}
              >
                <option value="">Selecione um produto…</option>
                {ZONE_CONFIG.map(zone => {
                  const zoneContainers = availableContainers.filter(c => (c.zone || 'CONTAINERS') === zone.key)
                  if (zoneContainers.length === 0) return null
                  return (
                    <optgroup key={zone.key} label={zone.label}>
                      {zoneContainers.map(c => (
                        <option key={c.id} value={c.id}>
                          [{c.label}] {c.product.name} — {c.effectiveQty} cxs disponíveis
                        </option>
                      ))}
                    </optgroup>
                  )
                })}
              </select>

              {selectedContainer && (
                <p className={`${styles.stockHint} ${styles[stockLevel(selectedContainer.effectiveQty)]}`}>
                  Stock: {selectedContainer.effectiveQty} / {selectedContainer.capacity} cxs
                  {selectedContainer.effectiveQty <= 20 && selectedContainer.effectiveQty > 0
                    ? ' — Stock baixo'
                    : ''}
                </p>
              )}
            </div>

            {/* Quantidade + Peso lado a lado */}
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Quantidade (caixas)</label>
                <input
                  className={styles.input}
                  type="number"
                  min="1"
                  max={maxQty || undefined}
                  step="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder={maxQty ? `Máx. ${maxQty}` : '—'}
                  disabled={!containerId || loading}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Peso (kg) <span className={styles.optional}>opcional</span></label>
                <input
                  className={styles.input}
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value)}
                  placeholder="Opcional"
                  disabled={loading}
                />
              </div>
            </div>

            {quantity && !qtyValid && containerId && (
              <p className={`${styles.banner} ${styles.error}`}>
                {qty <= 0
                  ? 'A quantidade deve ser maior que zero.'
                  : `Stock insuficiente. Máximo disponível: ${maxQty} cxs.`}
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

          {/* ── Carrinho ── */}
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
                        [{item.label}] · {item.quantity} cxs{item.weightKg > 0 ? ` · ${item.weightKg.toFixed(1)} kg` : ''}
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
            <span>Cliente</span>
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

          <div className={styles.summaryTotal}>
            <span>Peso total</span>
            <span>{cartTotals.weight > 0 ? `${cartTotals.weight.toFixed(1)} kg` : '—'}</span>
          </div>
        </div>

      </div>

      {!isClient && <ClientPanel />}

    </div>
  )
}

export default OrderEntry
