
import React, { useState, useEffect } from 'react';
import { Flower2, PlayCircle, Clock, Info, Loader2, Search, X, Check, Wind, Repeat } from 'lucide-react';
import { FeatureContext, YogaPose } from '../types';
import { generateYogaRoutine } from '../services/geminiService';

interface YogaStudioProps {
  activeContext?: FeatureContext | null;
}

// Curated high-quality Unsplash images for common poses
const POSE_IMAGES: Record<string, string> = {
  "Balasana": "https://images.unsplash.com/photo-1544367563-12123d896e89?auto=format&fit=crop&q=80&w=800",
  "Child's Pose": "https://images.unsplash.com/photo-1544367563-12123d896e89?auto=format&fit=crop&q=80&w=800",
  
  "Viparita Karani": "https://images.unsplash.com/photo-1602192509153-03726d6e43a5?auto=format&fit=crop&q=80&w=800",
  "Legs Up The Wall": "https://images.unsplash.com/photo-1602192509153-03726d6e43a5?auto=format&fit=crop&q=80&w=800",
  
  "Supta Baddha Konasana": "https://images.unsplash.com/photo-1600618528240-fb9fc964b853?auto=format&fit=crop&q=80&w=800",
  "Reclining Bound Angle": "https://images.unsplash.com/photo-1600618528240-fb9fc964b853?auto=format&fit=crop&q=80&w=800",

  "Adho Mukha Svanasana": "https://images.unsplash.com/photo-1562088287-b903a7683c4f?auto=format&fit=crop&q=80&w=800",
  "Downward-Facing Dog": "https://images.unsplash.com/photo-1562088287-b903a7683c4f?auto=format&fit=crop&q=80&w=800",

  "Vrikshasana": "https://images.unsplash.com/photo-1566501206168-995f3369d32d?auto=format&fit=crop&q=80&w=800",
  "Tree Pose": "https://images.unsplash.com/photo-1566501206168-995f3369d32d?auto=format&fit=crop&q=80&w=800",

  "Tadasana": "https://images.unsplash.com/photo-1510894347713-fc3ed6fdf539?auto=format&fit=crop&q=80&w=800",
  "Mountain Pose": "https://images.unsplash.com/photo-1510894347713-fc3ed6fdf539?auto=format&fit=crop&q=80&w=800",

  "Savasana": "https://images.unsplash.com/photo-1533221387243-7182245b0266?auto=format&fit=crop&q=80&w=800",
  "Corpse Pose": "https://images.unsplash.com/photo-1533221387243-7182245b0266?auto=format&fit=crop&q=80&w=800",

  "Sukhasana": "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?auto=format&fit=crop&q=80&w=800",
  "Easy Pose": "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?auto=format&fit=crop&q=80&w=800",
};

// Fallback high-quality yoga aesthetics
const GENERIC_IMAGES = [
  "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1593164842264-854604db0553?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1545205539-3fa5087c2103?auto=format&fit=crop&q=80&w=800",
];

const SAMPLE_ROUTINE: YogaPose[] = [
  { 
    id: 1, 
    name: "Balasana", 
    english: "Child's Pose", 
    duration: "3 mins", 
    benefit: "Calms the brain and relieves stress", 
    color: "bg-blue-100 text-blue-800",
    instructions: [
        "Kneel on the floor, touching your big toes together.",
        "Sit back on your heels and separate your knees.",
        "Exhale and lay your torso down between your thighs.",
        "Stretch your arms forward with palms down."
    ],
    breathing: "Deep, slow breathing into the back ribs.",
    reps: "Hold for 1-3 minutes"
  },
  { 
    id: 2, 
    name: "Viparita Karani", 
    english: "Legs Up The Wall", 
    duration: "5 mins", 
    benefit: "Relieves tired leg muscles", 
    color: "bg-purple-100 text-purple-800",
    instructions: [
        "Sit sideways next to a wall.",
        "Swing your legs up onto the wall as you lie back.",
        "Rest your arms by your sides, palms facing up.",
        "Close your eyes and relax completely."
    ],
    breathing: "Natural, effortless breathing.",
    reps: "Hold for 5-10 minutes"
  },
  { 
    id: 3, 
    name: "Supta Baddha Konasana", 
    english: "Reclining Bound Angle", 
    duration: "5 mins", 
    benefit: "Stimulates abdominal organs", 
    color: "bg-pink-100 text-pink-800",
    instructions: [
        "Lie on your back.",
        "Bend knees and bring soles of feet together.",
        "Let knees fall open to the sides.",
        "Place hands on belly or by sides."
    ],
    breathing: "Diaphragmatic breathing.",
    reps: "Hold for 5 minutes"
  },
];

