import { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import styles from './SignatureModal.module.css'

/* ── Icons ── */
const IconClose = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const IconTrash = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
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

const IconPen = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652
         L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685
         a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125
         M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25
         A2.25 2.25 0 015.25 6H10" />
  </svg>
)

const IconCheck = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

const Spinner = () => (
  <svg className={styles.spinner} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
    <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
  </svg>
)

/* ── SignatureModal ── */
const SignatureModal = ({ order, onClose, onDelivered }) => {
  const sigRef     = useRef(null)
  const [isEmpty,  setIsEmpty]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [delivered, setDelivered] = useState(false)
  const [savedSig,  setSavedSig]  = useState('')

  // Fecha ao pressionar Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleClear = () => {
    sigRef.current?.clear()
    setIsEmpty(true)
    setError('')
  }

  const handleEnd = () => {
    setIsEmpty(sigRef.current?.isEmpty() ?? true)
  }

  const handleConfirm = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError('Por favor, assine antes de confirmar a entrega.')
      return
    }

    const base64 = sigRef.current.getTrimmedCanvas().toDataURL('image/png')

    setSaving(true)
    setError('')
    try {
      const token   = localStorage.getItem('token')
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

      const res = await fetch(`${baseURL}/orders/${order.id}/deliver`, {
        method:  'PATCH',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ signature: base64 }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Erro ao guardar assinatura.')
      }

      const updated = await res.json()
      setSavedSig(base64)
      setDelivered(true)
      onDelivered?.(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !saving) onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>Assinatura Digital</p>
            <h2 className={styles.title}>Confirmação de Entrega</h2>
            <p className={styles.orderRef}>Pedido #{order.id} · {order.client?.email}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} disabled={saving}>
            <IconClose />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>

          {delivered ? (
            /* ── Estado de sucesso ── */
            <div className={styles.preview}>
              <span className={styles.successBadge}>
                <IconCheck /> Entrega confirmada com sucesso
              </span>
              <img
                src={savedSig}
                alt="Assinatura do cliente"
                className={styles.previewImg}
              />
              <button className={styles.clearBtn} onClick={onClose}>
                Fechar
              </button>
            </div>
          ) : (
            <>
              <p className={styles.instruction}>
                O cliente deve assinar abaixo para confirmar o recebimento da entrega.
              </p>

              {/* Canvas */}
              <div className={`${styles.canvasWrapper} ${!isEmpty ? styles.signed : ''}`}>
                <SignatureCanvas
                  ref={sigRef}
                  onEnd={handleEnd}
                  canvasProps={{
                    className: styles.canvas,
                    'aria-label': 'Área de assinatura',
                  }}
                  backgroundColor="rgb(248,248,248)"
                  penColor="#1a1a1a"
                  dotSize={2}
                  minWidth={1.5}
                  maxWidth={3}
                  velocityFilterWeight={0.7}
                />
                <div className={`${styles.canvasPlaceholder} ${!isEmpty ? styles.hidden : ''}`}>
                  <IconPen />
                  <span>Assine aqui</span>
                </div>
              </div>

              {error && <p className={styles.error}>{error}</p>}

              {/* Actions */}
              <div className={styles.actions}>
                <button className={styles.clearBtn} onClick={handleClear} disabled={saving}>
                  <IconTrash /> Limpar
                </button>
                <button
                  className={styles.confirmBtn}
                  onClick={handleConfirm}
                  disabled={isEmpty || saving}
                >
                  {saving ? <><Spinner /> A guardar…</> : <><IconCheck /> Confirmar Entrega</>}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default SignatureModal
