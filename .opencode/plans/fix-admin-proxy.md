# Plan: Corregir proxy de Vite para rutas de admin

## Problema
El proxy de Vite en `frontend/vite.config.js` está configurado con `/admin` (sin barra final), lo que hace que **cualquier** ruta que empiece con `/admin` se envíe al backend Django, incluyendo:
- `/admin-comentarios` → se envía al backend (404) ❌
- `/admin/` → se envía al backend (correcto) ✓

## Solución
Cambiar `/admin` por `/admin/` en la configuración del proxy de Vite.

### Archivo a modificar
`frontend/vite.config.js` (línea 14)

### Cambio específico
```diff
- '/admin': {
+ '/admin/': {
    target: backendTarget,
    changeOrigin: true,
  },
```

### Resultado esperado
- `/admin/` y `/admin/*` → Django admin panel ✓
- `/admin-comentarios` → React router (frontend) ✓
- `/panel-admin` → React router (frontend) ✓

## Pasos de verificación
1. Reiniciar el servidor de Vite (`npm run dev`)
2. Iniciar sesión como admin
3. Navegar a `/admin-comentarios` - debería cargar la página de moderación de comentarios
4. Navegar a `/panel-admin` - debería cargar el panel de series
