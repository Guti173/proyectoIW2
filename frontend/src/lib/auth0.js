export const AUTH_STORAGE_KEY = 'isdb.auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

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
      user,
    }),
  )
}

export async function syncAuthUser(profile) {
  const response = await fetch(`${API_BASE_URL}/auth/me/`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ profile }),
  })

  if (!response.ok) {
    throw new Error(`No se pudo sincronizar el usuario (${response.status}).`)
  }

  return response.json()
}

export function getRedirectPathForRole(role) {
  return role === 'admin' ? '/panel-admin' : '/usuario'
}
