
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getTeacherAIResponse } from '../services/geminiService';

interface TeacherAIChatProps {
  initialTopic?: string | null;
  onOpen?: () => void;
}

const TeacherAIChat: React.FC<TeacherAIChatProps> = ({ initialTopic, onOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'model', text: string }>>([
    { role: 'model', text: "🎓 Welcome to the Office Hours. I'm Teacher AI. Ask me about specific formulas, IS code clauses, or conceptual engineering challenges." }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Default recommendation tags
  const defaultTags = ["Explain One-way Slab", "IS 456 Design Steps", "Shear Reinforcement", "M25 Mix Proportion"];

  // Generate dynamic tags based on the active topic
  const dynamicTags = useMemo(() => {
    if (!activeTopic) return defaultTags;

    // Mapping of common engineering topics to specific teacher questions
    const topicMap: Record<string, string[]> = {
      "Beam Flexural Design": ["Calculate Moment Capacity", "Neutral Axis vs Critical Axis", "Under-reinforced vs Over-reinforced", "IS 456 Shear Checks"],
      "Slab Systems": ["One-way vs Two-way Distribution", "Slab Deflection Limits", "Steel Reinforcement Pattern", "Slab Load Calculations"],
      "Concrete Mix": ["Water-Cement Ratio Effect", "M25 vs M30 Concrete", "Target Mean Strength", "Slump Test Procedures"]
    };

    // Find closest match or generate generic specific questions
    const match = Object.keys(topicMap).find(key => activeTopic.toLowerCase().includes(key.toLowerCase()));
    
    if (match) return topicMap[match];
    
    // Generic fallback for any other topic
    return [
      `Derive ${activeTopic} Formulas`,
      `Design Steps for ${activeTopic}`,
      `Common Errors in ${activeTopic}`,
      `Real-world Case Study`
    ];
  }, [activeTopic]);

  useEffect(() => {
    if (initialTopic) {
      setIsOpen(true);
      setActiveTopic(initialTopic);
      if (onOpen) onOpen(); // Signal back to App that we've processed it
    }
  }, [initialTopic, onOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    e?.preventDefault();
    const finalQuery = customQuery || query;
    if (!finalQuery.trim() || isLoading) return;

    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: finalQuery }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, parts: [m.text] }));
      const response = await getTeacherAIResponse(finalQuery, history);
      setMessages(prev => [...prev, { role: 'model', text: response || "My internal repository is currently refreshing. Please try again." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Error: Teacher AI mentor service unavailable." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && activeTopic === null) setActiveTopic(null); // Reset to default tags if opening manually
        }}
        className="fixed bottom-24 right-6 w-16 h-16 bg-amber-500 rounded-full shadow-[0_20px_50px_rgba(245,158,11,0.3)] flex items-center justify-center z-[100] hover:scale-110 active:scale-90 transition-all border-4 border-slate-900 group"
      >
        <span className="text-2xl group-hover:rotate-12 transition-transform">🎓</span>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full border-2 border-slate-900 animate-pulse flex items-center justify-center">
           <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </button>

      {/* Chat Interface Bottom Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex flex-col justify-end bg-slate-950/60 backdrop-blur-md transition-all p-4">
          <div className="w-full max-w-2xl mx-auto bg-slate-900 rounded-[48px] shadow-2xl flex flex-col h-[75vh] border border-slate-800 overflow-hidden animate-in slide-in-from-bottom-full duration-500 ease-out">
            <header className="p-8 bg-slate-800 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg border-2 border-slate-900">🎓</div>
                <div>
                  <h3 className="font-black text-white text-base">Structural Mentor</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Office Hours: Live</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-slate-700 rounded-2xl text-slate-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {activeTopic && (
                <div className="flex justify-center mb-4">
                   <div className="px-4 py-2 bg-slate-800/50 rounded-full border border-amber-500/30 flex items-center gap-2">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Active Focus:</span>
                      <span className="text-[10px] font-bold text-slate-100">{activeTopic}</span>
                      <button onClick={() => setActiveTopic(null)} className="text-slate-500 hover:text-white ml-1">✕</button>
                   </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-5 rounded-[32px] text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-amber-500 text-slate-900 font-bold rounded-tr-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 p-5 rounded-[32px] rounded-tl-none flex gap-1.5 animate-pulse border border-slate-700">
                    {[0, 1, 2].map(j => <div key={j} className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>)}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-8 bg-slate-800/40 border-t border-slate-700/50">
              <div className="flex flex-wrap gap-2 mb-6">
                {dynamicTags.map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => handleSubmit(undefined, tag)}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-2xl text-[10px] font-black text-slate-400 hover:text-amber-500 hover:border-amber-500 hover:bg-slate-700 transition-all uppercase tracking-widest"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="relative group">
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={activeTopic ? `Ask about ${activeTopic}...` : "Ask Teacher AI about civil concepts..."}
                  className="w-full bg-slate-900 border border-slate-700 rounded-3xl py-5 pl-8 pr-16 text-white text-sm outline-none focus:ring-4 focus:ring-amber-500/20 shadow-xl transition-all"
                />
                <button 
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  className="absolute right-3 top-3 p-3 bg-amber-500 text-slate-900 rounded-2xl disabled:opacity-30 disabled:grayscale shadow-lg active:scale-95 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherAIChat;
