import React, { useState, useMemo } from 'react';
import ElasticSlider from '../components/ElasticSlider';
import { authFetch } from '../utils/authFetch';

// =============================================
// MINI LIFE RING — Tiny 28px ring for calendar cells
// =============================================
function MiniLifeRing({ ratings, size = 28 }) {
  const dimensions = ['mind', 'health', 'learning', 'work', 'relationships', 'finance'];
  const colors = {
    mind: '#7C9A92',
    health: '#9B7E6B',
    learning: '#7B8FA8',
    work: '#8B8B6B',
    relationships: '#A87B8F',
    finance: '#6B8B7B',
  };

  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) - 3;
  const strokeWidth = 2.5;
  const gapDeg = 4;
  const segDeg = (360 - gapDeg * 6) / 6;

  const arcs = dimensions.map((dim, i) => {
    const val = (ratings[dim] || 5) / 10;
    const startAngle = i * (segDeg + gapDeg) - 90;
    const sweepAngle = segDeg * val;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + sweepAngle) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = sweepAngle > 180 ? 1 : 0;
    if (sweepAngle < 0.5) return null;
    return (
      <path
        key={dim}
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
        fill="none"
        stroke={colors[dim]}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={0.85}
      />
    );
  });

  // background track
  const bgArcs = dimensions.map((dim, i) => {
    const startAngle = i * (segDeg + gapDeg) - 90;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + segDeg) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = segDeg > 180 ? 1 : 0;
    return (
      <path
        key={`bg-${dim}`}
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={0.08}
      />
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="text-on-surface">
      {bgArcs}
      {arcs}
    </svg>
  );
}

// =============================================
// MOOD HELPERS
// =============================================
const moodColors = {
  'Flowing': '#7C9A92',
  'Light': '#A8B88F',
  'Heavy': '#B89A6B',
  'Restless': '#A87B7B',
  'Centered': '#7B8FA8',
};

const getMoodColor = (mood) => moodColors[mood] || '#555';

const getEmotionalState = (avg) => {
  if (avg >= 8) return { label: 'Thriving', color: '#7C9A92' };
  if (avg >= 6.5) return { label: 'Balanced', color: '#A8B88F' };
  if (avg >= 5) return { label: 'Growing', color: '#7B8FA8' };
  if (avg >= 3.5) return { label: 'Shifting', color: '#B89A6B' };
  if (avg >= 2) return { label: 'Restoring', color: '#A87B7B' };
  return { label: 'Awakening', color: '#8B7BA8' };
};

