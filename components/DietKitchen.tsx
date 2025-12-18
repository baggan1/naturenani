
import React, { useState, useEffect } from 'react';
import { Utensils, ShoppingCart, Loader2, X, Search, Save, Book, ChefHat, Clock, Flame, Check, ArrowRight, Leaf } from 'lucide-react';
import { FeatureContext, SavedMealPlan, DayPlan, Meal } from '../types';
import { generateDietPlan } from '../services/geminiService';
import { saveMealPlan, getUserMealPlans, getCurrentUser } from '../services/backendService';

interface DietKitchenProps {
  activeContext?: FeatureContext | null;
}

const DietKitchen: React.FC<DietKitchenProps> = ({ activeContext }) => {
  const [plan, setPlan] = useState<DayPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(activeContext?.title || "Ayurvedic Kitchen");
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [customQuery, setCustomQuery] = useState("");
  
  // Save/Load Logic
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [savedPlans, setSavedPlans] = useState<SavedMealPlan[]>([]);

  const loadPlan = async (queryId: string, displayTitle: string) => {
    setLoading(true);
    setTitle(displayTitle);
    setPlan([]); // Reset previous plan
    
    try {
      const generatedPlan = await generateDietPlan(queryId);
      if (generatedPlan && generatedPlan.length > 0) {
        setPlan(generatedPlan as DayPlan[]);
      }
    } catch (e) {
      console.error("Failed to gen diet", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If context passed from chat, load it automatically
    if (activeContext?.id) {
       loadPlan(activeContext.id, activeContext.title);
    }
  }, [activeContext]);

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    loadPlan(customQuery, `Diet for: ${customQuery}`);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000&auto=format&fit=crop"; 
  };

  const handleSavePlan = async () => {
    const user = getCurrentUser();
    if (!user) {
      alert("Please log in to save plans.");
      return;
    }
    
    setIsSaving(true);
    await saveMealPlan(user, plan, title);
    setIsSaving(false);
    alert("Plan saved successfully!");
  };

  const openSavedPlans = async () => {
    const user = getCurrentUser();
    if (!user) {
      alert("Please log in to view saved plans.");
      return;
    }
    
    setShowSavedModal(true);
    const plans = await getUserMealPlans(user);
    setSavedPlans(plans);
  };

  const loadSavedPlan = (saved: SavedMealPlan) => {
    setTitle(saved.title);
    setPlan(saved.plan_data);
    setShowSavedModal(false);
  };

  // Helper to generate recipe-focused image URL
  const getRecipeImageUrl = (meal: Meal) => {
    // Prompt focused on the final plated dish
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(`Gourmet plated ${meal.name}, authentic Ayurvedic ${meal.type} dish, professional food photography, natural cinematic lighting, top down view, high resolution, delicious presentation`)}?width=400&height=300&nologo=true`;
  };
  
  const getRecipeImageUrlLarge = (meal: Meal) => {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(`Close up of a delicious ${meal.name}, healthy Ayurvedic meal, steam rising, professional food styling, warm aesthetic kitchen background, 8k resolution`)}?width=800&height=1000&nologo=true`;
  };

  return (
    <div className="h-full flex flex-col bg-sage-50 overflow-y-auto relative">
      <div className="bg-white border-b border-sage-200 p-6 shadow-sm sticky top-0 z-10 flex flex-col md:flex-row justify-between gap-4 items-center">
        <div>
           <h1 className="font-serif text-2xl font-bold text-sage-900 flex items-center gap-2">
             <Utensils className="text-orange-500" /> Ayurvedic Kitchen
           </h1>
           <p className="text-gray-500 mt-1 text-sm">Personalized meal plans for your internal balance.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto items-center">
           <button 
             onClick={openSavedPlans}
             className="text-sage-700 p-2 hover:bg-sage-100 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
             title="My Meal Plan"
           >
              <Book size={20} /> <span className="hidden md:inline">My Meal Plan</span>
           </button>

           <div className="h-6 w-px bg-gray-200 mx-1 hidden md:block"></div>

           <form onSubmit={handleCustomSearch} className="flex gap-2 w-full md:w-auto flex-1">
              <input 
                type="text" 
                placeholder="Enter ailment (e.g. Migraine)..." 
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-300 outline-none text-sm w-full"
              />
              <button type="submit" className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-colors">
                 <Search size={20} />
              </button>
           </form>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="font-serif text-3xl font-bold text-sage-900 capitalize">{title}</h2>
            <p className="text-gray-600 mt-1">Focus on warm, fresh ingredients to aid digestion.</p>
          </div>
          
          <div className="flex gap-2">
            {plan.length > 0 && (
              <button 
                onClick={handleSavePlan}
                disabled={loading || isSaving}
                className="flex items-center gap-2 bg-white text-sage-700 border border-sage-200 px-5 py-2.5 rounded-xl font-bold hover:bg-sage-50 transition-all shadow-sm disabled:opacity-50"
              >
                 {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                 Save Plan
              </button>
            )}

            <button 
              onClick={() => setShowShoppingList(true)}
              disabled={loading || plan.length === 0}
              className="flex items-center gap-2 bg-sage-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-sage-900 transition-all shadow-md disabled:opacity-50"
            >
              <ShoppingCart size={18} /> Shopping List
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-sage-600">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="animate-pulse font-medium">Chef Nani is preparing your menu...</p>
          </div>
        ) : plan.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <Utensils className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400">No Plan Generated Yet</h3>
            <p className="text-gray-400 mt-2">Use the search bar above or consult the chat to create a diet plan.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {plan.map((day, dIdx) => (
              <div key={dIdx} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${dIdx * 100}ms` }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {day.day}
                  </span>
                  <div className="h-px bg-sage-200 flex-1"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {day.meals.map((meal, mIdx) => (
                    <div 
                      key={mIdx}
                      onClick={() => setSelectedMeal(meal)}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full"
                    >
                      <div className="h-48 overflow-hidden relative bg-gray-50">
                        <img 
                          src={getRecipeImageUrl(meal)} 
                          alt={meal.name}
                          onError={handleImageError}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                          {meal.type}
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-1 leading-tight group-hover:text-orange-600 transition-colors">
                          {meal.name}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {meal.ingredients.slice(0, 3).map((ing, i) => (
                            <span key={i} className="text-[10px] bg-gray-50 text-gray-500 px-2 py-1 rounded-md border border-gray-100">
                              {ing}
                            </span>
                          ))}
                          {meal.ingredients.length > 3 && (
                            <span className="text-[10px] bg-gray-50 text-gray-400 px-2 py-1 rounded-md border border-gray-100">
                              +{meal.ingredients.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recipe Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl flex flex-col md:flex-row overflow-hidden">
            
            <button 
              onClick={() => setSelectedMeal(null)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20 transition-colors border border-white/20 shadow-lg"
              title="Close Recipe"
            >
              <X size={20} />
            </button>

            {/* Left Side: Image (Desktop) / Top (Mobile) */}
            <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-earth-50 flex items-center justify-center">
               <img 
                src={getRecipeImageUrlLarge(selectedMeal)}
                alt={selectedMeal.name}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                 <div className="text-white text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <ChefHat size={12} /> Healing Recipe
                 </div>
                 <h2 className="text-white font-serif text-3xl font-bold">{selectedMeal.name}</h2>
              </div>
            </div>

            {/* Right Side: Content */}
            <div className="flex-1 p-8 md:p-12 bg-white overflow-y-auto">
               <div className="hidden md:block mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      {selectedMeal.type}
                    </span>
                    <div className="flex items-center gap-3 text-gray-400 text-xs font-medium border-l border-gray-200 pl-3">
                       <div className="flex items-center gap-1"><Clock size={14} /> <span>Prep Guide Below</span></div>
                    </div>
                  </div>
                  <h2 className="text-4xl font-serif font-bold text-sage-900 leading-tight">{selectedMeal.name}</h2>
               </div>

               <div className="flex flex-col gap-8">
                  
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4 text-lg border-b border-gray-100 pb-2">
                      <ChefHat className="text-orange-500" size={20} /> 
                      Preparation Guide
                    </h3>
                    <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 text-gray-700 leading-relaxed italic text-lg font-serif relative">
                       <span className="absolute top-2 left-3 text-5xl text-orange-200 font-serif leading-none font-black opacity-50">“</span>
                       <p className="relative z-10 pl-4 whitespace-pre-line">{selectedMeal.instructions}</p>
                       <span className="absolute bottom-[-20px] right-4 text-5xl text-orange-200 font-serif leading-none font-black opacity-50 transform rotate-180">“</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4 text-lg border-b border-gray-100 pb-2">
                      <Utensils className="text-sage-600" size={20} /> 
                      Ingredients Checklist
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedMeal.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-sage-200 transition-colors group">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-white transition-all ${
                             (selectedMeal.key_ingredient && ing.toLowerCase().includes(selectedMeal.key_ingredient.toLowerCase()))
                             ? 'bg-orange-500 border-orange-500' 
                             : 'border-sage-200 group-hover:bg-sage-100 group-hover:border-sage-300 group-hover:text-sage-500'
                          }`}>
                            <Check size={14} />
                          </div>
                          <span className={`font-medium text-lg ${
                             (selectedMeal.key_ingredient && ing.toLowerCase().includes(selectedMeal.key_ingredient.toLowerCase()))
                             ? 'text-orange-700 font-bold' 
                             : 'text-gray-700'
                          }`}>
                            {ing} 
                            {(selectedMeal.key_ingredient && ing.toLowerCase().includes(selectedMeal.key_ingredient.toLowerCase())) && (
                              <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">Focus</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

               </div>
            </div>

          </div>
        </div>
      )}

      {/* Shopping List Modal */}
      {showShoppingList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-sage-50 rounded-t-3xl">
              <h2 className="font-serif text-xl font-bold text-sage-900 flex items-center gap-2">
                <ShoppingCart className="text-sage-600" /> Weekly Shopping List
              </h2>
              <button onClick={() => setShowShoppingList(false)}>
                <X size={24} className="text-gray-500 hover:text-gray-800" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {plan.length > 0 ? (
                <div className="space-y-1">
                  {Array.from(new Set(plan.flatMap(d => d.meals.flatMap(m => m.ingredients)))).sort().map((ing, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                      <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center"></div>
                      <span className="text-gray-700 font-medium capitalize">{ing}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No ingredients found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved Plans Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-sage-50 rounded-t-3xl">
                <h2 className="font-serif text-xl font-bold text-sage-900 flex items-center gap-2">
                   <Book className="text-sage-600" /> My Saved Plans
                </h2>
                <button onClick={() => setShowSavedModal(false)}>
                   <X size={24} className="text-gray-500 hover:text-gray-800" />
                </button>
             </div>

             <div className="p-6 overflow-y-auto flex-1">
                {savedPlans.length > 0 ? (
                   <div className="space-y-3">
                      {savedPlans.map(saved => (
                        <div 
                          key={saved.id} 
                          onClick={() => loadSavedPlan(saved)}
                          className="bg-white border border-gray-200 p-4 rounded-xl cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group"
                        >
                           <div className="flex justify-between items-start">
                              <h3 className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{saved.title}</h3>
                              <span className="text-xs text-gray-400">{new Date(saved.created_at).toLocaleDateString()}</span>
                           </div>
                           <p className="text-xs text-gray-500 mt-1">
                              {saved.plan_data.length} days • {saved.plan_data.reduce((acc, d) => acc + d.meals.length, 0)} meals
                           </p>
                        </div>
                      ))}
                   </div>
                ) : (
                  <div className="text-center py-10">
                     <Book className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                     <p className="text-gray-400">No saved plans yet.</p>
                  </div>
                )}
             </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default DietKitchen;
