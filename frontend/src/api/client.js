import { getStoredAuthSession } from '../lib/auth0'

const rawApiBase = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(
  /\/$/,
  '',
)
const API_BASE_URL = rawApiBase.endsWith('/api') ? rawApiBase : `${rawApiBase}/api`

function buildApiUrl(path, params = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const apiPath = normalizedPath.startsWith('/api/')
    ? normalizedPath
    : `${API_BASE_URL}${normalizedPath}`
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value)
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `${apiPath}?${queryString}` : apiPath
}

function buildAuthHeaders() {
  const authSession = getStoredAuthSession()
  const profile = authSession?.profile

  if (!profile) {
    return {}
  }

  return {
    'X-Auth0-Sub': profile.sub ?? '',
    'X-Auth0-Email': profile.email ?? '',
    'X-Auth0-Name': getProfileName(profile),
    'X-Auth0-Nickname': getProfileUsername(profile),
    'X-Auth0-Picture': profile.picture ?? '',
  }
}

function getProfileName(profile) {
  const email = `${profile?.email ?? ''}`.trim().toLowerCase()
  const fullGivenName = `${profile?.given_name ?? ''} ${profile?.family_name ?? ''}`.trim()
  const candidates = [
    profile?.user_metadata?.fullName,
    profile?.user_metadata?.full_name,
    profile?.user_metadata?.name,
    profile?.user_metadata?.nombre,
    profile?.app_metadata?.fullName,
    profile?.app_metadata?.full_name,
    fullGivenName,
    profile?.given_name,
    profile?.name,
  ]

  for (const candidate of candidates) {
    const value = `${candidate ?? ''}`.trim()

    if (value && value.toLowerCase() !== email) {
      return value
    }
  }

  return ''
}

function getProfileUsername(profile) {
  const emailPrefix = profile?.email?.includes('@') ? profile.email.split('@')[0] : ''
  const candidates = [
    profile?.user_metadata?.username,
    profile?.user_metadata?.usuario,
    profile?.app_metadata?.username,
    profile?.username,
    profile?.nickname,
    emailPrefix,
  ]

  for (const candidate of candidates) {
    const value = `${candidate ?? ''}`.trim()

    if (value) {
      return value
    }
  }

  return ''
}

function getErrorDetail(payload) {
  if (typeof payload === 'string') {
    return payload
  }

  if (Array.isArray(payload)) {
    return payload[0] || 'Request failed'
  }

  if (Array.isArray(payload?.detail)) {
    return payload.detail[0] || 'Request failed'
  }

  if (payload?.detail) {
    return payload.detail
  }

  if (payload?.non_field_errors?.[0]) {
    return payload.non_field_errors[0]
  }

  const firstFieldError = Object.values(payload ?? {}).find((value) => Array.isArray(value) && value[0])
  return firstFieldError?.[0] || 'Request failed'
}

async function request(path, options = {}) {
  const {
    method = 'GET',
    params,
    data,
    signal,
    headers = {},
    includeAuth = true,
  } = options

  const finalHeaders = {
    Accept: 'application/json',
    ...(includeAuth ? buildAuthHeaders() : {}),
    ...headers,
  }

  if (data !== undefined) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  const response = await fetch(buildApiUrl(path, params), {
    method,
    headers: finalHeaders,
    body: data !== undefined ? JSON.stringify(data) : undefined,
    signal,
  })

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const detail = getErrorDetail(payload)

    const error = new Error(detail)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

export async function fetchCollection(path, options = {}) {
  return request(path, { method: 'GET', ...options })
}

export const getSeries = () => request('/serie/')
export const getSerieById = (id) => request(`/serie/${id}/`)
export const createSerie = (data) => request('/serie/', { method: 'POST', data })
export const updateSerie = (id, data) => request(`/serie/${id}/`, { method: 'PUT', data })
export const deleteSerie = (id) => request(`/serie/${id}/`, { method: 'DELETE' })

export const getGeneros = () => request('/genero/')
export const getGeneroById = (id) => request(`/genero/${id}/`)
export const createGenero = (data) => request('/genero/', { method: 'POST', data })
export const updateGenero = (id, data) => request(`/genero/${id}/`, { method: 'PUT', data })
export const deleteGenero = (id) => request(`/genero/${id}/`, { method: 'DELETE' })
export const getSeriesByGenero = (generoId) =>
  request('/serie/', { params: { genero: generoId } })

export const syncCurrentUser = () => request('/user/sync/', { method: 'POST' })
export const getUsers = () => request('/user/')
export const updateUser = (userId, data) =>
  request(`/user/${userId}/`, { method: 'PATCH', data })
export const getCurrentUserProfile = () => request('/user/me/')
export const updateCurrentUserProfile = (data) =>
  request('/user/me/', { method: 'PATCH', data })
export const changeCurrentUserPassword = (data) =>
  request('/user/change-password/', { method: 'POST', data })
export const getPublicFriendProfile = (userId) => request(`/user/${userId}/public-profile/`)
export const getFriendCandidates = (query, options = {}) =>
  request('/user/discover/', {
    params: { q: query, limit: 10 },
    signal: options.signal,
  })

export const getFriendships = () => request('/amistad/')
export const sendFriendRequest = (userId) =>
  request('/amistad/', {
    method: 'POST',
    data: { user2: userId },
  })
export const acceptFriendRequest = (friendshipId) =>
  request(`/amistad/${friendshipId}/accept/`, { method: 'POST' })
export const denyFriendRequest = (friendshipId) =>
  request(`/amistad/${friendshipId}/deny/`, { method: 'POST' })

export const getMyLists = () => request('/listausuario/mine/')
export const createUserList = (data) => request('/listausuario/', { method: 'POST', data })
export const deleteUserList = (listId) => request(`/listausuario/${listId}/`, { method: 'DELETE' })
export const addSerieToUserList = (listId, serieId) =>
  request(`/listausuario/${listId}/add-serie/`, {
    method: 'POST',
    data: { serieId },
  })
export const removeSerieFromUserList = (listId, serieId) =>
  request(`/listausuario/${listId}/remove-serie/`, {
    method: 'POST',
    data: { serieId },
  })

export const getMyProgress = () => request('/progresoserie/')
export const getContinueWatchingProgress = () => request('/progresoserie/continue-watching/')
export const getProgressBySerie = (serieId) =>
  request('/progresoserie/by-serie/', { params: { serieId } })
export const startSerieProgress = (serieId) =>
  request('/progresoserie/start/', {
    method: 'POST',
    data: { serieId },
  })
export const setSerieProgress = (serieId, episodiosVistos) =>
  request('/progresoserie/set-progress/', {
    method: 'POST',
    data: { serieId, episodiosVistos },
  })

export const getComentariosBySerie = (serieId) =>
  request('/comentario/', { params: { serie: serieId } })
export const createComentario = (data) =>
  request('/comentario/', { method: 'POST', data })
export const toggleCommentLike = (comentarioId) =>
  request(`/comentario/${comentarioId}/toggle-like/`, { method: 'POST' })

export const createReporte = (comentarioId, motivo) =>
  request('/reportecomentario/', {
    method: 'POST',
    data: {
      comentario: comentarioId,
      motivo,
      estado: 'PENDIENTE',
    },
  })

export const getReportes = () => request('/reportecomentario/')

export const updateReporteEstado = (reporteId, nuevoEstado) =>
  request(`/reportecomentario/${reporteId}/`, {
    method: 'PATCH',
    data: { estado: nuevoEstado },
  })

export const deleteComentario = (comentarioId) =>
  request(`/comentario/${comentarioId}/`, { method: 'DELETE' })
