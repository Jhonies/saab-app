import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoSaab from '../assets/Logo-saab-S.png'
import ThemeToggle from '../components/ThemeToggle'
import styles from './ExpedicaoLayout.module.css'

/* ── Icons ── */
const IconDashboard = () => (
  <svg className={styles.navIcon} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25
         a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z
         M3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18
         a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z
         M13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25
         A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z
         M13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18
         A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
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

const IconContainers = () => (
  <svg className={styles.navIcon} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622
         a2.25 2.25 0 01-2.247-2.118L3.75 7.5
         M10 11.25h4
         M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5
         c0-.621-.504-1.125-1.125-1.125H3.375
         c-.621 0-1.125.504-1.125 1.125v1.5
         c0 .621.504 1.125 1.125 1.125z" />
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
  { key: 'dashboard',  label: 'Dashboard',   Icon: IconDashboard,  path: '/expedicao/dashboard'  },
  { key: 'orders',     label: 'Pedidos',      Icon: IconOrders,     path: '/expedicao/orders'     },
]

const PAGE_TITLES = {
  dashboard:  'Dashboard',
  orders:     'Fila de Pedidos',
}

const ExpedicaoLayout = () => {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const location         = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'EX'

  const activeKey = (() => {
    if (location.pathname.startsWith('/expedicao/orders'))     return 'orders'
    return 'dashboard'
  })()

  return (
    <div className={styles.shell}>

      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <img src={logoSaab} alt="SAAB" className={styles.sidebarLogo} />
          <p className={styles.sidebarSubtitle}>Expedição</p>
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
            Sair
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>

        <header className={styles.topbar}>
          <h2 className={styles.topbarTitle}>{PAGE_TITLES[activeKey]}</h2>
          <div className={styles.topbarUser}>
            <ThemeToggle />
            <span>{user?.email}</span>
            <div className={styles.topbarAvatar}>{initials}</div>
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>

      </div>
    </div>
  )
}

export default ExpedicaoLayout
