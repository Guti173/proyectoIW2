import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { fetchCollection } from './api/client'
import './App.css'
import Catalogo from "./pages/Catalogo";
import SerieDetalle from "./pages/SerieDetalle";

const navigation = [
  { to: '/', label: 'Resumen' },
  { to: '/series', label: 'Series' },
  { to: '/usuarios', label: 'Usuarios' },
  { to: '/listas', label: 'Listas' },
]

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <p className="eyebrow">proyectoIW2</p>
        <h1 className="brand">Panel base de React</h1>
        <p className="sidebar-copy">
          Frontend separado en Vite consumiendo la API del backend Django.
        </p>

        <nav className="navigation" aria-label="Secciones principales">
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

        <div className="sidebar-card">
          <p className="sidebar-card-label">Accesos backend</p>
          <a href="/api/docs/" target="_blank" rel="noreferrer">
            Swagger
          </a>
          <a href="/api/redoc/" target="_blank" rel="noreferrer">
            Redoc
          </a>
          <a href="/admin/" target="_blank" rel="noreferrer">
            Admin Django
          </a>
        </div>
      </aside>

      <main className="main-panel">
        <section className="hero-banner">
          <div>
            <p className="eyebrow">Arquitectura limpia</p>
            <h2>Frontend y backend ya van por caminos separados</h2>
            <p className="hero-copy">
              React vive en <code>frontend/</code> y Django en <code>backend/</code>.
              La interfaz ya apunta a <code>/api</code> y puede crecer por vistas sin
              chocar con las rutas del backend.
            </p>
          </div>
          <div className="hero-badges">
            <span>React 19</span>
            <span>Vite 8</span>
            <span>Django 5</span>
          </div>
        </section>

        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route
            path="/series"
            element={<Catalogo />}
          />
          <Route
            path="/usuarios"
            element={
              <CollectionPage
                eyebrow="Comunidad"
                title="Usuarios"
                description="Filtra usuarios por nombre con la API de DRF."
                endpoint="/api/user/"
                queryKey="nombre"
                placeholder="Filtrar por nombre"
                emptyText="No se han encontrado usuarios."
                renderItem={(user) => (
                  <>
                    <div className="card-header">
                      <h3>{user.name}</h3>
                      <span className="pill pill-alt">{user.document}</span>
                    </div>
                    <p>{user.email}</p>
                    <dl className="meta-grid">
                      <div>
                        <dt>Telefono</dt>
                        <dd>{user.phone}</dd>
                      </div>
                      <div>
                        <dt>Alta</dt>
                        <dd>{user.registrationDate}</dd>
                      </div>
                    </dl>
                  </>
                )}
              />
            }
          />
          <Route
            path="/listas"
            element={
              <CollectionPage
                eyebrow="Biblioteca"
                title="Listas de usuario"
                description="Consulta y filtra listas por tipo."
                endpoint="/api/listausuario/"
                queryKey="tipoLista"
                placeholder="Filtrar por tipo de lista"
                emptyText="No hay listas registradas con ese filtro."
                renderItem={(lista) => (
                  <>
                    <div className="card-header">
                      <h3>{lista.tipoLista}</h3>
                      <span className="pill">{lista.series.length} series</span>
                    </div>
                    <p>Usuario vinculado: {lista.idUser}</p>
                    <dl className="meta-grid">
                      <div>
                        <dt>Fecha</dt>
                        <dd>{lista.fechaAgregado}</dd>
                      </div>
                      <div>
                        <dt>Elementos</dt>
                        <dd>{lista.series.length}</dd>
                      </div>
                    </dl>
                  </>
                )}
              />
            }
          />
          <Route path="/series/:id" element={<SerieDetalle />} />
        </Routes>
      </main>
    </div>
  )
}

function DashboardPage() {
  const [summary, setSummary] = useState({
    series: 0,
    usuarios: 0,
    listas: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadSummary() {
      setLoading(true)
      setError('')

      try {
        const [series, usuarios, listas] = await Promise.all([
          fetchCollection('/api/serie/', { signal: controller.signal }),
          fetchCollection('/api/user/', { signal: controller.signal }),
          fetchCollection('/api/listausuario/', { signal: controller.signal }),
        ])

        setSummary({
          series: series.length,
          usuarios: usuarios.length,
          listas: listas.length,
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('No se pudo cargar el resumen. Comprueba que Django este levantado.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadSummary()

    return () => controller.abort()
  }, [])

  const cards = [
    {
      label: 'Series registradas',
      value: summary.series,
      tone: 'sun',
      helper: 'Catalogo disponible en /api/serie/',
    },
    {
      label: 'Usuarios',
      value: summary.usuarios,
      tone: 'ocean',
      helper: 'Directorio expuesto en /api/user/',
    },
    {
      label: 'Listas creadas',
      value: summary.listas,
      tone: 'ember',
      helper: 'Coleccion expuesta en /api/listausuario/',
    },
  ]

  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Resumen</p>
          <h2>Estado rapido del proyecto</h2>
        </div>
        <p className="status-copy">
          {loading ? 'Cargando datos...' : error || 'Conectado correctamente con la API.'}
        </p>
      </header>

      <div className="stats-grid">
        {cards.map((card) => (
          <article key={card.label} className={`stat-card stat-card-${card.tone}`}>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.helper}</span>
          </article>
        ))}
      </div>

      <section className="info-grid">
        <article className="info-card">
          <p className="eyebrow">Backend</p>
          <h3>Ruta base organizada</h3>
          <p>
            El backend ya esta dentro de <code>backend/</code> y todas las rutas de la
            API salen ahora de <code>/api/</code>.
          </p>
        </article>

        <article className="info-card">
          <p className="eyebrow">Frontend</p>
          <h3>Base lista para crecer</h3>
          <p>
            La app usa React Router, proxy de Vite y tarjetas de datos para validar
            rapidamente que la API responde.
          </p>
        </article>
      </section>
    </section>
  )
}

function CollectionPage({
  eyebrow,
  title,
  description,
  endpoint,
  queryKey,
  placeholder,
  emptyText,
  renderItem,
}) {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const timerId = window.setTimeout(async () => {
      setLoading(true)
      setError('')

      try {
        const data = await fetchCollection(endpoint, {
          params: { [queryKey]: query },
          signal: controller.signal,
        })
        setItems(data)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('No se pudieron cargar los datos de la API.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 250)

    return () => {
      window.clearTimeout(timerId)
      controller.abort()
    }
  }, [endpoint, query, queryKey])

  return (
    <section className="page-section">
      <header className="page-header page-header-split">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="section-copy">{description}</p>
        </div>

        <label className="search-field">
          <span>Buscar</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
          />
        </label>
      </header>

      <p className="status-copy">
        {loading && 'Actualizando resultados...'}
        {!loading && error}
        {!loading && !error && `${items.length} resultados encontrados.`}
      </p>

      {!loading && !error && items.length === 0 ? (
        <article className="empty-state">
          <h3>Sin resultados</h3>
          <p>{emptyText}</p>
        </article>
      ) : null}

      <div className="collection-grid">
        {items.map((item) => (
          <article key={item.pk} className="collection-card">
            {renderItem(item)}
          </article>
        ))}
      </div>
    </section>
  )
}

export default App
