
import React, { useState, useEffect } from 'react';
// Added ShieldCheck to the imports from lucide-react
import { Leaf, Search, Loader2, Save, Check, RefreshCw, X, FileText, Sparkles, ChevronRight, Stethoscope, ShieldCheck } from 'lucide-react';
import { FeatureContext, User } from '../types';
import { saveRemedy, getCurrentUser } from '../services/backendService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BotanicalRxProps {
  activeContext?: FeatureContext | null;
}

const BotanicalRx: React.FC<BotanicalRxProps> = ({ activeContext }) => {
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [title, setTitle] = useState("Botanical Rx Protocol");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeContext) {
      setTitle(activeContext.title);
      setDetail(activeContext.detail || null);
    }
  }, [activeContext]);

  const handleSave = async () => {
    const user = getCurrentUser();
    if (!user || !detail) return;
    setSaveLoading(true);
    try {
      const result = await saveRemedy(user, detail, title);
      if (result) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      setSaveLoading(false);
    }
  };

  const renderMarkdown = (content: string) => (
    <div className="markdown-content prose prose-slate max-w-none">
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

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="bg-blue-50 border-b border-blue-100 p-6 flex items-center justify-between">
        <div>
           <h1 className="font-serif text-2xl font-bold text-blue-900 flex items-center gap-2">
             <Leaf className="text-blue-600" /> Botanical Rx
           </h1>
           <p className="text-blue-700 mt-1 text-sm">Clinical herbal protocols & clinical dosages.</p>
        </div>
        {detail && (
          <button 
            onClick={handleSave} 
            disabled={saveLoading || saveSuccess}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${saveSuccess ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'}`}
          >
            {saveLoading ? <RefreshCw className="animate-spin" size={16} /> : saveSuccess ? <Check size={16} /> : <Save size={16} />}
            {saveSuccess ? "Stored in Library" : "Save Protocol"}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8 md:p-12">
        <div className="max-w-4xl mx-auto">
          {!detail ? (
            <div className="text-center py-32 opacity-30 flex flex-col items-center gap-6">
              <Stethoscope size={80} className="text-blue-200" />
              <div className="space-y-2">
                <p className="text-2xl font-serif font-bold text-blue-900">No Protocol Active</p>
                <p className="text-sm font-medium">Please initiate a consultation to generate a Botanical Rx.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-blue-50 p-10 shadow-xl shadow-blue-900/5 animate-in fade-in slide-in-from-bottom-4">
              <div className="mb-10 flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                  <Sparkles size={28} />
                </div>
                <div>
                   <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1 block">Ancient Wisdom Validated</span>
                   <h2 className="text-3xl font-serif font-bold text-slate-900 capitalize">{title} Protocol</h2>
                </div>
              </div>
              {renderMarkdown(detail)}
              <div className="mt-12 pt-8 border-t border-blue-50 flex items-center justify-between text-blue-400">
                 <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                    <ShieldCheck size={16} /> Paraphrased for Educational Accuracy
                 </div>
                 <div className="text-[10px] font-black uppercase tracking-widest">Global Wellness Archives v2.5</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BotanicalRx;
