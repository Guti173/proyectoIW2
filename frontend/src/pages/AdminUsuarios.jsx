import { useEffect, useMemo, useState } from 'react'
import { getUsers, updateUser } from '../api/client'
import { getStoredAuthSession } from '../lib/auth0'
import './AdminUsuarios.css'

const ACCOUNT_STATES = ['Activa', 'Suspendida']
const USER_ROLES = ['user', 'admin']

function AdminUsuarios() {
  const authSession = getStoredAuthSession()
  const currentUserId = Number(authSession?.profile?.id ?? 0)
  const [usuarios, setUsuarios] = useState([])
  const [drafts, setDrafts] = useState({})
  const [busqueda, setBusqueda] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    let isCancelled = false

    async function loadUsers() {
      setLoading(true)
      setMensaje('')

      try {
        const data = await getUsers()
        const nextUsers = Array.isArray(data) ? data : []

        if (!isCancelled) {
          setUsuarios(nextUsers)
          setDrafts(buildDrafts(nextUsers))
        }
      } catch (error) {
        if (!isCancelled) {
          setMensaje(error?.message || 'No se pudieron cargar los usuarios.')
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      isCancelled = true
    }
  }, [])

  const usuariosFiltrados = useMemo(() => {
    const search = busqueda.trim().toLowerCase()

    if (!search) {
      return usuarios
    }

    return usuarios.filter((usuario) =>
      [usuario.username, usuario.email, usuario.nombre, usuario.apellidos]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search)),
    )
  }, [busqueda, usuarios])

  const totalActivos = usuarios.filter((usuario) => usuario.estadoCuenta === 'Activa').length
  const totalSuspendidos = usuarios.filter(
    (usuario) => usuario.estadoCuenta === 'Suspendida',
  ).length
  const totalAdmins = usuarios.filter((usuario) => usuario.role === 'admin').length

  const updateDraft = (userId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }))
  }

  const applyUserUpdate = async (usuario, changes) => {
    const isSelf = Number(usuario.id) === currentUserId

    if (isSelf && ('role' in changes || 'estadoCuenta' in changes)) {
      setMensaje('No puedes modificar tu propio rol o estado desde aquí.')
      return
    }

    setSavingId(usuario.id)
    setMensaje('')

    try {
      const updatedUser = await updateUser(usuario.id, changes)
      setUsuarios((prev) =>
        prev.map((item) => (item.id === usuario.id ? updatedUser : item)),
      )
      setDrafts((prev) => ({
        ...prev,
        [usuario.id]: {
          role: updatedUser.role,
          estadoCuenta: updatedUser.estadoCuenta,
        },
      }))
      setMensaje(`Usuario ${getUserLabel(updatedUser)} actualizado.`)
    } catch (error) {
      setMensaje(error?.message || 'No se pudo actualizar el usuario.')
    } finally {
      setSavingId(null)
    }
  }

  const saveUser = (usuario) => {
    const draft = drafts[usuario.id]

    if (!draft) {
      return
    }

    applyUserUpdate(usuario, {
      role: draft.role,
      estadoCuenta: draft.estadoCuenta,
    })
  }

  const toggleSuspension = (usuario) => {
    const nextState = usuario.estadoCuenta === 'Suspendida' ? 'Activa' : 'Suspendida'
    applyUserUpdate(usuario, { estadoCuenta: nextState })
  }

  if (loading) {
    return (
      <section className="admin-users-panel">
        <div className="admin-users-empty">Cargando usuarios...</div>
      </section>
    )
  }

  return (
    <section className="admin-users-panel">
      <header className="admin-users-header">
        <div>
          <p className="admin-users-kicker">Panel de administración</p>
          <h1>Gestión de usuarios</h1>
          <p>
            Revisa cuentas, cambia roles y suspende usuarios sin eliminarlos del sistema.
          </p>
        </div>
      </header>

      <div className="admin-users-stats">
        <article>
          <span>Total</span>
          <strong>{usuarios.length}</strong>
        </article>
        <article>
          <span>Activos</span>
          <strong>{totalActivos}</strong>
        </article>
        <article>
          <span>Suspendidos</span>
          <strong>{totalSuspendidos}</strong>
        </article>
        <article>
          <span>Administradores</span>
          <strong>{totalAdmins}</strong>
        </article>
      </div>

      <div className="admin-users-toolbar">
        <label htmlFor="admin-user-search">Buscar usuario</label>
        <input
          id="admin-user-search"
          type="search"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Email, nombre o username"
        />
        <p>
          Mostrando {usuariosFiltrados.length} de {usuarios.length} usuario
          {usuarios.length === 1 ? '' : 's'}
        </p>
      </div>

      {mensaje ? <div className="admin-users-feedback">{mensaje}</div> : null}

      <div className="admin-users-table-shell">
        {usuariosFiltrados.length ? (
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Estado</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((usuario) => {
                const draft = drafts[usuario.id] ?? {
                  role: usuario.role,
                  estadoCuenta: usuario.estadoCuenta,
                }
                const isSelf = Number(usuario.id) === currentUserId
                const isSaving = savingId === usuario.id

                return (
                  <tr key={usuario.id}>
                    <td>
                      <div className="admin-user-identity">
                        <strong>{getUserLabel(usuario)}</strong>
                        <span>ID {usuario.id}</span>
                      </div>
                    </td>
                    <td>{usuario.email || 'Sin email'}</td>
                    <td>
                      <select
                        value={draft.estadoCuenta || 'Activa'}
                        onChange={(event) =>
                          updateDraft(usuario.id, 'estadoCuenta', event.target.value)
                        }
                        disabled={isSelf || isSaving}
                      >
                        {ACCOUNT_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={draft.role || 'user'}
                        onChange={(event) => updateDraft(usuario.id, 'role', event.target.value)}
                        disabled={isSelf || isSaving}
                      >
                        {USER_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {formatRoleLabel(role)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="admin-users-actions">
                        <button
                          type="button"
                          className="admin-users-btn-primary"
                          onClick={() => saveUser(usuario)}
                          disabled={isSelf || isSaving}
                        >
                          {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          type="button"
                          className={
                            usuario.estadoCuenta === 'Suspendida'
                              ? 'admin-users-btn-secondary'
                              : 'admin-users-btn-danger'
                          }
                          onClick={() => toggleSuspension(usuario)}
                          disabled={isSelf || isSaving}
                        >
                          {usuario.estadoCuenta === 'Suspendida' ? 'Reactivar' : 'Suspender'}
                        </button>
                        {isSelf ? (
                          <span className="admin-users-self-note">Tu cuenta</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="admin-users-empty">No hay usuarios que coincidan con la búsqueda.</div>
        )}
      </div>
    </section>
  )
}

function buildDrafts(users) {
  return users.reduce((acc, user) => {
    acc[user.id] = {
      role: user.role || 'user',
      estadoCuenta: user.estadoCuenta || 'Activa',
    }

    return acc
  }, {})
}

function getUserLabel(user) {
  return user.username || user.email || `${user.nombre || ''} ${user.apellidos || ''}`.trim() || `Usuario ${user.id}`
}

function formatRoleLabel(role) {
  return role === 'admin' ? 'Administrador' : 'Usuario'
}

export default AdminUsuarios
