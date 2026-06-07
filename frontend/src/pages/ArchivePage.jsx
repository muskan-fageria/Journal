import React, { useState } from 'react';

export default function ArchivePage({ entries, toast }) {
  const [search, setSearch] = useState('');

  const MOOD_ICONS = {
    'Flowing': 'water_drop',
    'Light': 'light_mode',
    'Heavy': 'tsunami',
    'Restless': 'air',
    'Centered': 'filter_vintage'
  };

  // Filtered list
  const filteredEntries = entries.filter(e => {
    const term = search.toLowerCase();
    return (
      (e.dateStr || '').toLowerCase().includes(term) ||
      (e.remark || '').toLowerCase().includes(term) ||
      (e.tasks || []).join(' ').toLowerCase().includes(term) ||
      (e.mood || '').toLowerCase().includes(term)
    );
  });

  // Calculate statistics
  const daysLogged = filteredEntries.length;
  
  const ratedEntries = filteredEntries.filter(e => e.rating);
  const avgRating = ratedEntries.length 
    ? (ratedEntries.reduce((acc, curr) => acc + curr.rating, 0) / ratedEntries.length).toFixed(1) 
    : '—';

  const totalTasksDone = filteredEntries.reduce((acc, curr) => acc + (curr.tasks?.length || 0), 0);

  const entriesWithProd = filteredEntries.filter(e => e.productive);
  const avgProductiveHours = entriesWithProd.length
    ? (entriesWithProd.reduce((acc, curr) => acc + (parseFloat(curr.productive) || 0), 0) / entriesWithProd.length).toFixed(1) + 'h'
    : '—';

  // Count mood frequencies
  const moodCounts = {};
  filteredEntries.forEach(e => {
    if (e.mood) {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    }
  });
  const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);

  // ==========================================
  // EXPORT CSV
  // ==========================================
  const handleExportCSV = () => {
    if (!entries.length) return toast('No entries to export');
    const headers = ['Date', 'Mood', 'Weather', 'Rating', 'Tasks Done', 'Remarks', 'Gratitude'];
    const rows = entries.map(e => [
      e.dateStr || e.date, 
      e.mood || '', 
      e.weather || '', 
      e.rating || '', 
      (e.tasks || []).join('; '), 
      (e.remark || '').replace(/"/g, '""'), 
      e.gratitude || ''
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'my-journal.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Exported ✓');
  };

  // ==========================================
  // SVG LINE CHART (Last 14 Ratings)
  // ==========================================
  const renderTrendChart = () => {
    const points = [...filteredEntries]
      .slice(0, 14)
      .reverse()
      .filter(e => e.rating)
      .map(e => ({
        y: e.rating,
        label: e.dateStr?.split(',')[0]?.split(' ')[0] || '' // Day name like "Sun"
      }));

    const W = 360;
    const H = 160;
    
    if (points.length < 2) {
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="line-svg w-full h-full select-none">
          <text x={W / 2} y={H / 2} textAnchor="middle" fill="#88ab80" fontSize="11" className="italic font-serif">
            Not enough data yet to plot trend
          </text>
        </svg>
      );
    }

    const p = { t: 20, r: 12, b: 28, l: 28 };
    const iw = W - p.l - p.r;
    const ih = H - p.t - p.b;
    const maxV = Math.max(...points.map(x => x.y), 1);
    
    const xs = points.map((_, i) => p.l + i * (iw / Math.max(points.length - 1, 1)));
    const ys = points.map(x => p.t + ih - (x.y / maxV) * ih);
    
    const pathD = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
    const fillD = pathD + ` L${xs[xs.length - 1].toFixed(1)},${(p.t + ih).toFixed(1)} L${p.l},${(p.t + ih).toFixed(1)} Z`;
    const gradId = 'ratings-chart-grad';

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="line-svg w-full h-full overflow-visible select-none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8fb86e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#8fb86e" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Shaded Area */}
        <path d={fillD} fill={`url(#${gradId})`} />
        
        {/* Stroke Line */}
        <path d={pathD} fill="none" stroke="#8fb86e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Nodes and Labels */}
        {xs.map((x, i) => (
          <g key={i}>
            <circle cx={x.toFixed(1)} cy={ys[i].toFixed(1)} r="4" fill="#8fb86e" stroke="#0c120e" strokeWidth="1" />
            {/* Axis Label */}
            <text x={x.toFixed(1)} y={(H - 6).toFixed(1)} textAnchor="middle" fontSize="9" fill="#88ab80">
              {points[i].label}
            </text>
            {/* Rating Value */}
            <text x={x.toFixed(1)} y={(ys[i] - 8).toFixed(1)} textAnchor="middle" fontSize="8" fill="#e6c183" fontWeight="bold">
              {points[i].y}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="page max-w-6xl mx-auto w-full animate-fade-in">
      <header className="max-w-4xl pt-8 md:pt-12 mb-12">
        <span className="font-label-caps text-secondary mb-4 block tracking-widest uppercase select-none">Chronicles & Echoes</span>
        <h1 className="font-h1 text-h1 text-on-surface mb-6 select-none">Archive</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl select-none">
          Explore past journal entries and review metrics history.
        </p>
      </header>

      {/* Grid of stats and search filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Filter and Logs Table */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/[0.03] p-4 rounded-xl border border-white/5">
            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-lg select-none">search</span>
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entries, tasks or remarks..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-on-surface text-sm focus:border-secondary focus:ring-0"
              />
            </div>
            <div className="flex gap-3 items-center w-full md:w-auto justify-end">
              <span className="text-xs text-on-surface-variant font-label-caps select-none" id="ref-count">
                {daysLogged} {daysLogged === 1 ? 'entry' : 'entries'}
              </span>
              <button 
                onClick={handleExportCSV}
                className="bg-secondary/15 hover:bg-secondary/25 border border-secondary/30 text-secondary px-4 py-2 rounded-xl text-xs font-label-caps uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">download</span> Export CSV
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white/[0.03] border border-outline-variant/20 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="ref-table">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="select-none">Date</th>
                    <th className="select-none">Tasks Done</th>
                    <th className="select-none">Mood</th>
                    <th className="select-none">Rating</th>
                    <th className="select-none">Remarks & Gratitude</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.length > 0 ? (
                    filteredEntries.map((e, index) => (
                      <tr key={e.id || index} className="group hover:bg-white/[0.02] transition-colors border-b border-white/5">
                        <td className="py-4 pl-4 min-w-[130px]">
                          <div className="font-semibold text-on-surface">{e.dateStr || e.date}</div>
                          <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5 select-none">{e.weather || ''}</div>
                        </td>
                        <td className="py-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {e.tasks && e.tasks.length > 0 ? (
                              e.tasks.map((taskName, idx) => (
                                <span key={idx} className="bg-secondary/10 text-secondary text-[9px] px-1.5 py-0.5 rounded border border-secondary/20 select-none">
                                  {taskName}
                                </span>
                              ))
                            ) : (
                              <span className="text-on-surface-variant/40 italic select-none">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 min-w-[100px]">
                          <div className="flex items-center gap-2">
                            {e.mood && (
                              <span className="material-symbols-outlined text-secondary text-[18px]">
                                {MOOD_ICONS[e.mood] || 'sentiment_satisfied'}
                              </span>
                            )}
                            <span className="text-sm font-newsreader italic text-on-surface">{e.mood || '—'}</span>
                          </div>
                        </td>
                        <td className="py-4 min-w-[70px]">
                          <div className="flex items-center gap-1 select-none">
                            <span className="text-secondary font-h3 text-lg font-bold">{e.rating || '—'}</span>
                            {e.rating && <span className="text-[10px] text-on-surface-variant">/10</span>}
                          </div>
                        </td>
                        <td className="py-4 pr-4 max-w-sm">
                          <div className="text-on-surface-variant italic text-sm leading-relaxed">{e.remark || '—'}</div>
                          {e.gratitude && (
                            <div className="text-[10px] text-secondary/80 mt-1.5 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">favorite</span>
                              {e.gratitude}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">
                        <div className="empty-state text-center text-on-surface-variant italic py-12 select-none">
                          No matching entries.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Charts & Statistics */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Trend Chart Card */}
          <div className="bg-white/[0.05] border border-outline-variant/30 rounded-xl p-6 bento-card">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block mb-4 select-none">Ratings Trend</span>
            <div className="h-44 w-full flex items-center justify-center">
              {renderTrendChart()}
            </div>
          </div>

          {/* Quick Metrics Stats Dashboard */}
          <div className="bg-white/[0.03] border border-outline-variant/20 rounded-xl p-6 flex flex-col gap-4 bento-card">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest select-none">Overview</span>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-on-surface-variant select-none">Days Logged</span>
                <strong className="text-on-surface">{daysLogged}</strong>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-on-surface-variant select-none">Average Rating</span>
                <strong className="text-secondary">{avgRating}</strong>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-on-surface-variant select-none">Tasks Done</span>
                <strong className="text-on-surface">{totalTasksDone}</strong>
              </div>
              <div className="flex justify-between items-center text-sm pb-1">
                <span className="text-on-surface-variant select-none">Avg Productive Time</span>
                <strong className="text-on-surface">{avgProductiveHours}</strong>
              </div>
            </div>
          </div>

          {/* Mood Frequencies */}
          <div className="bg-white/[0.03] border border-outline-variant/20 rounded-xl p-6 flex flex-col gap-4 bento-card">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest select-none">Mood Frequencies</span>
            <div className="flex flex-col gap-3">
              {sortedMoods.length > 0 ? (
                sortedMoods.map(([mood, count], idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-secondary text-[16px] select-none">
                      {MOOD_ICONS[mood] || 'sentiment_satisfied'}
                    </span>
                    <span className="text-on-surface-variant flex-grow select-none">{mood}</span>
                    <strong className="text-on-surface select-none">{count}×</strong>
                  </div>
                ))
              ) : (
                <div className="text-xs text-on-surface-variant/50 italic py-2 select-none">
                  No moods logged yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
