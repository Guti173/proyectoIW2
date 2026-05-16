import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SerieCard from '../components/SerieCard'
import {
  createList,
  deleteList,
  getStoredLists,
  removeSerieFromList,
} from '../lib/listas'
import './MisListas.css'

function MisListas() {
  const navigate = useNavigate()
  const [listas, setListas] = useState(() => getStoredLists())
  const [nombreLista, setNombreLista] = useState('')
  const [descripcionLista, setDescripcionLista] = useState('')
  const [mensaje, setMensaje] = useState('')

  const totalSeriesGuardadas = useMemo(
    () => listas.reduce((total, lista) => total + lista.series.length, 0),
    [listas],
  )
  const seriesUnicas = useMemo(() => {
    const uniqueIds = new Set(
      listas.flatMap((lista) => lista.series.map((serie) => Number(serie.pk ?? serie.id ?? 0))),
    )

    uniqueIds.delete(0)
    return uniqueIds.size
  }, [listas])

  const handleCrearLista = (event) => {
    event.preventDefault()

    const result = createList({
      name: nombreLista,
      description: descripcionLista,
    })

    if (!result.ok) {
      setMensaje(result.error)
      return
    }

    setListas(result.lists)
    setNombreLista('')
    setDescripcionLista('')
    setMensaje(`Lista "${result.list.name}" creada correctamente.`)
  }

  const handleEliminarLista = (listId, listName) => {
    const nextLists = deleteList(listId)
    setListas(nextLists)
    setMensaje(`La lista "${listName}" se ha eliminado.`)
  }

  const handleQuitarSerie = (listId, serieId, serieTitulo) => {
    const result = removeSerieFromList(listId, serieId)

    if (!result.ok) {
      setMensaje(result.error)
      return
    }

    setListas(result.lists)
    setMensaje(`"${serieTitulo}" ya no forma parte de esa lista.`)
  }

  return (
    <div className="mis-listas-page">
      <header className="mis-listas-hero">
        <div className="mis-listas-hero-copy">
          <p className="mis-listas-kicker">Colecciones personales</p>
          <h1>Organiza tus series a tu manera</h1>
          <p>
            Crea listas, separa tus descubrimientos por estados de animo o genero y
            usa el boton de cada serie para guardarlas sin salir de la ficha.
          </p>

          <div className="mis-listas-actions">
            <button className="mis-listas-btn-primary" onClick={() => navigate('/catalogo')}>
              Explorar catalogo
            </button>
            <button className="mis-listas-btn-secondary" onClick={() => navigate('/perfil')}>
              Volver al perfil
            </button>
          </div>
        </div>

        <div className="mis-listas-hero-stats">
          <article className="mis-listas-stat-card">
            <span className="mis-listas-stat-value">{listas.length}</span>
            <span className="mis-listas-stat-label">Listas creadas</span>
          </article>
          <article className="mis-listas-stat-card">
            <span className="mis-listas-stat-value">{totalSeriesGuardadas}</span>
            <span className="mis-listas-stat-label">Entradas guardadas</span>
          </article>
          <article className="mis-listas-stat-card">
            <span className="mis-listas-stat-value">{seriesUnicas}</span>
            <span className="mis-listas-stat-label">Series unicas</span>
          </article>
        </div>
      </header>

      <section className="mis-listas-create-card">
        <div className="mis-listas-section-heading">
          <div>
            <p className="mis-listas-kicker">Nueva lista</p>
            <h2>Crea una coleccion personalizada</h2>
          </div>
          <p className="mis-listas-section-copy">
            Puedes crearla vacia aqui o completarla despues desde cualquier detalle de serie.
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
            <span>Descripcion opcional</span>
            <input
              type="text"
              value={descripcionLista}
              onChange={(event) => setDescripcionLista(event.target.value)}
              placeholder="Que tipo de series quieres guardar aqui"
            />
          </label>

          <button type="submit" className="mis-listas-btn-primary">
            Crear lista
          </button>
        </form>

        {mensaje ? <p className="mis-listas-feedback">{mensaje}</p> : null}
      </section>

      <main className="mis-listas-content">
        {listas.length ? (
          listas.map((lista) => (
            <section key={lista.id} className="mis-lista-card">
              <div className="mis-listas-section-heading">
                <div>
                  <p className="mis-listas-kicker">Mi lista</p>
                  <h2>{lista.name}</h2>
                  <p className="mis-lista-meta">
                    {lista.series.length} series guardadas
                    {lista.description ? ` · ${lista.description}` : ''}
                  </p>
                </div>

                <button
                  className="mis-listas-btn-secondary"
                  onClick={() => handleEliminarLista(lista.id, lista.name)}
                >
                  Eliminar lista
                </button>
              </div>

              {lista.series.length ? (
                <>
                  <div className="mis-listas-slider">
                    {lista.series.map((serie) => (
                      <SerieCard
                        key={`${lista.id}-${serie.pk}`}
                        id={serie.pk}
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
                      <div key={`${lista.id}-chip-${serie.pk}`} className="mis-lista-chip">
                        <span>{serie.titulo}</span>
                        <button
                          className="mis-lista-chip-btn"
                          onClick={() => handleQuitarSerie(lista.id, serie.pk, serie.titulo)}
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
          <section className="mis-listas-empty-state">
            <p className="mis-listas-kicker">Sin contenido todavia</p>
            <h2>No tienes listas creadas</h2>
            <p>
              Crea tu primera lista aqui o entra en una serie y usa el boton
              <strong> Añadir a mi lista</strong> para construirla al momento.
            </p>
          </section>
        )}
      </main>
    </div>
  )
}

export default MisListas
