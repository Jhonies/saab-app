import { useState, useEffect, useMemo } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoSaab from '../assets/Logo-saab-S.png'
import ThemeToggle from '../components/ThemeToggle'
import { fetchOrders } from '../services/orderService'

/* ── Icons ── */
const navIconClass = 'w-[1.125rem] h-[1.125rem] shrink-0 opacity-80'

const IconInventory = () => (
  <svg className={navIconClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5
         M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5
         c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5
         c0 .621.504 1.125 1.125 1.125z" />
  </svg>
)

const IconHome = () => (
  <svg className={navIconClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
)

const IconOrders = () => (
  <svg className={navIconClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
         M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2
         m-6 9l2 2 4-4" />
  </svg>
)

const IconLogistics = () => (
  <svg className={navIconClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
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
  <svg className={navIconClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 6.75V15m6-6v8.25M5.25 3h13.5
         A2.25 2.25 0 0121 5.25v13.5A2.25 2.25 0 0118.75 21H5.25
         A2.25 2.25 0 013 18.75V5.25A2.25 2.25 0 015.25 3z" />
  </svg>
)

const IconProducts = () => (
  <svg className={navIconClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591
         l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223
         c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z
         M6 6h.008v.008H6V6z" />
  </svg>
)

const IconUsers = () => (
  <svg className={navIconClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952
         4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07
         M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766
         l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0
         3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0
         2.625 2.625 0 015.25 0z" />
  </svg>
)

const IconClient = () => (
  <svg className={navIconClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36
         m11.14 0H18.64m-13.28 0v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21
         M3 3h12M3 3v3.75M3 3H1.5m14.25 0v3.75M3 6.75h12m-12 0H1.5m14.25 0H21
         M21 12H1.5m0-5.25V12m0 0v9m19.5-9V6.75M21 12v9" />
  </svg>
)

const IconNotices = () => (
  <svg className={navIconClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75
         a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0
         01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
)

const IconGtin = () => (
  <svg className={navIconClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6v12m4.5-12v12m4.5-12v12m3-12v12m4.5-12v12" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6v12m6-12v12" strokeWidth="3" />
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
  { key: 'inventory', label: 'Estoque',        Icon: IconInventory, path: '/admin/inventory' },
  { key: 'stock',     label: 'Estoque Geral',  Icon: IconInventory, path: '/admin/stock' },
  { key: 'orders',    label: 'Pedidos',   Icon: IconOrders,    path: '/admin/orders/new' },
  { key: 'logistics', label: 'Logística', Icon: IconLogistics, path: '/admin/logistics' },
  { key: 'routes',    label: 'Rotas',     Icon: IconRoutes,    path: '/admin/routes' },
  { key: 'clients', label: 'Clientes', Icon: IconClient, path: '/admin/clients' },
  { key: 'users',       label: 'Utilizadores', Icon: IconUsers,      path: '/admin/users' },
  { key: 'gtin',        label: 'GTINs',       Icon: IconGtin,       path: '/admin/gtin' },
  { key: 'notices',  label: 'Avisos',   Icon: IconNotices, path: '/admin/notices' },
]

const PAGE_TITLES = {
  dashboard: 'Painel de Controle',
  inventory: 'Estoque',
  stock:     'Estoque Geral',
  products:  'Produtos',
  orders:    'Pedidos',
  logistics: 'Logística',
  routes:      'Rotas',
  clients:     'Clientes',
  users:       'Utilizadores',
  gtin:        'Cadastro de GTIN',
  notices:     'Avisos',
}

import NoticesBanner from '../components/NoticesBanner'
import { STATUS_CONFIG, STATUS_FALLBACK } from '../constants/status'

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
    <div className="flex flex-col gap-6 p-6">

      <div className="bg-surface border border-border border-l-4 border-l-red rounded-[6px] p-8 max-w-[640px] shadow-card">
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-red mb-2.5">Painel de Controle</p>
        <h1 className="text-[1.375rem] font-display font-black text-primary mb-3 leading-tight">Bem-vindo ao Sistema de Gestão SAAB</h1>
        <p className="text-sm text-secondary leading-relaxed m-0">
          Acesse o estoque de contêineres, gerencie pedidos de clientes
          e acompanhe as rotas de entrega em tempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-[6px] px-6 py-5 shadow-card">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-secondary mb-1.5">Pedidos Hoje</p>
          <p className="text-2xl font-bold text-primary m-0">{v(kpis.pedidosHoje)}</p>
        </div>
        <div className="bg-surface border border-border rounded-[6px] px-6 py-5 shadow-card">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-secondary mb-1.5">Lbs Entregues Hoje</p>
          <p className="text-2xl font-bold text-primary m-0">{v(kpis.lbsEntreguesHoje)}</p>
        </div>
        <div className="bg-surface border border-border rounded-[6px] px-6 py-5 shadow-card">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-secondary mb-1.5">Prontos para Carga</p>
          <p className="text-2xl font-bold text-ok m-0">{v(kpis.prontos)}</p>
        </div>
        <div className="bg-surface border border-border rounded-[6px] px-6 py-5 shadow-card">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-secondary mb-1.5">Em Separação</p>
          <p className="text-2xl font-bold text-info m-0">{v(kpis.emSeparacao)}</p>
        </div>
        <div className="bg-surface border border-border rounded-[6px] px-6 py-5 shadow-card">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-secondary mb-1.5">Pendentes</p>
          <p className="text-2xl font-bold text-warn m-0">{v(kpis.pendentes)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted m-0">Últimos Pedidos</h2>
        <div className="bg-surface border border-border rounded-[6px] overflow-hidden shadow-card">
          <div className="grid grid-cols-[80px_1fr_140px_130px] gap-2 px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted border-b border-border">
            <span>Pedido</span>
            <span>Cliente</span>
            <span>Status</span>
            <span>Criado em</span>
          </div>
          {loading ? (
            <p className="py-8 px-5 text-sm text-muted m-0">A carregar...</p>
          ) : recentOrders.length === 0 ? (
            <p className="py-8 px-5 text-sm text-muted m-0">Sem pedidos registados.</p>
          ) : (
            recentOrders.map(order => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_FALLBACK
              return (
                <div key={order.id} className="grid grid-cols-[80px_1fr_140px_130px] items-center gap-2 px-5 py-3 border-b border-border last:border-b-0 transition-colors duration-[120ms] hover:bg-hover">
                  <span className="font-mono text-[0.8125rem] font-bold text-secondary">
                    #{String(order.id).padStart(4, '0')}
                  </span>
                  <span className="text-[0.8125rem] text-primary overflow-hidden text-ellipsis whitespace-nowrap pr-2">
                    {order.clientName || order.client?.email || '—'}
                  </span>
                  <span>
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full border text-[0.6875rem] font-semibold uppercase tracking-[0.08em] whitespace-nowrap"
                      style={{ color: cfg.color, borderColor: cfg.color, backgroundColor: cfg.bg }}
                    >
                      {cfg.label}
                    </span>
                  </span>
                  <span className="text-xs text-muted">
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
    : 'AD'

  const activeKey = (() => {
    if (location.pathname.startsWith('/admin/dashboard')) return 'dashboard'
    if (location.pathname.startsWith('/admin/stock'))     return 'stock'
    if (location.pathname.startsWith('/admin/inventory')) return 'inventory'
    if (location.pathname.startsWith('/admin/orders'))    return 'orders'
    if (location.pathname.startsWith('/admin/logistics')) return 'logistics'
    if (location.pathname.startsWith('/admin/routes'))    return 'routes'
    if (location.pathname.startsWith('/admin/products'))     return 'products'
    if (location.pathname.startsWith('/admin/clients'))     return 'clients'
    if (location.pathname.startsWith('/admin/users'))       return 'users'
    if (location.pathname.startsWith('/admin/gtin'))        return 'gtin'
    if (location.pathname.startsWith('/admin/notices'))     return 'notices'
    return 'inventory'
  })()

  return (
    <div className="flex flex-col md:flex-row min-h-svh bg-page">

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
        w-[75vw] max-w-[300px] md:w-60 md:min-w-[240px]
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
            <span className="text-[0.8125rem] text-secondary hidden md:inline">Admin</span>
          </div>
          <button 
            className="md:hidden p-2 text-primary hover:text-secondary"
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-secondary m-0 md:mt-2 hidden md:block">Gestão Logística</p>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 py-4 px-0 overflow-x-visible">
          {NAV_ITEMS.map(({ key, label, Icon, path }) => (
            <button
              key={key}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium text-primary cursor-pointer bg-transparent
                border-0 border-l-[3px] border-transparent w-full text-left
                transition-colors duration-150
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
          <span className="text-xs text-secondary block py-1">{user?.email}</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
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

        {/* Content — child routes render here via <Outlet /> */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
          <NoticesBanner />
        </main>

      </div>
    </div>
  )
}

export default AdminDashboard
