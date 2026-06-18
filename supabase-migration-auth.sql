-- Migración de autenticación y seguridad RLS
-- Ejecuta este script en el SQL Editor de Supabase DESPUÉS de crear usuarios en Authentication

-- ============================================================
-- 1. Eliminar políticas permisivas anteriores
-- ============================================================
DROP POLICY IF EXISTS "Permitir todo en productos" ON productos;
DROP POLICY IF EXISTS "Permitir todo en ventas" ON ventas;
DROP POLICY IF EXISTS "Permitir todo en detalle_ventas" ON detalle_ventas;

-- Por si se ejecuta la migración más de una vez
DROP POLICY IF EXISTS "productos_authenticated" ON productos;
DROP POLICY IF EXISTS "ventas_authenticated" ON ventas;
DROP POLICY IF EXISTS "detalle_ventas_authenticated" ON detalle_ventas;

-- ============================================================
-- 2. Políticas: solo usuarios autenticados (JWT válido)
--    El rol anon sin sesión NO puede leer ni escribir datos.
-- ============================================================
CREATE POLICY "productos_authenticated" ON productos
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ventas_authenticated" ON ventas
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "detalle_ventas_authenticated" ON detalle_ventas
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 3. Revocar acceso directo del rol anon a las tablas
--    (defensa en profundidad; RLS ya bloquea sin JWT)
-- ============================================================
REVOKE ALL ON productos FROM anon;
REVOKE ALL ON ventas FROM anon;
REVOKE ALL ON detalle_ventas FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON productos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ventas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON detalle_ventas TO authenticated;

-- ============================================================
-- PASOS MANUALES EN SUPABASE DASHBOARD:
-- 1. Authentication > Providers > Email: habilitado
-- 2. Authentication > Settings: desactivar "Enable sign ups"
-- 3. Authentication > Email: desactivar "Confirm email" (acceso inmediato)
-- 4. En local, completa .env.local y ejecuta: node scripts/crear-usuario-admin.mjs
--    (crea usuario admin@pos.local con metadata username; login en app solo pide usuario)
-- 5. Authentication > Rate Limits: revisar límites de login
-- ============================================================
