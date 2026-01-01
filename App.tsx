
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AppState } from './types';
import AnalysisDashboard from './components/AnalysisDashboard';
import KnowledgeSection from './components/KnowledgeSection';
import SettingsSection from './components/SettingsSection';
import TeacherAIChat from './components/TeacherAIChat';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [teacherAiInitialTopic, setTeacherAiInitialTopic] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('cv-settings');
    return saved ? JSON.parse(saved) : {
      name: 'User',
      theme: 'auto',
      language: 'English',
      ai_voice: {
        gender: 'Female',
        personality: 'Friendly',
        speed: 1.0,
      },
      notifications: { master: true }
    };
  });

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') root.classList.add('dark');
    else if (settings.theme === 'light') root.classList.remove('dark');
    else root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    localStorage.setItem('cv-settings', JSON.stringify(settings));
  }, [settings]);

  const updateGlobalSettings = useCallback((newSettings: any) => {
    setSettings(newSettings);
  }, []);

  const toggleLanguage = () => {
    const langs = ['English', 'Hindi', 'Tamil'];
    const nextIdx = (langs.indexOf(settings.language) + 1) % langs.length;
    updateGlobalSettings({ ...settings, language: langs[nextIdx] });
  };

  const processFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const promises = Array.from(files).map((file: File) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve((ev.target?.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(promises).then(images => {
      setUploadedImages(images);
      setAppState(AppState.STATIC_ANALYSIS);
    });
  }, []);

  const handleAskTeacher = (topic: string) => {
    setTeacherAiInitialTopic(topic);
  };

  const renderHome = () => (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden">
      <header className="px-6 pt-12 pb-8 bg-slate-900 text-white border-b border-slate-800 relative shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 rounded-2xl shadow-lg">
              <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h1 className="text-2xl font-black">CivilVision <span className="text-amber-500">AI</span></h1>
          </div>
          <button 
            onClick={toggleLanguage}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-amber-500"
          >
            {settings.language}
          </button>
        </div>
        <p className="text-slate-400 text-sm font-medium leading-tight">Professional Structural Recognition & Expert Analysis.</p>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <button 
          onClick={() => setAppState(AppState.LIVE_ANALYSIS)}
          className="w-full bg-slate-900 text-white rounded-[40px] p-8 flex items-center gap-6 shadow-xl border border-slate-700 active:scale-95 transition-all"
        >
          <div className="p-4 bg-amber-500 rounded-2xl shadow-lg">
            <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold">Start Live Scan</h2>
            <p className="text-slate-400 text-xs">Real-time defect detection</p>
          </div>
        </button>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-10 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[40px] flex flex-col items-center gap-4 text-center cursor-pointer hover:border-amber-500 transition-all"
        >
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 text-3xl">📁</div>
          <h2 className="text-lg font-bold dark:text-white">Static Analysis</h2>
          <p className="text-slate-500 text-xs">Upload structure photos for review</p>
        </div>
        <input type="file" ref={fileInputRef} onChange={(e) => processFiles(e.target.files)} multiple accept="image/*" className="hidden" />
      </main>

      {renderBottomNav()}
    </div>
  );

  function renderBottomNav() {
    return (
      <nav className="shrink-0 h-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around z-50">
        <button onClick={() => setAppState(AppState.HOME)} className={`flex flex-col items-center gap-1 ${appState === AppState.HOME ? 'text-amber-500' : 'text-slate-400'}`}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
          <span className="text-[9px] font-bold uppercase">Home</span>
        </button>
        <button onClick={() => setAppState(AppState.KNOWLEDGE)} className={`flex flex-col items-center gap-1 ${appState === AppState.KNOWLEDGE ? 'text-amber-500' : 'text-slate-400'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          <span className="text-[9px] font-bold uppercase">Library</span>
        </button>
        <button onClick={() => setAppState(AppState.SETTINGS)} className={`flex flex-col items-center gap-1 ${appState === AppState.SETTINGS ? 'text-amber-500' : 'text-slate-400'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
          <span className="text-[9px] font-bold uppercase">Setup</span>
        </button>
      </nav>
    );
  }

  const content = (() => {
    switch (appState) {
      case AppState.LIVE_ANALYSIS: return <AnalysisDashboard onBack={() => setAppState(AppState.HOME)} />;
      case AppState.STATIC_ANALYSIS: return <AnalysisDashboard onBack={() => setAppState(AppState.HOME)} initialImages={uploadedImages} />;
      case AppState.KNOWLEDGE: return <div className="h-screen flex flex-col"><KnowledgeSection onBack={() => setAppState(AppState.HOME)} onAskTeacher={handleAskTeacher} />{renderBottomNav()}</div>;
      case AppState.SETTINGS: return <div className="h-screen flex flex-col"><SettingsSection onBack={() => setAppState(AppState.HOME)} settings={settings} onUpdateSettings={updateGlobalSettings} />{renderBottomNav()}</div>;
      default: return renderHome();
    }
  })();

  return <>{content}<TeacherAIChat initialTopic={teacherAiInitialTopic} onOpen={() => setTeacherAiInitialTopic(null)} /></>;
};

export default App;
