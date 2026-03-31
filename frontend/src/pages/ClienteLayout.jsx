import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './ClienteLayout.module.css'

const ClienteLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <div className={styles.brand}>
            <span className={styles.brandEyebrow}>SAAB</span>
            <span className={styles.brandTitle}>Portal do Cliente</span>
          </div>
          <nav className={styles.nav}>
            <NavLink
              to="/cliente/orders"
              end
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Os Meus Pedidos
            </NavLink>
            <NavLink
              to="/cliente/orders/new"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Novo Pedido
            </NavLink>
          </nav>
        </div>
        <div className={styles.topbarRight}>
          <span className={styles.userEmail}>{user?.email}</span>
          <button
            className={styles.logoutBtn}
            onClick={() => { logout(); navigate('/login') }}
          >
            Sair
          </button>
        </div>
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}

export default ClienteLayout
