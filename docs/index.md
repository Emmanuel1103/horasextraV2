# documentación técnica — sistema de gestión de horas extra

bienvenido a la documentación oficial del sistema de gestión de horas extra de la fundación santo domingo (fsd). este centro de conocimiento contiene todo lo necesario para entender la arquitectura, el funcionamiento y la forma de escalar este aplicativo.

## resumen del proyecto

el sistema de gestión de horas extra es una aplicación web diseñada para digitalizar y simplificar el proceso de reporte, validación y aprobación de horas extras laboradas por los colaboradores de la fsd. el aplicativo garantiza la precisión en los cálculos, la trazabilidad de las aprobaciones y la integración eficiente con los procesos de nómina.

## stack tecnológico

el aplicativo utiliza una arquitectura moderna de **aplicación de página única (spa)** con un backend desacoplado:

| capa | tecnología |
|---|---|
| **frontend** | react 18+, vite, tailwind css, typescript |
| **backend** | node.js, express, typescript |
| **persistencia** | azure cosmos db (nosql) |
| **archivos** | azure blob storage |
| **autenticación** | microsoft entra id (azure ad) |
| **infraestructura** | docker, azure pipelines |

## mapa de la documentación

1. [**arquitectura del sistema**](./01-architecture.md): visión general de la infraestructura y flujo de datos.
2. [**frontend y react**](./02-frontend.md): detalles sobre la interfaz de usuario, estado global y componentes.
3. [**backend y apis**](./03-backend.md): estructura del servidor node.js, controladores y servicios.
4. [**infraestructura y despliegue**](./04-infrastructure.md): configuración de contenedores y pipelines de ci/cd.
5. [**guía de escalabilidad**](./05-scalability.md): manual para desarrolladores sobre cómo extender el sistema.
6. [**mapa del proyecto**](./06-project-structure.md): guía detallada de la ubicación y propósito de cada carpeta y archivo.

---

