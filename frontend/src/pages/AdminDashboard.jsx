import { useState, useEffect, useMemo } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoSaab from '../assets/Logo-saab-S.png'
import ThemeToggle from '../components/ThemeToggle'
import styles from './AdminDashboard.module.css'
import { fetchOrders } from '../services/orderService'

/* ── Icons ── */
const IconInventory = () => (
  <svg className={styles.navIcon} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5
         M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5
         c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5
         c0 .621.504 1.125 1.125 1.125z" />
  </svg>
)

const IconHome = () => (
  <svg className={styles.navIcon} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
)

const IconOrders = () => (
  <svg className={styles.navIcon} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
         M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2
         m-6 9l2 2 4-4" />
  </svg>
)

const IconLogistics = () => (
  <svg className={styles.navIcon} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375
         a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0
         a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124
         a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25
         M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106
         a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635
         m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>
)

const IconRoutes = () => (
  <svg className={styles.navIcon} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 6.75V15m6-6v8.25M5.25 3h13.5
         A2.25 2.25 0 0121 5.25v13.5A2.25 2.25 0 0118.75 21H5.25
         A2.25 2.25 0 013 18.75V5.25A2.25 2.25 0 015.25 3z" />
  </svg>
)

const IconProducts = () => (
  <svg className={styles.navIcon} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591
         l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223
         c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z
         M6 6h.008v.008H6V6z" />
  </svg>
)

const IconUsers = () => (
  <svg className={styles.navIcon} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952
         4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07
         M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766
         l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0
         3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0
         2.625 2.625 0 015.25 0z" />
  </svg>
)

const IconLogout = () => (
  <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5
         A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15
         M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
)

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Painel',     Icon: IconHome,    path: '/admin/dashboard' },
  { key: 'inventory', label: 'Estoque',   Icon: IconInventory, path: '/admin/inventory' },
  { key: 'orders',    label: 'Pedidos',   Icon: IconOrders,    path: '/admin/orders/new' },
  { key: 'logistics', label: 'Logística', Icon: IconLogistics, path: '/admin/logistics' },
  { key: 'routes',    label: 'Rotas',     Icon: IconRoutes,    path: '/admin/routes' },
  { key: 'users',     label: 'Utilizadores',  Icon: IconUsers,     path: '/admin/users' },
]

const PAGE_TITLES = {
  dashboard: 'Painel de Controlo',
  inventory: 'Estoque',
  products:  'Produtos',
  orders:    'Pedidos',
  logistics: 'Logística',
  routes:    'Rotas',
  users:     'Utilizadores',
}

const STATUS_CONFIG = {
  PENDING:    { label: 'Pendente',      color: '#b45309', bg: '#b4530918' },
  CONFIRMED:  { label: 'Confirmado',    color: '#888888', bg: '#88888818' },
  SEPARATING: { label: 'Em Separação',  color: '#1a6bb5', bg: '#1a6bb518' },
  READY:      { label: 'Pronto',        color: '#15803d', bg: '#15803d18' },
  IN_TRANSIT: { label: 'Em Trânsito',   color: '#1a6bb5', bg: '#1a6bb518' },
  DELIVERED:  { label: 'Entregue',      color: '#15803d', bg: '#15803d18' },
  CANCELLED:  { label: 'Cancelado',     color: '#f87171', bg: '#f8717118' },
}

const isToday = (dateStr) =>
  new Date(dateStr).toDateString() === new Date().toDateString()

