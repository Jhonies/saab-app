import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchOrders } from '../services/orderService'
import styles from './ExpedicaoOrders.module.css'

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'SEPARATING', 'READY']

const FILTERS = [
  { key: 'ALL',        label: 'Todos Activos' },
  { key: 'PENDING',    label: 'Pendente'      },
  { key: 'CONFIRMED',  label: 'Confirmado'    },
  { key: 'SEPARATING', label: 'Em Separação'  },
  { key: 'READY',      label: 'Pronto'        },
]

const STATUS_CONFIG = {
  PENDING:    { label: 'Pendente',      color: '#b45309', bg: '#b4530918' },
  CONFIRMED:  { label: 'Confirmado',    color: '#888888', bg: '#88888818' },
  SEPARATING: { label: 'Em Separação',  color: '#1a6bb5', bg: '#1a6bb518' },
  READY:      { label: 'Pronto',        color: '#15803d', bg: '#15803d18' },
}

const summariseItems = (items = []) => {
  if (!items.length) return '—'
  const names = items.map(i => i.product?.name ?? '?')
  if (names.length <= 2) return names.join(', ')
  return `${names[0]}, ${names[1]} +${names.length - 2}`
}

const ExpedicaoOrders = () => {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('ALL')
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders()
      .then(data => setOrders(data.filter(o => ACTIVE_STATUSES.includes(o.status))))
      .finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() =>
    filter === 'ALL' ? orders : orders.filter(o => o.status === filter),
    [orders, filter]
  )

  return (
    <div className={styles.page}>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className={styles.filterCount}>
                {f.key === 'ALL'
                  ? orders.length
                  : orders.filter(o => o.status === f.key).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.tableHeader}>
          <span>Pedido</span>
          <span>Cliente</span>
          <span>Produtos</span>
          <span className={styles.right}>Caixas</span>
          <span className={styles.right}>Peso (kg)</span>
          <span>Status</span>
          <span />
        </div>

        {loading ? (
          <p className={styles.empty}>A carregar...</p>
        ) : visible.length === 0 ? (
          <p className={styles.empty}>Nenhum pedido neste estado.</p>
        ) : (
          visible.map(order => {
            const cfg = STATUS_CONFIG[order.status]
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
                <span className={`${styles.num} ${styles.right}`}>
                  {order.weightKg > 0 ? `${order.weightKg} kg` : '—'}
                </span>
                <span>
                  <span
                    className={styles.badge}
                    style={{ color: cfg.color, borderColor: cfg.color, backgroundColor: cfg.bg }}
                  >
                    {cfg.label}
                  </span>
                </span>
                <span className={styles.actionCell}>
                  <button
                    className={styles.btnProcess}
                    onClick={() => navigate(`/expedicao/orders/${order.id}`)}
                  >
                    Ver / Processar
                  </button>
                </span>
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}

export default ExpedicaoOrders
