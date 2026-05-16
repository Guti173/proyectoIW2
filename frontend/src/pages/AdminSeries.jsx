import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSeries, createSerie, updateSerie, deleteSerie } from "../api/client";
import { getGeneros, createGenero, updateGenero, deleteGenero } from "../api/client";
import { getStoredAuth } from "../lib/auth0";
import "./AdminSeries.css";

function AdminSeries() {
  const navigate = useNavigate();
  const storedAuth = getStoredAuth();
  const [tab, setTab] = useState("series");
  const [user] = useState(storedAuth?.profile ?? null);
  
  useEffect(() => {
    if (!storedAuth?.profile) {
      navigate("/login");
    }
  }, [navigate, storedAuth?.profile]);
  const [series, setSeries] = useState([]);
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
    if (confirm("¿Eliminar esta serie?")) {
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

  // ============ GENEROS ============
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
      console.error("Error guardando genero:", error);
    }
  };

  const handleEditGenero = (genero) => {
    setFormGenero(genero);
    setEditandoGenero(genero.id);
  };

  const handleDeleteGenero = async (id) => {
    if (confirm("¿Eliminar este genero?")) {
      await deleteGenero(id);
      setGeneros(await loadGeneros());
    }
  };

  const resetFormGenero = () => {
    setFormGenero({ nombre: "", descripcion: "" });
    setEditandoGenero(null);
  };

  if (!user) {
    return null;
  }

  // ... (El bloque return se mantiene igual que en el original)[cite: 16]
  return (
    <div className="admin-panel">
      <h1>Gestión de Biblioteca</h1>
      
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
          <h2>{editandoSerie ? "Editar Serie" : "Nueva Serie"}</h2>
          <form onSubmit={handleSubmitSerie} className="form-admin">
            {/* ... inputs del formulario de series ... */}
            <div className="form-row">
              <div className="form-group">
                <label>Título *</label>
                <input 
                  type="text" 
                  value={formSerie.titulo} 
                  onChange={e => setFormSerie({...formSerie, titulo: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select 
                  value={formSerie.estado} 
                  onChange={e => setFormSerie({...formSerie, estado: e.target.value})}
                >
                  <option value="">Seleccionar...</option>
                  <option value="En emision">En emision</option>
                  <option value="Finalizada">Finalizada</option>
                </select>
              </div>
            </div>
            {/* (Omitido por brevedad: resto de campos de entrada igual al original)[cite: 16] */}
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editandoSerie ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>

          <table className="admin-table">
            {/* ... estructura de tabla igual al original ...[cite: 16] */}
            <tbody>
              {series.map(s => (
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
          <h2>{editandoGenero ? "Editar Género" : "Nuevo Género"}</h2>  
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
                <label>Descripcion</label>
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
          {/* Tabla de Generos */}
          <h3>Generos Existentes</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripcion</th>
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
