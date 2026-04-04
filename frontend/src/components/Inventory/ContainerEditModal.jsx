import { useState } from 'react'
import { updateContainer } from '../../services/inventoryService'
import { ZONE_LABELS, expandLabel } from '../../constants/zones'
import styles from './ContainerEditModal.module.css'

const ContainerEditModal = ({ container, products, onClose, onSaved }) => {
  const [productId, setProductId] = useState(
    container.productId != null ? String(container.productId) : ''
  )
  const [quantity, setQuantity] = useState(container.quantity)
  const [unit,     setUnit]     = useState(container.unit || 'caixas')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const handleQuantityChange = (e) => {
    const v = Math.max(0, Math.min(9999, Number(e.target.value)))
    setQuantity(v)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await updateContainer(container.id, {
        capacity:  container.capacity,
        quantity:  Number(quantity),
        unit:      unit,
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
            <h2 className={styles.title}>{expandLabel(container.label)}</h2>
            <p className={styles.zoneBadge}>
              {ZONE_LABELS[container.zone] || container.zone}

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
            <label className={styles.label}>Quantidade</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className={styles.input}
                type="number"
                min={0}
                max={9999}
                value={quantity}
                onChange={handleQuantityChange}
                style={{ flex: 1 }}
              />
              <select
                className={styles.select}
                value={unit}
                onChange={e => setUnit(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="caixas">caixas</option>
                <option value="unidades">unidades soltas</option>
              </select>
            </div>
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
