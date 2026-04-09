import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchOrderById,
  confirmOrder,
  separateOrder,
  packOrder,
  openInvoice,
} from '../services/orderService'

import { STATUS_CONFIG, STATUS_FALLBACK } from '../constants/status'

const fmt = (n) =>
  Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const IconBack = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
)

const IconCheck = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

const ExpedicaoPickingList = () => {
  const { id }     = useParams()
  const navigate   = useNavigate()

  const [order,        setOrder]        = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [acting,       setActing]       = useState(false)
  const [error,        setError]        = useState('')

  // Per-item box weights: { [orderItemId]: { [boxNumber]: weightLb string } }
  const [boxWeightsMap, setBoxWeightsMap] = useState({})
  // Per-item PER_BOX confirmation: { [orderItemId]: boolean }
  const [boxConfirmed,  setBoxConfirmed]  = useState({})

  const load = () => {
    setLoading(true)
    fetchOrderById(id)
      .then(data => {
        setOrder(data)
        const bwMap = {}
        const bcMap = {}
        data.items?.forEach(item => {
          if (item.priceType === 'PER_LB') {
            bwMap[item.id] = {}
            for (let i = 1; i <= item.quantity; i++) {
              const existing = item.boxWeights?.find(bw => bw.boxNumber === i)
              bwMap[item.id][i] = existing ? String(existing.weightLb) : ''
            }
          } else {
            bcMap[item.id] = false
          }
        })
        setBoxWeightsMap(bwMap)
        setBoxConfirmed(bcMap)
      })
      .catch(() => setError('Pedido não encontrado.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const setBoxWeight = (itemId, boxNum, value) => {
    setBoxWeightsMap(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [boxNum]: value }
    }))
  }

  const toggleBoxConfirm = (itemId) => {
    setBoxConfirmed(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  const itemSubtotals = useMemo(() => {
    if (!order?.items) return {}
    const result = {}
    for (const item of order.items) {
      if (item.priceType === 'PER_LB') {
        const weights = boxWeightsMap[item.id] || {}
        const totalWeight = Object.values(weights).reduce((s, v) => s + (parseFloat(v) || 0), 0)
        result[item.id] = totalWeight * (item.pricePerLb || 0)
      } else {
        result[item.id] = item.quantity * (item.pricePerBox || 0)
      }
    }
    return result
  }, [order, boxWeightsMap])

  const allReady = useMemo(() => {
    if (!order?.items) return false
    for (const item of order.items) {
      if (item.priceType === 'PER_LB') {
        const weights = boxWeightsMap[item.id] || {}
        for (let i = 1; i <= item.quantity; i++) {
          const val = parseFloat(weights[i])
          if (!val || val <= 0) return false
        }
      } else {
        if (!boxConfirmed[item.id]) return false
      }
    }
    return true
  }, [order, boxWeightsMap, boxConfirmed])

  const handleAction = async (fn) => {
    setActing(true)
    setError('')
    try {
      await fn()
      load()
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Erro ao processar pedido.')
    } finally {
      setActing(false)
    }
  }

  const handlePack = () => {
    const itemWeights = order.items.map(item => {
      if (item.priceType === 'PER_LB') {
        const weights = boxWeightsMap[item.id] || {}
        return {
          orderItemId: item.id,
          boxWeights: Object.entries(weights).map(([boxNum, w]) => ({
            boxNumber: Number(boxNum),
            weightLb:  parseFloat(w) || 0,
          })),
        }
      } else {
        return { orderItemId: item.id, boxWeights: [] }
      }
    })

    handleAction(() => packOrder(id, itemWeights, order.lastStatusAt))
  }

  if (loading) return <div className="py-12 px-6 text-sm text-muted text-center">A carregar...</div>
  if (error && !order) return <div className="py-12 px-6 text-sm text-muted text-center">{error}</div>

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_FALLBACK
  const readOnly = ['READY', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].includes(order.status)

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[900px]">

      {/* ── Back ── */}
      <button
        className="inline-flex items-center gap-2 bg-transparent border-none p-0 text-[0.8125rem] text-secondary cursor-pointer transition-colors duration-150 w-fit hover:text-primary"
        onClick={() => navigate('/expedicao/orders')}
      >
        <IconBack /> Fila de Pedidos
      </button>

      {/* ── Header ── */}
      <div className="bg-surface border border-border border-l-4 border-l-red rounded-md px-6 py-5 flex gap-8 items-start flex-wrap max-md:flex-col max-md:gap-4">
        <div className="flex flex-col gap-2 min-w-[120px]">
          <p className="text-[0.5625rem] font-bold uppercase tracking-[0.25em] text-red m-0">Pedido</p>
          <h1 className="text-[1.75rem] font-bold text-primary m-0 leading-none font-mono">#{String(order.id).padStart(4, '0')}</h1>
          <span
            className="inline-block px-2.5 py-0.5 rounded-full border text-[0.6875rem] font-semibold uppercase tracking-[0.08em] w-fit"
            style={{ color: cfg.color, borderColor: cfg.color, backgroundColor: cfg.bg }}
          >
            {cfg.label}
          </span>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex gap-3 text-[0.8125rem] items-baseline">
            <span className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted min-w-[64px] shrink-0">Cliente</span>
            <span className="text-secondary">{order.client?.email ?? '—'}</span>
          </div>
          <div className="flex gap-3 text-[0.8125rem] items-baseline">
            <span className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted min-w-[64px] shrink-0">Endereço</span>
            <span className="text-secondary">{order.address || '—'}</span>
          </div>
          <div className="flex gap-3 text-[0.8125rem] items-baseline">
            <span className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted min-w-[64px] shrink-0">Total</span>
            <span className="text-secondary">
              {order.totalBoxes} cx · {order.weightLb > 0 ? `${order.weightLb} lbs` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Picking List ── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted m-0">Picking List</h2>

        {order.items?.length === 0 && (
          <p className="py-8 px-5 text-sm text-muted m-0">Sem itens neste pedido.</p>
        )}

        {order.items?.map(item => (
          <div key={item.id} className="bg-surface border border-border rounded-md px-5 py-4 flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sm font-bold text-secondary">[{item.container?.label ?? '—'}]</span>
              <span className="text-sm text-primary">{item.product?.name ?? '—'}</span>
              <span className="text-xs text-secondary">{item.product?.type ?? '—'}</span>
              <span className="text-[0.8125rem] font-semibold text-secondary ml-auto">
                {item.quantity} cx a {item.priceType === 'PER_LB'
                  ? `${fmt(item.pricePerLb || 0)}/lb`
                  : `${fmt(item.pricePerBox || 0)}/cx`}
              </span>
            </div>

            {item.priceType === 'PER_LB' && order.status === 'SEPARATING' && (
              <div className="flex flex-col gap-2 pl-2">
                {Array.from({ length: item.quantity }, (_, i) => i + 1).map(boxNum => (
                  <div key={boxNum} className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-secondary min-w-[80px]">Cx {boxNum} (lbs)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className="bg-input border border-border-input rounded px-3 py-2 text-[0.9375rem] text-primary w-[140px] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted focus:border-red focus:shadow-[0_0_0_3px_rgba(139,0,0,0.22)]"
                      placeholder="0.0"
                      value={boxWeightsMap[item.id]?.[boxNum] ?? ''}
                      onChange={e => setBoxWeight(item.id, boxNum, e.target.value)}
                    />
                  </div>
                ))}
                <div className="text-[0.8125rem] font-bold text-primary text-right pt-1 border-t border-border">
                  Subtotal: {fmt(itemSubtotals[item.id] || 0)}
                </div>
              </div>
            )}

            {item.priceType === 'PER_LB' && readOnly && (
              <div className="flex flex-col gap-2 pl-2">
                {item.boxWeights?.map(bw => (
                  <div key={bw.id} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-secondary min-w-[80px]">Cx {bw.boxNumber}</span>
                    <span className="text-[0.8125rem] text-primary">{bw.weightLb} lbs</span>
                  </div>
                ))}
                <div className="text-[0.8125rem] font-bold text-primary text-right pt-1 border-t border-border">
                  Subtotal: {fmt(itemSubtotals[item.id] || 0)}
                </div>
              </div>
            )}

            {item.priceType === 'PER_BOX' && order.status === 'SEPARATING' && (
              <div className="flex items-center justify-between gap-4 pl-2 flex-wrap">
                <label className="flex items-center gap-2 text-[0.8125rem] text-secondary cursor-pointer">
                  <span
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-[border-color,background-color] duration-150 ${
                      boxConfirmed[item.id]
                        ? 'border-ok bg-ok text-on-red'
                        : 'border-border-input bg-input text-on-red'
                    }`}
                    onClick={() => toggleBoxConfirm(item.id)}
                  >
                    {boxConfirmed[item.id] && <IconCheck />}
                  </span>
                  Separado — {item.quantity} cxs
                </label>
                <div className="text-[0.8125rem] font-bold text-primary text-right pt-1 border-t border-border">
                  Subtotal: {fmt(itemSubtotals[item.id] || 0)}
                </div>
              </div>
            )}

            {item.priceType === 'PER_BOX' && readOnly && (
              <div className="flex items-center justify-between gap-4 pl-2 flex-wrap">
                <span className="text-[0.8125rem] text-primary">{item.quantity} cxs — {fmt(item.quantity * (item.pricePerBox || 0))}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Painel de Acções ── */}
      <div className="flex flex-col gap-3">

        {error && <p className="text-[0.8125rem] text-error bg-error-bg border border-[rgba(139,0,0,0.25)] rounded px-3.5 py-2.5 m-0">{error}</p>}

        {order.status === 'PENDING' && (
          <div className="bg-surface border border-border rounded-md px-6 py-5 flex flex-col gap-4">
            <p className="text-[0.8125rem] text-secondary m-0 leading-relaxed">
              Verifique os dados do pedido antes de confirmar.
            </p>
            <button
              className="bg-red border-none rounded px-6 py-2.5 text-sm font-bold uppercase tracking-[0.06em] text-on-red cursor-pointer w-fit transition-colors duration-[180ms] hover:enabled:bg-red-h active:enabled:bg-red-a disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={acting}
              onClick={() => handleAction(() => confirmOrder(id, order.lastStatusAt))}
            >
              {acting ? 'A processar...' : 'Confirmar Pedido'}
            </button>
          </div>
        )}

        {order.status === 'CONFIRMED' && (
          <div className="bg-surface border border-border rounded-md px-6 py-5 flex flex-col gap-4">
            <p className="text-[0.8125rem] text-secondary m-0 leading-relaxed">
              Inicia a separação quando estiveres pronto para retirar os itens.
            </p>
            <button
              className="bg-red border-none rounded px-6 py-2.5 text-sm font-bold uppercase tracking-[0.06em] text-on-red cursor-pointer w-fit transition-colors duration-[180ms] hover:enabled:bg-red-h active:enabled:bg-red-a disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={acting}
              onClick={() => handleAction(() => separateOrder(id, order.lastStatusAt))}
            >
              {acting ? 'A processar...' : 'Iniciar Separação'}
            </button>
          </div>
        )}

        {order.status === 'SEPARATING' && (
          <div className="bg-surface border border-border rounded-md px-6 py-5 flex flex-col gap-4">
            <p className="text-[0.8125rem] text-secondary m-0 leading-relaxed">
              Pesa cada caixa de carnes (por libra) e confirma bebidas/secos antes de embalar.
            </p>
            <button
              className="bg-red border-none rounded px-6 py-2.5 text-sm font-bold uppercase tracking-[0.06em] text-on-red cursor-pointer w-fit transition-colors duration-[180ms] hover:enabled:bg-red-h active:enabled:bg-red-a disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={acting || !allReady}
              onClick={handlePack}
              title={!allReady ? 'Preencha todos os pesos e confirme todos os itens' : ''}
            >
              {acting ? 'A processar...' : 'Marcar como Pronto'}
            </button>
            {!allReady && (
              <p className="text-xs text-warn m-0">
                Preencha todos os pesos e confirme todos os itens antes de continuar.
              </p>
            )}
          </div>
        )}

        {order.status === 'READY' && (
          <div className="bg-ok-bg border border-ok rounded-md px-6 py-5 flex flex-col gap-4">
            <p className="text-[0.9375rem] font-semibold text-ok m-0">
              Pedido embalado e pronto para carga pelo motorista.
            </p>
            <button
              className="inline-flex items-center gap-2 bg-transparent border border-ok rounded px-5 py-2 text-sm font-bold text-ok cursor-pointer w-fit transition-colors duration-150 hover:bg-ok hover:text-on-red"
              onClick={() => openInvoice(order.id)}
            >
              Ver Invoice (PDF)
            </button>
          </div>
        )}

        {['IN_TRANSIT', 'DELIVERED', 'CANCELLED'].includes(order.status) && (
          <div className="bg-surface border border-border rounded-md px-6 py-5 flex flex-col gap-4">
            <p className="text-[0.8125rem] text-secondary m-0 leading-relaxed">
              Este pedido encontra-se em estado <strong>{cfg.label}</strong> — sem acções disponíveis.
            </p>
          </div>
        )}

      </div>

    </div>
  )
}

export default ExpedicaoPickingList
