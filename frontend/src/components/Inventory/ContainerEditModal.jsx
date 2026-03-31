import { useState } from 'react'
import { updateContainer } from '../../services/inventoryService'
import { ZONE_LABELS, SUBZONE_LABELS } from '../../constants/zones'
import styles from './ContainerEditModal.module.css'

const getStatus = (quantity, capacity) => {
  if (quantity === 0)          return 'empty'
  if (quantity >= capacity)    return 'full'
  return 'partial'
}

const ContainerEditModal = ({ container, products, onClose, onSaved }) => {
  const [productId, setProductId] = useState(
    container.productId != null ? String(container.productId) : ''
  )
  const [capacity, setCapacity] = useState(container.capacity)
  const [quantity, setQuantity] = useState(container.quantity)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const pct    = capacity > 0
    ? Math.round((quantity / capacity) * 100)
    : 0
  const status = getStatus(quantity, capacity)

  const handleCapacityChange = (e) => {
    const v = Math.max(0, Math.min(9999, Number(e.target.value)))
    setCapacity(v)
    if (quantity > v) setQuantity(v)
  }

  const handleQuantityChange = (e) => {
    const v = Math.max(0, Math.min(capacity, Number(e.target.value)))
    setQuantity(v)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await updateContainer(container.id, {
        capacity:  Number(capacity),
        quantity:  Number(quantity),
        productId: productId === '' ? null : Number(productId),
      })
      onSaved(updated)
    } catch {
      setError('Erro ao guardar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>Editar Contêiner</p>
            <h2 className={styles.title}>{container.label}</h2>
            <p className={styles.zoneBadge}>
              {ZONE_LABELS[container.zone] || container.zone}
              {container.subZone ? ` / ${SUBZONE_LABELS[container.subZone]}` : ''}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        {/* Body */}
        <div className={styles.body}>

          <div className={styles.field}>
            <label className={styles.label}>Produto</label>
            <select
              className={styles.select}
              value={productId}
              onChange={e => setProductId(e.target.value)}
            >
              <option value="">Sem produto</option>
              {products.map(p => (
                <option key={p.id} value={String(p.id)}>
                  {p.name} — {p.type}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Capacidade{' '}
              <span className={styles.hint}>(máx. 9999 cxs)</span>
            </label>
            <input
              className={styles.input}
              type="number"
              min={0}
              max={9999}
              value={capacity}
              onChange={handleCapacityChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Quantidade{' '}
              <span className={styles.hint}>(máx. {capacity} cxs)</span>
            </label>
            <input
              className={styles.input}
              type="number"
              min={0}
              max={capacity}
              value={quantity}
              onChange={handleQuantityChange}
            />
          </div>

          {/* Live progress bar */}
          <div className={styles.progressWrapper}>
            <div className={styles.progressTrack}>
              <div
                className={`${styles.progressFill} ${styles[status]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={styles.progressLabel}>
              {quantity} / {container.capacity} cxs ({pct}%)
            </span>
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'A guardar…' : 'Guardar'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default ContainerEditModal
