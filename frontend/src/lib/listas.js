export const LISTAS_STORAGE_KEY = 'isdb.user-lists'

export function getStoredLists() {
  if (!canUseStorage()) {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(LISTAS_STORAGE_KEY)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue)
    return Array.isArray(parsedValue) ? parsedValue.map(normalizeStoredList) : []
  } catch {
    return []
  }
}

export function createList({ name, description = '', initialSerie = null }) {
  const trimmedName = `${name ?? ''}`.trim()

  if (!trimmedName) {
    return { ok: false, error: 'Escribe un nombre para la lista.' }
  }

  const currentLists = getStoredLists()
  const alreadyExists = currentLists.some(
    (list) => list.name.toLowerCase() === trimmedName.toLowerCase(),
  )

  if (alreadyExists) {
    return { ok: false, error: 'Ya existe una lista con ese nombre.' }
  }

  const now = new Date().toISOString()
  const newList = {
    id: `lista-${Date.now()}`,
    name: trimmedName,
    description: `${description ?? ''}`.trim(),
    createdAt: now,
    updatedAt: now,
    series: initialSerie ? [normalizeSerieSnapshot(initialSerie)] : [],
  }

  const nextLists = [newList, ...currentLists]
  saveLists(nextLists)

  return { ok: true, list: newList, lists: nextLists }
}

export function deleteList(listId) {
  const nextLists = getStoredLists().filter((list) => list.id !== listId)
  saveLists(nextLists)
  return nextLists
}

export function addSerieToList(listId, serie) {
  const serieId = getSerieId(serie)

  if (!serieId) {
    return { ok: false, error: 'La serie no tiene un identificador valido.' }
  }

  let wasAdded = false
  const serieSnapshot = normalizeSerieSnapshot(serie)
  const nextLists = getStoredLists().map((list) => {
    if (list.id !== listId) {
      return list
    }

    const alreadySaved = list.series.some((item) => getSerieId(item) === serieId)
    if (alreadySaved) {
      return list
    }

    wasAdded = true
    return {
      ...list,
      updatedAt: new Date().toISOString(),
      series: [serieSnapshot, ...list.series],
    }
  })

  if (!wasAdded) {
    return { ok: false, error: 'La serie ya estaba en esa lista.', lists: nextLists }
  }

  saveLists(nextLists)
  return { ok: true, lists: nextLists }
}

export function removeSerieFromList(listId, serieId) {
  const numericSerieId = Number(serieId)
  let wasRemoved = false

  const nextLists = getStoredLists().map((list) => {
    if (list.id !== listId) {
      return list
    }

    const filteredSeries = list.series.filter((serie) => getSerieId(serie) !== numericSerieId)

    if (filteredSeries.length === list.series.length) {
      return list
    }

    wasRemoved = true
    return {
      ...list,
      updatedAt: new Date().toISOString(),
      series: filteredSeries,
    }
  })

  if (!wasRemoved) {
    return { ok: false, error: 'La serie no estaba en esa lista.', lists: nextLists }
  }

  saveLists(nextLists)
  return { ok: true, lists: nextLists }
}

export function isSerieInList(list, serieId) {
  const numericSerieId = Number(serieId)
  return list.series.some((serie) => getSerieId(serie) === numericSerieId)
}

export function countListsContainingSerie(serieId) {
  const numericSerieId = Number(serieId)
  return getStoredLists().filter((list) => isSerieInList(list, numericSerieId)).length
}

export function getUniqueStoredSeries() {
  const seen = new Set()

  return getStoredLists()
    .flatMap((list) => list.series)
    .filter((serie) => {
      const serieId = getSerieId(serie)
      if (!serieId || seen.has(serieId)) {
        return false
      }

      seen.add(serieId)
      return true
    })
}

function saveLists(lists) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(LISTAS_STORAGE_KEY, JSON.stringify(lists))
}

function normalizeStoredList(list, index) {
  return {
    id: list.id || `lista-${index + 1}`,
    name: list.name || `Lista ${index + 1}`,
    description: list.description || '',
    createdAt: list.createdAt || new Date().toISOString(),
    updatedAt: list.updatedAt || list.createdAt || new Date().toISOString(),
    series: Array.isArray(list.series) ? list.series.map(normalizeSerieSnapshot) : [],
  }
}

function normalizeSerieSnapshot(serie) {
  return {
    pk: getSerieId(serie),
    titulo: serie.titulo || 'Serie sin título',
    fechaEstreno: serie.fechaEstreno || null,
    valoracionMedia: Number(serie.valoracionMedia ?? 0),
    imagenPortada: serie.imagenPortada || '',
    estado: serie.estado || 'Guardada',
    numeroEpisodios: Number(serie.numeroEpisodios ?? 0),
    descripcion: serie.descripcion || '',
  }
}

function getSerieId(serie) {
  return Number(serie?.pk ?? serie?.id ?? 0)
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}
