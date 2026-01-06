import { useEffect, useState } from 'react'
import { BarChart2, TrendingUp, Star } from 'lucide-react'
import { supabase } from '../supabaseClient'

function formatCurrency(num) {
  return num?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }) || '$0'
}

export default function PanelResumen({ refrescar }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalDia, setTotalDia] = useState(0)
  const [masVendido, setMasVendido] = useState(null)

  useEffect(() => { // Se ejecuta también si cambia 'refrescar'
    async function getResumen() {
      setLoading(true)
      setError(null)
      try {
        // === TOTAL DEL DÍA ===
        const startToday = new Date()
        startToday.setHours(0, 0, 0, 0)
        const isoHoy = startToday.toISOString()
        // Ventas de hoy
        const { data: ventas, error: errorVentas } = await supabase
          .from('ventas')
          .select('total, created_at')
          .gte('created_at', isoHoy)
        if (errorVentas) throw errorVentas
        const total = (ventas || []).reduce((acc, venta) => acc + (Number(venta.total) || 0), 0)
        setTotalDia(total)

        // === PRODUCTO MÁS VENDIDO ===
        // 1. Traer sumatoria por producto de detalle_ventas JOIN productos
        // 2. Ordenar por cantidad descendente y tomar el primero
        const { data: detalle, error: errorDetalle } = await supabase
          .from('detalle_ventas')
          .select('producto_id, cantidad, productos (nombre, codigo_barras)')
        if (errorDetalle) throw errorDetalle
        const map = {}
        detalle?.forEach(row => {
          if (!row.producto_id) return
          map[row.producto_id] = map[row.producto_id] || { cantidad: 0, nombre: row.productos?.nombre, codigo_barras: row.productos?.codigo_barras }
          map[row.producto_id].cantidad += row.cantidad
        })
        const productosArr = Object.values(map)
        productosArr.sort((a, b) => b.cantidad - a.cantidad)
        setMasVendido(productosArr[0] || null)
      } catch (err) {
        setError(err.message || 'Error inesperado')
      } finally {
        setLoading(false)
      }
    }
    getResumen()
  }, [refrescar])

  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-5 py-5 flex items-center gap-3">
        <BarChart2 className="h-8 w-8 text-blue-400 flex-shrink-0" />
        <div>
          <div className="text-sm text-gray-400">Total vendido hoy</div>
          {loading ? <div className="text-xl font-bold text-white animate-pulse">Cargando...</div>
          : error ? <div className="text-red-400 text-sm">{error}</div>
          : <div className="text-xl font-bold text-green-400">{formatCurrency(totalDia)}</div>}
        </div>
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-5 py-5 flex items-center gap-3">
        <Star className="h-8 w-8 text-yellow-400 flex-shrink-0" />
        <div>
          <div className="text-sm text-gray-400">Producto más vendido (histórico)</div>
          {loading ? <div className="text-xl font-bold text-white animate-pulse">Cargando...</div>
          : error ? <div className="text-red-400 text-sm">{error}</div>
          : masVendido ? (
            <>
              <div className="text-lg text-white font-semibold">{masVendido.nombre}</div>
              <div className="text-sm text-gray-400">Cantidad: <b>{masVendido.cantidad}</b>{masVendido.codigo_barras ? <> | <span className="text-xs">CB: {masVendido.codigo_barras}</span></> : null}</div>
            </>
          ): <div className="text-gray-400 text-sm">No hay ventas aún</div>
          }
        </div>
      </div>
    </div>
  )
}