// =============================================
// MAIN COMPONENT
// =============================================
export default function GrowthPage({ 
  tasks, 
  setTasks, 
  projects, 
  setProjects, 
  events, 
  setEvents, 
  effectiveDateStr,
  toast,
  entries = [],
  todayState = {},
  socialData = {},
  hobbies = [],
}) {
  // ==========================================
  // STATE
  // ==========================================
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [showManage, setShowManage] = useState(false);

  // Form states (preserved from old GrowthPage)
  const [taskName, setTaskName] = useState('');
  const [taskDate, setTaskDate] = useState(effectiveDateStr);
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskRepeat, setTaskRepeat] = useState('none');
  const [taskDesc, setTaskDesc] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDateTime, setEventDateTime] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDateTo, setProjectDateTo] = useState(effectiveDateStr);
  const [projectDesc, setProjectDesc] = useState('');
  const [projectCompletion, setProjectCompletion] = useState(0);

  // ==========================================
  // COMPUTED DATA
  // ==========================================
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const todayStr = new Date().toISOString().split('T')[0];

  // Build an entries map keyed by date string
  const entriesMap = useMemo(() => {
    const map = {};
    (entries || []).forEach(e => {
      if (e.date) map[e.date] = e;
    });
    return map;
  }, [entries]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const { year, month } = currentMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];
    for (let i = 0; i < startDow; i++) {
      const prevDate = new Date(year, month, -startDow + i + 1);
      days.push({ date: prevDate, inMonth: false });
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push({ date: new Date(year, month, d), inMonth: true });
    }
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), inMonth: false });
      }
    }
    return days;
  }, [currentMonth]);

  // Monthly stats from entries
  const monthlyStats = useMemo(() => {
    const { year, month } = currentMonth;
    const monthEntries = (entries || []).filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date + 'T12:00:00');
      return d.getFullYear() === year && d.getMonth() === month;
    });

    if (monthEntries.length === 0) {
      return { count: 0, avgBalance: 0, bestDay: null, bestScore: 0, avgEnergy: 0, avgFocus: 0 };
    }

    let totalBalance = 0;
    let bestDay = null;
    let bestScore = -1;
    let totalEnergy = 0;
    let totalFocus = 0;
    let dimensionScoreCount = 0;

    monthEntries.forEach(e => {
      let dayAvg = 5;
      if (e.weather) {
        try {
          const dims = typeof e.weather === 'string' ? JSON.parse(e.weather) : e.weather;
          const dimKeys = ['mind','health','learning','work','relationships','finance'];
          const vals = dimKeys.map(k => dims[k]).filter(v => typeof v === 'number');
          if (vals.length > 0) {
            dayAvg = vals.reduce((s,v) => s+v, 0) / vals.length;
            dimensionScoreCount++;
          }
        } catch(err) { /* ignore parse errors */ }
      }
      totalBalance += dayAvg;
      totalEnergy += (e.energy || 5);
      totalFocus += (e.focus || 5);

      if (dayAvg > bestScore) {
        bestScore = dayAvg;
        bestDay = e.date;
      }
    });

    return {
      count: monthEntries.length,
      avgBalance: dimensionScoreCount > 0 ? (totalBalance / dimensionScoreCount) : 0,
      bestDay,
      bestScore,
      avgEnergy: totalEnergy / monthEntries.length,
      avgFocus: totalFocus / monthEntries.length,
    };
  }, [entries, currentMonth]);

  // Parse dimensions for a given entry
  const parseDimensions = (entry) => {
    if (!entry || !entry.weather) return null;
    try {
      const dims = typeof entry.weather === 'string' ? JSON.parse(entry.weather) : entry.weather;
      const dimKeys = ['mind','health','learning','work','relationships','finance'];
      const result = {};
      let hasAny = false;
      dimKeys.forEach(k => {
        if (typeof dims[k] === 'number') {
          result[k] = dims[k];
          hasAny = true;
        } else {
          result[k] = 5;
        }
      });
      return hasAny ? result : null;
    } catch(err) { return null; }
  };

  // Selected day data
  const selectedEntry = selectedDate ? entriesMap[selectedDate] : null;
  const selectedDimensions = selectedEntry ? parseDimensions(selectedEntry) : null;
  const selectedDayTasks = selectedDate ? (tasks || []).filter(t => t.date === selectedDate || t.due === selectedDate) : [];
  const selectedDayEvents = selectedDate ? (events || []).filter(e => e.date === selectedDate) : [];

  // ==========================================
  // NAVIGATION
  // ==========================================
  const goToPrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
    setSelectedDate(null);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDate(todayStr);
  };

  // ==========================================
  // CRUD HANDLERS (preserved from original)
  // ==========================================
  const handleAddTask = async () => {
    if (!taskName.trim()) return toast('Please enter a task name.');
    const newTask = { name: taskName, due: taskDate || null, priority: taskPriority, repeat: taskRepeat, notes: taskDesc, cat: 'work', done: false };
    try {
      const res = await authFetch('/api/tasks', { method: 'POST', body: JSON.stringify(newTask) });
      const data = await res.json();
      setTasks([...tasks, data]);
      setTaskName(''); setTaskDesc('');
      toast('Task added \u2713');
    } catch (err) { console.error(err); toast('Failed to add task'); }
  };

  const handleAddEvent = async () => {
    if (!eventName.trim()) return toast('Please enter an event name.');
    const newEvent = { name: eventName, date: eventDateTime ? eventDateTime.split('T')[0] : null, time: eventDateTime ? eventDateTime.split('T')[1] : null, notes: eventDesc, cat: 'personal' };
    try {
      const res = await authFetch('/api/events', { method: 'POST', body: JSON.stringify(newEvent) });
      const data = await res.json();
      setEvents([...events, data]);
      setEventName(''); setEventDateTime(''); setEventDesc('');
      toast('Event added \u2713');
    } catch (err) { console.error(err); toast('Failed to add event'); }
  };

  const handleAddProject = async () => {
    if (!projectName.trim()) return toast('Please enter a project name.');
    const newProject = { name: projectName, deadline: projectDateTo || null, desc: projectDesc, pct: parseInt(projectCompletion) || 0, status: 'active' };
    try {
      const res = await authFetch('/api/projects', { method: 'POST', body: JSON.stringify(newProject) });
      const data = await res.json();
      setProjects([...projects, data]);
      setProjectName(''); setProjectDesc(''); setProjectCompletion(0);
      toast('Project added \u2713');
    } catch (err) { console.error(err); toast('Failed to add project'); }
  };

  const handleToggleTask = async (id, currentVal) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !currentVal } : t));
    await authFetch(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ done: !currentVal }) });
  };
  const handleDeleteTask = async (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    await authFetch(`/api/tasks/${id}`, { method: 'DELETE' });
  };
  const handleDeleteEvent = async (id) => {
    setEvents(events.filter(e => e.id !== id));
    await authFetch(`/api/events/${id}`, { method: 'DELETE' });
  };
  const handleProjectSlider = async (id, val) => {
    const pct = parseInt(val);
    setProjects(projects.map(p => p.id === id ? { ...p, pct } : p));
    await authFetch(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify({ pct }) });
  };
  const handleToggleProject = async (id, isDone) => {
    const status = isDone ? 'completed' : 'active';
    const pct = isDone ? 100 : 90;
    setProjects(projects.map(p => p.id === id ? { ...p, status, pct } : p));
    await authFetch(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify({ status, pct }) });
  };
  const handleDeleteProject = async (id) => {
    setProjects(projects.filter(p => p.id !== id));
    await authFetch(`/api/projects/${id}`, { method: 'DELETE' });
  };

  // Format date for display
  const formatDateLong = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Dimension color map
  const dimColorMap = {
    mind: '#7C9A92', health: '#9B7E6B', learning: '#7B8FA8',
    work: '#8B8B6B', relationships: '#A87B8F', finance: '#6B8B7B'
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="page max-w-5xl mx-auto w-full animate-fade-in">

      {/* ===== HEADER ===== */}
      <header className="mb-10">
        <span className="font-sans text-[10px] tracking-[0.2em] text-secondary uppercase font-semibold block mb-3 select-none">
          Life Timeline
        </span>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="font-newsreader text-4xl text-on-surface select-none">
            {monthNames[currentMonth.month]} {currentMonth.year}
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={goToPrevMonth} className="timeline-nav-btn" aria-label="Previous month">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button onClick={goToToday} className="timeline-nav-btn px-3">
              <span className="text-[10px] font-sans tracking-wider uppercase font-semibold">Today</span>
            </button>
            <button onClick={goToNextMonth} className="timeline-nav-btn" aria-label="Next month">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
        <p className="font-sans text-xs text-on-surface-variant mt-2 max-w-xl select-none">
          Browse your life history. Each day tells a story of balance, growth, and presence.
        </p>
      </header>

      {/* ===== MONTHLY INSIGHT CARDS ===== */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="monthly-insight-card">
          <span className="insight-label">Journal Entries</span>
          <span className="insight-value">{monthlyStats.count}</span>
          <span className="insight-sub">this month</span>
        </div>
        <div className="monthly-insight-card">
          <span className="insight-label">Life Balance</span>
          <span className="insight-value">
            {monthlyStats.avgBalance > 0 ? monthlyStats.avgBalance.toFixed(1) : '\u2014'}
          </span>
          <span className="insight-sub">
            {monthlyStats.avgBalance > 0 ? getEmotionalState(monthlyStats.avgBalance).label : 'No data yet'}
          </span>
        </div>
        <div className="monthly-insight-card">
          <span className="insight-label">Avg Energy</span>
          <span className="insight-value">{monthlyStats.avgEnergy > 0 ? monthlyStats.avgEnergy.toFixed(1) : '\u2014'}</span>
          <span className="insight-sub">out of 10</span>
        </div>
        <div className="monthly-insight-card">
          <span className="insight-label">Best Day</span>
          <span className="insight-value" style={{ fontSize: '0.95rem' }}>
            {monthlyStats.bestDay 
              ? new Date(monthlyStats.bestDay + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : '\u2014'
            }
          </span>
          <span className="insight-sub">{monthlyStats.bestScore > 0 ? `Score: ${monthlyStats.bestScore.toFixed(1)}` : 'No entries'}</span>
        </div>
      </section>

      {/* ===== CALENDAR GRID ===== */}
      <section className="calendar-container mb-8">
        <div className="calendar-grid">
          {dayNames.map(d => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}

          {calendarDays.map((day, i) => {
            const dateKey = day.date.toISOString().split('T')[0];
            const entry = entriesMap[dateKey];
            const dims = entry ? parseDimensions(entry) : null;
            const isToday = dateKey === todayStr;
            const isSelected = dateKey === selectedDate;
            const hasEntry = !!entry;
            const hasEvents = (events || []).some(e => e.date === dateKey);
            const hasTasks = (tasks || []).some(t => (t.due === dateKey || t.date === dateKey) && t.cat !== 'habit');

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                className={[
                  'calendar-day',
                  !day.inMonth && 'calendar-day--outside',
                  isToday && 'calendar-day--today',
                  hasEntry && 'calendar-day--has-entry',
                  isSelected && 'calendar-day--selected',
                ].filter(Boolean).join(' ')}
              >
                <span className="calendar-day-num">{day.date.getDate()}</span>

                {dims && day.inMonth && (
                  <MiniLifeRing ratings={dims} size={28} />
                )}

                <div className="flex items-center gap-0.5 mt-auto">
                  {entry && entry.mood && (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: getMoodColor(entry.mood) }}
                      title={entry.mood}
                    />
                  )}
                  {hasEvents && (
                    <div className="w-1 h-1 rounded-full bg-purple-400/70" title="Event" />
                  )}
                  {hasTasks && (
                    <div className="w-1 h-1 rounded-full bg-blue-400/70" title="Task" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===== DAY DETAIL PANEL ===== */}
      {selectedDate && (
        <section className="day-detail-panel mb-8 animate-fade-in">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-newsreader text-2xl text-on-surface">
                {formatDateLong(selectedDate)}
              </h2>
              {selectedEntry && selectedEntry.mood && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getMoodColor(selectedEntry.mood) }} />
                  <span className="font-sans text-xs text-on-surface-variant italic">{selectedEntry.mood}</span>
                  {selectedEntry.oneWord && (
                    <React.Fragment>
                      <span className="text-on-surface-variant/30 text-xs">&middot;</span>
                      <span className="font-newsreader text-xs text-on-surface italic">&ldquo;{selectedEntry.oneWord}&rdquo;</span>
                    </React.Fragment>
                  )}
                </div>
              )}
            </div>
            <button 
              onClick={() => setSelectedDate(null)}
              className="text-on-surface-variant hover:text-on-surface transition-colors p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {selectedEntry ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Life Dimensions */}
              <div className="flex flex-col gap-4">
                {selectedDimensions && (
                  <div className="dimension-card">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-[14px] text-secondary">donut_large</span>
                      <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">Life Dimensions</span>
                    </div>
                    <div className="flex items-center gap-5">
                      <MiniLifeRing ratings={selectedDimensions} size={56} />
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 flex-1">
                        {['mind','health','learning','work','relationships','finance'].map(dim => (
                          <div key={dim} className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-on-surface-variant capitalize">{dim}</span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all"
                                  style={{ 
                                    width: `${(selectedDimensions[dim] / 10) * 100}%`,
                                    backgroundColor: dimColorMap[dim]
                                  }}
                                />
                              </div>
                              <span className="text-[10px] font-newsreader text-on-surface w-3 text-right">{selectedDimensions[dim]}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Health Metrics */}
                <div className="dimension-card">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-[14px]" style={{ color: '#9B7E6B' }}>favorite</span>
                    <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">Health Snapshot</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: 'bedtime', label: 'Sleep', value: selectedEntry.sleep || '\u2014' },
                      { icon: 'fitness_center', label: 'Exercise', value: selectedEntry.exercise || '\u2014' },
                      { icon: 'directions_walk', label: 'Steps', value: selectedEntry.steps || '\u2014' },
                      { icon: 'water_drop', label: 'Water', value: selectedEntry.water || '\u2014' },
                    ].map(m => (
                      <div key={m.label} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[13px] text-on-surface-variant">{m.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-on-surface-variant uppercase tracking-wider">{m.label}</span>
                          <span className="text-sm font-newsreader text-on-surface">{m.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Energy & Focus */}
                <div className="dimension-card">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-[14px]" style={{ color: '#7B8FA8' }}>bolt</span>
                    <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">Energy & Focus</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-on-surface-variant uppercase tracking-wider block mb-1">Energy</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-amber-600/70" style={{ width: `${((selectedEntry.energy || 5) / 10) * 100}%` }} />
                        </div>
                        <span className="text-xs font-newsreader text-on-surface">{selectedEntry.energy || 5}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] text-on-surface-variant uppercase tracking-wider block mb-1">Focus</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-600/50" style={{ width: `${((selectedEntry.focus || 5) / 10) * 100}%` }} />
                        </div>
                        <span className="text-xs font-newsreader text-on-surface">{selectedEntry.focus || 5}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Gratitude, Tasks, Events */}
              <div className="flex flex-col gap-4">
                {selectedEntry.rating > 0 && (
                  <div className="dimension-card">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[14px] text-secondary">star</span>
                      <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">Alignment</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 10 }).map((_, idx) => (
                        <span
                          key={idx}
                          className="material-symbols-outlined text-[16px]"
                          style={{ 
                            fontVariationSettings: idx < selectedEntry.rating ? "'FILL' 1" : "'FILL' 0",
                            color: idx < selectedEntry.rating ? 'var(--accent)' : 'var(--border2)',
                          }}
                        >star</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEntry.gratitude && (
                  <div className="dimension-card">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[14px]" style={{ color: '#A8B88F' }}>emoji_nature</span>
                      <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">Gratitude</span>
                    </div>
                    <p className="font-newsreader text-sm text-on-surface italic leading-relaxed">
                      &ldquo;{selectedEntry.gratitude}&rdquo;
                    </p>
                  </div>
                )}

                {selectedEntry.remark && (
                  <div className="dimension-card">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[14px]" style={{ color: '#7C9A92' }}>edit_note</span>
                      <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">Reflection</span>
                    </div>
                    <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                      {selectedEntry.remark}
                    </p>
                  </div>
                )}

                {selectedEntry.tasks && selectedEntry.tasks.length > 0 && (
                  <div className="dimension-card">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[14px]" style={{ color: '#8B8B6B' }}>check_circle</span>
                      <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">Completed</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {selectedEntry.tasks.map((t, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[12px] text-secondary">done</span>
                          <span className="text-xs text-on-surface">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDayEvents.length > 0 && (
                  <div className="dimension-card">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[14px]" style={{ color: '#A87B8F' }}>event</span>
                      <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">Events</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {selectedDayEvents.map((ev) => (
                        <div key={ev.id} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400/70" />
                          <span className="text-xs text-on-surface">{ev.name}</span>
                          {ev.time && <span className="text-[10px] text-on-surface-variant ml-auto">{ev.time}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3 block">calendar_today</span>
              <p className="font-newsreader text-on-surface-variant italic text-sm">
                No entry recorded for this day.
              </p>
              <p className="font-sans text-[10px] text-on-surface-variant/60 mt-1">
                Entries are created when you save your daily sanctuary check-in.
              </p>
            </div>
          )}
        </section>
      )}

      {/* ===== YEAR HEATMAP ===== */}
      <section className="calendar-container mb-8 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[16px] text-secondary">calendar_view_month</span>
          <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-[0.15em] font-semibold">
            {currentMonth.year} Life Activity
          </span>
        </div>
        <div className="grid grid-cols-12 gap-1.5">
          {Array.from({ length: 12 }).map((_, monthIdx) => {
            const monthEntries = (entries || []).filter(e => {
              if (!e.date) return false;
              const d = new Date(e.date + 'T12:00:00');
              return d.getFullYear() === currentMonth.year && d.getMonth() === monthIdx;
            });
            const daysInMonth = new Date(currentMonth.year, monthIdx + 1, 0).getDate();
            const density = monthEntries.length / daysInMonth;
            const isCurrentMonth = monthIdx === currentMonth.month;

            return (
              <button
                key={monthIdx}
                onClick={() => { setCurrentMonth({ year: currentMonth.year, month: monthIdx }); setSelectedDate(null); }}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all cursor-pointer ${
                  isCurrentMonth ? 'bg-secondary/10 border border-secondary/20' : 'hover:bg-white/[0.03] border border-transparent'
                }`}
                title={`${monthNames[monthIdx]}: ${monthEntries.length} entries`}
              >
                <span className={`text-[9px] font-sans uppercase tracking-wider ${isCurrentMonth ? 'text-secondary font-semibold' : 'text-on-surface-variant'}`}>
                  {monthNames[monthIdx].slice(0, 3)}
                </span>
                <div 
                  className="w-4 h-4 rounded-sm"
                  style={{
                    backgroundColor: density > 0 
                      ? `rgba(124, 154, 146, ${Math.min(0.2 + density * 0.8, 1)})` 
                      : 'rgba(255,255,255,0.05)',
                  }}
                />
                <span className="text-[8px] text-on-surface-variant">{monthEntries.length}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===== MANAGE TASKS/EVENTS/PROJECTS (COLLAPSIBLE) ===== */}
      <section className="calendar-container mb-4">
        <button
          onClick={() => setShowManage(!showManage)}
          className="w-full flex items-center justify-between p-5 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">edit_calendar</span>
            <span className="font-sans text-xs text-on-surface tracking-wider uppercase font-semibold">
              Manage Tasks, Events & Projects
            </span>
          </div>
          <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 group-hover:text-on-surface ${showManage ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {showManage && (
          <div className="px-5 pb-6 pt-2 border-t border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Task Form */}
              <div className="flex flex-col gap-3">
                <h3 className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">New Task</h3>
                <input type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)}
                  className="manage-input" placeholder="Task name..." />
                <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)}
                  className="manage-input" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="manage-input">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <select value={taskRepeat} onChange={(e) => setTaskRepeat(e.target.value)} className="manage-input">
                    <option value="none">No repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)}
                  className="manage-input h-16 resize-none" placeholder="Notes..." />
                <button onClick={handleAddTask} className="manage-btn">Add Task</button>
              </div>

              {/* Event Form */}
              <div className="flex flex-col gap-3">
                <h3 className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">New Event</h3>
                <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)}
                  className="manage-input" placeholder="Event name..." />
                <input type="datetime-local" value={eventDateTime} onChange={(e) => setEventDateTime(e.target.value)}
                  className="manage-input" />
                <textarea value={eventDesc} onChange={(e) => setEventDesc(e.target.value)}
                  className="manage-input h-16 resize-none" placeholder="Details..." />
                <button onClick={handleAddEvent} className="manage-btn">Add Event</button>
              </div>

              {/* Project Form */}
              <div className="flex flex-col gap-3 md:col-span-2">
                <h3 className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">New Project</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)}
                    className="manage-input" placeholder="Project name..." />
                  <input type="date" value={projectDateTo} onChange={(e) => setProjectDateTo(e.target.value)}
                    className="manage-input" />
                </div>
                <textarea value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)}
                  className="manage-input h-16 resize-none" placeholder="Project goals..." />
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-on-surface-variant uppercase tracking-wider">Progress: {projectCompletion}%</span>
                  <ElasticSlider defaultValue={parseInt(projectCompletion)||0} startingValue={0} maxValue={100}
                    stepSize={1} isStepped={true} rangeColorClass="bg-secondary"
                    onChange={(val) => setProjectCompletion(Math.round(val))} className="flex-1" />
                </div>
                <button onClick={handleAddProject} className="manage-btn">Add Project</button>
              </div>
            </div>

            {/* Upcoming Items Preview */}
            {(() => {
              const upcoming = [
                ...tasks.filter(t => !t.done && t.cat !== 'habit').map(t => ({ ...t, type: 'Task', color: '#4299e1' })),
                ...events.map(e => ({ ...e, type: 'Event', color: '#A87B8F' })),
                ...projects.filter(p => p.status !== 'completed').map(p => ({ ...p, type: 'Project', color: '#6B8B7B' })),
              ];
              if (upcoming.length === 0) return null;

              return (
                <div className="mt-6 pt-4 border-t border-white/5">
                  <h3 className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold mb-3">Active Items</h3>
                  <div className="flex flex-col gap-2">
                    {upcoming.slice(0, 8).map(item => (
                      <div key={item.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors group">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-on-surface flex-1">{item.name}</span>
                        <span className="text-[9px] text-on-surface-variant uppercase tracking-wider">{item.type}</span>
                        <button 
                          onClick={() => {
                            if (item.type === 'Task') handleDeleteTask(item.id);
                            else if (item.type === 'Event') handleDeleteEvent(item.id);
                            else handleDeleteProject(item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-red-400 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    ))}
                    {upcoming.length > 8 && (
                      <span className="text-[10px] text-on-surface-variant italic text-center">+{upcoming.length - 8} more items</span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </section>
    </div>
  );
}
