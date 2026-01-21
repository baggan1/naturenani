
import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Lock, Star, User, ShieldAlert, Info, ArrowLeft } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

interface FAQViewProps {
  onBack: () => void;
}

export const FAQView: React.FC<FAQViewProps> = ({ onBack }) => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const categories: FAQCategory[] = [
    {
      title: "General",
      icon: <Info size={20} className="text-blue-500" />,
      items: [
        {
          question: "What is Nature Nani?",
          answer: "A digital companion that uses ancient Naturopathy and Ayurveda texts to help you find the root cause of ailments."
        }
      ]
    },
    {
      title: "Privacy",
      icon: <Lock size={20} className="text-sage-600" />,
      items: [
        {
          question: "Is my health data private?",
          answer: "Yes, my dear. Your queries are used only to generate your healing protocol and are stored securely in your private library."
        }
      ]
    },
    {
      title: "Account",
      icon: <Star size={20} className="text-amber-500" />,
      items: [
        {
          question: "Why should I go Premium?",
          answer: "Premium users get unlimited consultations, detailed herbal dosages, specific Yoga video guides, and full Diet plans."
        }
      ]
    },
    {
      title: "Usage",
      icon: <User size={20} className="text-earth-600" />,
      items: [
        {
          question: "Why do you ask for my age/sex?",
          answer: "Every body is unique. In Ayurveda, your age and physical constitution change the type of \"fire\" or \"air\" inside you, which changes the remedy."
        }
      ]
    },
    {
      title: "Safety",
      icon: <ShieldAlert size={20} className="text-red-600" />,
      items: [
        {
          question: "Is this a medical diagnosis?",
          answer: "No, my dear. I provide educational wisdom from traditional texts. Always consult a doctor for clinical diagnoses."
        }
      ]
    }
  ];

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
          <h1 className="font-serif text-2xl font-bold text-sage-900">Frequently Asked Questions</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-serif font-bold text-sage-900">Healing Guidance & Support</h2>
          <p className="text-gray-500 font-medium">Find answers to common questions about your journey with Nature Nani.</p>
        </div>

        <div className="space-y-6">
          {categories.map((category, cIdx) => (
            <div key={cIdx} className="space-y-3">
              <h3 className="flex items-center gap-2 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {category.icon} {category.title}
              </h3>
              <div className="space-y-3">
                {category.items.map((item, iIdx) => {
                  const isOpen = openItems[`${cIdx}-${iIdx}`];
                  return (
                    <div 
                      key={iIdx} 
                      className="bg-white rounded-2xl border border-sage-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
                    >
                      <button 
                        onClick={() => toggleItem(cIdx, iIdx)}
                        className="w-full flex items-center justify-between p-5 text-left group"
                      >
                        <span className="font-bold text-sage-900 group-hover:text-sage-600 transition-colors">
                          {item.question}
                        </span>
                        {isOpen ? <ChevronUp size={18} className="text-sage-400" /> : <ChevronDown size={18} className="text-sage-400" />}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-300">
                          <div className="h-px bg-sage-50 mb-4" />
                          <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-sage-100 pl-4 py-1">
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-sage-600 rounded-[2rem] p-8 text-white text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-16 -translate-y-16"></div>
          <HelpCircle className="mx-auto mb-4 opacity-50" size={32} />
          <h3 className="text-xl font-serif font-bold mb-2">Still have questions?</h3>
          <p className="text-sage-100 text-sm mb-6 max-w-sm mx-auto">Our wise archives are always expanding. Feel free to ask Nani anything during your next consultation.</p>
          <button 
            onClick={onBack}
            className="bg-white text-sage-900 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-sage-50 transition-all shadow-md"
          >
            Start a Consultation
          </button>
        </div>
      </div>
    </div>
  );
};
