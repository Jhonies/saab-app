import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchOrders } from '../services/orderService'

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
  CONFIRMED:  { label: 'Confirmado',    color: '#a0a0a0', bg: '#a0a0a025' },
  SEPARATING: { label: 'Em Separação',  color: '#4a4a4a', bg: '#4a4a4a18' },
  READY:      { label: 'Pronto',        color: '#15803d', bg: '#15803d18' },
}

const summariseItems = (items = []) => {
  if (!items.length) return '—'
  const names = items.map(i => i.product?.name ?? '?')
  if (names.length <= 2) return names.join(', ')
  return `${names[0]}, ${names[1]} +${names.length - 2}`
}

/* -- Mobile order card -- */
const OrderMobileCard = ({ order, onProcess }) => {
  const cfg = STATUS_CONFIG[order.status]
  return (
    <div className="bg-surface border border-border rounded-[6px] p-4 flex flex-col gap-2 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[0.8125rem] font-bold text-secondary">
          #{String(order.id).padStart(4, '0')}
        </span>
        <span
          className="inline-block px-2.5 py-0.5 rounded-full border text-[0.6875rem] font-semibold uppercase tracking-[0.08em] whitespace-nowrap"
          style={{ color: cfg.color, borderColor: cfg.color, backgroundColor: cfg.bg }}
        >
          {cfg.label}
        </span>
      </div>
      <p className="text-[0.8125rem] text-primary m-0 overflow-hidden text-ellipsis whitespace-nowrap">
        {order.client?.email ?? '—'}
      </p>
      <p className="text-[0.8rem] text-secondary m-0 overflow-hidden text-ellipsis whitespace-nowrap">
        {summariseItems(order.items)}
      </p>
      <div className="flex items-center justify-between gap-2 mt-1">
        <span className="text-xs text-muted">
          {order.totalBoxes} cxs
          {order.weightLb > 0 ? ` · ${order.weightLb} lbs` : ''}
        </span>
        <button
          className="bg-red border-none rounded px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.05em] text-on-red cursor-pointer whitespace-nowrap transition-colors hover:bg-red-h active:bg-red-a"
          onClick={onProcess}
        >
          Ver / Processar
        </button>
      </div>
    </div>
  )
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
    <div className="p-6 flex flex-col gap-5">

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`flex items-center gap-2 px-3.5 py-[0.45rem] rounded text-[0.8125rem] font-medium cursor-pointer transition-colors ${
                filter === f.key
                  ? 'bg-red border border-red text-on-red'
                  : 'bg-transparent border border-border-input text-secondary hover:border-muted hover:text-primary'
              }`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span
                className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-[0.3rem] rounded-full text-[0.6875rem] font-bold leading-none ${
                  filter === f.key
                    ? 'bg-white/20 text-on-red'
                    : 'bg-input text-secondary'
                }`}
              >
                {f.key === 'ALL'
                  ? orders.length
                  : orders.filter(o => o.status === f.key).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="bg-surface border border-border rounded-[6px] overflow-hidden shadow-card max-md:hidden">
        <div className="grid grid-cols-[80px_1fr_1fr_70px_90px_130px_130px] max-lg:grid-cols-[70px_1fr_100px_90px_130px_120px] items-center px-5 py-2.5 gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted border-b border-border">
          <span>Pedido</span>
          <span>Cliente</span>
          <span className="max-lg:hidden">Produtos</span>
          <span className="text-right">Caixas</span>
          <span className="text-right">Peso (lbs)</span>
          <span>Status</span>
          <span />
        </div>

        {loading ? (
          <p className="py-10 px-5 text-sm text-muted m-0 text-center">A carregar...</p>
        ) : visible.length === 0 ? (
          <p className="py-10 px-5 text-sm text-muted m-0 text-center">Nenhum pedido neste estado.</p>
        ) : (
          visible.map(order => {
            const cfg = STATUS_CONFIG[order.status]
            return (
              <div
                key={order.id}
                className="grid grid-cols-[80px_1fr_1fr_70px_90px_130px_130px] max-lg:grid-cols-[70px_1fr_100px_90px_130px_120px] items-center px-5 py-3.5 gap-2 border-b border-border last:border-b-0 transition-colors hover:bg-hover"
              >
                <span className="font-mono text-[0.8125rem] font-bold text-secondary">
                  #{String(order.id).padStart(4, '0')}
                </span>
                <span className="text-[0.8125rem] text-primary overflow-hidden text-ellipsis whitespace-nowrap">
                  {order.client?.email ?? '—'}
                </span>
                <span className="text-[0.8125rem] text-secondary overflow-hidden text-ellipsis whitespace-nowrap max-lg:hidden">
                  {summariseItems(order.items)}
                </span>
                <span className="text-sm font-semibold text-primary text-right">
                  {order.totalBoxes}
                </span>
                <span className="text-sm font-semibold text-primary text-right">
                  {order.weightLb > 0 ? `${order.weightLb} lbs` : '—'}
                </span>
                <span>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full border text-[0.6875rem] font-semibold uppercase tracking-[0.08em] whitespace-nowrap"
                    style={{ color: cfg.color, borderColor: cfg.color, backgroundColor: cfg.bg }}
                  >
                    {cfg.label}
                  </span>
                </span>
                <span className="flex justify-end">
                  <button
                    className="bg-red border-none rounded px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.05em] text-on-red cursor-pointer whitespace-nowrap transition-colors hover:bg-red-h active:bg-red-a"
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

      {/* Mobile cards */}
      <div className="hidden max-md:flex flex-col gap-3">
        {loading ? (
          <p className="py-10 px-5 text-sm text-muted m-0 text-center">A carregar...</p>
        ) : visible.length === 0 ? (
          <p className="py-10 px-5 text-sm text-muted m-0 text-center">Nenhum pedido neste estado.</p>
        ) : (
          visible.map(order => (
            <OrderMobileCard
              key={order.id}
              order={order}
              onProcess={() => navigate(`/expedicao/orders/${order.id}`)}
            />
          ))
        )}
      </div>

    </div>
  )
}

export default ExpedicaoOrders
