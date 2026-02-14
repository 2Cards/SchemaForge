export interface Schema {
  id: string;
  name: string;
  dbml: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'schemaforge_schemas';

export const storage = {
  getSchemas: (): Schema[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveSchema: (schema: Schema) => {
    const schemas = storage.getSchemas();
    const index = schemas.findIndex((s) => s.id === schema.id);
    if (index > -1) {
      schemas[index] = { ...schema, updatedAt: Date.now() };
    } else {
      schemas.push({ ...schema, createdAt: Date.now(), updatedAt: Date.now() });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schemas));
  },

  deleteSchema: (id: string) => {
    const schemas = storage.getSchemas().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schemas));
  },

  getSchema: (id: string): Schema | undefined => {
    return storage.getSchemas().find((s) => s.id === id);
  },
};