const YogaStudio: React.FC<YogaStudioProps> = ({ activeContext }) => {
  const [routine, setRoutine] = useState<YogaPose[]>(SAMPLE_ROUTINE);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(activeContext?.title || "Relaxation Flow");
  const [customQuery, setCustomQuery] = useState("");
  const [selectedPose, setSelectedPose] = useState<YogaPose | null>(null);

  useEffect(() => {
    // If we have an ID from the Chat Handoff, generate the routine!
    const loadSpecificRoutine = async () => {
      if (activeContext?.id) {
        loadRoutine(activeContext.id, activeContext.title);
      }
    };
    loadSpecificRoutine();
  }, [activeContext]);

  const loadRoutine = async (query: string, displayTitle: string) => {
    setLoading(true);
    setTitle(displayTitle);
    try {
      const generatedPoses = await generateYogaRoutine(query);
      if (generatedPoses && generatedPoses.length > 0) {
        setRoutine(generatedPoses);
      }
    } catch (e) {
      console.error("Failed to gen yoga", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    loadRoutine(customQuery, `Yoga for: ${customQuery}`);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = GENERIC_IMAGES[0]; 
  };

  const getPoseImage = (pose: YogaPose) => {
    // 1. Try exact name match
    if (POSE_IMAGES[pose.name]) return POSE_IMAGES[pose.name];
    if (POSE_IMAGES[pose.english]) return POSE_IMAGES[pose.english];
    
    // 2. Try partial match
    const foundKey = Object.keys(POSE_IMAGES).find(k => 
      pose.name.toLowerCase().includes(k.toLowerCase()) || 
      pose.english.toLowerCase().includes(k.toLowerCase())
    );
    if (foundKey) return POSE_IMAGES[foundKey];

    // 3. Fallback to generic aesthetically pleasing stock
    return GENERIC_IMAGES[pose.id % GENERIC_IMAGES.length];
  };

  return (
    <div className="h-full flex flex-col bg-sage-50 overflow-y-auto relative">
      <div className="bg-white border-b border-sage-200 p-6 shadow-sm sticky top-0 z-10 flex flex-col md:flex-row justify-between gap-4 items-center">
        <div>
           <h1 className="font-serif text-2xl font-bold text-sage-900 flex items-center gap-2">
             <Flower2 className="text-pink-500" /> Yoga Studio
           </h1>
           <p className="text-gray-500 mt-1 text-sm">Visual guides for your healing journey.</p>
        </div>
        
        <form onSubmit={handleCustomSearch} className="flex gap-2 w-full md:w-auto flex-1 max-w-md">
            <input 
              type="text" 
              placeholder="Search by ailment (e.g. Back Pain)..." 
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none text-sm w-full"
            />
            <button type="submit" className="bg-pink-500 text-white p-2 rounded-lg hover:bg-pink-600 transition-colors">
                <Search size={20} />
            </button>
        </form>
      </div>

      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="bg-gradient-to-r from-pink-50 to-sage-50 rounded-2xl p-8 mb-8 border border-pink-100">
           <div className="flex justify-between items-start mb-2">
             <h2 className="font-serif text-2xl font-bold text-sage-900 capitalize">{title}</h2>
             <span className="bg-white/50 text-pink-700 px-3 py-1 rounded-full text-xs font-bold border border-pink-100">{routine.length} Poses</span>
           </div>
           <p className="text-gray-600 mb-8">
             {loading 
                ? "Consulting the texts to build your custom sequence..." 
                : `Based on the query, here is a specific sequence to help alleviate discomfort.`}
           </p>
           
           {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-pink-400 w-12 h-12 mb-4" />
                <p className="text-pink-800 animate-pulse font-medium">Selecting the best poses...</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {routine.map(pose => (
                 <div 
                    key={pose.id} 
                    onClick={() => setSelectedPose(pose)}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full"
                 >
                   <div className="h-56 bg-gray-100 relative overflow-hidden">
                      <img 
                        src={getPoseImage(pose)}
                        alt={pose.name}
                        onError={handleImageError}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm flex items-center gap-1">
                        <Clock size={12} className="text-pink-500" /> {pose.duration}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="bg-white/30 backdrop-blur-md p-3 rounded-full text-white border border-white/50 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                            <PlayCircle size={32} fill="white" className="text-pink-500" />
                         </div>
                      </div>
                   </div>
                   <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-800 text-lg mb-1">{pose.name}</h3>
                      <p className="text-sm text-gray-500 font-medium mb-3 italic">{pose.english}</p>
                      
                      <div className="mt-auto pt-3 border-t border-gray-50">
                         <div className="flex items-start gap-2">
                            <Info size={14} className="text-pink-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{pose.benefit}</p>
                         </div>
                      </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>
        
        {!loading && (
          <div className="text-center pb-10">
              <p className="text-sm text-gray-400 mb-4">Click on any card to view detailed instructions</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl flex flex-col md:flex-row overflow-hidden">
             
             <button 
               onClick={() => setSelectedPose(null)}
               className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full z-20 transition-colors border border-white/20"
             >
               <X size={20} />
             </button>

             {/* Image Side */}
             <div className="w-full md:w-2/5 bg-gray-100 relative min-h-[300px]">
                <img 
                   src={getPoseImage(selectedPose)}
                   alt={selectedPose.name}
                   onError={handleImageError}
                   className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white md:hidden">
                   <h2 className="text-2xl font-bold">{selectedPose.name}</h2>
                   <p className="opacity-90">{selectedPose.english}</p>
                </div>
             </div>

             {/* Content Side */}
             <div className="w-full md:w-3/5 p-8 md:p-10 bg-white overflow-y-auto">
                <div className="hidden md:block mb-6">
                   <h2 className="text-3xl font-serif font-bold text-gray-900">{selectedPose.name}</h2>
                   <p className="text-xl text-gray-500 italic">{selectedPose.english}</p>
                </div>

                <div className="flex gap-4 mb-8">
                   <div className="bg-pink-50 text-pink-800 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                      <Clock size={16} /> {selectedPose.duration}
                   </div>
                   <div className="bg-sage-50 text-sage-800 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                      <Wind size={16} /> {selectedPose.breathing || "Steady breathing"}
                   </div>
                </div>

                <div className="space-y-8">
                   {/* Instructions */}
                   <div>
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                         <span className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                         Instructions
                      </h3>
                      <div className="space-y-3 pl-3 border-l-2 border-pink-100">
                         {(selectedPose.instructions || ["Sit comfortably.", "Breathe.", "Relax."]).map((step, idx) => (
                            <div key={idx} className="flex gap-3">
                               <Check size={16} className="text-pink-400 mt-1 shrink-0" />
                               <p className="text-gray-700 leading-relaxed">{step}</p>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* Reps */}
                   <div>
                      <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-lg">
                         <span className="bg-sage-100 text-sage-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                         Repetitions
                      </h3>
                      <div className="bg-sage-50 p-4 rounded-xl border border-sage-100 flex items-start gap-3">
                         <Repeat size={18} className="text-sage-500 mt-1" />
                         <p className="text-gray-700">{selectedPose.reps || "Hold for duration."}</p>
                      </div>
                   </div>

                   {/* Benefit */}
                   <div>
                      <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-lg">
                         <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                         Key Benefit
                      </h3>
                      <p className="text-gray-600 pl-11">{selectedPose.benefit}</p>
                   </div>
                </div>

             </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default YogaStudio;
