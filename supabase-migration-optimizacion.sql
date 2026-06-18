-- Migración de optimización para búsquedas y listados de productos
-- Ejecuta este script en el SQL Editor de Supabase

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_productos_updated_at ON productos (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_productos_nombre_trgm
  ON productos USING gin (nombre gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras_trgm
  ON productos USING gin (codigo_barras gin_trgm_ops);
