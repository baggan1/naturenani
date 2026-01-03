
import React, { useState, useEffect } from 'react';
import { Utensils, ShoppingCart, Loader2, Search, X, ChefHat, Check, Camera, BookOpen, Save, ListChecks } from 'lucide-react';
import { FeatureContext, DayPlan, Meal } from '../types';
import { generateDietPlan } from '../services/geminiService';
import { fetchImageFromSearch } from '../services/searchService';
import { saveMealPlan, getCurrentUser } from '../services/backendService';

interface NutriHealProps {
  activeContext?: FeatureContext | null;
}

const NutriHeal: React.FC<NutriHealProps> = ({ activeContext }) => {
  const [plan, setPlan] = useState<DayPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [title, setTitle] = useState(activeContext?.title || "Nutri Heal Plan");
  const [customQuery, setCustomQuery] = useState("");
  const [selectedMeal, setSelectedMeal] = useState<Meal | any>(null);

  const loadPlan = async (query: string, displayTitle: string) => {
    setLoading(true);
    setSaveSuccess(false);
    setTitle(displayTitle);
    try {
      const data = await generateDietPlan(query);
      if (data.meals && data.meals.length > 0) {
        const meals: Meal[] = data.meals;
        const days: DayPlan[] = [
          { day: "Day 1", meals: meals.slice(0, 3) },
          { day: "Day 2", meals: meals.slice(3, 6) },
          { day: "Day 3", meals: meals.slice(6, 9) }
        ];
        setPlan(days);

        setImageLoading(true);
        const updatedDays = await Promise.all(days.map(async (day) => ({
          ...day,
          meals: await Promise.all(day.meals.map(async (meal) => ({
            ...meal,
            image_url: await fetchImageFromSearch(meal.search_query, 'food')
          })))
        })));
        setPlan(updatedDays);
        setImageLoading(false);
      }
    } catch (e) {
      console.error("Nutri Heal Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const user = getCurrentUser();
    if (!user || plan.length === 0) return;
    setSaveLoading(true);
    try {
      const result = await saveMealPlan(user, plan, title);
      if (result) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Failed to save plan. Please ensure you are signed in and have a stable connection.");
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
      if (context.cachedPlan && context.cachedPlan.length > 0) {
        setPlan(context.cachedPlan);
        setTitle(context.title);
        setLoading(false);
      } else if (activeContext.id) {
        loadPlan(activeContext.id, activeContext.title);
      }
    }
  }, [activeContext]);

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto">
      <div className="bg-orange-50 border-b border-orange-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h1 className="font-serif text-2xl font-bold text-orange-900 flex items-center gap-2">
             <Utensils className="text-orange-600" /> Nutri Heal
           </h1>
           <p className="text-orange-700 mt-1 text-sm">Targeted nutrition for clinical recovery.</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); loadPlan(customQuery, `Nutri Heal: ${customQuery}`); }} className="flex gap-2 w-full md:w-auto flex-1 max-w-md">
            <input type="text" placeholder="Ailment (e.g. Indigestion)..." value={customQuery} onChange={(e) => setCustomQuery(e.target.value)} className="px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none text-sm w-full" />
            <button type="submit" className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700 transition-colors"><Search size={20} /></button>
        </form>
      </div>

      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-serif text-3xl font-bold text-orange-900">{title}</h2>
          {plan.length > 0 && !loading && (
             <button 
              onClick={handleSave}
              disabled={saveLoading || saveSuccess}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                saveSuccess 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-100'
              }`}
            >
              {saveLoading ? <Loader2 size={16} className="animate-spin" /> : saveSuccess ? <Check size={16} /> : <Save size={16} />}
              {saveSuccess ? "Saved to Library" : "Save Plan"}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
             <Loader2 className="animate-spin text-orange-600 w-12 h-12 mb-4" />
             <p className="text-orange-700 font-bold">Chef Nani is validating your recipes...</p>
          </div>
        ) : plan.length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <ShoppingCart size={64} className="mx-auto mb-4" />
            <p>Enter an ailment to receive a 3-day healing menu.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {plan.map((day, dIdx) => (
              <div key={dIdx} className="animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-xs font-black text-orange-400 uppercase tracking-[0.2em] mb-4 border-b border-orange-100 pb-2">{day.day}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {day.meals.map((meal, mIdx) => (
                    <div key={mIdx} onClick={() => setSelectedMeal(meal)} className="bg-white border border-orange-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group">
                       <div className="h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                          {meal.image_url ? <img src={meal.image_url} alt={meal.dish_name} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center gap-1 text-orange-200">{imageLoading ? <Loader2 className="animate-spin" /> : <Camera size={24} />}<span className="text-[8px] font-bold uppercase">Sourcing Visual</span></div>}
                       </div>
                       <div className="p-4">
                          <span className="text-[10px] font-bold text-orange-500 uppercase">{meal.type}</span>
                          <h4 className="font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors truncate">{meal.dish_name}</h4>
                          <p className="text-[10px] text-gray-500 line-clamp-2 italic">"{meal.benefit}"</p>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl p-8 md:p-12">
             <button onClick={() => setSelectedMeal(null)} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
             
             <div className="mb-8">
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{selectedMeal.type}</span>
                <h2 className="text-3xl font-serif font-bold text-gray-900 mt-4">{selectedMeal.dish_name}</h2>
                <p className="text-orange-700 font-medium italic mt-2">"{selectedMeal.benefit}"</p>
             </div>

             <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2"><ChefHat size={18} /> Ingredients</h3>
                    <ul className="space-y-2">
                        {selectedMeal.ingredients.map((ing: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><Check size={14} className="text-orange-500 mt-1" /> {ing}</li>
                        ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2"><BookOpen size={18} /> Medicinal Purpose</h3>
                    <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 text-orange-900 text-sm leading-relaxed">
                        This meal is specifically chosen to target your ailment by balancing inflammation and providing essential micronutrients found in {selectedMeal.ingredients[0]}.
                    </div>
                  </div>
                </div>

                <div className="border-t pt-8">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-xs uppercase tracking-widest border-b pb-2"><ListChecks size={18} /> Preparation Steps</h3>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-inner whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                    {selectedMeal.preparation_instructions || "Standard preparation: Clean all ingredients, steam if required, and combine with minimal processing to retain nutritional value."}
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutriHeal;
