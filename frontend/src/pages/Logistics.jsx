import { useState, useEffect, useMemo } from 'react'
import { fetchOrders, openInvoice, updateOrderStatus, deliverOrder } from '../services/orderService'
import styles from './Logistics.module.css'

/* ────────────────────────────────────────
   Mock de endereços e coordenadas
──────────────────────────────────────── */
const CLIENT_GEO = {
  'frigorifico.norte@saab.com': {
    address: '7600 Dr Phillips Blvd, Orlando, FL',
    lat: 28.4488,
    lon: -81.4940,
  },
  'distribuidora.sul@saab.com': {
    address: '5770 W Irlo Bronson Memorial Hwy, Kissimmee, FL',
    lat: 28.3387,
    lon: -81.4584,
  },
  'supermercado.abc@saab.com': {
    address: '4200 Conroy Rd, Orlando, FL',
    lat: 28.4835,
    lon: -81.4310,
  },
}

const DEFAULT_GEO = { address: 'Orlando, FL', lat: 28.5383, lon: -81.3792 }

const getGeo = (email = '') => CLIENT_GEO[email] ?? DEFAULT_GEO

/* ── Status config ── */
const STATUS_LABEL = {
  PENDING:   'Pendente',
  CONFIRMED: 'Confirmado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
}

const FILTERS = [
  { key: 'ALL',       label: 'Todos'      },
  { key: 'PENDING',   label: 'Pendente'   },
  { key: 'CONFIRMED', label: 'Confirmado' },
  { key: 'DELIVERED', label: 'Entregue'   },
  { key: 'CANCELLED', label: 'Cancelado'  },
]

/* ── Icons ── */
const IconMap = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 6.75V15m6-6v8.25m.503-8.498L18.44 9.75a1.5 1.5 0 002.56-1.06V6.75
         A1.5 1.5 0 0019.5 5.25h-15A1.5 1.5 0 003 6.75v10.5a1.5 1.5 0 001.44 1.499
         l5.56-.926a1.5 1.5 0 001.124-.233l3.872-2.905a1.5 1.5 0 011.124-.233z" />
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

const IconClose = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

