import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  addSerieToList,
  createList,
  getStoredLists,
  isSerieInList,
  removeSerieFromList,
} from '../lib/listas'
import './SerieDetalle.css'

const mockData = [
  {
    pk: 1,
    titulo: 'Breaking Bad',
    descripcion:
      'Walter White, un profesor de quimica de secundaria con cancer de pulmon inoperable, decide asegurar el futuro de su familia fabricando metanfetamina con un exalumno.',
    fechaEstreno: '2008-01-20',
    fechaFin: '2013-09-29',
    imagenPortada:
      'https://imgs.search.brave.com/V3wM9yww_fcJYos8clmbu9vUf5tXvfSp3VpKV6bM9cw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJjYXQuY29t/L3cvZnVsbC8xLzEv/Zi8yMjg5MC0zODQw/eDIxNjAtZGVza3Rv/cC00ay1icmVha2lu/Zy1iYWQtd2FsbHBh/cGVyLXBob3RvLmpw/Zw',
    numeroEpisodios: 62,
    estado: 'Finalizada',
    valoracionMedia: 9.5,
    totalValoraciones: 1540,
  },
  {
    pk: 2,
    titulo: 'Stranger Things',
    descripcion:
      'Tras la desaparicion de un nino, un pueblo desvela un misterio relacionado con experimentos secretos, fuerzas sobrenaturales aterradoras y una nina muy extrana.',
    fechaEstreno: '2016-07-15',
    fechaFin: null,
    imagenPortada:
      'https://imgs.search.brave.com/vx3CkznpNkhfRQP8oHhFO8c6Jjb18-2GiO5PklSr0bI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMuc2Vla2xvZ28u/Y29tL2xvZ28tcG5n/LzY1LzIvc3RyYW5n/ZXItdGhpbmdzLXNl/YXNvbi01LWxvZ28t/cG5nX3NlZWtsb2dv/LTY1Mzg4OC5wbmc',
    numeroEpisodios: 34,
    estado: 'En emision',
    valoracionMedia: 8.7,
    totalValoraciones: 890,
  },
]

function SerieDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [serie, setSerie] = useState(null)
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
    const encontrada = mockData.find((item) => item.pk === Number.parseInt(id, 10)) || mockData[0]
    const timer = setTimeout(() => {
      setSerie(encontrada)
      setLoading(false)
    }, 400)

    return () => clearTimeout(timer)
  }, [id])

  const handleEnviarComentario = (event) => {
    event.preventDefault()

    if (!nuevoComentario.trim()) {
      return
    }

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

    if (!serie) {
      return
    }

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
    if (!serie) {
      return
    }

    const selectedList = listas.find((list) => list.id === listId)
    if (!selectedList) {
      return
    }

    const result = isSerieInList(selectedList, serie.pk)
      ? removeSerieFromList(listId, serie.pk)
      : addSerieToList(listId, serie)

    if (!result.ok) {
      setMensajeLista(result.error)
      return
    }

    setListas(result.lists)
    setMensajeLista(
      isSerieInList(selectedList, serie.pk)
        ? `"${serie.titulo}" ya no esta en "${selectedList.name}".`
        : `"${serie.titulo}" se ha anadido a "${selectedList.name}".`,
    )
  }

  if (loading) {
    return <div className="loader">Cargando detalles...</div>
  }

  if (!serie) {
    return <div className="error">Serie no encontrada.</div>
  }

  const listasConSerie = listas.filter((list) => isSerieInList(list, serie.pk)).length

  return (
    <div className="detalle-wrapper">
      <header
        className="detalle-hero"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fcfaf8 100%), url(${serie.imagenPortada})`,
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

          {panelListasAbierto ? (
            <section className="lista-panel" aria-label="Gestion de listas para la serie actual">
              <div className="lista-panel-heading">
                <div>
                  <h3>Guardar en tus listas</h3>
                  <p>
                    Crea una lista al vuelo o marca una existente para que esta serie
                    quede guardada en este navegador incluso despues de refrescar.
                  </p>
                </div>

                <button
                  className="lista-panel-link"
                  onClick={() => navigate('/listas')}
                >
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
                    const serieGuardada = isSerieInList(list, serie.pk)

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
                <span className="info-label">Valoraciones</span>
                <span className="info-value">{serie.totalValoraciones}</span>
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
