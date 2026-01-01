
import React from 'react';

const ProfileSection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      <header className="shrink-0 px-6 py-10 bg-slate-900 text-white flex flex-col items-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 border-4 border-slate-800 shadow-xl flex items-center justify-center text-slate-900 text-4xl font-black">
            JD
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full text-slate-900 shadow-lg border border-slate-200 hover:bg-amber-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
        <h2 className="text-xl font-bold">John Doe</h2>
        <p className="text-slate-400 text-sm">Civil Engineering Student</p>
        <div className="flex gap-4 mt-6">
          <div className="bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-700 text-center">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Analyses</p>
            <p className="font-bold text-amber-400">47</p>
          </div>
          <div className="bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-700 text-center">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Topics</p>
            <p className="font-bold text-amber-400">23</p>
          </div>
          <div className="bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-700 text-center">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Level</p>
            <p className="font-bold text-amber-400">8</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <section>
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Learning Progress</h3>
          <div className="space-y-4">
            {[
              { label: 'Fundamentals', progress: 80, color: 'bg-amber-500' },
              { label: 'Structural', progress: 60, color: 'bg-blue-500' },
              { label: 'Geotechnical', progress: 30, color: 'bg-emerald-500' }
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs font-bold mb-1.5 px-1">
                  <span className="text-slate-700">{item.label}</span>
                  <span className="text-slate-400">{item.progress}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} transition-all duration-1000`} style={{ width: `${item.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Saved & Favorites</h3>
            <button className="text-[10px] font-black uppercase text-amber-600">View All</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <p className="text-xs font-bold text-slate-800">IS 456 Clauses</p>
              <p className="text-[10px] text-slate-400">PDF Guide</p>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <p className="text-xs font-bold text-slate-800">RCC Beam Design</p>
              <p className="text-[10px] text-slate-400">Step-by-Step</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Settings</h3>
          <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden">
            {[
              { icon: '🔔', label: 'Notifications', value: 'On' },
              { icon: '🌐', label: 'Language', value: 'English' },
              { icon: '🎤', label: 'Voice Response', value: 'Friendly' },
              { icon: '🛡️', label: 'Privacy & Data', value: '' },
            ].map((item, i) => (
              <button key={i} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{item.value}</span>
                  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </button>
            ))}
          </div>
        </section>

        <button className="w-full py-4 text-red-500 font-bold text-sm uppercase tracking-widest hover:bg-red-50 rounded-2xl transition-all mb-10">
          Log Out
        </button>
      </main>
    </div>
  );
};

export default ProfileSection;
