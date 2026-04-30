# 06 — mapa del proyecto (estructura de carpetas)

esta sección proporciona una guía visual y descriptiva de la ubicación de cada módulo en el proyecto, facilitando la navegación para el equipo de desarrollo.

## raíz del proyecto

| archivo / carpeta | descripción |
|---|---|
| `frontend/` | código fuente de la interfaz de usuario (react + vite). |
| `backend/` | lógica del servidor y servicios de api (node.js + express). |
| `infra/` | archivos de configuración de infraestructura (terraform, k8s, etc.). |
| `docs/` | documentación técnica del sistema (donde te encuentras ahora). |
| `README.md` | guía rápida de inicio y resumen del proyecto. |
| `azure-pipelines.yml` | definición de los flujos de ci/cd. |

---

## frontend (`/frontend`)

| carpeta / archivo | función |
|---|---|
| `src/pages/` | vistas principales de la aplicación. |
| `src/components/` | componentes ui y funcionales reutilizables. |
| `src/hooks/` | lógica de estado personalizada. |
| `src/services/` | clientes de api para comunicación con el backend. |
| `src/contexts/` | gestión de estado global con context api. |
| `tailwind.config.ts` | configuración del sistema de diseño y temas. |

---

## backend (`/backend`)

| carpeta / archivo | función |
|---|---|
| `src/routes/` | definición de los puntos de entrada de la api. |
| `src/controllers/` | lógica de orquestación de peticiones. |
| `src/services/` | lógica de negocio e interacción con bases de datos. |
| `src/middleware/` | filtros de seguridad y validación. |
| `src/db/` | configuración y conexión a cosmos db. |
| `package.json` | dependencias y scripts del servidor. |

---

> [!NOTE]
> la separación clara entre frontend y backend permite que ambos proyectos puedan ser gestionados y desplegados de forma independiente si es necesario.
