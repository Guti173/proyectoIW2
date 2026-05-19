import { useEffect, useRef, useState } from "react";
import SerieCard from "../components/SerieCard";
import { getSeries, getGeneros } from "../api/client";
import "./Catalogo.css";

function Catalogo() {
  // Estados iniciales
  const [series, setSeries] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);

  // Estados para el buscador
  const [filtroGenero, setFiltroGenero] = useState("");
  const [busquedaNombre, setBusquedaNombre] = useState("");
  const [filtroAnio, setFiltroAnio] = useState("");


  const CATEGORIAS_TOP = [
    "Action", "Comedy", "Drama", "Sci-Fi", "Horror",
    "Thriller", "Anime", "Crime", "Mystery", "Fantasy", "Adventure"
  ];

  // Carga de datos inicial
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [seriesData, generosData] = await Promise.all([
          getSeries(),
          getGeneros()
        ]);
        setSeries(seriesData);
        setGeneros(generosData);
      } catch (error) {
        console.error("Error cargando series:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Lógica de filtrado
  const seriesFiltradas = series.filter(s => {
    const coincideNombre = s.titulo.toLowerCase().includes(busquedaNombre.toLowerCase());
    const coincideGenero = filtroGenero ? s.generos?.includes(parseInt(filtroGenero)) : true;
    const coincideAnio = filtroAnio ? s.fechaEstreno?.startsWith(filtroAnio) : true;

    return coincideNombre && coincideGenero && coincideAnio;
  });

  // Efectos dependientes del filtrado
  useEffect(() => {
    setVisibleCount(20);
  }, [busquedaNombre, filtroGenero, filtroAnio]);

  // Funciones de paginación
  const cargarMas = () => setVisibleCount(prev => prev + 20);
  const verTodo = () => setVisibleCount(seriesFiltradas.length);

  const seriesVisibles = seriesFiltradas.slice(0, visibleCount);
  const tendencias = [...seriesFiltradas]
    .sort((a, b) => b.valoracionMedia - a.valoracionMedia)
    .slice(0, 10);

  const sliderRefs = useRef({});

  const scrollSlider = (key, direction) => {
    const slider = sliderRefs.current[key];
    if (!slider) return;
    const step = slider.clientWidth * 0.8;
    slider.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  if (loading) return <div className="loader">Sincronizando biblioteca...</div>;

  return (
    <div className="catalogo-container">
      <header className="catalogo-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Tu biblioteca personal</h1>
            <p>Explora, busca y filtra tus historias favoritas sincronizadas en tiempo real.</p>
          </div>

          <div className="search-tool-bar">
            <div className="search-group main-search">
              <span className="search-icon" aria-hidden="true"></span>
              <input
                type="text"
                placeholder="Buscar por título..."
                value={busquedaNombre}
                onChange={(e) => setBusquedaNombre(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <select
                value={filtroGenero}
                onChange={(e) => setFiltroGenero(e.target.value)}
                className="filter-select"
              >
                <option value="">Todos los géneros</option>
                {generos.map(g => (
                  <option key={g.id} value={g.id}>{g.nombre}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Año"
                value={filtroAnio}
                onChange={(e) => setFiltroAnio(e.target.value)}
                className="year-input"
                min="1900"
                max="2026"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="catalogo-content">
        {/* Tendencias */}
        {tendencias.length > 0 && (
          <section className="row-section">
            <div className="row-header">
              <h3 className="row-title">Tendencias globales</h3>
              <div className="row-actions">
                <button
                  type="button"
                  className="slider-arrow"
                  onClick={() => scrollSlider('tendencias', -1)}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="slider-arrow"
                  onClick={() => scrollSlider('tendencias', 1)}
                >
                  ›
                </button>
              </div>
            </div>
            <div
              className="horizontal-slider"
              ref={(el) => { sliderRefs.current['tendencias'] = el }}
            >
              {tendencias.map(s => (
                <SerieCard key={s.id} id={s.id} {...s} imagen={s.imagenPortada} />
              ))}
            </div>
          </section>
        )}

        {/* Categorías dinámicas destacadas */}
        {generos
          .filter(g => CATEGORIAS_TOP.includes(g.nombre))
          .map(genero => {
            const seriesDeEsteGenero = seriesFiltradas.filter(s =>
              s.generos?.includes(genero.id)
            );

            if (seriesDeEsteGenero.length === 0) return null;

            return (
              <section key={genero.id} className="row-section">
                <div className="row-header">
                  <h3 className="row-title">{genero.nombre}</h3>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="slider-arrow"
                      onClick={() => scrollSlider(`genero-${genero.id}`, -1)}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="slider-arrow"
                      onClick={() => scrollSlider(`genero-${genero.id}`, 1)}
                    >
                      ›
                    </button>
                  </div>
                </div>
                <div
                  className="horizontal-slider"
                  ref={(el) => { sliderRefs.current[`genero-${genero.id}`] = el }}
                >
                  {seriesDeEsteGenero.map(s => (
                    <SerieCard key={s.id} id={s.id} {...s} imagen={s.imagenPortada} />
                  ))}
                </div>
              </section>
            );
          })}

        {/* Explorar todo el catálogo */}
        {seriesFiltradas.length > 0 && (
          <section className="row-section full-catalog-section">
            <div className="row-header">
              <h3 className="row-title">Explorar todo el catálogo</h3>
              <span className="results-count">
                Mostrando {seriesVisibles.length} de {seriesFiltradas.length}
              </span>
            </div>

            <div className="catalog-grid-mini">
              {seriesVisibles.map(s => (
                <div key={s.id} className="serie-card-minimal">
                  <SerieCard id={s.id} {...s} imagen={s.imagenPortada} />
                </div>
              ))}
            </div>

            {visibleCount < seriesFiltradas.length && (
              <div className="catalog-actions">
                <button onClick={cargarMas} className="btn-load-more">
                  Cargar 20 más
                </button>
                <button onClick={verTodo} className="btn-show-all">
                  Ver todo el catálogo
                </button>
              </div>
            )}
          </section>
        )}

        {seriesFiltradas.length === 0 && (
          <div className="empty-results">
            <p>No se encontraron series que coincidan con tu búsqueda.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Catalogo;
