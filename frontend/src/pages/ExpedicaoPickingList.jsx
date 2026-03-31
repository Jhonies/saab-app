import { useState, useEffect } from 'react'
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

  const [order,    setOrder]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [checked,  setChecked]  = useState({})
  const [weight,   setWeight]   = useState('')
  const [acting,   setActing]   = useState(false)
  const [error,    setError]    = useState('')

  const load = () => {
    setLoading(true)
    fetchOrderById(id)
      .then(data => {
        setOrder(data)
        // inicializa checkboxes
        const init = {}
        data.items?.forEach(item => { init[item.id] = false })
        setChecked(init)
      })
      .catch(() => setError('Pedido não encontrado.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const toggleCheck = (itemId) =>
    setChecked(prev => ({ ...prev, [itemId]: !prev[itemId] }))

  const allChecked = order?.items?.length > 0 &&
    Object.values(checked).every(Boolean)

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

  if (loading) return <div className={styles.state}>A carregar...</div>
  if (error && !order) return <div className={styles.state}>{error}</div>

  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: '#888', bg: '#88888818' }

  const readOnly = ['IN_TRANSIT', 'DELIVERED', 'CANCELLED'].includes(order.status)

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
            <span className={styles.metaLabel}>Janela</span>
            <span className={styles.metaValue}>
              {order.deliveryWindowStart} – {order.deliveryWindowEnd}
            </span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Total</span>
            <span className={styles.metaValue}>
              {order.totalBoxes} cx · {order.weightKg > 0 ? `${order.weightKg} kg` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Picking List ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Picking List</h2>

        <div className={styles.tableWrap}>
          <div className={styles.tableHeader}>
            <span />
            <span>Contêiner</span>
            <span>Produto</span>
            <span>Tipo</span>
            <span className={styles.right}>Caixas</span>
            <span className={styles.right}>Peso (kg)</span>
          </div>

          {order.items?.length === 0 && (
            <p className={styles.empty}>Sem itens neste pedido.</p>
          )}

          {order.items?.map(item => (
            <div
              key={item.id}
              className={`${styles.tableRow} ${checked[item.id] ? styles.rowChecked : ''}`}
              onClick={() => !readOnly && toggleCheck(item.id)}
            >
              <span className={styles.checkCell}>
                <span className={`${styles.checkbox} ${checked[item.id] ? styles.checkboxOn : ''}`}>
                  {checked[item.id] && <IconCheck />}
                </span>
              </span>
              <span className={styles.containerLabel}>{item.container?.label ?? '—'}</span>
              <span className={styles.productName}>{item.product?.name ?? '—'}</span>
              <span className={styles.productType}>{item.product?.type ?? '—'}</span>
              <span className={`${styles.num} ${styles.right}`}>{item.quantity}</span>
              <span className={`${styles.num} ${styles.right}`}>
                {item.weightKg > 0 ? `${item.weightKg} kg` : '—'}
              </span>
            </div>
          ))}
        </div>
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
              Marca todos os itens como separados e regista o peso real antes de embalar.
            </p>
            <div className={styles.weightRow}>
              <label className={styles.weightLabel} htmlFor="weight">
                Peso Real (kg)
              </label>
              <input
                id="weight"
                type="number"
                min="0"
                step="0.1"
                className={styles.weightInput}
                placeholder="ex: 42.5"
                value={weight}
                onChange={e => setWeight(e.target.value)}
              />
            </div>
            <button
              className={styles.btnPrimary}
              disabled={acting || !allChecked || !weight}
              onClick={() => handleAction(() => packOrder(id, Number(weight)))}
              title={!allChecked ? 'Marca todos os itens antes de continuar' : ''}
            >
              {acting ? 'A processar...' : 'Marcar como Pronto'}
            </button>
            {!allChecked && (
              <p className={styles.hintWarn}>
                Marca todos os itens da lista antes de continuar.
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

        {readOnly && (
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
