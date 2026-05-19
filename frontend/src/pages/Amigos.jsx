import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  acceptFriendRequest,
  denyFriendRequest,
  getFriendCandidates,
  getFriendships,
  sendFriendRequest,
} from '../api/client'
import { getStoredAuthSession } from '../lib/auth0'
import './Amigos.css'

function Amigos() {
  const navigate = useNavigate()
  const authSession = getStoredAuthSession()
  const isAuthenticated = Boolean(authSession?.profile)
  const [friendships, setFriendships] = useState([])
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [candidateLoading, setCandidateLoading] = useState(false)
  const [candidateError, setCandidateError] = useState('')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState('')

  const loadFriendData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const friendshipData = await getFriendships()

      setFriendships(Array.isArray(friendshipData) ? friendshipData : [])
    } catch (loadError) {
      setError(loadError.message || 'No se pudo cargar tu red de amigos.')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    loadFriendData()
  }, [loadFriendData])

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined
    }

    const normalizedSearch = search.trim()

    if (!normalizedSearch) {
      setCandidates([])
      setCandidateError('')
      setCandidateLoading(false)
      return undefined
    }

    if (normalizedSearch.length < 2) {
      setCandidates([])
      setCandidateError('')
      setCandidateLoading(false)
      return undefined
    }

    const controller = new AbortController()
    setCandidateLoading(true)
    setCandidateError('')

    const timeoutId = window.setTimeout(async () => {
      try {
        const candidateData = await getFriendCandidates(normalizedSearch, {
          signal: controller.signal,
        })
        setCandidates(Array.isArray(candidateData) ? candidateData : [])
      } catch (searchError) {
        if (searchError.name !== 'AbortError') {
          setCandidateError(searchError.message || 'No se pudo buscar usuarios.')
          setCandidates([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setCandidateLoading(false)
        }
      }
    }, 350)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [isAuthenticated, search])

  const pendingReceived = useMemo(
    () =>
      friendships.filter(
        (friendship) =>
          friendship.estado === 'Pendiente' && friendship.rolActual === 'receptor',
      ),
    [friendships],
  )

  const pendingSent = useMemo(
    () =>
      friendships.filter(
        (friendship) =>
          friendship.estado === 'Pendiente' && friendship.rolActual === 'solicitante',
      ),
    [friendships],
  )

  const acceptedFriends = useMemo(
    () => friendships.filter((friendship) => friendship.estado === 'Aceptada'),
    [friendships],
  )
  const candidateState = getCandidateContentState(
    search,
    candidateLoading,
    candidateError,
    candidates,
  )

  const handleSendRequest = async (userId) => {
    await runAction(`send-${userId}`, async () => {
      await sendFriendRequest(userId)
      setMessage('Solicitud de amistad enviada.')
      setCandidates((prev) => prev.filter((candidate) => candidate.id !== userId))
      await loadFriendData()
    })
  }

  const handleAcceptRequest = async (friendshipId) => {
    await runAction(`accept-${friendshipId}`, async () => {
      await acceptFriendRequest(friendshipId)
      setMessage('Solicitud aceptada. Ya sois amigos.')
      await loadFriendData()
    })
  }

  const handleDenyRequest = async (friendshipId) => {
    await runAction(`deny-${friendshipId}`, async () => {
      await denyFriendRequest(friendshipId)
      setMessage('Solicitud denegada.')
      await loadFriendData()
    })
  }

  const runAction = async (id, callback) => {
    setActionId(id)
    setMessage('')
    setError('')

    try {
      await callback()
    } catch (actionError) {
      setError(actionError.message || 'No se pudo completar la accion.')
    } finally {
      setActionId('')
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="amigos-state-card" aria-label="Sesion requerida">
        <p className="amigos-kicker">Amigos</p>
        <h1>Inicia sesion para gestionar tus amistades</h1>
        <p>Conecta con otros usuarios, acepta solicitudes y guarda tu red dentro de ISDB.</p>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="amigos-state-card" aria-label="Cargando amigos">
        <p className="amigos-kicker">Amigos</p>
        <h1>Preparando tu red</h1>
        <p>Estamos revisando solicitudes, amigos actuales y usuarios disponibles.</p>
      </section>
    )
  }

  return (
    <div className="amigos-page">
      <header className="amigos-hero">
        <div>
          <p className="amigos-kicker">AMIGOS</p>
          <h1>Amigos en ISDB</h1>
          <p>
            Gestiona solicitudes, descubre usuarios y consulta desde cuando compartis actividad.
          </p>
        </div>

        <div className="amigos-hero-stats" aria-label="Resumen de amigos">
          <div>
            <strong>{acceptedFriends.length}</strong>
            <span>Amigos</span>
          </div>
          <div>
            <strong>{pendingReceived.length}</strong>
            <span>Recibidas</span>
          </div>
          <div>
            <strong>{pendingSent.length}</strong>
            <span>Enviadas</span>
          </div>
        </div>
      </header>

      {message ? <p className="amigos-feedback">{message}</p> : null}
      {error ? <p className="amigos-feedback is-error">{error}</p> : null}

      <section className="amigos-grid">
        <article className="amigos-panel">
          <PanelHeader
            kicker="Solicitudes"
            title="Pendientes recibidas"
            text="Responde a quienes quieren conectar contigo."
          />

          <div className="amigos-list">
            {pendingReceived.length ? (
              pendingReceived.map((friendship) => (
                <FriendshipCard
                  key={friendship.id}
                  friendship={friendship}
                  actionId={actionId}
                  onAccept={handleAcceptRequest}
                  onDeny={handleDenyRequest}
                />
              ))
            ) : (
              <EmptyBlock text="No tienes solicitudes pendientes." />
            )}
          </div>
        </article>

        <article className="amigos-panel">
          <PanelHeader
            kicker="Enviadas"
            title="Esperando respuesta"
            text="Solicitudes que aun no han sido aceptadas o denegadas."
          />

          <div className="amigos-list">
            {pendingSent.length ? (
              pendingSent.map((friendship) => (
                <FriendshipCard key={friendship.id} friendship={friendship} />
              ))
            ) : (
              <EmptyBlock text="No tienes solicitudes enviadas." />
            )}
          </div>
        </article>
      </section>

      <section className="amigos-panel">
        <PanelHeader
          kicker="Amigos actuales"
          title="Conexiones activas"
          text="Consulta desde cuando sois amigos y cuanto tiempo llevais conectados."
        />

        <div className="amigos-friends-grid">
          {acceptedFriends.length ? (
            acceptedFriends.map((friendship) => (
              <FriendshipCard
                key={friendship.id}
                friendship={friendship}
                compact
                onViewProfile={(userId) => navigate(`/perfil/${userId}`)}
              />
            ))
          ) : (
            <EmptyBlock text="Aun no tienes amigos aceptados." />
          )}
        </div>
      </section>

      <section className="amigos-panel">
        <div className="amigos-search-header">
          <PanelHeader
            kicker="Descubrir"
            title="Enviar solicitud"
            text="Busca usuarios y envia una solicitud si todavia no existe una relacion activa."
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, usuario o email"
            className="amigos-search"
          />
        </div>

        <div className="amigos-candidates-grid">
          {candidateState.type === 'initial' ? (
            <EmptyBlock text="Busca usuarios para enviarles una solicitud." />
          ) : candidateState.type === 'short' ? (
            <EmptyBlock text="Escribe al menos 2 caracteres para buscar usuarios." />
          ) : candidateState.type === 'loading' ? (
            <EmptyBlock text="Buscando usuarios..." />
          ) : candidateState.type === 'error' ? (
            <EmptyBlock text={candidateError} />
          ) : candidateState.type === 'results' ? (
            candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                disabled={actionId === `send-${candidate.id}`}
                onSend={handleSendRequest}
              />
            ))
          ) : (
            <EmptyBlock text="No hay usuarios disponibles con esa busqueda." />
          )}
        </div>
      </section>
    </div>
  )
}

