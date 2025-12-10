import React, { useState } from 'react';
import { Leaf, ArrowRight, Loader2, Mail, Lock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { sendOtp, verifyOtp, signInWithGoogle } from '../services/backendService';
import { User } from '../types';

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
      setHint('Check console for Redirect URL mismatch or Google Cloud configuration.');
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-sage-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative">
        
        {/* Header */}
        <div className="bg-sage-50 p-6 text-center border-b border-sage-100">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-sage-600">
            <Leaf size={24} />
          </div>
          <h2 className="text-xl font-serif font-bold text-sage-900">
            Save Your Health Journey
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Create a free account to save your health history and get 5 free queries.
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg flex flex-col gap-1">
               <div className="flex items-center gap-2 font-bold"><AlertTriangle size={14} /> {error}</div>
               {hint && <div className="text-xs text-red-500 ml-5">{hint}</div>}
            </div>
          )}

          {method === 'menu' && (
            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white text-gray-700 border border-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 shadow-sm"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>
              
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">Or</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <button
                onClick={() => setMethod('email_input')}
                className="w-full bg-sage-600 text-white py-3 rounded-xl font-bold hover:bg-sage-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-sage-200"
              >
                <Mail size={18} /> Continue with Email
              </button>
            </div>
          )}

          {method === 'email_input' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sage-600 text-white py-3 rounded-xl font-bold hover:bg-sage-700 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Send Login Code <ArrowRight size={18} /></>}
              </button>
              <button 
                type="button" 
                onClick={reset}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600"
              >
                Go back
              </button>
            </form>
          )}

          {method === 'otp_input' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter Code</label>
                <p className="text-xs text-gray-400 mb-2">We sent a 6-digit code to {email}</p>
                <input
                  type="text"
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none transition-all tracking-widest text-center text-lg font-mono"
                  placeholder="123456"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sage-600 text-white py-3 rounded-xl font-bold hover:bg-sage-700 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Verify & Login <Lock size={18} /></>}
              </button>
              <button 
                type="button" 
                onClick={() => setMethod('email_input')}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600"
              >
                Change email
              </button>
            </form>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t border-gray-100">
          By continuing, you agree to our Terms & Privacy Policy.
        </div>

      </div>
    </div>
  );
};

export default AuthForm;