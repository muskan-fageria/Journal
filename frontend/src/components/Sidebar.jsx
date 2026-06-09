import React from 'react';

export default function Sidebar({ currentPage, setCurrentPage, todayState, tasks, dateStr, userProfile }) {
  const completedTasksCount = tasks.filter(t => t.done).length;

  const navItems = [
    { id: 'today', label: 'Today', icon: 'dashboard' },
    { id: 'growth', label: 'Growth', icon: 'trending_up' },
    { id: 'diary', label: 'Diary', icon: 'menu_book' },
    { id: 'archive', label: 'Archive', icon: 'history' },
    { id: 'memory', label: 'Memories', icon: 'auto_awesome_motion' },
  ];

  return (
    <nav className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 border-r border-white/10 shadow-xl bg-stone-950/30 backdrop-blur-xl z-50 overflow-y-auto custom-scrollbar">
      {/* Brand Header */}
      <div className="px-8 py-8 flex flex-col gap-2 shrink-0">
        <img src="/src/assets/logo/logo.png" alt="LifeOs" className="h-12 w-auto object-contain object-left logo-img" />
      </div>

      {/* Main Navigation */}
      <div className="flex flex-col gap-4 py-4">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex items-center gap-4 border-l-2 py-2 pl-4 transition-all ease-in-out duration-300 font-sans text-xs tracking-widest uppercase text-left w-full cursor-pointer ${
                isActive
                  ? 'text-amber-200 border-amber-200/50 bg-white/5 active'
                  : 'text-stone-500 border-transparent hover:bg-white/5 hover:text-stone-200'
              }`}
            >
              <span 
                className="material-symbols-outlined" 
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Quick Status Summary */}
      <div className="px-8 flex flex-col gap-6 border-t border-white/5 pt-8 pb-8">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-semibold select-none">Mood</span>
          <span className="text-sm text-stone-200 font-newsreader italic">
            {todayState.mood || '—'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-semibold select-none">Focus</span>
          <span className="text-sm text-stone-200 font-newsreader italic">
            {todayState.rating ? `${todayState.rating}/10` : '—'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-semibold select-none">Tasks</span>
          <span className="text-sm text-stone-200 font-newsreader italic">
            {completedTasksCount} done
          </span>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="mt-auto flex flex-col shrink-0 border-t border-white/5">
        <button 
          onClick={() => setCurrentPage('profile')}
          className={`flex items-center gap-3 px-8 py-6 w-full text-left transition-colors ${currentPage === 'profile' ? 'bg-white/5 text-stone-200' : 'hover:bg-white/5 text-stone-500 hover:text-stone-300'}`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-secondary/80 to-stone-800 flex items-center justify-center shrink-0 border border-black shadow-inner">
            <span className="font-newsreader text-sm text-stone-900 font-bold">{userProfile?.initials || '??'}</span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-sans text-xs tracking-widest uppercase truncate">Profile</span>
            <span className="font-sans text-[10px] truncate opacity-70">{userProfile?.email || 'Loading...'}</span>
          </div>
        </button>
      </div>
    </nav>
  );
}
