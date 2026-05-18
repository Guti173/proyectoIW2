import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { createReporte } from '../api/client'
import './ReportarComentario.css'

function ReportarComentario() {
  const { comentarioId: comentarioIdParam } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const comentarioId = comentarioIdParam || location.state?.comentarioId
  const [motivo, setMotivo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!comentarioId) {
      setError('No se encontró el comentario para reportar. Vuelve a intentarlo desde la serie.')
    }
  }, [comentarioId])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!comentarioId) {
      setError('ID de comentario inválido.')
      return
    }

    if (!motivo.trim()) {
      setError('Escribe el motivo del reporte.')
      return
    }

    setError('')
    setMensaje('')
    setSubmitting(true)

    try {
      await createReporte(comentarioId, motivo.trim())
      setSuccess(true)
      setMensaje('Reporte enviado correctamente. Nuestro equipo de moderación revisará el caso.')
    } catch (err) {
      setError(err?.message || 'No se pudo enviar el reporte. Intenta de nuevo más tarde.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="reportar-page">
      <div className="reportar-shell">
        <header className="reportar-header">
          <h1>Reportar comentario</h1>
          <p>
            Usa este formulario para enviar un reporte. El comentario será revisado por un administrador y se
            tomará una decisión en breve.
          </p>
        </header>

        <div className="reportar-card">
          {success ? (
            <div className="reportar-result">
              <p className="reportar-success">{mensaje}</p>
              <button className="btn-primary" onClick={() => navigate(-1)}>
                Volver atrás
              </button>
            </div>
          ) : (
            <form className="reportar-form" onSubmit={handleSubmit}>
              <label htmlFor="motivo">Motivo del reporte</label>
              <textarea
                id="motivo"
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                placeholder="Describe brevemente por qué consideras que este comentario debe ser revisado"
                rows="6"
                disabled={submitting}
              />

              {error ? <p className="reportar-error">{error}</p> : null}

              <div className="reportar-actions">
                <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Enviar reporte'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default ReportarComentario
