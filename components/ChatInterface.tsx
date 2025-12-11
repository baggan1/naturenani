import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot, Lock, PlayCircle, FileText } from 'lucide-react';
import { Message, QueryUsage } from '../types';
import { sendMessageWithRAG } from '../services/geminiService';

interface ChatInterfaceProps {
  onTrialEnd: () => void;
  hasAccess: boolean;
  initialMessage?: string;
  onMessageSent?: () => void;
  usage: QueryUsage;
  isSubscribed: boolean;
  onUpgradeClick: () => void;
  isGuest: boolean;
  onShowAuth: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onTrialEnd, 
  hasAccess, 
  initialMessage, 
  onMessageSent, 
  usage,
  isSubscribed,
  onUpgradeClick,
  isGuest,
  onShowAuth
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Namaste. I am Nature Nani. Tell me what ailments or discomforts you are experiencing, and I shall look into the ancient wisdom of Ayurveda and Naturopathy for you.',
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Lazy Auth State
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]); 

  // --- Session Persistence for Google OAuth Redirects ---
  useEffect(() => {
    // Check if we returned from a Google Login redirect with a pending message
    const savedPending = sessionStorage.getItem('nani_pending_message');
    if (savedPending && !isGuest) {
      // User just logged in and had a message waiting
      handleAutoSend(savedPending, true);
      sessionStorage.removeItem('nani_pending_message');
    }
  }, [isGuest]);

  // Handle sidebar history click
  useEffect(() => {
    if (initialMessage && initialMessage.trim() !== '') {
      handleAutoSend(initialMessage);
    }
  }, [initialMessage]);

  // Lazy Auth Effect: If we have a pending message in state (from same session) and user logged in
  useEffect(() => {
    if (!isGuest && pendingMessage) {
      handleAutoSend(pendingMessage, true);
      setPendingMessage(null);
      sessionStorage.removeItem('nani_pending_message');
    }
  }, [isGuest, pendingMessage]);

  const handleAutoSend = async (text: string, isResuming = false) => {
    // 1. Hook: Lazy Auth for Guests
    if (isGuest) {
      setPendingMessage(text);
      sessionStorage.setItem('nani_pending_message', text); // Persist for redirect flow
      
      // Hook: Show the user's message immediately
      setMessages(prev => [...prev, {
        id: 'guest-' + Date.now(),
        role: 'user',
        content: text,
        timestamp: Date.now()
      }]);

      // Visual: Fake "Thinking" state
      setIsLoading(true);

      // Gate: Pop the modal after a short delay
      setTimeout(() => {
        setIsLoading(false);
        onShowAuth();
      }, 1200);
      
      return;
    }

    if (isLoading || !hasAccess || (!usage.isUnlimited && usage.remaining <= 0)) return;
    
    // 2. Add user message (Only if not resuming from a guest state where we already added it)
    if (!isResuming) {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, userMessage]);
    }
    
    setIsLoading(true);

    try {
      const stream = sendMessageWithRAG(text);
      const botMessageId = crypto.randomUUID();
      let fullContent = '';
      
      // Add placeholder for bot message
      setMessages(prev => [...prev, {
        id: botMessageId,
        role: 'model',
        content: '',
        timestamp: Date.now()
      }]);

      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId ? { ...msg, content: fullContent } : msg
        ));
      }
      
      if (onMessageSent) onMessageSent();
      
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await handleAutoSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Limit Reached Card
  if (!isGuest && !usage.isUnlimited && usage.remaining <= 0) {
    return (
      <div className="h-full flex flex-col bg-sage-50">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-earth-200 max-w-md w-full">
            <div className="w-16 h-16 bg-earth-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-earth-600" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-sage-900 mb-2">Daily Limit Reached</h2>
            <p className="text-gray-600 mb-6">
              You've used all {usage.limit} free queries for today in the Triage Plan. 
              Upgrade to the Healer Plan for unlimited access to deep-dive conversations.
            </p>
            <button 
              onClick={onUpgradeClick}
              className="w-full bg-earth-600 text-white py-3 rounded-xl font-bold hover:bg-earth-700 transition-colors shadow-lg shadow-earth-200"
            >
              Upgrade to Premium
            </button>
            <p className="text-xs text-gray-400 mt-4">Resets in 24 hours.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-sage-50">
      <Header />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-2">
            <div
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`
                w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                ${msg.role === 'user' ? 'bg-earth-500' : 'bg-sage-600'}
              `}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
              </div>
              
              <div className={`
                max-w-[85%] rounded-2xl p-4 shadow-sm whitespace-pre-wrap leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-earth-50 text-sage-900 rounded-tr-none border border-earth-200' 
                  : 'bg-white text-gray-800 rounded-tl-none border border-sage-200'}
              `}>
                {msg.content || <span className="animate-pulse text-gray-400">Consulting ancient texts...</span>}
              </div>
            </div>

            {/* The Hook: Locked Content */}
            {!isGuest && !isSubscribed && msg.role === 'model' && msg.id !== 'welcome' && msg.content && (
              <div className="ml-11 max-w-[85%]">
                <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-4 border border-gray-300 relative overflow-hidden group cursor-pointer" onClick={onUpgradeClick}>
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-earth-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg transform scale-95 group-hover:scale-100 transition-transform">Upgrade to Premium</span>
                  </div>
                  <div className="flex flex-col gap-3 blur-[2px] group-hover:blur-[3px] transition-all">
                    <div className="flex items-center gap-3 text-sage-800 font-serif font-bold">
                       <Lock size={16} /> 
                       <span>Healer Plan Exclusive</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/50 p-2 rounded-lg">
                      <PlayCircle className="text-earth-600" size={20} />
                      <span className="text-sm font-medium text-gray-700">5 Yoga Poses for this condition</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/50 p-2 rounded-lg">
                      <FileText className="text-earth-600" size={20} />
                      <span className="text-sm font-medium text-gray-700">3-Day Personalized Diet Plan</span>
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 flex flex-col items-center">
                    <Lock className="text-gray-500 mb-1" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex flex-row items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-sage-600 flex-shrink-0 flex items-center justify-center">
                <Bot size={16} className="text-white" />
             </div>
             <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-sage-200 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-sage-200">
        {!isGuest && !isSubscribed && (
          <div className="flex justify-center mb-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              usage.remaining === 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-sage-50 text-sage-600 border-sage-200'
            }`}>
              {usage.remaining} free queries remaining today
            </span>
          </div>
        )}
        
        {isGuest && (
          <div className="flex justify-center mb-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-sage-50 text-sage-600 border border-sage-200 flex items-center gap-1">
              <Sparkles size={10} /> Get your first consultation free
            </span>
          </div>
        )}

        <div className="max-w-4xl mx-auto relative flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGuest ? "Ask about any ailment (e.g. 'Migraine relief')..." : "Describe your ailment..."}
            className="w-full bg-sage-50 border border-sage-200 rounded-xl px-4 py-3 pr-12 text-sage-900 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent resize-none h-[60px] scrollbar-hide"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-xs text-sage-400 mt-2">
          AI can make mistakes. Please consult a doctor for serious medical advice.
        </p>
      </div>
    </div>
  );
};

const Header = () => (
  <div className="bg-white border-b border-sage-200 p-4 shadow-sm flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-sage-600 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <h1 className="font-serif text-xl text-sage-900 font-bold">Nature Nani</h1>
    </div>
    <div className="text-xs text-sage-500 bg-sage-100 px-2 py-1 rounded-full">
      Powered by Gemini 2.5
    </div>
  </div>
);

export default ChatInterface;