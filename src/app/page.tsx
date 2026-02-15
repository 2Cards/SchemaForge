'use client';

import React, { useState, useEffect, useRef } from 'react';
import { VisualCanvas } from '@/components/editor/VisualCanvas';
import { storage, Schema } from '@/lib/storage';
import { parseDBML } from '@/lib/dbml-parser';
import { useNodesState, useEdgesState } from 'reactflow';
import Editor from 'react-simple-code-editor';
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-sql';

import { 
  Loader2, Save, Download, Database, Trash2, 
  Code, Sparkles, AlertCircle, PanelLeftClose, PanelLeftOpen, PencilLine, FilePlus
} from 'lucide-react';

const dbmlHighlight = (code: string) => {
  return highlight(code, {
    ...languages.sql,
    'keyword': /\b(Table|Ref|Enum|indexes|Project|Note|as|pk|unique|not null|increment)\b/i,
    'string': /(['"])(?:(?!\1)[^\\\r\n]|\\.)*\1/,
    'comment': /\/\/.*|(?:\/\*[\s\S]*?\*\/)/,
    'class-name': /\b[A-Z_][a-z0-9_]*\b/,
  }, 'dbml');
};

export default function Home() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [currentSchema, setCurrentSchema] = useState<Schema | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dbmlInput, setDbmlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [schemaName, setSchemaName] = useState('');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const saved = storage.getSchemas();
    setSchemas(saved);
    if (saved.length > 0) {
      setCurrentSchema(saved[0]);
      setDbmlInput(saved[0].dbml);
      setSchemaName(saved[0].name);
    }
  }, []);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = parseDBML(dbmlInput);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [dbmlInput, setNodes, setEdges]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!currentSchema) return;
    const hasChanges = dbmlInput !== currentSchema.dbml || schemaName !== currentSchema.name;
    if (!hasChanges) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    setIsSaving(true);
    timerRef.current = setTimeout(() => {
      const updatedSchema = { ...currentSchema, name: schemaName, dbml: dbmlInput, updatedAt: Date.now() };
      storage.saveSchema(updatedSchema);
      setSchemas(storage.getSchemas());
      setCurrentSchema(updatedSchema);
      setIsSaving(false);
    }, 1000); // 1s debounce

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [dbmlInput, schemaName, currentSchema]);

  const handleNewSchema = () => {
    const newSchema: Schema = {
      id: Date.now().toString(),
      name: 'Untitled Sketch',
      dbml: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    storage.saveSchema(newSchema);
    const updated = storage.getSchemas();
    setSchemas(updated);
    setCurrentSchema(newSchema);
    setDbmlInput('');
    setSchemaName(newSchema.name);
    setUserInput('');
  };

  const handleGenerate = async () => {
    if (!userInput) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt: userInput }),
      });
      const data = await res.json();
      if (res.ok && data.dbml) {
        const cleanDbml = data.dbml.replace(/```dbml|```/g, '').trim();
        setDbmlInput(cleanDbml);
        if (currentSchema && !currentSchema.dbml) {
           const updated = { ...currentSchema, dbml: cleanDbml, updatedAt: Date.now() };
           storage.saveSchema(updated);
           setCurrentSchema(updated);
           setSchemas(storage.getSchemas());
        } else {
          const newSchema: Schema = {
            id: Date.now().toString(),
            name: 'AI Draft ' + new Date().toLocaleTimeString(),
            dbml: cleanDbml,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setCurrentSchema(newSchema);
          setSchemaName(newSchema.name);
          storage.saveSchema(newSchema);
          setSchemas(storage.getSchemas());
        }
      } else {
        setError(data.error || 'AI limit reached. Try again.');
      }
    } catch (err) {
      setError('Connection refused.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this design?')) {
      storage.deleteSchema(id);
      const updated = storage.getSchemas();
      setSchemas(updated);
      if (currentSchema?.id === id) {
        if (updated.length > 0) {
          setCurrentSchema(updated[0]);
          setDbmlInput(updated[0].dbml);
          setSchemaName(updated[0].name);
        } else {
          setCurrentSchema(null);
          setDbmlInput('');
          setSchemaName('');
        }
      }
    }
  };

  const handleDownload = () => {
    if (!dbmlInput) return;
    const blob = new Blob([dbmlInput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schemaName || 'schema'}.dbml`;
    a.click();
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#fdfdfd] text-slate-900 font-handwritten antialiased selection:bg-indigo-100">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-0'} border-r-2 border-slate-900 bg-[#f8f9fa] transition-all duration-300 flex flex-col overflow-hidden shrink-0`}>
        <div className="p-5 border-b-2 border-slate-900 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <PencilLine size={20} className="text-slate-900" />
            <span className="font-bold text-lg tracking-tight text-slate-900">SchemaForge</span>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto p-3 space-y-4">
          <button 
            onClick={handleNewSchema}
            className="w-full py-2 px-4 border-2 border-dashed border-slate-300 hover:border-slate-900 hover:bg-white rounded-xl text-xs font-bold text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center gap-2 mb-2"
          >
            <FilePlus size={14} /> New Sketch
          </button>
          <div className="px-2 pt-2">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Saved Sketches</h2>
            <div className="space-y-2">
              {schemas.map((s) => (
                <div key={s.id} 
                  className={`group p-3 rounded-lg border-2 transition-all flex justify-between items-center ${currentSchema?.id === s.id ? 'bg-indigo-50 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white border-slate-200 hover:border-slate-400'}`}
                  onClick={() => { setCurrentSchema(s); setDbmlInput(s.dbml); setSchemaName(s.name); }}
                >
                  <span className="text-xs font-bold truncate pr-2">{s.name}</span>
                  <Trash2 size={14} className="opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all cursor-pointer" 
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-grow flex flex-col min-w-0">
        <nav className="h-14 border-b-2 border-slate-900 bg-white flex items-center justify-between px-4 z-20 shrink-0 shadow-sm">
          <div className="flex items-center gap-4 flex-grow max-w-xl">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-900 border border-slate-200">
              {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <input 
              value={schemaName}
              onChange={(e) => setSchemaName(e.target.value)}
              placeholder="Untitled Sketch"
              className="flex-grow text-sm font-bold border-2 border-slate-900 px-3 py-1 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none focus:bg-indigo-50/50 transition-colors"
            />
            {isSaving && <span className="text-[10px] text-slate-400 animate-pulse shrink-0">Saving...</span>}
          </div>
          <div className="flex items-center gap-3 font-sans ml-4">
            <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
              <Download size={14} /> Export DBML
            </button>
          </div>
        </nav>

        <div className="flex-grow flex overflow-hidden bg-white">
          <div className="w-1/3 min-w-[400px] border-r-2 border-slate-900 flex flex-col bg-[#fcfcfc] z-10">
            <div className="flex-grow flex flex-col p-4 space-y-4">
              <div className="relative">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask AI to design or update..."
                  className="w-full h-24 p-4 text-sm bg-white border-2 border-slate-900 rounded-xl focus:ring-0 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300 resize-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]"
                />
                <button onClick={handleGenerate} disabled={isLoading || !userInput} className="absolute bottom-3 right-3 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all disabled:opacity-30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {isLoading ? <Loader2 className="animate-spin text-white" size={16} /> : <Sparkles className="text-white" size={16} />}
                </button>
              </div>

              <div className="flex-grow flex flex-col min-h-0">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                  <Code size={12} />
                  <span>DBML Blueprint</span>
                </div>
                <div className="flex-grow overflow-auto bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                  <Editor
                    value={dbmlInput}
                    onValueChange={code => setDbmlInput(code)}
                    highlight={code => dbmlHighlight(code)}
                    padding={20}
                    style={{
                      fontFamily: '"Geist Mono", monospace',
                      fontSize: 13,
                      minHeight: '100%',
                      outline: 'none',
                      color: '#1e293b'
                    }}
                    className="dbml-editor"
                  />
                </div>
              </div>
              {error && <div className="p-3 bg-red-50 border-2 border-red-900 rounded-xl flex items-center gap-2 text-red-900 text-[11px]"><AlertCircle size={14} /><span>{error}</span></div>}
            </div>
          </div>

          <div className="flex-grow relative overflow-hidden bg-[#fdfdfd]">
            <VisualCanvas nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />
            {!dbmlInput && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-4 text-slate-300">
                  <Database size={60} className="opacity-10 text-slate-900" />
                  <p className="text-sm font-bold tracking-widest opacity-20 uppercase">Empty Canvas</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
