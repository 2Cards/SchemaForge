import { Parser } from '@dbml/core';

export const parseDBML = (dbml: string) => {
  try {
    const database = Parser.parse(dbml, 'dbml');
    const nodes = database.schemas[0].tables.map((table: any, index: number) => ({
      id: table.name,
      type: 'default',
      data: { 
        label: (
          <div className="p-2">
            <div className="font-bold border-b mb-1">{table.name}</div>
            {table.fields.map((field: any) => (
              <div key={field.name} className="text-xs flex justify-between gap-4">
                <span>{field.name}</span>
                <span className="text-gray-500">{field.type.type_name}</span>
              </div>
            ))}
          </div>
        )
      },
      position: { x: index * 250, y: 100 },
      style: { background: '#fff', border: '1px solid #ddd', borderRadius: '8px', width: 200 },
    }));

    const edges = database.schemas[0].refs.map((ref: any, index: number) => {
      const endpoint = ref.endpoints[0];
      const otherEndpoint = ref.endpoints[1];
      return {
        id: `e${index}`,
        source: otherEndpoint.tableName,
        target: endpoint.tableName,
        label: ref.name,
      };
    });

    return { nodes, edges };
  } catch (error) {
    console.error('DBML Parse Error:', error);
    return { nodes: [], edges: [] };
  }
};
