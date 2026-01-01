
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { generateEngineeringArticle } from '../services/geminiService';
import { LibraryFolder, SavedNote } from '../types';

interface Topic {
  id: string;
  title: string;
  content: string;
  formulas?: string[];
  related?: string[];
  isAdvanced?: boolean;
}

const Latex: React.FC<{ tex: string; display?: boolean }> = ({ tex, display = false }) => {
  const [html, setHtml] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const render = () => {
      if ((window as any).katex) {
        try {
          const cleanTex = display 
            ? tex.replace(/^\$\$|\$\$$/g, '').trim() 
            : tex.replace(/^\$|\$$/g, '').trim();
            
          const renderedHtml = (window as any).katex.renderToString(cleanTex, {
            throwOnError: false,
            displayMode: display,
            strict: false,
            trust: true
          });
          setHtml(renderedHtml);
        } catch (e: any) {
          console.error("KaTeX render error:", e);
          setHtml(null);
        }
      } else if (retryCount < 10) {
        setTimeout(() => setRetryCount(prev => prev + 1), 200);
      }
    };
    render();
  }, [tex, display, retryCount]);

  if (html) {
    return (
      <span 
        className={display 
          ? 'katex-display flex items-center justify-center py-6 px-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-[32px] my-6 overflow-x-auto border border-slate-200/50 dark:border-slate-700/50 shadow-inner' 
          : 'inline-block px-1 font-mono text-amber-600 dark:text-amber-400 font-bold'}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span className={display ? 'block py-8 text-center italic text-slate-400 font-mono bg-slate-50 dark:bg-slate-900/50 rounded-2xl my-4' : 'inline font-mono text-slate-500'}>
      {tex}
    </span>
  );
};

