
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, User, Lock, PlayCircle, FileText, BookOpen, ChevronDown, ChevronUp, RefreshCw, Sparkles, Leaf } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]); 

  const handleResetChat = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'model',
      content: 'Namaste. How can I help you today?',
      timestamp: Date.now()
    }]);
    sessionStorage.removeItem('nani_pending_message');
  }, [setMessages]);

  const parseMessageContent = (rawText: string): { visibleText: string, metadata: RecommendationMetadata[] } => {
    const jsonBlockRegex = /```json\s*(\{[\s\S]*?"recommendations"[\s\S]*?\})\s*```/;
    let match = rawText.match(jsonBlockRegex);
    let jsonString = '';
    let cleanText = rawText;

    if (match && match[1]) {
      jsonString = match[1];
      cleanText = rawText.replace(match[0], '').trim();
    } else {
      const jsonLooseRegex = /(\{\s*"recommendations"[\s\S]*?\})\s*$/;
      match = rawText.match(jsonLooseRegex);
      if (match && match[1]) {
        jsonString = match[1];
        cleanText = rawText.replace(match[0], '').trim();
      }
    }

    if (jsonString) {
      try {
        const data = JSON.parse(jsonString);
        if (Array.isArray(data.recommendations)) {
          return { visibleText: cleanText, metadata: data.recommendations };
        }
      } catch (e) {
        try {
           const singleData = JSON.parse(jsonString);
           if (singleData.recommendation) {
             return { visibleText: cleanText, metadata: [singleData.recommendation] };
           }
        } catch (e2) {}
      }
    }
    
    return { visibleText: rawText, metadata: [] };
  };

  const handleAutoSend = async (text: string, isResuming = false) => {
    if (isLoading || !text.trim()) return;

    if (isGuest) {
      sessionStorage.setItem('nani_pending_message', text);
      onShowAuth();
      return;
    }

    if (!hasAccess || (!usage.isUnlimited && usage.remaining <= 0)) return;
    
    const historyToPass = [...messages];
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    if (!isResuming) {
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

      const stream = sendMessageWithRAG(text, historyToPass, (foundSources) => {
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
        msg.id === botMessageId ? { ...msg, content: visibleText, recommendations: metadata } : msg
      ));

      if (onMessageSent) onMessageSent();
      
    } catch (error: any) {
      console.error("Chat UI error", error);
      setMessages(prev => prev.filter(m => m.content !== ''));
      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        role: 'model',
        content: "I'm having trouble connecting to the wisdom archives. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialMessage && initialMessage.trim() !== '') {
      handleResetChat();
      setTimeout(() => {
        handleAutoSend(initialMessage);
      }, 0);
    }
  }, [initialMessage, handleResetChat]);

  useEffect(() => {
    const storedPending = sessionStorage.getItem('nani_pending_message');
    if (!isGuest && storedPending && !sentInitialRef.current) {
      sentInitialRef.current = true;
      sessionStorage.removeItem('nani_pending_message');
      handleAutoSend(storedPending, true);
    }
  }, [isGuest]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
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
      onNavigateToFeature(rec.type === 'YOGA' ? AppView.YOGA : AppView.DIET, rec.id, rec.title);
    }
  };

  const renderMarkdown = (content: string) => {
    return (
      <div className="markdown-content prose prose-slate max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h3: ({node, ...props}) => <h3 className="font-serif font-bold text-sage-800 text-lg mt-6 mb-3 border-b border-sage-100 pb-1" {...props} />,
            h4: ({node, ...props}) => <h4 className="font-serif font-bold text-sage-600 text-md mt-4 mb-2" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold text-[#8B0000]" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc ml-5 space-y-2 my-4" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal ml-5 space-y-2 my-4" {...props} />,
            li: ({node, ...props}) => <li className="text-gray-700 leading-relaxed" {...props} />,
            p: ({node, ...props}) => <p className="mb-4 last:mb-0 leading-relaxed" {...props} />,
            table: ({node, ...props}) => <div className="overflow-x-auto"><table {...props} /></div>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  const formatMessageWithDisclaimer = (content: string) => {
    const disclaimerMarker = "Disclaimer: This information is provided by NatureNani AI";
    const index = content.lastIndexOf(disclaimerMarker);
    
    if (index !== -1) {
      const beforeDisclaimer = content.substring(0, index).trim();
      const fromDisclaimer = content.substring(index).trim();
      
      const disclaimerSentenceEnd = "consult a professional.";
      const sentenceEndIndex = fromDisclaimer.indexOf(disclaimerSentenceEnd);
      
      let disclaimerText = fromDisclaimer;
      let textAfterDisclaimer = "";
      
      if (sentenceEndIndex !== -1) {
        const endOfSentence = sentenceEndIndex + disclaimerSentenceEnd.length;
        disclaimerText = fromDisclaimer.substring(0, endOfSentence);
        textAfterDisclaimer = fromDisclaimer.substring(endOfSentence).trim();
      }

      return (
        <>
          {renderMarkdown(beforeDisclaimer)}
          {textAfterDisclaimer && <div className="mt-4">{renderMarkdown(textAfterDisclaimer)}</div>}
          <div className="mt-6 pt-4 border-t border-sage-100 text-[10px] text-gray-500 italic leading-relaxed">
            {disclaimerText}
          </div>
        </>
      );
    }
    return renderMarkdown(content);
  };

  return (
    <div className="flex flex-col h-full bg-sage-50">
      <div className="bg-white border-b border-sage-200 p-4 shadow-sm flex items-center justify-between">
        <Logo className="h-8 w-8" textClassName="text-lg" showSlogan={false} />
        <button onClick={handleResetChat} className="p-2 text-sage-400 hover:text-sage-600 hover:bg-sage-50 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
           <RefreshCw size={14} /> Clear Consultation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-2">
            <div className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-earth-500' : 'bg-sage-600'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Leaf size={16} className="text-white" />}
              </div>
              <div className={`max-w-[90%] rounded-3xl p-5 shadow-sm leading-relaxed ${
                msg.role === 'user' ? 'bg-earth-50 text-sage-900 border border-earth-100 ml-12' : 'bg-white text-gray-800 border border-sage-200'
              }`}>
                {msg.content ? formatMessageWithDisclaimer(msg.content) : <div className="flex items-center gap-2 py-2"><div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div><span className="text-gray-400 text-sm italic">Consulting archives...</span></div>}
              </div>
            </div>

            {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
              <SourceAccordion sources={msg.sources} />
            )}

            {msg.recommendations && msg.recommendations.length > 0 && (
              <div className="ml-11 max-w-[85%] mt-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {msg.recommendations.map((rec, idx) => (
                    <div 
                      key={idx}
                      className="flex-1 bg-white rounded-2xl border border-earth-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-all hover:-translate-y-1" 
                      onClick={() => handleCardClick(rec)}
                    >
                      <div className="bg-sage-50 border-b border-sage-100 p-3 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           {rec.type === 'YOGA' ? <PlayCircle className="text-earth-600" size={16} /> : <FileText className="text-orange-600" size={16} />}
                           <span className="text-[10px] font-bold text-sage-700 uppercase tracking-widest">{rec.type} Specialist</span>
                         </div>
                         <ChevronRight size={12} className="text-sage-300" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-sm text-sage-900 mb-2 line-clamp-1">{rec.title}</h3>
                        <div className="flex items-center gap-2">
                           {isSubscribed ? <span className="text-earth-600 font-bold text-[10px] flex items-center gap-1 group-hover:gap-2 transition-all">Open Protocol <Sparkles size={10} /></span> : <div className="flex items-center gap-1 text-gray-400 font-bold text-[10px]"><Lock size={10} /> Premium Feature</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
          <div className="flex flex-row items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-sage-600 flex-shrink-0 flex items-center justify-center"><Leaf size={16} className="text-white" /></div>
             <div className="bg-white p-5 rounded-3xl border border-sage-200 shadow-sm flex items-center gap-2">
               <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce"></div>
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
            placeholder="Describe your symptoms or ask a question..."
            className="w-full bg-sage-50 border border-sage-200 rounded-2xl px-5 py-4 pr-14 text-sage-900 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none h-[68px] scrollbar-hide"
          />
          <button onClick={handleSend} disabled={isLoading || !input.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-sage-600 text-white rounded-xl hover:bg-sage-700 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-sage-100">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const SourceAccordion: React.FC<{ sources: RemedyDocument[] }> = ({ sources }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="ml-11 max-w-[85%]">
      <div className="border border-sage-100 rounded-xl bg-sage-50/50 overflow-hidden">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-3 text-xs font-bold text-sage-700 hover:bg-sage-100/50 transition-colors">
          <div className="flex items-center gap-2"><BookOpen size={14} className="text-earth-600" /> Grounded in Ancient Texts</div>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {isOpen && (
          <div className="p-3 bg-white border-t border-sage-100 space-y-2 text-[10px] text-gray-600 italic">
            {sources.map((doc, idx) => (
              <div key={idx} className="pb-1 border-b border-gray-50 last:border-0 flex items-center gap-2">
                <div className="w-1 h-1 bg-sage-400 rounded-full"></div>
                <span>{doc.source}: {doc.book_name || 'Traditional Wisdom'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ChevronRight: React.FC<{ className?: string, size?: number }> = ({ className, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);

export default ChatInterface;
