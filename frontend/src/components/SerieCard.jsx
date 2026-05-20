import { useNavigate } from 'react-router-dom'
import './SerieCard.css'

const SerieCard = ({ id, titulo, fechaEstreno, valoracionMedia = 0, imagen, estado }) => {
  const navigate = useNavigate()
  const year = fechaEstreno ? new Date(fechaEstreno).getFullYear() : 'Desconocido'
  const valoracion = Number(valoracionMedia) ? Number(valoracionMedia).toFixed(1) : '0.0'
  const estadoLabel = formatEstado(estado)

  return (
    <div className="serie-card" onClick={() => navigate(`/series/${id}`)}>
      <div className="serie-img-container">
        {estadoLabel ? <span className="serie-badge">{estadoLabel}</span> : null}
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
  )
}

function formatEstado(value) {
  if (value === 'En emision') {
    return 'En emisión'
  }

  return value
}

export default SerieCard
