# Política de Seguridad

## Variables de Entorno

**NUNCA** subas archivos `.env` o `.env.local` al repositorio. Estos archivos contienen credenciales sensibles y están incluidos en `.gitignore`.

### Configuración en Vercel

Cuando despliegues en Vercel, configura las variables de entorno en:
1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Seguridad de Supabase

### Clave Anónima (Anon Key)

La clave anónima de Supabase está diseñada para ser pública y se expone en el código del cliente. Sin embargo, la seguridad se maneja mediante:

1. **Row Level Security (RLS)**: Las políticas RLS controlan qué datos puede ver/modificar cada usuario
2. **Políticas de Seguridad**: Configuradas en Supabase Dashboard > Authentication > Policies

### Recomendaciones de Seguridad

1. **Habilitar RLS**: Asegúrate de que Row Level Security esté habilitado en todas las tablas
2. **Políticas Restrictivas**: Las políticas actuales permiten todo (`USING (true)`). Para producción, deberías:
   - Implementar autenticación de usuarios
   - Crear políticas basadas en roles de usuario
   - Restringir acceso según necesidades de negocio

3. **Nunca expongas la Service Role Key**: Solo usa la `anon key` en el cliente. La `service_role key` solo debe usarse en el servidor.

## Escaneo de Código de Barras

El escáner de código de barras requiere:
- HTTPS o localhost (requisito del navegador para acceso a cámara)
- Permisos de cámara del usuario

## Dependencias

Todas las dependencias están bloqueadas en `package-lock.json`. Ejecuta `npm audit` regularmente para verificar vulnerabilidades:

```bash
npm audit
npm audit fix
```

## Reportar Problemas de Seguridad

Si encuentras un problema de seguridad, por favor:
1. NO crees un issue público
2. Contacta directamente al mantenedor del proyecto
