
import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, ScrollText, AlertCircle, Info, Stethoscope } from 'lucide-react';

interface LegalNoticeProps {
  onBack: () => void;
}

export const LegalNotice: React.FC<LegalNoticeProps> = ({ onBack }) => {
  return (
    <div className="h-full bg-sage-50 overflow-y-auto pb-20">
      <div className="bg-white border-b border-sage-200 p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-sage-50 rounded-full transition-colors text-sage-600"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-serif text-2xl font-bold text-sage-900">Legal & Privacy</h1>
          </div>
          <div className="text-[10px] font-bold text-sage-400 uppercase tracking-widest">
            Last Updated: May 2024
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-12">
        {/* Medical Disclaimer Section */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-sage-200">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="text-[#8B0000]" size={28} />
            <h2 className="text-2xl font-serif font-bold text-[#8B0000]">⚖️ Medical Disclaimer for NatureNani</h2>
          </div>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div>
              <h3 className="font-bold text-sage-800 mb-2 flex items-center gap-2">
                <Info size={18} /> 1. For Educational and Informational Purposes Only
              </h3>
              <p className="text-sm">
                NatureNani is a Retrieval-Augmented Generation (RAG) tool designed to provide information based on traditional Ayurvedic and Naturopathic texts. All content, including text, graphics, and images, is for educational and informational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sage-800 mb-2 flex items-center gap-2">
                <Stethoscope size={18} /> 2. Not a Medical Professional
              </h3>
              <p className="text-sm">
                NatureNani is an artificial intelligence, not a doctor, licensed naturopath, or Ayurvedic practitioner. Using this app does not establish a doctor-patient relationship.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sage-800 mb-2 flex items-center gap-2">
                <AlertCircle size={18} /> 3. Seek Professional Advice
              </h3>
              <p className="text-sm">
                Always seek the advice of your physician or another qualified health provider regarding any medical condition. Never disregard professional medical advice or delay seeking it because of something you have read on NatureNani.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sage-800 mb-2 flex items-center gap-2">
                <ScrollText size={18} /> 4. Risk of Inaccuracy (AI & RAG)
              </h3>
              <p className="text-sm">
                While NatureNani uses RAG to query established texts, AI models can occasionally produce "hallucinations" or interpret ancient texts in ways that may not apply to your specific health profile. NatureNani does not guarantee the accuracy, completeness, or usefulness of any information provided.
              </p>
            </div>

            <div className="bg-sage-50 p-4 rounded-xl border border-sage-100">
              <h3 className="font-bold text-sage-900 mb-2">5. Interaction with Conventional Treatment</h3>
              <p className="text-sm">
                Naturopathic and Ayurvedic recommendations (herbs, supplements, and dietary changes) can interact with prescription medications or existing health conditions. Consult your primary care physician before starting any new protocol suggested by this app.
              </p>
            </div>

            <div className="bg-[#8B0000]/5 p-6 rounded-xl border border-[#8B0000]/10 text-[#8B0000]">
              <h3 className="font-bold mb-2 uppercase tracking-widest text-xs">6. Emergency Situations</h3>
              <p className="text-sm font-medium">
                NatureNani should never be used in a medical emergency. If you think you may have a medical emergency, contact your local emergency services or go to the nearest hospital immediately.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-sage-200">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="text-sage-600" size={28} />
            <h2 className="text-2xl font-serif font-bold text-sage-900">🔒 Privacy & Data Policy (Health Data)</h2>
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-sage-800 mb-2">1. Data Collection</h3>
                <p className="text-sm">
                  NatureNani collects the queries you input to provide relevant responses. We do not collect personally identifiable information (PII) unless voluntarily provided. Please do not input sensitive personal identifiers (such as your full name, SSN, or address) into the chat.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-sage-800 mb-2">2. How Your Data is Used</h3>
                <ul className="text-sm list-disc ml-5 space-y-2">
                  <li><strong>Query Processing:</strong> Your data is processed through Google AI Studio/Gemini API to generate responses.</li>
                  <li><strong>No Sale of Data:</strong> We do not sell your health queries to third-party advertisers.</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-sage-100 pt-6">
              <h3 className="font-bold text-sage-800 mb-2">3. Data Security</h3>
              <p className="text-sm">
                We implement standard security measures to protect your data; however, no transmission over the internet is 100% secure. By using this app, you acknowledge that you provide your information at your own risk.
              </p>
            </div>
          </div>
        </section>

        <div className="text-center text-gray-400 text-xs">
          NatureNani &copy; 2024. All rights reserved.
        </div>
      </div>
    </div>
  );
};
