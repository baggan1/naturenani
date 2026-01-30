import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowLeft,
  Landmark,
  User,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  tip?: string;
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
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const categories: FAQCategory[] = [
    {
      title: "The Nani Difference",
      icon: <Landmark size={20} className="text-emerald-700" />,
      items: [
        {
          question: "What makes NatureNani different from other AI health tools?",
          answer: "Unlike general AI that \"guesses\" answers based on the internet, NatureNani is grounded in RAG (Retrieval-Augmented Generation). We only use a curated, private library of verified ancient Ayurvedic and Naturopathic texts. No hallucinations—just authentic wisdom."
        },
        {
          question: "What is \"Natural Intelligence\" (NQ)?",
          answer: "NQ is your body’s innate ability to heal. While we use Artificial Intelligence as the tool, our goal is to help you rediscover your Natural Intelligence—understanding your body’s signals instead of just silencing them."
        },
        {
          question: "Why focus on the \"Root Cause\" instead of just symptoms?",
          answer: "Conventional treatments often mask symptoms with medication. NatureNani looks at the \"Why.\" By identifying the root imbalance, we help you treat the disease before it progresses, restoring long-term harmony."
        }
      ]
    },
    {
      title: "Your Personalized Journey",
      icon: <User size={20} className="text-amber-600" />,
      items: [
        {
          question: "Why does Nani need my age, sex, and physical constitution?",
          answer: "Every body is a unique ecosystem. In Ayurveda, your age and \"Prakriti\" (constitution) determine how you process the world. A remedy for one person might be an irritant for another. Nani tailors her wisdom to your specific fire and air."
        },
        {
          question: "What do I get with a Premium membership?",
          answer: "While our Free Forever plan provides 3 consultations daily to ensure wellness is accessible to all, Premium opens the full \"Nani Circle.\" This includes: Unlimited Consultations for deep-dive healing, Detailed Dosages with precise herbal frequencies, and Yoga Aid & Nutri Heal with full video routines and dietary protocols.",
          tip: "Nani's Tip: If you're unsure where to start, try searching for 'Daily Morning Routine' in your next consultation!"
        }
      ]
    },
    {
      title: "Safety, Trust & Privacy",
      icon: <ShieldCheck size={20} className="text-blue-600" />,
      items: [
        {
          question: "Is NatureNani a replacement for my doctor?",
          answer: "No, my dear. We believe in a balanced perspective. Modern medicine is vital for emergencies and clinical diagnoses. NatureNani is your wellness guide—focused on prevention, root causes, and supplementing your traditional health journey."
        },
        {
          question: "Is my health data private?",
          answer: "Absolutely. Your journey is sacred. Your queries are used only to generate your personalized protocols and are stored securely in your private library. We do not sell your health data to third parties."
        }
      ]
    }
  ];

  // Search Logic
  const filteredCategories = categories.map((cat, cIdx) => {
    // Check if category title matches
    const titleMatch = cat.title.toLowerCase().includes(searchQuery.toLowerCase());

    // Check items
    const matchingItems = cat.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // If title matches, show all items (or maybe just matching ones? Usually better to show relevant ones)
    // Let's show all items if title matches, otherwise just matching items.
    // Actually, simple filtering logic:
    // If search is empty, return everything.
    // If not, return items that match, BUT we also want to keep the Category structure.

    if (!searchQuery) return { ...cat, originalIndex: cIdx };

    // If we have matching items, return them.
    if (matchingItems.length > 0) {
      return { ...cat, items: matchingItems, originalIndex: cIdx };
    }

    // If category title matches, return all items
    if (titleMatch) {
      return { ...cat, items: cat.items, originalIndex: cIdx };
    }

    // If category title matches but no items match specifically, maybe show all items?
    // Or just show the category? Let's assume we search within content mostly.
    return null;
  }).filter(Boolean) as (FAQCategory & { originalIndex: number })[];


  return (
    <div className="h-full bg-sage-50 overflow-y-auto pb-20 scrollbar-hide">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-sage-200 p-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-sage-100/50 rounded-full transition-colors text-sage-600 active:scale-95"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-serif text-2xl font-bold text-sage-900">Frequently Asked Wisdom</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 md:p-8 space-y-8">

        {/* Intro */}
        <div className="text-center space-y-3 py-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-sage-900 leading-tight">
            How can Nani help?
          </h2>
          <p className="text-sage-600 font-medium">
            Search our ancient wisdom archives or explore topics below.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <input
            type="text"
            placeholder="Search for answers (e.g., 'privacy', 'dosha')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-sage-200 bg-white shadow-sm group-hover:shadow-md focus:ring-2 focus:ring-sage-400/50 focus:border-sage-400 outline-none transition-all text-sage-900 placeholder:text-sage-400"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400 group-focus-within:text-sage-600 transition-colors" size={20} />
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-sage-400" size={24} />
              </div>
              <p className="text-sage-600 font-medium">No answers found for "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-emerald-600 font-bold hover:underline text-sm"
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.title} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 px-2 border-b border-sage-200/50 pb-2">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    {category.icon}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-sage-900">
                    {category.title}
                  </h3>
                </div>

                <div className="space-y-3">
                  {category.items.map((item, index) => {
                    const uniqueIndex = `${category.originalIndex}-${index}`; // This logic might fail if items are filtered.
                    // Better to use item title or question as part of key if unique.
                    // For state tracking, let's just use the question string as key to be safe across searches.
                    const isOpen = openItems[item.question];

                    return (
                      <div
                        key={item.question}
                        className="bg-white rounded-2xl border border-sage-100 overflow-hidden shadow-sm hover:shadow-md hover:border-sage-200 transition-all duration-300"
                      >
                        <button
                          onClick={() => setOpenItems(prev => ({ ...prev, [item.question]: !prev[item.question] }))}
                          className="w-full flex items-start justify-between p-5 text-left gap-4"
                        >
                          <span className={`font-semibold transition-colors ${isOpen ? 'text-emerald-800' : 'text-sage-800'}`}>
                            {item.question}
                          </span>
                          <div className={`p-1 rounded-full bg-sage-50 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-emerald-50 text-emerald-600' : 'text-sage-400'}`}>
                            <ChevronDown size={20} />
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-6 animate-in slide-in-from-top-2 duration-300">
                            <p className="text-sage-600 leading-relaxed">
                              {item.answer}
                            </p>

                            {item.tip && (
                              <div className="mt-4 bg-amber-50/50 rounded-xl p-4 border border-amber-100 flex gap-4">
                                <div className="p-2 bg-white rounded-full h-fit shadow-sm">
                                  <Sparkles size={16} className="text-amber-500 fill-amber-500" />
                                </div>
                                <div>
                                  <span className="font-bold text-xs uppercase tracking-wider text-amber-800 mb-1 block">
                                    Nani's Tip
                                  </span>
                                  <p className="text-sm text-amber-900/80 font-medium italic">
                                    "{item.tip.replace("Nani's Tip: ", "")}"
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Support Section */}
        <div className="bg-gradient-to-br from-emerald-800 to-sage-800 rounded-3xl p-8 text-white text-center shadow-xl relative overflow-hidden mt-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl -translate-x-12 translate-y-12"></div>

          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <HelpCircle className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-serif font-bold mb-2">Still have questions?</h3>
            <p className="text-sage-100 text-sm mb-6 max-w-xs mx-auto opacity-90">
              Our wise archives are always expanding. Feel free to ask Nani anything during your next consultation.
            </p>
            <button
              onClick={onBack}
              className="bg-white text-emerald-900 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-lg active:scale-95"
            >
              Start a Consultation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
