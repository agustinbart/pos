-- Ejecuta este script en el SQL Editor de Supabase si prefieres guardar
-- productos genéricos sin crear entradas en inventario.
-- https://supabase.com/dashboard/project/_/sql

ALTER TABLE detalle_ventas ALTER COLUMN producto_id DROP NOT NULL;

ALTER TABLE detalle_ventas ADD COLUMN IF NOT EXISTS nombre_personalizado TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'detalle_producto_o_nombre'
  ) THEN
    ALTER TABLE detalle_ventas ADD CONSTRAINT detalle_producto_o_nombre CHECK (
      producto_id IS NOT NULL OR nombre_personalizado IS NOT NULL
    );
  END IF;
END $$;
