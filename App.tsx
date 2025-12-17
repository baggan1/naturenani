
import React, { useEffect, useState } from 'react';
import { User, AppView, QueryUsage, FeatureContext, Message } from './types';
import { checkSubscriptionStatus, getCurrentUser, logoutUser, warmupDatabase, getUserSearchHistory, checkDailyQueryLimit, setupAuthListener } from './services/backendService';
import AuthForm from './components/AuthForm';
import ChatInterface from './components/ChatInterface';
import SubscriptionModal from './components/SubscriptionModal';
import AccountSettings from './components/AccountSettings';
import YogaStudio from './components/YogaStudio';
import DietKitchen from './components/DietKitchen';
import { Logo } from './components/Logo';
import { LogOut, MessageSquare, History, UserCircle, Unlock, LogIn, Utensils, Flower2, Lock, Menu, X } from 'lucide-react';
import { TRIAL_DAYS, DAILY_QUERY_LIMIT } from './utils/constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Chat State (Lifted Up for Persistence)
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Namaste. I am Nature Nani. Tell me what ailments or discomforts you are experiencing, and I shall look into the ancient wisdom of Ayurveda and Naturopathy for you.',
      timestamp: Date.now()
    }
  ]);

  // Hand-off State: Passes ID from Chat to Premium Feature
  const [featureContext, setFeatureContext] = useState<FeatureContext | null>(null);

  const [subscriptionState, setSubscriptionState] = useState({
    hasAccess: false,
    daysRemaining: TRIAL_DAYS,
    isTrialExpired: false
  });
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [triggerQuery, setTriggerQuery] = useState<string>('');
  
  const [queryUsage, setQueryUsage] = useState<QueryUsage>({
    count: 0,
    limit: DAILY_QUERY_LIMIT,
    remaining: DAILY_QUERY_LIMIT,
    isUnlimited: false
  });

  useEffect(() => {
    warmupDatabase();

    const existingUser = getCurrentUser();
    if (existingUser) {
      setUser(existingUser);
      validateSubscription(existingUser);
      fetchHistory(existingUser);
      refreshUsage(existingUser);
    }

    const unsubscribe = setupAuthListener((loggedInUser) => {
      setUser(prev => {
        if (prev?.id === loggedInUser.id) return prev;
        handleAuthSuccess(loggedInUser);
        return loggedInUser;
      });
    });

    return () => {
      unsubscribe();
    }
  }, []);

  const fetchHistory = async (currentUser: User) => {
    const history = await getUserSearchHistory(currentUser);
    setSearchHistory(history);
  };

  const refreshUsage = async (currentUser: User) => {
    const usage = await checkDailyQueryLimit(currentUser);
    setQueryUsage(usage);
  };

  const validateSubscription = async (currentUser: User) => {
    const status = await checkSubscriptionStatus(currentUser);
    setSubscriptionState({
      hasAccess: status.hasAccess,
      daysRemaining: status.daysRemaining,
      isTrialExpired: !status.hasAccess
    });
    
    if (!status.hasAccess) {
      setShowPaywall(true);
    }
  };

  const handleAuthSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setShowAuthModal(false);
    validateSubscription(loggedInUser);
    fetchHistory(loggedInUser);
    refreshUsage(loggedInUser);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setSearchHistory([]);
    setQueryUsage({
        count: 0,
        limit: DAILY_QUERY_LIMIT,
        remaining: DAILY_QUERY_LIMIT,
        isUnlimited: false
    });
    // Reset chat on logout
    setChatMessages([{
      id: 'welcome',
      role: 'model',
      content: 'Namaste. I am Nature Nani. Tell me what ailments or discomforts you are experiencing.',
      timestamp: Date.now()
    }]);
    window.location.reload();
  };

  const handleHistoryClick = (query: string) => {
    setTriggerQuery(query);
    setCurrentView(AppView.CHAT);
    setIsMobileMenuOpen(false);
  };

  const handleMessageSent = () => {
    setTriggerQuery(''); 
    if (user) {
      fetchHistory(user); 
      refreshUsage(user); 
    }
  };

  const handleShowAuth = () => {
    setShowAuthModal(true);
    setIsMobileMenuOpen(false);
  };

  const handlePremiumNav = (view: AppView) => {
    if (user && user.is_subscribed) {
      setCurrentView(view);
      setFeatureContext(null);
      setIsMobileMenuOpen(false);
    } else {
      setShowPaywall(true);
    }
  };

  const handleNav = (view: AppView) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  // Called from Chat Interface to handoff to premium feature
  const handleFeatureHandoff = (view: AppView, id: string, title: string) => {
    setFeatureContext({ id, title });
    setCurrentView(view);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-sage-100">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-sage-200 z-30">
        <button 
          onClick={toggleMobileMenu}
          className="p-2 text-sage-700 hover:bg-sage-50 rounded-lg"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <Logo className="h-8 w-8" textClassName="text-xl" />
        <div className="w-10"></div> {/* Spacer for symmetry */}
      </div>

      {/* Backdrop for Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar / Navigation Drawer */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50 w-72 md:w-64 bg-white border-r border-sage-200 p-4 flex flex-col justify-between shadow-xl md:shadow-none transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="mb-6 px-2 flex items-center justify-between">
             <Logo className="h-10 w-10" textClassName="text-2xl" />
             <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-gray-400">
               <X size={20} />
             </button>
          </div>
          
          <div className="space-y-2">
            <button 
              onClick={() => handleNav(AppView.CHAT)}
              className={`w-full text-left px-4 py-3 md:py-2 rounded-xl md:rounded-lg font-medium flex items-center gap-3 transition-colors ${
                currentView === AppView.CHAT 
                  ? 'bg-sage-100 text-sage-800' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MessageSquare size={18} />
              Consultation
            </button>
            
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Premium Tools</p>
              
              <button 
                onClick={() => handlePremiumNav(AppView.YOGA)}
                className={`w-full text-left px-4 py-3 md:py-2 rounded-xl md:rounded-lg font-medium flex items-center justify-between transition-colors group ${
                  currentView === AppView.YOGA
                    ? 'bg-sage-100 text-sage-800' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                   <Flower2 size={18} className="text-pink-500" /> Yoga Studio
                </div>
                {!user?.is_subscribed && <Lock size={12} className="text-gray-400 group-hover:text-earth-600" />}
              </button>
              
              <button 
                onClick={() => handlePremiumNav(AppView.DIET)}
                className={`w-full text-left px-4 py-3 md:py-2 rounded-xl md:rounded-lg font-medium flex items-center justify-between transition-colors group ${
                  currentView === AppView.DIET
                    ? 'bg-sage-100 text-sage-800' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                   <Utensils size={18} className="text-orange-500" /> Ayurvedic Kitchen
                </div>
                {!user?.is_subscribed && <Lock size={12} className="text-gray-400 group-hover:text-earth-600" />}
              </button>
            </div>

            <button 
              onClick={() => {
                if (user) handleNav(AppView.ACCOUNT);
                else handleShowAuth();
              }}
              className={`w-full text-left px-4 py-3 md:py-2 rounded-xl md:rounded-lg font-medium flex items-center gap-3 transition-colors ${
                currentView === AppView.ACCOUNT 
                  ? 'bg-sage-100 text-sage-800' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <UserCircle size={18} />
              Account
            </button>
          </div>

          <div className="mt-8">
            <h3 className="text-xs font-bold text-sage-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-1">
              <History size={12} /> Recent Topics
            </h3>
            {user && searchHistory.length > 0 ? (
              <div className="space-y-1">
                {searchHistory.map((q, i) => (
                  <button 
                    key={i}
                    onClick={() => handleHistoryClick(q)}
                    className="w-full text-left px-3 py-2 text-sm text-sage-700 hover:bg-sage-50 rounded-lg truncate transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 px-3 italic">
                {user ? (!user.is_subscribed ? "History limited to 24h" : "No recent topics") : "Sign in to save history"}
              </p>
            )}
          </div>
        </div>
        
        <div className="pt-4 border-t border-sage-100">
          {user && (
            <div className="mb-4 p-3 bg-earth-50 rounded-lg border border-earth-100">
              <p className="text-xs text-earth-800 font-bold uppercase mb-1 flex items-center gap-1">
                {user.is_subscribed ? (
                  <> <Unlock size={12} /> Healer Plan </>
                ) : (
                  <> <span className="w-2 h-2 rounded-full bg-gray-400"></span> Triage Plan </>
                )}
              </p>
              <p className="text-xs text-gray-600 leading-tight">
                {user.is_subscribed 
                  ? 'Unlimited Access & Visuals' 
                  : `${queryUsage.remaining} queries left today`}
              </p>
            </div>
          )}

          {user && !user.is_subscribed && (
            <button 
              onClick={() => {
                setShowPaywall(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full bg-earth-600 text-white text-xs font-bold py-3 md:py-2 rounded-xl md:rounded-lg mb-3 hover:bg-earth-700 transition-colors shadow-sm"
            >
              Upgrade to Premium
            </button>
          )}

          {user ? (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors text-sm px-2 w-full py-2"
            >
              <LogOut size={16} /> Sign Out
            </button>
          ) : (
            <button 
              onClick={handleShowAuth}
              className="flex items-center gap-2 text-sage-600 hover:text-sage-800 transition-colors font-bold text-sm px-2 w-full py-2"
            >
              <LogIn size={16} /> Sign In
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full relative overflow-hidden">
        {/* We keep ChatInterface mounted but hidden to persist history and scroll position */}
        <div className={`h-full w-full ${currentView === AppView.CHAT ? 'block' : 'hidden'}`}>
          <ChatInterface 
            messages={chatMessages}
            setMessages={setChatMessages}
            onTrialEnd={() => setShowPaywall(true)}
            hasAccess={user ? subscriptionState.hasAccess : true}
            initialMessage={triggerQuery}
            onMessageSent={handleMessageSent}
            usage={queryUsage}
            isSubscribed={user ? user.is_subscribed : false}
            onUpgradeClick={() => setShowPaywall(true)}
            isGuest={!user}
            onShowAuth={handleShowAuth}
            onNavigateToFeature={handleFeatureHandoff}
            isMobileView={true} 
          />
        </div>
        
        {currentView === AppView.ACCOUNT && (
          user ? (
            <AccountSettings user={user} onUpgrade={() => setShowPaywall(true)} onLogout={handleLogout} />
          ) : <div className="p-10 text-center">Please log in to view account settings.</div>
        )}

        {/* Premium Views with Context */}
        {currentView === AppView.YOGA && <YogaStudio activeContext={featureContext} />}
        {currentView === AppView.DIET && <DietKitchen activeContext={featureContext} />}

      </div>

      <AuthForm 
        isOpen={showAuthModal}
        onAuthSuccess={handleAuthSuccess}
        onClose={() => setShowAuthModal(false)}
      />

      <SubscriptionModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)}
        isTrialExpired={subscriptionState.isTrialExpired}
        daysRemaining={subscriptionState.daysRemaining}
      />
    </div>
  );
};

export default App;
