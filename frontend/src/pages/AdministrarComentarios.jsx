import { useEffect, useState } from 'react'
import { deleteComentario, getReportes, updateReporteEstado } from '../api/client'
import './AdministrarComentarios.css'

function AdministrarComentarios() {
  const [reportes, setReportes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    let isCancelled = false

    async function loadReportes() {
      setCargando(true)
      setMensaje('')
      try {
        const result = await getReportes()
        if (!isCancelled) {
          setReportes(Array.isArray(result) ? result : [])
        }
      } catch (error) {
        if (!isCancelled) {
          setMensaje(error?.message || 'No se pudieron cargar los reportes.')
        }
      } finally {
        if (!isCancelled) {
          setCargando(false)
        }
      }
    }

    loadReportes()

    return () => {
      isCancelled = true
    }
  }, [])

  const handleAccion = async (reporte, nuevoEstado) => {
    setMensaje('')

    try {
      await updateReporteEstado(reporte.id, nuevoEstado)

      if (nuevoEstado === 'ACEPTADO') {
        const comentarioId = reporte.comentarioId ?? reporte.comentario?.id
        if (comentarioId) {
          await deleteComentario(comentarioId)
        }
      }

      setReportes((prev) =>
        prev.map((item) =>
          item.id === reporte.id
            ? {
                ...item,
                estado: nuevoEstado,
              }
            : item,
        ),
      )

      setMensaje(
        nuevoEstado === 'ACEPTADO'
          ? 'Reporte aceptado y comentario eliminado.'
          : 'Reporte desestimado correctamente.',
      )
    } catch (error) {
      setMensaje(error?.message || 'No se pudo actualizar el estado del reporte.')
    }
  }

  return (
    <section className="admin-comments-panel">
      <div className="admin-comments-header">
        <div>
          <h1>Moderación de comentarios</h1>
          <p>Revisa los reportes de usuarios y toma decisiones rápidas sobre cada comentario reportado.</p>
        </div>
      </div>

      {mensaje ? <div className="admin-feedback">{mensaje}</div> : null}

      <div className="admin-table-shell">
        {cargando ? (
          <div className="loader">Cargando reportes...</div>
        ) : reportes.length ? (
          <table className="reportes-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Motivo</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Comentario</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reportes.map((reporte) => {
                const comentarioTexto =
                  reporte.comentario?.contenido || reporte.comentario?.texto || reporte.comentarioId || 'No disponible'
                return (
                  <tr key={reporte.id}>
                    <td>{reporte.id}</td>
                    <td>{reporte.motivo || 'Sin motivo'}</td>
                    <td>{formatDate(reporte.fechaReporte)}</td>
                    <td>
                      <span className={`badge badge-${getBadgeClass(reporte.estado)}`}>
                        {reporte.estado || 'Desconocido'}
                      </span>
                    </td>
                    <td>{comentarioTexto}</td>
                    <td>
                      {reporte.estado === 'PENDIENTE' ? (
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="btn-primary btn-small"
                            onClick={() => handleAccion(reporte, 'ACEPTADO')}
                          >
                            Aceptar reporte
                          </button>
                          <button
                            type="button"
                            className="btn-secondary btn-small"
                            onClick={() => handleAccion(reporte, 'RECHAZADO')}
                          >
                            Desestimar
                          </button>
                        </div>
                      ) : (
                        <span className="no-actions">Sin acciones</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No hay reportes para revisar en este momento.</div>
        )}
      </div>
    </section>
  )
}

function getBadgeClass(estado) {
  switch (estado) {
    case 'PENDIENTE':
      return 'pendiente'
    case 'ACEPTADO':
      return 'aceptado'
    case 'RECHAZADO':
      return 'rechazado'
    default:
      return 'neutral'
  }
}

function formatDate(value) {
  if (!value) {
    return 'Sin fecha'
  }

  try {
    return new Date(value).toLocaleDateString('es-ES')
  } catch {
    return value
  }
}

export default AdministrarComentarios
