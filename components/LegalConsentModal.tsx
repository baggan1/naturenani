
import React, { useState } from 'react';
import { Check, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';

interface LegalConsentModalProps {
  onConsent: () => void;
}

export const LegalConsentModal: React.FC<LegalConsentModalProps> = ({ onConsent }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sage-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative border border-white/10">
        
        <div className="p-6 md:p-8 space-y-5">
          {/* Main Warning Block */}
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl flex gap-3 items-start">
            <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-amber-900 leading-relaxed">
              <strong className="block mb-1">Not Medical Advice</strong>
              The information provided by NatureNani is for educational and informational purposes only, based on traditional Ayurvedic and Naturopathic literature.
            </div>
          </div>

          {/* Key Terms */}
          <div className="space-y-3 px-1">
            <div className="flex items-start gap-3 text-xs text-gray-600 leading-snug">
              <div className="p-0.5 bg-sage-100 rounded text-sage-600 flex-shrink-0 mt-0.5"><Check size={12} /></div>
              <span>NatureNani is an AI tool, not a licensed healthcare professional or doctor.</span>
            </div>
            <div className="flex items-start gap-3 text-xs text-gray-600 leading-snug">
              <div className="p-0.5 bg-sage-100 rounded text-sage-600 flex-shrink-0 mt-0.5"><Check size={12} /></div>
              <span>Always consult your physician before starting any new health protocol or herbal remedy.</span>
            </div>
            <div className="flex items-start gap-3 text-xs font-bold text-red-800 leading-snug">
              <div className="p-0.5 bg-red-100 rounded text-red-600 flex-shrink-0 mt-0.5"><Check size={12} /></div>
              <span>In case of medical emergency, contact your local emergency services or go to the nearest hospital immediately.</span>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="pt-4 border-t border-sage-100">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center mt-1">
                <input 
                  type="checkbox" 
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-sage-300 bg-white checked:bg-sage-600 checked:border-sage-600 transition-all"
                />
                <Check className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity left-0.5" />
              </div>
              <span className="text-xs text-gray-700 font-medium group-hover:text-sage-900 transition-colors select-none">
                I understand that NatureNani provides informational content only and is not a substitute for professional medical advice.
              </span>
            </label>
          </div>

          <button
            onClick={onConsent}
            disabled={!agreed}
            className="w-full bg-sage-600 text-white py-4 rounded-xl font-bold text-base hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-sage-200 flex items-center justify-center gap-2"
          >
            Agree and Continue <ArrowRight size={18} />
          </button>

          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-sage-400 uppercase tracking-widest">
              <ShieldCheck size={12} /> Grounded in Ancient Wisdom
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
