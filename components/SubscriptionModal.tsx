
import React, { useState } from 'react';
import { Check, Lock, Loader2, CreditCard, Sparkles, PlayCircle, FileText, X } from 'lucide-react';
import { initiateStripeCheckout, getCurrentUser } from '../services/backendService';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTrialExpired: boolean;
  daysRemaining: number;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, isTrialExpired, daysRemaining }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    const user = getCurrentUser();
    if (!user) return;

    setIsLoading(true);
    try {
      await initiateStripeCheckout(user);
    } catch (e) {
      console.error(e);
      alert("Checkout failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sage-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh] relative">
        
        {/* Header */}
        <div className="bg-sage-700 p-8 text-center relative overflow-hidden">
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors z-20"
            aria-label="Close"
          >
            <X size={24} />
          </button>

          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-12 translate-y-12"></div>
          
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mb-2">
            Upgrade to Evergreen
          </h2>
          <p className="text-sage-100 text-sm opacity-90">
            {isTrialExpired 
              ? 'Your Seedling access is limited.' 
              : 'Upgrade from Seedling to Full Evergreen Wellness'}
          </p>
        </div>

        <div className="p-8 overflow-y-auto">
          <div className="mb-8">
            <p className="text-gray-600 text-center mb-6 text-sm">
              Stop guessing. Get visual guides, meal plans, and unlimited wisdom.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="bg-sage-100 p-1 rounded-full text-sage-700"><Check size={14} /></div>
                <div>
                  <span className="font-bold text-sage-900 block">Unlimited Chat Queries</span>
                  <span className="text-xs text-gray-500">No more daily limits. Ask anytime.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-earth-100 p-1 rounded-full text-earth-700"><PlayCircle size={14} /></div>
                <div>
                  <span className="font-bold text-sage-900 block">Visual Yoga Guides</span>
                  <span className="text-xs text-gray-500">See the poses, don't just read about them.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-earth-100 p-1 rounded-full text-earth-700"><FileText size={14} /></div>
                <div>
                  <span className="font-bold text-sage-900 block">Weekly Meal Plans</span>
                  <span className="text-xs text-gray-500">Personalized diet charts for your Dosha.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-sage-100 p-1 rounded-full text-sage-700"><Check size={14} /></div>
                <div>
                  <span className="font-bold text-sage-900 block">Full Conversation History</span>
                  <span className="text-xs text-gray-500">Never lose a remedy. Access past chats forever.</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-sage-50 rounded-xl p-4 mb-6 border border-sage-200 flex justify-between items-center">
             <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide font-bold">Evergreen Plan</span>
                <div className="text-2xl font-bold text-sage-900">$9.99<span className="text-sm font-normal text-gray-500">/mo</span></div>
              </div>
              <div className="text-xs text-earth-700 font-bold bg-earth-100 px-3 py-1 rounded-full border border-earth-200">
                RECOMMENDED
              </div>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full bg-earth-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-earth-700 transition-all shadow-lg shadow-earth-200 flex items-center justify-center gap-2 group"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : (
              <>
                <CreditCard size={20} /> Upgrade to Evergreen
              </>
            )}
          </button>
          
          <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
            <Lock size={10} /> Secure payment via Stripe
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
