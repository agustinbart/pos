const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/
const MIN_PASSWORD_LENGTH = 8
const MAX_USERNAME_LENGTH = 50
const MAX_PASSWORD_LENGTH = 72
const AUTH_DOMAIN = import.meta.env.VITE_AUTH_DOMAIN || 'pos.local'

export function obtenerDominioAuth() {
  return AUTH_DOMAIN
}

export function usuarioAEmailInterno(usuario) {
  return `${usuario}@${obtenerDominioAuth()}`
}

export function emailInternoAUsuario(email) {
  if (!email) return null
  const dominio = `@${obtenerDominioAuth()}`
  if (!email.endsWith(dominio)) return null
  return email.slice(0, -dominio.length)
}

export function validarCredenciales(usuario, password) {
  const usuarioNormalizado = usuario.trim().toLowerCase().slice(0, MAX_USERNAME_LENGTH)

  if (!usuarioNormalizado || !USERNAME_REGEX.test(usuarioNormalizado)) {
    return { valido: false, error: 'Ingresa un usuario válido.' }
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      valido: false,
      error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    }
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { valido: false, error: 'La contraseña es demasiado larga.' }
  }

  return {
    valido: true,
    usuario: usuarioNormalizado,
    emailInterno: usuarioAEmailInterno(usuarioNormalizado),
  }
}