/* ── Home panel — rendered at /admin/dashboard ── */
export const AdminHome = () => {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  const kpis = useMemo(() => {
    const today = orders.filter(o => isToday(o.createdAt))
    return {
      pedidosHoje:     today.length,
      lbsEntreguesHoje: orders
        .filter(o => o.status === 'DELIVERED' && o.deliveredAt && isToday(o.deliveredAt))
        .reduce((s, o) => s + (o.weightLb ?? 0), 0)
        .toFixed(1),
      prontos:         orders.filter(o => o.status === 'READY').length,
      emSeparacao:     orders.filter(o => o.status === 'SEPARATING').length,
      pendentes:       orders.filter(o => o.status === 'PENDING').length,
    }
  }, [orders])

  const recentOrders = useMemo(() =>
    [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10),
    [orders]
  )

  const v = (val) => loading ? '—' : val

  return (
    <div className={styles.homeContent}>

      <div className={styles.welcomeCard}>
        <p className={styles.welcomeEyebrow}>Painel de Controlo</p>
        <h1 className={styles.welcomeTitle}>Bem-vindo ao Sistema de Gestão SAAB</h1>
        <p className={styles.welcomeText}>
          Acesse o estoque de contêineres, gerencie pedidos de clientes
          e acompanhe as rotas de entrega em tempo real.
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Pedidos Hoje</p>
          <p className={styles.statValue}>{v(kpis.pedidosHoje)}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Lbs Entregues Hoje</p>
          <p className={styles.statValue}>{v(kpis.lbsEntreguesHoje)}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Prontos para Carga</p>
          <p className={`${styles.statValue} ${styles.statGreen}`}>{v(kpis.prontos)}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Em Separação</p>
          <p className={`${styles.statValue} ${styles.statBlue}`}>{v(kpis.emSeparacao)}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Pendentes</p>
          <p className={`${styles.statValue} ${styles.statWarn}`}>{v(kpis.pendentes)}</p>
        </div>
      </div>

      <div className={styles.recentSection}>
        <h2 className={styles.recentTitle}>Últimos Pedidos</h2>
        <div className={styles.recentTable}>
          <div className={styles.recentHeader}>
            <span>Pedido</span>
            <span>Cliente</span>
            <span>Status</span>
            <span>Criado em</span>
          </div>
          {loading ? (
            <p className={styles.recentEmpty}>A carregar...</p>
          ) : recentOrders.length === 0 ? (
            <p className={styles.recentEmpty}>Sem pedidos registados.</p>
          ) : (
            recentOrders.map(order => {
              const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: '#888', bg: '#88888818' }
              return (
                <div key={order.id} className={styles.recentRow}>
                  <span className={styles.recentId}>
                    #{String(order.id).padStart(4, '0')}
                  </span>
                  <span className={styles.recentEmail}>
                    {order.client?.email ?? '—'}
                  </span>
                  <span>
                    <span
                      className={styles.recentBadge}
                      style={{ color: cfg.color, borderColor: cfg.color, backgroundColor: cfg.bg }}
                    >
                      {cfg.label}
                    </span>
                  </span>
                  <span className={styles.recentMeta}>
                    {new Date(order.createdAt).toLocaleString('pt-PT', {
                      day: '2-digit', month: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

    </div>
  )
}

/* ── Layout shell ── */
const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const location         = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AD'

  const activeKey = (() => {
    if (location.pathname.startsWith('/admin/dashboard')) return 'dashboard'
    if (location.pathname.startsWith('/admin/inventory')) return 'inventory'
    if (location.pathname.startsWith('/admin/orders'))    return 'orders'
    if (location.pathname.startsWith('/admin/logistics')) return 'logistics'
    if (location.pathname.startsWith('/admin/routes'))    return 'routes'
    if (location.pathname.startsWith('/admin/products'))  return 'products'
    if (location.pathname.startsWith('/admin/users'))     return 'users'
    return 'inventory'
  })()

  return (
    <div className={styles.shell}>

      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <img src={logoSaab} alt="SAAB" className={styles.sidebarLogo} />
          <p className={styles.sidebarSubtitle}>Gestão Logística</p>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ key, label, Icon, path }) => (
            <button
              key={key}
              className={`${styles.navItem} ${activeKey === key ? styles.active : ''}`}
              onClick={() => navigate(path)}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <span className={styles.sidebarUser}>{user?.email}</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>

        {/* Topbar */}
        <header className={styles.topbar}>
          <h2 className={styles.topbarTitle}>{PAGE_TITLES[activeKey]}</h2>
          <div className={styles.topbarRight}>
            <ThemeToggle />
            <span className={styles.userEmail}>{user?.email}</span>
            <button className={styles.logoutBtn} onClick={handleLogout} title="Sair">
              Sair
            </button>
          </div>
        </header>

        {/* Content — child routes render here via <Outlet /> */}
        <main className={styles.content}>
          <Outlet />
        </main>

      </div>
    </div>
  )
}

export default AdminDashboard
