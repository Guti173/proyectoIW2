export const AUTH_STORAGE_KEY = 'isdb.auth'

export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN ?? '',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID ?? '',
  databaseConnection:
    import.meta.env.VITE_AUTH0_DB_CONNECTION ?? 'Username-Password-Authentication',
}

export function isAuth0Configured() {
  return Boolean(
    auth0Config.domain && auth0Config.clientId && auth0Config.databaseConnection,
  )
}

export function persistAuthSession({ accessToken, idToken, expiresIn, profile, user }) {
  const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : null

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      accessToken,
      idToken,
      expiresAt,
      profile,
      ...(user ? { user } : {}),
    }),
  )
}

export function getStoredAuthSession() {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!stored) return null

  try {
    const auth = JSON.parse(stored)

    if (auth.expiresAt && Date.now() > auth.expiresAt) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    return auth
  } catch {
    return null
  }
}

export const getStoredAuth = getStoredAuthSession

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function getRedirectPathForRole(role, estadoCuenta) {
  if (estadoCuenta === 'Suspendida') {
    return '/cuenta-suspendida'
  }

  return role === 'admin' ? '/panel-admin' : '/catalogo'
}
