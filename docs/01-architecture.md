# 01 — arquitectura del sistema

la arquitectura del sistema de gestión de horas extra está diseñada para ser escalable, segura y altamente disponible, utilizando un modelo de cliente-servidor moderno basado en microservicios ligeros.

## flujo de datos

el sistema sigue un flujo estructurado desde la interacción del usuario hasta la persistencia en la nube:

1.  **capa de presentación (frontend)**: construida con react. captura los reportes de horas y las acciones de aprobación, comunicándose de forma asíncrona con la api.
2.  **capa de lógica de negocio (backend)**: un servidor node.js que valida las reglas de negocio (topes de horas, tipos de recargo) y gestiona los permisos de usuario.
3.  **capa de servicios externos**: integración con microsoft entra id para la autenticación y servicios de correo para las notificaciones de flujo de trabajo.
4.  **capa de persistencia (azure)**: almacenamiento de documentos en cosmos db y soportes físicos en blob storage.

## autenticación y seguridad

el sistema implementa **single sign-on (sso)** con microsoft entra id:

- la autenticación se maneja a través de flujos estándar de oauth2/oidc.
- el backend valida los tokens emitidos por microsoft para asegurar que cada petición sea legítima.
- se implementa un control de acceso basado en roles (rbac) que define quién puede reportar, aprobar o administrar el sistema.

## modelo de datos (nosql)

se utiliza **azure cosmos db** por su flexibilidad y escalabilidad:

- **esquema dinámico**: permite evolucionar los modelos de reporte de horas sin necesidad de migraciones de base de datos complejas.
- **particionamiento**: los datos se organizan para permitir consultas rápidas por usuario, período de nómina y sede.

## comunicación de componentes

toda la interacción entre el frontend y el backend se realiza mediante **apis rest** utilizando json como formato de intercambio. se mantiene un contrato de respuesta estandarizado para facilitar el manejo de errores y estados de carga en la interfaz de usuario.

---
> [!TIP]
> la arquitectura está desacoplada, lo que permite que el frontend y el backend puedan escalar de forma independiente según la carga de usuarios.
