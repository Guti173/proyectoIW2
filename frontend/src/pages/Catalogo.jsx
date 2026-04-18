import { useEffect, useState } from "react";
import SerieCard from "../components/SerieCard";

// Simulamos diferentes listas que te devolvería el backend
const mockViendo = [
  { pk: 1, titulo: "Breaking Bad", estado: "T5: E14", fechaEstreno: "2008-01-20T00:00:00Z", valoracionMedia: 9.5, imagenPortada: "https://imgs.search.brave.com/V3wM9yww_fcJYos8clmbu9vUf5tXvfSp3VpKV6bM9cw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJjYXQuY29t/L3cvZnVsbC8xLzEv/Zi8yMjg5MC0zODQw/eDIxNjAtZGVza3Rv/cC00ay1icmVha2lu/Zy1iYWQtd2FsbHBh/cGVyLXBob3RvLmpw/Zw" }
];

const mockPopulares = [
  { pk: 2, titulo: "Stranger Things", estado: "Top 1", fechaEstreno: "2016-07-15T00:00:00Z", valoracionMedia: 8.7, imagenPortada: "https://imgs.search.brave.com/vx3CkznpNkhfRQP8oHhFO8c6Jjb18-2GiO5PklSr0bI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMuc2Vla2xvZ28u/Y29tL2xvZ28tcG5n/LzY1LzIvc3RyYW5n/ZXItdGhpbmdzLXNl/YXNvbi01LWxvZ28t/cG5nX3NlZWtsb2dv/LTY1Mzg4OC5wbmc" },
  { pk: 3, titulo: "The Office", estado: "Comedia", fechaEstreno: "2005-03-24T00:00:00Z", valoracionMedia: 9.0, imagenPortada: "https://imgs.search.brave.com/nuPghXRBeBuoDIZ-w2tT73o08gn0axT1aueJqpLYDy8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMuc2Vla2xvZ28u/Y29tL2xvZ28tcG5n/LzQzLzIvdGhlLW9m/ZmljZS10di1zaG93/LXNpZ24tbG9nby1w/bmdfc2Vla2xvZ28t/NDM4NTEwLnBuZw" }
];
// Añade estos nuevos arrays arriba en Catalogo.jsx
const mockAccion = [
  { pk: 4, titulo: "The Boys", estado: "Acción", fechaEstreno: "2019-07-26", valoracionMedia: 8.7, imagenPortada: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=400&q=80" },
  { pk: 5, titulo: "The Mandalorian", estado: "Acción", fechaEstreno: "2019-11-12", valoracionMedia: 8.7, imagenPortada: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=400&q=80" }
];

const mockComedia = [
  { pk: 6, titulo: "Friends", estado: "Comedia", fechaEstreno: "1994-09-22", valoracionMedia: 8.9, imagenPortada: "https://imgs.search.brave.com/hakOPz2F2e7ChBUDvJVUn9ccKB3Kpep1bKLxtCXcMFM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/aWRlYWxvLmNvbS9m/b2xkZXIvUHJvZHVj/dC81MTYzLzAvNTE2/MzA4MS9zMTFfcHJv/ZHVrdGJpbGRfbWF4/L2ZyaWVuZHMtc2Vy/aWUtY29tcGxldGEt/ZHZkLmpwZw" },
  { pk: 7, titulo: "Ted Lasso", estado: "Comedia", fechaEstreno: "2020-08-14", valoracionMedia: 8.8, imagenPortada: "https://imgs.search.brave.com/LguY8a07paEyrUARSDilhaJq5OpUGT-eUJmeuhSXvEw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9mci53/ZWIuaW1nNi5hY3N0/YS5uZXQvY18zMDBf/MzAwL3BpY3R1cmVz/LzIxLzA5LzA2LzEx/LzAzLzI1NDY0NDku/anBn" }
];

const mockEnEmision = [
  { pk: 8, titulo: "House of the Dragon", estado: "Nueva Temp", fechaEstreno: "2022-08-21", valoracionMedia: 8.5, imagenPortada: "https://imgs.search.brave.com/XExWm2Ki-_Wmv1MKxqlWMKutETdro4syxA9ynHL0FO0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMucG9zdGVycy5j/ei9pbWFnZS8zNTAv/cGludHVyYXMtc29i/cmUtbGllbnpvL2hv/dXNlLW9mLXRoZS1k/cmFnb24tZGFlbW9u/LXRhcmdhcnllbi1p/MTQzNjkwLmpwZw"}
];

function Catalogo() {
  const [data, setData] = useState({
    viendo: [], populares: [], accion: [], comedia: [], emision: []
  });
  const [loading, setLoading] = useState(true);

  // Desestructuramos para que 'viendo', 'populares', etc. existan como variables directas
  const { viendo, populares, accion, comedia, emision } = data;

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      // Simulamos latencia de red
      await new Promise(r => setTimeout(r, 600));
      setData({
        viendo: mockViendo,
        populares: mockPopulares,
        accion: mockAccion,
        comedia: mockComedia,
        emision: mockEnEmision
      });
      setLoading(false);
    }
    loadAll();
  }, []);

  if (loading) return <div className="loader">Personalizando tu catálogo...</div>;

  return (
    <section className="page-section">
      <header className="page-header">
        <p className="eyebrow">Descubrir</p>
        <h2>Explora tu contenido</h2>
      </header>

      {/* SECCIÓN 1: CONTINUAR VIENDO (Scroll Horizontal) */}
      <section className="row-section">
        <h3 className="row-title">Continuar viendo</h3>
        <div className="horizontal-scroll">
          {viendo.map(s => (
            <SerieCard 
              key={s.pk} 
              id={s.pk} 
              titulo={s.titulo} 
              fechaEstreno={s.fechaEstreno} 
              valoracionMedia={s.valoracionMedia} 
              imagen={s.imagenPortada} 
              estado={s.estado}
              variant="compact" 
            />
          ))}
        </div>
      </section>

      {/* SECCIÓN 2: POPULARES (Grid Estándar) */}
      <section className="row-section">
        <h3 className="row-title">Tendencias ahora</h3>
        <div className="collection-grid">
          {populares.map(s => (
            <SerieCard 
              key={s.pk} 
              id={s.pk} 
              titulo={s.titulo} 
              fechaEstreno={s.fechaEstreno} 
              valoracionMedia={s.valoracionMedia} 
              imagen={s.imagenPortada} 
              estado={s.estado} 
            />
          ))}
        </div>
      </section>

      {/* SECCIÓN 3: ACCIÓN (Scroll Horizontal) */}
      <section className="row-section">
        <h3 className="row-title">Adrenalina Pura: Acción</h3>
        <div className="horizontal-scroll">
          {accion.map(s => (
            <SerieCard 
              key={s.pk} 
              id={s.pk} 
              titulo={s.titulo} 
              fechaEstreno={s.fechaEstreno} 
              valoracionMedia={s.valoracionMedia} 
              imagen={s.imagenPortada} 
              estado={s.estado} 
            />
          ))}
        </div>
      </section>

      {/* SECCIÓN 4: COMEDIA (Grid Estándar) */}
      <section className="row-section">
        <h3 className="row-title">Para reír un rato</h3>
        <div className="collection-grid">
          {comedia.map(s => (
            <SerieCard 
              key={s.pk} 
              id={s.pk} 
              titulo={s.titulo} 
              fechaEstreno={s.fechaEstreno} 
              valoracionMedia={s.valoracionMedia} 
              imagen={s.imagenPortada} 
              estado={s.estado} 
            />
          ))}
        </div>
      </section>

      {/* SECCIÓN 5: EN EMISIÓN (Destacado Grande) */}
      <section className="row-section">
        <h3 className="row-title">Capítulos nuevos cada semana</h3>
        <div className="featured-row">
          {emision.map(s => (
            <SerieCard 
              key={s.pk} 
              id={s.pk} 
              titulo={s.titulo} 
              fechaEstreno={s.fechaEstreno} 
              valoracionMedia={s.valoracionMedia} 
              imagen={s.imagenPortada} 
              estado={s.estado}
              variant="featured" 
            />
          ))}
        </div>
      </section>
    </section>
  );
}

export default Catalogo;