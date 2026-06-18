/**
 * Crea el usuario admin en Supabase Auth (ejecutar una sola vez en local).
 * Lee credenciales desde .env.local — nunca las commitees.
 *
 * Uso: node scripts/crear-usuario-admin.mjs
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

function cargarEnvLocal() {
  try {
    const contenido = readFileSync('.env.local', 'utf8')
    const env = {}
    for (const linea of contenido.split('\n')) {
      const trimmed = linea.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
    }
    return env
  } catch {
    console.error('No se encontró .env.local. Copia .env.example y complétalo.')
    process.exit(1)
  }
}

const env = cargarEnvLocal()
const url = env.VITE_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
const dominio = env.VITE_AUTH_DOMAIN || 'pos.local'
const username = (env.ADMIN_USERNAME || 'admin').trim().toLowerCase()
const password = env.ADMIN_PASSWORD

if (!url || !serviceRoleKey) {
  console.error('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  console.error('La service role key está en: Supabase → Settings → API → service_role')
  process.exit(1)
}

if (!password || password.length < 8) {
  console.error('Define ADMIN_PASSWORD en .env.local (mínimo 8 caracteres)')
  process.exit(1)
}

const emailInterno = `${username}@${dominio}`
const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: usuarios, error: errorLista } = await supabase.auth.admin.listUsers()
if (errorLista) {
  console.error('Error listando usuarios:', errorLista.message)
  process.exit(1)
}

const existente = usuarios.users.find((u) => u.email === emailInterno)

if (existente) {
  const { error } = await supabase.auth.admin.updateUserById(existente.id, {
    password,
    email_confirm: true,
    user_metadata: { username },
  })
  if (error) {
    console.error('Error actualizando usuario:', error.message)
    process.exit(1)
  }
  console.log(`Usuario "${username}" actualizado correctamente.`)
} else {
  const { error } = await supabase.auth.admin.createUser({
    email: emailInterno,
    password,
    email_confirm: true,
    user_metadata: { username },
  })
  if (error) {
    console.error('Error creando usuario:', error.message)
    process.exit(1)
  }
  console.log(`Usuario "${username}" creado correctamente.`)
}

console.log(`Inicia sesión en la app con usuario: ${username}`)
