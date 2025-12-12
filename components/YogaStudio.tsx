
import React, { useState, useEffect } from 'react';
import { Flower2, PlayCircle, Clock, Info, Loader2 } from 'lucide-react';
import { FeatureContext, YogaPose } from '../types';
import { generateYogaRoutine } from '../services/geminiService';

interface YogaStudioProps {
  activeContext?: FeatureContext | null;
}

const SAMPLE_ROUTINE: YogaPose[] = [
  { id: 1, name: "Balasana", english: "Child's Pose", duration: "3 mins", benefit: "Calms the brain and relieves stress", color: "bg-blue-100 text-blue-800" },
  { id: 2, name: "Viparita Karani", english: "Legs Up The Wall", duration: "5 mins", benefit: "Relieves tired leg muscles", color: "bg-purple-100 text-purple-800" },
  { id: 3, name: "Supta Baddha Konasana", english: "Reclining Bound Angle", duration: "5 mins", benefit: "Stimulates abdominal organs", color: "bg-pink-100 text-pink-800" },
];

const YogaStudio: React.FC<YogaStudioProps> = ({ activeContext }) => {
  const [routine, setRoutine] = useState<YogaPose[]>(SAMPLE_ROUTINE);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(activeContext?.title || "Relaxation Flow");

  useEffect(() => {
    // If we have an ID from the Chat Handoff, generate the routine!
    const loadSpecificRoutine = async () => {
      if (activeContext?.id) {
        setLoading(true);
        setTitle(activeContext.title);
        try {
          const generatedPoses = await generateYogaRoutine(activeContext.id);
          if (generatedPoses && generatedPoses.length > 0) {
            setRoutine(generatedPoses);
          }
        } catch (e) {
          console.error("Failed to gen yoga", e);
        } finally {
          setLoading(false);
        }
      }
    };

    loadSpecificRoutine();
  }, [activeContext]);

  return (
    <div className="h-full flex flex-col bg-sage-50 overflow-y-auto">
      <div className="bg-white border-b border-sage-200 p-6 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-sage-900 flex items-center gap-2">
          <Flower2 className="text-pink-500" /> Yoga Studio
        </h1>
        <p className="text-gray-500 mt-1">Visual guides for your healing journey.</p>
      </div>

      <div className="p-8 max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-r from-pink-50 to-sage-50 rounded-2xl p-8 mb-8 border border-pink-100">
           <h2 className="font-serif text-xl font-bold text-sage-900 mb-2">{title}</h2>
           <p className="text-gray-600 mb-6">
             {loading 
                ? "Consulting the texts to build your custom sequence..." 
                : `Based on your consultation, here is a specific sequence to help alleviate discomfort.`}
           </p>
           
           {loading ? (
             <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-pink-400 w-10 h-10" />
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {routine.map(pose => (
                 <div key={pose.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                   <div className="h-40 bg-gray-100 flex items-center justify-center relative group">
                      <Flower2 size={40} className="text-gray-300" />
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                         <PlayCircle size={48} className="text-white drop-shadow-lg" />
                      </div>
                   </div>
                   <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                         <h3 className="font-bold text-gray-800">{pose.name}</h3>
                         <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${pose.color || "bg-sage-100 text-sage-700"}`}>{pose.duration}</span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium mb-3">{pose.english}</p>
                      <div className="bg-gray-50 p-2 rounded-lg flex items-start gap-2">
                         <Info size={14} className="text-sage-500 mt-0.5 shrink-0" />
                         <p className="text-xs text-gray-600 leading-tight">{pose.benefit}</p>
                      </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>
        
        {!loading && (
          <div className="text-center">
              <button className="bg-sage-800 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-sage-900 transition-colors flex items-center gap-2 mx-auto">
                 <PlayCircle size={20} /> Start Guided Session
              </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default YogaStudio;
