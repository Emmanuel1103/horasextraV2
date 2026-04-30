# gestión de horas extra

este es un sistema web integral diseñado para la gestión, reporte y aprobación de horas extra dentro de la fsd. el aplicativo permite a los colaboradores registrar su tiempo adicional laborado de forma sencilla, a los jefes inmediatos validar los reportes y a las áreas administrativas consolidar la información para el proceso de nómina.

## funcionalidades del sistema

- **registro de horas**: interfaz intuitiva para que el colaborador ingrese sus horas extra detallando fecha, horario y motivo del trabajo adicional.
- **cálculo automático**: el sistema calcula automáticamente los recargos correspondientes (diurnos, nocturnos, festivos) según la normativa legal vigente.
- **flujo de aprobación**: sistema de revisión multinivel donde los jefes directos pueden aprobar o rechazar reportes con comentarios de retroalimentación.
- **generación de reportes**: capacidad de exportar los reportes de horas en formatos estandarizados (pdf/excel) listos para la firma y envío a nómina.
- **notificaciones por correo**: envío automático de alertas a los aprobadores cuando hay reportes pendientes y a los colaboradores cuando su solicitud cambia de estado.
- **panel de administración**: vista consolidada para que el equipo de talento humano pueda supervisar el cumplimiento de los topes de horas permitidos.

## estructura tecnológica

- **frontend**: desarrollado con react 18+, vite y typescript. utiliza tailwind css para una interfaz moderna, responsiva y con estética premium.
- **backend**: servicio api rest construido sobre node.js utilizando el framework express y typescript para robustez y escalabilidad.
- **almacenamiento**:
  - base de datos: azure cosmos db (modelo documental nosql).
  - archivos: azure blob storage para guardar los reportes firmados y evidencias.
- **infraestructura**: el sistema está dockerizado y se despliega automáticamente mediante azure pipelines, garantizando un ciclo de vida de desarrollo ágil.

## configuración y ejecución

para iniciar el proyecto en un entorno de desarrollo local, sigue estos pasos:

### 1. preparar el backend
- entra a la carpeta `/backend`.
- asegúrate de tener instalado node.js 18 o superior.
- instala las dependencias con `npm install`.
- configura tu archivo `.env` basándote en el ejemplo proporcionado.
- ejecuta `npm run dev` para iniciar el servidor.

### 2. preparar el frontend
- entra a la carpeta `/frontend`.
- instala las dependencias con `npm install`.
- inicia el servidor de desarrollo con `npm run dev`.
- accede a la aplicación mediante la url que proporcione vite (típicamente `http://localhost:5173`).

## notas de seguridad

el acceso al sistema está protegido mediante integración con microsoft entra id (azure ad), asegurando que solo el personal autorizado de la fsd pueda ingresar. el control de acceso basado en roles (rbac) garantiza que cada usuario solo vea y realice las acciones permitidas para su perfil, manteniendo la integridad y confidencialidad de la información laboral.
