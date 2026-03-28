import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login          from './pages/Login'
import Unauthorized   from './pages/Unauthorized'
import AdminDashboard, { AdminHome } from './pages/AdminDashboard'
import Inventory      from './pages/Inventory'
import OrderEntry     from './pages/OrderEntry'
import Logistics      from './pages/Logistics'
import DriverRoutes   from './pages/DriverRoutes'
import ClientOrders   from './pages/ClientOrders'

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
            <Route path="orders/new"    element={<OrderEntry />} />
            <Route path="logistics"     element={<Logistics />} />
            <Route path="routes"        element={<DriverRoutes />} />
            <Route path="*"             element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* CLIENTE */}
          <Route
            path="/cliente/*"
            element={
              <ProtectedRoute allowedRoles={['CLIENTE']}>
                <Routes>
                  <Route path="orders"     element={<ClientOrders />} />
                  <Route path="orders/new" element={<OrderEntry />} />
                  <Route path="*"          element={<Navigate to="orders" replace />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* MOTORISTA */}
          <Route
            path="/motorista/*"
            element={
              <ProtectedRoute allowedRoles={['MOTORISTA']}>
                <Routes>
                  <Route path="routes" element={<DriverRoutes />} />
                  <Route path="*"      element={<Navigate to="routes" replace />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
