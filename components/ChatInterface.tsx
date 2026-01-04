
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, User, Lock, PlayCircle, FileText, BookOpen, ChevronDown, ChevronUp, RefreshCw, Sparkles, Leaf, Info, Star, X, ChevronRight, ShieldCheck, Zap, Stethoscope, Utensils, Flower2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, QueryUsage, RemedyDocument, RecommendationMetadata, AppView, SubscriptionStatus } from '../types';
import { sendMessageWithRAG } from '../services/geminiService';
import { Logo } from './Logo';

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onTrialEnd: () => void;
  hasAccess: boolean;
  subscriptionStatus: SubscriptionStatus;
  initialMessage?: string;
  onMessageSent?: () => void;
  usage: QueryUsage;
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
  subscriptionStatus,
  initialMessage, 
  onMessageSent, 
  usage,
  onUpgradeClick,
  isGuest,
  onShowAuth,
  onNavigateToFeature,
  isMobileView = false
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTrialPrompt, setShowTrialPrompt] = useState(false);
  const [lastAilment, setLastAilment] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<RecommendationMetadata | null>(null);
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
      content: 'Namaste. I am Nature Nani. Tell me what ailments you are experiencing, and I shall look into the ancient wisdom of Naturopathy and Ayurveda for you.',
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
    }

    if (jsonString) {
      try {
        const data = JSON.parse(jsonString);
        if (Array.isArray(data.recommendations)) {
          return { visibleText: cleanText, metadata: data.recommendations };
        }
      } catch (e) {}
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
    setLastAilment(text);
    const historyToPass = [...messages]; 
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() };
    if (!isResuming) setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const botMessageId = crypto.randomUUID();
      let fullRawContent = '';
      setMessages(prev => [...prev, { id: botMessageId, role: 'model', content: '', timestamp: Date.now() }]);

      const stream = sendMessageWithRAG(
        text, historyToPass, hasAccess ? 'Premium' : 'Free', usage.count,
        (foundSources) => {
          setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, sources: foundSources } : msg));
        }
      );

      for await (const chunk of stream) {
        fullRawContent += chunk;
        const { visibleText } = parseMessageContent(fullRawContent);
        setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, content: visibleText } : msg));
      }
      
      const { visibleText, metadata } = parseMessageContent(fullRawContent);
      setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, content: visibleText, recommendations: metadata } : msg));
      if (onMessageSent) onMessageSent();
    } catch (error: any) {
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await handleAutoSend(text);
  };

  const handleCardClick = (rec: RecommendationMetadata) => {
    if (rec.type === 'REMEDY') {
      setSelectedDetail(rec);
    } else {
      if (!hasAccess) {
        setShowTrialPrompt(true);
      } else {
        onNavigateToFeature(rec.type === 'YOGA' ? AppView.YOGA : AppView.DIET, rec.id, rec.title);
      }
    }
  };

  const renderMarkdown = (content: string) => (
    <div className="markdown-content prose prose-slate max-w-none">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h3: ({node, ...props}: any) => <h3 className="font-serif font-bold text-sage-800 text-lg mt-6 mb-3" {...props} />,
          p: ({node, ...props}: any) => <p className="mb-4 last:mb-0 leading-relaxed text-gray-700" {...props} />,
          table: ({node, ...props}: any) => <div className="overflow-x-auto my-4 rounded-xl border border-sage-100 shadow-sm"><table className="min-w-full divide-y divide-sage-200" {...props} /></div>,
          th: ({node, ...props}: any) => <th className="px-3 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider bg-sage-600" {...props} />,
          td: ({node, ...props}: any) => <td className="px-3 py-3 text-sm text-gray-700 border-b border-sage-50" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-sage-50">
      <div className="bg-white border-b border-sage-200 p-4 shadow-sm flex items-center justify-between">
        <Logo className="h-8 w-8" textClassName="text-lg" showSlogan={false} />
        <div className="flex items-center gap-4">
          {!hasAccess && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100 text-[10px] font-bold text-amber-700 uppercase cursor-pointer" onClick={onUpgradeClick}>
              <Star size={12} className="fill-amber-400" /> Free Plan
            </div>
          )}
          <button onClick={handleResetChat} className="p-2 text-sage-400 hover:text-sage-600 flex items-center gap-2 text-xs font-bold uppercase">
            <RefreshCw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-2">
            <div className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-earth-500' : 'bg-sage-600'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Leaf size={16} className="text-white" />}
              </div>
              <div className={`max-w-[90%] rounded-3xl p-5 shadow-sm ${msg.role === 'user' ? 'bg-earth-50 text-sage-900 ml-12' : 'bg-white text-gray-800 border border-sage-200'}`}>
                {msg.content ? renderMarkdown(msg.content) : <div className="flex items-center gap-2 py-2"><div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce"></div><span className="text-gray-400 text-sm italic">Consulting archives...</span></div>}
              </div>
            </div>

            {msg.recommendations && msg.recommendations.length > 0 && (
              <div className="ml-11 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 max-w-4xl">
                {msg.recommendations.map((rec, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleCardClick(rec)}
                    className="bg-white rounded-2xl border border-sage-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col h-full group active:scale-95"
                  >
                    <div className="p-4 flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`p-2 rounded-xl ${rec.type === 'YOGA' ? 'bg-pink-50 text-pink-600' : rec.type === 'DIET' ? 'bg-orange-50 text-orange-600' : 'bg-sage-50 text-sage-600'}`}>
                          {rec.type === 'YOGA' ? <Flower2 size={18} /> : rec.type === 'DIET' ? <Utensils size={18} /> : <Stethoscope size={18} />}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{rec.type}</span>
                      </div>
                      <h3 className="font-bold text-sm text-sage-900 mb-1">{rec.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed mb-4">{rec.summary}</p>
                    </div>
                    <div className="px-4 py-3 bg-sage-50 border-t border-sage-100 flex items-center justify-between group-hover:bg-sage-100">
                      <span className="text-[10px] font-bold text-sage-700 uppercase tracking-widest">
                        {rec.type === 'REMEDY' ? 'Reveal Detail' : 'Open App'}
                      </span>
                      <ChevronRight size={14} className="text-sage-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {selectedDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedDetail(null)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedDetail(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-sage-50 rounded-2xl text-sage-600"><Stethoscope size={24} /></div>
              <h2 className="text-2xl font-serif font-bold text-sage-900">{selectedDetail.title}</h2>
            </div>
            <div className="bg-sage-50 p-6 rounded-2xl border border-sage-100 mb-6">
               <p className="text-sm font-bold text-sage-700 mb-1 uppercase tracking-widest">Snapshot Summary</p>
               <p className="text-gray-600 italic text-sm">"{selectedDetail.summary}"</p>
            </div>
            {renderMarkdown(selectedDetail.detail || '')}
            {!hasAccess && (
              <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                 <Lock className="mx-auto text-amber-500 mb-2" size={24} />
                 <p className="text-sm font-bold text-amber-900 mb-2">Detailed Clinical Protocol is Locked</p>
                 <button onClick={() => { setSelectedDetail(null); onUpgradeClick(); }} className="bg-sage-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-sage-700 transition-all">Start 7-Day Free Trial</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-4 bg-white border-t border-sage-200 relative">
        {showTrialPrompt && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-6 w-[90%] max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="bg-white rounded-2xl shadow-2xl border border-sage-200 p-6 relative ring-4 ring-sage-50">
                <button onClick={() => setShowTrialPrompt(false)} className="absolute top-3 right-3 text-gray-400 p-1"><X size={18} /></button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-sage-100 p-2 rounded-xl text-sage-600"><Sparkles size={20} /></div>
                  <h4 className="font-serif font-bold text-sage-900">Unlock Full Protocol</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-5">Access targeted Diet Plans and visual Yoga sequences for <span className="font-bold text-sage-800">{lastAilment}</span>.</p>
                <button onClick={() => { setShowTrialPrompt(false); onUpgradeClick(); }} className="w-full bg-sage-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-sage-100">Start 7-Day Free Trial</button>
             </div>
          </div>
        )}

         <div className="max-w-4xl mx-auto relative flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={usage.remaining > 0 || usage.isUnlimited ? "Describe your symptoms..." : "Limit reached. Upgrade for more."}
            disabled={!usage.isUnlimited && usage.remaining <= 0}
            className="w-full bg-sage-50 border border-sage-200 rounded-2xl px-5 py-4 pr-14 text-sage-900 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none h-[68px] scrollbar-hide"
          />
          <button onClick={handleSend} disabled={isLoading || !input.trim() || (!usage.isUnlimited && usage.remaining <= 0)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-sage-600 text-white rounded-xl hover:bg-sage-700 disabled:opacity-50 shadow-lg shadow-sage-100">
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
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-3 text-xs font-bold text-sage-700 hover:bg-sage-100/50">
          <div className="flex items-center gap-2"><BookOpen size={14} className="text-earth-600" /> View Sources</div>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {isOpen && (
          <div className="p-3 bg-white border-t border-sage-100 space-y-2 text-[10px] text-gray-600 italic">
            {sources.map((doc, idx) => (
              <div key={idx} className="pb-1 border-b border-gray-50 last:border-0 flex items-center gap-2">
                <span>{doc.source}: {doc.book_name || 'Traditional Wisdom'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
