import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchOrders } from '../services/orderService'
import styles from './ExpedicaoDashboard.module.css'

const STATUS_LABEL = {
  PENDING:    'Pendente',
  CONFIRMED:  'Confirmado',
  SEPARATING: 'Em Separação',
  READY:      'Pronto',
  IN_TRANSIT: 'Em Trânsito',
  DELIVERED:  'Entregue',
  CANCELLED:  'Cancelado',
}

const STATUS_COLOR = {
  PENDING:    '#b45309',
  CONFIRMED:  '#888888',
  SEPARATING: '#1a6bb5',
  READY:      '#15803d',
  IN_TRANSIT: '#505050',
  DELIVERED:  '#15803d',
  CANCELLED:  '#f87171',
}

const CARDS = [
  { key: 'PENDING',    label: 'Pendentes',         color: '#b45309' },
  { key: 'CONFIRMED',  label: 'A Confirmar',        color: '#888888' },
  { key: 'SEPARATING', label: 'Em Separação',       color: '#1a6bb5' },
  { key: 'READY',      label: 'Prontos para Carga', color: '#15803d' },
]

const ExpedicaoDashboard = () => {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  const counts = useMemo(() => {
    const map = {}
    CARDS.forEach(c => { map[c.key] = 0 })
    orders.forEach(o => {
      if (map[o.status] !== undefined) map[o.status]++
    })
    return map
  }, [orders])

  const recent = useMemo(() =>
    [...orders]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5),
    [orders]
  )

  return (
    <div className={styles.page}>

      <div className={styles.cardsGrid}>
        {CARDS.map(({ key, label, color }) => (
          <div key={key} className={styles.card} style={{ borderTopColor: color }}>
            <p className={styles.cardLabel}>{label}</p>
            <p className={styles.cardValue} style={{ color }}>
              {loading ? '—' : counts[key]}
            </p>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Actividade Recente</h2>
          <button
            className={styles.btnSecondary}
            onClick={() => navigate('/expedicao/orders')}
          >
            Ver Todos os Pedidos
          </button>
        </div>

        {loading ? (
          <p className={styles.empty}>A carregar...</p>
        ) : recent.length === 0 ? (
          <p className={styles.empty}>Sem pedidos registados.</p>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Pedido</span>
              <span>Cliente</span>
              <span>Status</span>
              <span>Actualizado</span>
            </div>
            {recent.map(order => (
              <div
                key={order.id}
                className={styles.tableRow}
                onClick={() => navigate(`/expedicao/orders/${order.id}`)}
              >
                <span className={styles.orderId}>#{String(order.id).padStart(4, '0')}</span>
                <span className={styles.clientEmail}>{order.client?.email ?? '—'}</span>
                <span>
                  <span
                    className={styles.badge}
                    style={{
                      color:           STATUS_COLOR[order.status] ?? '#888',
                      borderColor:     STATUS_COLOR[order.status] ?? '#888',
                      backgroundColor: (STATUS_COLOR[order.status] ?? '#888') + '1a',
                    }}
                  >
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </span>
                <span className={styles.meta}>
                  {new Date(order.updatedAt).toLocaleString('pt-PT', {
                    day: '2-digit', month: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default ExpedicaoDashboard
