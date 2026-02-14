'use client';

import React, { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Node, 
  Edge,
  ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';

interface VisualCanvasProps {
  nodes: Node[];
  edges: Edge[];
}

export const VisualCanvas = ({ nodes, edges }: VisualCanvasProps) => {
  return (
    <div className="w-full h-full bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};
