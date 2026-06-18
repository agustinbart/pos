import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import {
  emailInternoAUsuario,
  validarCredenciales,
} from '../lib/authValidation'

const AuthContext = createContext(null)

const MENSAJE_ERROR_GENERICO =
  'Credenciales incorrectas. Verifica tu usuario y contraseña.'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    supabase.auth.getSession().then(({ data: { session: sesionActual } }) => {
      if (activo) {
        setSession(sesionActual)
        setCargando(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sesionActual) => {
      setSession(sesionActual)
      setCargando(false)
    })

    return () => {
      activo = false
      subscription.unsubscribe()
    }
  }, [])

  const iniciarSesion = async (usuario, password) => {
    const validacion = validarCredenciales(usuario, password)
    if (!validacion.valido) {
      throw new Error(validacion.error)
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: validacion.emailInterno,
      password,
    })

    if (error) {
      throw new Error(MENSAJE_ERROR_GENERICO)
    }
  }

  const cerrarSesion = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const nombreUsuario = session?.user
    ? session.user.user_metadata?.username
      || emailInternoAUsuario(session.user.email)
      || 'Usuario'
    : null

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      nombreUsuario,
      cargando,
      autenticado: Boolean(session),
      iniciarSesion,
      cerrarSesion,
    }),
    [session, cargando, nombreUsuario]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
