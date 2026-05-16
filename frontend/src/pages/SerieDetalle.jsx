import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSerieById, getGeneros } from '../api/client'
import {
  addSerieToList,
  createList,
  getStoredLists,
  isSerieInList,
  removeSerieFromList,
} from '../lib/listas'
import './SerieDetalle.css'

function SerieDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [serie, setSerie] = useState(null)
  const [generos, setGeneros] = useState([])
  const [loading, setLoading] = useState(true)

  const [nuevoComentario, setNuevoComentario] = useState('')
  const [comentarios, setComentarios] = useState([
    {
      id: 1,
      autor: 'Cinefilo99',
      texto: 'Una obra maestra de principio a fin.',
      fecha: 'Hace 2 dias',
    },
    {
      id: 2,
      autor: 'DevReact',
      texto: 'El desarrollo de personajes es increible.',
      fecha: 'Hace 1 semana',
    },
  ])

  const [listas, setListas] = useState(() => getStoredLists())
  const [panelListasAbierto, setPanelListasAbierto] = useState(false)
  const [nombreNuevaLista, setNombreNuevaLista] = useState('')
  const [mensajeLista, setMensajeLista] = useState('')

  useEffect(() => {
    async function loadData() {
      setLoading(true)

      try {
        const [serieData, generosData] = await Promise.all([
          getSerieById(id),
          getGeneros(),
        ])

        setSerie(serieData)
        setGeneros(generosData)
      } catch (error) {
        console.error('Error cargando serie:', error)
        setSerie(null)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const serieId = serie?.pk ?? serie?.id

  const handleEnviarComentario = (event) => {
    event.preventDefault()

    if (!nuevoComentario.trim()) return

    const comentario = {
      id: Date.now(),
      autor: 'Usuario Actual',
      texto: nuevoComentario.trim(),
      fecha: 'Justo ahora',
    }

    setComentarios([comentario, ...comentarios])
    setNuevoComentario('')
  }

  const handleCrearLista = (event) => {
    event.preventDefault()

    if (!serie) return

    const result = createList({
      name: nombreNuevaLista,
      initialSerie: serie,
    })

    if (!result.ok) {
      setMensajeLista(result.error)
      return
    }

    setListas(result.lists)
    setNombreNuevaLista('')
    setMensajeLista(`"${serie.titulo}" se ha guardado en "${result.list.name}".`)
  }

  const handleToggleSerieEnLista = (listId) => {
    if (!serie) return

    const selectedList = listas.find((list) => list.id === listId)
    if (!selectedList) return

    const estaGuardada = isSerieInList(selectedList, serieId)

    const result = estaGuardada
      ? removeSerieFromList(listId, serieId)
      : addSerieToList(listId, serie)

    if (!result.ok) {
      setMensajeLista(result.error)
      return
    }

    setListas(result.lists)
    setMensajeLista(
      estaGuardada
        ? `"${serie.titulo}" ya no esta en "${selectedList.name}".`
        : `"${serie.titulo}" se ha anadido a "${selectedList.name}".`,
    )
  }

  const getGeneroNames = () => {
    if (!serie?.generos || generos.length === 0) return []

    return serie.generos
      .map((gId) => {
        const genero = generos.find((g) => g.id === gId)
        return genero ? genero.nombre : ''
      })
      .filter(Boolean)
  }

  if (loading) return <div className="loader">Cargando detalles...</div>
  if (!serie) return <div className="error">Serie no encontrada.</div>

  const listasConSerie = listas.filter((list) => isSerieInList(list, serieId)).length
  const generoNames = getGeneroNames()

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
                setPanelListasAbierto(!panelListasAbierto)
                setMensajeLista('')
              }}
            >
              {listasConSerie
                ? `Guardada en ${listasConSerie} lista${listasConSerie > 1 ? 's' : ''}`
                : '+ Anadir a mi lista'}
            </button>
          </div>

          {panelListasAbierto && (
            <section className="lista-panel" aria-label="Gestion de listas para la serie actual">
              <div className="lista-panel-heading">
                <div>
                  <h3>Guardar en tus listas</h3>
                  <p>
                    Crea una lista al vuelo o marca una existente para que esta serie
                    quede guardada en este navegador incluso despues de refrescar.
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

              {mensajeLista && <p className="lista-feedback">{mensajeLista}</p>}

              <div className="lista-selector-grid">
                {listas.length ? (
                  listas.map((list) => {
                    const serieGuardada = isSerieInList(list, serieId)

                    return (
                      <article key={list.id} className="lista-selector-card">
                        <div>
                          <strong>{list.name}</strong>
                          <p>
                            {list.series.length} series
                            {list.description ? ` · ${list.description}` : ''}
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
          )}
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
                  placeholder="Que te ha parecido esta serie?"
                  value={nuevoComentario}
                  onChange={(event) => setNuevoComentario(event.target.value)}
                  rows="3"
                />
                <button type="submit" className="btn-primary btn-small">
                  Publicar
                </button>
              </form>

              <div className="comentarios-lista">
                {comentarios.map((comentario) => (
                  <article key={comentario.id} className="comentario-card">
                    <div className="comentario-header">
                      <div className="avatar">{comentario.autor.charAt(0)}</div>
                      <div className="comentario-meta">
                        <div className="comentario-user-row">
                          <strong>{comentario.autor}</strong>
                          <span className="comentario-sep">•</span>
                          <span>{comentario.fecha}</span>
                        </div>
                      </div>
                    </div>
                    <p>{comentario.texto}</p>
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
                <span className="info-label">Fecha de Estreno</span>
                <span className="info-value">{serie.fechaEstreno}</span>
              </div>

              {serie.fechaFin && (
                <div className="info-item">
                  <span className="info-label">Fecha de Fin</span>
                  <span className="info-value">{serie.fechaFin}</span>
                </div>
              )}

              <div className="info-item">
                <span className="info-label">Valoración</span>
                <span className="info-value">{serie.valoracionMedia}/10</span>
              </div>

              <div className="info-item">
                <span className="info-label">Total Valoraciones</span>
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

export default SerieDetalle