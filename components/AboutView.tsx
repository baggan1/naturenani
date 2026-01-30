import React from 'react';
import { Leaf, Sprout, ShieldCheck, Scale, ArrowLeft, ArrowRight, Brain, Fingerprint } from 'lucide-react';

interface AboutViewProps {
  onBack: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onBack }) => {
  return (
    <div className="h-full bg-sage-50 overflow-y-auto pb-20">
      {/* Header */}
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

        {/* About NatureNani: Restoring Your Natural Intelligence (NQ) */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-3xl shadow-sm border border-sage-200 mb-4">
            <Leaf className="text-sage-600 w-12 h-12" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-sage-900 leading-tight">
            About NatureNani: <br /> Restoring Your Natural Intelligence (NQ)
          </h2>
        </section>

        {/* Our Vision */}
        <section className="bg-white p-8 rounded-3xl border border-sage-200 shadow-sm space-y-4">
          <h3 className="text-xl font-bold text-sage-900 flex items-center gap-2">
            <Sprout className="text-sage-500" /> Our Vision
          </h3>
          <p className="text-sage-700 leading-relaxed">
            NatureNani was born from a simple yet urgent observation: in our modern world, we have become disconnected from the wealth of nature. While conventional medicine is a vital, life-saving resource for emergencies, we have grown accustomed to overloading our bodies with medication for even the smallest ailments. Too often, we mask symptoms rather than addressing the root cause, allowing minor issues to evolve into chronic challenges.
          </p>
          <p className="text-sage-900 font-medium leading-relaxed">
            NatureNani is the digital bridge back to balance. Our vision is to provide access to the thousands of years of wisdom found in Ayurveda and Naturopathy—traditions that don’t just treat symptoms, but restore harmony to the human body.
          </p>
        </section>

        {/* Visual Hint + The Power of Grounded AI */}
        <div className="space-y-8">
          <div className="rounded-3xl overflow-hidden shadow-md border border-sage-200">
            <img src="/about-bridge.png" alt="Ancient wisdom meets modern technology" className="w-full h-64 object-cover" />
            <div className="bg-sage-50 p-4 text-center text-xs text-sage-500 italic">
              Bridging ancient wisdom with modern technology for a balanced life.
            </div>
          </div>

          <section className="bg-white p-8 rounded-3xl border border-sage-200 shadow-sm space-y-4">
            <h3 className="text-xl font-bold text-sage-900 flex items-center gap-2">
              <Brain className="text-blue-500" /> The Power of Grounded AI
            </h3>
            <p className="text-sage-700 leading-relaxed">
              To bring this ancient wisdom into the 21st century, we utilize <strong>Retrieval-Augmented Generation (RAG)</strong>. Unlike general AI models that "guess" answers based on a massive, unfiltered internet, NatureNani is strictly grounded in a private, curated library of verified texts.
            </p>
            <div className="space-y-2 pt-2">
              <h4 className="font-semibold text-sage-900">How It Works:</h4>
              <ul className="list-disc list-inside text-sage-700 space-y-2 text-sm">
                <li><strong>Authentic Sources:</strong> Our library includes verified translations of classical Ayurvedic <em>Samhitas</em> and traditional Naturopathy clinical guides.</li>
                <li><strong>No Hallucinations:</strong> Before giving you an answer, NatureNani "searches" these authentic texts to find relevant passages. This ensures every recommendation is deeply rooted in holistic tradition.</li>
                <li><strong>Safety First:</strong> By constraining our AI to specific, verified literature, we provide safe, grounded guidance that respects the human body’s intelligence.</li>
              </ul>
            </div>
          </section>
        </div>

        {/* A Balanced Perspective */}
        <section className="bg-sage-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-20 -translate-y-20"></div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <Scale size={32} className="text-sage-200" />
              <h3 className="text-2xl font-serif font-bold">A Balanced Perspective</h3>
            </div>
            <p className="text-sage-100 leading-relaxed">
              We believe in a "Both/And" approach to health. We are not against conventional medicine; we are for <strong>informed prevention</strong>. Our goal is to empower the common person to understand their body's warning signs rather than silencing them.
            </p>
            <p className="text-sage-100 leading-relaxed">
              Whether you are seeking to treat a common cold naturally or looking to supplement a major medical journey with holistic support, NatureNani is your personal wellness guide. We help you treat the disease before it progresses, using the very resources nature has provided for millennia.
            </p>
          </div>
        </section>

        {/* Why "Natural Intelligence"? */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-sage-900 flex items-center gap-2">
            <Fingerprint className="text-orange-500" /> Why "Natural Intelligence"?
          </h3>
          <p className="text-sage-700 leading-relaxed">
            We call this <strong>NQ</strong>. Just as we use Artificial Intelligence to process data, we must use our Natural Intelligence to process health. NatureNani is here to help you lead a more informed health journey—connected to nature, supported by tech, and focused on you.
          </p>
        </section>

        {/* Our Core Values */}
        <section className="bg-white p-8 rounded-3xl border border-sage-200 shadow-sm space-y-4">
          <h3 className="text-xl font-bold text-sage-900 flex items-center gap-2">
            <Leaf className="text-green-600" /> Our Core Values
          </h3>
          <ul className="space-y-4 text-sage-700">
            <li className="flex gap-3">
              <span className="h-6 w-6 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 text-sage-600 font-bold text-xs">1</span>
              <p><strong>Root-Cause Focus:</strong> We believe in looking beyond the surface. Instead of masking symptoms, our guidance is designed to help you identify and address the underlying imbalances in your body.</p>
            </li>
            <li className="flex gap-3">
              <span className="h-6 w-6 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 text-sage-600 font-bold text-xs">2</span>
              <p><strong>Radical Authenticity:</strong> In an age of digital noise, we prioritize the truth. By grounding our AI in verified Ayurvedic and Naturopathy texts through <strong>RAG technology</strong>, we ensure every suggestion is an authentic reflection of ancient wisdom—never a guess.</p>
            </li>
            <li className="flex gap-3">
              <span className="h-6 w-6 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 text-sage-600 font-bold text-xs">3</span>
              <p><strong>Proactive Prevention:</strong> We value the "Nature of the Human Body." Our goal is to shift the health narrative from reactive treatment to proactive prevention, empowering you to listen to your body’s warning signs early.</p>
            </li>
            <li className="flex gap-3">
              <span className="h-6 w-6 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 text-sage-600 font-bold text-xs">4</span>
              <p><strong>Empowered Accessibility:</strong> Wisdom shouldn't be hidden in rare manuscripts. We are committed to making the world’s most powerful natural healing resources accessible, understandable, and actionable for everyone, everywhere.</p>
            </li>
          </ul>
        </section>

        <div className="text-center text-sage-600 italic font-serif text-lg">
          "Let’s rediscover our NQ, together."
        </div>

        {/* CTA Button */}
        <div className="pt-4 pb-8">
          <button
            onClick={onBack}
            className="w-full bg-sage-700 hover:bg-sage-800 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-lg group"
          >
            Begin Your Journey – Try a Consultation
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
};
