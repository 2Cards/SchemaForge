'use client';

import React, { useState, useEffect } from 'react';
import { VisualCanvas } from '@/components/editor/VisualCanvas';
import { storage, Schema } from '@/lib/storage';
import { parseDBML } from '@/lib/dbml-parser';
import { Loader2, Plus, Save, Download, Database, Trash2 } from 'lucide-react';

export default function Home() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [currentSchema, setCurrentSchema] = useState<Schema | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dbmlInput, setDbmlInput] = useState('');

  useEffect(() => {
    setSchemas(storage.getSchemas());
  }, []);

  const handleGenerate = async () => {
    if (!userInput) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt: userInput }),
      });
      const data = await res.json();
      if (data.dbml) {
        setDbmlInput(data.dbml);
        const newSchema: Schema = {
          id: Date.now().toString(),
          name: 'AI Generated Schema',
          dbml: data.dbml,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setCurrentSchema(newSchema);
      }
    } catch (error) {
      alert('Generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!currentSchema) return;
    const name = window.prompt('Schema Name', currentSchema.name) || 'Untitled';
    const schemaToSave = { ...currentSchema, name, dbml: dbmlInput };
    storage.saveSchema(schemaToSave);
    setSchemas(storage.getSchemas());
    setCurrentSchema(schemaToSave);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this schema?')) {
      storage.deleteSchema(id);
      setSchemas(storage.getSchemas());
      if (currentSchema?.id === id) setCurrentSchema(null);
    }
  };

  const handleDownload = () => {
    if (!dbmlInput) return;
    const blob = new Blob([dbmlInput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSchema?.name || 'schema'}.dbml`;
    a.click();
  };

  const { nodes, edges } = parseDBML(dbmlInput || '');

  return (
    <main className="flex h-screen w-screen overflow-hidden text-gray-900">
      {/* Sidebar */}
      <div className="w-80 h-full border-r bg-white p-4 flex flex-col gap-6 overflow-y-auto">
        <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <Database size={24} />
          <span>SchemaForge</span>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase text-gray-500">AI Architect</h2>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Describe your database..."
            className="w-full h-32 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading || !userInput}
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            Generate Schema
          </button>
        </div>

        <div className="flex flex-col gap-2 flex-grow">
          <h2 className="text-xs font-semibold uppercase text-gray-500">Your Schemas (LocalStorage)</h2>
          {schemas.map((s) => (
            <div 
              key={s.id} 
              className={`group p-3 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors flex justify-between items-center ${currentSchema?.id === s.id ? 'border-blue-600 bg-blue-50' : ''}`}
              onClick={() => {
                setCurrentSchema(s);
                setDbmlInput(s.dbml);
              }}
            >
              <span className="text-sm font-medium truncate">{s.name}</span>
              <Trash2 
                size={14} 
                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(s.id);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-grow flex flex-col">
        {/* Toolbar */}
        <div className="h-14 border-b bg-white flex items-center justify-between px-6">
          <div className="text-sm font-medium">
            {currentSchema ? currentSchema.name : 'Select or generate a schema'}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!dbmlInput}
              className="px-4 py-1.5 border rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} />
              Save
            </button>
            <button
              onClick={handleDownload}
              disabled={!dbmlInput}
              className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50"
            >
              <Download size={16} />
              Export DBML
            </button>
          </div>
        </div>

        {/* Canvas / Editor */}
        <div className="flex-grow relative">
          {dbmlInput ? (
            <VisualCanvas nodes={nodes} edges={edges} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 flex-col gap-4">
              <Database size={48} className="opacity-20" />
              <p>Nothing to visualize. Start with AI prompt on the left.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
