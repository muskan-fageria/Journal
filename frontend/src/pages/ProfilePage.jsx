import React from 'react';

export default function ProfilePage({ onLogout, userProfile }) {
  // Use real data, fallback to defaults if loading
  const user = userProfile || {
    email: 'Loading...',
    initials: '?',
    created_at: new Date().toISOString(),
    streak: 0,
    total_entries: 0,
    plan: 'Basic Sanctuary',
  };

  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="flex flex-col gap-12 w-full max-w-4xl mx-auto pb-20 page relative z-10">
      
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="font-newsreader text-5xl text-stone-100">Profile</h1>
        <p className="font-sans text-xs tracking-widest uppercase text-stone-500">Manage your digital identity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Identity & Actions */}
        <div className="md:col-span-1 flex flex-col gap-8">
          
          {/* Identity Card */}
          <div className="bg-[#1a1c1a]/90 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col items-center text-center gap-4 shadow-xl">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-secondary/80 to-stone-800 flex items-center justify-center border-4 border-black shadow-inner">
              <span className="font-newsreader text-4xl text-stone-900">{user.initials}</span>
            </div>
            <div>
              <h2 className="font-sans text-sm font-semibold text-stone-200 truncate w-48">{user.email}</h2>
              <p className="font-sans text-xs text-stone-500 mt-1">Joined {joinDate}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button className="bg-[#1a1c1a]/60 hover:bg-[#1a1c1a]/90 backdrop-blur-md rounded-xl border border-white/5 p-4 flex items-center justify-between text-stone-300 transition-all group">
              <span className="font-sans text-xs tracking-widest uppercase">Settings</span>
              <span className="material-symbols-outlined text-sm opacity-50 group-hover:opacity-100 transition-opacity">settings</span>
            </button>
            <button 
              onClick={onLogout}
              className="bg-red-950/20 hover:bg-red-900/40 backdrop-blur-md rounded-xl border border-red-900/30 p-4 flex items-center justify-between text-red-400 transition-all group"
            >
              <span className="font-sans text-xs tracking-widest uppercase">Log Out</span>
              <span className="material-symbols-outlined text-sm opacity-50 group-hover:opacity-100 transition-opacity">logout</span>
            </button>
          </div>
        </div>

        {/* Right Column: Stats & Plan */}
        <div className="md:col-span-2 flex flex-col gap-8">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1a1c1a]/90 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col gap-2 relative overflow-hidden group hover:border-secondary/30 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-secondary">local_fire_department</span>
              </div>
              <span className="font-sans text-xs tracking-widest uppercase text-stone-500">Current Streak</span>
              <div className="font-newsreader text-5xl text-stone-200">{user.streak} <span className="text-xl text-stone-500 font-sans">Days</span></div>
            </div>

            <div className="bg-[#1a1c1a]/90 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col gap-2 relative overflow-hidden group hover:border-white/20 transition-all">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-stone-100">menu_book</span>
              </div>
              <span className="font-sans text-xs tracking-widest uppercase text-stone-500">Total Entries</span>
              <div className="font-newsreader text-5xl text-stone-200">{user.total_entries || 0}</div>
            </div>
          </div>

          {/* Subscription Plan */}
          <div className="bg-gradient-to-br from-[#1a1c1a]/90 to-[#2a2c2a]/90 backdrop-blur-md rounded-2xl border border-white/10 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>
             
             <div className="flex flex-col gap-2 z-10 text-center sm:text-left">
               <span className="font-sans text-xs tracking-widest uppercase text-secondary font-semibold">Current Plan</span>
               <h3 className="font-newsreader text-3xl text-stone-100">{user.plan}</h3>
               <p className="font-sans text-sm text-stone-400 max-w-xs leading-relaxed">Upgrade to Premium to unlock unlimited memories, detailed analytics, and custom sanctuary themes.</p>
             </div>

             <button className="z-10 shrink-0 bg-secondary text-stone-900 px-8 py-3.5 rounded-xl font-label-caps text-xs uppercase tracking-widest hover:bg-white active:scale-95 transition-all shadow-lg">
               Upgrade Plan
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}
