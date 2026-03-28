import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoSaab from '../assets/logo-saab.svg'
import styles from './AdminDashboard.module.css'

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

const IconLogout = () => (
  <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5
         A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15
         M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
)

const NAV_ITEMS = [
  { key: 'inventory', label: 'Inventário', Icon: IconInventory, path: '/admin/inventory'  },
  { key: 'orders',    label: 'Pedidos',    Icon: IconOrders,    path: '/admin/orders/new' },
  { key: 'logistics', label: 'Logística',  Icon: IconLogistics, path: '/admin/logistics'  },
  { key: 'routes',    label: 'Rotas',      Icon: IconRoutes,    path: '/admin/routes'     },
]

const PAGE_TITLES = {
  inventory: 'Inventário',
  orders:    'Pedidos',
  logistics: 'Logística',
  routes:    'Rotas',
  dashboard: 'Dashboard',
}

/* ── Home panel — rendered at /admin/dashboard ── */
export const AdminHome = () => (
  <div className={styles.homeContent}>
    <div className={styles.welcomeCard}>
      <p className={styles.welcomeEyebrow}>Painel de Controlo</p>
      <h1 className={styles.welcomeTitle}>
        Bem-vindo ao Sistema de Gestão SAAB
      </h1>
      <p className={styles.welcomeText}>
        Aceda ao inventário de contêineres, gira pedidos de clientes
        e acompanhe as rotas de entrega em tempo real.
      </p>
    </div>

    <div className={styles.statsRow}>
      <div className={styles.statCard}>
        <p className={styles.statLabel}>Contêineres ativos</p>
        <p className={styles.statValue}>—</p>
      </div>
      <div className={styles.statCard}>
        <p className={styles.statLabel}>Pedidos hoje</p>
        <p className={styles.statValue}>—</p>
      </div>
      <div className={styles.statCard}>
        <p className={styles.statLabel}>Rotas em curso</p>
        <p className={styles.statValue}>—</p>
      </div>
    </div>
  </div>
)

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
    if (location.pathname.startsWith('/admin/inventory')) return 'inventory'
    if (location.pathname.startsWith('/admin/orders'))    return 'orders'
    if (location.pathname.startsWith('/admin/logistics')) return 'logistics'
    if (location.pathname.startsWith('/admin/routes'))    return 'routes'
    return 'dashboard'
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
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <IconLogout />
            Terminar sessão
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>

        {/* Topbar */}
        <header className={styles.topbar}>
          <h2 className={styles.topbarTitle}>{PAGE_TITLES[activeKey]}</h2>
          <div className={styles.topbarUser}>
            <span>{user?.email}</span>
            <div className={styles.topbarAvatar}>{initials}</div>
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
