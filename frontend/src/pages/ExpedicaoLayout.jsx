import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoSaab from '../assets/Logo-saab-S.png'
import ThemeToggle from '../components/ThemeToggle'

/* ── Icons ── */
const navIconCls = 'w-[1.125rem] h-[1.125rem] shrink-0 opacity-80'

const IconDashboard = () => (
  <svg className={navIconCls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
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
  <svg className={navIconCls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
         M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2
         m-6 9l2 2 4-4" />
  </svg>
)

const IconContainers = () => (
  <svg className={navIconCls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
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

const IconLogistics = () => (
  <svg className={navIconCls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
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

const IconLogout = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5
         A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15
         M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
)

const NAV_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',   Icon: IconDashboard,   path: '/expedicao/dashboard'   },
  { key: 'orders',      label: 'Pedidos',      Icon: IconOrders,      path: '/expedicao/orders'      },
  { key: 'containers',  label: 'Estoque',      Icon: IconContainers,  path: '/expedicao/containers'  },
  { key: 'logistics',   label: 'Logística',    Icon: IconLogistics,   path: '/expedicao/logistics'   },
]

const PAGE_TITLES = {
  dashboard:   'Dashboard',
  orders:      'Fila de Pedidos',
  containers:  'Estoque',
  logistics:   'Logística',
}

const ExpedicaoLayout = () => {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const location         = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'EX'

  const activeKey = (() => {
    if (location.pathname.startsWith('/expedicao/orders'))      return 'orders'
    if (location.pathname.startsWith('/expedicao/containers'))  return 'containers'
    if (location.pathname.startsWith('/expedicao/logistics'))   return 'logistics'
    if (location.pathname.startsWith('/expedicao/dashboard'))   return 'dashboard'
    return 'dashboard'
  })()

  return (
    <div className="flex flex-col md:flex-row min-h-[100svh] bg-page">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed md:relative z-50 md:z-auto
        w-[75vw] max-w-[300px] md:w-[220px] md:min-w-[220px]
        bg-sidebar border-b md:border-b-0 md:border-r border-border-sidebar 
        flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        h-full md:h-auto
      `}>
        <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-1 px-5 pt-6 pb-5 border-b border-border-sidebar">
          <div className="flex items-center gap-2">
            <img src={logoSaab} alt="SAAB" className="h-10 w-auto max-w-[120px] object-contain object-left" />
            <span className="text-[0.9375rem] font-medium tracking-wide" style={{ color: '#eb3138' }}>SAAB Foods</span>
            <span className="text-[0.9375rem] text-secondary hidden md:inline">|</span>
            <span className="text-[0.8125rem] text-secondary hidden md:inline">Expedição</span>
          </div>
          <button 
            className="md:hidden p-2 text-primary hover:text-secondary"
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-secondary m-0 md:mt-2 hidden md:block">Expedição</p>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 py-4 px-0 overflow-x-visible">
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
                setSidebarOpen(false)
              }}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="hidden md:block px-5 py-4 border-t border-border-sidebar mt-auto">
          <button
            className="flex items-center gap-3 w-full bg-transparent border-none px-3 py-2.5 text-[0.8125rem] text-secondary cursor-pointer transition-[color,background-color] duration-150 rounded hover:text-error hover:bg-error-bg"
            onClick={handleLogout}
          >
            <IconLogout />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 text-secondary hover:text-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-[0.9rem] font-semibold text-primary m-0">{PAGE_TITLES[activeKey]}</h2>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-xs text-secondary max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap hidden sm:block">{user?.email}</span>
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

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  )
}

export default ExpedicaoLayout
