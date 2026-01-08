
import React, { useEffect, useState, useRef } from 'react';
import { Mic, X, Sparkles, Leaf, Activity, MessageSquare, AlertCircle, ArrowRight, Zap } from 'lucide-react';
import { NatureNaniVoiceSession } from '../services/geminiLiveService';

interface VoiceConsultationProps {
  onClose: () => void;
  onSubmit: (query: string) => void;
}

export const VoiceConsultation: React.FC<VoiceConsultationProps> = ({ onClose, onSubmit }) => {
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<NatureNaniVoiceSession | null>(null);

  useEffect(() => {
    sessionRef.current = new NatureNaniVoiceSession({
      onTranscript: (text) => {
        setTranscript(prev => prev + text);
      },
      onTurnComplete: (fullText) => {
        // We could auto-submit here, but let's let the user see it first
      },
      onError: (err) => {
        console.error("Voice Error:", err);
        setError("Connection interrupted. Please try speaking again.");
      }
    });

    sessionRef.current.start();
    return () => sessionRef.current?.stop();
  }, []);

  const handleManualSubmit = () => {
    if (!transcript.trim() || isProcessing) return;
    setIsProcessing(true);
    onSubmit(transcript);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-sage-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-4 text-sage-200 hover:text-white hover:bg-white/10 rounded-full transition-all"
      >
        <X size={32} />
      </button>

      <div className="w-full max-w-2xl flex flex-col items-center gap-12 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-sage-500/20 animate-pulse-slow scale-150"></div>
          <div className="w-40 h-40 rounded-full bg-sage-600 flex items-center justify-center shadow-2xl relative z-10">
            <Activity size={48} className="text-white animate-pulse" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl font-serif font-bold text-white">Nani is Listening...</h2>
          <p className="text-sage-300 font-medium">Describe your health concerns in your own words.</p>
        </div>

        <div className="w-full bg-white/5 rounded-[2.5rem] border border-white/10 p-8 min-h-[160px] flex flex-col items-center justify-center relative group">
          {transcript ? (
            <p className="text-xl text-sage-100 leading-relaxed italic animate-in fade-in slide-in-from-bottom-2">
              "{transcript}"
            </p>
          ) : (
            <div className="flex flex-col items-center gap-4 opacity-30 text-sage-200">
              <Mic size={40} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Speak Now</span>
            </div>
          )}
        </div>

        {transcript && (
          <button 
            onClick={handleManualSubmit}
            className="group bg-white text-sage-900 px-10 py-5 rounded-full font-bold text-lg flex items-center gap-3 shadow-2xl hover:bg-sage-50 hover:scale-105 active:scale-95 transition-all animate-in zoom-in duration-300"
          >
            Consult Nature Nani <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 font-bold bg-red-400/10 px-4 py-2 rounded-xl">
            <AlertCircle size={18} /> {error}
          </div>
        )}
      </div>

      <div className="absolute bottom-12 flex items-center gap-3 text-sage-500 text-[10px] font-bold uppercase tracking-widest">
        <Sparkles size={12} className="text-yellow-500" /> Real-time Speech-to-Consultation
      </div>
    </div>
  );
};
