import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchOrderById, loadOrder, deliverOrder } from '../services/orderService'
import styles from './DriverDelivery.module.css'

const STATUS_CONFIG = {
  PENDING:    { label: 'Pendente',     color: '#b45309', bg: '#b4530918' },
  CONFIRMED:  { label: 'Confirmado',   color: '#888888', bg: '#88888818' },
  SEPARATING: { label: 'Em Separação', color: '#1a6bb5', bg: '#1a6bb518' },
  READY:      { label: 'Pronto',       color: '#15803d', bg: '#15803d18' },
  IN_TRANSIT: { label: 'Em Trânsito',  color: '#1a6bb5', bg: '#1a6bb518' },
  DELIVERED:  { label: 'Entregue',     color: '#15803d', bg: '#15803d18' },
  CANCELLED:  { label: 'Cancelado',    color: '#f87171', bg: '#f8717118' },
}

/* ── Icons ── */
const IconBack = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
)

const IconMap = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 6.75V15m6-6v8.25M5.25 3h13.5A2.25 2.25 0 0121 5.25v13.5
         A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V5.25
         A2.25 2.25 0 015.25 3z" />
  </svg>
)

const IconCheck = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: '1.25rem', height: '1.25rem' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

const DriverDelivery = () => {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [order,       setOrder]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [acting,      setActing]      = useState(false)
  const [error,       setError]       = useState('')

  const load = () => {
    setLoading(true)
    fetchOrderById(id)
      .then(setOrder)
      .catch(() => setError('Pedido não encontrado.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleLoad = async () => {
    setActing(true)
    setError('')
    try {
      const updated = await loadOrder(id)
      setOrder(updated)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Erro ao confirmar carga.')
    } finally {
      setActing(false)
    }
  }

  const handleDeliver = async () => {
    setActing(true)
    setError('')
    try {
      const updated = await deliverOrder(id)
      setOrder(updated)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Erro ao confirmar entrega.')
    } finally {
      setActing(false)
    }
  }

  if (loading) return <div className={styles.state}>A carregar...</div>
  if (error && !order) return <div className={styles.state}>{error}</div>

  const cfg      = STATUS_CONFIG[order.status] ?? { label: order.status, color: '#888', bg: '#88888818' }
  const mapsUrl  = order.lat && order.lon
    ? `https://www.google.com/maps/dir/?api=1&destination=${order.lat},${order.lon}&travelmode=driving`
    : null

  const totalWeight = order.items?.reduce((s, i) => s + (i.weightLb ?? 0), 0) ?? order.weightLb ?? 0

  return (
    <div className={styles.page}>

      {/* ── Back ── */}
      <button className={styles.backBtn} onClick={() => navigate('/motorista/routes')}>
        <IconBack /> Rota do Dia
      </button>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            <p className={styles.eyebrow}>Entrega</p>
            <h1 className={styles.orderNum}>#{String(order.id).padStart(4, '0')}</h1>
            <span
              className={styles.badge}
              style={{ color: cfg.color, borderColor: cfg.color, backgroundColor: cfg.bg }}
            >
              {cfg.label}
            </span>
          </div>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mapsLink}
            >
              <IconMap />
              Abrir no Google Maps
            </a>
          )}
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Cliente</span>
            <span className={styles.metaValue}>{order.client?.email ?? '—'}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Endereço</span>
            <span className={styles.metaValue}>{order.address || '—'}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Janela</span>
            <span className={styles.metaValue}>
              {order.deliveryWindowStart} – {order.deliveryWindowEnd}
            </span>
          </div>
        </div>
      </div>

      {/* ── Items ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Itens a Entregar</h2>

        <div className={styles.itemsCard}>
          {order.items?.map(item => (
            <div key={item.id} className={styles.itemRow}>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.product?.name ?? '—'}</span>
                <span className={styles.itemType}>{item.product?.type ?? ''}</span>
              </div>
              <div className={styles.itemNums}>
                <span className={styles.itemQty}>{item.quantity} cx</span>
                <span className={styles.itemWeight}>
                  {item.weightLb > 0 ? `${item.weightLb} lbs` : '—'}
                </span>
              </div>
            </div>
          ))}

          <div className={styles.totalsRow}>
            <span className={styles.totalsLabel}>Total</span>
            <div className={styles.totalsNums}>
              <span className={styles.totalsValue}>{order.totalBoxes} cx</span>
              <span className={styles.totalsValue}>
                {totalWeight > 0 ? `${totalWeight} lbs` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Painel de Acções ── */}
      <div className={styles.actions}>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {order.status === 'READY' && (
          <div className={styles.actionPanel}>
            <p className={styles.actionHint}>
              Confirma que carregaste todos os itens na viatura antes de sair.
            </p>
            <button
              className={styles.btnPrimary}
              disabled={acting}
              onClick={handleLoad}
            >
              {acting ? 'A processar...' : 'Confirmar Carga'}
            </button>
          </div>
        )}

        {order.status === 'IN_TRANSIT' && (
          <div className={styles.actionPanel}>
            <p className={styles.actionHint}>
              Confirma a entrega ao cliente.
            </p>
            <button
              className={styles.btnPrimary}
              disabled={acting}
              onClick={handleDeliver}
            >
              {acting ? 'A processar...' : 'Confirmar Entrega'}
            </button>
          </div>
        )}

        {order.status === 'DELIVERED' && (
          <div className={`${styles.actionPanel} ${styles.actionPanelGreen}`}>
            <div className={styles.deliveredConfirm}>
              <span className={styles.deliveredIcon}><IconCheck /></span>
              <div>
                <p className={styles.deliveredTitle}>Entrega Confirmada</p>
                {order.deliveredAt && (
                  <p className={styles.deliveredTime}>
                    {new Date(order.deliveredAt).toLocaleString('pt-PT', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {!['READY', 'IN_TRANSIT', 'DELIVERED'].includes(order.status) && (
          <div className={styles.actionPanel}>
            <p className={styles.actionHint}>
              Este pedido está em estado <strong>{cfg.label}</strong> — sem acções disponíveis para o motorista.
            </p>
          </div>
        )}

      </div>

    </div>
  )
}

export default DriverDelivery
