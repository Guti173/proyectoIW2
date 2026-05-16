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
  const [listas, setListas] = useState([])
  const [nombreLista, setNombreLista] = useState('')
  const [descripcionLista, setDescripcionLista] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    async function loadLists() {
      if (!authSession?.profile) {
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
  }, [authSession?.profile])

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

  if (!authSession?.profile) {
    return (
      <section className="mis-listas-empty-state">
        <p className="mis-listas-kicker">Sesion necesaria</p>
        <h2>Inicia sesion para gestionar tus listas</h2>
        <p>Las listas ahora viven en la base de datos, asi que necesitamos identificarte.</p>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="mis-listas-empty-state">
        <p className="mis-listas-kicker">Sincronizando</p>
        <h2>Cargando tus listas</h2>
        <p>Estamos leyendo tus colecciones reales desde el backend.</p>
      </section>
    )
  }

  return (
    <div className="mis-listas-page">
      <header className="mis-listas-hero">
        <div className="mis-listas-hero-copy">
          <p className="mis-listas-kicker">Colecciones personales</p>
          <h1>Organiza tus series a tu manera</h1>
          <p>
            Tus listas ya no dependen del navegador: se guardan en la base de datos
            y se recargan al volver a entrar con tu cuenta.
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
                  <h2>{lista.tipoLista}</h2>
                  <p className="mis-lista-meta">
                    {lista.series?.length ?? 0} series guardadas
                    {lista.descripcion ? ` · ${lista.descripcion}` : ''}
                  </p>
                </div>

                <button
                  className="mis-listas-btn-secondary"
                  onClick={() => handleEliminarLista(lista.id, lista.tipoLista)}
                >
                  Eliminar lista
                </button>
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
              <strong> Anadir a mi lista</strong> para construirla al momento.
            </p>
          </section>
        )}
      </main>
    </div>
  )
}

export default MisListas
