
import React from 'react';
import { Info, Cpu, BookOpen, ShieldCheck, ArrowLeft, Leaf } from 'lucide-react';

interface AboutViewProps {
  onBack: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onBack }) => {
  return (
    <div className="h-full bg-sage-50 overflow-y-auto pb-20">
      <div className="bg-white border-b border-sage-200 p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-sage-50 rounded-full transition-colors text-sage-600"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-serif text-2xl font-bold text-sage-900">About NatureNani</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-12">
        <section className="text-center space-y-6">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-3xl shadow-sm border border-sage-200 mb-4">
             <Leaf className="text-sage-600 w-12 h-12" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-sage-900 leading-tight">
            Bridging Ancient Wisdom with <br /> Modern Technology
          </h2>
          <p className="text-lg text-sage-700 leading-relaxed max-w-2xl mx-auto">
            NatureNani combines the precision of modern technology with the timeless wisdom of Ayurveda and Naturopathy. Unlike general AI, NatureNani is strictly grounded in a curated library of ancient texts and verified health books, acting as a digital bridge to thousands of years of healing knowledge.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-sage-200 shadow-sm space-y-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Cpu size={24} />
            </div>
            <h3 className="text-xl font-bold text-sage-900">How RAG Works</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              NatureNani utilizes Retrieval-Augmented Generation (RAG). Instead of relying on a pre-trained model's memory (which can hallucinate), NatureNani first "searches" its own private library of authentic texts to find relevant passages before generating a response.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-sage-200 shadow-sm space-y-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold text-sage-900">Curated Library</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Our archives include verified translations of classical Ayurvedic Samhitas, traditional Naturopathy clinical guides, and modern research on botanical medicine. We prioritize source material that has been used safely for generations.
            </p>
          </div>
        </div>

        <section className="bg-sage-600 rounded-3xl p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-32 -translate-y-32"></div>
          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <ShieldCheck size={48} className="text-sage-200" />
            <h3 className="text-2xl font-serif font-bold">Safe & Grounded Guidance</h3>
            <p className="text-sage-100 leading-relaxed">
              Our primary goal is safety. By constraining our AI to specific, verified literature, we significantly reduce inaccuracies and provide recommendations that are deeply rooted in holistic tradition.
            </p>
          </div>
        </section>

        <div className="text-center text-gray-400 text-xs italic">
          NatureNani &copy; 2024. Empowering your journey with nature's wisdom.
        </div>
      </div>
    </div>
  );
};
