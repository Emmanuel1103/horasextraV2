import { CosmosClient, Database } from "@azure/cosmos";
import { logger } from "../../utils/logger";

const url = process.env.COSMOS_DB_URL || "";
const key = process.env.COSMOS_DB_KEY || "";
const dbName = process.env.COSMOS_DB_DATABASE || "HorasExtrasDB";

if (!url || !key) {
  logger.warn("COSMOS_DB_URL or COSMOS_DB_KEY not set. DB operations will fail until configured.");
}

const client = new CosmosClient({ endpoint: url, key });

export const getDatabase = async (): Promise<Database> => {
  const { database } = await client.databases.createIfNotExists({ id: dbName });
  return database;
};

export default client;
