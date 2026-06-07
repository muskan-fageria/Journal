import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({
          email,
          password,
        });
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      if (result.error) throw result.error;
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full select-none page">
      <div className="w-full max-w-md p-8 md:p-12 bg-stone-950/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-8 relative overflow-hidden">
        
        {/* Subtle top highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary/50 to-transparent"></div>

        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-newsreader text-4xl text-stone-100">My Journal</h1>
          <p className="font-sans text-xs tracking-[0.2em] uppercase text-stone-500">Digital Sanctuary</p>
        </div>

        {errorMsg && (
          <div className="bg-red-950/50 border border-red-500/30 text-red-200 p-3 rounded-lg text-sm text-center font-sans">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-sans text-[10px] uppercase tracking-widest text-stone-400 font-semibold pl-1">
              Email Address
            </label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 font-sans text-sm text-stone-200 placeholder:text-stone-600 outline-none focus:border-secondary/50 focus:bg-black/40 transition-all"
              placeholder="Enter your email"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-sans text-[10px] uppercase tracking-widest text-stone-400 font-semibold pl-1">
              Password
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 font-sans text-sm text-stone-200 placeholder:text-stone-600 outline-none focus:border-secondary/50 focus:bg-black/40 transition-all"
              placeholder="Enter your password"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="mt-4 bg-secondary text-stone-900 w-full py-3.5 rounded-xl font-label-caps text-xs uppercase tracking-widest hover:bg-white active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:active:scale-100"
          >
            {isLoading ? (isSignUp ? 'CREATING...' : 'ENTERING...') : (isSignUp ? 'CREATE SANCTUARY' : 'ENTER SANCTUARY')}
            {!isLoading && <span className="material-symbols-outlined text-sm">{isSignUp ? 'person_add' : 'login'}</span>}
          </button>
        </form>

        <div className="text-center mt-2 flex flex-col gap-4">
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-sans text-xs text-stone-400 hover:text-stone-200 transition-colors tracking-wide"
          >
            {isSignUp ? 'Already have a sanctuary? Enter here.' : 'Need a digital sanctuary? Create one.'}
          </button>
          {!isSignUp && (
            <button type="button" className="font-sans text-xs text-stone-600 hover:text-stone-400 transition-colors">
              Forgot Password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
