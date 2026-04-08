import { useState, useEffect, useMemo } from 'react'
import { fetchOrders, openInvoice, updateOrderStatus, deliverOrder } from '../services/orderService'

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

const DEFAULT_GEO = { address: '6843 Conway Rd Ste 120, Orlando, FL 32812', lat: 28.4626, lon: -81.3305 }

const getGeo = (email = '') => CLIENT_GEO[email] ?? DEFAULT_GEO

/* ── Status config ── */
const STATUS_LABEL = {
  PENDING:   'Pendente',
  CONFIRMED: 'Confirmado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
}

const BADGE_CLASSES = {
  PENDING:   'bg-warn-bg text-warn',
  CONFIRMED: 'bg-info-bg text-info',
  DELIVERED: 'bg-ok-bg text-ok',
  CANCELLED: 'bg-error-bg text-error',
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
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-surface border border-border rounded-lg w-full max-w-[640px] max-h-[90svh] flex flex-col overflow-hidden shadow-elevated">

        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-[0.9rem] font-bold text-primary m-0">Rota — Pedido #{order.id}</h2>
            <p className="text-xs text-muted mt-0.5 mb-0">{ geo.address}</p>
          </div>
          <button
            className="bg-transparent border-none text-muted cursor-pointer p-1 rounded flex items-center transition-colors hover:text-primary"
            onClick={onClose}
            aria-label="Fechar"
          >
            <IconClose />
          </button>
        </div>

        <iframe
          className="w-full h-[380px] border-none block shrink-0"
          src={mapSrc}
          title={`Mapa do pedido #${order.id}`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        <div className="grid grid-cols-2 border-t border-border shrink-0">
          <div className="py-3.5 px-5 border-r border-border">
            <p className="text-[0.625rem] font-bold uppercase tracking-wider text-muted mb-0.5 mt-0">Cliente</p>
            <p className="text-[0.8125rem] text-primary m-0">{email || '—'}</p>
          </div>
          <div className="py-3.5 px-5">
            <p className="text-[0.625rem] font-bold uppercase tracking-wider text-muted mb-0.5 mt-0">Status</p>
            <p className="text-[0.8125rem] text-primary m-0">{STATUS_LABEL[order.status] ?? order.status}</p>
          </div>
          <div className="py-3.5 px-5 border-r border-border">
            <p className="text-[0.625rem] font-bold uppercase tracking-wider text-muted mb-0.5 mt-0">Total (caixas)</p>
            <p className="text-[0.8125rem] text-primary m-0">{order.totalBoxes} {order.items?.some(i => i.container?.zone === 'OPEN_BOX') ? 'un' : 'cxs'}</p>
          </div>
          <div className="py-3.5 px-5">
            <p className="text-[0.625rem] font-bold uppercase tracking-wider text-muted mb-0.5 mt-0">Data</p>
            <p className="text-[0.8125rem] text-primary m-0">
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

  const routeBtnBase = 'inline-flex items-center gap-1.5 bg-transparent border border-border rounded px-3 py-1.5 text-xs font-semibold text-secondary cursor-pointer whitespace-nowrap transition-colors [&_svg]:w-3.5 [&_svg]:h-3.5'

  return (
    <div className="bg-page border border-border rounded-md p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[0.8125rem] font-bold text-secondary">#{order.id}</span>
        <span className={`inline-flex items-center gap-1 text-[0.6875rem] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${BADGE_CLASSES[status] ?? ''}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {STATUS_LABEL[status] ?? status}
        </span>
      </div>
      <p className="text-[0.8125rem] font-semibold text-primary m-0">{email}</p>
      <p className="text-[0.8rem] text-secondary m-0">{geo.address}</p>
      <div className="flex gap-3 text-xs text-muted">
        <span>{order.totalBoxes} cxs</span>
        {weight && <span>{weight}</span>}
        <span>{new Date(order.createdAt).toLocaleDateString('pt-PT')}</span>
      </div>
      <div className="flex gap-2 flex-wrap mt-1">
        <button className={routeBtnBase} onClick={onMap}>
          <IconMap /> Rota
        </button>
        {order.status !== 'PENDING' && (
          <button className={`${routeBtnBase} hover:border-error hover:text-error`} onClick={onInvoice}>
            <IconPdf /> Invoice
          </button>
        )}
        {order.status === 'PENDING' && (
          <button className={`${routeBtnBase} hover:border-ok hover:text-ok`} onClick={onConfirm}>
            Confirmar
          </button>
        )}
        {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
          <button className={`${routeBtnBase} border-red-light text-red hover:bg-red-light hover:text-red`} onClick={onCancel}>
            Cancelar
          </button>
        )}
        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
          <button className={`${routeBtnBase} hover:border-ok hover:text-ok`} onClick={onDeliver}>
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

  const routeBtnBase = 'inline-flex items-center gap-1.5 bg-transparent border border-border rounded px-3 py-1.5 text-xs font-semibold text-secondary cursor-pointer whitespace-nowrap transition-colors [&_svg]:w-3.5 [&_svg]:h-3.5'

  return (
    <div className="p-6 flex flex-col gap-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 max-[480px]:grid-cols-2">
        <div className="bg-surface border border-border rounded-md px-5 py-4 border-t-[3px] border-t-border">
          <p className="text-[0.625rem] font-bold uppercase tracking-wider text-muted mb-1.5 mt-0">Total de Pedidos</p>
          <p className="text-[1.75rem] font-bold text-primary m-0 leading-none">{loading ? '—' : kpis.total}</p>
        </div>
        <div className="bg-surface border border-border rounded-md px-5 py-4 border-t-[3px] border-t-warn">
          <p className="text-[0.625rem] font-bold uppercase tracking-wider text-muted mb-1.5 mt-0">Pendentes</p>
          <p className="text-[1.75rem] font-bold text-primary m-0 leading-none">{loading ? '—' : kpis.pending}</p>
        </div>
        <div className="bg-surface border border-border rounded-md px-5 py-4 border-t-[3px] border-t-info">
          <p className="text-[0.625rem] font-bold uppercase tracking-wider text-muted mb-1.5 mt-0">Em Trânsito</p>
          <p className="text-[1.75rem] font-bold text-primary m-0 leading-none">{loading ? '—' : kpis.transit}</p>
        </div>
        <div className="bg-surface border border-border rounded-md px-5 py-4 border-t-[3px] border-t-ok">
          <p className="text-[0.625rem] font-bold uppercase tracking-wider text-muted mb-1.5 mt-0">Entregues</p>
          <p className="text-[1.75rem] font-bold text-primary m-0 leading-none">{loading ? '—' : kpis.delivered}</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-md overflow-hidden">

        {/* Filter bar */}
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`border rounded-full px-3.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wide cursor-pointer whitespace-nowrap transition-colors ${
                filter === f.key
                  ? 'bg-red border-red text-on-red'
                  : 'bg-transparent border-border text-secondary hover:border-muted hover:text-primary'
              }`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted whitespace-nowrap">
            {loading ? '' : `${visible.length} ${visible.length === 1 ? 'pedido' : 'pedidos'}`}
          </span>
        </div>

        {/* Desktop table */}
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] max-md:hidden">
          <table className="w-full border-collapse text-[0.8125rem]">
            <thead className="bg-hover border-b border-border">
              <tr>
                {['ID', 'Cliente', 'Endereço', 'Total (cxs)', 'Peso (lbs)', 'Status', 'Data', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-secondary whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-12 px-4 text-muted">A carregar pedidos…</td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={8} className="text-center py-12 px-4 text-error">{error}</td>
                </tr>
              )}

              {!loading && !error && visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 px-4 text-muted">
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
                  <tr key={order.id} className="group">
                    <td className="px-4 py-3.5 text-primary border-b border-border align-middle group-last:border-b-0 group-hover:bg-hover">#{order.id}</td>
                    <td className="px-4 py-3.5 text-primary border-b border-border align-middle group-last:border-b-0 group-hover:bg-hover">{email}</td>
                    <td className="px-4 py-3.5 text-primary border-b border-border align-middle group-last:border-b-0 group-hover:bg-hover">{geo.address}</td>
                    <td className="px-4 py-3.5 text-primary border-b border-border align-middle group-last:border-b-0 group-hover:bg-hover">{order.totalBoxes}</td>
                    <td className="px-4 py-3.5 text-primary border-b border-border align-middle group-last:border-b-0 group-hover:bg-hover">{weightDisplay}</td>
                    <td className="px-4 py-3.5 text-primary border-b border-border align-middle group-last:border-b-0 group-hover:bg-hover">
                      <span className={`inline-flex items-center gap-1 text-[0.6875rem] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${BADGE_CLASSES[status] ?? ''}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {STATUS_LABEL[status] ?? status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-primary border-b border-border align-middle group-last:border-b-0 group-hover:bg-hover">{dateDisplay}</td>
                    <td className="px-4 py-3.5 text-primary border-b border-border align-middle group-last:border-b-0 group-hover:bg-hover">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          className={`${routeBtnBase} hover:border-info hover:text-info`}
                          onClick={() => setActiveMap(order)}
                        >
                          <IconMap />
                          Rota
                        </button>
                        {order.status !== 'PENDING' && (
                          <button
                            className={`${routeBtnBase} hover:border-error hover:text-error`}
                            onClick={() => openInvoice(order.id)}
                          >
                            <IconPdf />
                            Invoice
                          </button>
                        )}
                        {order.status === 'PENDING' && (
                          <button
                            className={`${routeBtnBase} hover:border-ok hover:text-ok`}
                            onClick={() => handleStatusChange(order.id, 'CONFIRMED')}
                          >
                            Confirmar
                          </button>
                        )}
                        {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                          <button
                            className={`${routeBtnBase} !border-red-light !text-red hover:!bg-red-light`}
                            onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                          >
                            Cancelar
                          </button>
                        )}
                        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                          <button
                            className={`${routeBtnBase} hover:border-ok hover:text-ok`}
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
        <div className="hidden max-md:flex flex-col gap-3 p-3">
          {loading && <p className="text-center py-10 px-4 text-muted text-sm m-0">A carregar pedidos…</p>}
          {!loading && error && <p className="text-center py-10 px-4 text-error text-sm m-0">{error}</p>}
          {!loading && !error && visible.length === 0 && (
            <p className="text-center py-10 px-4 text-muted text-sm m-0">
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
