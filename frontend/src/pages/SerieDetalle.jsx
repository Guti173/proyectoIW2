import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSerieById, getGeneros } from "../api/client";
import "./SerieDetalle.css";

function SerieDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [serie, setSerie] = useState(null);
  const [generos, setGeneros] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [comentarios, setComentarios] = useState([
    { id: 1, autor: "Cinefilo99", texto: "Una obra maestra de principio a fin!", fecha: "Hace 2 dias" },
    { id: 2, autor: "DevReact", texto: "El desarrollo de personajes es increible.", fecha: "Hace 1 semana" }
  ]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const serieData = await getSerieById(id);
        const generosData = await getGeneros();
        setSerie(serieData);
        setGeneros(generosData);
      } catch (error) {
        console.error("Error cargando serie:", error);
        // Si falla, usar datos de ejemplo
        setSerie({
          id: id,
          titulo: "Serie no encontrada",
          descripcion: "No se pudo cargar la serie desde el backend",
          fechaEstreno: "2024-01-01",
          numeroEpisodios: 0,
          valoracionMedia: 0,
          estado: "Desconocido",
          imagenPortada: ""
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleEnviarComentario = (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    const comentario = {
      id: Date.now(),
      autor: "Usuario Actual",
      texto: nuevoComentario,
      fecha: "Justo ahora"
    };

    setComentarios([comentario, ...comentarios]);
    setNuevoComentario("");
  };

  // Obtener nombres de generos
  const getGeneroNames = () => {
    if (!serie?.generos || generos.length === 0) return [];
    return serie.generos.map(gId => {
      const genero = generos.find(g => g.id === gId);
      return genero ? genero.nombre : "";
    }).filter(n => n);
  };

  if (loading) return <div className="loader">Cargando detalles...</div>;
  if (!serie) return <div className="error">Serie no encontrada.</div>;

  return (
    <div className="detalle-wrapper">
      <header 
        className="detalle-hero" 
        style={{ 
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, #fcfaf8 100%), url(${serie.imagenPortada})`        }}
      >
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Volver
        </button>

        <div className="hero-content">
          <span className="status-pill">{serie.estado}</span>
          <h1 className="hero-title">{serie.titulo}</h1>
          <div className="hero-meta">
            <span className="rating-big">⭐ {serie.valoracionMedia}</span>
            <span>•</span>
            <span>{new Date(serie.fechaEstreno).getFullYear()}</span>
            <span>•</span>
            <span>{serie.numeroEpisodios} Episodios</span>
          </div>
          <div className="hero-actions">
            <button className="btn-primary">Ver ahora</button>
            <button className="btn-secondary">+ Añadir a mi lista</button>
          </div>
        </div>
      </header>

      <main className="detalle-container">
        <div className="detalle-grid">
          
          {/* COLUMNA PRINCIPAL */}
          <section className="detalle-main">
            <h3>Sinopsis</h3>
            <p className="descripcion">{serie.descripcion}</p>
            
            <div className="generos-section">
              <h3>Géneros</h3>
              <div className="generos-list">
                {getGeneroNames().map((nombre, idx) => (
                  <span key={idx} className="genero-tag">{nombre}</span>
                ))}
                {getGeneroNames().length === 0 && <span className="no-generos">Sin géneros asignados</span>}
              </div>
            </div>
            
            <div className="comentarios-section">
              <h3>Comentarios ({comentarios.length})</h3>

              <form className="comentario-form" onSubmit={handleEnviarComentario}>
                <textarea
                  placeholder="¿Qué te ha parecido esta serie?"
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  rows="3"
                />
                <button type="submit" className="btn-primary btn-small">Publicar</button>
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

          {/* BARRA LATERAL */}
          <aside className="detalle-sidebar">
            <div className="info-card-tecnica">
              <h4>Información Técnica</h4>
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
          </aside>

        </div>
      </main>
    </div>
  );
}

export default SerieDetalle;
