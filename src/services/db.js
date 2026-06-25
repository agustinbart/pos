import { supabase } from '../supabaseClient'

// ========== PRODUCTOS ==========

const COLUMNAS_LISTA = 'id, nombre, codigo_barras, precio_costo, precio_venta, updated_at'
const COLUMNAS_POS = 'id, nombre, codigo_barras, precio_venta'

export const LIMITE_PRODUCTOS_INICIAL = 12
export const LIMITE_BUSQUEDA_INVENTARIO = 50
export const LIMITE_BUSQUEDA_POS = 8
export const MIN_CARACTERES_BUSQUEDA = 2

function sanitizarTerminoBusqueda(termino) {
  return termino.trim().replace(/[%_]/g, '')
}

export const getProductos = async ({ limite = LIMITE_PRODUCTOS_INICIAL, offset = 0 } = {}) => {
  const { data, error } = await supabase
    .from('productos')
    .select(COLUMNAS_LISTA)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limite - 1)

  if (error) throw error
  return data
}

export const getProductoById = async (id) => {
  const { data, error } = await supabase
    .from('productos')
    .select(COLUMNAS_LISTA)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export const getProductoByCodigoBarras = async (codigoBarras) => {
  const { data, error } = await supabase
    .from('productos')
    .select(COLUMNAS_POS)
    .eq('codigo_barras', codigoBarras)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const buscarProductos = async (termino, { limite = LIMITE_BUSQUEDA_INVENTARIO } = {}) => {
  const sanitizado = sanitizarTerminoBusqueda(termino)
  if (!sanitizado) return []

  if (/^\d+$/.test(sanitizado)) {
    const { data, error } = await supabase
      .from('productos')
      .select(COLUMNAS_LISTA)
      .eq('codigo_barras', sanitizado)
      .limit(1)

    if (error) throw error
    if (data?.length) return data
  }

  if (sanitizado.length < MIN_CARACTERES_BUSQUEDA) return []

  const { data, error } = await supabase
    .from('productos')
    .select(COLUMNAS_LISTA)
    .or(`nombre.ilike.%${sanitizado}%,codigo_barras.ilike.%${sanitizado}%`)
    .order('updated_at', { ascending: false })
    .limit(limite)

  if (error) throw error
  return data
}

export const crearProducto = async (producto) => {
  const { data, error } = await supabase
    .from('productos')
    .insert([{
      nombre: producto.nombre,
      codigo_barras: producto.codigo_barras || null,
      precio_costo: producto.precio_costo || null,
      precio_venta: producto.precio_venta,
      updated_at: new Date().toISOString()
    }])
    .select(COLUMNAS_LISTA)
    .single()

  if (error) throw error
  return data
}

export const actualizarProducto = async (id, producto) => {
  const { data, error } = await supabase
    .from('productos')
    .update({
      nombre: producto.nombre,
      codigo_barras: producto.codigo_barras || null,
      precio_costo: producto.precio_costo || null,
      precio_venta: producto.precio_venta,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(COLUMNAS_LISTA)
    .single()

  if (error) throw error
  return data
}

export const eliminarProducto = async (id) => {
  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export const suscribirProductos = (callback) => {
  return supabase
    .channel('productos-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'productos' },
      callback
    )
    .subscribe()
}

// ========== VENTAS ==========

function esCantidadEntera(cantidad) {
  return Math.abs(cantidad - Math.round(cantidad)) < 0.0001
}

export function normalizarLineaVenta({ cantidad, precio_unitario }) {
  const cantidadNum = parseFloat(cantidad)
  const precioNum = parseFloat(precio_unitario)

  if (esCantidadEntera(cantidadNum) && cantidadNum >= 1) {
    return {
      cantidad: Math.round(cantidadNum),
      precio_unitario: precioNum,
    }
  }

  const totalLinea = Math.round(precioNum * cantidadNum * 100) / 100
  return {
    cantidad: 1,
    precio_unitario: totalLinea,
  }
}

export const crearVenta = async (ventaData) => {
  const { detalle, total } = ventaData

  const { data: venta, error: errorVenta } = await supabase
    .from('ventas')
    .insert([{
      total: total,
      created_at: new Date().toISOString()
    }])
    .select('id, total, created_at')
    .single()

  if (errorVenta) throw errorVenta

  try {
    const detalles = []
    for (const item of detalle) {
      let productoId = item.producto_id

      if (item.nombre_personalizado) {
        const producto = await crearProducto({
          nombre: item.nombre_personalizado,
          precio_venta: item.precio_unitario
        })
        productoId = producto.id
      }

      const { cantidad, precio_unitario } = normalizarLineaVenta({
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      })

      detalles.push({
        venta_id: venta.id,
        producto_id: productoId,
        cantidad,
        precio_unitario,
      })
    }

    const { error: errorDetalle } = await supabase
      .from('detalle_ventas')
      .insert(detalles)

    if (errorDetalle) throw errorDetalle
  } catch (error) {
    await supabase.from('ventas').delete().eq('id', venta.id)
    throw error
  }

  return venta
}

export const getVentas = async () => {
  const { data, error } = await supabase
    .from('ventas')
    .select(`
      id,
      created_at,
      total,
      detalle_ventas (
        id,
        cantidad,
        precio_unitario,
        productos (
          nombre,
          codigo_barras
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
