import React from 'react';

const Logo = () => (
  <div className="flex items-center gap-3 select-none">
    <svg className="w-8 h-8 text-secondary" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer circle with a gap (270 degrees arc) */}
      <circle 
        cx="50" 
        cy="50" 
        r="38" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeDasharray="180 58" 
        strokeDashoffset="45"
      />
      {/* Centered dot */}
      <circle cx="50" cy="50" r="8" fill="currentColor" />
    </svg>
    <span className="font-newsreader text-2xl tracking-wide text-on-surface font-semibold">Life OS</span>
  </div>
);

export default function Sidebar({ currentPage, setCurrentPage, todayState, tasks, dateStr, userProfile }) {
  // We filter non-habit tasks due today
  const pendingTasksCount = tasks.filter(t => !t.done && t.cat !== 'habit').length;

  const navItems = [
    { id: 'today', label: 'Today', icon: 'spa' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar_month' },
    { id: 'journal', label: 'Journal', icon: 'menu_book' },
    { id: 'goals', label: 'Goals', icon: 'center_focus_strong' },
    { id: 'memory', label: 'Memories', icon: 'photo_library' },
    { id: 'profile', label: 'Settings', icon: 'settings' },
  ];

  // Try to parse the daily ratings from todayState.weather (serialized JSON)
  let todayBalance = '—';
  if (todayState.weather) {
    try {
      const parsed = JSON.parse(todayState.weather);
      if (parsed && typeof parsed === 'object') {
        const dimensionKeys = ['mind', 'health', 'learning', 'work', 'relationships', 'finance'];
        const ratings = dimensionKeys.map(k => parsed[k]).filter(v => typeof v === 'number');
        if (ratings.length > 0) {
          const avg = ratings.reduce((sum, val) => sum + val, 0) / ratings.length;
          todayBalance = `${avg.toFixed(1)}/10`;
        }
      }
    } catch (e) {}
  }

  return (
    <nav className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 border-r border-outline bg-surface z-50 overflow-y-auto custom-scrollbar select-none transition-all duration-300">
      {/* Brand Header */}
      <div className="px-8 py-8 flex flex-col gap-2 shrink-0 border-b border-outline">
        <Logo />
      </div>

      {/* Main Navigation */}
      <div className="flex flex-col gap-1 py-6 px-4">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex items-center gap-4 py-3 px-4 rounded-xl border-2 border-transparent transition-all duration-200 font-sans text-xs tracking-widest uppercase text-left w-full cursor-pointer ${
                isActive
                  ? 'bg-secondary text-white font-semibold shadow-sm active'
                  : 'text-on-surface-variant'
              }`}
            >
              <span 
                className="material-symbols-outlined text-[18px]" 
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Quick Status Summary */}
      <div className="px-8 flex flex-col gap-6 border-t border-outline mt-4 pt-6 pb-6">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant font-medium">Daily State</span>
          <span className="text-sm text-on-surface font-newsreader italic">
            {todayState.mood || 'Not checked in'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant font-medium">Life Balance</span>
          <span className="text-sm text-on-surface font-newsreader italic">
            {todayBalance}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant font-medium">Focus Today</span>
          <span className="text-sm text-on-surface font-newsreader italic">
            {pendingTasksCount > 0 ? `${pendingTasksCount} priorities left` : 'All clear'}
          </span>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="mt-auto flex flex-col shrink-0 border-t border-outline bg-surface-container-low/30">
        <div className="flex items-center gap-3 px-8 py-5">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 shadow-inner">
            <span className="font-newsreader text-sm text-white font-bold">{userProfile?.initials || 'OS'}</span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-sans text-[11px] font-semibold text-on-surface truncate">{userProfile?.email ? userProfile.email.split('@')[0] : 'Life OS'}</span>
            <span className="font-sans text-[9px] text-on-surface-variant truncate">{userProfile?.email || 'sanctuary@lifeos.me'}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
