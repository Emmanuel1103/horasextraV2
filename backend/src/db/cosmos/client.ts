/**
 * client.ts — configurador de conexión a azure cosmos db
 *
 * este archivo centraliza la lógica de conexión a la base de datos documental.
 * se encarga de:
 *  - leer las credenciales desde las variables de entorno.
 *  - inicializar el cliente oficial de azure cosmos.
 *  - asegurar la existencia de la base de datos configurada.
 */

import { CosmosClient, Database } from "@azure/cosmos";
import { logger } from "../../utils/logger";

// captura de variables de entorno con valores por defecto de seguridad
const url = process.env.COSMOS_DB_URL || "";
const key = process.env.COSMOS_DB_KEY || "";
const dbName = process.env.COSMOS_DB_DATABASE || "HorasExtrasDB";

// advertencia si faltan las llaves de acceso críticas
if (!url || !key) {
  logger.warn("cosmos_db_url o cosmos_db_key no están configuradas. las operaciones de base de datos fallarán.");
}

// instancia única del cliente de cosmos db
const client = new CosmosClient({ endpoint: url, key });

/**
 * obtiene la instancia de la base de datos, creándola si no existe.
 * @returns {Promise<Database>} instancia de la base de datos de azure.
 */
export const getDatabase = async (): Promise<Database> => {
  const { database } = await client.databases.createIfNotExists({ id: dbName });
  return database;
};

export default client;

