# 04 — infraestructura y despliegue

el sistema de horas extra está diseñado para ser desplegado en entornos de contenedores, facilitando la consistencia entre desarrollo, pruebas y producción.

## dockerización

el proyecto incluye archivos `dockerfile` para el frontend y el backend:

- **backend**: imagen basada en node.js (alpine) para un tamaño reducido y mayor seguridad.
- **frontend**: construcción multipaso que utiliza node para compilar los activos de react y nginx para servirlos de forma eficiente.

## integración y despliegue continuo (ci/cd)

se utilizan **azure pipelines** para automatizar el ciclo de vida del software:

1.  **compilación**: validación de tipos de typescript y construcción de los artefactos.
2.  **pruebas**: ejecución de suites de pruebas automáticas (si están configuradas).
3.  **empaquetado**: creación de imágenes de docker y subida al azure container registry (acr).
4.  **despliegue**: actualización automática de los servicios en azure app service o azure container apps.

## configuración del entorno

la configuración se maneja a través de variables de entorno, las cuales deben estar presentes en un archivo `.env` para desarrollo local o configuradas en azure para producción.

### variables clave
- `database_endpoint`: url de conexión a cosmos db.
- `database_key`: llave secreta de la base de datos.
- `azure_storage_connection`: cadena de conexión para blob storage.
- `client_id` / `tenant_id`: credenciales para la autenticación con microsoft.

---
> [!CAUTION]
> nunca incluyas secretos o claves privadas directamente en el código fuente. utiliza siempre el sistema de gestión de secretos de azure (key vault) en producción.
