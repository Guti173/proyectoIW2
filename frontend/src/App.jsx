import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import AuthWidget from './components/AuthWidget'
import isdbLogo from './assets/isdb-logo.svg'
import './App.css'
import Catalogo from "./pages/Catalogo";
import SerieDetalle from "./pages/SerieDetalle";

const navigation = [
  { to: '/', label: 'Home' },
  { to: '/catalogo', label: 'Catalogo' },
  { to: '/login', label: 'Login' },
  { to: '/registro', label: 'Registro' },
]

function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-topbar">
          <NavLink to="/" className="site-brand">
            <img src={isdbLogo} alt="ISDB" className="site-brand-image" />
          </NavLink>

          <nav className="main-nav" aria-label="Navegacion principal">
            {navigation.map((item) => (
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
          </nav>
        </div>
      </header>

      <main className="site-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogo" element={<PlaceholderPage title="Catalogo" />} />
          <Route
            path="/login"
            element={<AuthPage initialScreen="login" />}
          />
          <Route
            path="/registro"
            element={<AuthPage initialScreen="signUp" />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function HomePage() {
  return (
    <section className="home-panel" aria-label="Pantalla de bienvenida">
      <p className="home-message">Bienvenido a ISDB.</p>
    </section>
  )
}

function PlaceholderPage({ title }) {
  return (
    <section className="page-card page-card-muted">
      <div className="page-card-title">{title}</div>
      <div className="page-card-body">
        <p>Pagina en construccion.</p>
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
