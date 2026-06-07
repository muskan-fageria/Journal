import React from 'react';

export default function Sidebar({ currentPage, setCurrentPage, todayState, tasks, dateStr }) {
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
        <span className="font-newsreader text-xl text-stone-100">Syllable</span>
        <span className="font-sans text-xs tracking-widest uppercase text-stone-500">Digital Sanctuary</span>
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
      <div className="px-8 py-8 mt-auto flex flex-col gap-4 shrink-0 border-t border-white/5">
        <div className="font-sans text-xs tracking-widest text-stone-500">
          {dateStr}
        </div>
      </div>
    </nav>
  );
}
