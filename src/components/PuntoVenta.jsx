import { useState, useEffect, useRef } from 'react'
import { ShoppingCart, Trash2, Plus, Minus, CheckCircle, Scan, Tag, PackagePlus, AlertCircle } from 'lucide-react'
import { getProductoByCodigoBarras, buscarProductos, LIMITE_BUSQUEDA_POS } from '../services/db'
import { crearVenta } from '../services/db'

import PanelResumen from './PanelResumen'

function formatearCantidad(cantidad) {
  return Number(parseFloat(cantidad).toFixed(3)).toString()
}

export default function PuntoVenta({ onAbrirNuevoProducto }) {
  const [carrito, setCarrito] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [busquedaDebounced, setBusquedaDebounced] = useState('')
  const [productosEncontrados, setProductosEncontrados] = useState([])
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false)
  const [ventaExitosa, setVentaExitosa] = useState(false)
  const [conteoRefrescar, setConteoRefrescar] = useState(0)
  const [cargando, setCargando] = useState(false)
  const inputBusquedaRef = useRef(null)
  const busquedaContainerRef = useRef(null)
  const [mostrarProductoGenerico, setMostrarProductoGenerico] = useState(false)
  const [productoGenerico, setProductoGenerico] = useState({ nombre: '', precio: '' })
  const [pagaCon, setPagaCon] = useState('')
  const [cantidadEditando, setCantidadEditando] = useState({})
  const [avisoCodigoBarras, setAvisoCodigoBarras] = useState(null)
  const inputNombreGenericoRef = useRef(null)
  const busquedaRequestIdRef = useRef(0)
  const avisoTimeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (avisoTimeoutRef.current) clearTimeout(avisoTimeoutRef.current)
    }
  }, [])

  const mostrarAvisoCodigoBarras = (codigo) => {
    if (avisoTimeoutRef.current) clearTimeout(avisoTimeoutRef.current)
    setAvisoCodigoBarras(codigo)
    avisoTimeoutRef.current = setTimeout(() => setAvisoCodigoBarras(null), 5000)
  }

  const limpiarBusqueda = () => {
    setBusqueda('')
    setProductosEncontrados([])
    setMostrarBusqueda(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => setBusquedaDebounced(busqueda), 300)
    return () => clearTimeout(timer)
  }, [busqueda])

  useEffect(() => {
    const termino = busquedaDebounced.trim()
    if (!termino) {
      setProductosEncontrados([])
      return
    }

    const requestId = ++busquedaRequestIdRef.current
    buscarProductos(termino, { limite: LIMITE_BUSQUEDA_POS })
      .then((data) => {
        if (requestId === busquedaRequestIdRef.current) {
          setProductosEncontrados(data)
        }
      })
      .catch(console.error)
  }, [busquedaDebounced])

  useEffect(() => {
    if (mostrarProductoGenerico && inputNombreGenericoRef.current) {
      inputNombreGenericoRef.current.focus()
    }
  }, [mostrarProductoGenerico])

  useEffect(() => {
    if (mostrarBusqueda && inputBusquedaRef.current) {
      inputBusquedaRef.current.focus()
    }
  }, [mostrarBusqueda])

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

  const enfocarInputBusqueda = () => {
    setTimeout(() => {
      inputBusquedaRef.current?.focus()
    }, 0)
  }

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
        id: producto.id,
        producto_id: producto.id,
        nombre: producto.nombre,
        precio_unitario: producto.precio_venta,
        cantidad: 1,
        esGenerico: false
      }])
    }
    
    limpiarBusqueda()
  }

  const agregarProductoGenerico = (e) => {
    e.preventDefault()
    const nombre = productoGenerico.nombre.trim()
    const precio = parseFloat(productoGenerico.precio)

    if (!nombre) {
      alert('Ingresa un nombre para el producto')
      return
    }
    if (isNaN(precio) || precio <= 0) {
      alert('Ingresa un precio válido mayor a 0')
      return
    }

    setCarrito([...carrito, {
      id: crypto.randomUUID(),
      producto_id: null,
      nombre,
      precio_unitario: precio,
      cantidad: 1,
      esGenerico: true
    }])

    setProductoGenerico({ nombre: '', precio: '' })
    setMostrarProductoGenerico(false)
  }

  const escanearCodigoBarras = async (codigo) => {
    const codigoLimpio = codigo.trim()
    if (!codigoLimpio) return

    try {
      const producto = await getProductoByCodigoBarras(codigoLimpio)
      if (producto) {
        agregarAlCarrito(producto)
        enfocarInputBusqueda()
      } else {
        mostrarAvisoCodigoBarras(codigoLimpio)
        limpiarBusqueda()
        enfocarInputBusqueda()
      }
    } catch (error) {
      console.error('Error buscando producto:', error)
      mostrarAvisoCodigoBarras(codigoLimpio)
      limpiarBusqueda()
      enfocarInputBusqueda()
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
  }

  const actualizarCantidad = (itemId, nuevaCantidad) => {
    const cantidad = parseFloat(nuevaCantidad)
    if (isNaN(cantidad) || cantidad <= 0) {
      setCarrito(carrito.filter(item => item.id !== itemId))
    } else {
      setCarrito(carrito.map(item =>
        item.id === itemId
          ? { ...item, cantidad }
          : item
      ))
    }
  }

  const handleCantidadBlur = (itemId, valor) => {
    const cantidad = parseFloat(valor)
    if (!isNaN(cantidad) && cantidad > 0) {
      actualizarCantidad(itemId, cantidad)
    }
    setCantidadEditando((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
  }

  const eliminarDelCarrito = (itemId) => {
    setCarrito(carrito.filter(item => item.id !== itemId))
  }

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + (item.precio_unitario * item.cantidad), 0)
  }

  const total = calcularTotal()
  const montoPagaCon = parseFloat(pagaCon) || 0
  const cambio = montoPagaCon > 0 ? Math.max(0, montoPagaCon - total) : 0

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
        nombre_personalizado: item.esGenerico ? item.nombre : null,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario
      }))

      await crearVenta({ detalle, total })
      
      setCarrito([])
      setPagaCon('')
      setVentaExitosa(true)
      setConteoRefrescar(c => c + 1)
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
        <PanelResumen refrescar={conteoRefrescar} />
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
              onClick={() => setMostrarProductoGenerico(true)}
              className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-3 text-white hover:bg-gray-700 border border-gray-700 whitespace-nowrap"
            >
              <Tag className="w-5 h-5" />
              Genérico
            </button>
          </div>
        </div>

        {avisoCodigoBarras && (
          <div className="mb-4 bg-amber-900/60 border border-amber-600 text-amber-100 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Producto no encontrado</p>
                <p className="text-sm text-amber-200/90">
                  No existe un producto con el código <span className="font-mono">{avisoCodigoBarras}</span>
                </p>
              </div>
            </div>
          </div>
        )}

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
                      key={item.id}
                      className="bg-gray-700 rounded-lg p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg">{item.nombre}</h3>
                        {item.esGenerico && (
                          <span className="text-xs text-amber-400 uppercase tracking-wide">Genérico</span>
                        )}
                        <p className="text-gray-400">${item.precio_unitario.toFixed(2)} c/u</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => actualizarCantidad(item.id, Math.max(0.001, item.cantidad - 1))}
                          className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-lg transition-colors"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={cantidadEditando[item.id] ?? formatearCantidad(item.cantidad)}
                          onFocus={() =>
                            setCantidadEditando((prev) => ({
                              ...prev,
                              [item.id]: formatearCantidad(item.cantidad),
                            }))
                          }
                          onChange={(e) =>
                            setCantidadEditando((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          onBlur={(e) => handleCantidadBlur(item.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur()
                          }}
                          className="w-20 px-2 py-1 bg-gray-600 border border-gray-500 rounded-lg text-white font-semibold text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                          className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-lg transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <span className="text-white font-semibold text-lg min-w-[8ch] text-right">
                          ${(item.precio_unitario * item.cantidad).toFixed(2)}
                        </span>
                        <button
                          onClick={() => eliminarDelCarrito(item.id)}
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
                  <div key={item.id} className="flex justify-between text-gray-300">
                    <span>{item.nombre} x{formatearCantidad(item.cantidad)}</span>
                    <span>${(item.precio_unitario * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-700 pt-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-white">Total:</span>
                  <span className="text-2xl font-bold text-green-400">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mb-6 space-y-3">
                <div>
                  <label htmlFor="paga-con" className="block text-gray-300 mb-2">
                    Paga con
                  </label>
                  <input
                    id="paga-con"
                    type="number"
                    step="0.01"
                    min="0"
                    value={pagaCon}
                    onChange={(e) => setPagaCon(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-white">Cambio:</span>
                  <span className={`text-xl font-bold ${montoPagaCon > 0 && montoPagaCon < total ? 'text-red-400' : 'text-blue-400'}`}>
                    {montoPagaCon > 0 && montoPagaCon < total
                      ? `Faltan $${(total - montoPagaCon).toFixed(2)}`
                      : `$${cambio.toFixed(2)}`}
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
                  onClick={() => {
                    setCarrito([])
                    setPagaCon('')
                  }}
                  className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Limpiar Carrito
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {mostrarProductoGenerico && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Producto genérico</h2>
            <form onSubmit={agregarProductoGenerico} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Nombre *</label>
                <input
                  ref={inputNombreGenericoRef}
                  type="text"
                  required
                  value={productoGenerico.nombre}
                  onChange={(e) => setProductoGenerico({ ...productoGenerico, nombre: e.target.value })}
                  placeholder="Ej: Servicio, artículo suelto..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Precio *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={productoGenerico.precio}
                  onChange={(e) => setProductoGenerico({ ...productoGenerico, precio: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setProductoGenerico({ nombre: '', precio: '' })
                    setMostrarProductoGenerico(false)
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Agregar al carrito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
