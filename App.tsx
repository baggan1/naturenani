
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { User, AppView, QueryUsage, FeatureContext, Message } from './types';
import { checkSubscriptionStatus, getCurrentUser, logoutUser, warmupDatabase, getUserSearchHistory, checkDailyQueryLimit, setupAuthListener } from './services/backendService';
import AuthForm from './components/AuthForm';
import ChatInterface from './components/ChatInterface';
import SubscriptionModal from './components/SubscriptionModal';
import AccountSettings from './components/AccountSettings';
import Library from './components/Library';
import YogaAid from './components/YogaStudio'; 
import NutriHeal from './components/DietKitchen'; 
import { Logo } from './components/Logo';
import { LogOut, MessageSquare, History, UserCircle, Utensils, Flower2, Lock, Menu, X, ChevronRight, Sparkles, BookMarked, Leaf } from 'lucide-react';
import { DAILY_QUERY_LIMIT } from './utils/constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const authInitialized = useRef(false);
  
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Namaste. I am Nature Nani. Tell me what ailments you are experiencing, and I shall look into the ancient wisdom of Ayurveda and Naturopathy for you.',
      timestamp: Date.now()
    }
  ]);

  const [featureContext, setFeatureContext] = useState<FeatureContext | null>(null);
  const [subscriptionState, setSubscriptionState] = useState({ hasAccess: true, daysRemaining: 30, isTrialExpired: false });
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [triggerQuery, setTriggerQuery] = useState<string>('');
  
  const [queryUsage, setQueryUsage] = useState<QueryUsage>({ count: 0, limit: DAILY_QUERY_LIMIT, remaining: DAILY_QUERY_LIMIT, isUnlimited: false });

  const refreshAppData = useCallback(async (u: User) => {
    try {
      const [usage, history, subStatus] = await Promise.all([
        checkDailyQueryLimit(u),
        getUserSearchHistory(u),
        checkSubscriptionStatus(u)
      ]);
      setQueryUsage(usage);
      setSearchHistory(history);
      setSubscriptionState({ hasAccess: subStatus.hasAccess, daysRemaining: subStatus.daysRemaining, isTrialExpired: !subStatus.hasAccess });
      if (!subStatus.hasAccess) setShowPaywall(true);
    } catch (err) {
      console.error("[App] Data refresh failed:", err);
    }
  }, []);

  const handleAuthSuccess = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    setShowAuthModal(false);
    refreshAppData(loggedInUser);
  }, [refreshAppData]);

  useEffect(() => {
    if (!authInitialized.current) {
      authInitialized.current = true;
      warmupDatabase();
      const u = getCurrentUser();
      if (u) refreshAppData(u);
      setupAuthListener(handleAuthSuccess);
    }
  }, [handleAuthSuccess, refreshAppData]);

  const handleHistoryClick = (query: string) => {
    setTriggerQuery(query);
    setCurrentView(AppView.CHAT);
    setIsMobileMenuOpen(false);
  };

  const handleNav = (view: AppView, isPremium = false) => {
    if (isPremium && (!user || !user.is_subscribed)) {
      setShowPaywall(true);
      return;
    }
    if (!user && (view === AppView.ACCOUNT || view === AppView.LIBRARY)) {
      setShowAuthModal(true);
      return;
    }
    setCurrentView(view);
    setFeatureContext(null);
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

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-sage-50">
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-sage-200 z-30">
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-sage-700 hover:bg-sage-50 rounded-lg transition-colors"><Menu size={24} /></button>
        <Logo className="h-8 w-8" textClassName="text-xl" />
        <div className="w-10"></div>
      </div>

      <div className={`fixed md:relative inset-y-0 left-0 z-50 w-72 md:w-64 bg-white border-r border-sage-200 p-4 flex flex-col justify-between shadow-xl md:shadow-none transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="mb-6 px-2 flex items-center justify-between">
             <Logo className="h-10 w-10" textClassName="text-2xl" />
             <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-sage-600 transition-colors"><X size={20} /></button>
          </div>
          
          <div className="space-y-2">
            <button 
              onClick={() => handleNav(AppView.CHAT)} 
              className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center gap-3 transition-colors ${currentView === AppView.CHAT ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <MessageSquare size={18} /> Consultation
            </button>
            
            <div className="pt-4 pb-2">
              <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                Healing Aids {user?.is_subscribed && <Sparkles size={10} className="text-yellow-500" />}
              </p>
              <button 
                onClick={() => handleNav(AppView.YOGA, true)} 
                className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center justify-between transition-colors ${currentView === AppView.YOGA ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <Flower2 size={18} className="text-pink-500" /> Yoga Aid
                </div>
                {!user?.is_subscribed && <Lock size={12} className="text-gray-400" />}
              </button>
              <button 
                onClick={() => handleNav(AppView.DIET, true)} 
                className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center justify-between transition-colors ${currentView === AppView.DIET ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <Utensils size={18} className="text-orange-500" /> Nutri Heal
                </div>
                {!user?.is_subscribed && <Lock size={12} className="text-gray-400" />}
              </button>
            </div>

            <button 
              onClick={() => handleNav(AppView.LIBRARY, true)} 
              className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center justify-between transition-colors ${currentView === AppView.LIBRARY ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">
                <BookMarked size={18} className="text-blue-500" /> Saved Library
              </div>
              {!user?.is_subscribed && <Lock size={12} className="text-gray-400" />}
            </button>

            {searchHistory.length > 0 && (
              <div className="pt-4 pb-2 animate-in fade-in slide-in-from-left-4 duration-500">
                <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <History size={12} /> Recent Wisdom
                </p>
                <div className="space-y-1">
                  {searchHistory.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistoryClick(query)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-sage-50 rounded-lg flex items-center justify-between group transition-colors"
                    >
                      <span className="truncate pr-2">{query}</span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-sage-400 transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={() => handleNav(AppView.ACCOUNT)} 
              className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center gap-3 transition-colors ${currentView === AppView.ACCOUNT ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <UserCircle size={18} /> Account
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-sage-100">
          {user ? (
            <div className="px-2">
              <div className="flex items-center gap-3 p-2 mb-2 bg-sage-50/50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-sage-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {user.name?.[0] || user.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-sage-900 truncate">{user.name || 'User'}</p>
                  <p className="text-[10px] text-gray-400 truncate uppercase tracking-tighter">{user.is_subscribed ? 'Evergreen Plan' : 'Seedling Access'}</p>
                </div>
              </div>
              <button 
                onClick={logoutUser} 
                className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors text-xs px-2 w-full py-2"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-sage-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-sage-700 transition-colors shadow-lg shadow-sage-200"
            >
              Sign In
            </button>
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
            initialMessage={triggerQuery} 
            onMessageSent={() => {
              if (user) refreshAppData(user);
              setTriggerQuery(''); 
            }} 
            usage={queryUsage} 
            isSubscribed={user?.is_subscribed || false} 
            onUpgradeClick={() => setShowPaywall(true)} 
            isGuest={!user} 
            onShowAuth={() => setShowAuthModal(true)} 
            onNavigateToFeature={handleFeatureHandoff} 
          />
        </div>
        {currentView === AppView.ACCOUNT && user && <AccountSettings user={user} onUpgrade={() => setShowPaywall(true)} onLogout={logoutUser} />}
        {currentView === AppView.LIBRARY && user && <Library user={user} onNavigate={handleLibraryNavigate} />}
        {currentView === AppView.YOGA && <YogaAid activeContext={featureContext} />}
        {currentView === AppView.DIET && <NutriHeal activeContext={featureContext} />}
      </div>

      <AuthForm isOpen={showAuthModal} onAuthSuccess={handleAuthSuccess} onClose={() => setShowAuthModal(false)} />
      <SubscriptionModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} isTrialExpired={subscriptionState.isTrialExpired} daysRemaining={subscriptionState.daysRemaining} />
    </div>
  );
};

export default App;
