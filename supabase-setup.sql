-- Script de configuración de base de datos para Supabase
-- Ejecuta este script en el SQL Editor de Supabase

-- Tabla productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo_barras TEXT UNIQUE,
  precio_costo DECIMAL(10,2),
  precio_venta DECIMAL(10,2) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla ventas
CREATE TABLE IF NOT EXISTS ventas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total DECIMAL(10,2) NOT NULL
);

-- Tabla detalle_ventas
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_venta_id ON detalle_ventas(venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_producto_id ON detalle_ventas(producto_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS) - Opcional pero recomendado
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_ventas ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajusta según tus necesidades de seguridad)
-- Estas políticas permiten todas las operaciones. Para producción, deberías restringirlas.

DROP POLICY IF EXISTS "Permitir todo en productos" ON productos;
CREATE POLICY "Permitir todo en productos" ON productos FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir todo en ventas" ON ventas;
CREATE POLICY "Permitir todo en ventas" ON ventas FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir todo en detalle_ventas" ON detalle_ventas;
CREATE POLICY "Permitir todo en detalle_ventas" ON detalle_ventas FOR ALL USING (true);
