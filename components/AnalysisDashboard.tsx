
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, UserMode, DefectSeverity } from '../types';
import CameraView from './CameraView';
import { createCivilVisionSession, decode, decodeAudioData, encode, getSystemInstruction } from '../services/geminiService';
import { LiveServerMessage } from '@google/genai';

interface AnalysisDashboardProps {
  onBack: () => void;
  initialImages?: string[]; 
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ onBack, initialImages = [] }) => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isStatic] = useState(initialImages.length > 0);
  const [manualInput, setManualInput] = useState('');
  const [checklist, setChecklist] = useState<string[]>([]);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const logEndRef = useRef<HTMLDivElement>(null);

  const currentInputRef = useRef('');
  const currentOutputRef = useRef('');
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');

  const isMicMutedRef = useRef(true);

  const stopAllAudio = useCallback(() => {
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const toggleMic = () => {
    const newState = !isMicMuted;
    setIsMicMuted(newState);
    isMicMutedRef.current = newState;
    
    // Interruption logic: if the user turns mic on while AI is speaking, stop the AI
    if (!newState && isSpeaking) {
      stopAllAudio();
      setIsSpeaking(false);
    }
  };

  const sendQuery = useCallback((text: string) => {
    if (sessionRef.current && isSessionActive && text.trim()) {
      sessionRef.current.then((s: any) => {
        s.sendRealtimeInput({ text: text.trim() });
      });
      if (text === manualInput) {
        setTranscription(prev => [...prev.slice(-20), `User: ${text.trim()}`]);
        setManualInput('');
      }
    }
  }, [isSessionActive, manualInput]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(manualInput);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcription, currentOutput]);

  const handleFrame = useCallback((base64: string) => {
    if (!isStatic && sessionRef.current && isSessionActive) {
      sessionRef.current.then((session: any) => {
        session.sendRealtimeInput({
          media: { data: base64, mimeType: 'image/jpeg' }
        });
      });
    }
  }, [isSessionActive, isStatic]);

  const startSession = async () => {
    if (sessionRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      const systemInstruction = getSystemInstruction();

      const sessionPromise = createCivilVisionSession({
        onOpen: () => {
          setIsSessionActive(true);
          const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
          const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            if (isMicMutedRef.current) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              int16[i] = inputData[i] * 32768;
            }
            const pcmBlob = {
              data: encode(new Uint8Array(int16.buffer)),
              mimeType: 'audio/pcm;rate=16000'
            };
            sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContextRef.current!.destination);

          if (isStatic && initialImages.length > 0) {
            sessionPromise.then(s => {
              initialImages.forEach(img => {
                s.sendRealtimeInput({ media: { data: img, mimeType: 'image/jpeg' } });
              });
              const initialPrompt = `I have uploaded ${initialImages.length} image(s). Conduct an expert structural analysis. Identify components, likely material grades, and check against standard engineering practices.`;
              s.sendRealtimeInput({ text: initialPrompt });
            });
          }
        },
        onMessage: async (msg: LiveServerMessage) => {
          const audioBase64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioBase64 && audioContextRef.current) {
            setIsSpeaking(true);
            
            // Auto-mute logic: When AI starts answering, the mic must turn off
            if (!isMicMutedRef.current) {
              setIsMicMuted(true);
              isMicMutedRef.current = true;
            }

            const ctx = audioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const buffer = await decodeAudioData(decode(audioBase64), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.addEventListener('ended', () => {
              sourcesRef.current.delete(source);
              if (sourcesRef.current.size === 0) setIsSpeaking(false);
            });
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            sourcesRef.current.add(source);
          }
          if (msg.serverContent?.interrupted) {
            stopAllAudio();
            setIsSpeaking(false);
          }
          if (msg.serverContent?.inputTranscription) {
            currentInputRef.current += msg.serverContent.inputTranscription.text;
            setCurrentInput(currentInputRef.current);
            setIsListening(true);
          }
          if (msg.serverContent?.outputTranscription) {
            currentOutputRef.current += msg.serverContent.outputTranscription.text;
            setCurrentOutput(currentOutputRef.current);
          }
          if (msg.serverContent?.turnComplete) {
            const finalOut = currentOutputRef.current;
            if (currentInputRef.current) {
               setTranscription(prev => [...prev.slice(-20), `User: ${currentInputRef.current}`, `AI: ${finalOut}`]);
            } else {
               setTranscription(prev => [...prev.slice(-20), `AI: ${finalOut}`]);
            }
            
            const complianceMatches = finalOut.match(/IS \d+[:]?\d*/g);
            if (complianceMatches) setChecklist(prev => Array.from(new Set([...prev, ...complianceMatches])));

            currentInputRef.current = '';
            currentOutputRef.current = '';
            setCurrentInput('');
            setCurrentOutput('');
            setIsListening(false);
          }
        },
        onError: (err) => console.error("Session Error:", err),
        onClose: () => setIsSessionActive(false),
      }, systemInstruction);

      sessionRef.current = sessionPromise;
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  useEffect(() => {
    startSession();
    return () => {
      if (sessionRef.current) {
        sessionRef.current.then((s: any) => s.close());
      }
      stopAllAudio();
    };
  }, []);

  const actionFilters = [
    { label: "IS Code Compliance", query: "Analyze for compliance with IS 456/800 standards." },
    { label: "Defect Severity", query: "Grade any visible defects and provide a remedial plan." },
    { label: "Construction Sequence", query: "Describe the construction steps for the structure shown." },
    { label: "Material Estimation", query: "Provide a rough estimate of concrete/steel quantities." }
  ];

  return (
    <div className={`flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden`}>
      <header className={`shrink-0 flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700 z-10 shadow-xl`}>
        <button onClick={onBack} className="flex items-center gap-2 hover:bg-slate-700 px-3 py-1 rounded-lg transition-all active:scale-95">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          <span className="font-bold text-sm">Exit</span>
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black tracking-tight text-amber-400 uppercase">Expert Analysis</h1>
          <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 relative flex flex-col md:flex-row p-4 gap-4 overflow-y-auto md:overflow-hidden">
        <div className="shrink-0 md:flex-1 relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 h-[40vh] md:h-full flex flex-col">
          {isStatic ? (
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
              <div className="flex-1 relative p-4 flex items-center justify-center group">
                <img 
                  src={`data:image/jpeg;base64,${initialImages[activeImageIndex]}`} 
                  alt="Active Structural Asset" 
                  className="max-w-full max-h-full object-contain rounded-xl border border-slate-800 shadow-2xl transition-all duration-500" 
                />
                <div className={`absolute top-6 left-6 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border bg-slate-900/60 border-slate-700 text-amber-400`}>
                  {initialImages.length > 1 ? `View ${activeImageIndex + 1} of ${initialImages.length}` : 'Image Analysis'}
                </div>
              </div>
              
              {initialImages.length > 1 && (
                <div className="shrink-0 h-24 bg-slate-900/80 backdrop-blur p-3 flex gap-3 overflow-x-auto border-t border-slate-800">
                  {initialImages.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative shrink-0 w-20 h-full rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-amber-500 scale-105 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}
                    >
                      <img src={`data:image/jpeg;base64,${img}`} alt="Thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <CameraView onFrame={handleFrame} isActive={isSessionActive} />
          )}
          
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            {isListening && (
              <div className="bg-blue-600 px-4 py-2 rounded-full text-[10px] font-bold animate-pulse shadow-xl border border-white/20">LISTENING</div>
            )}
            {isSpeaking && (
              <div className={`bg-amber-500 px-4 py-2 rounded-full text-[10px] font-bold shadow-xl text-slate-900 border border-white/20 flex items-center gap-2`}>
                <div className="flex gap-0.5">
                  <div className="w-1 h-3 bg-slate-900 animate-[bounce_1s_infinite]"></div>
                  <div className="w-1 h-3 bg-slate-900 animate-[bounce_1s_infinite_200ms]"></div>
                </div>
                AI SPEAKING
              </div>
            )}
          </div>
        </div>

        <div className={`flex-1 md:w-1/3 flex flex-col bg-slate-800/80 border-slate-700 rounded-3xl border overflow-hidden backdrop-blur-md`}>
          <div className="shrink-0 p-4 border-b border-slate-700/50 space-y-3">
               <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-700">
                  <p className="text-[10px] font-black text-amber-500 uppercase mb-2">Technical Standards Detected</p>
                  <div className="flex flex-wrap gap-2">
                    {checklist.length > 0 ? checklist.map(code => (
                      <span key={code} className="px-2 py-1 bg-amber-500/10 rounded text-[9px] font-mono border border-amber-500/30 text-amber-400">✓ {code}</span>
                    )) : <span className="text-[9px] text-slate-500 italic">Listening for code references...</span>}
                  </div>
               </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 mono text-[11px] leading-relaxed scroll-smooth">
            {transcription.map((line, i) => {
              const isAI = line.startsWith('AI:');
              return (
                <div key={i} className={`p-4 rounded-2xl border-l-4 transition-all ${isAI ? 'bg-amber-500/5 border-amber-500' : 'bg-slate-700/30 border-blue-500 shadow-sm'}`}>
                   <span className={`font-black opacity-60 block mb-1 uppercase tracking-tighter text-[9px] ${isAI ? 'text-amber-400' : 'text-blue-400'}`}>
                     {line.split(':')[0]}
                   </span>
                   {line.split(':').slice(1).join(':')}
                </div>
              );
            })}
            {currentOutput && (
              <div className={`p-4 rounded-2xl border-l-4 border-amber-500 bg-amber-500/5 animate-pulse`}>
                <span className={`font-black opacity-60 block mb-1 uppercase tracking-tighter text-[9px] text-amber-400`}>AI responding...</span>
                {currentOutput}
              </div>
            )}
            <div ref={logEndRef} />
          </div>
          
          <div className={`shrink-0 p-4 bg-slate-900/40 border-t border-slate-700/50`}>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {actionFilters.map(filter => (
                <button 
                  key={filter.label}
                  onClick={() => sendQuery(filter.query)}
                  className={`px-3 py-2 rounded-xl text-[10px] border border-slate-700 font-bold text-left transition-all hover:bg-slate-700 text-slate-300`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleManualSubmit} className="relative flex items-center">
              <input 
                type="text" 
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Ask expert question..."
                className={`w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pl-4 pr-12 text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600`}
              />
              <button 
                type="submit"
                disabled={!manualInput.trim()}
                className={`absolute right-1.5 p-2 rounded-xl transition-all ${manualInput.trim() ? 'text-amber-400' : 'text-slate-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="shrink-0 h-24 bg-slate-900 flex items-center justify-center gap-8 px-8 relative">
          <div className="flex-1 h-[1px] bg-slate-800"></div>
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={toggleMic}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all z-10 ${isMicMuted ? 'bg-slate-700 text-slate-400' : 'bg-amber-500 text-slate-900'} hover:scale-105 active:scale-95`}
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                {isMicMuted ? (
                  <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17l1.3 1.3c.12-.41.22-.84.22-1.3l-1.52-.02c-.01.01 0 0 0 .02zM12 4c1.1 0 2 .9 2 2v5.17l1.81 1.81c.12-.31.19-.64.19-.98V6c0-2.21-1.79-4-4-4S8 3.79 8 6v.17l2 2V6c0-1.1.9-2 2-2zm-1.21 2.9l2 2V6l-2 .9zM2.81 3.23L1.39 4.65l6.1 6.1V11c0 2.21 1.79 4 4 4 .58 0 1.13-.12 1.63-.34l.98.98c-.78.36-1.66.56-2.61.56-3.39 0-6.14-2.51-6.14-5.6h-1.7c0 3.83 2.95 7.02 6.84 7.56V22h2v-3.05c.87-.13 1.69-.41 2.45-.8l3.11 3.11 1.41-1.41L2.81 3.23z"/>
                ) : (
                  <>
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </>
                )}
              </svg>
            </button>
            <span className={`text-[8px] font-black uppercase tracking-widest ${isMicMuted ? 'text-slate-500' : 'text-amber-400'}`}>
              {isMicMuted ? 'Mic Off' : 'Mic On'}
            </span>
          </div>
          <div className="flex-1 h-[1px] bg-slate-800"></div>
      </footer>
    </div>
  );
};

export default AnalysisDashboard;
