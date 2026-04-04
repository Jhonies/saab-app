import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchOrders } from '../services/orderService'
import styles from './VendedorOrders.module.css'

const STATUS_CONFIG = {
  PENDING:    { label: 'Pendente',      color: '#b45309', bg: '#b4530918' },
  CONFIRMED:  { label: 'Confirmado',    color: '#888888', bg: '#88888818' },
  SEPARATING: { label: 'Em Separação',  color: '#1a6bb5', bg: '#1a6bb518' },
  READY:      { label: 'Pronto',        color: '#15803d', bg: '#15803d18' },
  IN_TRANSIT: { label: 'Em Trânsito',   color: '#1a6bb5', bg: '#1a6bb518' },
  DELIVERED:  { label: 'Entregue',      color: '#15803d', bg: '#15803d18' },
  CANCELLED:  { label: 'Cancelado',     color: '#f87171', bg: '#f8717118' },
}

const summariseItems = (items = []) => {
  if (!items.length) return '—'
  const names = items.map(i => i.product?.name ?? '?')
  if (names.length <= 2) return names.join(', ')
  return `${names[0]}, ${names[1]} +${names.length - 2}`
}

/* ── Mobile order card ── */
const OrderMobileCard = ({ order }) => {
  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: '#888', bg: '#88888818' }
  return (
    <div className={styles.mobileCard}>
      <div className={styles.mobileCardTop}>
        <span className={styles.orderId}>
          #{String(order.id).padStart(4, '0')}
        </span>
        <span
          className={styles.badge}
          style={{ color: cfg.color, borderColor: cfg.color, backgroundColor: cfg.bg }}
        >
          {cfg.label}
        </span>
      </div>
      <p className={styles.mobileClient}>{order.client?.email ?? '—'}</p>
      <p className={styles.mobileProducts}>{summariseItems(order.items)}</p>
      <div className={styles.mobileCardBottom}>
        <span className={styles.mobileNum}>
          {order.totalBoxes} cxs
        </span>
        <span className={styles.mobileDate}>
          {new Date(order.createdAt).toLocaleDateString('pt-PT')}
        </span>
      </div>
    </div>
  )
}

const VendedorOrders = () => {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  const sorted = useMemo(() =>
    [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [orders]
  )

  return (
    <div className={styles.page}>

      <div className={styles.toolbar}>
        <h1 className={styles.title}>Pedidos</h1>
        <button
          className={styles.btnNew}
          onClick={() => navigate('/vendedor/orders/new')}
        >
          + Novo Pedido
        </button>
      </div>

      {/* Desktop table */}
      <div className={styles.tableWrap}>
        <div className={styles.tableHeader}>
          <span>Pedido</span>
          <span>Cliente</span>
          <span>Produtos</span>
          <span className={styles.right}>Caixas</span>
          <span>Status</span>
          <span>Data</span>
        </div>

        {loading ? (
          <p className={styles.empty}>A carregar...</p>
        ) : sorted.length === 0 ? (
          <p className={styles.empty}>Nenhum pedido registado.</p>
        ) : (
          sorted.map(order => {
            const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: '#888', bg: '#88888818' }
            return (
              <div key={order.id} className={styles.tableRow}>
                <span className={styles.orderId}>
                  #{String(order.id).padStart(4, '0')}
                </span>
                <span className={styles.clientEmail}>
                  {order.client?.email ?? '—'}
                </span>
                <span className={styles.products}>
                  {summariseItems(order.items)}
                </span>
                <span className={`${styles.num} ${styles.right}`}>
                  {order.totalBoxes}
                </span>
                <span>
                  <span
                    className={styles.badge}
                    style={{ color: cfg.color, borderColor: cfg.color, backgroundColor: cfg.bg }}
                  >
                    {cfg.label}
                  </span>
                </span>
                <span className={styles.date}>
                  {new Date(order.createdAt).toLocaleDateString('pt-PT')}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Mobile cards */}
      <div className={styles.mobileList}>
        {loading ? (
          <p className={styles.empty}>A carregar...</p>
        ) : sorted.length === 0 ? (
          <p className={styles.empty}>Nenhum pedido registado.</p>
        ) : (
          sorted.map(order => (
            <OrderMobileCard key={order.id} order={order} />
          ))
        )}
      </div>

    </div>
  )
}

export default VendedorOrders
