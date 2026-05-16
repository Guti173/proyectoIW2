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
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [profile, setProfile] = useState(null)
  const [listas, setListas] = useState([])
  const [progress, setProgress] = useState([])
  const [series, setSeries] = useState([])
  const [formData, setFormData] = useState({
    username: '',
    nombre: '',
    apellidos: '',
    fotoPerfil: '',
    estadoCuenta: 'Activa',
  })

  useEffect(() => {
    let isCancelled = false

    async function loadProfileData() {
      if (!authProfile) {
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
          nombre: profileData.nombre || '',
          apellidos: profileData.apellidos || '',
          fotoPerfil: profileData.fotoPerfil || authProfile.picture || '',
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
  }, [authProfile])

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

  if (!authProfile) {
    return (
      <section className="perfil-state-card" aria-label="Sesion requerida">
        <p className="perfil-state-eyebrow">ISDB</p>
        <h1>Inicia sesion para ver tu perfil</h1>
        <p>El perfil y las listas ahora se cargan desde la base de datos del backend.</p>
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
        <p>{errorMessage || 'Revisa la conexion con el backend y la configuracion de Auth0.'}</p>
      </section>
    )
  }

  const displayName =
    `${profile.nombre || ''} ${profile.apellidos || ''}`.trim() ||
    authProfile.name ||
    profile.username
  const avatarUrl = profile.fotoPerfil || authProfile.picture || ''
  const infoCards = [
    {
      kicker: 'Cuenta',
      title: 'Datos principales',
      items: [
        { label: 'Usuario', value: `@${profile.username || 'sin-usuario'}` },
        { label: 'Email', value: profile.email || authProfile.email || 'No disponible' },
        { label: 'Estado', value: profile.estadoCuenta || 'Activa' },
      ],
    },
    {
      kicker: 'Listas',
      title: 'Resumen',
      items: [
        { label: 'Listas creadas', value: `${listas.length}` },
        { label: 'Series guardadas', value: `${listSeries.length}` },
        { label: 'Series en progreso', value: `${continueWatchingSeries.length}` },
      ],
    },
  ]
  const sections = [
    {
      kicker: 'Seguimiento',
      title: 'Continuar viendo',
      description: 'Progreso real del backend para tu cuenta actual.',
      series: continueWatchingSeries,
    },
    {
      kicker: 'Colecciones',
      title: 'Tus listas',
      description: 'Series guardadas en tus listas persistidas en la base de datos.',
      series: listSeries,
    },
    {
      kicker: 'Descubrimiento',
      title: 'Recomendadas para ti',
      description: 'Las mejor valoradas que todavia no has guardado en tus listas.',
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
            <p className="perfil-kicker">{profile.groupName || 'Perfil ISDB'}</p>
            <h1>{displayName}</h1>
            <p className="perfil-handle">@{profile.username || 'sin-usuario'}</p>
            <p className="perfil-bio">
              Perfil sincronizado con Auth0 para identificacion y con Django para datos persistentes.
            </p>

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
          <span className="perfil-status-chip">{profile.estadoCuenta || 'Activa'}</span>
          <p>Tu cuenta ya esta enlazada al backend mediante la sesion de Auth0.</p>
        </div>
      </header>

      <section className="perfil-stats-grid" aria-label="Resumen de actividad">
        <article className="perfil-stat-card">
          <span className="perfil-stat-value">{continueWatchingSeries.length}</span>
          <span className="perfil-stat-label">Series en curso</span>
        </article>
        <article className="perfil-stat-card">
          <span className="perfil-stat-value">{listas.length}</span>
          <span className="perfil-stat-label">Listas creadas</span>
        </article>
        <article className="perfil-stat-card">
          <span className="perfil-stat-value">{listSeries.length}</span>
          <span className="perfil-stat-label">Series guardadas</span>
        </article>
        <article className="perfil-stat-card">
          <span className="perfil-stat-value">{series.length}</span>
          <span className="perfil-stat-label">Series disponibles</span>
        </article>
      </section>

      <section className="perfil-overview-grid">
        <article className="perfil-panel perfil-panel-featured">
          <div className="perfil-panel-header">
            <p className="perfil-panel-kicker">Perfil editable</p>
            <h2>Actualiza tu informacion sincronizada</h2>
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
            <button type="submit" className="perfil-btn-primary">
              Guardar cambios
            </button>
          </form>

          {saveMessage ? <p className="perfil-form-message">{saveMessage}</p> : null}
          {errorMessage ? <p className="perfil-form-error">{errorMessage}</p> : null}
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
                    ? 'Todavia no has guardado series en listas.'
                    : 'No hay datos para esta seccion todavia.'}
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

export default Perfil
