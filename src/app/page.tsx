'use client';

import React, { useState, useEffect } from 'react';
import { VisualCanvas } from '@/components/editor/VisualCanvas';
import { storage, Schema } from '@/lib/storage';
import { parseDBML } from '@/lib/dbml-parser';
import { 
  Loader2, Plus, Save, Download, Database, Trash2, 
  Code, Eye, Sparkles, AlertCircle 
} from 'lucide-react';

export default function Home() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [currentSchema, setCurrentSchema] = useState<Schema | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dbmlInput, setDbmlInput] = useState('');
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSchemas(storage.getSchemas());
  }, []);

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
        // Clean up markdown markers if present
        const cleanDbml = data.dbml.replace(/```dbml|```/g, '').trim();
        setDbmlInput(cleanDbml);
        const newSchema: Schema = {
          id: Date.now().toString(),
          name: 'New AI Schema',
          dbml: cleanDbml,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setCurrentSchema(newSchema);
        setViewMode('visual');
      } else {
        setError(data.error || 'Failed to generate schema');
      }
    } catch (err) {
      setError('Connection error. Check your API key and network.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!dbmlInput) return;
    const name = window.prompt('Schema Name', currentSchema?.name || 'My Schema') || 'Untitled';
    const schemaToSave: Schema = {
      id: currentSchema?.id || Date.now().toString(),
      name,
      dbml: dbmlInput,
      createdAt: currentSchema?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    storage.saveSchema(schemaToSave);
    setSchemas(storage.getSchemas());
    setCurrentSchema(schemaToSave);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this schema?')) {
      storage.deleteSchema(id);
      setSchemas(storage.getSchemas());
      if (currentSchema?.id === id) {
        setCurrentSchema(null);
        setDbmlInput('');
      }
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
    <main className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-200 font-sans">
      {/* Left Sidebar */}
      <div className="w-80 h-full border-r border-slate-800 bg-slate-900 flex flex-col overflow-hidden">
        <div className="p-6 flex items-center gap-2 border-b border-slate-800">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Database size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">SchemaForge</span>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-6">
          {/* AI Generator Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
              <Sparkles size={12} />
              <span>AI Architect</span>
            </div>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Describe your database (e.g. A blog system with users, posts and comments)..."
              className="w-full h-32 p-3 text-xs bg-slate-800 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600 resize-none"
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading || !userInput}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
            >
              {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
              Generate with AI
            </button>
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start gap-2 text-red-400 text-[10px]">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* History Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest px-1 pt-4 border-t border-slate-800">
              <span>Saved Schemas</span>
            </div>
            <div className="space-y-1">
              {schemas.length === 0 && (
                <p className="text-[10px] text-slate-600 italic px-1">No saved schemas yet.</p>
              )}
              {schemas.map((s) => (
                <div 
                  key={s.id} 
                  className={`group p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                    currentSchema?.id === s.id 
                    ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                  }`}
                  onClick={() => {
                    setCurrentSchema(s);
                    setDbmlInput(s.dbml);
                  }}
                >
                  <span className="text-xs font-medium truncate pr-2">{s.name}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                    className="p-1 hover:bg-red-500/20 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} className="text-slate-500 group-hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col bg-slate-950 relative">
        {/* Header / Toolbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('visual')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === 'visual' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Eye size={14} />
                Canvas
              </button>
              <button 
                onClick={() => setViewMode('code')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === 'code' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Code size={14} />
                DBML Editor
              </button>
            </div>
            <div className="h-4 w-px bg-slate-700 mx-2" />
            <span className="text-sm font-medium text-slate-400">
              {currentSchema?.name || 'Unnamed Project'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!dbmlInput}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700"
            >
              <Save size={14} />
              Save
            </button>
            <button
              onClick={handleDownload}
              disabled={!dbmlInput}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
            >
              <Download size={14} />
              Export .dbml
            </button>
          </div>
        </header>

        {/* Editor Content */}
        <div className="flex-grow relative">
          {viewMode === 'visual' ? (
            dbmlInput ? (
              <VisualCanvas nodes={nodes} edges={edges} />
            ) : (
              <div className="w-full h-full flex items-center justify-center flex-col gap-4 text-slate-600">
                <div className="p-6 rounded-full bg-slate-900/50 border border-slate-800/50">
                  <Database size={40} className="opacity-20 text-blue-500" />
                </div>
                <p className="text-sm font-medium">No schema detected. Use AI or paste DBML code.</p>
              </div>
            )
          ) : (
            <textarea
              value={dbmlInput}
              onChange={(e) => setDbmlInput(e.target.value)}
              placeholder="Paste your DBML here or edit generated code..."
              className="w-full h-full p-8 bg-slate-950 text-blue-400 font-mono text-sm outline-none resize-none selection:bg-blue-500/30"
              spellCheck={false}
            />
          )}
        </div>
      </div>
    </main>
  );
}