const AIGeneratingLoader: React.FC<{ topic: string }> = ({ topic }) => {
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef(Date.now());
  const steps = ["Analyzing topic", "Structuring content", "Generating formulas", "Writing examples", "Finalizing sections"];

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      setProgress(prev => {
        if (prev < 30) return prev + 1.2;
        if (prev < 70) return prev + 0.6;
        if (prev < 90) return prev + 0.2;
        if (prev < 98) return prev + 0.05;
        return prev;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const currentStepIndex = useMemo(() => {
    if (progress < 20) return 0;
    if (progress < 40) return 1;
    if (progress < 60) return 2;
    if (progress < 85) return 3;
    return 4;
  }, [progress]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-950 h-full overflow-hidden">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
        <header className="mb-10">
          <h2 className="text-3xl font-black dark:text-white uppercase tracking-tight mb-2">{topic}</h2>
          <span className="inline-block px-4 py-1.5 bg-amber-500 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">AI Expanded Note</span>
        </header>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="text-6xl mb-8 animate-bounce">🤖</div>
            <h3 className="text-xl font-black dark:text-white mb-8">Generating Content<span className="inline-block w-8 text-left ml-1">...</span></h3>
            <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full mb-3 overflow-hidden shadow-inner">
              <div className="h-full bg-amber-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-sm font-black text-amber-500 mb-8">{Math.round(progress)}%</span>
            <div className="flex flex-col gap-2 mb-10 w-full text-[10px] font-black uppercase tracking-widest text-slate-400">
              <div className="flex justify-between"><span>⏱️ Time elapsed</span><span className="text-slate-900 dark:text-white">{elapsedTime}s</span></div>
              <div className="flex justify-between"><span>📝 Estimated time</span><span>25-30s</span></div>
            </div>
            <div className="w-full space-y-4 text-left border-t border-slate-200 dark:border-slate-800 pt-8">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${index < currentStepIndex ? 'bg-emerald-500 text-white' : index === currentStepIndex ? 'bg-amber-500 text-slate-900 animate-spin' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                    {index < currentStepIndex ? '✓' : index === currentStepIndex ? '🔄' : '⏳'}
                  </div>
                  <span className={`text-sm font-bold ${index <= currentStepIndex ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ArticleRenderer = ({ content }: { content: string }) => {
  const sections = useMemo(() => {
    const blocks = content.split(/\n(?=#{1,4}\s|---)/g);
    return blocks.map((block, idx) => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return null;
      if (trimmedBlock.startsWith('---')) return <hr key={idx} className="my-12 border-slate-200 dark:border-slate-800" />;
      const headerMatch = trimmedBlock.match(/^(#{1,4})\s+(.*)\n?([\s\S]*)/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();
        const textContent = headerMatch[3].trim();
        const id = title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
        const processLine = (line: string, lKey: number) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return <div key={lKey} className="h-4"></div>;
          if (trimmedLine.startsWith('$$') && trimmedLine.endsWith('$$')) return <Latex key={lKey} tex={trimmedLine} display />;
          if (trimmedLine.startsWith('>')) return <blockquote key={lKey} className="my-8 p-8 bg-amber-500/10 border-l-8 border-amber-500 rounded-r-[40px] text-amber-900 dark:text-amber-200 font-bold shadow-sm italic text-lg">{renderInlineMath(trimmedLine.substring(1).trim())}</blockquote>;
          if (trimmedLine.startsWith('✅')) return <div key={lKey} className="my-10 p-10 bg-emerald-500/5 border-2 border-emerald-500/20 rounded-[48px] shadow-xl relative overflow-hidden group"><div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 -translate-y-1/2 translate-x-1/2 rounded-full blur-3xl"></div><div className="relative z-10"><span className="inline-block px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-6">✅ SOLVED EXAMPLE</span><div className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium text-base">{renderInlineMath(trimmedLine.substring(1).trim())}</div></div></div>;
          if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) return <div key={lKey} className="flex gap-4 mb-3 px-6 items-start group"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2.5 shrink-0"></div><div className="text-slate-700 dark:text-slate-300 font-medium text-base leading-relaxed">{renderInlineMath(trimmedLine.replace(/^[•\-*]\s*/, '').trim())}</div></div>;
          return <p key={lKey} className="mb-6 text-slate-700 dark:text-slate-300 leading-loose text-base font-medium text-justify">{renderInlineMath(line)}</p>;
        };
        const renderInlineMath = (txt: string) => {
          const parts = txt.split(/(\$[\s\S]*?\$)/g);
          return parts.map((part, pidx) => (part.startsWith('$') && !part.startsWith('$$')) ? <Latex key={pidx} tex={part} display={false} /> : <span key={pidx}>{part}</span>);
        };
        return (
          <section key={idx} id={id} className="mb-16 scroll-mt-24">
            {level === 1 && <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-10 tracking-tight leading-tight">{title}</h1>}
            {level === 2 && <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-4 group"><span className="w-2 h-10 bg-amber-500 rounded-full group-hover:h-12 transition-all"></span>{title}</h2>}
            {level === 3 && <h3 className="text-xl font-black text-slate-700 dark:text-slate-200 mb-6 border-l-4 border-slate-300 dark:border-slate-700 pl-4">{title}</h3>}
            {textContent.split('\n').map((line, lidx) => processLine(line, lidx))}
          </section>
        );
      }
      return <div key={idx} className="mb-6">{renderInlineText(block)}</div>;
    });
  }, [content]);

  const renderInlineText = (txt: string) => {
    const parts = txt.split(/(\$[\s\S]*?\$)/g);
    return parts.map((part, pidx) => (part.startsWith('$')) ? <Latex key={pidx} tex={part} display={false} /> : <span key={pidx}>{part}</span>);
  };
  return <div className="space-y-4">{sections}</div>;
};

const KNOWLEDGE_DATA = [
  { id: 'structural', name: 'Structural Engineering', icon: '🏗️', description: 'RCC Design, Steel Structures, and Analysis.', subcategories: [{ id: 'rcc', name: 'RCC Design (IS 456)', topics: [{ id: 'beam', title: 'Beam Flexural Design', content: 'Design of beams involves calculating the neutral axis, area of steel, and checking for shear and deflection.', formulas: ['M_u = 0.36 f_{ck} b x_u (d - 0.42 x_u)'], related: ['Shear Design', 'Limit State'] }] }] }
];

const KnowledgeSection: React.FC<{ onBack: () => void; onAskTeacher: (topic: string) => void }> = ({ onBack, onAskTeacher }) => {
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'LIBRARY'>('EXPLORE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<{title: string, content: string} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [viewingFolder, setViewingFolder] = useState<LibraryFolder | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cv-library');
    if (saved) setFolders(JSON.parse(saved));
  }, []);

  const saveToLibrary = (folderId: string) => {
    if (!selectedTopic) return;
    const note: SavedNote = { id: Math.random().toString(36).substr(2, 9), title: selectedTopic.title, content: selectedTopic.content, timestamp: Date.now() };
    const updatedFolders = folders.map(f => f.id === folderId ? { ...f, notes: [...f.notes, note], updatedAt: Date.now() } : f);
    setFolders(updatedFolders);
    localStorage.setItem('cv-library', JSON.stringify(updatedFolders));
    setShowSaveModal(false);
    setToast('Article saved to collection!');
    setTimeout(() => setToast(null), 3000);
  };

  const createAndSave = () => {
    if (!newFolderName.trim() || !selectedTopic) return;
    const newFolder: LibraryFolder = { id: Math.random().toString(36).substr(2, 9), name: newFolderName, notes: [], updatedAt: Date.now() };
    const note: SavedNote = { id: Math.random().toString(36).substr(2, 9), title: selectedTopic.title, content: selectedTopic.content, timestamp: Date.now() };
    newFolder.notes.push(note);
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    localStorage.setItem('cv-library', JSON.stringify(updatedFolders));
    setNewFolderName('');
    setShowSaveModal(false);
    setToast(`Saved to new collection: ${newFolder.name}`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAiGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateEngineeringArticle(searchQuery);
      setSelectedTopic({ title: searchQuery, content: res });
    } catch (e) {
      setSelectedTopic({ title: "Error", content: "Failed to generate article." });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderArticle = (topic: {title: string, content: string}) => (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden h-full">
      <header className="shrink-0 p-6 bg-slate-900 text-white flex items-center gap-4 z-30">
        <button onClick={() => { setSelectedTopic(null); setViewingFolder(null); }} className="p-3 bg-slate-800 rounded-2xl">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-black truncate">{topic.title}</h2>
          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-500 text-slate-900">Technical Masterclass</span>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto pb-32">
          <ArticleRenderer content={topic.content} />
          <div className="mt-24 p-12 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[56px] text-center">
            <h4 className="text-2xl font-black mb-4 dark:text-white">Professional Actions</h4>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => onAskTeacher(topic.title)} className="px-10 py-5 bg-amber-500 text-slate-900 font-black rounded-[28px] uppercase text-xs tracking-widest">Ask Teacher AI</button>
              <button onClick={() => setShowSaveModal(true)} className="px-10 py-5 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-[28px] uppercase text-xs tracking-widest border border-slate-700">💾 Save to Library</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden relative">
      {toast && <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-slate-900 text-amber-500 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl animate-in slide-in-from-top-full">{toast}</div>}

      {showSaveModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-[56px] p-10 animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black dark:text-white">Save to Collection</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-slate-400">✕</button>
            </div>
            
            {folders.length > 0 && (
              <div className="mb-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Existing Collections</p>
                <div className="grid grid-cols-2 gap-3">
                  {folders.map(f => (
                    <button key={f.id} onClick={() => saveToLibrary(f.id)} className="p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-amber-500 text-left transition-all">
                      <p className="font-bold dark:text-white truncate">{f.name}</p>
                      <p className="text-[10px] text-slate-400">{f.notes.length} items</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Create New Collection</p>
              <div className="flex gap-3">
                <input type="text" placeholder="Folder Name (e.g. Steel Design)" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 dark:text-white outline-none focus:border-amber-500 transition-all" />
                <button onClick={createAndSave} disabled={!newFolderName.trim()} className="px-8 bg-amber-500 text-slate-900 font-black rounded-2xl disabled:opacity-50">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isGenerating ? <AIGeneratingLoader topic={searchQuery} /> : selectedTopic ? renderArticle(selectedTopic) : viewingFolder ? (
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 h-full">
           <header className="shrink-0 p-8 bg-slate-900 text-white flex items-center gap-6 shadow-2xl">
            <button onClick={() => setViewingFolder(null)} className="p-3 bg-slate-800 rounded-2xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="w-16 h-16 bg-amber-500 rounded-[24px] flex items-center justify-center text-3xl shadow-lg border-2 border-slate-900">📂</div>
            <div>
              <h2 className="text-3xl font-black leading-tight tracking-tight">{viewingFolder.name}</h2>
              <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.3em] mt-1">{viewingFolder.notes.length} Saved Technical Papers</p>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-8 space-y-4">
            {viewingFolder.notes.map(note => (
              <button key={note.id} onClick={() => setSelectedTopic({ title: note.title, content: note.content })} className="w-full text-left p-10 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[48px] shadow-sm hover:border-amber-500 hover:shadow-2xl transition-all flex items-center justify-between group">
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-xl group-hover:text-amber-500 transition-colors">{note.title}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Saved {new Date(note.timestamp).toLocaleDateString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-amber-500 group-hover:text-slate-900 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden">
          <header className="shrink-0 p-8 bg-slate-900 text-white flex flex-col items-center">
            <h2 className="text-4xl font-black mb-6">Library</h2>
            <div className="flex bg-slate-800/80 p-1.5 rounded-full border border-slate-700 w-full max-w-sm">
              <button onClick={() => setActiveTab('EXPLORE')} className={`flex-1 py-3 px-6 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'EXPLORE' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>Discover</button>
              <button onClick={() => setActiveTab('LIBRARY')} className={`flex-1 py-3 px-6 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'LIBRARY' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>My Collection</button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-8">
            {activeTab === 'EXPLORE' ? (
              <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
                <div className="w-full relative mt-4 mb-12 group">
                  <input type="text" placeholder="Search codes, standards, or formulas..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-[32px] py-7 pl-20 pr-10 dark:text-white font-black outline-none focus:border-amber-500 transition-all shadow-xl" />
                  <svg className="w-10 h-10 absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                {searchQuery.length > 2 ? (
                  <button onClick={handleAiGenerate} className="w-full p-12 bg-white dark:bg-slate-900 rounded-[56px] border-2 border-slate-200 dark:border-slate-800 shadow-xl hover:border-amber-500 group transition-all">
                    <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">✨</div>
                    <h3 className="text-3xl font-black mb-4 dark:text-white">Synthesize Technical Paper</h3>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Generate a 4000+ word expert masterclass on "{searchQuery}"</p>
                  </button>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    {KNOWLEDGE_DATA.map(cat => (
                      <button key={cat.id} className="p-10 bg-white dark:bg-slate-900 rounded-[48px] border-2 border-slate-100 dark:border-slate-800 shadow-sm hover:border-amber-500 transition-all text-left group">
                        <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">{cat.icon}</div>
                        <h4 className="text-xl font-black dark:text-white group-hover:text-amber-500">{cat.name}</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase mt-4 tracking-widest">{cat.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-6xl mx-auto">
                {folders.length === 0 ? (
                  <div className="text-center py-32">
                    <div className="text-8xl mb-8">🗄️</div>
                    <h3 className="text-4xl font-black mb-4 dark:text-white">Empty Archive</h3>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Start searching and saving expert content to build your private library.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {folders.map(folder => (
                      <button key={folder.id} onClick={() => setViewingFolder(folder)} className="bg-white dark:bg-slate-900 p-12 rounded-[56px] border-2 border-slate-100 dark:border-slate-800 shadow-xl hover:border-amber-500 hover:scale-[1.02] transition-all text-left relative group">
                        <div className="w-20 h-20 bg-amber-500/10 rounded-[28px] flex items-center justify-center text-4xl mb-8 border-2 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-900 transition-all">📂</div>
                        <h4 className="text-2xl font-black dark:text-white mb-2">{folder.name}</h4>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{folder.notes.length} TECHNICAL PAPERS</p>
                        <p className="text-[9px] text-slate-400 mt-6 uppercase font-bold tracking-tighter">Modified: {new Date(folder.updatedAt).toLocaleDateString()}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeSection;
