import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Plus, Edit, Trash2, Package, Scan } from 'lucide-react'
import {
  getProductos,
  buscarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  suscribirProductos,
  LIMITE_PRODUCTOS_INICIAL,
  LIMITE_BUSQUEDA_INVENTARIO,
  MIN_CARACTERES_BUSQUEDA,
} from '../services/db'

const DEBOUNCE_MS = 300
const DEBOUNCE_SUSCRIPCION_MS = 500

export default function Inventario() {
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [busquedaDebounced, setBusquedaDebounced] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [productoEditando, setProductoEditando] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [hayMas, setHayMas] = useState(false)
  const [busquedaTruncada, setBusquedaTruncada] = useState(false)
  const [scannerTarget, setScannerTarget] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    codigo_barras: '',
    precio_costo: '',
    precio_venta: ''
  })

  const busquedaRef = useRef(busqueda)
  const requestIdRef = useRef(0)
  const debounceSuscripcionRef = useRef(null)

  useEffect(() => {
    busquedaRef.current = busqueda
  }, [busqueda])

  useEffect(() => {
    const timer = setTimeout(() => setBusquedaDebounced(busqueda), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [busqueda])

  const refrescarLista = useCallback(async (termino = busquedaDebounced, { append = false, offset = 0 } = {}) => {
    const requestId = ++requestIdRef.current
    const terminoActivo = termino.trim()
    const esBusqueda = Boolean(terminoActivo)

    try {
      if (append) {
        setCargandoMas(true)
      } else {
        setCargando(true)
      }

      const data = esBusqueda
        ? await buscarProductos(terminoActivo, { limite: LIMITE_BUSQUEDA_INVENTARIO })
        : await getProductos({ limite: LIMITE_PRODUCTOS_INICIAL, offset })

      if (requestId !== requestIdRef.current) return

      if (append) {
        setProductos((prev) => [...prev, ...data])
      } else {
        setProductos(data)
      }

      setHayMas(!esBusqueda && data.length === LIMITE_PRODUCTOS_INICIAL)
      setBusquedaTruncada(esBusqueda && data.length === LIMITE_BUSQUEDA_INVENTARIO)
    } catch (error) {
      if (requestId === requestIdRef.current) {
        console.error('Error cargando productos:', error)
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setCargando(false)
        setCargandoMas(false)
      }
    }
  }, [busquedaDebounced])

  useEffect(() => {
    refrescarLista(busquedaDebounced)
  }, [busquedaDebounced, refrescarLista])

  useEffect(() => {
    const subscription = suscribirProductos(() => {
      clearTimeout(debounceSuscripcionRef.current)
      debounceSuscripcionRef.current = setTimeout(() => {
        refrescarLista(busquedaRef.current)
      }, DEBOUNCE_SUSCRIPCION_MS)
    })

    return () => {
      clearTimeout(debounceSuscripcionRef.current)
      subscription.unsubscribe()
    }
  }, [refrescarLista])

  const cargarMas = async () => {
    await refrescarLista('', { append: true, offset: productos.length })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setCargando(true)
      const productoData = {
        nombre: formData.nombre,
        codigo_barras: formData.codigo_barras || null,
        precio_costo: formData.precio_costo ? parseFloat(formData.precio_costo) : null,
        precio_venta: parseFloat(formData.precio_venta)
      }

      let productoGuardado
      if (productoEditando) {
        productoGuardado = await actualizarProducto(productoEditando.id, productoData)
      } else {
        productoGuardado = await crearProducto(productoData)
      }

      resetFormulario()

      if (busquedaDebounced.trim()) {
        refrescarLista(busquedaDebounced)
      } else if (productoEditando) {
        setProductos((prev) =>
          prev.map((p) => (p.id === productoGuardado.id ? productoGuardado : p))
        )
      } else {
        setProductos((prev) => {
          if (prev.length >= LIMITE_PRODUCTOS_INICIAL) {
            setHayMas(true)
          }
          return [productoGuardado, ...prev].slice(0, LIMITE_PRODUCTOS_INICIAL)
        })
      }
    } catch (error) {
      console.error('Error guardando producto:', error)
      alert('Error al guardar producto: ' + error.message)
    } finally {
      setCargando(false)
    }
  }

  const handleEditar = (producto) => {
    setProductoEditando(producto)
    setFormData({
      nombre: producto.nombre || '',
      codigo_barras: producto.codigo_barras || '',
      precio_costo: producto.precio_costo?.toString() || '',
      precio_venta: producto.precio_venta?.toString() || ''
    })
    setMostrarFormulario(true)
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return

    try {
      setCargando(true)
      await eliminarProducto(id)

      if (busquedaDebounced.trim()) {
        refrescarLista(busquedaDebounced)
      } else {
        setProductos((prev) => prev.filter((p) => p.id !== id))
      }
    } catch (error) {
      console.error('Error eliminando producto:', error)
      alert('Error al eliminar producto: ' + error.message)
    } finally {
      setCargando(false)
    }
  }

  const resetFormulario = () => {
    setFormData({
      nombre: '',
      codigo_barras: '',
      precio_costo: '',
      precio_venta: ''
    })
    setProductoEditando(null)
    setMostrarFormulario(false)
  }

  const handleScan = (code) => {
    if (!code) return
    if (scannerTarget === 'busqueda') {
      setBusqueda(code)
    } else if (scannerTarget === 'producto') {
      setFormData((prev) => ({ ...prev, codigo_barras: code }))
    }
    setScannerTarget(null)
  }

  const busquedaMuyCorta = busquedaDebounced.trim().length > 0
    && busquedaDebounced.trim().length < MIN_CARACTERES_BUSQUEDA
    && !/^\d+$/.test(busquedaDebounced.trim())

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Package className="w-8 h-8" />
            Inventario
          </h1>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors text-lg"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </button>
        </div>

        <div className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre o código de barras..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
            </div>
          </div>
          {!busquedaDebounced.trim() && (
            <p className="mt-2 text-sm text-gray-400">
              Mostrando los {LIMITE_PRODUCTOS_INICIAL} productos más recientes. Usa el buscador para encontrar cualquier producto.
            </p>
          )}
          {busquedaMuyCorta && (
            <p className="mt-2 text-sm text-gray-400">
              Escribe al menos {MIN_CARACTERES_BUSQUEDA} caracteres para buscar por nombre.
            </p>
          )}
          {busquedaTruncada && (
            <p className="mt-2 text-sm text-amber-400">
              Mostrando los primeros {LIMITE_BUSQUEDA_INVENTARIO} resultados. Refina tu búsqueda para ver menos opciones.
            </p>
          )}
        </div>

        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-4">
                {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Código de Barras</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.codigo_barras}
                      onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setScannerTarget('producto')}
                      className="px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
                    >
                      <Scan className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Precio de Costo</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio_costo}
                    onChange={(e) => setFormData({ ...formData, precio_costo: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Precio de Venta *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.precio_venta}
                    onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={cargando}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors text-lg disabled:opacity-50"
                  >
                    {cargando ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={resetFormulario}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors text-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {cargando && productos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Cargando productos...</div>
        ) : busquedaMuyCorta ? (
          <div className="text-center py-12 text-gray-400">
            Sigue escribiendo para buscar productos
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {busquedaDebounced ? 'No se encontraron productos' : 'No hay productos registrados'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productos.map((producto) => (
                <div
                  key={producto.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-white">{producto.nombre}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditar(producto)}
                        className="p-2 text-blue-400 hover:bg-gray-700 rounded transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEliminar(producto.id)}
                        className="p-2 text-red-400 hover:bg-gray-700 rounded transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  {producto.codigo_barras && (
                    <p className="text-sm text-gray-400 mb-2">
                      Código: {producto.codigo_barras}
                    </p>
                  )}
                  <div className="space-y-1">
                    {producto.precio_costo && (
                      <p className="text-sm text-gray-400">
                        Costo: ${producto.precio_costo.toFixed(2)}
                      </p>
                    )}
                    <p className="text-lg font-bold text-green-400">
                      Venta: ${producto.precio_venta.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {hayMas && !busquedaDebounced.trim() && (
              <div className="mt-6 text-center">
                <button
                  onClick={cargarMas}
                  disabled={cargandoMas}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {cargandoMas ? 'Cargando...' : 'Cargar más productos'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
