import { useState, useEffect, useRef } from 'react'
import { ShoppingCart, Trash2, Plus, Minus, CheckCircle, Scan } from 'lucide-react'
import { getProductoByCodigoBarras, buscarProductos } from '../services/db'
import { crearVenta } from '../services/db'
import BarcodeScanner from './BarcodeScanner'

export default function PuntoVenta() {
  const [carrito, setCarrito] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [productosEncontrados, setProductosEncontrados] = useState([])
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false)
  const [ventaExitosa, setVentaExitosa] = useState(false)
  const [cargando, setCargando] = useState(false)
  const inputBusquedaRef = useRef(null)
  const [mostrarScanner, setMostrarScanner] = useState(false)
  const busquedaContainerRef = useRef(null)

  useEffect(() => {
    if (busqueda.trim()) {
      buscarProductos(busqueda).then(setProductosEncontrados).catch(console.error)
    } else {
      setProductosEncontrados([])
    }
  }, [busqueda])

  useEffect(() => {
    if (mostrarBusqueda && inputBusquedaRef.current) {
      inputBusquedaRef.current.focus()
    }
  }, [mostrarBusqueda])

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (busquedaContainerRef.current && !busquedaContainerRef.current.contains(event.target)) {
        setMostrarBusqueda(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const agregarAlCarrito = (producto) => {
    const itemExistente = carrito.find(item => item.producto_id === producto.id)
    
    if (itemExistente) {
      setCarrito(carrito.map(item =>
        item.producto_id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ))
    } else {
      setCarrito([...carrito, {
        producto_id: producto.id,
        nombre: producto.nombre,
        precio_unitario: producto.precio_venta,
        cantidad: 1
      }])
    }
    
    setBusqueda('')
    setProductosEncontrados([])
    setMostrarBusqueda(false)
  }

  const escanearCodigoBarras = async (codigo) => {
    if (!codigo.trim()) return
    
    try {
      const producto = await getProductoByCodigoBarras(codigo.trim())
      if (producto) {
        agregarAlCarrito(producto)
      }
    } catch (error) {
      console.error('Error buscando producto:', error)
    }
  }

  const handleBusquedaChange = (e) => {
    const valor = e.target.value
    setBusqueda(valor)
    
    // Si parece un código de barras (solo números, más de 5 dígitos), intentar escanear
    if (/^\d{6,}$/.test(valor)) {
      escanearCodigoBarras(valor)
    }
  }

  const handleScanDetected = (code) => {
    if (!code) return
    setBusqueda(code)
    escanearCodigoBarras(code)
    setMostrarScanner(false)
  }

  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setCarrito(carrito.filter(item => item.producto_id !== productoId))
    } else {
      setCarrito(carrito.map(item =>
        item.producto_id === productoId
          ? { ...item, cantidad: nuevaCantidad }
          : item
      ))
    }
  }

  const eliminarDelCarrito = (productoId) => {
    setCarrito(carrito.filter(item => item.producto_id !== productoId))
  }

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + (item.precio_unitario * item.cantidad), 0)
  }

  const confirmarVenta = async () => {
    if (carrito.length === 0) {
      alert('El carrito está vacío')
      return
    }

    try {
      setCargando(true)
      const total = calcularTotal()
      const detalle = carrito.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario
      }))

      await crearVenta({ detalle, total })
      
      setCarrito([])
      setVentaExitosa(true)
      setTimeout(() => setVentaExitosa(false), 3000)
    } catch (error) {
      console.error('Error procesando venta:', error)
      alert('Error al procesar la venta: ' + error.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2 mb-4">
            <ShoppingCart className="w-8 h-8" />
            Punto de Venta
          </h1>

          {/* Buscador/Escáner */}
          <div className="flex gap-2">
            <div className="relative flex-1" ref={busquedaContainerRef}>
              <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref={inputBusquedaRef}
                type="text"
                placeholder="Escanear código de barras o buscar producto..."
                value={busqueda}
                onChange={handleBusquedaChange}
                onFocus={() => setMostrarBusqueda(true)}
                className="w-full pl-10 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
              
              {/* Resultados de búsqueda */}
              {mostrarBusqueda && productosEncontrados.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg max-h-64 overflow-y-auto shadow-lg">
                  {productosEncontrados.map((producto) => (
                    <button
                      key={producto.id}
                      onClick={() => agregarAlCarrito(producto)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-700 border-b border-gray-700 last:border-b-0 transition-colors"
                    >
                      <div className="text-white font-semibold">{producto.nombre}</div>
                      {producto.codigo_barras && (
                        <div className="text-sm text-gray-400">Código: {producto.codigo_barras}</div>
                      )}
                      <div className="text-green-400 font-semibold">${producto.precio_venta.toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMostrarScanner(true)}
              className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-3 text-white hover:bg-gray-700 border border-gray-700"
            >
              <Scan className="w-5 h-5" />
              Cámara
            </button>
          </div>
        </div>

        {/* Mensaje de venta exitosa */}
        {ventaExitosa && (
          <div className="mb-6 bg-green-600 text-white p-4 rounded-lg flex items-center gap-3 animate-pulse">
            <CheckCircle className="w-6 h-6" />
            <span className="font-semibold text-lg">¡Venta registrada exitosamente!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Carrito */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-white mb-4">Carrito</h2>
              
              {carrito.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  El carrito está vacío
                </div>
              ) : (
                <div className="space-y-3">
                  {carrito.map((item) => (
                    <div
                      key={item.producto_id}
                      className="bg-gray-700 rounded-lg p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg">{item.nombre}</h3>
                        <p className="text-gray-400">${item.precio_unitario.toFixed(2)} c/u</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => actualizarCantidad(item.producto_id, item.cantidad - 1)}
                          className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-lg transition-colors"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="text-white font-semibold text-lg min-w-[3ch] text-center">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => actualizarCantidad(item.producto_id, item.cantidad + 1)}
                          className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-lg transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <span className="text-white font-semibold text-lg min-w-[8ch] text-right">
                          ${(item.precio_unitario * item.cantidad).toFixed(2)}
                        </span>
                        <button
                          onClick={() => eliminarDelCarrito(item.producto_id)}
                          className="p-2 text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Resumen y Confirmar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-white mb-4">Resumen</h2>
              
              <div className="space-y-3 mb-6">
                {carrito.map((item) => (
                  <div key={item.producto_id} className="flex justify-between text-gray-300">
                    <span>{item.nombre} x{item.cantidad}</span>
                    <span>${(item.precio_unitario * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-700 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-white">Total:</span>
                  <span className="text-2xl font-bold text-green-400">
                    ${calcularTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={confirmarVenta}
                disabled={carrito.length === 0 || cargando}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {cargando ? (
                  'Procesando...'
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    Confirmar Venta
                  </>
                )}
              </button>

              {carrito.length > 0 && (
                <button
                  onClick={() => setCarrito([])}
                  className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Limpiar Carrito
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <BarcodeScanner
        isOpen={mostrarScanner}
        onClose={() => setMostrarScanner(false)}
        onDetected={handleScanDetected}
      />
    </div>
  )
}
