import { useState } from 'react'
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import AuthWidget from './components/AuthWidget'
import isdbLogo from './assets/isdb-logo.svg'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'
import Catalogo from "./pages/Catalogo";
import SerieDetalle from "./pages/SerieDetalle";
import ReportarComentario from "./pages/ReportarComentario";
import AdministrarComentarios from "./pages/AdministrarComentarios";
import AdminUsuarios from './pages/AdminUsuarios'
import Perfil from './pages/Perfil'
import MisListas from './pages/MisListas'
import AdminSeries from "./pages/AdminSeries";
import { clearAuthSession, getStoredAuthSession } from './lib/auth0'

const appNavigation = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/perfil', label: 'Perfil' },
  { to: '/listas', label: 'Mis listas' },
]

const adminNavigation = [
  ...appNavigation,
  { to: '/panel-admin', label: 'Administrar series' },
  { to: '/admin-comentarios', label: 'Administrar comentarios' },
  { to: '/admin-usuarios', label: 'Administrar usuarios' },
]

const guestNavigation = [
  { to: '/', label: 'Inicio' },
  ...appNavigation,
  { to: '/login', label: 'Iniciar sesión' },
  { to: '/registro', label: 'Registro' },
]

function App() {
  const navigate = useNavigate()
  const [authSession, setAuthSession] = useState(() => getStoredAuthSession())
  const isAuthenticated = Boolean(authSession?.profile)
  const profile = authSession?.profile
  const isAdmin = profile?.role?.toLowerCase() === 'admin' || profile?.is_superuser || profile?.is_staff
  const isSuspended = profile?.estadoCuenta === 'Suspendida'
  const visibleNavigation = isAuthenticated
    ? isSuspended
      ? []
      : isAdmin
        ? adminNavigation
        : appNavigation
    : guestNavigation
  const brandTarget = isAuthenticated ? (isSuspended ? '/cuenta-suspendida' : '/catalogo') : '/'

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

          <nav className="main-nav" aria-label="Navegación principal">
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
                Cerrar sesión
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="site-main">
        <Routes>

          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to={isSuspended ? '/cuenta-suspendida' : '/catalogo'} replace />
              ) : (
                <HomePage />
              )
            }
          />

          <Route path="/cuenta-suspendida" element={<SuspendedPage />} />


          <Route path="/catalogo" element={<Catalogo />} />

          <Route path="/series/:id" element={<SerieDetalle />} />

          {/* Rutas solo para usuarios autenticados */}
          <Route element={<ProtectedRoute />}>
            <Route path="/reportar-comentario/:comentarioId" element={<ReportarComentario />} />
          </Route>

          {/* Rutas solo para administradores */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin-comentarios" element={<AdministrarComentarios />} />
            <Route path="/panel-admin" element={<AdminSeries />} />
            <Route path="/admin-usuarios" element={<AdminUsuarios />} />
          </Route>

          <Route path="/perfil" element={<Perfil />} />
          <Route path="/listas" element={<MisListas />} />

          <Route path="/usuario" element={<Navigate to="/perfil" replace />} />

          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to={isSuspended ? '/cuenta-suspendida' : '/catalogo'} replace />
              ) : (
                <AuthPage initialScreen="login" />
              )
            }
          />
          <Route
            path="/registro"
            element={
              isAuthenticated ? (
                <Navigate to={isSuspended ? '/cuenta-suspendida' : '/catalogo'} replace />
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
        <h1>Bienvenido a ISDB</h1>
        <p className="home-lead">
          ISDB reúne catálogo, listas personales, comentarios y progreso de episodios para tener
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

function SuspendedPage() {
  return (
    <section className="account-state-panel" aria-label="Cuenta suspendida">
      <p className="home-kicker">Cuenta suspendida</p>
      <h1>Tu cuenta no está activa</h1>
      <p>
        Un administrador ha suspendido esta cuenta. Mientras este estado siga activo, no podrás
        usar las funciones privadas de ISDB.
      </p>
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
