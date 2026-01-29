
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Send, Lock, PlayCircle, FileText, BookOpen, ChevronDown, ChevronUp, RefreshCw, Sparkles, Leaf, Info, Star, X, ChevronRight, ShieldCheck, Zap, Stethoscope, Utensils, Flower2, HelpCircle, AlertCircle, Mic, Volume2, Bookmark, BookmarkPlus, Save, Check, MessageSquare, Menu, BookMarked, LogOut, UserCircle, History, TreePine, Sprout, ShieldAlert } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GoogleGenAI, Modality } from "@google/genai";
import { Message, QueryUsage, RemedyDocument, RecommendationMetadata, AppView, SubscriptionStatus, YogaPose, Meal, User, FeatureContext } from './types';
import { SYSTEM_INSTRUCTION, MAX_PROMPT_LENGTH, DAILY_QUERY_LIMIT } from './utils/constants';
import { searchVectorDatabase, logAnalyticsEvent, saveRemedy, getCurrentUser, getUserLibrary, logoutUser, warmupDatabase, checkDailyQueryLimit, getUserSearchHistory, checkSubscriptionStatus, setupAuthListener, fetchUserRecord } from './services/backendService';
import { Logo } from './components/Logo';
import { playRawAudio } from './utils/audio';
import AuthForm from './components/AuthForm';
import SubscriptionModal from './components/SubscriptionModal';
import AccountSettings from './components/AccountSettings';
import Library from './components/Library';
import YogaAid from './components/YogaStudio'; 
import NutriHeal from './components/DietKitchen'; 
import BotanicalRx from './components/BotanicalRx';
import { LegalNotice } from './components/LegalNotice';
import { AboutView } from './components/AboutView';
import { FAQView } from './components/FAQView';
import { VoiceConsultation } from './components/VoiceConsultation';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const authInitialized = useRef(false);
  
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Namaste. I am Nature Nani. Tell me what ailments you are experiencing. To give you the best wisdom from our scrolls, please share your age, sex, and any health history you wish to share.',
      timestamp: Date.now()
    }
  ]);

  const [featureContext, setFeatureContext] = useState<FeatureContext | null>(null);
  const [subscriptionState, setSubscriptionState] = useState({ hasAccess: false, daysRemaining: 0, isTrialExpired: false, status: 'free' as SubscriptionStatus });
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [triggerQuery, setTriggerQuery] = useState<string>('');
  const [isVoiceTrigger, setIsVoiceTrigger] = useState(false);
  const [queryUsage, setQueryUsage] = useState<QueryUsage>({ count: 0, limit: DAILY_QUERY_LIMIT, remaining: DAILY_QUERY_LIMIT, isUnlimited: false });

  const refreshAppData = useCallback(async (u: User) => {
    try {
      const freshUser = await fetchUserRecord(u.email);
      const activeUser = freshUser || u;
      if (freshUser) setUser(freshUser);

      const [usage, history, subStatus] = await Promise.all([
        checkDailyQueryLimit(activeUser),
        getUserSearchHistory(activeUser),
        checkSubscriptionStatus(activeUser)
      ]);
      
      setQueryUsage(usage);
      setSearchHistory(history);
      setSubscriptionState({ 
        hasAccess: subStatus.hasAccess, 
        daysRemaining: subStatus.daysRemaining, 
        isTrialExpired: subStatus.isTrialExpired,
        status: subStatus.status as SubscriptionStatus
      });
    } catch (err) {
      console.error("[App] Data refresh failed:", err);
    }
  }, []);

  const handleAuthChange = useCallback((u: User | null) => {
    if (u) {
      setUser(u);
      setShowAuthModal(false);
      refreshAppData(u);
    } else {
      setUser(null);
      setSearchHistory([]);
      setQueryUsage({ count: 0, limit: DAILY_QUERY_LIMIT, remaining: DAILY_QUERY_LIMIT, isUnlimited: false });
      setSubscriptionState({ hasAccess: false, daysRemaining: 0, isTrialExpired: false, status: 'free' as SubscriptionStatus });
      setCurrentView(AppView.CHAT);
    }
  }, [refreshAppData]);

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    handleAuthChange(null);
    await logoutUser();
  };

  useEffect(() => {
    if (!authInitialized.current) {
      authInitialized.current = true;
      warmupDatabase();
      const u = getCurrentUser();
      if (u) refreshAppData(u);
      setupAuthListener(handleAuthChange);
    }
  }, [handleAuthChange, refreshAppData]);

  const handleNav = (view: AppView, isPremiumFeature = false) => {
    if (isPremiumFeature && !subscriptionState.hasAccess) {
      setShowPaywall(true);
      return;
    }
    if (!user && (view === AppView.ACCOUNT || view === AppView.LIBRARY || view === AppView.VOICE)) {
      setShowAuthModal(true);
      return;
    }
    setCurrentView(view);
    setFeatureContext(null);
    setIsMobileMenuOpen(false);
    setShowAuthModal(false); 
  };

  const handleFeatureHandoff = (view: AppView, context: FeatureContext) => {
    const isPremiumView = [AppView.YOGA, AppView.DIET, AppView.LIBRARY, AppView.BOTANICAL].includes(view);
    if (isPremiumView && !subscriptionState.hasAccess) {
      setShowPaywall(true);
      return;
    }
    setFeatureContext(context);
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const handleVoiceConsult = (query: string) => {
    setTriggerQuery(query);
    setIsVoiceTrigger(true); 
    setCurrentView(AppView.CHAT);
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-sage-50">
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-sage-200 z-30">
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
            <button onClick={() => handleNav(AppView.VOICE, false)} className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center justify-between transition-colors group ${currentView === AppView.VOICE ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}><div className="flex items-center gap-3"><Mic size={18} className="text-sage-600 group-hover:animate-pulse" /> Voice Mode</div></button>
            <div className="pt-4 pb-2">
              <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">Healing Aids {subscriptionState.hasAccess && <Sparkles size={10} className="text-yellow-500" />}</p>
              <button onClick={() => handleNav(AppView.BOTANICAL, true)} className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center justify-between transition-colors ${currentView === AppView.BOTANICAL ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}><div className="flex items-center gap-3"><Leaf size={18} className="text-blue-500" /> Botanical Rx</div>{!subscriptionState.hasAccess && <Lock size={12} className="text-gray-400" />}</button>
              <button onClick={() => handleNav(AppView.YOGA, true)} className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center justify-between transition-colors ${currentView === AppView.YOGA ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}><div className="flex items-center gap-3"><Flower2 size={18} className="text-pink-500" /> Yoga Aid</div>{!subscriptionState.hasAccess && <Lock size={12} className="text-gray-400" />}</button>
              <button onClick={() => handleNav(AppView.DIET, true)} className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center justify-between transition-colors ${currentView === AppView.DIET ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}><div className="flex items-center gap-3"><Utensils size={18} className="text-orange-500" /> Nutri Heal</div>{!subscriptionState.hasAccess && <Lock size={12} className="text-gray-400" />}</button>
            </div>
            <button onClick={() => handleNav(AppView.LIBRARY, true)} className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center justify-between transition-colors ${currentView === AppView.LIBRARY ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}><div className="flex items-center gap-3"><BookMarked size={18} className="text-blue-500" /> Saved Library</div>{!subscriptionState.hasAccess && <Lock size={12} className="text-gray-400" />}</button>
            
            <div className="pt-4 pb-2">
              <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Information</p>
              <button onClick={() => handleNav(AppView.ABOUT)} className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center gap-3 transition-colors ${currentView === AppView.ABOUT ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}><Info size={18} /> About NatureNani</button>
              <button onClick={() => handleNav(AppView.FAQ)} className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center gap-3 transition-colors ${currentView === AppView.FAQ ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}><HelpCircle size={18} /> FAQ</button>
              <button onClick={() => handleNav(AppView.LEGAL)} className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center gap-3 transition-colors ${currentView === AppView.LEGAL ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}><ShieldAlert size={18} /> Medical Disclaimer</button>
            </div>
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
              <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors text-xs px-2 w-full py-2"><LogOut size={14} /> Sign Out</button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="w-full bg-sage-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-sage-700 transition-colors shadow-lg">Sign In</button>
          )}
        </div>
      </div>

      <div className="flex-1 h-full relative overflow-hidden">
        <div className={`h-full w-full ${currentView === AppView.CHAT ? 'block' : 'hidden'}`}>
          <ChatInterface 
            messages={chatMessages} 
            setMessages={setChatMessages} 
            onTrialEnd={() => setShowPaywall(true)} 
            hasAccess={subscriptionState.hasAccess} 
            subscriptionStatus={subscriptionState.status}
            initialMessage={triggerQuery} 
            onMessageSent={() => {
              if (user) refreshAppData(user);
              setTriggerQuery(''); 
              setIsVoiceTrigger(false);
            }} 
            usage={queryUsage} 
            onUpgradeClick={() => setShowPaywall(true)} 
            isGuest={!user} 
            onShowAuth={() => setShowAuthModal(true)} 
            onNavigateToFeature={handleFeatureHandoff}
            onVoiceClick={() => handleNav(AppView.VOICE, false)}
            initialMessageIsVoice={isVoiceTrigger}
          />
        </div>
        {currentView === AppView.ACCOUNT && user && (
          <AccountSettings user={user} onUpgrade={() => setShowPaywall(true)} onLogout={handleLogout} onRefresh={() => refreshAppData(user)} />
        )}
        {currentView === AppView.LIBRARY && user && <Library user={user} onNavigate={handleFeatureHandoff} />}
        {currentView === AppView.BOTANICAL && <BotanicalRx activeContext={featureContext} />}
        {currentView === AppView.YOGA && <YogaAid activeContext={featureContext} />}
        {currentView === AppView.DIET && <NutriHeal activeContext={featureContext} />}
        {currentView === AppView.LEGAL && <LegalNotice onBack={() => setCurrentView(AppView.CHAT)} />}
        {currentView === AppView.ABOUT && <AboutView onBack={() => setCurrentView(AppView.CHAT)} />}
        {currentView === AppView.FAQ && <FAQView onBack={() => setCurrentView(AppView.CHAT)} />}
        {currentView === AppView.VOICE && <VoiceConsultation onClose={() => setCurrentView(AppView.CHAT)} onSubmit={handleVoiceConsult} />}
      </div>

      <AuthForm isOpen={showAuthModal} onAuthSuccess={(u) => handleAuthChange(u)} onClose={() => setShowAuthModal(false)} onNavigate={(view) => handleNav(view)} />
      <SubscriptionModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} isTrialExpired={subscriptionState.isTrialExpired} daysRemaining={subscriptionState.daysRemaining} subscriptionStatus={subscriptionState.status} onRefreshUser={() => user && refreshAppData(user)} />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
