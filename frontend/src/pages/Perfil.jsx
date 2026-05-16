import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCollection } from '../api/client'
import SerieCard from '../components/SerieCard'
import { getStoredAuthSession } from '../lib/auth0'
import { getStoredLists } from '../lib/listas'
import './Perfil.css'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim()

const fallbackSeries = [
  {
    pk: 1,
    titulo: 'Breaking Bad',
    estado: 'T5: E14',
    fechaEstreno: '2008-01-20',
    valoracionMedia: 9.5,
    imagenPortada:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80',
  },
  {
    pk: 2,
    titulo: 'Stranger Things',
    estado: 'Top 1',
    fechaEstreno: '2016-07-15',
    valoracionMedia: 8.7,
    imagenPortada:
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80',
  },
  {
    pk: 3,
    titulo: 'The Office',
    estado: 'Comfort show',
    fechaEstreno: '2005-03-24',
    valoracionMedia: 9,
    imagenPortada:
      'https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?auto=format&fit=crop&w=900&q=80',
  },
  {
    pk: 4,
    titulo: 'The Boys',
    estado: 'Pendiente',
    fechaEstreno: '2019-07-26',
    valoracionMedia: 8.7,
    imagenPortada:
      'https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?auto=format&fit=crop&w=900&q=80',
  },
  {
    pk: 5,
    titulo: 'House of the Dragon',
    estado: 'Nueva temporada',
    fechaEstreno: '2022-08-21',
    valoracionMedia: 8.5,
    imagenPortada:
      'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=900&q=80',
  },
  {
    pk: 6,
    titulo: 'Ted Lasso',
    estado: 'Favorita',
    fechaEstreno: '2020-08-14',
    valoracionMedia: 8.8,
    imagenPortada:
      'https://images.unsplash.com/photo-1516117172878-fd2c41f4a759?auto=format&fit=crop&w=900&q=80',
  },
]

