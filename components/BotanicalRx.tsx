
import React, { useState, useEffect } from 'react';
import { Leaf, Loader2, Save, Check, RefreshCw, X, FileText, Sparkles, ChevronRight, Stethoscope, ShieldCheck, HelpCircle, PenTool } from 'lucide-react';
import { FeatureContext, User } from '../types';
import { saveRemedy, getCurrentUser } from '../services/backendService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BotanicalRxProps {
  activeContext?: FeatureContext | null;
}

const BotanicalRx: React.FC<BotanicalRxProps> = ({ activeContext }) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [title, setTitle] = useState("Botanical Rx Protocol");
  const [sourceBook, setSourceBook] = useState<string | null>(null);

  useEffect(() => {
    if (activeContext) {
      setTitle(activeContext.title || "Botanical Rx Protocol");
      
      // Sanitize detail: Remove prefixes that break markdown table rendering
      let rawDetail = activeContext.detail || null;
      if (rawDetail) {
        // Remove common LLM prefixes like "Detailed Markdown Table:" or "Here is the table:"
        rawDetail = rawDetail.replace(/^(Detailed Markdown Table:|Here is the|The following table:)\s*/i, '').trim();
      }
      setDetail(rawDetail);
      setSourceBook(activeContext.sourceBook || null);
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

  const trimPdfExtension = (name: string) => {
    return name.replace(/\.pdf$/i, '').replace(/_/g, ' ');
  };

  const renderMarkdown = (content: string) => (
    <div className="markdown-content prose prose-slate max-w-none">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h3: ({node, ...props}: any) => <h3 className="font-serif font-bold text-sage-800 text-lg mt-6 mb-3 border-b border-sage-50 pb-2" {...props} />,
          p: ({node, ...props}: any) => <p className="mb-4 last:mb-0 leading-relaxed text-gray-700" {...props} />,
          table: ({node, ...props}: any) => (
            <div className="overflow-x-auto my-6 rounded-2xl border border-sage-100 shadow-md">
              <table className="min-w-full border-collapse" {...props} />
            </div>
          ),
          thead: ({node, ...props}: any) => <thead className="bg-[#568356]" {...props} />,
          th: ({node, ...props}: any) => (
            <th className="px-4 py-4 text-left text-[10px] font-bold text-white uppercase tracking-wider border-r border-white/10 last:border-r-0" {...props} />
          ),
          td: ({node, ...props}: any) => (
            <td className="px-4 py-4 text-sm text-gray-700 border-b border-sage-50" {...props} />
          ),
          tr: ({node, ...props}: any) => <tr className="even:bg-sage-50/30" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Standalone Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
            <Leaf size={24} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-slate-900">Botanical Rx</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Clinical Herbal Protocols</p>
          </div>
        </div>
        
        {detail && (
          <button 
            onClick={handleSave} 
            disabled={saveLoading || saveSuccess}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg ${
              saveSuccess 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-[#3B6EB1] text-white hover:bg-[#2e568a]'
            }`}
          >
            {saveLoading ? <RefreshCw className="animate-spin" size={16} /> : saveSuccess ? <Check size={16} /> : <Save size={16} />}
            {saveSuccess ? "Saved to Library" : "Save to Library"}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-hide">
        <div className="max-w-5xl mx-auto">
          {!detail ? (
            <div className="text-center py-32 flex flex-col items-center gap-8 animate-in fade-in duration-700">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl border border-slate-100 relative">
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-blue-100 animate-spin-slow"></div>
                <Stethoscope size={48} className="text-blue-200" />
              </div>
              <div className="space-y-3">
                <p className="text-2xl font-serif font-bold text-slate-900">Consult Nani for Guidance</p>
                <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">
                  Botanical Rx protocols are generated specifically for your ailment after a consultation.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                <HelpCircle size={14} /> Waiting for Active Context
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] border border-slate-100 p-10 md:p-16 shadow-2xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-8 duration-500 relative overflow-hidden min-h-screen flex flex-col">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                <Leaf size={200} />
              </div>
              
              <div className="mb-12 flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner">
                  <Sparkles size={32} />
                </div>
                <div>
                   <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1 block">Validating Ancient Scriptures</span>
                   <h2 className="text-4xl font-serif font-bold text-slate-900 capitalize leading-tight">{title.replace(/_/g, ' ')}</h2>
                </div>
              </div>

              <div className="mb-8 flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                  <FileText size={18} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-slate-800">Clinical Protocol</h3>
              </div>

              <div className="space-y-4 flex-1">
                {renderMarkdown(detail)}
                
                {/* Source Citation moved up right below the table */}
                <div className="mt-4 pt-4 flex flex-col items-start gap-4">
                  <p className="text-sm font-bold text-slate-800">
                    Source Citation: <span className="font-normal text-slate-600">
                      {sourceBook ? trimPdfExtension(sourceBook) : "Traditional Ayurvedic Samhitas and Naturopathic Clinical Guidelines"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Paraphrased badge moved towards the bottom */}
              <div className="mt-20 pt-10 border-t border-slate-50 flex flex-col items-start gap-4">
                 <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest bg-slate-50 px-5 py-2 rounded-full border border-slate-100">
                    <ShieldCheck size={18} className="text-blue-500" /> Paraphrased Clinical Synthesis
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BotanicalRx;
