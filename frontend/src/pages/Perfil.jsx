import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getCurrentUserProfile,
  getMyLists,
  getMyProgress,
  getSeries,
  updateCurrentUserProfile,
} from '../api/client'
import SerieCard from '../components/SerieCard'
import { getStoredAuthSession } from '../lib/auth0'
import './Perfil.css'

function Perfil() {
  const navigate = useNavigate()
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
  const [profile, setProfile] = useState(null)
  const [listas, setListas] = useState([])
  const [progress, setProgress] = useState([])
  const [series, setSeries] = useState([])
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    nombre: '',
    apellidos: '',
    fotoPerfil: '',
    estadoCuenta: 'Activa',
  })

  useEffect(() => {
    let isCancelled = false

    async function loadProfileData() {
      if (!hasAuthProfile) {
        setLoading(false)
        return
      }

      try {
        const [profileData, listasData, progressData, seriesData] = await Promise.all([
          getCurrentUserProfile(),
          getMyLists(),
          getMyProgress(),
          getSeries(),
        ])

        if (isCancelled) {
          return
        }

        setProfile(profileData)
        setListas(Array.isArray(listasData) ? listasData : [])
        setProgress(Array.isArray(progressData) ? progressData : [])
        setSeries(Array.isArray(seriesData) ? seriesData : [])
        setFormData({
          username: profileData.username || '',
          password: profileData.password || '',
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
  }, [authEmail, authPicture, authUserKey, hasAuthProfile])

  const listSeries = useMemo(
    () => dedupeSeries(listas.flatMap((lista) => (lista.series ?? []).map((serie) => ({
      ...serie,
      estado: lista.tipoLista,
    })))),
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

          return {
            ...serie,
            estado: item.estado || `${item.episodiosVistos} episodios`,
          }
        })
        .filter(Boolean),
    [progress],
  )

  const recommendedSeries = useMemo(() => {
    const savedIds = new Set(listSeries.map((serie) => Number(serie.id ?? serie.pk ?? 0)))

    return [...series]
      .sort((left, right) => Number(right.valoracionMedia ?? 0) - Number(left.valoracionMedia ?? 0))
      .filter((serie) => !savedIds.has(Number(serie.id ?? serie.pk ?? 0)))
      .slice(0, 6)
  }, [listSeries, series])

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    setSaveMessage('')
    setErrorMessage('')

    try {
      const updatedProfile = await updateCurrentUserProfile(formData)
      setProfile(updatedProfile)
      setFormData({
        username: updatedProfile.username || '',
        password: updatedProfile.password || '',
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
    `${profile.nombre || ''} ${profile.apellidos || ''}`.trim() ||
    profile.username ||
    authName ||
    profile.email ||
    authEmail
  const avatarUrl = profile.fotoPerfil || authPicture || ''
  const highlightedLists = listas.slice(0, 4)
  const spotlightProgress = continueWatchingSeries.slice(0, 3)
  const accountDetails = [
    { label: 'Email', value: profile.email || authEmail || 'No disponible' },
    { label: 'Usuario', value: `@${profile.username || 'sin-usuario'}` },
    { label: 'Estado', value: profile.estadoCuenta || 'Activa' },
    { label: 'Rol', value: formatRole(profile.role || (profile.is_superuser || profile.is_staff ? 'admin' : 'user')) },
  ]
  const sections = [
    {
      kicker: 'Seguimiento',
      title: 'Continuar viendo',
      description: 'Las series que has dejado a medias para retomarlas cuando te apetezca.',
      series: continueWatchingSeries,
    },
    {
      kicker: 'Colecciones',
      title: 'Tus listas',
      description: 'Tus favoritas, pendientes y descubrimientos reunidos en un mismo lugar.',
      series: listSeries,
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
            <span className="perfil-meta-pill">{profile.email || authEmail || 'Sin email'}</span>
            <span className="perfil-meta-pill is-soft">{profile.estadoCuenta || 'Activa'}</span>
          </div>
          <p className="perfil-bio">
              Tu espacio para seguir lo que ves, ordenar tus listas y descubrir la siguiente serie.
            </p>

            <div className="perfil-detail-grid">
              {accountDetails.map((item) => (
                <div key={item.label} className="perfil-detail-card">
                  <span className="perfil-detail-label">{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="perfil-actions">
              <button className="perfil-btn-primary" onClick={() => navigate('/catalogo')}>
                Explorar catálogo
              </button>
              <button className="perfil-btn-secondary" onClick={() => navigate('/listas')}>
                Gestionar mis listas
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="perfil-highlights-grid" aria-label="Resumen de actividad">
        <article className="perfil-highlight-card">
          <span className="perfil-stat-value">{continueWatchingSeries.length}</span>
          <span className="perfil-stat-label">Series en curso</span>
        </article>
        <article className="perfil-highlight-card">
          <span className="perfil-stat-value">{listas.length}</span>
          <span className="perfil-stat-label">Listas creadas</span>
        </article>
        <article className="perfil-highlight-card">
          <span className="perfil-stat-value">{listSeries.length}</span>
          <span className="perfil-stat-label">Series guardadas</span>
        </article>
        <article className="perfil-highlight-card">
          <span className="perfil-stat-value">{series.length}</span>
          <span className="perfil-stat-label">Series disponibles</span>
        </article>
      </section>

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
              <span>Contraseña</span>
              <input
                type="password"
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: event.target.value })}
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
              <div className="perfil-system-card perfil-system-card-wide">
                <span className="perfil-system-label">Acceso vinculado</span>
                <strong>{profile.auth0Sub || 'No enlazado'}</strong>
              </div>
            </div>
            <button type="submit" className="perfil-btn-primary">
              Guardar cambios
            </button>
          </form>

          {saveMessage ? <p className="perfil-form-message">{saveMessage}</p> : null}
          {errorMessage ? <p className="perfil-form-error">{errorMessage}</p> : null}
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

      <section className="perfil-content-intro">
        <div>
          <p className="perfil-section-kicker">Tu biblioteca personal</p>
          <h2>Series, progreso y recomendaciones</h2>
        </div>
        <p className="perfil-section-description">
          Sigue tu ritmo con series guardadas, episodios a medias y nuevas recomendaciones.
        </p>
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
                <p>
                  {section.title === 'Tus listas'
                    ? 'Todavía no has guardado series en listas.'
                    : 'No hay datos para esta sección todavía.'}
                </p>
              </div>
            )}
          </section>
        ))}
      </main>
    </div>
  )
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
