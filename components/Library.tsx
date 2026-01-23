import React, { useState, useEffect, useMemo } from 'react';
import { BookMarked, Flower2, Utensils, Loader2, Trash2, Calendar, ChevronRight, Wind, Sparkles, Stethoscope, FileText, X, CheckCircle2 } from 'lucide-react';
import { SavedMealPlan, SavedYogaPlan, User, AppView } from '../types';
import { getUserLibrary } from '../services/backendService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LibraryProps {
  user: User;
  onNavigate: (view: any, context?: any) => void;
}

interface GroupedAilment {
  title: string;
  remedy?: any;
  yoga?: any;
  diet?: any;
  lastUpdated: string;
}

const Library: React.FC<LibraryProps> = ({ user, onNavigate }) => {
  const [library, setLibrary] = useState<{ diet: SavedMealPlan[], yoga: SavedYogaPlan[], remedy: any[] }>({ diet: [], yoga: [], remedy: [] });
  const [loading, setLoading] = useState(true);
  const [viewingRemedy, setViewingRemedy] = useState<any>(null);

  useEffect(() => {
    const fetchLibrary = async () => {
      const data = await getUserLibrary(user);
      setLibrary(data);
      setLoading(false);
    };
    fetchLibrary();
  }, [user]);

  const groupedAilments = useMemo(() => {
    const groups: Record<string, GroupedAilment> = {};
    
    const isGeneric = (title: string) => {
      const t = title.toLowerCase();
      return t === 'remedy details' || t === 'yoga aid' || t === 'nutri-heal plan' || t === 'general wellness';
    };

    // Helper to add or update group
    const addToGroup = (title: string, data: any, type: 'remedy' | 'yoga' | 'diet') => {
      const key = title.trim().toLowerCase();
      if (!groups[key]) {
        groups[key] = { title: title.trim(), lastUpdated: data.created_at };
      }
      groups[key][type] = data;
      if (new Date(data.created_at) > new Date(groups[key].lastUpdated)) {
        groups[key].lastUpdated = data.created_at;
      }
      // If the current title is generic but we have an ailment name stored in the group, don't overwrite it
      if (isGeneric(groups[key].title) && !isGeneric(title)) {
        groups[key].title = title.trim();
      }
    };

    // Group Remedies
    library.remedy.forEach(r => addToGroup(r.title, r, 'remedy'));
    // Group Yoga
    library.yoga.forEach(y => addToGroup(y.title, y, 'yoga'));
    // Group Diet
    library.diet.forEach(d => addToGroup(d.title, d, 'diet'));

    // Filter out generic entries that have no partner
    return Object.values(groups)
      .filter(g => !isGeneric(g.title) || (g.remedy && g.yoga && g.diet)) 
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 5);
  }, [library]);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-sage-50">
        <Loader2 className="animate-spin text-sage-600 w-12 h-12 mb-4" />
        <p className="text-sage-700 font-bold uppercase text-[10px] tracking-widest">Opening your healing library...</p>
      </div>
    );
  }

  const isEmpty = groupedAilments.length === 0;

  return (
    <div className="h-full flex flex-col bg-sage-50 overflow-y-auto pb-20">
      <div className="bg-white border-b border-sage-200 p-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-sage-900 flex items-center gap-3">
              <BookMarked className="text-sage-600" /> Saved Healing Library
            </h1>
            <p className="text-gray-500 mt-1 text-sm">A centralized record of your personalized holistic protocols.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-sage-50 border border-sage-100 rounded-full shadow-sm">
            <span className="text-[10px] font-black text-sage-600 uppercase tracking-widest">{groupedAilments.length} / 5 Ailments Stored</span>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto w-full">
        {isEmpty ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-sage-300">
            <div className="w-20 h-20 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookMarked size={40} className="text-sage-300" />
            </div>
            <p className="font-serif text-2xl font-bold text-sage-900 mb-2">No Protocols Stored</p>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">Start a consultation and use the "Save" button on any recommendation card.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-sage-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-sage-600 text-white">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] font-sans">Ailment / Concern</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] font-sans text-center">🌿 Remedy</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] font-sans text-center">🧘 Yoga Aid</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] font-sans text-center">🥗 Nutri Heal</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] font-sans text-right">Last Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-50">
                  {groupedAilments.map((group, idx) => (
                    <tr key={idx} className="hover:bg-sage-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="font-serif font-bold text-sage-900 text-lg group-hover:text-sage-600 transition-colors capitalize">
                          {group.title}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">Verified Protocol</div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        {group.remedy ? (
                          <button 
                            onClick={() => setViewingRemedy(group.remedy)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          >
                            <FileText size={14} /> View Details
                          </button>
                        ) : <span className="text-gray-200 text-[10px] font-bold">---</span>}
                      </td>
                      <td className="px-6 py-6 text-center">
                        {group.yoga ? (
                          <button 
                            onClick={() => onNavigate('YOGA', { id: group.yoga.title, title: group.yoga.title, cachedPoses: group.yoga.poses })}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-700 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-pink-600 hover:text-white transition-all shadow-sm"
                          >
                            <Flower2 size={14} /> Open Studio
                          </button>
                        ) : <span className="text-gray-200 text-[10px] font-bold">---</span>}
                      </td>
                      <td className="px-6 py-6 text-center">
                        {group.diet ? (
                          <button 
                            onClick={() => onNavigate('DIET', { id: group.diet.title, title: group.diet.title, cachedPlan: group.diet.plan_data })}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                          >
                            <Utensils size={14} /> View Plan
                          </button>
                        ) : <span className="text-gray-200 text-[10px] font-bold">---</span>}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="text-[10px] font-bold text-gray-400">{formatDate(group.lastUpdated)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Remedy Details Modal */}
      {viewingRemedy && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-sage-900/70 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setViewingRemedy(null)}>
          <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-sage-50 p-8 border-b border-sage-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 block">Library Record</span>
                <h2 className="text-2xl font-serif font-bold text-sage-900 capitalize">{viewingRemedy.title}</h2>
              </div>
              <button onClick={() => setViewingRemedy(null)} className="p-2 text-gray-400 hover:text-sage-600 transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 md:p-12 text-left">
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
                  {viewingRemedy.detail || ''}
                </ReactMarkdown>
              </div>
            </div>
            <div className="p-6 bg-sage-50 border-t border-sage-100 flex justify-center">
               <button onClick={() => setViewingRemedy(null)} className="px-8 py-3 bg-sage-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg">Close Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;