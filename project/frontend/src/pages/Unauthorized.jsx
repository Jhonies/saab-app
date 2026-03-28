import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Unauthorized = () => {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-red-500 mb-4">403</p>
        <h1 className="text-white text-xl font-semibold mb-2">Acesso negado</h1>
        <p className="text-gray-400 text-sm mb-8">Não tem permissão para aceder a esta página.</p>
        <button
          onClick={handleLogout}
          className="bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg px-5 py-2.5 transition-colors"
        >
          Voltar ao Login
        </button>
      </div>
    </div>
  )
}

export default Unauthorized
