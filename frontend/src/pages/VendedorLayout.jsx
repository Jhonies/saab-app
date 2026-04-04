import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoSaab from '../assets/Logo-saab-S.png'
import ThemeToggle from '../components/ThemeToggle'
import styles from './VendedorLayout.module.css'

const VendedorLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <img src={logoSaab} alt="SAAB" className={styles.brandLogo} />
          <span className={styles.brandTitle}>SAAB — Vendedor</span>
        </div>
        <div className={styles.topbarRight}>
          <ThemeToggle />
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

export default VendedorLayout
