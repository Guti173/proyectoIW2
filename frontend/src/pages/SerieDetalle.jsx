import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  addSerieToUserList,
  createComentario,
  createUserList,
  getComentariosBySerie,
  getGeneros,
  getMyLists,
  getSerieById,
  removeSerieFromUserList,
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
  const [loading, setLoading] = useState(true)
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [panelListasAbierto, setPanelListasAbierto] = useState(false)
  const [nombreNuevaLista, setNombreNuevaLista] = useState('')
  const [mensajeLista, setMensajeLista] = useState('')
  const [mensajeComentario, setMensajeComentario] = useState('')

  useEffect(() => {
    let isCancelled = false

    async function loadData() {
      setLoading(true)
      setMensajeLista('')
      setMensajeComentario('')

      try {
        const results = await Promise.allSettled([
          getSerieById(id),
          getGeneros(),
          getComentariosBySerie(id),
          isAuthenticated ? getMyLists() : Promise.resolve([]),
        ])

        if (isCancelled) {
          return
        }

        const serieResult = results[0]
        const generosResult = results[1]
        const comentariosResult = results[2]
        const listasResult = results[3]

        setSerie(serieResult.status === 'fulfilled' ? serieResult.value : null)
        setGeneros(generosResult.status === 'fulfilled' ? generosResult.value : [])
        setComentarios(comentariosResult.status === 'fulfilled' ? comentariosResult.value : [])
        setListas(listasResult.status === 'fulfilled' ? listasResult.value : [])
      } catch {
        if (!isCancelled) {
          setSerie(null)
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

  const handleEnviarComentario = async (event) => {
    event.preventDefault()

    if (!nuevoComentario.trim()) {
      return
    }

    if (!isAuthenticated) {
      setMensajeComentario('Inicia sesion para publicar comentarios.')
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

  const handleCrearLista = async (event) => {
    event.preventDefault()

    if (!isAuthenticated) {
      setMensajeLista('Inicia sesion para crear listas.')
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
      setMensajeLista('Inicia sesion para usar tus listas.')
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
          ? `"${serie.titulo}" ya no esta en "${selectedList.tipoLista}".`
          : `"${serie.titulo}" se ha anadido a "${selectedList.tipoLista}".`,
      )
    } catch (error) {
      setMensajeLista(error.message || 'No se pudo actualizar la lista.')
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
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, #fcfaf8 100%), url(${serie.imagenPortada})`,
        }}
      >
        <button className="back-btn" onClick={() => navigate(-1)}>
          Volver
        </button>

        <div className="hero-content">
          <span className="status-pill">{serie.estado}</span>
          <h1 className="hero-title">{serie.titulo}</h1>

          <div className="hero-meta">
            <span className="rating-big">⭐ {serie.valoracionMedia}</span>
            <span>•</span>
            <span>{new Date(serie.fechaEstreno).getFullYear()}</span>
            <span>•</span>
            <span>{serie.numeroEpisodios} episodios</span>
          </div>

          <div className="hero-actions">
            <button className="btn-primary">Ver ahora</button>
            <button
              className="btn-secondary"
              onClick={() => {
                setPanelListasAbierto((prev) => !prev)
                setMensajeLista('')
              }}
            >
              {listasConSerie
                ? `Guardada en ${listasConSerie} lista${listasConSerie > 1 ? 's' : ''}`
                : '+ Anadir a mi lista'}
            </button>
          </div>

          {panelListasAbierto ? (
            <section className="lista-panel" aria-label="Gestion de listas para la serie actual">
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
                            {list.descripcion ? ` · ${list.descripcion}` : ''}
                          </p>
                        </div>

                        <button
                          className={serieGuardada ? 'lista-toggle-btn is-active' : 'lista-toggle-btn'}
                          onClick={() => handleToggleSerieEnLista(list.id)}
                        >
                          {serieGuardada ? 'Quitar' : 'Guardar aqui'}
                        </button>
                      </article>
                    )
                  })
                ) : (
                  <div className="lista-selector-empty">
                    <p>Aun no tienes listas creadas.</p>
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
              <h3>Generos</h3>
              <div className="generos-list">
                {generoNames.length ? (
                  generoNames.map((nombre) => (
                    <span key={nombre} className="genero-tag">
                      {nombre}
                    </span>
                  ))
                ) : (
                  <span className="no-generos">Sin generos asignados</span>
                )}
              </div>
            </div>

            <div className="comentarios-section">
              <h3>Comentarios ({comentarios.length})</h3>

              <form className="comentario-form" onSubmit={handleEnviarComentario}>
                <textarea
                  placeholder="Que te ha parecido esta serie?"
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
                          <span className="comentario-sep">•</span>
                          <span>{formatDate(comentario.fechaPublicacion)}</span>
                        </div>
                      </div>
                    </div>
                    <p>{comentario.contenido}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <aside className="detalle-sidebar">
            <div className="info-card-tecnica">
              <h4>Informacion tecnica</h4>

              <div className="info-item">
                <span className="info-label">Estado</span>
                <span className="info-value">{serie.estado}</span>
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
                <span className="info-label">Valoracion</span>
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
                Abrir Mis listas
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

export default SerieDetalle
