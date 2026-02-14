import { Parser } from '@dbml/core';

export const parseDBML = (dbml: string) => {
  if (!dbml || typeof dbml !== 'string') return { nodes: [], edges: [] };
  
  try {
    const database = Parser.parse(dbml, 'dbml');
    if (!database || !database.schemas || database.schemas.length === 0) {
      return { nodes: [], edges: [] };
    }

    const schema = database.schemas[0];
    const tables = schema.tables || [];
    const refs = schema.refs || [];

    const nodes = tables.map((table: any, index: number) => ({
      id: table.name,
      type: 'default',
      data: { 
        label: (
          <div className="p-0 overflow-hidden rounded-md border border-slate-700 bg-slate-900 text-slate-200 shadow-xl">
            <div className="bg-slate-800 px-3 py-2 font-bold text-sm border-b border-slate-700 text-blue-400">
              {table.name}
            </div>
            <div className="p-2 space-y-1">
              {table.fields.map((field: any) => (
                <div key={field.name} className="text-[10px] flex justify-between gap-4 font-mono">
                  <span className={field.pk ? "text-yellow-500" : ""}>
                    {field.name}{field.pk ? " 🔑" : ""}
                  </span>
                  <span className="text-slate-500 uppercase">{field.type.type_name}</span>
                </div>
              ))}
            </div>
          </div>
        )
      },
      position: { x: index * 250, y: (index % 3) * 150 },
      style: { background: 'transparent', border: 'none', width: 200 },
    }));

    const edges = refs.map((ref: any, index: number) => {
      const endpoint = ref.endpoints[0];
      const otherEndpoint = ref.endpoints[1];
      return {
        id: `e${index}`,
        source: otherEndpoint.tableName,
        target: endpoint.tableName,
        label: ref.name,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        labelStyle: { fill: '#60a5fa', fontWeight: 700, fontSize: 10 },
      };
    });

    return { nodes, edges };
  } catch (error) {
    console.error('DBML Parse Error:', error);
    return { nodes: [], edges: [] };
  }
};
