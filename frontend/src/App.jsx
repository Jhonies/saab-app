import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login          from './pages/Login'
import Unauthorized   from './pages/Unauthorized'
import AdminDashboard, { AdminHome } from './pages/AdminDashboard'
import Inventory      from './pages/Inventory'
import OrderEntry     from './pages/OrderEntry'
import Logistics      from './pages/Logistics'
import AdminUsers     from './pages/AdminUsers'
import AdminProducts  from './pages/AdminProducts'
import DriverRoutes    from './pages/DriverRoutes'
import DriverDelivery  from './pages/DriverDelivery'
import MotoristaLayout from './pages/MotoristaLayout'
import ClientOrders   from './pages/ClientOrders'
import ClienteLayout  from './pages/ClienteLayout'
import ExpedicaoLayout      from './pages/ExpedicaoLayout'
import ExpedicaoDashboard   from './pages/ExpedicaoDashboard'
import ExpedicaoOrders      from './pages/ExpedicaoOrders'
import ExpedicaoPickingList from './pages/ExpedicaoPickingList'

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Raiz e login */}
          <Route path="/"      element={<Login />} />
          <Route path="/login" element={<Login />} />

          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ADMIN — AdminDashboard é o layout shell (sidebar + topbar + Outlet) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            <Route index                element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"     element={<AdminHome />} />
            <Route path="inventory"     element={<Inventory />} />
            <Route path="products"      element={<AdminProducts />} />
            <Route path="orders/new"    element={<OrderEntry />} />
            <Route path="logistics"     element={<Logistics />} />
            <Route path="routes"        element={<DriverRoutes />} />
            <Route path="users"         element={<AdminUsers />} />
            <Route path="*"             element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* CLIENTE */}
          <Route
            path="/cliente"
            element={
              <ProtectedRoute allowedRoles={['CLIENTE']}>
                <ClienteLayout />
              </ProtectedRoute>
            }
          >
            <Route index             element={<Navigate to="orders" replace />} />
            <Route path="orders"     element={<ClientOrders />} />
            <Route path="orders/new" element={<OrderEntry />} />
            <Route path="*"          element={<Navigate to="orders" replace />} />
          </Route>

          {/* EXPEDIÇÃO */}
          <Route
            path="/expedicao"
            element={
              <ProtectedRoute allowedRoles={['EXPEDICAO']}>
                <ExpedicaoLayout />
              </ProtectedRoute>
            }
          >
            <Route index                element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"     element={<ExpedicaoDashboard />} />
            <Route path="orders"        element={<ExpedicaoOrders />} />
            <Route path="orders/:id"    element={<ExpedicaoPickingList />} />
            <Route path="containers"    element={<Inventory />} />
            <Route path="*"             element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* MOTORISTA */}
          <Route
            path="/motorista"
            element={
              <ProtectedRoute allowedRoles={['MOTORISTA']}>
                <MotoristaLayout />
              </ProtectedRoute>
            }
          >
            <Route index                    element={<Navigate to="routes" replace />} />
            <Route path="routes"            element={<DriverRoutes />} />
            <Route path="delivery/:id"      element={<DriverDelivery />} />
            <Route path="*"                 element={<Navigate to="routes" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