function getCandidateContentState(search, loading, error, candidates) {
  const normalizedSearch = search.trim()

  if (!normalizedSearch) {
    return { type: 'initial' }
  }

  if (normalizedSearch.length < 2) {
    return { type: 'short' }
  }

  if (loading) {
    return { type: 'loading' }
  }

  if (error) {
    return { type: 'error' }
  }

  if (!candidates.length) {
    return { type: 'empty' }
  }

  return { type: 'results' }
}

function PanelHeader({ kicker, title, text }) {
  return (
    <div className="amigos-panel-header">
      <p className="amigos-kicker">{kicker}</p>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  )
}

function FriendshipCard({
  friendship,
  actionId = '',
  onAccept,
  onDeny,
  compact = false,
  onViewProfile,
}) {
  const otherUser = friendship.otroUsuario || friendship.solicitante || friendship.receptor

  return (
    <article className={compact ? 'amigos-card is-compact' : 'amigos-card'}>
      <UserIdentity user={otherUser} />

      <div className="amigos-card-meta">
        <span>Solicitud: {friendship.fechaSolicitudDiaHora || 'Sin fecha'}</span>
        {friendship.estado === 'Aceptada' ? (
          <>
            <span>Amigos desde: {friendship.fechaAmistadDiaHora || 'Sin fecha'}</span>
            <strong>{friendship.tiempoComoAmigos || 'Desde hoy'}</strong>
          </>
        ) : (
          <strong>{friendship.estado}</strong>
        )}
      </div>

      {onAccept && onDeny ? (
        <div className="amigos-card-actions">
          <button
            type="button"
            className="amigos-btn-primary"
            disabled={actionId === `accept-${friendship.id}`}
            onClick={() => onAccept(friendship.id)}
          >
            Aceptar
          </button>
          <button
            type="button"
            className="amigos-btn-secondary"
            disabled={actionId === `deny-${friendship.id}`}
            onClick={() => onDeny(friendship.id)}
          >
            Denegar
          </button>
        </div>
      ) : null}

      {onViewProfile && otherUser?.id ? (
        <button
          type="button"
          className="amigos-btn-secondary"
          onClick={() => onViewProfile(otherUser.id)}
        >
          Ver perfil
        </button>
      ) : null}
    </article>
  )
}

