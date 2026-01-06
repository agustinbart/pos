import { supabase } from '../supabaseClient'

// ========== PRODUCTOS ==========

export const getProductos = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('updated_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const getProductoById = async (id) => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export const getProductoByCodigoBarras = async (codigoBarras) => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('codigo_barras', codigoBarras)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const buscarProductos = async (termino) => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .or(`nombre.ilike.%${termino}%,codigo_barras.ilike.%${termino}%`)
    .order('updated_at', { ascending: false })
  
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
    .select()
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
    .select()
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

export const crearVenta = async (ventaData) => {
  const { detalle, total } = ventaData
  
  // Iniciar transacción
  const { data: venta, error: errorVenta } = await supabase
    .from('ventas')
    .insert([{
      total: total,
      created_at: new Date().toISOString()
    }])
    .select()
    .single()
  
  if (errorVenta) throw errorVenta
  
  // Crear detalles de venta
  const detalles = detalle.map(item => ({
    venta_id: venta.id,
    producto_id: item.producto_id,
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario
  }))
  
  const { error: errorDetalle } = await supabase
    .from('detalle_ventas')
    .insert(detalles)
  
  if (errorDetalle) {
    // Rollback: eliminar la venta si falla el detalle
    await supabase.from('ventas').delete().eq('id', venta.id)
    throw errorDetalle
  }
  
  return venta
}

export const getVentas = async () => {
  const { data, error } = await supabase
    .from('ventas')
    .select(`
      *,
      detalle_ventas (
        *,
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
