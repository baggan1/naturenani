
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, User, Lock, PlayCircle, FileText, BookOpen, ChevronDown, ChevronUp, RefreshCw, Sparkles, Leaf, Info, Star, X, ChevronRight, ShieldCheck, Zap, Stethoscope, Utensils, Flower2, HelpCircle } from 'lucide-react';
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

  const parseMessageContent = (rawText: string): { visibleText: string, metadata: RecommendationMetadata[], suggestions: string[] } => {
    // Aggressively strip the JSON block as soon as it starts to avoid flickering raw code
    const jsonStartIdx = rawText.indexOf('```json');
    let visibleText = rawText;
    let metadata: RecommendationMetadata[] = [];
    let suggestions: string[] = [];

    if (jsonStartIdx !== -1) {
      visibleText = rawText.substring(0, jsonStartIdx).trim();
      
      const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/;
      const match = rawText.match(jsonBlockRegex);
      if (match && match[1]) {
        try {
          const data = JSON.parse(match[1]);
          if (data.recommendations && Array.isArray(data.recommendations)) {
            metadata = data.recommendations;
          }
          if (data.suggestions && Array.isArray(data.suggestions)) {
            suggestions = data.suggestions;
          }
        } catch (e) {
          // JSON still forming
        }
      }
    }
    
    return { visibleText, metadata, suggestions };
  };

  const handleAutoSend = async (text: string, isResuming = false) => {
    if (isLoading || !text.trim()) return;

    if (text === "New Consultation") {
      handleResetChat();
      return;
    }

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
      
      const finalResult = parseMessageContent(fullRawContent);
      setMessages(prev => prev.map(msg => msg.id === botMessageId ? { 
        ...msg, 
        content: finalResult.visibleText, 
        recommendations: finalResult.metadata,
        suggestions: finalResult.suggestions
      } : msg));
      
      if (onMessageSent) onMessageSent();
    } catch (error: any) {
      console.error("Chat Error:", error);
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

  const handleCardAction = (rec: RecommendationMetadata) => {
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
          h3: ({node, ...props}: any) => <h3 className="font-serif font-bold text-sage-800 text-lg mt-6 mb-3 border-b border-sage-50 pb-2" {...props} />,
          p: ({node, ...props}: any) => <p className="mb-4 last:mb-0 leading-relaxed text-gray-700" {...props} />,
          table: ({node, ...props}: any) => <div className="overflow-x-auto my-4 rounded-xl border border-sage-100 shadow-sm"><table className="min-w-full divide-y divide-sage-200" {...props} /></div>,
          th: ({node, ...props}: any) => <th className="px-3 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider bg-sage-600" {...props} />,
          td: ({node, ...props}: any) => <td className="px-3 py-3 text-sm text-gray-700 border-b border-sage-50" {...props} />,
          ul: ({node, ...props}: any) => <ul className="list-disc ml-4 mb-4 space-y-2 text-sm text-gray-700" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-sage-50">
      <div className="bg-white border-b border-sage-200 p-4 shadow-sm flex items-center justify-between sticky top-0 z-20">
        <Logo className="h-8 w-8" textClassName="text-lg" showSlogan={false} />
        <div className="flex items-center gap-4">
          {!hasAccess && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100 text-[10px] font-bold text-amber-700 uppercase cursor-pointer hover:bg-amber-100 transition-colors" onClick={onUpgradeClick}>
              <Star size={12} className="fill-amber-400" /> Free Plan
            </div>
          )}
          <button onClick={handleResetChat} className="p-2 text-sage-400 hover:text-sage-600 flex items-center gap-2 text-xs font-bold uppercase transition-colors">
            <RefreshCw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-40 scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-2">
            <div className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-earth-500' : 'bg-sage-600'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Leaf size={16} className="text-white" />}
              </div>
              <div className={`max-w-[90%] rounded-3xl p-5 shadow-sm ${msg.role === 'user' ? 'bg-earth-50 text-sage-900 ml-12' : 'bg-white text-gray-800 border border-sage-200'}`}>
                {msg.content ? renderMarkdown(msg.content) : <div className="flex items-center gap-2 py-2"><div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce"></div><span className="text-gray-400 text-sm italic font-medium">Consulting ancient archives...</span></div>}
              </div>
            </div>

            {msg.recommendations && msg.recommendations.length > 0 && (
              <div className="ml-11 grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 max-w-5xl animate-in slide-in-from-bottom-4 duration-500">
                {msg.recommendations.map((rec, idx) => (
                  <div 
                    key={idx}
                    className="bg-white rounded-2xl border border-sage-100 shadow-lg flex flex-col h-full overflow-hidden"
                  >
                    <div className="p-6 flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`p-3 rounded-2xl ${rec.type === 'YOGA' ? 'bg-pink-50 text-pink-600' : rec.type === 'DIET' ? 'bg-orange-50 text-orange-600' : 'bg-sage-50 text-sage-600'}`}>
                          {rec.type === 'YOGA' ? <Flower2 size={24} /> : rec.type === 'DIET' ? <Utensils size={24} /> : <Stethoscope size={24} />}
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-sage-900 text-lg leading-tight">{rec.title}</h4>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{rec.type} MODULE</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{rec.summary}</p>
                    </div>
                    <div className="px-6 pb-6">
                      <button 
                        onClick={() => handleCardAction(rec)}
                        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                          rec.type === 'YOGA' ? 'bg-pink-500 text-white hover:bg-pink-600' : 
                          rec.type === 'DIET' ? 'bg-orange-500 text-white hover:bg-orange-600' : 
                          'bg-sage-600 text-white hover:bg-sage-700'
                        }`}
                      >
                        {rec.type === 'YOGA' ? '[Explore Yoga]' : rec.type === 'DIET' ? '[See Healing Diet]' : '[View Remedies]'}
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Progressive Chat Suggestions */}
            {msg.suggestions && msg.suggestions.length > 0 && (
              <div className="ml-11 mt-6 flex flex-wrap gap-2 max-w-5xl animate-in fade-in slide-in-from-bottom-2 duration-700">
                <div className="w-full mb-1 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <HelpCircle size={12} /> Suggested Next Steps
                </div>
                {msg.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAutoSend(suggestion)}
                    className="bg-white border border-sage-200 px-4 py-2.5 rounded-full text-xs font-bold text-sage-700 hover:bg-sage-600 hover:text-white hover:border-sage-600 transition-all shadow-sm active:scale-95 flex items-center gap-2 group"
                  >
                    {suggestion}
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
            
            {msg.sources && msg.sources.length > 0 && (
              <SourceAccordion sources={msg.sources} />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {selectedDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sage-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setSelectedDetail(null)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="bg-sage-50 p-8 border-b border-sage-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl text-sage-600 shadow-sm border border-sage-100"><Stethoscope size={24} /></div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-sage-900">{selectedDetail.title}</h2>
                  <p className="text-[10px] font-bold text-sage-400 uppercase tracking-widest mt-0.5">Clinical Remedy Detail</p>
                </div>
              </div>
              <button onClick={() => setSelectedDetail(null)} className="p-2.5 text-gray-400 hover:text-sage-600 hover:bg-white rounded-full transition-all"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 md:p-10">
              <div className="bg-sage-50/50 p-6 rounded-2xl border border-sage-100 mb-8 italic">
                 <p className="text-[10px] font-bold text-sage-700 mb-2 uppercase tracking-widest flex items-center gap-2"><Sparkles size={12} className="text-yellow-500" /> Snapshot Summary</p>
                 <p className="text-gray-600 text-sm leading-relaxed">"{selectedDetail.summary}"</p>
              </div>
              
              <div className="pb-8">
                {renderMarkdown(selectedDetail.detail || '')}
              </div>
              
              {!hasAccess && (
                <div className="mt-8 p-8 bg-amber-50 rounded-[2rem] border border-amber-100 text-center shadow-inner">
                   <Lock className="mx-auto text-amber-500 mb-3" size={32} />
                   <h4 className="text-lg font-bold text-amber-900 mb-2">Protocol Gated</h4>
                   <p className="text-sm text-amber-700/80 mb-6 max-w-xs mx-auto">Detailed dosage tables and clinical protocols are available in the Healer Plan.</p>
                   <button onClick={() => { setSelectedDetail(null); onUpgradeClick(); }} className="bg-sage-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-sage-700 transition-all shadow-lg shadow-sage-200 flex items-center justify-center gap-2 mx-auto">
                     <Zap size={16} /> Start 7-Day Free Trial
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 bg-white border-t border-sage-200 relative z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        {showTrialPrompt && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-6 w-[90%] max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="bg-white rounded-[2rem] shadow-2xl border border-sage-100 p-8 relative ring-8 ring-sage-50/50">
                <button onClick={() => setShowTrialPrompt(false)} className="absolute top-4 right-4 text-gray-400 p-1 hover:text-sage-600"><X size={18} /></button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-sage-100 p-2.5 rounded-xl text-sage-600"><Sparkles size={20} /></div>
                  <h4 className="font-serif font-bold text-sage-900">Unlock Healing Aid</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-6">Access targeted Nutri Heal plans and therapeutic Yoga sequences for <span className="font-bold text-sage-800">{lastAilment || 'your health'}</span>.</p>
                <button onClick={() => { setShowTrialPrompt(false); onUpgradeClick(); }} className="w-full bg-sage-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-sage-200 hover:bg-sage-700 transition-all flex items-center justify-center gap-2">
                  Upgrade to Healer Plan <Zap size={14} />
                </button>
             </div>
          </div>
        )}

         <div className="max-w-4xl mx-auto relative flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={usage.remaining > 0 || usage.isUnlimited ? "Share your symptoms with Nani..." : "Daily limit reached. Upgrade for more."}
            disabled={!usage.isUnlimited && usage.remaining <= 0}
            className="w-full bg-sage-50 border border-sage-200 rounded-3xl px-6 py-4.5 pr-14 text-sage-900 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:bg-white resize-none h-[72px] scrollbar-hide shadow-inner transition-all"
          />
          <button onClick={handleSend} disabled={isLoading || !input.trim() || (!usage.isUnlimited && usage.remaining <= 0)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-3 bg-sage-600 text-white rounded-2xl hover:bg-sage-700 disabled:opacity-50 shadow-lg shadow-sage-100 transition-all active:scale-95">
            {isLoading ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

const SourceAccordion: React.FC<{ sources: RemedyDocument[] }> = ({ sources }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="ml-11 max-w-[85%] mt-2">
      <div className="border border-sage-100 rounded-2xl bg-sage-50/30 overflow-hidden transition-all">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-sage-500 hover:bg-sage-50 hover:text-sage-700 transition-colors">
          <div className="flex items-center gap-2.5"><BookOpen size={14} /> Knowledge Sources ({sources.length})</div>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {isOpen && (
          <div className="p-4 bg-white border-t border-sage-50 space-y-3 text-[10px] text-gray-500">
            {sources.map((doc, idx) => (
              <div key={idx} className="pb-2 border-b border-gray-50 last:border-0 flex items-start gap-3">
                <div className="mt-0.5"><ShieldCheck size={12} className="text-sage-400" /></div>
                <div>
                   <span className="font-bold text-sage-700">{doc.source} Archive</span>
                   <p className="italic mt-0.5">{doc.book_name || 'Traditional Holistic Literature'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
