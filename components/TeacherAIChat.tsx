
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

    const topicMap: Record<string, string[]> = {
      "Beam Flexural Design": ["Calculate Moment Capacity", "Neutral Axis vs Critical Axis", "Under-reinforced vs Over-reinforced", "IS 456 Shear Checks"],
      "Slab Systems": ["One-way vs Two-way Distribution", "Slab Deflection Limits", "Steel Reinforcement Pattern", "Slab Load Calculations"],
      "Concrete Mix": ["Water-Cement Ratio Effect", "M25 vs M30 Concrete", "Target Mean Strength", "Slump Test Procedures"]
    };

    const match = Object.keys(topicMap).find(key => activeTopic.toLowerCase().includes(key.toLowerCase()));
    if (match) return topicMap[match];
    
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
      if (onOpen) onOpen();
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

  // Helper to format text with simple markdown support
  const formatResponse = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bold handling
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return <li key={i} className="ml-4 mb-1 list-disc" dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[•\-]\s*/, '') }} />;
      }
      return <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && activeTopic === null) setActiveTopic(null);
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
            <header className="p-6 bg-slate-800 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl shadow-lg border-2 border-slate-900">🎓</div>
                <div>
                  <h3 className="font-black text-white text-sm">Structural Mentor</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Office Hours: Live</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeTopic && (
                <div className="flex justify-center">
                   <div className="px-3 py-1 bg-slate-800/80 rounded-full border border-amber-500/30 flex items-center gap-2">
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Focusing on:</span>
                      <span className="text-[10px] font-bold text-slate-100">{activeTopic}</span>
                      <button onClick={() => setActiveTopic(null)} className="text-slate-500 hover:text-white ml-1 text-xs">✕</button>
                   </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-[24px] text-sm leading-relaxed shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-amber-500 text-slate-900 font-bold rounded-tr-none' 
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                  }`}>
                    {m.role === 'model' ? formatResponse(m.text) : m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 p-4 rounded-[24px] rounded-tl-none flex gap-1.5 animate-pulse border border-slate-700">
                    {[0, 1, 2].map(j => <div key={j} className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>)}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-slate-800/40 border-t border-slate-700/50">
              {/* Recommendation tags as horizontal scroll list */}
              <div className="flex overflow-x-auto pb-4 gap-2 scrollbar-hide no-scrollbar -mx-2 px-2 scroll-smooth">
                {dynamicTags.map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => handleSubmit(undefined, tag)}
                    className="flex-shrink-0 px-4 py-2 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-black text-slate-400 hover:text-amber-500 hover:border-amber-500 hover:bg-slate-700 transition-all uppercase tracking-widest whitespace-nowrap"
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
                  placeholder={activeTopic ? `Ask about ${activeTopic}...` : "Ask Teacher AI..."}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-6 pr-14 text-white text-sm outline-none focus:ring-4 focus:ring-amber-500/20 shadow-xl transition-all"
                />
                <button 
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  className="absolute right-2 top-2 p-2.5 bg-amber-500 text-slate-900 rounded-xl disabled:opacity-30 disabled:grayscale shadow-lg active:scale-95 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default TeacherAIChat;
