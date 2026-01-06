import { useState } from 'react'
import { Package, ShoppingCart } from 'lucide-react'
import Inventario from './components/Inventario'
import PuntoVenta from './components/PuntoVenta'

function App() {
  const [vistaActiva, setVistaActiva] = useState('venta') // 'venta' o 'inventario'

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navegación */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex gap-2">
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
        </div>
      </nav>

      {/* Contenido */}
      <main>
        {vistaActiva === 'venta' ? <PuntoVenta /> : <Inventario />}
      </main>
    </div>
  )
}

export default App
