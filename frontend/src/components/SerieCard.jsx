import { useNavigate } from "react-router-dom";
import "./SerieCard.css";

const SerieCard = ({ id, titulo, fechaEstreno, valoracionMedia = 0, imagen, estado }) => {
  const navigate = useNavigate(); // <-- Hook para navegar
  const year = fechaEstreno ? new Date(fechaEstreno).getFullYear() : "Desconocido";
  const valoracion = Number(valoracionMedia) ? Number(valoracionMedia).toFixed(1) : "0.0";

  // Al hacer clic, enviamos al usuario a /series/1 (o el ID que sea)
  return (
    <div className="serie-card" onClick={() => navigate(`/series/${id}`)}>
      <div className="serie-img-container">
        {estado && <span className="serie-badge">{estado}</span>}
        <img src={imagen} alt={titulo} className="serie-img" />
      </div>

      <div className="serie-info">
        <h3>{titulo}</h3>
        <div className="serie-meta">
          <span className="serie-year">{year}</span>
          <span className="serie-rating">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            {valoracion}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SerieCard;