function Perfil() {
  const navigate = useNavigate()
  const [pageData, setPageData] = useState(() => createFallbackPageData())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    async function loadProfilePage() {
      setLoading(true)

      const authSession = getStoredAuthSession()
      const authProfile = authSession?.profile ?? null
      const localLists = getStoredLists()

      if (!apiBaseUrl) {
        if (!isCancelled) {
          setPageData(createFallbackPageData(authProfile, localLists))
          setLoading(false)
        }
        return
      }

      try {
        const [
          usersResult,
          seriesResult,
          listsResult,
          progressResult,
          friendshipsResult,
        ] = await Promise.allSettled([
          fetchCollection('/user'),
          fetchCollection('/serie'),
          fetchCollection('/listausuario'),
          fetchCollection('/progresoserie'),
          fetchCollection('/amistad'),
        ])

        if (isCancelled) {
          return
        }

        const users = getCollectionValue(usersResult)
        const series = getCollectionValue(seriesResult)
        const lists = getCollectionValue(listsResult)
        const progress = getCollectionValue(progressResult)
        const friendships = getCollectionValue(friendshipsResult)

        setPageData(
          buildPageDataFromBackend({
            authProfile,
            users,
            series,
            lists,
            progress,
            friendships,
            localLists,
          }),
        )
      } catch {
        if (!isCancelled) {
          setPageData(createFallbackPageData(authProfile, localLists))
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadProfilePage()

    return () => {
      isCancelled = true
    }
  }, [])

  if (loading) {
    return (
      <section className="perfil-state-card" aria-label="Cargando perfil">
        <p className="perfil-state-eyebrow">ISDB</p>
        <h1>Preparando tu perfil</h1>
        <p>Estamos reuniendo tu actividad, tus listas y tus series destacadas.</p>
      </section>
    )
  }

  const { profile, stats, infoCards, sections, sourceLabel } = pageData

  return (
    <div className="perfil-page">
      <header className="perfil-hero">
        <div className="perfil-hero-main">
          <div className="perfil-avatar-shell">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={`Avatar de ${profile.displayName}`}
                className="perfil-avatar-image"
              />
            ) : (
              <span className="perfil-avatar-fallback">{getInitials(profile.displayName)}</span>
            )}
          </div>

          <div className="perfil-hero-copy">
            <p className="perfil-kicker">{profile.groupLabel}</p>
            <h1>{profile.displayName}</h1>
            <p className="perfil-handle">@{profile.username}</p>
            <p className="perfil-bio">{profile.biography}</p>

            <div className="perfil-actions">
              <button className="perfil-btn-primary" onClick={() => navigate('/catalogo')}>
                Explorar catalogo
              </button>
              <button className="perfil-btn-secondary" onClick={() => navigate('/listas')}>
                Gestionar mis listas
              </button>
            </div>
          </div>
        </div>

        <div className="perfil-hero-aside">
          <span className="perfil-status-chip">{profile.accountStatus}</span>
          <p>{sourceLabel}</p>
        </div>
      </header>

      <section className="perfil-stats-grid" aria-label="Resumen de actividad">
        {stats.map((item) => (
          <article key={item.label} className="perfil-stat-card">
            <span className="perfil-stat-value">{item.value}</span>
            <span className="perfil-stat-label">{item.label}</span>
          </article>
        ))}
      </section>

      <section className="perfil-overview-grid">
        <article className="perfil-panel perfil-panel-featured">
          <div className="perfil-panel-header">
            <p className="perfil-panel-kicker">Actividad reciente</p>
            <h2>Una vista pensada para convivir con el catalogo actual</h2>
          </div>
          <p className="perfil-panel-text">
            Esta pagina mantiene el mismo lenguaje visual del proyecto: bloques amplios,
            jerarquia clara, tarjetas reutilizables y espacio para crecer despues con datos
            reales del backend sin alterar las rutas que ya existen.
          </p>
          <ul className="perfil-bullet-list">
            <li>Tu perfil centraliza cuenta, progreso y descubrimiento de series.</li>
            <li>Las colecciones reutilizan las mismas tarjetas que ya usa el catalogo.</li>
            <li>La carga cae a un modo demo si la API todavia no esta conectada.</li>
          </ul>
        </article>

        <div className="perfil-info-stack">
          {infoCards.map((card) => (
            <article key={card.title} className="perfil-panel perfil-panel-compact">
              <div className="perfil-panel-header">
                <p className="perfil-panel-kicker">{card.kicker}</p>
                <h2>{card.title}</h2>
              </div>

              <div className="perfil-info-list">
                {card.items.map((item) => (
                  <div key={item.label} className="perfil-info-row">
                    <span className="perfil-info-label">{item.label}</span>
                    <span className="perfil-info-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <main className="perfil-content">
        {sections.map((section) => (
          <section key={section.title} className="perfil-collection">
            <div className="perfil-section-heading">
              <div>
                <p className="perfil-section-kicker">{section.kicker}</p>
                <h2>{section.title}</h2>
              </div>
              <p className="perfil-section-description">{section.description}</p>
            </div>

            <div className="perfil-slider">
              {section.series.map((serie) => (
                <SerieCard
                  key={`${section.title}-${serie.pk}`}
                  id={serie.pk}
                  titulo={serie.titulo}
                  fechaEstreno={serie.fechaEstreno}
                  valoracionMedia={serie.valoracionMedia}
                  imagen={serie.imagenPortada}
                  estado={serie.estado}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}

function buildPageDataFromBackend({
  authProfile,
  users,
  series,
  lists,
  progress,
  friendships,
  localLists,
}) {
  const normalizedSeries = series.map(normalizeSerie)
  const selectedUser = pickBestUser(users, authProfile)
  const localListSeries = mapLocalListsToSeries(localLists)

  if (!selectedUser) {
    return createFallbackPageData(authProfile, localLists)
  }

  const selectedUserId = getEntityId(selectedUser)
  const progressForUser = progress.filter((item) => getEntityId(item.user) === selectedUserId)
  const listsForUser = lists.filter((item) => getEntityId(item.user) === selectedUserId)
  const friendshipsForUser = friendships.filter(
    (item) =>
      getEntityId(item.user) === selectedUserId || getEntityId(item.user2) === selectedUserId,
  )

  const seriesMap = new Map(normalizedSeries.map((item) => [item.pk, item]))
  const continueWatching = progressForUser
    .filter((item) => !isCompletedProgress(item))
    .map((item) => {
      const serie = seriesMap.get(item.serie)
      if (!serie) {
        return null
      }

      return {
        ...serie,
        estado: item.estado || `${item.episodiosVistos} episodios`,
      }
    })
    .filter(Boolean)

  const listSeries = listsForUser
    .flatMap((list) =>
      (list.series ?? []).map((serieId) => {
        const serie = seriesMap.get(serieId)
        if (!serie) {
          return null
        }

        return {
          ...serie,
          estado: list.tipoLista || 'Mi lista',
        }
      }),
    )
    .filter(Boolean)

  const uniqueListSeries = dedupeSeries([...localListSeries, ...listSeries])
  const recommendedSeries = dedupeSeries(
    normalizedSeries
      .slice()
      .sort((left, right) => right.valoracionMedia - left.valoracionMedia)
      .filter((serie) => !uniqueListSeries.some((item) => item.pk === serie.pk)),
  )

  const acceptedFriendships = friendshipsForUser.filter(isAcceptedFriendship)
  const pendingFriendships = friendshipsForUser.filter(
    (item) => !isAcceptedFriendship(item),
  )
  const completedSeriesCount = progressForUser.filter(isCompletedProgress).length
  const visibleListCount = localLists.length || listsForUser.length || 0

  return {
    profile: {
      displayName:
        [selectedUser.nombre, selectedUser.apellidos].filter(Boolean).join(' ').trim() ||
        authProfile?.name ||
        selectedUser.username,
      username: selectedUser.username || authProfile?.nickname || 'usuario-isdb',
      email: selectedUser.email || authProfile?.email || 'Sin email',
      avatarUrl: selectedUser.fotoPerfil || authProfile?.picture || '',
      accountStatus: selectedUser.estadoCuenta || 'Activa',
      groupLabel: selectedUser.group ? `Grupo ${selectedUser.group}` : 'Perfil ISDB',
      biography:
        authProfile?.bio ||
        'Tu espacio para seguir series, listas y progreso sin salir del ecosistema de ISDB.',
    },
    stats: [
      { label: 'Series en curso', value: continueWatching.length || progressForUser.length || 0 },
      { label: 'Listas creadas', value: visibleListCount },
      { label: 'Series completadas', value: completedSeriesCount },
      { label: 'Conexiones', value: acceptedFriendships.length },
    ],
    infoCards: [
      {
        kicker: 'Cuenta',
        title: 'Datos principales',
        items: [
          { label: 'Usuario', value: `@${selectedUser.username}` },
          { label: 'Email', value: selectedUser.email || 'No disponible' },
          { label: 'Estado', value: selectedUser.estadoCuenta || 'Activa' },
        ],
      },
      {
        kicker: 'Social',
        title: 'Comunidad',
        items: [
          { label: 'Amistades activas', value: `${acceptedFriendships.length}` },
          { label: 'Solicitudes pendientes', value: `${pendingFriendships.length}` },
          { label: 'Series guardadas', value: `${uniqueListSeries.length}` },
        ],
      },
    ],
    sections: [
      {
        kicker: 'Seguimiento',
        title: 'Continuar viendo',
        description: 'Retoma las series que has dejado a medias.',
        series: continueWatching.length ? continueWatching : fallbackSeries.slice(0, 3),
      },
      {
        kicker: 'Colecciones',
        title: 'Tus listas',
        description: 'Series agrupadas con tus listas locales y, cuando exista, con la API.',
        series: uniqueListSeries.length ? uniqueListSeries : fallbackSeries.slice(1, 4),
      },
      {
        kicker: 'Descubrimiento',
        title: 'Recomendadas para ti',
        description: 'Una mezcla de valoracion alta y continuidad con el catalogo actual.',
        series: recommendedSeries.length ? recommendedSeries.slice(0, 5) : fallbackSeries.slice(2, 6),
      },
    ],
    sourceLabel:
      normalizedSeries.length || listsForUser.length || progressForUser.length
        ? localLists.length
          ? 'Sincronizado con la app y con tus listas guardadas en este navegador.'
          : 'Sincronizado con el backend disponible.'
        : localLists.length
          ? 'Perfil listo con tus listas locales mientras la API termina de crecer.'
          : 'Perfil listo para conectar datos reales cuando la API devuelva contenido.',
  }
}

function createFallbackPageData(authProfile = null, localLists = []) {
  const displayName = authProfile?.name || 'Mario Garcia'
  const username =
    authProfile?.nickname ||
    displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 18) ||
    'marioisdb'
  const localListSeries = mapLocalListsToSeries(localLists)
  const uniqueLocalSeries = dedupeSeries(localListSeries)
  const hasLocalLists = localLists.length > 0

  return {
    profile: {
      displayName,
      username,
      email: authProfile?.email || 'mario@isdb.local',
      avatarUrl: authProfile?.picture || '',
      accountStatus: 'Activa',
      groupLabel: 'Perfil ISDB',
      biography:
        'Una pagina de perfil preparada para encajar con la UI actual y crecer despues con la informacion real de usuario, listas y progreso.',
    },
    stats: [
      { label: 'Series en curso', value: 4 },
      { label: 'Listas creadas', value: hasLocalLists ? localLists.length : 3 },
      { label: 'Series completadas', value: 12 },
      { label: 'Conexiones', value: hasLocalLists ? uniqueLocalSeries.length + 2 : 8 },
    ],
    infoCards: [
      {
        kicker: 'Cuenta',
        title: 'Datos principales',
        items: [
          { label: 'Usuario', value: `@${username}` },
          { label: 'Email', value: authProfile?.email || 'mario@isdb.local' },
          { label: 'Estado', value: 'Activa' },
        ],
      },
      {
        kicker: 'Actividad',
        title: 'Resumen rapido',
        items: [
          { label: 'Ultima sesion', value: 'Hoy' },
          {
            label: 'Listas destacadas',
            value: hasLocalLists ? localLists[0].name : 'Favoritas y por ver',
          },
          { label: 'Modo actual', value: hasLocalLists ? 'Listas persistidas' : 'Vista demo integrada' },
        ],
      },
    ],
    sections: [
      {
        kicker: 'Seguimiento',
        title: 'Continuar viendo',
        description: 'Las mismas tarjetas del catalogo, ahora dentro del perfil.',
        series: fallbackSeries.slice(0, 3),
      },
      {
        kicker: 'Colecciones',
        title: 'Tus listas',
        description: 'Aqui aparecen primero las colecciones creadas en este navegador.',
        series: uniqueLocalSeries.length ? uniqueLocalSeries : fallbackSeries.slice(2, 5),
      },
      {
        kicker: 'Descubrimiento',
        title: 'Te puede interesar',
        description: 'Espacio listo para recomendaciones o actividad personalizada.',
        series: fallbackSeries.slice(1, 6),
      },
    ],
    sourceLabel: hasLocalLists
      ? 'Vista local activa con tus listas guardadas en este navegador.'
      : 'Vista de demostracion activa mientras conectas la API del proyecto.',
  }
}

function normalizeSerie(serie, index) {
  return {
    pk: Number(serie.pk ?? serie.id ?? index + 1),
    titulo: serie.titulo || 'Serie sin titulo',
    fechaEstreno: serie.fechaEstreno || null,
    valoracionMedia: Number(serie.valoracionMedia ?? 0),
    imagenPortada: serie.imagenPortada || fallbackSeries[index % fallbackSeries.length].imagenPortada,
    estado: serie.estado || 'Disponible',
  }
}

function pickBestUser(users, authProfile) {
  if (!Array.isArray(users) || !users.length) {
    return null
  }

  if (authProfile?.email) {
    const matchingUser = users.find((user) => user.email === authProfile.email)
    if (matchingUser) {
      return matchingUser
    }
  }

  if (authProfile?.nickname) {
    const matchingUser = users.find((user) => user.username === authProfile.nickname)
    if (matchingUser) {
      return matchingUser
    }
  }

  return users[0]
}

function getEntityId(entity) {
  if (typeof entity === 'number' || typeof entity === 'string') {
    return Number(entity)
  }

  return Number(entity?.pk ?? entity?.id ?? 0)
}

function getCollectionValue(result) {
  return result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []
}

function dedupeSeries(series) {
  const seen = new Set()

  return series.filter((serie) => {
    if (seen.has(serie.pk)) {
      return false
    }

    seen.add(serie.pk)
    return true
  })
}

function mapLocalListsToSeries(localLists) {
  return localLists.flatMap((list) =>
    list.series.map((serie) => ({
      ...normalizeSerie(serie, 0),
      estado: list.name,
    })),
  )
}

function isCompletedProgress(item) {
  const status = `${item?.estado ?? ''}`.toLowerCase()
  return status.includes('complet') || status.includes('final') || Boolean(item?.fechaFin)
}

function isAcceptedFriendship(item) {
  const status = `${item?.estado ?? ''}`.toLowerCase()
  return status.includes('acept') || status.includes('accepted') || status.includes('friend')
}

function getInitials(name) {
  const initials = `${name ?? ''}`
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return initials || 'IS'
}

export default Perfil
