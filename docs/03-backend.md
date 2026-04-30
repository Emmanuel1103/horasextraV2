# 03 — backend y apis

el backend es un servidor robusto construido con **node.js** y **express** en **typescript**. su función principal es procesar las solicitudes del frontend, validar la integridad de los datos y gestionar la persistencia en azure.

## estructura del servidor

el proyecto sigue una organización por capas para separar las responsabilidades:

- **index.ts / app.ts**: puntos de entrada que configuran el servidor, los middlewares (cors, json) y las rutas.
- **routes/**: definen los endpoints de la api (ej: `/api/reportes`, `/api/usuarios`).
- **controllers/**: contienen la lógica de orquestación de cada petición.
- **services/**: encapsulan la lógica de negocio y la comunicación con bases de datos o servicios externos.
- **middleware/**: funciones de validación de seguridad (auth) y manejo de errores.

## persistencia (cosmos db)

la interacción con azure cosmos db se centraliza en servicios dedicados que utilizan el sdk oficial de azure para javascript/typescript.

### patrón de acceso a datos
se utilizan funciones asíncronas para realizar operaciones crud, asegurando que el servidor pueda manejar múltiples peticiones simultáneas de forma eficiente.

## integración con azure blob storage

los archivos adjuntos o reportes generados se almacenan de forma segura en contenedores de blob storage. el backend genera urls de acceso temporal o gestiona la subida de archivos directamente.

## seguridad y validación

- **validación de tokens**: cada petición protegida debe incluir un token válido de microsoft entra id.
- **esquemas de datos**: se utilizan interfaces de typescript y validadores (como zod o joi) para asegurar que los datos recibidos cumplan con el formato esperado antes de ser procesados.

---
> [!TIP]
> utiliza siempre los servicios definidos para interactuar con la base de datos; nunca realices consultas directas desde los controladores para mantener la separación de responsabilidades.
