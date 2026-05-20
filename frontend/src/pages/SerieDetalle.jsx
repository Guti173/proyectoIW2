import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  addSerieToUserList,
  createComentario,
  createUserList,
  getComentariosBySerie,
  getGeneros,
  getMyLists,
  getProgressBySerie,
  getSerieById,
  removeSerieFromUserList,
  setSerieProgress,
  startSerieProgress,
  toggleCommentLike,
} from '../api/client'
import { getStoredAuthSession } from '../lib/auth0'
import './SerieDetalle.css'

function SerieDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const authSession = getStoredAuthSession()
  const isAuthenticated = Boolean(authSession?.profile)

  const [serie, setSerie] = useState(null)
  const [generos, setGeneros] = useState([])
  const [comentarios, setComentarios] = useState([])
  const [listas, setListas] = useState([])
  const [progreso, setProgreso] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [panelListasAbierto, setPanelListasAbierto] = useState(false)
  const [nombreNuevaLista, setNombreNuevaLista] = useState('')
  const [mensajeLista, setMensajeLista] = useState('')
  const [mensajeComentario, setMensajeComentario] = useState('')
  const [mensajeProgreso, setMensajeProgreso] = useState('')
  const [actualizandoProgreso, setActualizandoProgreso] = useState(false)
  const [comentarioLikeId, setComentarioLikeId] = useState(null)

  useEffect(() => {
    let isCancelled = false

    async function loadData() {
      setLoading(true)
      setMensajeLista('')
      setMensajeComentario('')
      setMensajeProgreso('')

      try {
        const results = await Promise.allSettled([
          getSerieById(id),
          getGeneros(),
          getComentariosBySerie(id),
          isAuthenticated ? getMyLists() : Promise.resolve([]),
          isAuthenticated ? getProgressBySerie(id) : Promise.resolve(null),
        ])

        if (isCancelled) {
          return
        }

        const serieResult = results[0]
        const generosResult = results[1]
        const comentariosResult = results[2]
        const listasResult = results[3]
        const progresoResult = results[4]

        setSerie(serieResult.status === 'fulfilled' ? serieResult.value : null)
        setGeneros(generosResult.status === 'fulfilled' ? generosResult.value : [])
        setComentarios(comentariosResult.status === 'fulfilled' ? comentariosResult.value : [])
        setListas(listasResult.status === 'fulfilled' ? listasResult.value : [])
        setProgreso(progresoResult.status === 'fulfilled' ? progresoResult.value : null)
      } catch {
        if (!isCancelled) {
          setSerie(null)
          setProgreso(null)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isCancelled = true
    }
  }, [id, isAuthenticated])

  const serieId = Number(serie?.id ?? serie?.pk ?? 0)
  const generoNames = useMemo(() => {
    if (!serie?.generos?.length || !generos.length) {
      return []
    }

    return serie.generos
      .map((generoId) => generos.find((item) => item.id === generoId)?.nombre)
      .filter(Boolean)
  }, [generos, serie])

  const listasConSerie = listas.filter((list) =>
    (list.series ?? []).some((item) => Number(item.id ?? item.pk ?? 0) === serieId),
  ).length
  const totalEpisodios = Math.max(Number(serie?.numeroEpisodios ?? 0), 0)
  const episodiosVistos = Math.max(Number(progreso?.episodiosVistos ?? 0), 0)
  const estadoSerieLabel = formatEstadoSerie(serie?.estado)
  const progresoCompletado = Boolean(
    progreso && totalEpisodios > 0 && episodiosVistos >= totalEpisodios,
  )
  const progresoPorcentaje = totalEpisodios
    ? Math.min(100, Math.round((episodiosVistos / totalEpisodios) * 100))
    : 0

  const handleEnviarComentario = async (event) => {
    event.preventDefault()

    if (!nuevoComentario.trim()) {
      return
    }

    if (!isAuthenticated) {
      setMensajeComentario('Inicia sesión para publicar comentarios.')
      return
    }

    try {
      const comentario = await createComentario({
        serie: serieId,
        contenido: nuevoComentario.trim(),
      })

      setComentarios((prev) => [comentario, ...prev])
      setNuevoComentario('')
      setMensajeComentario('Comentario publicado correctamente.')
    } catch (error) {
      setMensajeComentario(error.message || 'No se pudo publicar el comentario.')
    }
  }

  const handleToggleComentarioLike = async (comentarioId) => {
    if (!isAuthenticated) {
      setMensajeComentario('Inicia sesión para dar like a comentarios.')
      return
    }

    setComentarioLikeId(comentarioId)
    setMensajeComentario('')

    try {
      const updatedComentario = await toggleCommentLike(comentarioId)
      setComentarios((prev) =>
        prev.map((comentario) =>
          comentario.id === comentarioId ? updatedComentario : comentario,
        ),
      )
    } catch (error) {
      setMensajeComentario(error.message || 'No se pudo actualizar el like.')
    } finally {
      setComentarioLikeId(null)
    }
  }

  const handleCrearLista = async (event) => {
    event.preventDefault()

    if (!isAuthenticated) {
      setMensajeLista('Inicia sesión para crear listas.')
      return
    }

    try {
      const nuevaLista = await createUserList({
        tipoLista: nombreNuevaLista,
        descripcion: '',
        seriesIds: serieId ? [serieId] : [],
      })

      setListas((prev) => [nuevaLista, ...prev])
      setNombreNuevaLista('')
      setMensajeLista(`"${serie.titulo}" se ha guardado en "${nuevaLista.tipoLista}".`)
    } catch (error) {
      setMensajeLista(error.message || 'No se pudo crear la lista.')
    }
  }

  const handleToggleSerieEnLista = async (listId) => {
    if (!isAuthenticated) {
      setMensajeLista('Inicia sesión para usar tus listas.')
      return
    }

    const selectedList = listas.find((list) => list.id === listId)
    if (!selectedList) {
      return
    }

    const serieGuardada = (selectedList.series ?? []).some(
      (item) => Number(item.id ?? item.pk ?? 0) === serieId,
    )

    try {
      const updatedList = serieGuardada
        ? await removeSerieFromUserList(listId, serieId)
        : await addSerieToUserList(listId, serieId)

      setListas((prev) => prev.map((list) => (list.id === listId ? updatedList : list)))
      setMensajeLista(
        serieGuardada
          ? `"${serie.titulo}" ya no está en "${selectedList.tipoLista}".`
          : `"${serie.titulo}" se ha añadido a "${selectedList.tipoLista}".`,
      )
    } catch (error) {
      setMensajeLista(error.message || 'No se pudo actualizar la lista.')
    }
  }

  const refreshUserLists = async () => {
    try {
      const nextLists = await getMyLists()
      setListas(Array.isArray(nextLists) ? nextLists : [])
    } catch {
      setListas((prev) => prev)
    }
  }

  const showLoginRequired = (message) => {
    setPanelListasAbierto(false)
    setMensajeLista('')
    setMensajeProgreso(message)
  }

  const handleAbrirPanelListas = () => {
    if (!isAuthenticated) {
      showLoginRequired('Inicia sesión para añadir esta serie a tus listas.')
      return
    }

    setPanelListasAbierto((prev) => !prev)
    setMensajeLista('')
    setMensajeProgreso('')
  }

  const handleComenzarSerie = async () => {
    if (!isAuthenticated) {
      showLoginRequired('Inicia sesión para comenzar la serie.')
      return
    }

    if (!serieId) {
      return
    }

    setActualizandoProgreso(true)
    setMensajeProgreso('')

    try {
      const nextProgress = await startSerieProgress(serieId)
      setProgreso(nextProgress)
      await refreshUserLists()
      setMensajeProgreso('Serie comenzada. Se ha añadido a tu lista Viendo.')
    } catch (error) {
      setMensajeProgreso(error.message || 'No se pudo comenzar la serie.')
    } finally {
      setActualizandoProgreso(false)
    }
  }

  const handleActualizarEpisodios = async (nextValue) => {
    if (!isAuthenticated) {
      setMensajeProgreso('Inicia sesión para actualizar el progreso.')
      return
    }

    if (!serieId || totalEpisodios <= 0) {
      return
    }

    const nextEpisodes = Math.max(0, Math.min(Number(nextValue) || 0, totalEpisodios))
    setActualizandoProgreso(true)
    setMensajeProgreso('')

    try {
      const nextProgress = await setSerieProgress(serieId, nextEpisodes)
      setProgreso(nextProgress)
      await refreshUserLists()
      setMensajeProgreso(
        nextProgress.estado === 'Completada'
          ? 'Serie completada. Se ha movido a Completadas.'
          : 'Progreso actualizado.',
      )
    } catch (error) {
      setMensajeProgreso(error.message || 'No se pudo actualizar el progreso.')
    } finally {
      setActualizandoProgreso(false)
    }
  }

  if (loading) {
    return <div className="loader">Cargando detalles...</div>
  }

  if (!serie) {
    return <div className="error">Serie no encontrada.</div>
  }

  return (
    <div className="detalle-wrapper">
      <header
        className="detalle-hero"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(12,24,38,0.05) 0%, rgba(252,250,248,0.86) 100%), url(${serie.imagenPortada})`,
        }}
      >
        <button className="back-btn" onClick={() => navigate(-1)}>
          Volver
        </button>

        <div className="hero-content">
          <span className="status-pill">{estadoSerieLabel}</span>
          <h1 className="hero-title">{serie.titulo}</h1>

          <div className="hero-meta">
            <span className="rating-big">{serie.valoracionMedia}</span>
            <span className="hero-meta-sep">/</span>
            <span>{new Date(serie.fechaEstreno).getFullYear()}</span>
            <span className="hero-meta-sep">/</span>
            <span>{serie.numeroEpisodios} episodios</span>
          </div>

          <div className="hero-actions">
            <button
              className="btn-primary"
              onClick={handleComenzarSerie}
              disabled={actualizandoProgreso || progresoCompletado}
            >
              {progresoCompletado ? 'Serie completada' : 'Comenzar serie'}
            </button>
            <button
              className="btn-secondary"
              onClick={handleAbrirPanelListas}
            >
              {listasConSerie
                ? `Guardada en ${listasConSerie} lista${listasConSerie > 1 ? 's' : ''}`
                : '+ Añadir a mi lista'}
            </button>
          </div>

          {progreso ? (
            <section className="progress-panel" aria-label="Progreso de la serie">
              <div className="progress-panel-header">
                <div>
                  <h3>Mi progreso</h3>
                  <p>{progreso.estado} desde {formatDate(progreso.fechaInicio)}</p>
                </div>

                <span
                  className={progresoCompletado ? 'progress-status is-completed' : 'progress-status'}
                >
                  {progreso.estado}
                </span>
              </div>

              <div className="progress-bar-shell" aria-hidden="true">
                <span style={{ width: `${progresoPorcentaje}%` }} />
              </div>

              <div className="progress-controls">
                <button
                  className="progress-stepper-btn"
                  onClick={() => handleActualizarEpisodios(episodiosVistos - 1)}
                  disabled={actualizandoProgreso || episodiosVistos <= 0}
                >
                  -
                </button>

                <div className="progress-counter">
                  <strong>{episodiosVistos}</strong>
                  <span>de {totalEpisodios} episodios</span>
                </div>

                <button
                  className="progress-stepper-btn"
                  onClick={() => handleActualizarEpisodios(episodiosVistos + 1)}
                  disabled={
                    actualizandoProgreso ||
                    totalEpisodios <= 0 ||
                    episodiosVistos >= totalEpisodios
                  }
                >
                  +
                </button>

                <button
                  className="progress-complete-btn"
                  onClick={() => handleActualizarEpisodios(totalEpisodios)}
                  disabled={actualizandoProgreso || totalEpisodios <= 0 || progresoCompletado}
                >
                  Completar
                </button>
              </div>

              {mensajeProgreso ? <p className="lista-feedback">{mensajeProgreso}</p> : null}
            </section>
          ) : mensajeProgreso ? (
            <p className="lista-feedback">{mensajeProgreso}</p>
          ) : null}

          {panelListasAbierto ? (
            <section className="lista-panel" aria-label="Gestión de listas para la serie actual">
              <div className="lista-panel-heading">
                <div>
                  <h3>Guardar en tus listas</h3>
                  <p>
                    Crea una nueva o elige una de las tuyas para guardar esta serie donde quieras.
                  </p>
                </div>

                <button className="lista-panel-link" onClick={() => navigate('/listas')}>
                  Gestionar todas
                </button>
              </div>

              <form className="lista-creator-form" onSubmit={handleCrearLista}>
                <input
                  type="text"
                  value={nombreNuevaLista}
                  onChange={(event) => setNombreNuevaLista(event.target.value)}
                  placeholder="Ej. Favoritas para ver en familia"
                />
                <button type="submit" className="btn-primary btn-small">
                  Crear y guardar
                </button>
              </form>

              {mensajeLista ? <p className="lista-feedback">{mensajeLista}</p> : null}

              <div className="lista-selector-grid">
                {listas.length ? (
                  listas.map((list) => {
                    const serieGuardada = (list.series ?? []).some(
                      (item) => Number(item.id ?? item.pk ?? 0) === serieId,
                    )

                    return (
                      <article key={list.id} className="lista-selector-card">
                        <div>
                          <strong>{list.tipoLista}</strong>
                          <p>
                            {list.series?.length ?? 0} series
                            {list.descripcion ? ` - ${list.descripcion}` : ''}
                          </p>
                        </div>

                        <button
                          className={serieGuardada ? 'lista-toggle-btn is-active' : 'lista-toggle-btn'}
                          onClick={() => handleToggleSerieEnLista(list.id)}
                        >
                          {serieGuardada ? 'Quitar' : 'Guardar aquí'}
                        </button>
                      </article>
                    )
                  })
                ) : (
                  <div className="lista-selector-empty">
                    <p>Aún no tienes listas creadas.</p>
                    <span>Usa el formulario superior para crear la primera y guardar esta serie.</span>
                  </div>
                )}
              </div>
            </section>
          ) : null}
        </div>
      </header>

      <main className="detalle-container">
        <div className="detalle-grid">
          <section className="detalle-main">
            <div className="detalle-card">
              <h3>Sinopsis</h3>
              <p className="descripcion">{serie.descripcion}</p>
            </div>

            <div className="detalle-card generos-section">
              <h3>Géneros</h3>
              <div className="generos-list">
                {generoNames.length ? (
                  generoNames.map((nombre) => (
                    <span key={nombre} className="genero-tag">
                      {nombre}
                    </span>
                  ))
                ) : (
                  <span className="no-generos">Sin géneros asignados</span>
                )}
              </div>
            </div>

            <div className="comentarios-section">
              <h3>Comentarios ({comentarios.length})</h3>

              <form className="comentario-form" onSubmit={handleEnviarComentario}>
                <textarea
                  placeholder="¿Qué te ha parecido esta serie?"
                  value={nuevoComentario}
                  onChange={(event) => setNuevoComentario(event.target.value)}
                  rows="3"
                />
                <button type="submit" className="btn-primary btn-small">
                  Publicar
                </button>
              </form>

              {mensajeComentario ? <p className="lista-feedback">{mensajeComentario}</p> : null}

              <div className="comentarios-lista">
                {comentarios.map((comentario) => (
                  <article key={comentario.id} className="comentario-card">
                    <div className="comentario-header">
                      <div className="avatar">{(comentario.autor || 'U').charAt(0)}</div>
                      <div className="comentario-meta">
                        <div className="comentario-user-row">
                          <strong>{comentario.autor || 'Usuario'}</strong>
                          <span className="comentario-sep">/</span>
                          <span>{formatDate(comentario.fechaPublicacion)}</span>
                        </div>
                        <button
                          type="button"
                          className="comentario-reportar"
                          onClick={() => navigate(`/reportar-comentario/${comentario.id}`)}
                        >
                          Reportar
                        </button>
                      </div>
                    </div>
                    <p>{comentario.contenido}</p>
                    <div className="comentario-actions">
                      <button
                        type="button"
                        className={
                          comentario.likedByMe
                            ? 'comentario-like-btn is-active'
                            : 'comentario-like-btn'
                        }
                        disabled={comentarioLikeId === comentario.id}
                        onClick={() => handleToggleComentarioLike(comentario.id)}
                      >
                        {comentario.likedByMe ? 'Te gusta' : 'Me gusta'}
                      </button>
                      <span>
                        {Number(comentario.totalLikes ?? comentario.contadorLikes ?? 0)} like
                        {Number(comentario.totalLikes ?? comentario.contadorLikes ?? 0) === 1
                          ? ''
                          : 's'}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <aside className="detalle-sidebar">
            <div className="info-card-tecnica">
              <h4>Información técnica</h4>

              <div className="info-item">
                <span className="info-label">Estado</span>
                <span className="info-value">{estadoSerieLabel}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Episodios</span>
                <span className="info-value">{serie.numeroEpisodios}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Fecha de estreno</span>
                <span className="info-value">{serie.fechaEstreno}</span>
              </div>

              {serie.fechaFin ? (
                <div className="info-item">
                  <span className="info-label">Fecha de fin</span>
                  <span className="info-value">{serie.fechaFin}</span>
                </div>
              ) : null}

              <div className="info-item">
                <span className="info-label">Valoración</span>
                <span className="info-value">{serie.valoracionMedia}/10</span>
              </div>

              <div className="info-item">
                <span className="info-label">Total valoraciones</span>
                <span className="info-value">{serie.totalValoraciones || 0}</span>
              </div>
            </div>

            <div className="info-card-tecnica detalle-listas-card">
              <h4>Tus listas</h4>

              <div className="info-item">
                <span className="info-label">Guardada en</span>
                <span className="info-value">
                  {listasConSerie} lista{listasConSerie === 1 ? '' : 's'}
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">Listas creadas</span>
                <span className="info-value">{listas.length}</span>
              </div>

              <button className="btn-secondary detalle-sidebar-btn" onClick={() => navigate('/listas')}>
                Abrir mis listas
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

function formatDate(value) {
  if (!value) {
    return 'Sin fecha'
  }

  try {
    return new Date(value).toLocaleDateString('es-ES')
  } catch {
    return value
  }
}

function formatEstadoSerie(value) {
  if (value === 'En emision') {
    return 'En emisión'
  }

  return value
}

export default SerieDetalle
