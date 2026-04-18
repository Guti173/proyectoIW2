import { useEffect, useId, useState } from 'react'
import { auth0Config, isAuth0Configured, persistAuthSession } from '../lib/auth0'

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

    async function mountWidget() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const Auth0Lock = window.Auth0Lock

        if (!Auth0Lock) {
          throw new Error(
            'No se ha podido cargar Auth0 Lock. Recarga la pagina y comprueba el script del CDN.',
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
          initialScreen,
          allowedConnections: [auth0Config.databaseConnection],
          defaultDatabaseConnection: auth0Config.databaseConnection,
          theme: {
            logo: `${window.location.origin}/isdb-logo.svg`,
            primaryColor: '#11314a',
          },
          auth: {
            redirect: false,
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
            setErrorMessage('Auth0 no devolvio un token valido.')
            return
          }

          lock.getUserInfo(authResult.accessToken, (error, profile) => {
            if (error) {
              setErrorMessage(
                error.description ??
                  'Se inicio sesion, pero no se pudo recuperar el perfil.',
              )
              return
            }

            persistAuthSession({
              accessToken: authResult.accessToken,
              idToken: authResult.idToken,
              expiresIn: authResult.expiresIn,
              profile,
            })

            window.location.assign('/')
          })
        }

        const handleAuthorizationError = (error) => {
          setErrorMessage(
            error?.description ?? 'No se pudo completar la autenticacion con Auth0.',
          )
        }

        lock.on('authenticated', handleAuthenticated)
        lock.on('authorization_error', handleAuthorizationError)
        lock.show()
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error?.message ?? 'No se pudo cargar el widget de autenticacion.',
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
      if (typeof lock.hide === 'function') {
        lock.hide()
      }
      if (typeof lock.removeAllListeners === 'function') {
        lock.removeAllListeners()
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
      {isLoading ? <p className="auth-widget-state">Cargando acceso...</p> : null}
      <div id={containerId} className="auth-lock-container" />
    </div>
  )
}

export default AuthWidget
