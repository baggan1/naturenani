
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot, Lock, PlayCircle, FileText, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Message, QueryUsage, RemedyDocument, RecommendationMetadata, AppView } from '../types';
import { sendMessageWithRAG } from '../services/geminiService';
import { Logo } from './Logo';

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onTrialEnd: () => void;
  hasAccess: boolean;
  initialMessage?: string;
  onMessageSent?: () => void;
  usage: QueryUsage;
  isSubscribed: boolean;
  onUpgradeClick: () => void;
  isGuest: boolean;
  onShowAuth: () => void;
  onNavigateToFeature: (view: AppView, contextId: string, contextTitle: string) => void;
  isMobileView?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages,
  setMessages,
  onTrialEnd, 
  hasAccess, 
  initialMessage, 
  onMessageSent, 
  usage,
  isSubscribed,
  onUpgradeClick,
  isGuest,
  onShowAuth,
  onNavigateToFeature,
  isMobileView = false
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sentInitialRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]); 

  // --- Safety Timeout Logic ---
  useEffect(() => {
    let safetyTimer: ReturnType<typeof setTimeout>;
    if (isLoading) {
      // Increased from 30s to 60s for RAG stability
      safetyTimer = setTimeout(() => {
        setIsLoading(false);
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last.role === 'model' && last.content === '') {
             return [...prev.slice(0, -1), {
               id: 'timeout-err',
               role: 'model',
               content: 'I apologize, the connection is taking longer than expected. Please check your network and try asking again.',
               timestamp: Date.now()
             }];
          }
          return prev;
        });
      }, 60000); 
    }
    return () => clearTimeout(safetyTimer);
  }, [isLoading]);


  // --- Consolidated Session Resume Logic ---
  useEffect(() => {
    const storedPending = sessionStorage.getItem('nani_pending_message');
    const hasInitialProp = initialMessage && initialMessage.trim() !== '';

    if (!isGuest && !sentInitialRef.current) {
      if (storedPending) {
        sentInitialRef.current = true;
        sessionStorage.removeItem('nani_pending_message');
        handleAutoSend(storedPending, true);
      } else if (hasInitialProp) {
        sentInitialRef.current = true;
        handleAutoSend(initialMessage!, false);
      }
    }
    
    return () => { sentInitialRef.current = false; };
  }, [isGuest, initialMessage]);


  const parseMessageContent = (rawText: string): { visibleText: string, metadata?: RecommendationMetadata } => {
    const jsonBlockRegex = /```json\s*(\{[\s\S]*?"recommendation"[\s\S]*?\})\s*```/;
    let match = rawText.match(jsonBlockRegex);
    let jsonString = '';
    let cleanText = rawText;

    if (match && match[1]) {
      jsonString = match[1];
      cleanText = rawText.replace(match[0], '').trim();
    } else {
      const jsonLooseRegex = /(\{\s*"recommendation"[\s\S]*?\})\s*$/;
      match = rawText.match(jsonLooseRegex);
      if (match && match[1]) {
        jsonString = match[1];
        cleanText = rawText.replace(match[0], '').trim();
      }
    }

    if (jsonString) {
      try {
        const data = JSON.parse(jsonString);
        if (data.recommendation) {
          return { visibleText: cleanText, metadata: data.recommendation };
        }
      } catch (e) {
        console.warn("Failed to parse recommendation JSON", e);
      }
    }
    
    return { visibleText: rawText };
  };

  const handleAutoSend = async (text: string, isResuming = false) => {
    if (isLoading) return;

    if (isGuest) {
      sessionStorage.setItem('nani_pending_message', text);
      setMessages(prev => [...prev, {
        id: 'guest-' + Date.now(),
        role: 'user',
        content: text,
        timestamp: Date.now()
      }]);
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onShowAuth();
      }, 1000);
      return;
    }

    if (!hasAccess || (!usage.isUnlimited && usage.remaining <= 0)) return;
    
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
      const botMessageId = crypto.randomUUID();
      let fullRawContent = '';
      
      setMessages(prev => [...prev, {
        id: botMessageId,
        role: 'model',
        content: '',
        timestamp: Date.now(),
        sources: [] 
      }]);

      const stream = sendMessageWithRAG(text, (foundSources) => {
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId ? { ...msg, sources: foundSources } : msg
        ));
      });

      for await (const chunk of stream) {
        fullRawContent += chunk;
        const { visibleText } = parseMessageContent(fullRawContent);
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId ? { ...msg, content: visibleText } : msg
        ));
      }
      
      const { visibleText, metadata } = parseMessageContent(fullRawContent);
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId ? { ...msg, content: visibleText, recommendation: metadata } : msg
      ));

      if (onMessageSent) onMessageSent();
      
    } catch (error: any) {
      console.error("Chat error", error);
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role === 'model' && lastMsg.content === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });

      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        role: 'model',
        content: "I apologize, but I am unable to connect to the wisdom archives right now. Please try again in a moment.",
        timestamp: Date.now()
      }]);
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

  const handleCardClick = (rec: RecommendationMetadata) => {
    if (!isSubscribed) {
      onUpgradeClick();
    } else {
      const targetView = rec.type === 'YOGA' ? AppView.YOGA : AppView.DIET;
      onNavigateToFeature(targetView, rec.id, rec.title);
    }
  };

  const formatMessageWithDisclaimer = (content: string) => {
    const disclaimerMarker = "Disclaimer: This information is provided by NatureNani AI";
    const index = content.lastIndexOf(disclaimerMarker);
    
    if (index !== -1) {
      const mainText = content.substring(0, index).trim();
      const disclaimerText = content.substring(index).trim();
      
      return (
        <>
          <div>{mainText}</div>
          <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 leading-relaxed italic">
            {disclaimerText}
          </div>
        </>
      );
    }
    return content;
  };

  if (!isGuest && !usage.isUnlimited && usage.remaining <= 0) {
    return (
      <div className="h-full flex flex-col bg-sage-50">
        {!isMobileView && <Header />}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-earth-200 max-w-md w-full">
            <div className="w-16 h-16 bg-earth-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-earth-600" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-sage-900 mb-2">Daily Limit Reached</h2>
            <p className="text-gray-600 mb-6">
              You've used all {usage.limit} free queries for today in the Triage Plan. 
              Upgrade to the Healer Plan for unlimited access.
            </p>
            <button 
              onClick={onUpgradeClick}
              className="w-full bg-earth-600 text-white py-3 rounded-xl font-bold hover:bg-earth-700 transition-colors shadow-lg shadow-earth-200"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-sage-50">
      {!isMobileView && <Header />}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-2">
            <div className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-earth-500' : 'bg-sage-600'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
              </div>
              
              <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm whitespace-pre-wrap leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-earth-50 text-sage-900 rounded-tr-none border border-earth-200' 
                  : 'bg-white text-gray-800 rounded-tl-none border border-sage-200'
              }`}>
                {msg.content ? formatMessageWithDisclaimer(msg.content) : <span className="animate-pulse text-gray-400">Consulting ancient texts...</span>}
              </div>
            </div>

            {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
              <SourceAccordion sources={msg.sources} />
            )}

            {msg.recommendation && (
              <div className="ml-11 max-w-[85%] mt-1">
                <div 
                  className="bg-white rounded-xl border border-earth-200 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleCardClick(msg.recommendation!)}
                >
                  <div className="bg-sage-50 border-b border-sage-100 p-3 flex items-center gap-2">
                     {msg.recommendation.type === 'YOGA' ? (
                        <PlayCircle className="text-earth-600" size={16} />
                     ) : (
                        <FileText className="text-orange-600" size={16} />
                     )}
                     <span className="text-xs font-bold text-sage-700 uppercase tracking-wide">
                        {msg.recommendation.type === 'YOGA' ? 'Recommended Routine' : 'Diet Plan'}
                     </span>
                  </div>
                  
                  <div className="p-4 relative">
                    <h3 className="font-bold text-lg text-sage-900 mb-1">{msg.recommendation.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {msg.recommendation.type === 'YOGA' 
                        ? "A specific sequence of poses curated for this condition." 
                        : "A 3-day meal plan to balance your internal doshas."}
                    </p>

                    <div className="flex items-center gap-2">
                       {isSubscribed ? (
                          <span className="bg-sage-100 text-sage-700 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
                            <PlayCircle size={16} /> Open Now
                          </span>
                       ) : (
                          <div className="flex items-center gap-2 text-earth-600 font-bold text-sm">
                             <Lock size={14} /> Upgrade to Unlock
                          </div>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
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

      <div className="p-4 bg-white border-t border-sage-200">
         <div className="max-w-4xl mx-auto relative flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGuest ? "Ask about any ailment..." : "Describe your ailment..."}
            className="w-full bg-sage-50 border border-sage-200 rounded-xl px-4 py-3 pr-12 text-sage-900 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none h-[60px] scrollbar-hide"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 disabled:opacity-50 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-[10px] md:text-xs text-sage-400 mt-2">
           This is not medical advice, and the information is not intended to diagnose, treat, cure, or prevent any health condition.
        </p>
      </div>
    </div>
  );
};

const SourceAccordion: React.FC<{ sources: RemedyDocument[] }> = ({ sources }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="ml-11 max-w-[85%]">
      <div className="border border-sage-200 rounded-lg bg-sage-50 overflow-hidden">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 text-xs font-bold text-sage-700 hover:bg-sage-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-earth-600" />
            🌿 Credibility / Source
          </div>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        
        {isOpen && (
          <div className="p-3 bg-white border-t border-sage-200 space-y-2 text-xs">
            {sources.map((doc, idx) => (
              <div key={idx} className="flex flex-col gap-1 pb-2 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="flex justify-between font-semibold text-gray-800">
                  <span>{doc.source} Source:</span>
                </div>
                <div className="text-gray-600 italic">
                  {doc.book_name || 'General Texts'}
                </div>
              </div>
            ))}
            <div className="pt-2 text-[10px] text-gray-400 border-t border-gray-100 mt-2">
              Medical Disclaimer: This advice is based on traditional texts and is not a substitute for consulting a physician.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Header = () => (
  <div className="bg-white border-b border-sage-200 p-4 shadow-sm flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Logo className="h-8 w-8" textClassName="text-lg" />
    </div>
  </div>
);

export default ChatInterface;
