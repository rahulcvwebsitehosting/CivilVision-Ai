
import React, { useState, memo, useCallback } from 'react';

type SettingsTab = 'MAIN' | 'APPEARANCE' | 'VOICE' | 'NOTIFICATIONS' | 'LANGUAGE';

interface SettingsSectionProps {
  onBack: () => void;
  settings: any;
  onUpdateSettings: (settings: any) => void;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ onBack, settings, onUpdateSettings }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('MAIN');

  const updateSetting = useCallback((key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    onUpdateSettings(newSettings);
  }, [settings, onUpdateSettings]);

  const updateNestedSetting = useCallback((category: string, key: string, value: any) => {
    const newSettings = { 
      ...settings, 
      [category]: { ...settings[category], [key]: value } 
    };
    onUpdateSettings(newSettings);
  }, [settings, onUpdateSettings]);

  const renderHeader = (title: string, onReturn = () => setActiveTab('MAIN')) => (
    <header className="shrink-0 p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 sticky top-0 z-50 backdrop-blur-md">
      <button onClick={onReturn} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
        <svg className="w-6 h-6 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <h2 className="text-xl font-black dark:text-white">{title}</h2>
    </header>
  );

  const renderLanguage = () => (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {renderHeader('Language Preference')}
      <div className="p-6 space-y-4">
        {[
          { id: 'English', label: 'English', icon: '🇺🇸' },
          { id: 'Hindi', label: 'Hindi (हिन्दी)', icon: '🇮🇳' },
          { id: 'Tamil', label: 'Tamil (தமிழ்)', icon: '🇮🇳' }
        ].map(lang => (
          <button 
            key={lang.id}
            onClick={() => updateSetting('language', lang.id)}
            className={`w-full flex items-center justify-between p-6 rounded-[32px] border transition-all ${settings.language === lang.id ? 'bg-white dark:bg-slate-800 border-amber-500 shadow-xl scale-[1.02]' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800'}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{lang.icon}</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{lang.label}</span>
            </div>
            {settings.language === lang.id && (
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderMain = () => (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <header className="shrink-0 px-6 py-12 bg-slate-900 text-white flex flex-col items-center relative overflow-hidden">
        <div className="w-28 h-28 rounded-[40px] bg-gradient-to-tr from-amber-500 to-amber-300 border-4 border-slate-800 shadow-2xl flex items-center justify-center text-slate-900 text-4xl font-black mb-4">
          {settings.name.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-2xl font-black">{settings.name}</h2>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Expert Settings</p>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <button onClick={() => setActiveTab('LANGUAGE')} className="w-full flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <span className="text-xl">🌐</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Language</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-500 font-bold">{settings.language || 'English'}</span>
              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
          
          <button onClick={() => setActiveTab('APPEARANCE')} className="w-full flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <span className="text-xl">🎨</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Appearance</span>
            </div>
            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>

          <button onClick={() => setActiveTab('VOICE')} className="w-full flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <span className="text-xl">🗣️</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">AI Personality</span>
            </div>
            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </main>
    </div>
  );

  switch (activeTab) {
    case 'LANGUAGE': return renderLanguage();
    case 'APPEARANCE': return <div className="flex-1">{renderHeader('Appearance')}</div>;
    case 'VOICE': return <div className="flex-1">{renderHeader('AI Personality')}</div>;
    default: return renderMain();
  }
};

export default SettingsSection;
