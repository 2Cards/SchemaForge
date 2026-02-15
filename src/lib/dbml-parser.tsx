import { Parser } from '@dbml/core';
import { Node, Edge } from 'reactflow';

export const parseDBML = (dbml: string, existingNodes: Node[] = []) => {
  if (!dbml || typeof dbml !== 'string') return { nodes: [], edges: [] };
  
  try {
    const database = Parser.parse(dbml, 'dbml');
    if (!database || !database.schemas || database.schemas.length === 0) {
      return { nodes: [], edges: [] };
    }

    const schema = database.schemas[0];
    const tables = schema.tables || [];
    const refs = schema.refs || [];

    const nodes: Node[] = tables.map((table: any, index: number) => {
      const existingNode = existingNodes.find(n => n.id === table.name);
      
      return {
        id: table.name,
        type: 'dbTable',
        data: { 
          name: table.name,
          fields: table.fields.map((f: any) => ({
            name: f.name,
            type: f.type.type_name,
            pk: f.pk,
          }))
        },
        // Use existing position or generate grid
        position: existingNode?.position || { 
          x: (index % 3) * 350, 
          y: Math.floor(index / 3) * (table.fields.length * 30 + 100) 
        },
      };
    });

    const edges: Edge[] = refs.map((ref: any, index: number) => {
      // For simplicity, we connect the first field of the ref
      const targetEndpoint = ref.endpoints[0];
      const sourceEndpoint = ref.endpoints[1];
      
      const sourceFieldName = sourceEndpoint.fieldNames[0];
      const targetFieldName = targetEndpoint.fieldNames[0];

      return {
        id: `ref-${index}`,
        source: sourceEndpoint.tableName,
        sourceHandle: `${sourceFieldName}-source`,
        target: targetEndpoint.tableName,
        targetHandle: `${targetFieldName}-target`,
        type: 'smoothstep',
        style: { stroke: '#1e293b', strokeWidth: 3 },
      };
    });

    return { nodes, edges };
  } catch (error) {
    return { nodes: [], edges: [] };
  }
};
