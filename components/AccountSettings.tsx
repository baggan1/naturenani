import React, { useState } from 'react';
import { User } from '../types';
import { LogOut, CreditCard, ShieldCheck, Zap, ExternalLink, Calendar, Mail, User as UserIcon, Sprout, TreePine } from 'lucide-react';
import { createStripePortalSession } from '../services/backendService';

interface AccountSettingsProps {
  user: User;
  onUpgrade: () => void;
  onLogout: () => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ user, onUpgrade, onLogout }) => {
  const [loading, setLoading] = useState(false);

  const handleManageBilling = async () => {
    setLoading(true);
    await createStripePortalSession();
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="h-full flex flex-col bg-sage-50 overflow-y-auto">
      <div className="bg-white border-b border-sage-200 p-6 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-sage-900 flex items-center gap-2">
          <UserIcon className="text-sage-600" /> Account Settings
        </h1>
        <p className="text-gray-500 mt-1">Manage your profile and subscription</p>
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
                Current tier: <span className="font-bold text-sage-800">{user.is_subscribed ? 'Premium Plan' : 'Free Forever Plan'}</span>
              </p>
            </div>
            {user.is_subscribed ? (
              <span className="bg-earth-100 text-earth-700 px-3 py-1 rounded-full text-xs font-bold border border-earth-200 flex items-center gap-1">
                <TreePine size={12} /> PREMIUM ACCESS
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200 flex items-center gap-1">
                <Sprout size={12} /> FREE FOREVER
              </span>
            )}
          </div>

          {!user.is_subscribed ? (
            <div className="bg-sage-50 rounded-xl p-6 border border-sage-200">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1">
                  <h3 className="font-serif font-bold text-xl text-sage-900 mb-2">Unlock Unlimited Healing</h3>
                  <p className="text-gray-600 mb-4">
                    You are currently on the Free Forever Plan, limited to 3 queries per day. Upgrade to Premium for unlimited access, visual yoga guides, and personalized meal plans with cooking preparation instructions.
                  </p>
                </div>
                <button
                  onClick={onUpgrade}
                  className="bg-earth-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-earth-700 transition-colors shadow-lg shadow-earth-200 whitespace-nowrap"
                >
                  Upgrade to Premium Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                <div>
                  <h3 className="font-bold text-green-900 mb-1">You have full Premium Plan access</h3>
                  <p className="text-green-700 text-sm">
                    Thank you for being a Premium member. Your billing and subscription are managed via our secure payment partner.
                  </p>
                </div>
                <button
                  onClick={handleManageBilling}
                  disabled={loading}
                  className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  {loading ? 'Loading...' : <>Manage Billing <ExternalLink size={16} /></>}
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>

      </div>
    </div>
  );
};

export default AccountSettings;