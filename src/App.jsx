import { useState } from 'react'
import { Package, ShoppingCart, LogOut } from 'lucide-react'
import Inventario from './components/Inventario'
import PuntoVenta from './components/PuntoVenta'
import Login from './components/Login'
import { useAuth } from './contexts/AuthContext'

function App() {
  const { autenticado, cargando, nombreUsuario, cerrarSesion } = useAuth()
  const [vistaActiva, setVistaActiva] = useState('venta')
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [nuevoProductoRequest, setNuevoProductoRequest] = useState(null)

  const abrirNuevoProducto = (codigoBarras = '') => {
    setNuevoProductoRequest({ codigoBarras, key: Date.now() })
    setVistaActiva('inventario')
  }

  const handleCerrarSesion = async () => {
    setCerrandoSesion(true)
    try {
      await cerrarSesion()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      alert('No se pudo cerrar sesión. Intenta de nuevo.')
    } finally {
      setCerrandoSesion(false)
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400 text-lg">Cargando...</p>
      </div>
    )
  }

  if (!autenticado) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => setVistaActiva('venta')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-colors text-lg ${
                  vistaActiva === 'venta'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                Punto de Venta
              </button>
              <button
                onClick={() => setVistaActiva('inventario')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-colors text-lg ${
                  vistaActiva === 'inventario'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Package className="w-5 h-5" />
                Inventario
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className="text-sm text-gray-400 truncate max-w-[200px]">
                {nombreUsuario}
              </span>
              <button
                onClick={handleCerrarSesion}
                disabled={cerrandoSesion}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-5 h-5" />
                {cerrandoSesion ? 'Saliendo...' : 'Salir'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {vistaActiva === 'venta' ? (
          <PuntoVenta onAbrirNuevoProducto={abrirNuevoProducto} />
        ) : (
          <Inventario nuevoProductoRequest={nuevoProductoRequest} />
        )}
      </main>
    </div>
  )
}

export default App
