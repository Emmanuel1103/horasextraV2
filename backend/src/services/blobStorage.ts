import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";

const conn = process.env.AZURE_BLOB_CONN || "";
const containerName = process.env.AZURE_BLOB_CONTAINER || "horas-adjuntos";

const blobService = conn ? BlobServiceClient.fromConnectionString(conn) : null;

export const getContainerClient = (): ContainerClient | null => {
  if (!blobService) return null;
  return blobService.getContainerClient(containerName);
};

export const generateUploadSAS = async (filename: string) => {
  if (!conn) throw new Error("AZURE_BLOB_CONN not configured");
  const client = getContainerClient();
  if (!client) throw new Error("Container client not available");
  const blobName = `${uuidv4()}-${filename}`;
  const url = client.getBlockBlobClient(blobName).url;
  logger.debug({ blobName, url }, "Generated upload URL (no SAS in scaffold)");
  return { uploadUrl: url, blobName };
};
