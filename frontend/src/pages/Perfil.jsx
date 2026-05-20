import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  changeCurrentUserPassword,
  getContinueWatchingProgress,
  getCurrentUserProfile,
  getMyLists,
  getPublicFriendProfile,
  getSeries,
  updateCurrentUserProfile,
} from '../api/client'
import SerieCard from '../components/SerieCard'
import { getStoredAuthSession } from '../lib/auth0'
import './Perfil.css'

function Perfil() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const isPublicProfile = Boolean(userId)
  const authSession = getStoredAuthSession()
  const authProfile = authSession?.profile ?? null
  const authUserKey = authProfile?.sub ?? authProfile?.email ?? ''
  const authPicture = authProfile?.picture ?? ''
  const authName = authProfile?.name ?? ''
  const authEmail = authProfile?.email ?? ''
  const hasAuthProfile = Boolean(authUserKey)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [passwordPanelOpen, setPasswordPanelOpen] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [publicStats, setPublicStats] = useState(null)
  const [listas, setListas] = useState([])
  const [progress, setProgress] = useState([])
  const [series, setSeries] = useState([])
  const [expandedCollectionId, setExpandedCollectionId] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nombre: '',
    apellidos: '',
    fotoPerfil: '',
    estadoCuenta: 'Activa',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    repeatPassword: '',
  })

  useEffect(() => {
    let isCancelled = false

    async function loadProfileData() {
      if (!hasAuthProfile) {
        setLoading(false)
        return
      }

      try {
        if (isPublicProfile) {
          const publicData = await getPublicFriendProfile(userId)

          if (isCancelled) {
            return
          }

          setProfile(publicData.profile)
          setPublicStats(publicData.stats ?? null)
          setListas(Array.isArray(publicData.lists) ? publicData.lists : [])
          setProgress([])
          setSeries([])
          return
        }

        const [profileData, listasData, progressData, seriesData] = await Promise.all([
          getCurrentUserProfile(),
          getMyLists(),
          getContinueWatchingProgress(),
          getSeries(),
        ])

        if (isCancelled) {
          return
        }

        setProfile(profileData)
        setPublicStats(null)
        setListas(Array.isArray(listasData) ? listasData : [])
        setProgress(Array.isArray(progressData) ? progressData : [])
        setSeries(Array.isArray(seriesData) ? seriesData : [])
        setFormData({
          username: profileData.username || '',
          email: profileData.email || authEmail,
          nombre: profileData.nombre || '',
          apellidos: profileData.apellidos || '',
          fotoPerfil: profileData.fotoPerfil || authPicture,
          estadoCuenta: profileData.estadoCuenta || 'Activa',
        })
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error.message || 'No se pudo cargar el perfil.')
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadProfileData()

    return () => {
      isCancelled = true
    }
  }, [authEmail, authPicture, authUserKey, hasAuthProfile, isPublicProfile, userId])

  const allListSeries = useMemo(
    () => dedupeSeries(listas.flatMap((lista) => (lista.series ?? []).map((serie) => ({
      ...serie,
      estado: lista.tipoLista,
    })))),
    [listas],
  )

  const collectionItems = useMemo(
    () =>
      listas.map((lista) => {
        const seriesInList = lista.series ?? []
        const representative = lista.representativeSerie ?? seriesInList[seriesInList.length - 1] ?? null

        return {
          id: lista.id,
          title: lista.tipoLista,
          description: lista.descripcion,
          count: seriesInList.length,
          representative,
          series: seriesInList,
        }
      }),
    [listas],
  )

  const continueWatchingSeries = useMemo(
    () =>
      progress
        .map((item) => {
          const serie = item.serieDetalle
          if (!serie) {
            return null
          }

          const totalEpisodes = Number(serie.numeroEpisodios ?? 0)
          const watchedEpisodes = Number(item.episodiosVistos ?? 0)
          const state = `${item.estado ?? ''}`.trim().toLowerCase()
          const isCompleted =
            state === 'completada' ||
            (totalEpisodes > 0 && watchedEpisodes >= totalEpisodes)

          if (isCompleted || totalEpisodes <= 0 || watchedEpisodes >= totalEpisodes) {
            return null
          }

          return {
            ...serie,
            estado: `${watchedEpisodes}/${totalEpisodes} episodios`,
          }
        })
        .filter(Boolean),
    [progress],
  )

  const recommendedSeries = useMemo(() => {
    const savedIds = new Set(allListSeries.map((serie) => Number(serie.id ?? serie.pk ?? 0)))

    return [...series]
      .sort((left, right) => Number(right.valoracionMedia ?? 0) - Number(left.valoracionMedia ?? 0))
      .filter((serie) => !savedIds.has(Number(serie.id ?? serie.pk ?? 0)))
      .slice(0, 6)
  }, [allListSeries, series])

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    setSaveMessage('')
    setErrorMessage('')

    try {
      const updatedProfile = await updateCurrentUserProfile(formData)
      setProfile(updatedProfile)
      setFormData({
        username: updatedProfile.username || '',
        email: updatedProfile.email || authEmail,
        nombre: updatedProfile.nombre || '',
        apellidos: updatedProfile.apellidos || '',
        fotoPerfil: updatedProfile.fotoPerfil || '',
        estadoCuenta: updatedProfile.estadoCuenta || 'Activa',
      })
      setSaveMessage('Perfil actualizado correctamente.')
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo actualizar el perfil.')
    }
  }

  const handlePasswordChange = async (event) => {
    event.preventDefault()
    setPasswordMessage('')
    setPasswordError('')

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.repeatPassword
    ) {
      setPasswordError('Completa todos los campos de contraseña.')
      return
    }

    if (passwordData.newPassword !== passwordData.repeatPassword) {
      setPasswordError('La nueva contraseña y la repetición deben coincidir.')
      return
    }

    setPasswordLoading(true)

    try {
      const response = await changeCurrentUserPassword(passwordData)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        repeatPassword: '',
      })
      setPasswordMessage(response?.detail || 'Contraseña actualizada correctamente.')
    } catch (error) {
      setPasswordError(error.message || 'No se pudo cambiar la contraseña.')
    } finally {
      setPasswordLoading(false)
    }
  }

  if (!hasAuthProfile) {
    return (
      <section className="perfil-state-card" aria-label="Sesión requerida">
        <p className="perfil-state-eyebrow">ISDB</p>
        <h1>Inicia sesión para ver tu perfil</h1>
        <p>Guarda tus listas, retoma tus series y personaliza tu espacio en un solo lugar.</p>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="perfil-state-card" aria-label="Cargando perfil">
        <p className="perfil-state-eyebrow">ISDB</p>
        <h1>Preparando tu perfil</h1>
        <p>Estamos reuniendo tu actividad, tus listas y tus series destacadas.</p>
      </section>
    )
  }

  if (!profile) {
    return (
      <section className="perfil-state-card" aria-label="Error de perfil">
        <p className="perfil-state-eyebrow">ISDB</p>
        <h1>No pudimos cargar tu perfil</h1>
        <p>{errorMessage || 'Vuelve a intentarlo en unos instantes.'}</p>
      </section>
    )
  }

  const displayName =
    profile.displayName ||
    `${profile.nombre || ''} ${profile.apellidos || ''}`.trim() ||
    profile.username ||
    authName ||
    profile.email ||
    authEmail
  const avatarUrl = profile.fotoPerfil || (isPublicProfile ? '' : authPicture) || ''
  const highlightedLists = listas.slice(0, 4)
  const spotlightProgress = continueWatchingSeries.slice(0, 3)
  const accountDetails = isPublicProfile
    ? [
        { label: 'Usuario', value: `@${profile.username || 'sin-usuario'}` },
      ]
    : [
        { label: 'Email', value: profile.email || authEmail || 'No disponible' },
        { label: 'Usuario', value: `@${profile.username || 'sin-usuario'}` },
        { label: 'Estado', value: profile.estadoCuenta || 'Activa' },
        {
          label: 'Rol',
          value: formatRole(profile.role || (profile.is_superuser || profile.is_staff ? 'admin' : 'user')),
        },
      ]
  const stats = isPublicProfile
    ? {
        continueWatching: publicStats?.continueWatching ?? 0,
        lists: publicStats?.lists ?? 0,
        savedSeries: publicStats?.savedSeries ?? 0,
        completedSeries: publicStats?.completedSeries ?? 0,
      }
    : {
        continueWatching: continueWatchingSeries.length,
        lists: listas.length,
        savedSeries: allListSeries.length,
        completedSeries: getCompletedSeriesCount(listas, progress),
      }
  const contentSections = [
    {
      kicker: 'Seguimiento',
      title: 'Continuar viendo',
      description: 'Las series que has dejado a medias para retomarlas cuando te apetezca.',
      series: continueWatchingSeries,
    },
    {
      kicker: 'Descubrimiento',
      title: 'Recomendadas para ti',
      description: 'Una selección para seguir ampliando tu biblioteca personal.',
      series: recommendedSeries,
    },
  ]

  return (
    <div className="perfil-page">
      <header className="perfil-hero">
        <div className="perfil-hero-main">
          <div className="perfil-avatar-shell">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`Avatar de ${displayName}`}
                className="perfil-avatar-image"
              />
            ) : (
              <span className="perfil-avatar-fallback">{getInitials(displayName)}</span>
            )}
          </div>

          <div className="perfil-hero-copy">
            <p className="perfil-kicker">Tu espacio en ISDB</p>
            <h1>{displayName}</h1>
            <div className="perfil-hero-meta">
              <span className="perfil-meta-pill">@{profile.username || 'sin-usuario'}</span>
              {!isPublicProfile ? (
                <>
                  <span className="perfil-meta-pill">{profile.email || authEmail || 'Sin email'}</span>
                  <span className="perfil-meta-pill is-soft">{profile.estadoCuenta || 'Activa'}</span>
                </>
              ) : null}
            </div>
            <p className="perfil-bio">
              {isPublicProfile
                ? 'Explora sus listas y sus series dentro de ISDB.'
                : 'Tu espacio para seguir lo que ves, ordenar tus listas y descubrir la siguiente serie.'}
            </p>

            <div className="perfil-detail-grid">
              {accountDetails.map((item) => (
                <div key={item.label} className="perfil-detail-card">
                  <span className="perfil-detail-label">{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            {!isPublicProfile ? (
              <div className="perfil-actions">
              <button className="perfil-btn-primary" onClick={() => navigate('/catalogo')}>
                Explorar catálogo
              </button>
              <button className="perfil-btn-secondary" onClick={() => navigate('/listas')}>
                Gestionar mis listas
              </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <section className="perfil-highlights-grid" aria-label="Resumen de actividad">
        <article className="perfil-highlight-card">
          <span className="perfil-stat-value">{stats.continueWatching}</span>
          <span className="perfil-stat-label">Series en curso</span>
        </article>
        <article className="perfil-highlight-card">
          <span className="perfil-stat-value">{stats.lists}</span>
          <span className="perfil-stat-label">Listas creadas</span>
        </article>
        <article className="perfil-highlight-card">
          <span className="perfil-stat-value">{stats.savedSeries}</span>
          <span className="perfil-stat-label">Series guardadas</span>
        </article>
        <article className="perfil-highlight-card">
          <span className="perfil-stat-value">
            {isPublicProfile ? stats.completedSeries : series.length}
          </span>
          <span className="perfil-stat-label">
            {isPublicProfile ? 'Completadas' : 'Series disponibles'}
          </span>
        </article>
      </section>

      {!isPublicProfile ? (
        <section className="perfil-overview-grid">
          <article className="perfil-panel perfil-panel-featured">
            <div className="perfil-panel-header">
              <p className="perfil-panel-kicker">Información personal</p>
              <h2>Editar tu perfil</h2>
              <p className="perfil-panel-text">
                Personaliza tu perfil y haz que tu espacio se sienta realmente tuyo.
              </p>
            </div>
  
            <form className="perfil-form" onSubmit={handleSaveProfile}>
              <label className="perfil-form-field">
                <span>Usuario</span>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(event) => setFormData({ ...formData, username: event.target.value })}
                />
              </label>
              <label className="perfil-form-field">
                <span>Email</span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                />
              </label>
              <label className="perfil-form-field">
                <span>Nombre</span>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(event) => setFormData({ ...formData, nombre: event.target.value })}
                />
              </label>
              <label className="perfil-form-field">
                <span>Apellidos</span>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(event) => setFormData({ ...formData, apellidos: event.target.value })}
                />
              </label>
              <label className="perfil-form-field">
                <span>Foto de perfil</span>
                <input
                  type="url"
                  value={formData.fotoPerfil}
                  onChange={(event) => setFormData({ ...formData, fotoPerfil: event.target.value })}
                />
              </label>
  
              <div className="perfil-system-grid" aria-label="Campos del sistema">
                <div className="perfil-system-card">
                  <span className="perfil-system-label">Estado de la cuenta</span>
                  <strong>{profile.estadoCuenta || 'Activa'}</strong>
                </div>
                <div className="perfil-system-card">
                  <span className="perfil-system-label">Rol</span>
                  <strong>{formatRole(profile.role || (profile.is_superuser || profile.is_staff ? 'admin' : 'user'))}</strong>
                </div>
              </div>
              <button type="submit" className="perfil-btn-primary">
                Guardar cambios
              </button>
            </form>
  
            {saveMessage ? <p className="perfil-form-message">{saveMessage}</p> : null}
            {errorMessage ? <p className="perfil-form-error">{errorMessage}</p> : null}
  
            <section className="perfil-password-panel">
              <button
                type="button"
                className="perfil-password-toggle"
                onClick={() => {
                  setPasswordPanelOpen((prev) => !prev)
                  setPasswordMessage('')
                  setPasswordError('')
                }}
                aria-expanded={passwordPanelOpen}
              >
                <span>Cambiar contraseña</span>
                <strong>{passwordPanelOpen ? 'Cerrar' : 'Abrir'}</strong>
              </button>
  
              {passwordPanelOpen ? (
                <form className="perfil-password-form" onSubmit={handlePasswordChange}>
                  <label className="perfil-form-field">
                    <span>Contraseña actual</span>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(event) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: event.target.value,
                        })
                      }
                      autoComplete="current-password"
                    />
                  </label>
                  <label className="perfil-form-field">
                    <span>Nueva contraseña</span>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(event) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: event.target.value,
                        })
                      }
                      autoComplete="new-password"
                    />
                  </label>
                  <label className="perfil-form-field">
                    <span>Repetir nueva contraseña</span>
                    <input
                      type="password"
                      value={passwordData.repeatPassword}
                      onChange={(event) =>
                        setPasswordData({
                          ...passwordData,
                          repeatPassword: event.target.value,
                        })
                      }
                      autoComplete="new-password"
                    />
                  </label>
  
                  <button type="submit" className="perfil-btn-primary" disabled={passwordLoading}>
                    {passwordLoading ? 'Actualizando...' : 'Actualizar contraseña'}
                  </button>
                </form>
              ) : null}
  
              {passwordMessage ? <p className="perfil-form-message">{passwordMessage}</p> : null}
              {passwordError ? <p className="perfil-form-error">{passwordError}</p> : null}
            </section>
          </article>
  
          <div className="perfil-sidebar-stack">
            <article className="perfil-panel perfil-panel-compact">
              <div className="perfil-panel-header">
                <p className="perfil-panel-kicker">Listas y seguimiento</p>
                <h2>Tu actividad</h2>
                <p className="perfil-panel-text">
                  Un vistazo rápido a tus colecciones y al contenido que tienes a medias.
                </p>
              </div>
  
              <div className="perfil-activity-grid">
                <div className="perfil-activity-tile">
                  <span className="perfil-activity-number">{listas.length}</span>
                  <span className="perfil-activity-label">Colecciones activas</span>
                </div>
                <div className="perfil-activity-tile">
                  <span className="perfil-activity-number">{continueWatchingSeries.length}</span>
                  <span className="perfil-activity-label">Series por retomar</span>
                </div>
              </div>
  
              {highlightedLists.length ? (
                <div className="perfil-badge-grid">
                  {highlightedLists.map((lista) => (
                    <div key={lista.id} className="perfil-badge-card">
                      <strong>{lista.tipoLista}</strong>
                      <span>{lista.series?.length ?? 0} series</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="perfil-empty-block">
                  <p>Todavía no tienes listas creadas. Puedes empezar desde cualquier serie.</p>
                </div>
              )}
  
              {spotlightProgress.length ? (
                <div className="perfil-mini-list">
                  {spotlightProgress.map((serie) => (
                    <div key={`progress-${serie.id ?? serie.pk}`} className="perfil-mini-list-item">
                      <strong>{serie.titulo}</strong>
                      <span>{serie.estado}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
  
            <article className="perfil-panel perfil-panel-compact">
              <div className="perfil-panel-header">
                <p className="perfil-panel-kicker">Acciones de cuenta</p>
                <h2>Gestión rápida</h2>
                <p className="perfil-panel-text">
                  Atajos útiles para moverte entre tus listas, tu perfil y nuevas series.
                </p>
              </div>
  
              <div className="perfil-action-stack">
                <button className="perfil-btn-secondary" onClick={() => navigate('/listas')}>
                  Abrir mis listas
                </button>
                <button className="perfil-btn-secondary" onClick={() => navigate('/catalogo')}>
                  Buscar nuevas series
                </button>
                <button className="perfil-btn-secondary" onClick={() => navigate(-1)}>
                  Volver a la página anterior
                </button>
              </div>
  
              <div className="perfil-connection-note">
                <span className="perfil-status-chip">{profile.estadoCuenta || 'Activa'}</span>
                <p>Todo listo para seguir viendo, guardar y descubrir nuevas historias.</p>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <section className="perfil-content-intro">
        <div>
          <p className="perfil-section-kicker">
            {isPublicProfile ? 'Biblioteca compartida' : 'Tu biblioteca personal'}
          </p>
          <h2>{isPublicProfile ? 'Listas y series' : 'Series, progreso y recomendaciones'}</h2>
        </div>
        <p className="perfil-section-description">
          {isPublicProfile
            ? 'Consulta sus colecciones en modo solo lectura.'
            : 'Sigue tu ritmo con series guardadas, episodios a medias y nuevas recomendaciones.'}
        </p>
      </section>

      <main className="perfil-content">
        <section className="perfil-collection">
          <div className="perfil-section-heading">
            <div>
              <p className="perfil-section-kicker">Colecciones</p>
              <h2>{isPublicProfile ? 'Sus listas' : 'Tus listas'}</h2>
            </div>
            <p className="perfil-section-description">
              Una serie destacada por lista, con la coleccion completa al desplegarla.
            </p>
          </div>

          {collectionItems.length ? (
            <div className="perfil-collections-grid">
              {collectionItems.map((collection) => (
                <ProfileCollectionCard
                  key={collection.id}
                  collection={collection}
                  isExpanded={expandedCollectionId === collection.id}
                  onToggle={() =>
                    setExpandedCollectionId((current) =>
                      current === collection.id ? null : collection.id,
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="perfil-empty-block">
              <p>
                {isPublicProfile
                  ? 'Este perfil todavía no tiene colecciones visibles.'
                  : 'Todavía no has creado colecciones.'}
              </p>
            </div>
          )}
        </section>

        {!isPublicProfile
          ? contentSections.map((section) => (
              <section key={section.title} className="perfil-collection">
                <div className="perfil-section-heading">
                  <div>
                    <p className="perfil-section-kicker">{section.kicker}</p>
                    <h2>{section.title}</h2>
                  </div>
                  <p className="perfil-section-description">{section.description}</p>
                </div>

                {section.series.length ? (
                  <div className="perfil-slider">
                    {section.series.map((serie) => (
                      <SerieCard
                        key={`${section.title}-${serie.id ?? serie.pk}`}
                        id={serie.id ?? serie.pk}
                        titulo={serie.titulo}
                        fechaEstreno={serie.fechaEstreno}
                        valoracionMedia={serie.valoracionMedia}
                        imagen={serie.imagenPortada}
                        estado={serie.estado}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="perfil-empty-block">
                    <p>No hay datos para esta sección todavía.</p>
                  </div>
                )}
              </section>
            ))
          : null}
      </main>
    </div>
  )
}

function ProfileCollectionCard({ collection, isExpanded, onToggle }) {
  const navigate = useNavigate()
  const representative = collection.representative
  const expandedId = `perfil-collection-${collection.id}`

  return (
    <article className="perfil-collection-summary-card">
      <button
        type="button"
        className="perfil-collection-title-button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={expandedId}
      >
        <span>
          <strong>{collection.title}</strong>
          <small>{collection.count} series</small>
        </span>
        <em>{isExpanded ? 'Cerrar' : 'Ver lista'}</em>
      </button>

      {representative ? (
        <button
          type="button"
          className="perfil-representative-card"
          onClick={() => navigate(`/series/${representative.id ?? representative.pk}`)}
        >
          <img src={representative.imagenPortada} alt={representative.titulo} />
          <span>
            <small>Última serie añadida</small>
            <strong>{representative.titulo}</strong>
          </span>
        </button>
      ) : (
        <div className="perfil-collection-empty">
          Esta colección todavía está vacía.
        </div>
      )}

      {isExpanded ? (
        <div id={expandedId} className="perfil-collection-expanded">
          {collection.series.length ? (
            <div className="perfil-slider">
              {collection.series.map((serie) => (
                <SerieCard
                  key={`${collection.id}-${serie.id ?? serie.pk}`}
                  id={serie.id ?? serie.pk}
                  titulo={serie.titulo}
                  fechaEstreno={serie.fechaEstreno}
                  valoracionMedia={serie.valoracionMedia}
                  imagen={serie.imagenPortada}
                  estado={collection.title}
                />
              ))}
            </div>
          ) : (
            <div className="perfil-empty-block">
              <p>No hay series dentro de esta colección.</p>
            </div>
          )}
        </div>
      ) : null}
    </article>
  )
}

function getCompletedSeriesCount(listas, progress) {
  const completedIds = new Set()

  listas
    .filter((lista) => lista.tipoLista?.trim().toLowerCase() === 'completadas')
    .forEach((lista) => {
      ;(lista.series ?? []).forEach((serie) => {
        const serieId = Number(serie.id ?? serie.pk ?? 0)

        if (serieId) {
          completedIds.add(serieId)
        }
      })
    })

  progress.forEach((item) => {
    const serie = item.serieDetalle
    const serieId = Number(serie?.id ?? serie?.pk ?? item.serie ?? 0)
    const totalEpisodes = Number(serie?.numeroEpisodios ?? 0)
    const watchedEpisodes = Number(item.episodiosVistos ?? 0)

    if (
      serieId &&
      (`${item.estado ?? ''}`.trim().toLowerCase() === 'completada' ||
        (totalEpisodes > 0 && watchedEpisodes >= totalEpisodes))
    ) {
      completedIds.add(serieId)
    }
  })

  return completedIds.size
}

function dedupeSeries(series) {
  const seen = new Set()

  return series.filter((serie) => {
    const serieId = Number(serie.id ?? serie.pk ?? 0)

    if (!serieId || seen.has(serieId)) {
      return false
    }

    seen.add(serieId)
    return true
  })
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

function formatRole(role) {
  return role === 'admin' ? 'Administrador' : 'Usuario'
}

export default Perfil
