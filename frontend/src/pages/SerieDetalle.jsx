import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./SerieDetalle.css";

// Datos de prueba extendidos (Simulando lo que vendría de Django)
const mockData = [
  {
    pk: 1,
    titulo: "Breaking Bad",
    descripcion: "Walter White, un profesor de química de secundaria con cáncer de pulmón inoperable, decide asegurar el futuro de su familia fabricando metanfetamina con un exalumno.",
    fechaEstreno: "2008-01-20",
    fechaFin: "2013-09-29",
    imagenPortada: "https://imgs.search.brave.com/V3wM9yww_fcJYos8clmbu9vUf5tXvfSp3VpKV6bM9cw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJjYXQuY29t/L3cvZnVsbC8xLzEv/Zi8yMjg5MC0zODQw/eDIxNjAtZGVza3Rv/cC00ay1icmVha2lu/Zy1iYWQtd2FsbHBh/cGVyLXBob3RvLmpw/Zw",
    numeroEpisodios: 62,
    estado: "Finalizada",
    valoracionMedia: 9.5,
    totalValoraciones: 1540
  },
  {
    pk: 2,
    titulo: "Stranger Things",
    descripcion: "Tras la desaparición de un niño, un pueblo desvela un misterio relacionado con experimentos secretos, fuerzas sobrenaturales aterradoras y una niña muy extraña.",
    fechaEstreno: "2016-07-15",
    fechaFin: null,
    imagenPortada: "https://imgs.search.brave.com/vx3CkznpNkhfRQP8oHhFO8c6Jjb18-2GiO5PklSr0bI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMuc2Vla2xvZ28u/Y29tL2xvZ28tcG5n/LzY1LzIvc3RyYW5n/ZXItdGhpbmdzLXNl/YXNvbi01LWxvZ28t/cG5nX3NlZWtsb2dv/LTY1Mzg4OC5wbmc",
    numeroEpisodios: 34,
    estado: "En emisión",
    valoracionMedia: 8.7,
    totalValoraciones: 890
  }
];
function SerieDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [serie, setSerie] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [comentarios, setComentarios] = useState([
    { id: 1, autor: "Cinefilo99", texto: "¡Una obra maestra de principio a fin!", fecha: "Hace 2 días" },
    { id: 2, autor: "DevReact", texto: "El desarrollo de personajes es increíble.", fecha: "Hace 1 semana" }
  ]);

  useEffect(() => {
    const encontrada = mockData.find((s) => s.pk === parseInt(id)) || mockData[0];
    const timer = setTimeout(() => {
      setSerie(encontrada);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
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

  if (loading) return <div className="loader">Cargando detalles...</div>;
  if (!serie) return <div className="error">Serie no encontrada.</div>;

  return (
    <div className="detalle-wrapper">
      <header 
        className="detalle-hero" 
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fcfaf8 100%), url(${serie.imagenPortada})` 
        }}
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
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}

export default SerieDetalle;