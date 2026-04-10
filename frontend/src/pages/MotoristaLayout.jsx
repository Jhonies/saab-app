import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoSaab from '../assets/Logo-saab-S.png'
import ThemeToggle from '../components/ThemeToggle'
import NoticesBanner from '../components/NoticesBanner'

/* ── Icons ── */
const navIconCls = 'w-[1.125rem] h-[1.125rem] shrink-0 opacity-80'

const IconRoutes = () => (
  <svg className={navIconCls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 6.75V15m6-6v8.25M5.25 3h13.5
         A2.25 2.25 0 0121 5.25v13.5A2.25 2.25 0 0118.75 21H5.25
         A2.25 2.25 0 013 18.75V5.25A2.25 2.25 0 015.25 3z" />
  </svg>
)

const IconNotices = () => (
  <svg className={navIconCls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75
         a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0
         01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
)

const IconLogout = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5
         A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15
         M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
)

const NAV_ITEMS = [
  { key: 'routes',  label: 'Rota do Dia', Icon: IconRoutes,  path: '/motorista/routes' },
  { key: 'notices', label: 'Avisos',      Icon: IconNotices,  path: '/motorista/notices' },
]

const MotoristaLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const activeKey = location.pathname.includes('/notices') ? 'notices'
    : location.pathname.includes('/delivery') ? 'delivery' : 'routes'

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <header className="flex items-center justify-between px-5 py-3 bg-surface border-b border-border shrink-0 gap-4">
        <div className="flex items-center gap-2">
          <button
            className="md:hidden p-1.5 -ml-1.5 text-secondary hover:text-primary bg-transparent border-0 cursor-pointer"
            onClick={() => setMenuOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <img src={logoSaab} alt="SAAB" className="h-8 w-auto object-contain" />
          <span className="text-[0.9375rem] font-medium tracking-wide" style={{ color: '#eb3138' }}>SAAB Foods</span>
          <span className="text-[0.9375rem] text-secondary hidden sm:inline">|</span>
          <span className="text-[0.8125rem] text-secondary hidden sm:inline">Motorista</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-xs text-secondary max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap hidden sm:block">
            {user?.email}
          </span>
          <button
            className="flex items-center gap-2 bg-transparent border border-border-input px-3 py-2 text-[0.8125rem] text-secondary cursor-pointer rounded transition-colors duration-150 hover:text-error hover:bg-error-bg hover:border-error"
            onClick={handleLogout}
            title="Sair"
          >
            <span className="hidden sm:inline">Sair</span>
            <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Mobile menu overlay ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ── Mobile slide-out menu ── */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-[75vw] max-w-[300px] bg-sidebar border-r border-border-sidebar
        flex flex-col transition-transform duration-200 md:hidden
        ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between px-5 pt-6 pb-5 border-b border-border-sidebar">
          <div className="flex items-center gap-2">
            <img src={logoSaab} alt="SAAB" className="h-10 w-auto object-contain" />
            <span className="text-[0.9375rem] font-medium tracking-wide" style={{ color: '#eb3138' }}>SAAB Foods</span>
          </div>
          <button
            className="p-2 text-primary hover:text-secondary bg-transparent border-0 cursor-pointer"
            onClick={() => setMenuOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 py-4">
          {NAV_ITEMS.map(({ key, label, Icon, path }) => (
            <button
              key={key}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium text-primary
                border-l-[3px] border-transparent w-full text-left cursor-pointer
                bg-transparent transition-colors duration-150
                hover:bg-sidebar-hover hover:text-nav-hover hover:border-l-border-input
                ${activeKey === key
                  ? 'bg-sidebar-active text-primary !border-l-red'
                  : ''
                }`}
              onClick={() => {
                navigate(path)
                setMenuOpen(false)
              }}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-border-sidebar">
          <span className="text-xs text-secondary block mb-3">{user?.email}</span>
          <button
            className="flex items-center gap-3 w-full bg-transparent border-none px-3 py-2.5 text-[0.8125rem] text-secondary cursor-pointer transition-colors duration-150 rounded hover:text-error hover:bg-error-bg"
            onClick={handleLogout}
          >
            <IconLogout />
            Sair
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
        <NoticesBanner />
      </main>
    </div>
  )
}

export default MotoristaLayout
