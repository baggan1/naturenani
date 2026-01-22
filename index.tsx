
import React, { useState, useRef, useEffect, useCallback } from 'react';
// Fixed: Added Menu, BookMarked, and LogOut icon imports. Removed User to avoid shadowing the User type.
import { Send, Lock, PlayCircle, FileText, BookOpen, ChevronDown, ChevronUp, RefreshCw, Sparkles, Leaf, Info, Star, X, ChevronRight, ShieldCheck, Zap, Stethoscope, Utensils, Flower2, HelpCircle, AlertCircle, Mic, Volume2, Bookmark, BookmarkPlus, Save, Check, MessageSquare, Menu, BookMarked, LogOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GoogleGenAI, Modality } from "@google/genai";
// Fixed: Added User type to the imports from ./types.
import { Message, QueryUsage, RemedyDocument, RecommendationMetadata, AppView, SubscriptionStatus, YogaPose, Meal, User } from './types';
import { SYSTEM_INSTRUCTION, MAX_PROMPT_LENGTH } from './utils/constants';
// Fixed: Added logoutUser to the imports from ./services/backendService.
import { searchVectorDatabase, logAnalyticsEvent, saveRemedy, getCurrentUser, getUserLibrary, logoutUser } from './services/backendService';
import { Logo } from './components/Logo';
import { playRawAudio } from './utils/audio';
import AuthForm from './components/AuthForm';
import SubscriptionModal from './components/SubscriptionModal';
import AccountSettings from './components/AccountSettings';
import Library from './components/Library';
import YogaAid from './components/YogaStudio'; 
import NutriHeal from './components/DietKitchen'; 
import { LegalNotice } from './components/LegalNotice';
import { AboutView } from './components/AboutView';
import { FAQView } from './components/FAQView';
import { VoiceConsultation } from './components/VoiceConsultation';

const NANI_VOICE_PROMPT = `
## Voice Identity: The Global Wellness Guide
Tone: Warm, rhythmic, slightly slower than average.
Identity: Wise grandmotherly presence with professional clarity.
Task: Recite the healing protocol provided with audible smiles and comforting pauses.
`;

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const generateEmbedding = async (text: string): Promise<number[] | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: { parts: [{ text }] }
    });
    return response.embeddings?.[0]?.values || null;
  } catch (e) { 
    console.warn("[GeminiService] Embedding failed:", e);
    return null; 
  }
};

const App: React.FC = () => {
  // Fixed: User now correctly refers to the User type.
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Namaste. I am Nature Nani. Tell me what ailments you are experiencing, and I shall look into the ancient wisdom of Naturopathy and Ayurveda for you.',
      timestamp: Date.now()
    }
  ]);

  const [featureContext, setFeatureContext] = useState<any>(null);
  const [subscriptionState, setSubscriptionState] = useState({ hasAccess: false, daysRemaining: 0, isTrialExpired: false, status: 'free' as SubscriptionStatus });
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [queryUsage, setQueryUsage] = useState<QueryUsage>({ count: 0, limit: 3, remaining: 3, isUnlimited: false });

  // Fixed: User now correctly refers to the User type.
  const handleAuthChange = (u: User | null) => {
    setUser(u);
    setShowAuthModal(false);
  };

  // Fixed: logoutUser is now correctly imported and used.
  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  const handleNav = (view: AppView) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const handleFeatureHandoff = (view: AppView, id: string, title: string) => {
    setFeatureContext({ id, title });
    setCurrentView(view);
  };

  const handleLibraryNavigate = (view: string, context: any) => {
    setFeatureContext(context);
    setCurrentView(view === 'YOGA' ? AppView.YOGA : AppView.DIET);
  };

  const handleVoiceConsult = (query: string) => {
    // Implement voice logic if needed
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-sage-50">
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-sage-200 z-30">
        {/* Fixed: Menu icon is now imported. */}
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-sage-700 hover:bg-sage-50 rounded-lg transition-colors"><Menu size={24} /></button>
        <Logo className="h-8 w-8" textClassName="text-xl" showSlogan={false} />
        <div className="w-10"></div>
      </div>

      <div className={`fixed md:relative inset-y-0 left-0 z-50 w-72 md:w-64 bg-white border-r border-sage-200 p-4 flex flex-col justify-between shadow-xl md:shadow-none transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="mb-6 px-2 flex items-center justify-between">
             <Logo className="h-10 w-10" textClassName="text-2xl" showSlogan={false} />
             <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-sage-600 transition-colors"><X size={20} /></button>
          </div>
          
          <div className="space-y-2">
            <button onClick={() => handleNav(AppView.CHAT)} className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center gap-3 transition-colors ${currentView === AppView.CHAT ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}><MessageSquare size={18} /> Consultation</button>
            <button onClick={() => handleNav(AppView.VOICE)} className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center justify-between transition-colors group ${currentView === AppView.VOICE ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}><div className="flex items-center gap-3"><Mic size={18} className="text-sage-600 group-hover:animate-pulse" /> Voice Mode</div></button>
            <div className="pt-4 pb-2">
              <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">Healing Aids</p>
              <button onClick={() => handleNav(AppView.YOGA)} className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center justify-between transition-colors ${currentView === AppView.YOGA ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}><div className="flex items-center gap-3"><Flower2 size={18} className="text-pink-500" /> Yoga Aid</div></button>
              <button onClick={() => handleNav(AppView.DIET)} className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center justify-between transition-colors ${currentView === AppView.DIET ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}><div className="flex items-center gap-3"><Utensils size={18} className="text-orange-500" /> Nutri Heal</div></button>
            </div>
            {/* Fixed: BookMarked icon is now imported. */}
            <button onClick={() => handleNav(AppView.LIBRARY)} className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center justify-between transition-colors ${currentView === AppView.LIBRARY ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}><div className="flex items-center gap-3"><BookMarked size={18} className="text-blue-500" /> Saved Library</div></button>
          </div>
        </div>

        <div className="pt-4 border-t border-sage-100">
          {user ? (
            <div className="px-2">
              <button onClick={() => handleNav(AppView.ACCOUNT)} className="w-full flex items-center gap-3 p-2 mb-2 bg-sage-50/50 rounded-xl hover:bg-sage-100 transition-all text-left group">
                <div className="w-8 h-8 rounded-full bg-sage-600 flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
                  {user.name?.[0] || user.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-sage-900 truncate">{user.name || 'User'}</p>
                </div>
              </button>
              {/* Fixed: LogOut icon is now imported. */}
              <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors text-xs px-2 w-full py-2"><LogOut size={14} /> Sign Out</button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="w-full bg-sage-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-sage-700 transition-colors shadow-lg">Sign In</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
