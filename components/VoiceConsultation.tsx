
import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, X, Wind, Sparkles, Leaf, Activity, MessageSquare, AlertCircle } from 'lucide-react';
import { NatureNaniVoiceSession } from '../services/geminiLiveService';

interface VoiceConsultationProps {
  onClose: () => void;
}

export const VoiceConsultation: React.FC<VoiceConsultationProps> = ({ onClose }) => {
  const [sessionState, setSessionState] = useState<'idle' | 'listening' | 'speaking'>('idle');
  const [transcripts, setTranscripts] = useState<{ text: string, isModel: boolean }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<NatureNaniVoiceSession | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionRef.current = new NatureNaniVoiceSession({
      onTranscript: (text, isModel) => {
        setTranscripts(prev => {
          // Update last transcript if same role to simulate streaming feel
          if (prev.length > 0 && prev[prev.length - 1].isModel === isModel) {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, text: last.text + text }];
          }
          return [...prev, { text, isModel }];
        });
      },
      onError: (err) => {
        console.error("Voice Session Error:", err);
        setError("I lost my connection to the healing frequencies. Please try again.");
      },
      onStateChange: (state) => setSessionState(state)
    });

    sessionRef.current.start();

    return () => {
      sessionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  return (
    <div className="fixed inset-0 z-[100] bg-sage-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 md:p-12 animate-in fade-in duration-500">
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-4 text-sage-200 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90"
      >
        <X size={32} />
      </button>

      <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center space-y-12">
        {/* Nani's Presence / Visualizer */}
        <div className="relative">
          {/* Animated Rings */}
          <div className={`absolute inset-0 rounded-full border-4 border-sage-400/30 transition-all duration-700 ${sessionState === 'speaking' ? 'scale-150 opacity-0 animate-ping' : 'scale-100 opacity-100'}`}></div>
          <div className={`absolute inset-0 rounded-full border-2 border-sage-400/20 transition-all duration-1000 delay-150 ${sessionState === 'speaking' ? 'scale-[2] opacity-0 animate-ping' : 'scale-100 opacity-100'}`}></div>
          
          <div className={`w-48 h-48 rounded-full bg-sage-600 flex items-center justify-center shadow-2xl ring-8 ring-sage-500/20 relative z-10 transition-transform duration-500 ${sessionState === 'speaking' ? 'scale-110' : 'scale-100'}`}>
            <Leaf size={64} className={`text-white transition-all duration-500 ${sessionState === 'speaking' ? 'rotate-12' : 'rotate-0'}`} />
            {sessionState === 'listening' && (
              <div className="absolute bottom-4 flex gap-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-1.5 h-1.5 bg-sage-200 rounded-full animate-bounce`} style={{ animationDelay: `${i * 0.1}s` }}></div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-3xl font-serif font-bold text-white">
            {sessionState === 'speaking' ? "Nani is Speaking..." : sessionState === 'listening' ? "Nani is Listening..." : "Consulting Nature Nani"}
          </h2>
          <p className="text-sage-300 text-sm max-w-sm mx-auto font-medium">
            Speak freely about your wellness needs. I am listening to the rhythm of your voice.
          </p>
        </div>

        {/* Live Transcripts */}
        <div className="w-full bg-white/5 rounded-3xl border border-white/10 p-6 h-48 overflow-y-auto scrollbar-hide flex flex-col gap-4">
          {error ? (
            <div className="text-red-400 text-center flex items-center justify-center h-full gap-2">
              <AlertCircle size={20} /> {error}
            </div>
          ) : transcripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-30 text-sage-200 gap-2">
              <MessageSquare size={32} />
              <span className="text-xs font-bold uppercase tracking-widest">Awaiting Wisdom...</span>
            </div>
          ) : (
            transcripts.map((t, i) => (
              <div key={i} className={`flex ${t.isModel ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${t.isModel ? 'bg-sage-600 text-white rounded-tl-none' : 'bg-white/10 text-sage-100 rounded-tr-none'}`}>
                  {t.text}
                </div>
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <div className="p-1 bg-white/10 rounded-full flex gap-1">
            <button className={`p-4 rounded-full transition-all ${sessionState === 'listening' ? 'bg-earth-500 text-white shadow-lg' : 'text-sage-300'}`}>
              <Mic size={24} />
            </button>
            <button className={`p-4 rounded-full transition-all ${sessionState === 'speaking' ? 'bg-sage-500 text-white shadow-lg' : 'text-sage-300'}`}>
              <Activity size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 text-sage-500 text-[10px] font-bold uppercase tracking-[0.2em]">
        <Sparkles size={12} className="text-yellow-500" /> Grounded in Vedic Wisdom
      </div>
    </div>
  );
};