/* ── RouteModal ── */
const RouteModal = ({ order, onClose }) => {
  const email = order.client?.email ?? ''
  const geo   = getGeo(email)

  const delta  = 0.04
  const bbox   = `${geo.lon - delta},${geo.lat - delta},${geo.lon + delta},${geo.lat + delta}`
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${geo.lat},${geo.lon}`

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>

        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Rota — Pedido #{order.id}</h2>
            <p className={styles.modalMeta}>{geo.address}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <IconClose />
          </button>
        </div>

        <iframe
          className={styles.mapFrame}
          src={mapSrc}
          title={`Mapa do pedido #${order.id}`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        <div className={styles.modalInfo}>
          <div className={styles.infoCell}>
            <p className={styles.infoLabel}>Cliente</p>
            <p className={styles.infoValue}>{email || '—'}</p>
          </div>
          <div className={styles.infoCell}>
            <p className={styles.infoLabel}>Status</p>
            <p className={styles.infoValue}>{STATUS_LABEL[order.status] ?? order.status}</p>
          </div>
          <div className={styles.infoCell}>
            <p className={styles.infoLabel}>Total (caixas)</p>
            <p className={styles.infoValue}>{order.totalBoxes} {order.items?.some(i => i.container?.zone === 'OPEN_BOX') ? 'un' : 'cxs'}</p>
          </div>
          <div className={styles.infoCell}>
            <p className={styles.infoLabel}>Data</p>
            <p className={styles.infoValue}>
              {new Date(order.createdAt).toLocaleDateString('pt-PT')}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ── Mobile order card ── */
const OrderMobileCard = ({ order, geo, onMap, onInvoice, onConfirm, onCancel, onDeliver }) => {
  const status = order.status ?? 'PENDING'
  const email  = order.client?.email ?? '—'
  const weight = order.weightLb && order.weightLb > 0
    ? `${Number(order.weightLb).toFixed(1)} lbs`
    : null

  return (
    <div className={styles.mobileCard}>
      <div className={styles.mobileCardTop}>
        <span className={styles.mobileOrderId}>#{order.id}</span>
        <span className={`${styles.badge} ${styles[status]}`}>
          <span className={styles.badgeDot} />
          {STATUS_LABEL[status] ?? status}
        </span>
      </div>
      <p className={styles.mobileClient}>{email}</p>
      <p className={styles.mobileAddress}>{geo.address}</p>
      <div className={styles.mobileStats}>
        <span>{order.totalBoxes} cxs</span>
        {weight && <span>{weight}</span>}
        <span>{new Date(order.createdAt).toLocaleDateString('pt-PT')}</span>
      </div>
      <div className={styles.mobileActions}>
        <button className={styles.routeBtn} onClick={onMap}>
          <IconMap /> Rota
        </button>
        {order.status !== 'PENDING' && (
          <button className={`${styles.routeBtn} ${styles.invoiceBtn}`} onClick={onInvoice}>
            <IconPdf /> Invoice
          </button>
        )}
        {order.status === 'PENDING' && (
          <button className={`${styles.routeBtn} ${styles.confirmBtn}`} onClick={onConfirm}>
            Confirmar
          </button>
        )}
        {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
          <button className={`${styles.routeBtn} ${styles.cancelBtn}`} onClick={onCancel}>
            Cancelar
          </button>
        )}
        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
          <button className={`${styles.routeBtn} ${styles.signBtn}`} onClick={onDeliver}>
            <IconSign /> Entregar
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Logistics ── */
const Logistics = () => {
  const [orders,    setOrders]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [activeMap, setActiveMap] = useState(null)
  const [filter,    setFilter]    = useState('ALL')

  const handleStatusChange = async (orderId, status) => {
    try {
      const updated = await updateOrderStatus(orderId, status)
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
    } catch (err) {
      alert(err.response?.data?.message ?? 'Erro ao actualizar status.')
    }
  }

  const handleDeliver = async (orderId) => {
    if (!window.confirm('Confirmar entrega deste pedido?')) return
    try {
      const updated = await deliverOrder(orderId)
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
    } catch (err) {
      alert(err.response?.data?.message ?? 'Erro ao marcar como entregue.')
    }
  }

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch(() => setError('Erro ao carregar pedidos.'))
      .finally(() => setLoading(false))
  }, [])

  const kpis = useMemo(() => ({
    total:    orders.length,
    pending:  orders.filter(o => o.status === 'PENDING').length,
    transit:  orders.filter(o => o.status === 'CONFIRMED').length,
    delivered:orders.filter(o => o.status === 'DELIVERED').length,
  }), [orders])

  const visible = useMemo(
    () => filter === 'ALL' ? orders : orders.filter(o => o.status === filter),
    [orders, filter]
  )

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <h1 className={styles.title}>Logística</h1>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.kpiTotal}`}>
          <p className={styles.kpiLabel}>Total de Pedidos</p>
          <p className={styles.kpiValue}>{loading ? '—' : kpis.total}</p>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiPending}`}>
          <p className={styles.kpiLabel}>Pendentes</p>
          <p className={styles.kpiValue}>{loading ? '—' : kpis.pending}</p>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiTransit}`}>
          <p className={styles.kpiLabel}>Em Trânsito</p>
          <p className={styles.kpiValue}>{loading ? '—' : kpis.transit}</p>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiDelivered}`}>
          <p className={styles.kpiLabel}>Entregues</p>
          <p className={styles.kpiValue}>{loading ? '—' : kpis.delivered}</p>
        </div>
      </div>

      <div className={styles.card}>

        {/* Filter bar */}
        <div className={styles.filterBar}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`${styles.filterBtn} ${filter === f.key ? styles.active : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
          <span className={styles.filterCount}>
            {loading ? '' : `${visible.length} ${visible.length === 1 ? 'pedido' : 'pedidos'}`}
          </span>
        </div>

        {/* Desktop table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Endereço</th>
                <th>Total (cxs)</th>
                <th>Peso (lbs)</th>
                <th>Status</th>
                <th>Data</th>
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
                <tr className={`${styles.stateRow} ${styles.error}`}>
                  <td colSpan={8}>{error}</td>
                </tr>
              )}

              {!loading && !error && visible.length === 0 && (
                <tr className={styles.stateRow}>
                  <td colSpan={8}>
                    {orders.length === 0 ? 'Nenhum pedido registado.' : 'Nenhum pedido com este filtro.'}
                  </td>
                </tr>
              )}

              {!loading && !error && visible.map(order => {
                const email  = order.client?.email ?? '—'
                const geo    = getGeo(email)
                const status = order.status ?? 'PENDING'

                const dateDisplay = status === 'DELIVERED' && order.deliveredAt
                  ? new Date(order.deliveredAt).toLocaleDateString('pt-PT')
                  : new Date(order.createdAt).toLocaleDateString('pt-PT')

                const weightDisplay = order.weightLb && order.weightLb > 0
                  ? `${Number(order.weightLb).toFixed(1)} lbs`
                  : '—'

                return (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{email}</td>
                    <td>{geo.address}</td>
                    <td>{order.totalBoxes}</td>
                    <td>{weightDisplay}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[status]}`}>
                        <span className={styles.badgeDot} />
                        {STATUS_LABEL[status] ?? status}
                      </span>
                    </td>
                    <td>{dateDisplay}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.routeBtn}
                          onClick={() => setActiveMap(order)}
                        >
                          <IconMap />
                          Rota
                        </button>
                        {order.status !== 'PENDING' && (
                          <button
                            className={`${styles.routeBtn} ${styles.invoiceBtn}`}
                            onClick={() => openInvoice(order.id)}
                          >
                            <IconPdf />
                            Invoice
                          </button>
                        )}
                        {order.status === 'PENDING' && (
                          <button
                            className={`${styles.routeBtn} ${styles.confirmBtn}`}
                            onClick={() => handleStatusChange(order.id, 'CONFIRMED')}
                          >
                            Confirmar
                          </button>
                        )}
                        {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                          <button
                            className={`${styles.routeBtn} ${styles.cancelBtn}`}
                            onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                          >
                            Cancelar
                          </button>
                        )}
                        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                          <button
                            className={`${styles.routeBtn} ${styles.signBtn}`}
                            onClick={() => handleDeliver(order.id)}
                          >
                            <IconSign />
                            Entregar
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

        {/* Mobile cards */}
        <div className={styles.mobileList}>
          {loading && <p className={styles.stateMsg}>A carregar pedidos…</p>}
          {!loading && error && <p className={`${styles.stateMsg} ${styles.error}`}>{error}</p>}
          {!loading && !error && visible.length === 0 && (
            <p className={styles.stateMsg}>
              {orders.length === 0 ? 'Nenhum pedido registado.' : 'Nenhum pedido com este filtro.'}
            </p>
          )}
          {!loading && !error && visible.map(order => {
            const email = order.client?.email ?? '—'
            const geo   = getGeo(email)
            return (
              <OrderMobileCard
                key={order.id}
                order={order}
                geo={geo}
                onMap={() => setActiveMap(order)}
                onInvoice={() => openInvoice(order.id)}
                onConfirm={() => handleStatusChange(order.id, 'CONFIRMED')}
                onCancel={() => handleStatusChange(order.id, 'CANCELLED')}
                onDeliver={() => handleDeliver(order.id)}
              />
            )
          })}
        </div>
      </div>

      {activeMap && (
        <RouteModal order={activeMap} onClose={() => setActiveMap(null)} />
      )}

    </div>
  )
}

export default Logistics
