# Backend Gestión de Horas Extras

Este backend está diseñado para ejecutarse localmente y desplegarse en Azure App Service.

Stack: Node.js + Express + TypeScript
DB: Azure Cosmos DB (Core SQL)
Storage: Azure Blob Storage
Auth: Microsoft Entra ID (JWT RS256)

Cómo ejecutar local:

1. Copia `backend/.env.example` a `backend/.env` y rellena los placeholders (puedes usar valores de desarrollo).
2. Desde la carpeta `backend` ejecutar:

```bash
npm install
npm run dev
```

Con Docker:

```bash
docker-compose up --build
```

Tests:

```bash
npm test
```

Variables importantes (ver `.env.example`):
- PORT, NODE_ENV
- COSMOS_DB_URL, COSMOS_DB_KEY, COSMOS_DB_DATABASE
- TENANT_ID, CLIENT_ID, JWT_ISSUER, JWKS_URI
- AZURE_BLOB_CONN, AZURE_BLOB_CONTAINER

Endpoints implementados (esqueleto):
- GET /api/requests
- POST /api/requests
- PUT /api/requests/:id
- POST /api/requests/:id/approve
- POST /api/requests/:id/reject
- POST /api/requests/:id/cancel

Nota: Este scaffold incluye módulos y helpers básicos. Para producción configure Managed Identity, Key Vault y políticas de CORS y seguridad adicionales.
