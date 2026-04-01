import { useState, useEffect } from 'react'
import { fetchMyOrders, openInvoice, signOrder } from '../services/orderService'
import SignatureModal from '../components/SignatureModal'
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

const IconSign = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652
         L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685
         a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
)

const IconCheck = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '0.75rem', height: '0.75rem' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

/* ── ClientOrders ── */
const ClientOrders = () => {
  const [orders,    setOrders]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [signModal, setSignModal] = useState(null)

  useEffect(() => {
    fetchMyOrders()
      .then(setOrders)
      .catch(() => setError('Erro ao carregar pedidos.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSigned = (updated) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
    setSignModal(null)
  }

  const canSign = (order) =>
    !order.signature && order.status !== 'PENDING' && order.status !== 'CANCELLED'

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <p className={styles.eyebrow}>Os Meus Pedidos</p>
        <h1 className={styles.title}>Histórico de Pedidos</h1>
      </div>

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
                <th>Assinatura</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className={styles.stateRow}>
                  <td colSpan={8}>A carregar pedidos…</td>
                </tr>
              )}

              {!loading && error && (
                <tr className={`${styles.stateRow} ${styles.errorRow}`}>
                  <td colSpan={8}>{error}</td>
                </tr>
              )}

              {!loading && !error && orders.length === 0 && (
                <tr className={styles.stateRow}>
                  <td colSpan={8}>Nenhum pedido registado.</td>
                </tr>
              )}

              {!loading && !error && orders.map(order => {
                const status = order.status ?? 'PENDING'
                const products = order.items
                  ?.map(i => i.product?.name ?? '—')
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .join(', ') ?? '—'

                return (
                  <tr key={order.id}>
                    <td className={styles.orderId}>#{order.id}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString('pt-PT')}</td>
                    <td>{products}</td>
                    <td>{order.totalBoxes}</td>
                    <td>{order.weightKg ? `${Number(order.weightKg).toFixed(1)} kg` : '—'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[STATUS_MOD[status]]}`}>
                        <span className={styles.badgeDot} />
                        {STATUS_LABEL[status] ?? status}
                      </span>
                    </td>
                    <td>
                      {order.signature ? (
                        <span className={styles.signedBadge}>
                          <IconCheck /> Assinado
                        </span>
                      ) : (
                        <span className={styles.invoiceNA}>Pendente</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionsRow}>
                        {canSign(order) && (
                          <button
                            className={styles.signBtn}
                            onClick={() => setSignModal(order)}
                          >
                            <IconSign />
                            Assinar
                          </button>
                        )}
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

      {signModal && (
        <SignatureModal
          order={signModal}
          onClose={() => setSignModal(null)}
          onDelivered={handleSigned}
          mode="sign"
        />
      )}

    </div>
  )
}

export default ClientOrders