function CandidateCard({ candidate, disabled, onSend }) {
  const statusLabel = getCandidateStatus(candidate)

  return (
    <article className="amigos-card">
      <UserIdentity user={candidate} />

      <div className="amigos-card-meta">
        <strong>{statusLabel}</strong>
      </div>

      <button
        type="button"
        className="amigos-btn-primary"
        disabled={!candidate.puedeEnviarSolicitud || disabled}
        onClick={() => onSend(candidate.id)}
      >
        {disabled ? 'Enviando...' : 'Enviar solicitud'}
      </button>
    </article>
  )
}

function UserIdentity({ user }) {
  const displayName = user?.displayName || user?.username || user?.email || 'Usuario'

  return (
    <div className="amigos-user">
      {user?.fotoPerfil ? (
        <img src={user.fotoPerfil} alt={`Avatar de ${displayName}`} />
      ) : (
        <span>{getInitials(displayName)}</span>
      )}
      <div>
        <strong>{displayName}</strong>
        <small>{user?.email || user?.username || 'Sin contacto visible'}</small>
      </div>
    </div>
  )
}

function EmptyBlock({ text }) {
  return <div className="amigos-empty">{text}</div>
}

function getCandidateStatus(candidate) {
  if (!candidate.amistadEstado) {
    return 'Disponible'
  }

  if (candidate.amistadEstado === 'Aceptada') {
    return 'Ya sois amigos'
  }

  if (candidate.amistadEstado === 'Pendiente') {
    return 'Solicitud pendiente'
  }

  return 'Puedes volver a enviar solicitud'
}

function getInitials(name) {
  const initials = `${name ?? ''}`
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return initials || 'U'
}

export default Amigos
