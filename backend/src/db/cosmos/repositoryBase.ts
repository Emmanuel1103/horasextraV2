/**
 * repositoryBase.ts — clase base para repositorios de datos
 *
 * proporciona una implementación genérica para las operaciones crud comunes
 * en azure cosmos db. todos los repositorios específicos heredan de esta clase.
 */

import { Container, Database } from "@azure/cosmos";
import { getDatabase } from "./client";

export abstract class RepositoryBase<T extends { id: string }> {
  protected containerName: string;
  protected containerPromise: Promise<Container>;

  /**
   * inicializa el repositorio y asegura que el contenedor exista en la base de datos.
   * @param containerName nombre del contenedor en cosmos db.
   */
  constructor(containerName: string) {
    this.containerName = containerName;
    this.containerPromise = (async () => {
      const db: Database = await getDatabase();
      const { container } = await db.containers.createIfNotExists({ 
        id: containerName, 
        partitionKey: { paths: ["/id"] } 
      });
      return container;
    })();
  }

  /**
   * obtiene la referencia al contenedor de forma asíncrona.
   */
  protected async container() {
    return this.containerPromise;
  }

  /**
   * crea un nuevo elemento en el contenedor.
   */
  async create(item: T) {
    const c = await this.container();
    const res = await c.items.create(item);
    return res.resource;
  }

  /**
   * busca un elemento por su identificador único.
   */
  async getById(id: string) {
    const c = await this.container();
    try {
      const { resource } = await c.item(id, id).read();
      return resource as T | undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * actualiza un elemento existente o lo crea si no existe (operación upsert).
   */
  async upsert(item: T) {
    const c = await this.container();
    const { resource } = await c.items.upsert(item);
    return resource as unknown as T;
  }

  /**
   * realiza una consulta personalizada utilizando sintaxis sql de cosmos db.
   */
  async query(query: string, params: any[] = []) {
    const c = await this.container();
    const iterator = c.items.query({ query, parameters: params });
    const { resources } = await iterator.fetchAll();
    return resources as T[];
  }

  /**
   * elimina un elemento por su id.
   */
  async delete(id: string) {
    const c = await this.container();
    await c.item(id, id).delete();
  }
}

