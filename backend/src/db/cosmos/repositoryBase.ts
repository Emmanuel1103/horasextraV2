import { Container, Database } from "@azure/cosmos";
import { getDatabase } from "./client";

export abstract class RepositoryBase<T extends { id: string }> {
  protected containerName: string;
  protected containerPromise: Promise<Container>;

  constructor(containerName: string) {
    this.containerName = containerName;
    this.containerPromise = (async () => {
      const db: Database = await getDatabase();
      const { container } = await db.containers.createIfNotExists({ id: containerName, partitionKey: { paths: ["/id"] } });
      return container;
    })();
  }

  protected async container() {
    return this.containerPromise;
  }

  async create(item: T) {
    const c = await this.container();
    const res = await c.items.create(item);
    return res.resource;
  }

  async getById(id: string) {
    const c = await this.container();
    try {
      const { resource } = await c.item(id, id).read();
      return resource as T | undefined;
    } catch {
      return undefined;
    }
  }

  async upsert(item: T) {
    const c = await this.container();
    const { resource } = await c.items.upsert(item);
    return resource as unknown as T;
  }

  async query(query: string, params: any[] = []) {
    const c = await this.container();
    const iterator = c.items.query({ query, parameters: params });
    const { resources } = await iterator.fetchAll();
    return resources as T[];
  }

  async delete(id: string) {
    const c = await this.container();
    await c.item(id, id).delete();
  }
}
