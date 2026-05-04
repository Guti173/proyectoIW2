const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '')
const API_BASE = API_BASE_URL + '/api'

// ============ SERIES ============
export const getSeries = () => 
  fetch(`${API_BASE}/serie/`).then(r => r.json())

export const getSerieById = (id) => 
  fetch(`${API_BASE}/serie/${id}/`).then(r => r.json())

export const createSerie = (data) => 
  fetch(`${API_BASE}/serie/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json())

export const updateSerie = (id, data) => 
  fetch(`${API_BASE}/serie/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json())

export const deleteSerie = (id) => 
  fetch(`${API_BASE}/serie/${id}/`, { method: 'DELETE' })

// ============ GÉNEROS ============
export const getGeneros = () => 
  fetch(`${API_BASE}/genero/`).then(r => r.json())

export const getGeneroById = (id) => 
  fetch(`${API_BASE}/genero/${id}/`).then(r => r.json())

export const createGenero = (data) => 
  fetch(`${API_BASE}/genero/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json())

export const updateGenero = (id, data) => 
  fetch(`${API_BASE}/genero/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json())

export const deleteGenero = (id) => 
  fetch(`${API_BASE}/genero/${id}/`, { method: 'DELETE' })

// Filtrar series por género
export const getSeriesByGenero = (generoId) => 
  fetch(`${API_BASE}/serie/?genero=${generoId}`).then(r => r.json())

// Función genérica para otras APIs
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
