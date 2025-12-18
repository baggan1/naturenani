
import React, { useState, useEffect } from 'react';
import { Flower2, Info, Loader2, Search, X, Check, Repeat, AlertCircle, Camera } from 'lucide-react';
import { FeatureContext, YogaPose } from '../types';
import { generateYogaRoutine } from '../services/geminiService';
import { fetchImageFromSearch } from '../services/searchService';

interface YogaAidProps {
  activeContext?: FeatureContext | null;
}

const YogaAid: React.FC<YogaAidProps> = ({ activeContext }) => {
  const [routine, setRoutine] = useState<YogaPose[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [title, setTitle] = useState(activeContext?.title || "Yoga Aid Routine");
  const [customQuery, setCustomQuery] = useState("");
  const [selectedPose, setSelectedPose] = useState<YogaPose | null>(null);

  const loadRoutine = async (query: string, displayTitle: string) => {
    setLoading(true);
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

  useEffect(() => {
    if (activeContext?.id) {
      loadRoutine(activeContext.id, activeContext.title);
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
           <p className="text-sage-600 mt-1 text-sm">Programmatic visuals from reliable practitioners.</p>
        </div>
        
        <form onSubmit={handleCustomSearch} className="flex gap-2 w-full md:w-auto flex-1 max-w-md">
            <input 
              type="text" 
              placeholder="Ailment (e.g. Back Pain)..." 
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
        <h2 className="font-serif text-3xl font-bold text-sage-900 mb-6 capitalize">{title}</h2>
        
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {routine.map((pose, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedPose(pose)}
                className="bg-sage-50 rounded-2xl overflow-hidden border border-sage-100 hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full"
              >
                <div className="h-64 bg-gray-200 relative overflow-hidden flex items-center justify-center">
                  {pose.image_url ? (
                    <img src={pose.image_url} alt={pose.pose_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-sage-300">
                      {imageLoading ? <Loader2 className="animate-spin" /> : <Camera size={40} />}
                      <span className="text-[10px] font-bold uppercase tracking-widest">Fetching authentic visual...</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-sage-800 shadow-sm uppercase">
                    Verification Pending
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                   <h3 className="font-bold text-sage-900 text-xl mb-2">{pose.pose_name}</h3>
                   <p className="text-xs text-sage-600 leading-relaxed line-clamp-3 mb-4">{pose.benefit}</p>
                   <div className="mt-auto flex items-center gap-2 text-[10px] font-bold text-sage-500 uppercase tracking-widest">
                      <Info size={14} /> View Contraindications
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
             <button onClick={() => setSelectedPose(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full z-20"><X size={20} /></button>
             <div className="w-full md:w-1/2 bg-gray-100 min-h-[300px]">
                {selectedPose.image_url ? <img src={selectedPose.image_url} alt={selectedPose.pose_name} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-gray-400">No high-quality image found</div>}
             </div>
             <div className="w-full md:w-1/2 p-10 flex flex-col">
                <h2 className="text-3xl font-serif font-bold text-sage-900 mb-2">{selectedPose.pose_name}</h2>
                <div className="h-1 w-12 bg-sage-600 mb-6"></div>
                
                <h3 className="font-bold text-sage-800 mb-2 text-sm uppercase tracking-widest">Primary Benefit</h3>
                <p className="text-gray-700 leading-relaxed mb-8">{selectedPose.benefit}</p>

                <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                   <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                     <AlertCircle size={18} /> Contraindications
                   </h3>
                   <p className="text-red-700 text-sm italic">{selectedPose.contraindications}</p>
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default YogaAid;
