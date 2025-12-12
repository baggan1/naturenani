
import React, { useState, useEffect } from 'react';
import { Utensils, Calendar, ChefHat, Loader2, X, ShoppingCart, CheckSquare, Clock, Search } from 'lucide-react';
import { FeatureContext } from '../types';
import { generateDietPlan } from '../services/geminiService';

interface DietKitchenProps {
  activeContext?: FeatureContext | null;
}

interface Meal {
  type: string;
  name: string;
  ingredients: string[];
  instructions: string;
  image_keyword: string;
}

interface DayPlan {
  day: string;
  meals: Meal[];
}

const DietKitchen: React.FC<DietKitchenProps> = ({ activeContext }) => {
  const [plan, setPlan] = useState<DayPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(activeContext?.title || "Ayurvedic Kitchen");
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  
  // Standalone mode input
  const [customQuery, setCustomQuery] = useState("");

  const loadPlan = async (queryId: string, displayTitle: string) => {
    setLoading(true);
    setTitle(displayTitle);
    setPlan([]); // Reset previous plan
    
    try {
      const generatedPlan = await generateDietPlan(queryId);
      if (generatedPlan && generatedPlan.length > 0) {
        setPlan(generatedPlan);
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
    e.currentTarget.src = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000&auto=format&fit=crop"; // Fallback healthy food image
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
        
        {/* Search bar for standalone usage */}
        <form onSubmit={handleCustomSearch} className="flex gap-2 w-full md:w-auto">
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

      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8">
        
        {/* Plan Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="font-serif text-3xl font-bold text-sage-900 capitalize">{title}</h2>
            <p className="text-gray-600 mt-1">Focus on warm, fresh ingredients to aid digestion.</p>
          </div>
          <button 
            onClick={() => setShowShoppingList(true)}
            disabled={loading || plan.length === 0}
            className="flex items-center gap-2 bg-sage-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-sage-900 transition-all shadow-md disabled:opacity-50"
          >
            <ShoppingCart size={18} /> Shopping List
          </button>
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
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
                    >
                      <div className="h-48 overflow-hidden relative">
                        <img 
                          src={`https://image.pollinations.ai/prompt/${encodeURIComponent(meal.image_keyword)}%20food%20photography%20hd?width=400&height=300&nologo=true`} 
                          alt={meal.name}
                          onError={handleImageError}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                          {meal.type}
                        </div>
                      </div>
                      <div className="p-5">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button 
              onClick={() => setSelectedMeal(null)}
              className="absolute top-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full z-10 transition-colors"
            >
              <X size={24} className="text-gray-800" />
            </button>
            
            <div className="h-64 relative">
              <img 
                src={`https://image.pollinations.ai/prompt/${encodeURIComponent(selectedMeal.image_keyword)}%20food%20photography%20hd?width=800&height=400&nologo=true`}
                alt={selectedMeal.name}
                onError={handleImageError}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8 pt-24">
                <span className="text-orange-300 font-bold text-sm tracking-widest uppercase mb-1 block">
                  {selectedMeal.type}
                </span>
                <h2 className="text-3xl font-serif font-bold text-white">{selectedMeal.name}</h2>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-start gap-8 flex-col md:flex-row">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <ChefHat size={20} className="text-orange-500" /> Instructions
                  </h3>
                  <p className="text-gray-600 leading-relaxed bg-orange-50 p-4 rounded-xl border border-orange-100">
                    {selectedMeal.instructions}
                  </p>
                </div>
                
                <div className="w-full md:w-64 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Utensils size={18} className="text-sage-600" /> Ingredients
                  </h3>
                  <ul className="space-y-3">
                    {selectedMeal.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-sage-400 mt-1.5 shrink-0"></div>
                        {ing}
                      </li>
                    ))}
                  </ul>
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

            <div className="p-4 border-t border-gray-100 text-center bg-gray-50 rounded-b-3xl">
              <p className="text-xs text-gray-400">Items aggregated from your 3-day plan.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DietKitchen;
