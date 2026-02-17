export interface Schema {
  id: string;
  name: string;
  dbml: string;
  layout?: Record<string, { x: number; y: number }>;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'schemaforge_schemas';

const DEFAULT_DBML = `// DBRaw Demo Schema v2 ⚙️

Table users {
  id uuid [pk]
  username varchar
  email varchar
}

Table posts {
  id uuid [pk]
  user_id uuid
  title varchar
  body text
}

Table comments {
  id uuid [pk]
  post_id uuid
  user_id uuid
  content text
}

Ref: users.id < posts.user_id
Ref: posts.id < comments.post_id
Ref: users.id < comments.user_id`;

const DEFAULT_LAYOUT = {
  "users": { "x": 0, "y": 0 },
  "posts": { "x": 400, "y": 0 },
  "comments": { "x": 400, "y": 400 }
};

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

  initDefault: (): Schema => {
    const schema: Schema = {
      id: 'demo-v2',
      name: 'Starter Schema (Demo)',
      dbml: DEFAULT_DBML,
      layout: DEFAULT_LAYOUT,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    storage.saveSchema(schema);
    return schema;
  }
};
