# Sistema de Gestión de Almacén - MVP

Sistema de gestión de inventario y punto de venta desarrollado con React, Vite, Tailwind CSS y Supabase.

## Características

- ✅ CRUD completo de productos
- ✅ Búsqueda de productos por nombre o código de barras
- ✅ Punto de venta con carrito de compras
- ✅ Escaneo de código de barras
- ✅ Diseño responsive (Mobile First)
- ✅ Modo oscuro
- ✅ Suscripciones en tiempo real con Supabase

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

Puedes copiar el archivo `.env.example` y reemplazar los valores.

### 3. Configurar Base de Datos en Supabase

Ejecuta los siguientes SQL en el SQL Editor de Supabase:

```sql
-- Tabla productos
CREATE TABLE productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo_barras TEXT UNIQUE,
  precio_costo DECIMAL(10,2),
  precio_venta DECIMAL(10,2) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla ventas
CREATE TABLE ventas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total DECIMAL(10,2) NOT NULL
);

-- Tabla detalle_ventas
CREATE TABLE detalle_ventas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_detalle_ventas_venta_id ON detalle_ventas(venta_id);
CREATE INDEX idx_detalle_ventas_producto_id ON detalle_ventas(producto_id);

-- Habilitar Row Level Security (RLS) - Opcional
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_ventas ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajusta según tus necesidades de seguridad)
CREATE POLICY "Permitir todo en productos" ON productos FOR ALL USING (true);
CREATE POLICY "Permitir todo en ventas" ON ventas FOR ALL USING (true);
CREATE POLICY "Permitir todo en detalle_ventas" ON detalle_ventas FOR ALL USING (true);
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

### 5. Build para producción

```bash
npm run build
```

## Despliegue en Vercel

1. Conecta tu repositorio a Vercel
2. Agrega las variables de entorno en la configuración del proyecto:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Vercel detectará automáticamente Vite y desplegará la aplicación

## Estructura del Proyecto

```
src/
  ├── components/
  │   ├── Inventario.jsx      # Componente de gestión de inventario
  │   └── PuntoVenta.jsx       # Componente de punto de venta
  ├── services/
  │   └── db.js                # Servicios de base de datos
  ├── supabaseClient.js        # Cliente de Supabase
  ├── App.jsx                  # Componente principal
  ├── main.jsx                 # Punto de entrada
  └── index.css                # Estilos globales
```

## Tecnologías Utilizadas

- React 19
- Vite
- Tailwind CSS
- Lucide React (iconos)
- Supabase (Backend as a Service)
