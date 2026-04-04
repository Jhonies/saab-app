import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchOrderById,
  confirmOrder,
  separateOrder,
  packOrder,
} from '../services/orderService'
import styles from './ExpedicaoPickingList.module.css'

const STATUS_CONFIG = {
  PENDING:    { label: 'Pendente',      color: '#b45309', bg: '#b4530918' },
  CONFIRMED:  { label: 'Confirmado',    color: '#888888', bg: '#88888818' },
  SEPARATING: { label: 'Em Separação',  color: '#1a6bb5', bg: '#1a6bb518' },
  READY:      { label: 'Pronto',        color: '#15803d', bg: '#15803d18' },
  IN_TRANSIT: { label: 'Em Trânsito',   color: '#505050', bg: '#50505018' },
  DELIVERED:  { label: 'Entregue',      color: '#15803d', bg: '#15803d18' },
  CANCELLED:  { label: 'Cancelado',     color: '#f87171', bg: '#f8717118' },
}

const fmt = (n) =>
  Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const IconBack = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
)

const IconCheck = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: '0.875rem', height: '0.875rem' }}>
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
        // Initialize box weights and confirmations
        const bwMap = {}
        const bcMap = {}
        data.items?.forEach(item => {
          if (item.priceType === 'PER_LB') {
            bwMap[item.id] = {}
            for (let i = 1; i <= item.quantity; i++) {
              // Pre-fill from existing boxWeights if any
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

  // Calculate subtotals in real-time
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

  // Check if all weights filled and all PER_BOX confirmed
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

    handleAction(() => packOrder(id, itemWeights))
  }

  if (loading) return <div className={styles.state}>A carregar...</div>
  if (error && !order) return <div className={styles.state}>{error}</div>

  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: '#888', bg: '#88888818' }
  const readOnly = ['READY', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].includes(order.status)

  return (
    <div className={styles.page}>

      {/* ── Back ── */}
      <button className={styles.backBtn} onClick={() => navigate('/expedicao/orders')}>
        <IconBack /> Fila de Pedidos
      </button>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.eyebrow}>Pedido</p>
          <h1 className={styles.orderNum}>#{String(order.id).padStart(4, '0')}</h1>
          <span
            className={styles.badge}
            style={{ color: cfg.color, borderColor: cfg.color, backgroundColor: cfg.bg }}
          >
            {cfg.label}
          </span>
        </div>
        <div className={styles.headerMeta}>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Cliente</span>
            <span className={styles.metaValue}>{order.client?.email ?? '—'}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Endereço</span>
            <span className={styles.metaValue}>{order.address || '—'}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Total</span>
            <span className={styles.metaValue}>
              {order.totalBoxes} cx · {order.weightLb > 0 ? `${order.weightLb} lbs` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Picking List ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Picking List</h2>

        {order.items?.length === 0 && (
          <p className={styles.empty}>Sem itens neste pedido.</p>
        )}

        {order.items?.map(item => (
          <div key={item.id} className={styles.pickingItem}>
            <div className={styles.pickingHeader}>
              <span className={styles.containerLabel}>[{item.container?.label ?? '—'}]</span>
              <span className={styles.productName}>{item.product?.name ?? '—'}</span>
              <span className={styles.productType}>{item.product?.type ?? '—'}</span>
              <span className={styles.pickingQty}>
                {item.quantity} cx a {item.priceType === 'PER_LB'
                  ? `${fmt(item.pricePerLb || 0)}/lb`
                  : `${fmt(item.pricePerBox || 0)}/cx`}
              </span>
            </div>

            {item.priceType === 'PER_LB' && order.status === 'SEPARATING' && (
              <div className={styles.boxWeightsGrid}>
                {Array.from({ length: item.quantity }, (_, i) => i + 1).map(boxNum => (
                  <div key={boxNum} className={styles.boxWeightRow}>
                    <label className={styles.boxLabel}>Cx {boxNum} (lbs)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className={styles.weightInput}
                      placeholder="0.0"
                      value={boxWeightsMap[item.id]?.[boxNum] ?? ''}
                      onChange={e => setBoxWeight(item.id, boxNum, e.target.value)}
                    />
                  </div>
                ))}
                <div className={styles.itemSubtotal}>
                  Subtotal: {fmt(itemSubtotals[item.id] || 0)}
                </div>
              </div>
            )}

            {item.priceType === 'PER_LB' && readOnly && (
              <div className={styles.boxWeightsGrid}>
                {item.boxWeights?.map(bw => (
                  <div key={bw.id} className={styles.boxWeightRow}>
                    <span className={styles.boxLabel}>Cx {bw.boxNumber}</span>
                    <span className={styles.boxValue}>{bw.weightLb} lbs</span>
                  </div>
                ))}
                <div className={styles.itemSubtotal}>
                  Subtotal: {fmt(itemSubtotals[item.id] || 0)}
                </div>
              </div>
            )}

            {item.priceType === 'PER_BOX' && order.status === 'SEPARATING' && (
              <div className={styles.boxConfirmRow}>
                <label className={styles.confirmLabel}>
                  <span
                    className={`${styles.checkbox} ${boxConfirmed[item.id] ? styles.checkboxOn : ''}`}
                    onClick={() => toggleBoxConfirm(item.id)}
                  >
                    {boxConfirmed[item.id] && <IconCheck />}
                  </span>
                  Separado — {item.quantity} cxs
                </label>
                <div className={styles.itemSubtotal}>
                  Subtotal: {fmt(itemSubtotals[item.id] || 0)}
                </div>
              </div>
            )}

            {item.priceType === 'PER_BOX' && readOnly && (
              <div className={styles.boxConfirmRow}>
                <span className={styles.boxValue}>{item.quantity} cxs — {fmt(item.quantity * (item.pricePerBox || 0))}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Painel de Acções ── */}
      <div className={styles.actions}>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {order.status === 'PENDING' && (
          <div className={styles.actionPanel}>
            <p className={styles.actionHint}>
              Verifique os dados do pedido antes de confirmar.
            </p>
            <button
              className={styles.btnPrimary}
              disabled={acting}
              onClick={() => handleAction(() => confirmOrder(id))}
            >
              {acting ? 'A processar...' : 'Confirmar Pedido'}
            </button>
          </div>
        )}

        {order.status === 'CONFIRMED' && (
          <div className={styles.actionPanel}>
            <p className={styles.actionHint}>
              Inicia a separação quando estiveres pronto para retirar os itens.
            </p>
            <button
              className={styles.btnPrimary}
              disabled={acting}
              onClick={() => handleAction(() => separateOrder(id))}
            >
              {acting ? 'A processar...' : 'Iniciar Separação'}
            </button>
          </div>
        )}

        {order.status === 'SEPARATING' && (
          <div className={styles.actionPanel}>
            <p className={styles.actionHint}>
              Pesa cada caixa de carnes (por libra) e confirma bebidas/secos antes de embalar.
            </p>
            <button
              className={styles.btnPrimary}
              disabled={acting || !allReady}
              onClick={handlePack}
              title={!allReady ? 'Preencha todos os pesos e confirme todos os itens' : ''}
            >
              {acting ? 'A processar...' : 'Marcar como Pronto'}
            </button>
            {!allReady && (
              <p className={styles.hintWarn}>
                Preencha todos os pesos e confirme todos os itens antes de continuar.
              </p>
            )}
          </div>
        )}

        {order.status === 'READY' && (
          <div className={`${styles.actionPanel} ${styles.actionPanelGreen}`}>
            <p className={styles.actionReady}>
              Pedido embalado e pronto para carga pelo motorista.
            </p>
          </div>
        )}

        {['IN_TRANSIT', 'DELIVERED', 'CANCELLED'].includes(order.status) && (
          <div className={styles.actionPanel}>
            <p className={styles.actionHint}>
              Este pedido encontra-se em estado <strong>{cfg.label}</strong> — sem acções disponíveis.
            </p>
          </div>
        )}

      </div>

    </div>
  )
}

export default ExpedicaoPickingList
