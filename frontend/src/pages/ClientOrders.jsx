import { useState, useEffect } from 'react'
import { fetchMyOrders, openInvoice } from '../services/orderService'
import styles from './ClientOrders.module.css'

/* ── Status config ── */
const STATUS_LABEL = {
  PENDING:    'Pendente',
  CONFIRMED:  'Confirmado',
  SEPARATING: 'Em Separação',
  READY:      'Pronto',
  IN_TRANSIT: 'Em Trânsito',
  DELIVERED:  'Entregue',
  CANCELLED:  'Cancelado',
}

const STATUS_MOD = {
  PENDING:    'pending',
  CONFIRMED:  'confirmed',
  SEPARATING: 'confirmed',
  READY:      'confirmed',
  IN_TRANSIT: 'confirmed',
  DELIVERED:  'delivered',
  CANCELLED:  'cancelled',
}

/* ── Icons ── */
const IconPdf = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5
         A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25
         m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25
         c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25
         a9 9 0 00-9-9z" />
  </svg>
)

/* ── OrderCard (mobile) ── */
const OrderCard = ({ order, status, products }) => (
  <div className={styles.orderCard}>
    <div className={styles.cardRow}>
      <span className={styles.orderId}>#{order.id}</span>
      <span className={`${styles.badge} ${styles[STATUS_MOD[status]]}`}>
        <span className={styles.badgeDot} />
        {STATUS_LABEL[status] ?? status}
      </span>
    </div>
    <p className={styles.cardProducts}>{products}</p>
    <div className={styles.cardRow}>
      <span className={styles.cardMeta}>
        {new Date(order.createdAt).toLocaleDateString('pt-PT')}
      </span>
      <span className={styles.cardMeta}>
        {order.totalBoxes} cxs
        {order.weightLb ? ` · ${Number(order.weightLb).toFixed(1)} lbs` : ''}
      </span>
    </div>
    <div className={styles.actionsRow}>
      {order.status !== 'PENDING' && order.status !== 'CANCELLED' && (
        <button className={styles.invoiceBtn} onClick={() => openInvoice(order.id)}>
          <IconPdf /> Fatura
        </button>
      )}
    </div>
  </div>
)

/* ── ClientOrders ── */
const ClientOrders = () => {
  const [orders,    setOrders]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  useEffect(() => {
    fetchMyOrders()
      .then(setOrders)
      .catch(() => setError('Erro ao carregar pedidos.'))
      .finally(() => setLoading(false))
  }, [])

  const getProducts = (order) =>
    order.items
      ?.map(i => i.product?.name ?? '—')
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(', ') ?? '—'

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <p className={styles.eyebrow}>Os Meus Pedidos</p>
        <h1 className={styles.title}>Histórico de Pedidos</h1>
      </div>

      {/* Loading / Error */}
      {loading && <p className={styles.stateBox}>A carregar pedidos…</p>}
      {!loading && error && <p className={`${styles.stateBox} ${styles.errorState}`}>{error}</p>}
      {!loading && !error && orders.length === 0 && (
        <p className={styles.stateBox}>Nenhum pedido registado.</p>
      )}

      {/* Desktop table */}
      {!loading && !error && orders.length > 0 && (
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nº Pedido</th>
                  <th>Data</th>
                  <th>Produto(s)</th>
                  <th>Caixas</th>
                  <th>Peso</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const status = order.status ?? 'PENDING'
                  const products = getProducts(order)

                  return (
                    <tr key={order.id}>
                      <td className={styles.orderId}>#{order.id}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString('pt-PT')}</td>
                      <td>{products}</td>
                      <td>{order.totalBoxes}</td>
                      <td>{order.weightLb ? `${Number(order.weightLb).toFixed(1)} lbs` : '—'}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[STATUS_MOD[status]]}`}>
                          <span className={styles.badgeDot} />
                          {STATUS_LABEL[status] ?? status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionsRow}>
                          {order.status !== 'PENDING' && order.status !== 'CANCELLED' && (
                            <button
                              className={styles.invoiceBtn}
                              onClick={() => openInvoice(order.id)}
                            >
                              <IconPdf />
                              Fatura
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile cards */}
      {!loading && !error && orders.length > 0 && (
        <div className={styles.mobileCards}>
          {orders.map(order => {
            const status = order.status ?? 'PENDING'
            return (
              <OrderCard
                key={order.id}
                order={order}
                status={status}
                products={getProducts(order)}
              />
            )
          })}
        </div>
      )}

    </div>
  )
}

export default ClientOrders
