import { useEffect, useState } from "react";
import { getSeries, createSerie, updateSerie, deleteSerie } from "../api/client";
import { getGeneros, createGenero, updateGenero, deleteGenero } from "../api/client";
import "./AdminSeries.css";

function AdminSeries() {
  const [tab, setTab] = useState("series");

  const [series, setSeries] = useState([]);
  const [serieBusqueda, setSerieBusqueda] = useState('');
  const [formSerie, setFormSerie] = useState({
    titulo: "", descripcion: "", fechaEstreno: "",
    fechaFin: "", imagenPortada: "", numeroEpisodios: 0,
    valoracionMedia: 0, totalValoraciones: 0, estado: "", generos: []
  });
  const [editandoSerie, setEditandoSerie] = useState(null);

  const [generos, setGeneros] = useState([]);
  const [formGenero, setFormGenero] = useState({
    nombre: "", descripcion: ""
  });
  const [editandoGenero, setEditandoGenero] = useState(null);

  async function loadSeries() {
    return getSeries();
  }

  async function loadGeneros() {
    return getGeneros();
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialData() {
      const [seriesData, generosData] = await Promise.all([
        loadSeries(),
        loadGeneros(),
      ]);

      if (!isCancelled) {
        setSeries(seriesData);
        setGeneros(generosData);
      }
    }

    loadInitialData();

    return () => {
      isCancelled = true;
    };
  }, []);

  // ============ SERIES ============
  const handleSubmitSerie = async (e) => {
    e.preventDefault();
    try {
      if (editandoSerie) {
        await updateSerie(editandoSerie, formSerie);
      } else {
        await createSerie(formSerie);
      }
      resetFormSerie();
      setSeries(await loadSeries());
    } catch (error) {
      console.error("Error guardando serie:", error);
    }
  };

  const handleEditSerie = (serie) => {
    setFormSerie(serie);
    setEditandoSerie(serie.id);
  };

  const handleDeleteSerie = async (id) => {
    if (window.confirm("¿Eliminar esta serie?")) {
      await deleteSerie(id);
      setSeries(await loadSeries());
    }
  };

  const resetFormSerie = () => {
    setFormSerie({
      titulo: "", descripcion: "", fechaEstreno: "",
      fechaFin: "", imagenPortada: "", numeroEpisodios: 0,
      valoracionMedia: 0, totalValoraciones: 0, estado: "", generos: []
    });
    setEditandoSerie(null);
  };

  const seriesFiltradas = series.filter((serieItem) => {
    const titulo = serieItem?.titulo ?? ''
    return titulo.toLowerCase().includes(serieBusqueda.toLowerCase())
  })

  // ============ GÉNEROS ============
  const handleSubmitGenero = async (e) => {
    e.preventDefault();
    try {
      if (editandoGenero) {
        await updateGenero(editandoGenero, formGenero);
      } else {
        await createGenero(formGenero);
      }
      resetFormGenero();
      setGeneros(await loadGeneros());
    } catch (error) {
      console.error("Error guardando género:", error);
    }
  };

  const handleEditGenero = (genero) => {
    setFormGenero(genero);
    setEditandoGenero(genero.id);
  };

  const handleDeleteGenero = async (id) => {
    if (window.confirm("¿Eliminar este género?")) {
      await deleteGenero(id);
      setGeneros(await loadGeneros());
    }
  };

  const resetFormGenero = () => {
    setFormGenero({ nombre: "", descripcion: "" });
    setEditandoGenero(null);
  };

  return (
    <div className="admin-panel">
      <h1>Gestión de biblioteca</h1>

      <div className="tabs">
        <button
          className={tab === "series" ? "active" : ""}
          onClick={() => setTab("series")}
        >
          Series ({series.length})
        </button>
        <button
          className={tab === "generos" ? "active" : ""}
          onClick={() => setTab("generos")}
        >
          Géneros ({generos.length})
        </button>
      </div>

      {tab === "series" && (
        <div className="tab-content">
          <h2>{editandoSerie ? "Editar serie" : "Nueva serie"}</h2>
          <form onSubmit={handleSubmitSerie} className="form-admin">
            {/* ... inputs del formulario de series ... */}
            <div className="form-row">
              <div className="form-group">
                <label>Título *</label>
                <input
                  type="text"
                  value={formSerie.titulo || ""}
                  onChange={e => setFormSerie({...formSerie, titulo: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select
                  value={formSerie.estado || ""}
                  onChange={e => setFormSerie({...formSerie, estado: e.target.value})}
                >
                  <option value="">Seleccionar...</option>
                  <option value="En emision">En emisión</option>
                  <option value="Finalizada">Finalizada</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formSerie.descripcion || ""}
                  onChange={e => setFormSerie({...formSerie, descripcion: e.target.value})}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fecha Estreno</label>
                <input
                  type="date"
                  value={formSerie.fechaEstreno ? formSerie.fechaEstreno.substring(0, 10) : ""}
                  onChange={e => setFormSerie({...formSerie, fechaEstreno: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Fecha Fin</label>
                <input
                  type="date"
                  value={formSerie.fechaFin ? formSerie.fechaFin.substring(0, 10) : ""}
                  onChange={e => setFormSerie({...formSerie, fechaFin: e.target.value})}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Imagen Portada (URL)</label>
                <input
                  type="text"
                  value={formSerie.imagenPortada || ""}
                  onChange={e => setFormSerie({...formSerie, imagenPortada: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Número de Episodios</label>
                <input
                  type="number"
                  value={formSerie.numeroEpisodios || 0}
                  onChange={e => setFormSerie({...formSerie, numeroEpisodios: parseInt(e.target.value, 10)})}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Valoración Media</label>
                <input
                  type="number"
                  step="0.1"
                  value={formSerie.valoracionMedia || 0}
                  onChange={e => setFormSerie({...formSerie, valoracionMedia: parseFloat(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Total Valoraciones</label>
                <input
                  type="number"
                  value={formSerie.totalValoraciones || 0}
                  onChange={e => setFormSerie({...formSerie, totalValoraciones: parseInt(e.target.value, 10)})}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editandoSerie ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>

          <div className="admin-search-bar">
            <label htmlFor="search-serie">Buscar serie</label>
            <input
              id="search-serie"
              type="search"
              placeholder="Buscar por título..."
              value={serieBusqueda}
              onChange={(e) => setSerieBusqueda(e.target.value)}
            />
            <p className="search-meta">
              Mostrando {seriesFiltradas.length} de {series.length} serie{series.length === 1 ? '' : 's'}
            </p>
          </div>

          <table className="admin-table">
            <tbody>
              {seriesFiltradas.map(s => (
                <tr key={s.id}>
                  <td>{s.titulo}</td>
                  <td>
                    <button onClick={() => handleEditSerie(s)} className="btn-edit">Editar</button>
                    <button onClick={() => handleDeleteSerie(s.id)} className="btn-delete">Borrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "generos" && (
        <div className="tab-content">
          <h2>{editandoGenero ? "Editar género" : "Nuevo género"}</h2>
          <form onSubmit={handleSubmitGenero} className="form-admin">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formGenero.nombre}
                  onChange={e => setFormGenero({ ...formGenero, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text"
                  value={formGenero.descripcion}
                  onChange={e => setFormGenero({ ...formGenero, descripcion: e.target.value })}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editandoGenero ? "Actualizar género" : "Crear género"}
              </button>
            </div>
          </form>
          {/* Tabla de géneros */}
          <h3>Géneros existentes</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {generos.map(g => (
                <tr key={g.id}>
                  <td>{g.id}</td>
                  <td>{g.nombre}</td>
                  <td>{g.descripcion}</td>
                  <td>
                    <button onClick={() => handleEditGenero(g)} className="btn-edit">Editar</button>
                    <button onClick={() => handleDeleteGenero(g.id)} className="btn-delete">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminSeries;
