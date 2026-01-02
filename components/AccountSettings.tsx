
import React, { useState } from 'react';
import { User } from '../types';
import { LogOut, CreditCard, ShieldCheck, Zap, ExternalLink, Calendar, Mail, User as UserIcon, Sprout, TreePine, Star, AlertCircle, RefreshCw, XCircle, RefreshCcw } from 'lucide-react';
import { createStripePortalSession } from '../services/backendService';

interface AccountSettingsProps {
  user: User;
  onUpgrade: () => void;
  onLogout: () => void;
  onRefresh: () => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ user, onUpgrade, onLogout, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleManageBilling = async () => {
    setLoading(true);
    await createStripePortalSession();
    setLoading(false);
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const statusLabel = {
    free: 'Free Forever Plan',
    trialing: '7-Day Free Trial (Active)',
    active: 'Healer Plan (Premium)',
    expired: 'Access Restricted',
    canceled: 'Subscription Canceled'
  }[user.subscription_status] || 'Standard Access';

  const isPremium = user.subscription_status === 'active' || user.subscription_status === 'trialing';

  return (
    <div className="h-full flex flex-col bg-sage-50 overflow-y-auto">
      <div className="bg-white border-b border-sage-200 p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-serif text-2xl font-bold text-sage-900 flex items-center gap-2">
              <UserIcon className="text-sage-600" /> Account Settings
            </h1>
            <p className="text-gray-500 mt-1">Manage your profile and subscription</p>
          </div>
          <button 
            onClick={handleManualRefresh}
            className={`p-2 rounded-full hover:bg-sage-50 text-sage-400 transition-all ${refreshing ? 'rotate-180 text-sage-600' : ''}`}
            title="Refresh subscription status"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8">
        
        {/* Profile Section */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-sage-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ShieldCheck size={20} className="text-sage-600" /> Profile Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
              <div className="text-gray-900 font-medium text-lg">{user.name || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
              <div className="flex items-center gap-2 text-gray-900 font-medium text-lg">
                <Mail size={16} className="text-gray-400" /> {user.email}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Member Since</label>
              <div className="flex items-center gap-2 text-gray-900">
                <Calendar size={16} className="text-gray-400" /> {formatDate(user.created_at)}
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Section */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-sage-100 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CreditCard size={20} className="text-sage-600" /> Subscription Plan
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Current status: <span className="font-bold text-sage-800">{statusLabel}</span>
              </p>
            </div>
            
            {user.subscription_status === 'active' ? (
              <span className="bg-earth-100 text-earth-700 px-3 py-1 rounded-full text-xs font-bold border border-earth-200 flex items-center gap-1">
                <TreePine size={12} /> PREMIUM ACTIVE
              </span>
            ) : user.subscription_status === 'trialing' ? (
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1">
                <Star size={12} /> TRIAL ACTIVE
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200 flex items-center gap-1">
                <Sprout size={12} /> {user.subscription_status === 'expired' ? 'LIMITED ACCESS' : 'FREE PLAN'}
              </span>
            )}
          </div>

          {isPremium ? (
            <div className="space-y-4">
              <div className="bg-sage-50 rounded-xl p-5 border border-sage-100">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next Billing Cycle</p>
                    <p className="text-sage-900 font-bold text-lg">
                      {user.subscription_status === 'trialing' ? formatDate(user.trial_end) : formatDate(user.current_period_end)}
                    </p>
                    <p className="text-xs text-sage-600">
                      {user.subscription_status === 'trialing' 
                        ? 'Your card will be charged $9.99 when your 7-day trial ends.' 
                        : 'Your subscription will automatically renew at $9.99/month.'}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <RefreshCw className={`text-sage-200 ${refreshing ? 'animate-spin' : ''}`} size={32} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleManageBilling}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all text-sm"
                >
                  {loading ? 'Opening...' : <>Manage Payment Method <ExternalLink size={14} /></>}
                </button>
                <button
                  onClick={handleManageBilling}
                  className="flex items-center justify-center gap-2 text-red-600 border border-red-100 bg-red-50/50 py-3 px-6 rounded-xl font-bold hover:bg-red-50 transition-all text-sm"
                >
                  <XCircle size={14} /> Cancel Premium Plan
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center italic">
                Canceling will downgrade you to the Free Plan at the end of the current period.
              </p>
            </div>
          ) : (
            <div className={`rounded-xl p-6 border ${user.subscription_status === 'expired' ? 'bg-red-50 border-red-100' : 'bg-sage-50 border-sage-200'}`}>
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-serif font-bold text-xl text-sage-900 mb-2">
                    {user.subscription_status === 'expired' ? 'Access Restricted' : 'Unlock Professional Healing'}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    Upgrade to the Healer Plan to see exact dosages, unlock all visual Yoga Aid sequences, and receive full medicinal cooking instructions.
                  </p>
                </div>
                <button
                  onClick={onUpgrade}
                  className="w-full md:w-auto bg-sage-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-sage-700 transition-colors shadow-lg shadow-sage-200 whitespace-nowrap"
                >
                  Start 7-Day Free Trial
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 font-bold px-4 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>

      </div>
    </div>
  );
};

export default AccountSettings;
