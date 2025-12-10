import React, { useEffect, useState } from 'react';
import { User, AppView, QueryUsage } from './types';
import { checkSubscriptionStatus, getCurrentUser, logoutUser, warmupDatabase, getUserSearchHistory, checkDailyQueryLimit } from './services/backendService';
import AuthForm from './components/AuthForm';
import ChatInterface from './components/ChatInterface';
import SubscriptionModal from './components/SubscriptionModal';
import AccountSettings from './components/AccountSettings';
import { LogOut, MessageSquare, History, UserCircle, Unlock, LogIn } from 'lucide-react';
import { TRIAL_DAYS, DAILY_QUERY_LIMIT } from './utils/constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [subscriptionState, setSubscriptionState] = useState({
    hasAccess: false,
    daysRemaining: TRIAL_DAYS,
    isTrialExpired: false
  });
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [triggerQuery, setTriggerQuery] = useState<string>('');
  
  // Usage tracking for Triage Plan
  const [queryUsage, setQueryUsage] = useState<QueryUsage>({
    count: 0,
    limit: DAILY_QUERY_LIMIT,
    remaining: DAILY_QUERY_LIMIT,
    isUnlimited: false
  });

  // Initialize App
  useEffect(() => {
    warmupDatabase();

    const existingUser = getCurrentUser();
    if (existingUser) {
      setUser(existingUser);
      validateSubscription(existingUser);
      fetchHistory(existingUser);
      refreshUsage(existingUser);
    }
    // Note: We no longer force <AuthForm> if user is null. We let them enter "Guest/Lazy" mode.
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
    // Don't force redirect, just reload to guest state
    window.location.reload();
  };

  const handleHistoryClick = (query: string) => {
    setTriggerQuery(query);
    setCurrentView(AppView.CHAT);
  };

  const handleMessageSent = () => {
    setTriggerQuery(''); // Reset trigger
    if (user) {
      fetchHistory(user); // Refresh sidebar
      refreshUsage(user); // Update limit counter
    }
  };

  const handleShowAuth = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-sage-100">
      
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-sage-200 p-4 justify-between shadow-sm z-10">
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <h2 className="font-serif font-bold text-xl text-sage-800 mb-6 px-2">Nature Nani</h2>
          <div className="space-y-2">
            <button 
              onClick={() => setCurrentView(AppView.CHAT)}
              className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                currentView === AppView.CHAT 
                  ? 'bg-sage-100 text-sage-800' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MessageSquare size={18} />
              Consultation
            </button>
            <button 
              onClick={() => {
                if (user) setCurrentView(AppView.ACCOUNT);
                else setShowAuthModal(true);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                currentView === AppView.ACCOUNT 
                  ? 'bg-sage-100 text-sage-800' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <UserCircle size={18} />
              Account
            </button>
          </div>

          {/* Search History Section */}
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
              onClick={() => setShowPaywall(true)}
              className="w-full bg-earth-600 text-white text-xs font-bold py-2 rounded-lg mb-3 hover:bg-earth-700 transition-colors shadow-sm"
            >
              Unlock Unlimited Access
            </button>
          )}

          {user ? (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors text-sm px-2 w-full"
            >
              <LogOut size={16} /> Sign Out
            </button>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 text-sage-600 hover:text-sage-800 transition-colors font-bold text-sm px-2 w-full"
            >
              <LogIn size={16} /> Sign In
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full relative">
        {currentView === AppView.CHAT ? (
          <ChatInterface 
            onTrialEnd={() => setShowPaywall(true)}
            hasAccess={user ? subscriptionState.hasAccess : true} // Allow guests to type, block on send
            initialMessage={triggerQuery}
            onMessageSent={handleMessageSent}
            usage={queryUsage}
            isSubscribed={user ? user.is_subscribed : false}
            onUpgradeClick={() => setShowPaywall(true)}
            isGuest={!user}
            onShowAuth={handleShowAuth}
          />
        ) : (
          user ? (
            <AccountSettings user={user} onUpgrade={() => setShowPaywall(true)} onLogout={handleLogout} />
          ) : <div className="p-10 text-center">Please log in to view account settings.</div>
        )}
      </div>

      {/* Modals */}
      <AuthForm 
        isOpen={showAuthModal}
        onAuthSuccess={handleAuthSuccess}
        onClose={() => setShowAuthModal(false)}
      />

      <SubscriptionModal 
        isOpen={showPaywall} 
        isTrialExpired={subscriptionState.isTrialExpired}
        daysRemaining={subscriptionState.daysRemaining}
      />
    </div>
  );
};

export default App;