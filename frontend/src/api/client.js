const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export async function fetchCollection(path, options = {}) {
  const { params = {}, signal } = options
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value)
    }
  })

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const queryString = searchParams.toString()
  const url = `${API_BASE_URL}${normalizedPath}${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}
