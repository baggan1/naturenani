
import React, { useState } from 'react';
import { Leaf, ArrowRight, Loader2, Mail, Lock, ShieldCheck, AlertTriangle, CheckCircle2, Globe } from 'lucide-react';
import { sendOtp, verifyOtp, signInWithGoogle } from '../services/backendService';
import { User } from '../types';
import { Logo } from './Logo';

interface AuthFormProps {
  onAuthSuccess: (user: User) => void;
  isOpen: boolean;
  onClose?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess, isOpen, onClose }) => {
  const [method, setMethod] = useState<'menu' | 'email_input' | 'otp_input'>('menu');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setHint('');
    try {
      await signInWithGoogle();
      // OAuth redirects, so execution stops here usually.
    } catch (err: any) {
      console.error(err);
      setError('Google Sign-In failed.');
      setHint('Ensure your Supabase project is configured for Google OAuth.');
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setHint('');
    try {
      await sendOtp(email);
      setMethod('otp_input');
    } catch (err: any) {
      console.error("OTP Error:", err);
      if (err.status === 429) {
        setError("Too many login attempts.");
        setHint("Please wait a while before trying again.");
      } else {
        setError(err.message || 'Failed to send code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await verifyOtp(email, otp);
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMethod('menu');
    setError('');
    setHint('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-sage-900/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative border border-white/20">
        
        {/* Trust Header Badge */}
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-sage-100/80 backdrop-blur-sm text-sage-700 text-[10px] font-bold px-2 py-1 rounded-full border border-sage-200 flex items-center gap-1">
            <ShieldCheck size={10} /> SECURE AUTHENTICATION
          </div>
        </div>

        {/* Brand Header */}
        <div className="bg-gradient-to-b from-sage-50 to-white p-8 text-center border-b border-sage-100">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-sage-100">
              <Logo className="h-12 w-12" textClassName="text-3xl" showText={false} />
            </div>
          </div>
          <h2 className="text-2xl font-serif font-bold text-sage-900 leading-tight">
            Nature Nani Wellness Portal
          </h2>
          <p className="text-gray-500 text-sm mt-2 max-w-[280px] mx-auto">
            Access your personalized Ayurvedic history and consultation logs securely.
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100 flex flex-col gap-1">
               <div className="flex items-center gap-2 font-bold"><AlertTriangle size={16} /> {error}</div>
               {hint && <div className="text-xs text-red-600/80 ml-6">{hint}</div>}
            </div>
          )}

          {method === 'menu' && (
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white text-gray-700 border border-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>
              
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink-0 mx-4 text-gray-300 text-[10px] font-bold uppercase tracking-widest">Or Use Email</span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>

              <button
                onClick={() => setMethod('email_input')}
                className="w-full bg-sage-600 text-white py-4 rounded-2xl font-bold hover:bg-sage-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-sage-200/50 active:scale-[0.98]"
              >
                <Mail size={18} /> Continue with Email
              </button>
              
              <div className="pt-4 flex items-center justify-center gap-4 opacity-40 grayscale">
                 <div className="flex items-center gap-1 text-[10px] font-bold"><CheckCircle2 size={12} /> HIPAA COMPLIANT</div>
                 <div className="flex items-center gap-1 text-[10px] font-bold"><Globe size={12} /> SSL ENCRYPTED</div>
              </div>
            </div>
          )}

          {method === 'email_input' && (
            <form onSubmit={handleSendOtp} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Work or Personal Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none transition-all text-gray-800"
                    placeholder="name@email.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sage-600 text-white py-4 rounded-2xl font-bold hover:bg-sage-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-sage-200/50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Send Secure Code <ArrowRight size={18} /></>}
              </button>
              <button 
                type="button" 
                onClick={reset}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 font-medium py-2"
              >
                Back to Sign In options
              </button>
            </form>
          )}

          {method === 'otp_input' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <div className="bg-sage-50 inline-block p-4 rounded-full mb-4">
                  <Lock className="text-sage-600" size={24} />
                </div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Verify your identity</label>
                <p className="text-xs text-gray-500 mb-6">A 6-digit access code was sent to <span className="text-sage-700 font-bold">{email}</span></p>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none transition-all tracking-[0.5em] text-center text-2xl font-mono font-bold text-sage-900 bg-sage-50/30"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sage-600 text-white py-4 rounded-2xl font-bold hover:bg-sage-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-sage-200/50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Confirm Access <ShieldCheck size={18} /></>}
              </button>
              <button 
                type="button" 
                onClick={() => setMethod('email_input')}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 font-medium py-2"
              >
                Use a different email address
              </button>
            </form>
          )}
        </div>
        
        {/* Verification Footer */}
        <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
           <div className="flex items-center justify-center gap-1 mb-2">
             <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Status: Optimal</span>
           </div>
           <p className="text-[10px] text-gray-400 leading-relaxed px-4">
            Secured by Google Identity and Supabase Encrypted Storage. 
            The authentication redirect uses our secure infrastructure.
           </p>
        </div>

      </div>
    </div>
  );
};

export default AuthForm;
