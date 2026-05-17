import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createUserList,
  deleteUserList,
  getMyLists,
  removeSerieFromUserList,
} from '../api/client'
import SerieCard from '../components/SerieCard'
import { getStoredAuthSession } from '../lib/auth0'
import './MisListas.css'

function MisListas() {
  const navigate = useNavigate()
  const authSession = getStoredAuthSession()
  const authUserKey = authSession?.profile?.sub ?? authSession?.profile?.email ?? ''
  const hasAuthProfile = Boolean(authUserKey)
  const [listas, setListas] = useState([])
  const [nombreLista, setNombreLista] = useState('')
  const [descripcionLista, setDescripcionLista] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    async function loadLists() {
      if (!hasAuthProfile) {
        setLoading(false)
        return
      }

      try {
        const data = await getMyLists()

        if (!isCancelled) {
          setListas(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        if (!isCancelled) {
          setMensaje(error.message || 'No se pudieron cargar tus listas.')
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadLists()

    return () => {
      isCancelled = true
    }
  }, [authUserKey, hasAuthProfile])

  const totalSeriesGuardadas = useMemo(
    () => listas.reduce((total, lista) => total + (lista.series?.length ?? 0), 0),
    [listas],
  )

  const seriesUnicas = useMemo(() => {
    const ids = new Set(
      listas.flatMap((lista) =>
        (lista.series ?? []).map((serie) => Number(serie.id ?? serie.pk ?? 0)),
      ),
    )

    ids.delete(0)
    return ids.size
  }, [listas])

  const listasConContenido = useMemo(
    () => listas.filter((lista) => (lista.series?.length ?? 0) > 0).length,
    [listas],
  )

  const listasVacias = Math.max(listas.length - listasConContenido, 0)

  const listasDestacadas = useMemo(
    () =>
      [...listas]
        .sort((left, right) => (right.series?.length ?? 0) - (left.series?.length ?? 0))
        .slice(0, 4),
    [listas],
  )

  const handleCrearLista = async (event) => {
    event.preventDefault()
    setMensaje('')

    try {
      const nuevaLista = await createUserList({
        tipoLista: nombreLista,
        descripcion: descripcionLista,
      })

      setListas((prev) => [nuevaLista, ...prev])
      setNombreLista('')
      setDescripcionLista('')
      setMensaje(`Lista "${nuevaLista.tipoLista}" creada correctamente.`)
    } catch (error) {
      setMensaje(error.message || 'No se pudo crear la lista.')
    }
  }

  const handleEliminarLista = async (listId, listName) => {
    setMensaje('')

    try {
      await deleteUserList(listId)
      setListas((prev) => prev.filter((lista) => lista.id !== listId))
      setMensaje(`La lista "${listName}" se ha eliminado.`)
    } catch (error) {
      setMensaje(error.message || 'No se pudo eliminar la lista.')
    }
  }

  const handleQuitarSerie = async (listId, serieId, serieTitulo) => {
    setMensaje('')

    try {
      const updatedList = await removeSerieFromUserList(listId, serieId)
      setListas((prev) => prev.map((lista) => (lista.id === listId ? updatedList : lista)))
      setMensaje(`"${serieTitulo}" ya no forma parte de esa lista.`)
    } catch (error) {
      setMensaje(error.message || 'No se pudo quitar la serie de la lista.')
    }
  }

  if (!hasAuthProfile) {
    return (
      <section className="mis-listas-state-card">
        <p className="mis-listas-kicker">Mis listas</p>
        <h2>Inicia sesion para abrir tus colecciones</h2>
        <p>Guarda favoritas, pendientes y maratones en un espacio siempre a mano.</p>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="mis-listas-state-card">
        <p className="mis-listas-kicker">Mis listas</p>
        <h2>Preparando tus listas</h2>
        <p>Estamos reuniendo tus colecciones para que puedas volver a ellas en segundos.</p>
      </section>
    )
  }

  return (
    <div className="mis-listas-page">
      <header className="mis-listas-hero">
        <div className="mis-listas-hero-copy">
          <p className="mis-listas-kicker">Tus colecciones</p>
          <h1>Listas con personalidad propia</h1>
          <p>
            Reune favoritas, pendientes y descubrimientos en un espacio comodo para volver cuando
            quieras.
          </p>

          <div className="mis-listas-hero-meta">
            <span className="mis-listas-meta-pill">{listas.length} listas</span>
            <span className="mis-listas-meta-pill">{totalSeriesGuardadas} series guardadas</span>
            <span className="mis-listas-meta-pill is-soft">{seriesUnicas} titulos unicos</span>
          </div>

          <div className="mis-listas-actions">
            <button className="mis-listas-btn-primary" onClick={() => navigate('/catalogo')}>
              Explorar catalogo
            </button>
            <button className="mis-listas-btn-secondary" onClick={() => navigate('/perfil')}>
              Volver al perfil
            </button>
          </div>
        </div>

        <div className="mis-listas-detail-grid">
          <div className="mis-listas-detail-card">
            <span className="mis-listas-detail-label">Colecciones activas</span>
            <strong>{listasConContenido}</strong>
          </div>
          <div className="mis-listas-detail-card">
            <span className="mis-listas-detail-label">Por completar</span>
            <strong>{listasVacias}</strong>
          </div>
          <div className="mis-listas-detail-card">
            <span className="mis-listas-detail-label">Mas extensa</span>
            <strong>{listasDestacadas[0]?.tipoLista || 'Aun por crear'}</strong>
          </div>
        </div>
      </header>

      <section className="mis-listas-highlights-grid" aria-label="Resumen de listas">
        <article className="mis-listas-highlight-card">
          <span className="mis-listas-stat-value">{listas.length}</span>
          <span className="mis-listas-stat-label">Listas creadas</span>
        </article>
        <article className="mis-listas-highlight-card">
          <span className="mis-listas-stat-value">{totalSeriesGuardadas}</span>
          <span className="mis-listas-stat-label">Series guardadas</span>
        </article>
        <article className="mis-listas-highlight-card">
          <span className="mis-listas-stat-value">{seriesUnicas}</span>
          <span className="mis-listas-stat-label">Titulos unicos</span>
        </article>
        <article className="mis-listas-highlight-card">
          <span className="mis-listas-stat-value">{listasVacias}</span>
          <span className="mis-listas-stat-label">Listas por llenar</span>
        </article>
      </section>

      <section className="mis-listas-overview-stack">
        <article className="mis-listas-panel mis-listas-panel-featured">
          <div className="mis-listas-panel-header">
            <p className="mis-listas-panel-kicker">Nueva lista</p>
            <h2>Crea una nueva coleccion</h2>
            <p className="mis-listas-panel-text">
              Ponle nombre a tu proxima lista y empieza a llenarla desde aqui o desde cualquier
              ficha de serie.
            </p>
          </div>

          <form className="mis-listas-form" onSubmit={handleCrearLista}>
            <label className="mis-listas-field">
              <span>Nombre de la lista</span>
              <input
                type="text"
                value={nombreLista}
                onChange={(event) => setNombreLista(event.target.value)}
                placeholder="Ej. Pendientes del verano"
              />
            </label>

            <label className="mis-listas-field">
              <span>Descripcion</span>
              <input
                type="text"
                value={descripcionLista}
                onChange={(event) => setDescripcionLista(event.target.value)}
                placeholder="Que historias quieres reunir aqui"
              />
            </label>

            <button type="submit" className="mis-listas-btn-primary">
              Crear lista
            </button>
          </form>

          {mensaje ? <p className="mis-listas-feedback">{mensaje}</p> : null}
        </article>

        <div className="mis-listas-support-grid">
          <article className="mis-listas-panel mis-listas-panel-compact">
            <div className="mis-listas-panel-header">
              <p className="mis-listas-panel-kicker">Destacadas</p>
              <h2>Tus colecciones mas activas</h2>
              <p className="mis-listas-panel-text">
                Un vistazo rapido a las listas con mas movimiento.
              </p>
            </div>

            {listasDestacadas.length ? (
              <div className="mis-listas-badge-grid">
                {listasDestacadas.map((lista) => (
                  <div key={lista.id} className="mis-listas-badge-card">
                    <strong>{lista.tipoLista}</strong>
                    <span>{lista.series?.length ?? 0} series</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mis-listas-empty-block">
                <p>Todavia no has creado listas. Empieza con una para tus favoritas.</p>
              </div>
            )}
          </article>

          <article className="mis-listas-panel mis-listas-panel-compact">
            <div className="mis-listas-panel-header">
              <p className="mis-listas-panel-kicker">Moverme por la plataforma</p>
              <h2>Acciones rapidas</h2>
              <p className="mis-listas-panel-text">
                Salta entre tus listas, el perfil y el catalogo sin perder el hilo.
              </p>
            </div>

            <div className="mis-listas-action-stack">
              <button
                type="button"
                className="mis-listas-btn-secondary"
                onClick={() => navigate('/perfil')}
              >
                Volver al perfil
              </button>
              <button
                type="button"
                className="mis-listas-btn-secondary"
                onClick={() => navigate('/catalogo')}
              >
                Buscar nuevas series
              </button>
            </div>
          </article>
        </div>
      </section>

      <section className="mis-listas-content-intro">
        <div>
          <p className="mis-listas-kicker">Tu biblioteca</p>
          <h2>Todas tus listas en un vistazo</h2>
        </div>
        <p className="mis-listas-section-copy">
          Cada coleccion conserva su propio estilo para que encuentres rapido lo que buscas.
        </p>
      </section>

      <main className="mis-listas-content">
        {listas.length ? (
          listas.map((lista) => (
            <section key={lista.id} className="mis-lista-card">
              <div className="mis-lista-card-top">
                <div>
                  <p className="mis-listas-kicker">Mi lista</p>
                  <h2>{lista.tipoLista}</h2>
                  <p className="mis-lista-meta">
                    {lista.descripcion || 'Una coleccion lista para seguir creciendo.'}
                  </p>
                </div>

                <div className="mis-lista-card-actions">
                  <span className="mis-listas-count-badge">
                    {lista.series?.length ?? 0} series guardadas
                  </span>
                  <button
                    type="button"
                    className="mis-listas-btn-secondary"
                    onClick={() => handleEliminarLista(lista.id, lista.tipoLista)}
                  >
                    Eliminar lista
                  </button>
                </div>
              </div>

              {lista.series?.length ? (
                <>
                  <div className="mis-listas-slider">
                    {lista.series.map((serie) => (
                      <SerieCard
                        key={`${lista.id}-${serie.id ?? serie.pk}`}
                        id={serie.id ?? serie.pk}
                        titulo={serie.titulo}
                        fechaEstreno={serie.fechaEstreno}
                        valoracionMedia={serie.valoracionMedia}
                        imagen={serie.imagenPortada}
                        estado={serie.estado}
                      />
                    ))}
                  </div>

                  <div className="mis-listas-chip-grid">
                    {lista.series.map((serie) => (
                      <div key={`${lista.id}-chip-${serie.id ?? serie.pk}`} className="mis-lista-chip">
                        <span>{serie.titulo}</span>
                        <button
                          type="button"
                          className="mis-lista-chip-btn"
                          onClick={() =>
                            handleQuitarSerie(lista.id, serie.id ?? serie.pk, serie.titulo)
                          }
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="mis-listas-empty-block">
                  <p>Esta lista todavia esta vacia.</p>
                  <button
                    type="button"
                    className="mis-listas-btn-secondary"
                    onClick={() => navigate('/catalogo')}
                  >
                    Buscar series para anadir
                  </button>
                </div>
              )}
            </section>
          ))
        ) : (
          <section className="mis-listas-state-card">
            <p className="mis-listas-kicker">Sin contenido todavia</p>
            <h2>Aun no has creado listas</h2>
            <p>
              Empieza con una coleccion para tus favoritas, pendientes o maratones y completa tu
              biblioteca poco a poco.
            </p>
          </section>
        )}
      </main>
    </div>
  )
}

export default MisListas
