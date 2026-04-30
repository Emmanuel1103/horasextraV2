# 02 — frontend y react

el frontend del sistema de horas extra está desarrollado con **react 18** y **vite**, ofreciendo una experiencia de usuario rápida, reactiva y moderna. se utiliza **tailwind css** para un diseño visual premium y responsivo.

## conceptos fundamentales

### 1. arquitectura de componentes
la interfaz se divide en componentes modulares y reutilizables:
- **pages**: representan las vistas principales (dashboard, reporte, aprobaciones).
- **components/ui**: elementos visuales básicos (botones, inputs, modales).
- **components/feature**: lógica de negocio compleja (formularios de horas, tablas de resumen).

### 2. gestión de estado
- **hooks personalizados**: se encapsula la lógica de fetching y manipulación de datos en hooks para mantener los componentes limpios.
- **context api**: se utiliza para manejar el estado global, como la información del usuario autenticado y las configuraciones de la aplicación.

### 3. enrutamiento
se utiliza **react router** para la navegación entre páginas sin recargar el navegador, permitiendo una experiencia de spa fluida. las rutas están protegidas según el rol del usuario.

## estructura de carpetas (`frontend/src/`)

| carpeta | propósito |
|---|---|
| `pages/` | pantallas completas de la aplicación. |
| `components/` | componentes visuales y funcionales. |
| `hooks/` | lógica reutilizable y estado local complejo. |
| `contexts/` | proveedores de estado global. |
| `services/` | funciones para la comunicación con la api del backend. |
| `utils/` | funciones de ayuda y formateo. |

## diseño y estilos

- **tailwind css**: permite un desarrollo ágil de la interfaz con un sistema de diseño consistente.
- **glassmorphism**: se aplican efectos de transparencia y desenfoque para lograr una estética moderna y premium.
- **animaciones**: se utilizan transiciones suaves para mejorar la retroalimentación visual al usuario.

---
> [!IMPORTANT]
> todos los componentes deben seguir el estándar de typescript para garantizar la seguridad de tipos y facilitar el mantenimiento a largo plazo.
