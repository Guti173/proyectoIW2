import { useState } from 'react'
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import AuthWidget from './components/AuthWidget'
import isdbLogo from './assets/isdb-logo.svg'
import './App.css'
import Catalogo from "./pages/Catalogo";
import SerieDetalle from "./pages/SerieDetalle";
import Perfil from './pages/Perfil'
import MisListas from './pages/MisListas'
import AdminSeries from "./pages/AdminSeries";
import { clearAuthSession, getStoredAuthSession } from './lib/auth0'

const appNavigation = [
  { to: '/catalogo', label: 'Catalogo' },
  { to: '/perfil', label: 'Perfil' },
  { to: '/listas', label: 'Mis listas' },
]

const guestNavigation = [
  { to: '/', label: 'Home' },
  ...appNavigation,
  { to: '/login', label: 'Login' },
  { to: '/registro', label: 'Registro' },
]

function App() {
  const navigate = useNavigate()
  const [authSession, setAuthSession] = useState(() => getStoredAuthSession())
  const isAuthenticated = Boolean(authSession?.profile)
  const visibleNavigation = isAuthenticated ? appNavigation : guestNavigation
  const brandTarget = isAuthenticated ? '/catalogo' : '/'

  const handleLogout = () => {
    clearAuthSession()
    setAuthSession(null)
    navigate('/', { replace: true })
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-topbar">
          <NavLink to={brandTarget} className="site-brand">
            <img src={isdbLogo} alt="ISDB" className="site-brand-image" />
          </NavLink>

          <nav className="main-nav" aria-label="Navegacion principal">
            {visibleNavigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  isActive ? 'nav-link nav-link-active' : 'nav-link'
                }
              >
                {item.label}
              </NavLink>
            ))}

            {isAuthenticated ? (
              <button className="nav-link nav-logout-button" onClick={handleLogout}>
                Cerrar sesion
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="site-main">
        <Routes>

          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/catalogo" replace /> : <HomePage />}
          />


          <Route path="/catalogo" element={<Catalogo />} />

          <Route path="/series/:id" element={<SerieDetalle />} />
          <Route path="/panel-admin" element={<AdminSeries />} />


          <Route path="/perfil" element={<Perfil />} />

          <Route path="/listas" element={<MisListas />} />

          <Route path="/usuario" element={<Navigate to="/perfil" replace />} />

          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/catalogo" replace />
              ) : (
                <AuthPage initialScreen="login" />
              )
            }
          />
          <Route
            path="/registro"
            element={
              isAuthenticated ? (
                <Navigate to="/catalogo" replace />
              ) : (
                <AuthPage initialScreen="signUp" />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function HomePage() {
  return (
    <section className="home-panel" aria-label="Portada de ISDB">
      <div className="home-copy">
        <p className="home-kicker">Tu archivo personal de series</p>
        <h1>Bienvenido a ISB</h1>
        <p className="home-lead">
          ISDB reune catalogo, listas personales, comentarios y progreso de episodios para tener
          tus series controladas en un solo sitio.
        </p>

        <div className="home-actions">
          <NavLink to="/login" className="home-btn-primary">
            Entrar
          </NavLink>
          <NavLink to="/registro" className="home-btn-secondary">
            Crear cuenta
          </NavLink>
        </div>
      </div>

      <div className="home-showcase" aria-label="Resumen de funciones">
        <div className="home-showcase-header">
          <img src={isdbLogo} alt="" />
          <span>ISDB</span>
        </div>

        <div className="home-showcase-progress">
          <div>
            <span>Viendo ahora</span>
            <strong>4 / 8 episodios</strong>
          </div>
          <div className="home-progress-bar">
            <span />
          </div>
        </div>

        <div className="home-showcase-grid">
          <div>
            <strong>Viendo</strong>
            <span>Series empezadas</span>
          </div>
          <div>
            <strong>Completadas</strong>
            <span>Historial terminado</span>
          </div>
          <div>
            <strong>Listas</strong>
            <span>Colecciones propias</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function AuthPage({ initialScreen }) {
  return (
    <section className="auth-page">
      <div className="page-card auth-card auth-card-solo">
        <AuthWidget initialScreen={initialScreen} />
      </div>
    </section>
  )
}

export default App
