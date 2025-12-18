
import React, { useState, useEffect } from 'react';
import { BookMarked, Flower2, Utensils, Loader2, Trash2, Calendar, ChevronRight, Wind, Sparkles } from 'lucide-react';
import { SavedMealPlan, SavedYogaPlan, User, AppView } from '../types';
import { getUserLibrary } from '../services/backendService';

interface LibraryProps {
  user: User;
  onNavigate: (view: any, context?: any) => void;
}

const Library: React.FC<LibraryProps> = ({ user, onNavigate }) => {
  const [library, setLibrary] = useState<{ diet: SavedMealPlan[], yoga: SavedYogaPlan[] }>({ diet: [], yoga: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLibrary = async () => {
      const data = await getUserLibrary(user);
      setLibrary(data);
      setLoading(false);
    };
    fetchLibrary();
  }, [user]);

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-sage-50">
        <Loader2 className="animate-spin text-sage-600 w-12 h-12 mb-4" />
        <p className="text-sage-700 font-bold">Opening your healing library...</p>
      </div>
    );
  }

  const isEmpty = library.diet.length === 0 && library.yoga.length === 0;

  return (
    <div className="h-full flex flex-col bg-sage-50 overflow-y-auto">
      <div className="bg-white border-b border-sage-200 p-6 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-sage-900 flex items-center gap-2">
          <BookMarked className="text-sage-600" /> My Healing Library
        </h1>
        <p className="text-gray-500 mt-1">Your saved protocols for clinical wellness.</p>
      </div>

      <div className="p-8 max-w-6xl mx-auto w-full space-y-12">
        {isEmpty ? (
          <div className="text-center py-20 opacity-40">
            <BookMarked size={64} className="mx-auto mb-4" />
            <p className="font-bold text-lg">Your library is empty.</p>
            <p className="text-sm">Generate and save a routine to see it here.</p>
          </div>
        ) : (
          <>
            {/* Yoga Routines */}
            {library.yoga.length > 0 && (
              <section>
                <h2 className="text-xs font-black text-sage-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Flower2 size={14} className="text-pink-500" /> Saved Yoga Routines
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {library.yoga.map((plan) => (
                    <div 
                      key={plan.id}
                      onClick={() => onNavigate('YOGA', { id: plan.title, title: plan.title, cachedPoses: plan.poses })}
                      className="bg-white p-6 rounded-2xl border border-sage-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                          <Wind size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                          <Calendar size={10} /> {formatDate(plan.created_at)}
                        </span>
                      </div>
                      <h3 className="font-bold text-sage-900 mb-2 truncate group-hover:text-sage-600 transition-colors">{plan.title}</h3>
                      <p className="text-xs text-gray-500 mb-4">{plan.poses.length} Therapeutic Practices</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-sage-500 uppercase">
                        View Routine <ChevronRight size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Diet Plans */}
            {library.diet.length > 0 && (
              <section>
                <h2 className="text-xs font-black text-orange-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Utensils size={14} /> Saved Diet Protocols
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {library.diet.map((plan) => (
                    <div 
                      key={plan.id}
                      onClick={() => onNavigate('DIET', { id: plan.title, title: plan.title, cachedPlan: plan.plan_data })}
                      className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                          <Utensils size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                          <Calendar size={10} /> {formatDate(plan.created_at)}
                        </span>
                      </div>
                      <h3 className="font-bold text-sage-900 mb-2 truncate group-hover:text-orange-600 transition-colors">{plan.title}</h3>
                      <p className="text-xs text-gray-500 mb-4">3-Day Meal Plan</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-orange-500 uppercase">
                        View Plan <ChevronRight size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Library;
