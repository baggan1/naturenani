import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, User, Lock, PlayCircle, FileText, BookOpen, ChevronDown, ChevronUp, RefreshCw, Sparkles, Leaf, Info, Star, X, ChevronRight, ShieldCheck, Zap, Stethoscope, Utensils, Flower2, HelpCircle, AlertCircle, Mic, Volume2, Bookmark, BookmarkPlus, Save, Check, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GoogleGenAI, Modality } from "@google/genai";
import { Message, QueryUsage, RemedyDocument, RecommendationMetadata, AppView, SubscriptionStatus } from '../types';
import { sendMessageWithRAG } from '../services/geminiService';
import { saveRemedy, getCurrentUser } from '../services/backendService';
import { MAX_PROMPT_LENGTH } from '../utils/constants';
import { Logo } from './Logo';
import { playRawAudio } from '../utils/audio';

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
  onVoiceClick?: () => void;
  isMobileView?: boolean;
  initialMessageIsVoice?: boolean;
}

const NANI_VOICE_PROMPT = `
## Voice Identity: The Global Wellness Guide
Tone: Warm, rhythmic, slightly slower than average.
Identity: Wise grandmotherly presence with professional clarity.
Task: Recite the healing protocol provided with audible smiles and comforting pauses.
`;

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
  onVoiceClick,
  initialMessageIsVoice = false
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [showTrialPrompt, setShowTrialPrompt] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<RecommendationMetadata | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (initialMessage && initialMessage.trim() !== '' && !isLoading) {
      handleAutoSend(initialMessage, false, initialMessageIsVoice);
    }
  }, [initialMessage, initialMessageIsVoice]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]); 

  const handleResetChat = useCallback(() => {
    if (isLoading) return; 
    setMessages([{
      id: 'welcome',
      role: 'model',
      content: 'Namaste. I am Nature Nani. Tell me what ailments you are experiencing, and I shall look into the ancient wisdom of Naturopathy and Ayurveda for you.',
      timestamp: Date.now()
    }]);
    if (onMessageSent) onMessageSent(); 
  }, [setMessages, isLoading, onMessageSent]);

  const generateAndPlaySpeech = async (msgId: string, fullText: string) => {
    if (!hasAccess) {
      onUpgradeClick();
      return;
    }
    if (isSpeaking) return;
    setIsSpeaking(true);
    setPlayingMessageId(msgId);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `${NANI_VOICE_PROMPT}\n\nCONTENT:\n${fullText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });
      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        await playRawAudio(audioData, audioContextRef.current);
      }
    } catch (e) {
      console.error("Speech Generation failed:", e);
    } finally {
      setIsSpeaking(false);
      setPlayingMessageId(null);
    }
  };

  const handleSaveRemedy = async () => {
    const user = getCurrentUser();
    if (!user || !selectedDetail) return;
    setSaveLoading(true);
    try {
      // FORCE Ailment Name (id) for grouping
      const ailmentName = selectedDetail.id || "General Wellness";
      const result = await saveRemedy(user, selectedDetail.detail || '', ailmentName);
      if (result) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Failed to save remedy:", e);
    } finally {
      setSaveLoading(false);
    }
  };

  const parseMessageContent = (rawText: string) => {
    let visibleText = rawText;
    let metadata: RecommendationMetadata[] = [];
    let suggestions: string[] = [];

    const marker = "[METADATA_START]";
    const markerIndex = rawText.indexOf(marker);

    if (markerIndex !== -1) {
      visibleText = rawText.substring(0, markerIndex).trim();
      const metadataPart = rawText.substring(markerIndex + marker.length);
      const jsonMatch = metadataPart.match(/```json\s*([\s\S]*?)\s*```/) || metadataPart.match(/(\{[\s\S]*?\})/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const data = JSON.parse(jsonMatch[1].trim());
          if (data.recommendations) metadata = data.recommendations;
          if (data.suggestions) suggestions = data.suggestions;
        } catch (e) {}
      }
    }
    visibleText = visibleText.replace(/\n--\n*$/g, '').trim();
    return { visibleText, metadata, suggestions };
  };

  const handleAutoSend = async (text: string, isResuming = false, isVoiceQuery = false) => {
    if (isLoading || !text.trim()) return;
    if (text === "New Consultation") { handleResetChat(); return; }
    
    const currentUser = getCurrentUser();
    if (isGuest || !currentUser) { sessionStorage.setItem('nani_pending_message', text); onShowAuth(); return; }
    
    if (!usage.isUnlimited && usage.remaining <= 0) {
      onUpgradeClick();
      return;
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() };
    if (!isResuming) setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const botMessageId = crypto.randomUUID();
      let fullRawContent = '';
      setMessages(prev => [...prev, { id: botMessageId, role: 'model', content: '', timestamp: Date.now() }]);

      const stream = sendMessageWithRAG(
        text, messages, hasAccess ? 'Premium' : 'Free', usage.count, currentUser,
        (foundSources) => {
          setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, sources: foundSources } : msg));
        }
      );

      for await (const chunk of stream) {
        fullRawContent += chunk;
        const { visibleText, metadata, suggestions } = parseMessageContent(fullRawContent);
        setMessages(prev => prev.map(msg => msg.id === botMessageId ? { 
          ...msg, 
          content: visibleText,
          recommendations: metadata.length > 0 ? metadata : msg.recommendations,
          suggestions: suggestions.length > 0 ? suggestions : msg.suggestions
        } : msg));
      }
      
      const finalResult = parseMessageContent(fullRawContent);
      setMessages(prev => prev.map(msg => msg.id === botMessageId ? { 
        ...msg, 
        content: finalResult.visibleText, 
        recommendations: finalResult.metadata,
        suggestions: finalResult.suggestions
      } : msg));
      
      if (onMessageSent) onMessageSent();

      if (isVoiceQuery && hasAccess && finalResult.visibleText) {
        generateAndPlaySpeech(botMessageId, finalResult.visibleText);
      }
    } catch (error: any) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    handleAutoSend(text);
  };

  const renderMarkdown = (content: string) => {
    return (
      <div className="markdown-content prose prose-slate max-w-none text-left">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h3: ({node, ...props}: any) => <h3 className="font-serif font-bold text-sage-800 text-lg mt-6 mb-3 border-b border-sage-50 pb-2" {...props} />,
            p: ({node, ...props}: any) => <p className="mb-4 last:mb-0 leading-relaxed text-gray-700" {...props} />,
            table: ({node, ...props}: any) => <div className="overflow-x-auto my-4 rounded-xl border border-sage-100 shadow-sm"><table className="min-w-full" {...props} /></div>,
            th: ({node, ...props}: any) => <th className="px-3 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider bg-sage-600" {...props} />,
            td: ({node, ...props}: any) => <td className="px-3 py-3 text-sm text-gray-700 border-b border-sage-50" {...props} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-sage-50">
      <div className="bg-white border-b border-sage-200 p-4 shadow-sm flex items-center justify-between sticky top-0 z-20">
        <Logo className="h-8 w-8" textClassName="text-lg" showSlogan={false} />
        <div className="flex items-center gap-2 md:gap-4">
          {!usage.isUnlimited && !isGuest && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sage-50 border border-sage-100 rounded-full shadow-inner">
               <MessageSquare size={12} className="text-sage-500" />
               <span className="text-[10px] font-black text-sage-700 uppercase tracking-tighter">
                 {usage.count} / {usage.limit} Daily
               </span>
            </div>
          )}
          <button onClick={handleResetChat} disabled={isLoading} className="p-2 text-sage-400 hover:text-sage-600 flex items-center gap-2 text-xs font-bold uppercase transition-colors">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Reset
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
              <div className={`max-w-[90%] relative rounded-3xl p-5 shadow-sm ${msg.role === 'user' ? 'bg-earth-50 text-sage-900 ml-12' : 'bg-white text-gray-800 border border-sage-200'}`}>
                {msg.content ? renderMarkdown(msg.content) : <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce"></div>}
                {msg.role === 'model' && msg.content && (
                  <div className="absolute -bottom-3 -right-3 flex items-center gap-1 z-10">
                    <button onClick={() => generateAndPlaySpeech(msg.id, msg.content)} className={`group flex items-center gap-2 px-3.5 py-2 rounded-full shadow-lg border transition-all ${playingMessageId === msg.id ? 'bg-sage-700 text-white animate-pulse' : 'bg-white text-sage-600'}`}>
                      {playingMessageId === msg.id ? <Volume2 size={14} /> : (hasAccess ? <Volume2 size={14} /> : <Lock size={12} className="text-amber-500" />)}
                      <span className="text-[10px] font-black uppercase tracking-tighter">{hasAccess ? "Listen" : "Unlock Voice"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {msg.recommendations && msg.recommendations.length > 0 && (
              <div className="ml-11 grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 max-w-5xl animate-in slide-in-from-bottom-4">
                {msg.recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-sage-100 shadow-lg flex flex-col h-full overflow-hidden">
                    <div className="p-6 flex-1">
                      <div className="flex items-center gap-2 mb-4">
                         <div className={`p-2 rounded-lg ${rec.type === 'YOGA' ? 'bg-pink-50 text-pink-500' : rec.type === 'DIET' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                            {rec.type === 'YOGA' ? <Flower2 size={18} /> : rec.type === 'DIET' ? <Utensils size={18} /> : <Stethoscope size={18} />}
                         </div>
                         <h4 className="font-serif font-bold text-sage-900 leading-tight">{rec.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-4">{rec.summary}</p>
                      <button 
                        onClick={() => hasAccess ? (rec.type === 'REMEDY' ? setSelectedDetail(rec) : onNavigateToFeature(rec.type === 'YOGA' ? AppView.YOGA : AppView.DIET, rec.id, rec.id)) : setShowTrialPrompt(true)} 
                        className={`w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all flex items-center justify-center gap-2 ${rec.type === 'YOGA' ? 'bg-pink-500 hover:bg-pink-600' : rec.type === 'DIET' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                      >
                         {!hasAccess && <Lock size={12} />} 
                         {rec.type === 'REMEDY' ? 'Remedy Details' : rec.type === 'YOGA' ? 'Yoga Aid' : 'Nutri Heal Plan'} 
                         <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {msg.suggestions && msg.suggestions.length > 0 && (
              <div className="ml-11 mt-6 flex flex-wrap gap-2 max-w-5xl">
                {msg.suggestions.map((s, idx) => (
                  <button key={idx} onClick={() => handleAutoSend(s)} disabled={isLoading} className="bg-white border border-sage-200 px-4 py-2 rounded-full text-xs font-bold text-sage-700 hover:bg-sage-600 hover:text-white transition-all shadow-sm">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {selectedDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sage-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setSelectedDetail(null)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="bg-sage-50 p-8 border-b border-sage-100 flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold text-sage-900">{selectedDetail.title}</h2>
              <button onClick={() => setSelectedDetail(null)} className="p-2 text-gray-400 hover:text-sage-600 transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              {renderMarkdown(selectedDetail.detail || '')}
              {hasAccess && selectedDetail.type === 'REMEDY' && (
                <div className="mt-8 flex justify-end">
                   <button 
                    onClick={handleSaveRemedy} 
                    disabled={saveLoading || saveSuccess}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${saveSuccess ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                   >
                     {saveLoading ? <RefreshCw className="animate-spin" size={16} /> : saveSuccess ? <Check size={16} /> : <Save size={16} />}
                     {saveSuccess ? "Stored in Library" : "Save Remedy Details"}
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 bg-white border-t border-sage-200 relative z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.substring(0, MAX_PROMPT_LENGTH))}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Share your symptoms with Nani..."
            className="w-full bg-sage-50 border border-sage-200 rounded-3xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none h-[64px]"
          />
          <button onClick={onVoiceClick} className="p-3 text-sage-400 hover:text-sage-600 rounded-2xl transition-all"><Mic size={24} /></button>
          <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-3 bg-sage-600 text-white rounded-2xl shadow-lg transition-all active:scale-95">
            {isLoading ? <RefreshCw size={24} className="animate-spin" /> : <Send size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;