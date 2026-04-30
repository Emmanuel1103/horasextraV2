/**
 * blobStorage.ts — servicio de gestión de archivos en azure blob storage
 *
 * este archivo centraliza la lógica para interactuar con el almacenamiento
 * de objetos de azure, permitiendo la subida y gestión de soportes adjuntos.
 */

import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";

const conn = process.env.AZURE_BLOB_CONN || "";
const containerName = process.env.AZURE_BLOB_CONTAINER || "horas-adjuntos";

// inicialización del cliente de azure storage si la conexión está disponible
const blobService = conn ? BlobServiceClient.fromConnectionString(conn) : null;

/**
 * obtiene el cliente del contenedor configurado para realizar operaciones de archivos.
 * @returns {ContainerClient | null} cliente del contenedor o null si no hay conexión.
 */
export const getContainerClient = (): ContainerClient | null => {
  if (!blobService) return null;
  return blobService.getContainerClient(containerName);
};

/**
 * genera una url de subida para un archivo, asignándole un nombre único mediante uuid.
 * nota: en esta versión se genera la url base; se recomienda implementar sas tokens para producción.
 * @param {string} filename nombre original del archivo.
 */
export const generateUploadSAS = async (filename: string) => {
  if (!conn) throw new Error("azure_blob_conn no está configurada");
  const client = getContainerClient();
  if (!client) throw new Error("el cliente del contenedor no está disponible");
  
  // se antepone un uuid para evitar colisiones de nombres en el storage
  const blobName = `${uuidv4()}-${filename}`;
  const url = client.getBlockBlobClient(blobName).url;
  
  logger.debug({ blobName, url }, "url de subida generada");
  return { uploadUrl: url, blobName };
};

