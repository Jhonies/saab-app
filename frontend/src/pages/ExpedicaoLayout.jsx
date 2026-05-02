import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoSaab from '../assets/Logo-saab-S.png'
import ThemeToggle from '../components/ThemeToggle'
import NoticesBanner from '../components/NoticesBanner'

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

const IconNotices = () => (
  <svg className={navIconCls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75
         a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0
         01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
)

const IconGtin = () => (
  <svg className={navIconCls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6v12m4.5-12v12m4.5-12v12m3-12v12m4.5-12v12" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6v12m6-12v12" strokeWidth="3" />
  </svg>
)

const IconStock = () => (
  <svg className={navIconCls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
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

const IconChevron = ({ open }) => (
  <svg
    className={`w-3.5 h-3.5 shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

const NAV_GROUPS = [
  {
    key: 'home',
    title: null,
    icon: IconDashboard,
    items: [
      { key: 'dashboard', label: 'Dashboard', Icon: IconDashboard, path: '/expedicao/dashboard' },
    ]
  },
  {
    key: 'estoque',
    title: 'Estoque',
    icon: IconContainers,
    items: [
      { key: 'stock',      label: 'Estoque',       Icon: IconStock,      path: '/expedicao/stock' },
      { key: 'containers', label: 'Locais',         Icon: IconContainers, path: '/expedicao/containers' },
      { key: 'gtin',       label: 'GTINs',           Icon: IconGtin,       path: '/expedicao/gtin' },
    ]
  },
  {
    key: 'operacional',
    title: 'Operacional',
    icon: IconOrders,
    items: [
      { key: 'orders',    label: 'Pedidos',   Icon: IconOrders,    path: '/expedicao/orders' },
      { key: 'logistics', label: 'Logística', Icon: IconLogistics, path: '/expedicao/logistics' },
      { key: 'routes',    label: 'Rotas',     Icon: IconLogistics, path: '/expedicao/routes' },
    ]
  },
  {
    key: 'geral',
    title: null,
    icon: IconNotices,
    items: [
      { key: 'notices', label: 'Avisos', Icon: IconNotices, path: '/expedicao/notices' },
    ]
  }
]

const PAGE_TITLES = {
  dashboard:   'Dashboard',
  stock:       'Estoque Geral',
  orders:      'Fila de Pedidos',
  containers:  'Locais de Estoque',
  gtin:        'Cadastro de GTIN',
  logistics:   'Logística',
  routes:      'Gestão de Rotas',
  notices:     'Avisos',
}

/* ── Collapsible nav group ── */
const NavGroup = ({ group, activeKey, onNavigate }) => {
  const isTopLevel = !group.title
  const groupHasActive = group.items.some(i => i.key === activeKey)
  const [open, setOpen] = useState(groupHasActive)

  useEffect(() => {
    if (groupHasActive) setOpen(true)
  }, [groupHasActive])

  if (isTopLevel) {
    const item = group.items[0]
    return (
      <button
        className={`flex items-center gap-3 mx-3 px-3 py-2 rounded-md text-[0.8125rem] font-medium cursor-pointer bg-transparent border-0 w-[calc(100%-1.5rem)] text-left transition-all duration-150
          ${activeKey === item.key
            ? 'bg-sidebar-active text-primary'
            : 'text-secondary hover:bg-sidebar-hover hover:text-primary'
          }`}
        onClick={() => onNavigate(item.path)}
      >
        <item.Icon />
        <span>{item.label}</span>
        {activeKey === item.key && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red shrink-0" />
        )}
      </button>
    )
  }

  return (
    <div className="flex flex-col">
      <button
        className="flex items-center gap-3 mx-3 px-3 py-2 rounded-md text-[0.8125rem] font-medium cursor-pointer bg-transparent border-0 w-[calc(100%-1.5rem)] text-left transition-all duration-150 text-secondary hover:bg-sidebar-hover hover:text-primary"
        onClick={() => setOpen(o => !o)}
      >
        <group.icon />
        <span>{group.title}</span>
        <span className="ml-auto"><IconChevron open={open} /></span>
      </button>

      <div
        className="overflow-hidden transition-all duration-200"
        style={{
          maxHeight: open ? `${group.items.length * 40}px` : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="relative ml-[1.6rem] pl-0 mt-0.5 mb-1">
          {/* Vertical guide line */}
          <div className="absolute left-[0.75rem] top-0 bottom-0 w-px bg-border-sidebar" />

          {group.items.map(({ key, label, path }) => (
            <button
              key={key}
              className={`relative flex items-center w-full pl-7 pr-3 py-[0.4rem] text-[0.8125rem] border-0 cursor-pointer bg-transparent text-left transition-all duration-150 rounded-r-md
                ${activeKey === key
                  ? 'text-primary font-medium'
                  : 'text-muted hover:text-primary font-normal'
                }`}
              onClick={() => onNavigate(path)}
            >
              {/* Horizontal tick from guide line */}
              <span
                className={`absolute left-[0.75rem] top-1/2 -translate-y-1/2 h-px w-3 ${
                  activeKey === key ? 'bg-red' : 'bg-border-sidebar'
                }`}
              />
              {/* Active dot */}
              {activeKey === key && (
                <span className="absolute left-[0.625rem] top-1/2 -translate-y-1/2 w-[0.4375rem] h-[0.4375rem] rounded-full bg-red border-2 border-sidebar z-[1]" />
              )}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
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

  const activeKey = (() => {
    if (location.pathname.startsWith('/expedicao/orders'))      return 'orders'
    if (location.pathname.startsWith('/expedicao/stock'))       return 'stock'
    if (location.pathname.startsWith('/expedicao/gtin'))        return 'gtin'
    if (location.pathname.startsWith('/expedicao/containers'))  return 'containers'
    if (location.pathname.startsWith('/expedicao/logistics'))   return 'logistics'
    if (location.pathname.startsWith('/expedicao/routes'))      return 'routes'
    if (location.pathname.startsWith('/expedicao/dashboard'))   return 'dashboard'
    if (location.pathname.startsWith('/expedicao/notices'))     return 'notices'
    return 'dashboard'
  })()

  const handleNav = (path) => {
    navigate(path)
    setSidebarOpen(false)
  }

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
        w-[75vw] max-w-[280px] md:w-[232px] md:min-w-[232px]
        bg-sidebar border-r border-border-sidebar
        flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        h-full md:h-auto
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <img src={logoSaab} alt="SAAB" className="h-8 w-auto object-contain" />
            <span className="text-sm font-semibold tracking-wide" style={{ color: '#eb3138' }}>SAAB Foods</span>
          </div>
          <button
            className="md:hidden p-1.5 text-muted hover:text-primary"
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mx-5 mb-4 h-px bg-border-sidebar" />

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 py-0 overflow-y-auto overflow-x-hidden">
          {NAV_GROUPS.map((group) => (
            <NavGroup
              key={group.key}
              group={group}
              activeKey={activeKey}
              onNavigate={handleNav}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="hidden md:flex flex-col gap-2 px-4 py-4 border-t border-border-sidebar mt-auto">
          <span className="text-[0.6875rem] text-muted truncate px-2">{user?.email}</span>
          <button
            className="flex items-center gap-2.5 w-full bg-transparent border-none px-2 py-2 text-[0.8125rem] text-secondary cursor-pointer transition-all duration-150 rounded-md hover:text-error hover:bg-error-bg"
            onClick={handleLogout}
          >
            <IconLogout />
            <span>Sair</span>
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
              className="flex items-center gap-2 bg-transparent border border-border-input px-3 py-2 text-[0.8125rem] text-secondary cursor-pointer rounded transition-colors duration-150 hover:text-error hover:bg-error-bg hover:border-error md:hidden"
              onClick={handleLogout}
              title="Sair"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
          <NoticesBanner />
        </main>

      </div>
    </div>
  )
}

export default ExpedicaoLayout
