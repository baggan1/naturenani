
import React, { useState, useEffect } from 'react';
import { Flower2, Info, Loader2, Search, X, Check, Repeat, AlertCircle, Camera, ShieldCheck, Save, Wind, Sparkles } from 'lucide-react';
import { FeatureContext, YogaPose } from '../types';
import { generateYogaRoutine } from '../services/geminiService';
import { fetchImageFromSearch } from '../services/searchService';
import { saveYogaPlan, getCurrentUser } from '../services/backendService';

interface YogaAidProps {
  activeContext?: FeatureContext | null;
}

const YogaAid: React.FC<YogaAidProps> = ({ activeContext }) => {
  const [routine, setRoutine] = useState<YogaPose[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [title, setTitle] = useState(activeContext?.title || "Yoga Aid Routine");
  const [customQuery, setCustomQuery] = useState("");
  const [selectedPose, setSelectedPose] = useState<YogaPose | null>(null);

  const loadRoutine = async (query: string, displayTitle: string) => {
    setLoading(true);
    setSaveSuccess(false);
    setTitle(displayTitle);
    try {
      const poses = await generateYogaRoutine(query);
      if (poses && poses.length > 0) {
        setRoutine(poses);
        // Fetch visuals programmatically
        setImageLoading(true);
        const posesWithImages = await Promise.all(
          poses.map(async (p) => ({
            ...p,
            image_url: await fetchImageFromSearch(p.pose_name, 'yoga')
          }))
        );
        setRoutine(posesWithImages);
        setImageLoading(false);
      }
    } catch (e) {
      console.error("Yoga Aid Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const user = getCurrentUser();
    if (!user || routine.length === 0) return;
    setSaveLoading(true);
    try {
      const result = await saveYogaPlan(user, routine, title);
      if (result) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Failed to save routine. Please ensure you have a stable connection and are signed in correctly.");
      }
    } catch (e) {
      console.error("Save Error:", e);
      alert("An unexpected error occurred while saving.");
    } finally {
      setSaveLoading(false);
    }
  };

  useEffect(() => {
    if (activeContext) {
      // Check if we have cached data from Library
      const context = activeContext as any;
      if (context.cachedPoses && context.cachedPoses.length > 0) {
        setRoutine(context.cachedPoses);
        setTitle(context.title);
        setLoading(false);
      } else if (activeContext.id) {
        loadRoutine(activeContext.id, activeContext.title);
      }
    }
  }, [activeContext]);

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    loadRoutine(customQuery, `Yoga Aid: ${customQuery}`);
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto">
      <div className="bg-sage-50 border-b border-sage-200 p-6 flex flex-col md:flex-row justify-between gap-4 items-center">
        <div>
           <h1 className="font-serif text-2xl font-bold text-sage-900 flex items-center gap-2">
             <Flower2 className="text-sage-600" /> Yoga Aid
           </h1>
           <p className="text-sage-600 mt-1 text-sm">Authentic therapeutic sequences & breathwork.</p>
        </div>
        
        <form onSubmit={handleCustomSearch} className="flex gap-2 w-full md:w-auto flex-1 max-w-md">
            <input 
              type="text" 
              placeholder="Ailment (e.g. Anxiety)..." 
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="px-4 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-sage-400 outline-none text-sm w-full"
            />
            <button type="submit" className="bg-sage-600 text-white p-2 rounded-lg hover:bg-sage-700 transition-colors">
                <Search size={20} />
            </button>
        </form>
      </div>

      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-3xl font-bold text-sage-900 capitalize">{title}</h2>
          {routine.length > 0 && !loading && (
            <button 
              onClick={handleSave}
              disabled={saveLoading || saveSuccess}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                saveSuccess 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-sage-600 text-white hover:bg-sage-700 shadow-lg shadow-sage-100'
              }`}
            >
              {saveLoading ? <Loader2 size={16} className="animate-spin" /> : saveSuccess ? <Check size={16} /> : <Save size={16} />}
              {saveSuccess ? "Saved to Library" : "Save Routine"}
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
             <Loader2 className="animate-spin text-sage-600 w-12 h-12 mb-4" />
             <p className="text-sage-700 font-bold">Nature Nani is curating your sequence...</p>
          </div>
        ) : routine.length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <Flower2 size={64} className="mx-auto mb-4" />
            <p>Start a consultation to generate a routine.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {routine.map((pose, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedPose(pose)}
                className="bg-sage-50 rounded-2xl overflow-hidden border border-sage-100 hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full"
              >
                <div className="h-48 bg-gray-200 relative overflow-hidden flex items-center justify-center">
                  {pose.image_url ? (
                    <img src={pose.image_url} alt={pose.pose_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-sage-300">
                      {imageLoading ? <Loader2 className="animate-spin" /> : (pose.type === 'Pranayama' ? <Wind size={40} /> : <Camera size={40} />)}
                      <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">
                        {imageLoading ? "Searching Archives..." : "Therapeutic Guide"}
                      </span>
                    </div>
                  )}
                  
                  <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm uppercase flex items-center gap-1 backdrop-blur-md ${
                    pose.type === 'Pranayama' ? "bg-blue-500 text-white" : "bg-sage-600 text-white"
                  }`}>
                    {pose.type === 'Pranayama' ? <Wind size={12} /> : <Flower2 size={12} />}
                    {pose.type}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                   <h3 className="font-bold text-sage-900 text-lg mb-2 truncate">{pose.pose_name}</h3>
                   <p className="text-xs text-sage-600 leading-relaxed line-clamp-2 mb-4 italic">"{pose.benefit}"</p>
                   <div className="mt-auto pt-3 border-t border-sage-100 flex items-center justify-between text-[10px] font-bold text-sage-500 uppercase tracking-widest">
                      <div className="flex items-center gap-1"><Sparkles size={12} className="text-yellow-500" /> Professional Guide</div>
                      <ChevronRight size={14} />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl flex flex-col md:flex-row overflow-hidden">
             <button onClick={() => setSelectedPose(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full z-20 hover:bg-black/70 transition-colors"><X size={20} /></button>
             <div className="w-full md:w-1/2 bg-gray-100 min-h-[300px]">
                {selectedPose.image_url ? (
                  <img src={selectedPose.image_url} alt={selectedPose.pose_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 p-8 text-center font-bold uppercase text-xs">
                    {selectedPose.type === 'Pranayama' ? 'Visual breathwork guidance provided in text' : 'No high-quality image found in archives'}
                  </div>
                )}
             </div>
             <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${selectedPose.type === 'Pranayama' ? 'bg-blue-100 text-blue-700' : 'bg-sage-100 text-sage-700'}`}>
                    {selectedPose.type} Specialist
                  </span>
                </div>
                <h2 className="text-3xl font-serif font-bold text-sage-900 mb-2">{selectedPose.pose_name}</h2>
                <div className="h-1 w-12 bg-sage-600 mb-6"></div>
                
                <div className="mb-6">
                  <h3 className="font-bold text-sage-800 mb-2 text-xs uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} className="text-yellow-500" /> Primary Benefit</h3>
                  <p className="text-gray-700 text-sm leading-relaxed italic">"{selectedPose.benefit}"</p>
                </div>

                <div className="mb-6 bg-sage-50 p-6 rounded-2xl border border-sage-100">
                  <h3 className="font-bold text-sage-800 mb-3 text-xs uppercase tracking-widest flex items-center gap-2"><Check size={14} /> How to Practice</h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedPose.instructions}
                  </p>
                </div>

                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 mt-auto">
                   <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2 text-xs uppercase tracking-widest">
                     <AlertCircle size={14} /> Contraindications
                   </h3>
                   <p className="text-red-700 text-xs italic">{selectedPose.contraindications}</p>
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

const ChevronRight: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

export default YogaAid;
