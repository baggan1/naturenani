
import React, { useState } from 'react';
import { ShieldAlert, Check, ArrowRight, Info, AlertTriangle } from 'lucide-react';

interface LegalConsentModalProps {
  onConsent: () => void;
}

export const LegalConsentModal: React.FC<LegalConsentModalProps> = ({ onConsent }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sage-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col relative border border-white/20">
        <div className="bg-[#8B0000] p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-16 -translate-y-16"></div>
          <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold">Important Medical Notice</h2>
          <p className="text-white/80 text-sm mt-2">Please review and agree to our terms of use before proceeding.</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex gap-4 items-start">
            <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
            <div className="text-sm text-amber-900 leading-relaxed">
              <p className="font-bold mb-1">Not a Substitute for Professional Medical Advice</p>
              NatureNani provides informational content based on Ayurvedic and Naturopathic traditions. 
              <strong> It is NOT medical advice.</strong> Always consult your physician before changing your medical routine.
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="p-1 bg-sage-100 rounded text-sage-600"><Check size={14} /></div>
              <span>NatureNani is an AI assistant, not a licensed medical professional.</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="p-1 bg-sage-100 rounded text-sage-600"><Check size={14} /></div>
              <span>Do not disregard professional advice based on content found here.</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="p-1 bg-sage-100 rounded text-sage-600"><Check size={14} /></div>
              <span>In case of emergency, call your local emergency services (e.g., 911) immediately.</span>
            </div>
          </div>

          <div className="pt-6 border-t border-sage-100">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center mt-0.5">
                <input 
                  type="checkbox" 
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-sage-300 bg-white checked:bg-sage-600 checked:border-sage-600 transition-all"
                />
                <Check className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity left-0.5" />
              </div>
              <span className="text-sm text-gray-700 font-medium group-hover:text-sage-900 transition-colors select-none">
                I understand that NatureNani provides informational content only and is not a substitute for medical advice.
              </span>
            </label>
          </div>

          <button
            onClick={onConsent}
            disabled={!agreed}
            className="w-full bg-sage-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-sage-200 flex items-center justify-center gap-2"
          >
            Agree and Continue <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
