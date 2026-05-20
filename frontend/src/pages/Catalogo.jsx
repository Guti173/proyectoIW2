import { useEffect, useRef, useState } from 'react'
import SerieCard from '../components/SerieCard'
import { getSeries, getGeneros } from '../api/client'
import './Catalogo.css'

function Catalogo() {
  const [series, setSeries] = useState([])
  const [generos, setGeneros] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(20)
  const [filtroGenero, setFiltroGenero] = useState('')
  const [busquedaNombre, setBusquedaNombre] = useState('')
  const [filtroAnio, setFiltroAnio] = useState('')

  const categoriasTop = [
    'Action',
    'Comedy',
    'Drama',
    'Sci-Fi',
    'Horror',
    'Thriller',
    'Anime',
    'Crime',
    'Mystery',
    'Fantasy',
    'Adventure',
  ]

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [seriesData, generosData] = await Promise.all([getSeries(), getGeneros()])
        setSeries(seriesData)
        setGeneros(generosData)
      } catch (error) {
        console.error('Error cargando series:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const seriesFiltradas = series.filter((serie) => {
    const coincideNombre = serie.titulo
      .toLowerCase()
      .includes(busquedaNombre.toLowerCase())
    const coincideGenero = filtroGenero ? serie.generos?.includes(parseInt(filtroGenero)) : true
    const coincideAnio = filtroAnio ? serie.fechaEstreno?.startsWith(filtroAnio) : true

    return coincideNombre && coincideGenero && coincideAnio
  })

  useEffect(() => {
    setVisibleCount(20)
  }, [busquedaNombre, filtroGenero, filtroAnio])

  const cargarMas = () => setVisibleCount((prev) => prev + 20)
  const verTodo = () => setVisibleCount(seriesFiltradas.length)

  const seriesVisibles = seriesFiltradas.slice(0, visibleCount)
  const tendencias = [...seriesFiltradas]
    .sort((left, right) => right.valoracionMedia - left.valoracionMedia)
    .slice(0, 10)

  const sliderRefs = useRef({})

  const scrollSlider = (key, direction) => {
    const slider = sliderRefs.current[key]
    if (!slider) {
      return
    }

    const step = slider.clientWidth * 0.8
    slider.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  if (loading) {
    return <div className="loader">Sincronizando biblioteca...</div>
  }

  return (
    <div className="catalogo-container">
      <header className="catalogo-hero">
        <div className="hero-content">
          <div className="hero-text">
            <p className="catalogo-kicker">Biblioteca de series</p>
            <p>
              Busca por título, filtra por género y deja a mano lo que quieres ver hoy.
            </p>
          </div>

          <div className="search-tool-bar">
            <div className="search-group main-search">
              <span className="search-icon" aria-hidden="true"></span>
              <input
                type="text"
                placeholder="Buscar por título..."
                value={busquedaNombre}
                onChange={(event) => setBusquedaNombre(event.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <select
                value={filtroGenero}
                onChange={(event) => setFiltroGenero(event.target.value)}
                className="filter-select"
              >
                <option value="">Todos los géneros</option>
                {generos.map((genero) => (
                  <option key={genero.id} value={genero.id}>
                    {genero.nombre}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Año"
                value={filtroAnio}
                onChange={(event) => setFiltroAnio(event.target.value)}
                className="year-input"
                min="1900"
                max="2026"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="catalogo-content">
        {tendencias.length > 0 ? (
          <section className="row-section">
            <div className="row-header">
              <div>
                <p className="row-kicker">Destacadas</p>
                <h3 className="row-title">Series mejor valoradas</h3>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  className="slider-arrow"
                  aria-label="Desplazar tendencias a la izquierda"
                  onClick={() => scrollSlider('tendencias', -1)}
                >
                  {'<'}
                </button>
                <button
                  type="button"
                  className="slider-arrow"
                  aria-label="Desplazar tendencias a la derecha"
                  onClick={() => scrollSlider('tendencias', 1)}
                >
                  {'>'}
                </button>
              </div>
            </div>

            <div
              className="horizontal-slider"
              ref={(element) => {
                sliderRefs.current.tendencias = element
              }}
            >
              {tendencias.map((serie) => (
                <SerieCard key={serie.id} id={serie.id} {...serie} imagen={serie.imagenPortada} />
              ))}
            </div>
          </section>
        ) : null}

        {generos
          .filter((genero) => categoriasTop.includes(genero.nombre))
          .map((genero) => {
            const seriesDeEsteGenero = seriesFiltradas.filter((serie) =>
              serie.generos?.includes(genero.id),
            )

            if (seriesDeEsteGenero.length === 0) {
              return null
            }

            return (
              <section key={genero.id} className="row-section">
                <div className="row-header">
                  <div>
                    <p className="row-kicker">Género</p>
                    <h3 className="row-title">{genero.nombre}</h3>
                  </div>

                  <div className="row-actions">
                    <button
                      type="button"
                      className="slider-arrow"
                      aria-label={`Desplazar ${genero.nombre} a la izquierda`}
                      onClick={() => scrollSlider(`genero-${genero.id}`, -1)}
                    >
                      {'<'}
                    </button>
                    <button
                      type="button"
                      className="slider-arrow"
                      aria-label={`Desplazar ${genero.nombre} a la derecha`}
                      onClick={() => scrollSlider(`genero-${genero.id}`, 1)}
                    >
                      {'>'}
                    </button>
                  </div>
                </div>

                <div
                  className="horizontal-slider"
                  ref={(element) => {
                    sliderRefs.current[`genero-${genero.id}`] = element
                  }}
                >
                  {seriesDeEsteGenero.map((serie) => (
                    <SerieCard key={serie.id} id={serie.id} {...serie} imagen={serie.imagenPortada} />
                  ))}
                </div>
              </section>
            )
          })}

        {seriesFiltradas.length > 0 ? (
          <section className="row-section full-catalog-section">
            <div className="row-header">
              <div>
                <p className="row-kicker">Explorar</p>
                <h3 className="row-title">Catálogo completo</h3>
              </div>
              <span className="results-count">
                Mostrando {seriesVisibles.length} de {seriesFiltradas.length}
              </span>
            </div>

            <div className="catalog-grid-mini">
              {seriesVisibles.map((serie) => (
                <div key={serie.id} className="serie-card-minimal">
                  <SerieCard id={serie.id} {...serie} imagen={serie.imagenPortada} />
                </div>
              ))}
            </div>

            {visibleCount < seriesFiltradas.length ? (
              <div className="catalog-actions">
                <button onClick={cargarMas} className="btn-load-more">
                  Cargar 20 más
                </button>
                <button onClick={verTodo} className="btn-show-all">
                  Ver todo
                </button>
              </div>
            ) : null}
          </section>
        ) : (
          <div className="empty-results">
            <p>No se encontraron series que coincidan con tu búsqueda.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default Catalogo
