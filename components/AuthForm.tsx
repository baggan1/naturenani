import React, { useState } from 'react';
import { ArrowRight, Loader2, Mail, Lock, ShieldCheck, AlertTriangle, CheckCircle2, User, Eye, EyeOff, KeyRound, ShieldAlert } from 'lucide-react';
import { sendOtp, signInWithGoogle, signInWithPassword, signUpWithPassword } from '../services/backendService';
import { User as AppUser, AppView } from '../types';
import { Logo } from './Logo';

interface AuthFormProps {
  onAuthSuccess: (user: AppUser) => void;
  isOpen: boolean;
  onClose?: () => void;
  onNavigate?: (view: AppView) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess, isOpen, onClose, onNavigate }) => {
  const [method, setMethod] = useState<'menu' | 'email_input' | 'otp_input' | 'password'>('menu');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    if (!agreed) {
      setError("Please check the box to agree to our Terms and Privacy Policy.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError('Google Sign-In failed.');
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("Please check the box to agree to our Terms and Privacy Policy.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendOtp(email);
      setMethod('otp_input');
    } catch (err: any) {
      setError(err.message || 'Failed to send link.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("Please check the box to agree to our Terms and Privacy Policy.");
      return;
    }
    setLoading(true);
    setError('');

    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      setLoading(false);
      return;
    }

    try {
      let user;
      if (isSignUp) {
        if (!name.trim()) throw new Error("Name is required.");
        user = await signUpWithPassword(email, password, name);
      } else {
        user = await signInWithPassword(email, password);
      }
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMethod('menu');
    setError('');
    setIsSignUp(false);
  };

  const inputClasses = "w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none transition-all text-gray-800 placeholder:text-gray-400 shadow-sm";

  // Use the standard theme style for small uppercase labels
  const labelStyle = "text-[9px] md:text-[10px] font-bold uppercase tracking-widest font-sans select-none leading-relaxed";

  const CheckboxUI = () => (
    <div className="pt-2 px-1">
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative flex items-center mt-0.5">
          <input 
            type="checkbox" 
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:bg-[#4A7C59] checked:border-[#4A7C59] transition-all"
          />
          <CheckCircle2 className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity left-0.5" />
        </div>
        <span className={`${labelStyle} text-gray-500`}>
          I AGREE TO THE <button onClick={() => onNavigate?.(AppView.LEGAL)} className="text-[#3B6EB1] hover:underline font-black">TERMS</button> AND <button onClick={() => onNavigate?.(AppView.LEGAL)} className="text-[#3B6EB1] hover:underline font-black">PRIVACY POLICY</button>
        </span>
      </label>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-sage-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#FFFCF7] rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative border border-white/40">
        
        {/* Brand Header */}
        <div className="p-10 pb-6 text-center">
          <div className="flex justify-center mb-6">
            <Logo className="h-16 w-16" textClassName="text-4xl" showText={false} />
          </div>
          <h2 className="text-4xl font-serif font-bold text-[#8B0000] tracking-tight mb-1">
            Nature Nani
          </h2>
          <p className="text-sage-600 text-[10px] font-bold uppercase tracking-widest font-sans">
            Find the cure in Nature
          </p>
        </div>

        <div className="px-10 pb-6">
          {error && (
            <div className="mb-6 bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-100 flex items-center gap-2 animate-in shake duration-300">
               <AlertTriangle size={14} className="flex-shrink-0" /> {error}
            </div>
          )}

          {method === 'menu' && (
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white text-gray-700 border border-gray-200 py-4 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>

              <button
                onClick={() => { setMethod('password'); setIsSignUp(true); }}
                className="w-full bg-white text-[#8B0000] border-2 border-[#8B0000] py-4 rounded-xl font-bold hover:bg-[#8B0000]/5 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]"
              >
                <Mail size={20} />
                Sign up with email
              </button>

              <button
                onClick={() => setMethod('email_input')}
                className="w-full bg-[#4A7C59] text-white py-4 rounded-xl font-bold hover:bg-[#3d664a] transition-all flex items-center justify-center gap-2 shadow-lg shadow-sage-200/50 active:scale-[0.98]"
              >
                <KeyRound size={20} />
                Send One time link
              </button>
              
              <CheckboxUI />

              <div className="pt-6 text-center space-y-4">
                <p className={`${labelStyle} text-gray-400`}>
                  WHAT DOES THIS APP DO? <button onClick={() => onNavigate?.(AppView.ABOUT)} className="text-[#3B6EB1] font-black hover:underline ml-1">LEARN MORE</button>
                </p>
                <p className={`${labelStyle} text-gray-400`}>
                  HAVE AN ACCOUNT? <button onClick={() => { setMethod('password'); setIsSignUp(false); }} className="text-[#3B6EB1] font-black hover:underline ml-1">LOG IN</button>
                </p>
              </div>
            </div>
          )}

          {method === 'password' && (
            <form onSubmit={handlePasswordAuth} className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
              {isSignUp && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} placeholder="Full Name" />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} placeholder="Email Address" />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClasses} pr-12`} placeholder="Password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-sage-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <CheckboxUI />

              <button type="submit" disabled={loading} className="w-full bg-[#4A7C59] text-white py-4 rounded-xl font-bold hover:bg-[#3d664a] transition-all flex items-center justify-center gap-2 shadow-lg">
                {loading ? <Loader2 className="animate-spin" /> : <>{isSignUp ? 'Sign Up' : 'Log In'} <ArrowRight size={18} /></>}
              </button>
              <button type="button" onClick={reset} className={`${labelStyle} text-gray-400 hover:text-gray-600 py-2 w-full text-center transition-colors`}>Back to options</button>
            </form>
          )}

          {method === 'email_input' && (
            <form onSubmit={handleSendOtp} className="space-y-5 animate-in slide-in-from-bottom-4 duration-300">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} placeholder="name@email.com" />
              </div>

              <CheckboxUI />

              <button type="submit" disabled={loading} className="w-full bg-[#4A7C59] text-white py-4 rounded-xl font-bold hover:bg-[#3d664a] transition-all flex items-center justify-center gap-2 shadow-lg shadow-sage-200/50">
                {loading ? <Loader2 className="animate-spin" /> : <>Send One time link <ArrowRight size={18} /></>}
              </button>
              <button type="button" onClick={reset} className={`${labelStyle} text-gray-400 hover:text-gray-600 py-2 w-full text-center transition-colors`}>Back to options</button>
            </form>
          )}

          {method === 'otp_input' && (
            <div className="text-center py-6 animate-in slide-in-from-bottom-4 duration-300">
               <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-sage-100">
                 <Mail className="text-[#4A7C59]" size={32} />
               </div>
               <p className="text-sm font-bold text-gray-800">Check your email</p>
               <p className="text-xs text-gray-500 mt-1">We've sent a magic link to {email}</p>
               <button onClick={reset} className={`${labelStyle} text-[#3B6EB1] hover:underline mt-6`}>Back to options</button>
            </div>
          )}
        </div>
        
        {/* Footer Navigation Section */}
        <div className="bg-white/50 p-8 border-t border-gray-100 flex items-center justify-center gap-16">
           <button onClick={() => onNavigate?.(AppView.LEGAL)} className="flex flex-col items-center gap-1 group">
             <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-[#8B0000]/10 group-hover:text-[#8B0000] transition-all shadow-sm">
               <ShieldAlert size={20} />
             </div>
             <span className={`${labelStyle} text-gray-400 group-hover:text-gray-600`}>Disclaimer</span>
           </button>

           <button onClick={() => onNavigate?.(AppView.LEGAL)} className="flex flex-col items-center gap-1 group">
             <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-[#4A7C59]/10 group-hover:text-[#4A7C59] transition-all shadow-sm">
               <ShieldCheck size={20} />
             </div>
             <span className={`${labelStyle} text-gray-400 group-hover:text-gray-600`}>Privacy</span>
           </button>
        </div>

      </div>
    </div>
  );
};

export default AuthForm;