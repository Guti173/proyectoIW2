import { useEffect, useId, useState } from 'react'
import { syncCurrentUser } from '../api/client'
import {
  auth0Config,
  getRedirectPathForRole,
  isAuth0Configured,
  persistAuthSession,
} from '../lib/auth0'

function AuthWidget({ initialScreen = 'login' }) {
  const reactId = useId()
  const containerId = `auth0-lock-${reactId.replace(/[:]/g, '')}`
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuth0Configured()) {
      setIsLoading(false)
      return undefined
    }

    let lock = null
    let isCancelled = false
    let fieldOrderObserver = null

    async function mountWidget() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const Auth0Lock = window.Auth0Lock

        if (!Auth0Lock) {
          throw new Error(
            'No se ha podido cargar Auth0 Lock. Recarga la página y comprueba el script del CDN.',
          )
        }

        if (isCancelled) {
          return
        }

        lock = new Auth0Lock(auth0Config.clientId, auth0Config.domain, {
          container: containerId,
          closable: false,
          autoclose: true,
          allowAutocomplete: true,
          allowShowPassword: true,
          rememberLastLogin: false,
          language: 'es',
          languageDictionary: {
            title: initialScreen === 'signUp' ? 'Registrarse' : 'Iniciar sesión',
          },
          initialScreen,
          allowedConnections: [auth0Config.databaseConnection],
          defaultDatabaseConnection: auth0Config.databaseConnection,
          additionalSignUpFields: [
            {
              name: 'name',
              placeholder: 'nombre y apellidos',
              storage: 'root',
              validator(value) {
                const normalizedValue = `${value ?? ''}`.trim()

                return {
                  valid: normalizedValue.length >= 2 && normalizedValue.length <= 80,
                  hint: 'Introduce nombre y apellidos entre 2 y 80 caracteres.',
                }
              },
            },
          ],
          theme: {
            logo: `${window.location.origin}/isdb-logo.svg`,
            primaryColor: '#11314a',
          },
          auth: {
            redirect: false,
            redirectUrl: window.location.origin,
            responseType: 'token id_token',
            sso: false,
            params: {
              scope: 'openid profile email',
            },
          },
        })

        const handleAuthenticated = (authResult) => {
          setErrorMessage('')

          if (!authResult?.accessToken) {
            setErrorMessage('Auth0 no devolvió un token válido.')
            return
          }

          lock.getUserInfo(authResult.accessToken, async (error, profile) => {
            if (error) {
              setErrorMessage(
                error.description ??
                  'Se inició sesión, pero no se pudo recuperar el perfil.',
              )
              return
            }
            
            //Guardamos la sesión con el perfil de Auth0 para que la siguiente llamada funcione
            const normalizedProfile = {
              ...profile,
              ...(authResult.idTokenPayload ?? {}),
              user_metadata: {
                ...(profile?.user_metadata ?? {}),
                ...(authResult.idTokenPayload?.user_metadata ?? {}),
              },
            }

            persistAuthSession({
              accessToken: authResult.accessToken,
              idToken: authResult.idToken,
              expiresIn: authResult.expiresIn,
              profile: normalizedProfile,
            })
            
            let user = null
            try {
              //Sincronizamos y obtenemos el perfil COMPLETO de nuestro backend (con el rol)
              user = await syncCurrentUser()
              if (user) {
                //VOLVEMOS a persistir la sesión, pero esta vez con el perfil de nuestro backend
                persistAuthSession({ ...authResult, profile: user })
              }
            } catch (syncError) {
              if (syncError?.status && syncError.status < 500) {
                setErrorMessage(syncError.message || 'No se pudo completar el registro.')
                return
              }

            }
            
            window.location.assign(getRedirectPathForRole(user?.role, user?.estadoCuenta))
          })
        }

        const handleAuthorizationError = (error) => {
          setErrorMessage(
            error?.description ?? 'No se pudo completar la autenticación con Auth0.',
          )
        }

        lock.on('authenticated', handleAuthenticated)
        lock.on('authorization_error', handleAuthorizationError)
        lock.show()
        fieldOrderObserver = setupSignUpFieldOrder(containerId)
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error?.message ?? 'No se pudo cargar el widget de autenticación.',
          )
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    mountWidget()

    return () => {
      isCancelled = true
      if (typeof lock?.hide === 'function') {
        lock.hide()
      }
      if (typeof lock?.removeAllListeners === 'function') {
        lock.removeAllListeners()
      }
      if (fieldOrderObserver) {
        fieldOrderObserver.disconnect()
      }
    }
  }, [containerId, initialScreen])

  if (!isAuth0Configured()) {
    return (
      <div className="auth-widget-state auth-widget-config">
        <p>Falta configurar Auth0 en <code>frontend/.env</code>.</p>
        <p>
          Rellena <code>VITE_AUTH0_DOMAIN</code>, <code>VITE_AUTH0_CLIENT_ID</code> y,
          si hace falta, <code>VITE_AUTH0_DB_CONNECTION</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="auth-widget-shell">
      {errorMessage ? <p className="auth-widget-error">{errorMessage}</p> : null}
      {isLoading ? <p className="auth-widget-loading">Cargando...</p> : null}
      <div id={containerId} />
    </div>
  )
}

function setupSignUpFieldOrder(containerId) {
  const container = document.getElementById(containerId)

  if (!container) {
    return null
  }

  const applyOrder = () => {
    const orderedInputs = [
      findInput(container, ['email'], ['email', 'correo']),
      findInput(container, ['name'], ['nombre y apellidos', 'nombre']),
      findInput(container, ['nickname', 'username'], ['usuario', 'username']),
      findInput(container, ['password'], ['password', 'contraseña', 'contrasena']),
    ].filter(Boolean)

    const orderedFields = orderedInputs
      .map((input) => input.closest('.auth0-lock-input-block') || input.closest('.auth0-lock-input') || input.parentElement)
      .filter(Boolean)

    if (orderedFields.length < 2) {
      return
    }

    const parent = orderedFields[0].parentElement

    if (!parent || orderedFields.some((field) => field.parentElement !== parent)) {
      return
    }

    const currentIndexes = orderedFields.map((field) => Array.from(parent.children).indexOf(field))
    const isAlreadyOrdered = currentIndexes.every(
      (index, position) => position === 0 || index > currentIndexes[position - 1],
    )

    if (isAlreadyOrdered) {
      return
    }

    orderedFields.forEach((field) => parent.appendChild(field))
  }

  const observer = new MutationObserver(applyOrder)
  observer.observe(container, { childList: true, subtree: true })
  window.setTimeout(applyOrder, 0)

  return observer
}

function findInput(container, names, placeholders) {
  const inputs = Array.from(container.querySelectorAll('input'))

  return inputs.find((input) => {
    const name = `${input.name || input.getAttribute('name') || ''}`.toLowerCase()
    const placeholder = `${input.placeholder || input.getAttribute('placeholder') || ''}`.toLowerCase()
    const type = `${input.type || ''}`.toLowerCase()

    return (
      names.some((candidate) => name === candidate || type === candidate) ||
      placeholders.some((candidate) => placeholder.includes(candidate))
    )
  })
}

export default AuthWidget
