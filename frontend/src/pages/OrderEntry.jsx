import { useState, useEffect, useMemo } from 'react'
import { fetchContainers } from '../services/inventoryService'
import { fetchClients, createOrder } from '../services/orderService'
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

/* ── OrderEntry ── */
const OrderEntry = () => {
  const [clients,    setClients]    = useState([])
  const [containers, setContainers] = useState([])
  const [loading,    setLoading]    = useState(true)

  const [clientId,    setClientId]    = useState('')
  const [containerId, setContainerId] = useState('')
  const [quantity,    setQuantity]    = useState('')
  const [weightKg,    setWeightKg]    = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  useEffect(() => {
    Promise.all([fetchClients(), fetchContainers()])
      .then(([cls, cts]) => { setClients(cls); setContainers(cts) })
      .catch(() => setError('Erro ao carregar dados. Verifique a ligação ao servidor.'))
      .finally(() => setLoading(false))
  }, [])

  // Contêineres com stock disponível (quantidade > 0)
  const availableContainers = useMemo(
    () => containers.filter(c => c.quantity > 0 && c.product),
    [containers]
  )

  const selectedContainer = useMemo(
    () => containers.find(c => c.id === Number(containerId)) || null,
    [containers, containerId]
  )

  const maxQty      = selectedContainer?.quantity ?? 0
  const productId   = selectedContainer?.productId ?? null
  const qty         = Number(quantity)
  const qtyValid    = Number.isInteger(qty) && qty > 0 && qty <= maxQty
  const weightNum   = Number(weightKg)
  const weightValid = weightNum > 0
  const canSubmit   = clientId && containerId && qtyValid && weightValid && !submitting

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!canSubmit) return

    setSubmitting(true)
    try {
      const order = await createOrder({
        clientId:    Number(clientId),
        containerId: Number(containerId),
        productId:   Number(productId),
        quantity:    qty,
        weightKg:    weightNum,
      })

      setSuccess(`Pedido #${order.id} criado com sucesso — Status: PENDENTE`)

      // Actualiza stock localmente
      setContainers(prev =>
        prev.map(c =>
          c.id === Number(containerId)
            ? { ...c, quantity: c.quantity - qty }
            : c
        )
      )

      // Reset form
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
          <p className={styles.cardTitle}>Dados do Pedido</p>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

              {/* Cliente */}
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
                            [{c.label}] {c.product.name} — {c.quantity} cxs disponíveis
                          </option>
                        ))}
                      </optgroup>
                    )
                  })}
                </select>

                {selectedContainer && (
                  <p className={`${styles.stockHint} ${styles[stockLevel(selectedContainer.quantity)]}`}>
                    Stock: {selectedContainer.quantity} / {selectedContainer.capacity} cxs
                    {selectedContainer.quantity <= 20 && selectedContainer.quantity > 0
                      ? ' — Stock baixo'
                      : ''}
                  </p>
                )}
              </div>

              {/* Quantidade */}
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
                  placeholder={maxQty ? `Máx. ${maxQty} cxs` : 'Selecione um contêiner primeiro'}
                  disabled={!containerId || loading}
                />
                {quantity && !qtyValid && containerId && (
                  <p className={`${styles.banner} ${styles.error}`}>
                    {qty <= 0
                      ? 'A quantidade deve ser maior que zero.'
                      : `Stock insuficiente. Máximo disponível: ${maxQty} cxs.`}
                  </p>
                )}
              </div>

              {/* Peso */}
              <div className={styles.field}>
                <label className={styles.label}>Peso total (kg)</label>
                <input
                  className={styles.input}
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value)}
                  placeholder="Ex: 42.5"
                  disabled={loading}
                />
                {weightKg && !weightValid && (
                  <p className={`${styles.banner} ${styles.error}`}>
                    O peso deve ser superior a zero.
                  </p>
                )}
              </div>

              {error   && <p className={`${styles.banner} ${styles.error}`}>{error}</p>}
              {success && <p className={`${styles.banner} ${styles.success}`}>{success}</p>}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={!canSubmit}
              >
                {submitting ? <><Spinner /> A processar…</> : 'Confirmar Pedido'}
              </button>

            </div>
          </form>
        </div>

        {/* ── Summary card ── */}
        <div className={`${styles.card} ${styles.summary}`}>
          <p className={styles.cardTitle}>Resumo</p>

          <div className={styles.summaryRow}>
            <span>Cliente</span>
            <span>
              {clientId
                ? clients.find(c => c.id === Number(clientId))?.email ?? '—'
                : '—'}
            </span>
          </div>

          <div className={styles.summaryRow}>
            <span>Produto</span>
            <span>{selectedContainer?.product?.name ?? '—'}</span>
          </div>

          <div className={styles.summaryRow}>
            <span>Tipo</span>
            <span>{selectedContainer?.product?.type ?? '—'}</span>
          </div>

          <div className={styles.summaryRow}>
            <span>Contêiner</span>
            <span>{selectedContainer?.label ?? '—'}</span>
          </div>

          <div className={styles.summaryRow}>
            <span>Stock atual</span>
            <span>{selectedContainer ? `${selectedContainer.quantity} cxs` : '—'}</span>
          </div>

          <div className={styles.summaryRow}>
            <span>Quantidade</span>
            <span>{qty > 0 ? `${qty} cxs` : '—'}</span>
          </div>

          <div className={styles.summaryTotal}>
            <span>Peso total</span>
            <span>{weightNum > 0 ? `${weightNum.toFixed(1)} kg` : '—'}</span>
          </div>
        </div>

      </div>

      <ClientPanel />

    </div>
  )
}

export default OrderEntry
