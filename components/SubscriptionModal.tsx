
import React, { useState } from 'react';
import { Check, Lock, Loader2, CreditCard, Sparkles, PlayCircle, FileText, X, Sprout, TreePine, Star, ShieldCheck, ArrowRight } from 'lucide-react';
import { initiateStripeCheckout, getCurrentUser } from '../services/backendService';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTrialExpired: boolean;
  daysRemaining: number;
  subscriptionStatus: string;
  onRefreshUser: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ 
  isOpen, 
  onClose, 
  isTrialExpired, 
  daysRemaining,
  subscriptionStatus,
  onRefreshUser
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleStripeTrial = async () => {
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-sage-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh] relative border border-white/20">
        
        {/* Header */}
        <div className="bg-sage-700 p-8 text-center relative overflow-hidden">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors z-20"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-16 -translate-y-16"></div>
          
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
            <TreePine className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mb-2">
            Unlock the Healer Plan
          </h2>
          <p className="text-sage-100 text-sm opacity-90">
            7-Day Free Trial. Card required to prevent abuse.
          </p>
        </div>

        <div className="p-8 overflow-y-auto">
          <div className="mb-6">
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-center gap-3 mb-6">
              <Star className="text-amber-500 fill-amber-500 flex-shrink-0" size={20} />
              <p className="text-xs font-bold text-amber-900 leading-relaxed">
                Start your 7-day free trial today. You won't be charged until the trial ends. Cancel anytime with one click.
              </p>
            </div>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="bg-sage-100 p-1 rounded-full text-sage-700"><Check size={14} /></div>
                <div>
                  <span className="font-bold text-sage-900 block text-sm">Visible Dosages & Timing</span>
                  <span className="text-[10px] text-gray-500">Access full medicinal frequencies in every response.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-earth-100 p-1 rounded-full text-earth-700"><PlayCircle size={14} /></div>
                <div>
                  <span className="font-bold text-sage-900 block text-sm">Full Yoga Aid Access</span>
                  <span className="text-[10px] text-gray-500">Therapeutic sequences with visual pose guides.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-earth-100 p-1 rounded-full text-earth-700"><FileText size={14} /></div>
                <div>
                  <span className="font-bold text-sage-900 block text-sm">Targeted Nutri Heal Plans</span>
                  <span className="text-[10px] text-gray-500">Clinical diet protocols with prep instructions.</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-sage-50 rounded-2xl p-4 mb-6 border border-sage-100 flex justify-between items-center">
             <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Membership Cost</span>
                <div className="text-2xl font-bold text-sage-900">$9.99<span className="text-sm font-normal text-gray-400">/mo</span></div>
              </div>
              <div className="text-[10px] text-earth-700 font-bold bg-earth-100 px-3 py-1 rounded-full border border-earth-200">
                7 DAYS FREE
              </div>
          </div>

          <button
            onClick={handleStripeTrial}
            disabled={isLoading}
            className="w-full bg-sage-600 text-white py-4 rounded-xl font-bold text-base hover:bg-sage-700 transition-all shadow-lg shadow-sage-200 flex items-center justify-center gap-2 group mb-3"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <>Start My Free Trial <ArrowRight size={18} /></>}
          </button>
          
          <button 
            onClick={onClose}
            className="w-full text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 py-2"
          >
            Not now, keep using Free Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
