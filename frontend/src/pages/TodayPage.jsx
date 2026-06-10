import React, { useState, useEffect } from 'react';
import LifeRing from '../components/LifeRing';
import ElasticSlider from '../components/ElasticSlider';
import { authFetch } from '../utils/authFetch';

export default function TodayPage({ 
  todayState, 
  setTodayState, 
  hobbies, 
  setHobbies, 
  tasks, 
  setTasks, 
  socialData, 
  setSocialData,
  dateStr,
  effectiveDateStr,
  toast,
  saveTodayStateAPI,
  saveSocialAPI,
  userProfile,
  handleSaveTodayEntry,
  toggleGoalTracking
}) {
  const [activeSegment, setActiveSegment] = useState('mind');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [newHobbyName, setNewHobbyName] = useState('');

  // Default values for ratings and reflections
  const defaultRatings = {
    health: 5,
    work: 5,
    learning: 5,
    relationships: 5,
    finance: 5,
    mind: 5,
    sleepQuality: 5,
    weeklyWell: '',
    weeklyAttention: '',
    weeklyBalance: ''
  };

  // Parsing helper for JSON metadata in weather column
  const getExtendedData = () => {
    if (!todayState.weather) return defaultRatings;
    try {
      const parsed = JSON.parse(todayState.weather);
      return { ...defaultRatings, ...parsed };
    } catch (e) {
      return defaultRatings;
    }
  };

  const extData = getExtendedData();

  const saveExtendedData = (newValues) => {
    const current = getExtendedData();
    const merged = { ...current, ...newValues };
    const weatherString = JSON.stringify(merged);
    
    const updatedState = { ...todayState, weather: weatherString };
    setTodayState(updatedState);
    saveTodayStateAPI(updatedState);
  };

  // ==========================================
  // GREETINGS & MESSAGES
  // ==========================================
  const getGreetingAndMessage = () => {
    const hr = new Date().getHours();
    if (hr < 12) {
      return {
        title: "Good Morning",
        quote: "Your attention shapes your life. Take a breath before you begin."
      };
    } else if (hr < 17) {
      return {
        title: "Good Afternoon",
        quote: "Small steps become meaningful change. Where is your focus right now?"
      };
    } else {
      return {
        title: "Good Evening",
        quote: "Today is another chance to realign. Reflect on your journey tonight."
      };
    }
  };

  const { title: greetingTitle, quote: greetingQuote } = getGreetingAndMessage();

  // ==========================================
  // DAILY CHECK-IN HANDLERS
  // ==========================================
  const handleMoodSelect = (mood) => {
    const updated = { ...todayState, mood };
    setTodayState(updated);
    saveTodayStateAPI(updated);
    toast(`Mood set to ${mood} ✦`);
  };

  const handleRatingSelect = (rating) => {
    const updated = { ...todayState, rating };
    setTodayState(updated);
    saveTodayStateAPI(updated);
    toast(`Overall Day rated ${rating}/10`);
  };

  const handleStateSliderChange = (key, value) => {
    const updated = { ...todayState, [key]: value };
    setTodayState(updated);
    saveTodayStateAPI(updated);
  };

  // ==========================================
  // RHYTHMS (HABITS) HANDLERS
  // ==========================================
  const handleAddHobby = async () => {
    const name = newHobbyName.trim();
    if (!name) return toast('Enter a rhythm name');
    
    const exists = hobbies.some(h => h.name.toLowerCase() === name.toLowerCase());
    if (exists) return toast('Rhythm already exists');

    try {
      const response = await authFetch('/api/hobbies', {
        method: 'POST',
        body: JSON.stringify({ name, mins: 0, streak: 0 })
      });
      const data = await response.json();
      setHobbies([...hobbies, data]);
      setNewHobbyName('');
      toast('Rhythm added ✓');
    } catch (err) {
      console.error(err);
      toast('Failed to add rhythm');
    }
  };

  const handleDeleteHobby = async (hobbyId, hobbyName) => {
    try {
      await authFetch(`/api/hobbies/${hobbyId}`, { method: 'DELETE' });
      setHobbies(hobbies.filter(h => h.id !== hobbyId));
      
      const tasksToKeep = tasks.filter(t => !(t.cat === 'habit' && t.name === hobbyName));
      setTasks(tasksToKeep);
      
      await authFetch('/api/tasks', {
        method: 'DELETE',
        body: JSON.stringify({ ids: tasks.filter(t => t.cat === 'habit' && t.name === hobbyName).map(t => t.id) })
      });

      toast('Rhythm deleted');
    } catch (err) {
      console.error(err);
      toast('Failed to delete rhythm');
    }
  };

  const toggleRhythm = async (hobbyName) => {
    const isDone = tasks.some(t => t.cat === 'habit' && t.name === hobbyName && t.date === effectiveDateStr && t.done);
    
    if (isDone) {
      const existing = tasks.find(t => t.cat === 'habit' && t.name === hobbyName && t.date === effectiveDateStr);
      if (existing) {
        setTasks(tasks.filter(t => t.id !== existing.id));
        await authFetch(`/api/tasks/${existing.id}`, { method: 'DELETE' });
      }
    } else {
      const newTask = {
        name: hobbyName,
        cat: 'habit',
        priority: 'low',
        notes: '',
        due: effectiveDateStr,
        done: true,
        date: effectiveDateStr
      };
      
      const response = await authFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask)
      });
      const data = await response.json();
      setTasks([...tasks, data]);
    }
  };

  const getRhythmStreak = (rhythmName) => {
    const doneDates = [...new Set(
      tasks
        .filter(t => t.cat === 'habit' && t.name === rhythmName && t.done)
        .map(t => t.date)
    )].sort().reverse();
    
    if (doneDates.length === 0) return 0;
    
    const todayStr = effectiveDateStr;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (doneDates[0] !== todayStr && doneDates[0] !== yesterdayStr) return 0;
    
    let streak = 1;
    let current = new Date(doneDates[0] + 'T12:00:00');
    for (let i = 1; i < doneDates.length; i++) {
      const expected = new Date(current);
      expected.setDate(expected.getDate() - 1);
      const expectedStr = expected.toISOString().split('T')[0];
      if (doneDates[i] === expectedStr) {
        streak++;
        current = expected;
      } else {
        break;
      }
    }
    return streak;
  };

  // ==========================================
  // VITALITY METRIC SLIDER HANDLERS
  // ==========================================
  const handleHealthSlider = (key, value) => {
    let formattedValue = value;
    if (key === 'steps') {
      formattedValue = Math.round(value).toLocaleString();
    } else if (key === 'water') {
      formattedValue = parseFloat(value).toFixed(1) + 'L';
    } else if (key === 'sleep') {
      const hr = Math.floor(value);
      const min = Math.round((value - hr) * 60);
      formattedValue = min > 0 ? `${hr}h ${min}m` : `${hr}h`;
    } else if (key === 'exercise') {
      formattedValue = Math.round(value) + 'm';
    }

    const updated = { ...todayState, [key]: formattedValue };
    setTodayState(updated);
    saveTodayStateAPI(updated);
  };

  const getHealthRaw = (key, val) => {
    if (!val) return 0;
    if (key === 'sleep' && val.includes('h')) {
      const parts = val.split('h');
      const h = parseFloat(parts[0]) || 0;
      const m = parts[1] ? (parseFloat(parts[1]) || 0) : 0;
      return h + (m / 60);
    }
    return parseFloat(val.toString().replace(/[^\d.]/g, '')) || 0;
  };

  // ==========================================
  // SOCIAL TIME LIMIT SLIDER HANDLERS
  // ==========================================
  const handleSocialSlider = (appKey, minutes) => {
    const updated = { ...socialData, [appKey]: parseInt(minutes) || 0 };
    setSocialData(updated);
    saveSocialAPI(appKey, parseInt(minutes) || 0);
  };

  const getSocialTimeFormatted = (val) => {
    const hr = Math.floor(val / 60);
    const min = val % 60;
    return hr > 0 ? `${hr}h ${min}m` : `${min}m`;
  };

  const totalSocialTime = (socialData['ig-slider'] || 0) + (socialData['sl-slider'] || 0) + (socialData['bk-slider'] || 0);

  // ==========================================
  // TASK FOCUS TODAY HANDLERS
  // ==========================================
  const handleToggleTask = async (id, currentVal) => {
    const updatedVal = !currentVal;
    setTasks(tasks.map(t => t.id === id ? { ...t, done: updatedVal } : t));
    await authFetch(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ done: updatedVal })
    });
  };

  const todayPriorities = tasks
    .filter(t => t.due === effectiveDateStr && t.cat !== 'habit')
    .slice(0, 3); // Get Top 3 priorities

  // ==========================================
  // UPCOMING EVENTS (TIMELINE)
  // ==========================================
  // We fetch events scheduled for today
  const [todayEvents, setTodayEvents] = useState([]);
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await authFetch('/api/events');
        const data = await res.json();
        const filtered = (data || []).filter(e => e.date === effectiveDateStr);
        setTodayEvents(filtered);
      } catch (err) {
        console.error("Error loading events:", err);
      }
    };
    fetchEvents();
  }, [effectiveDateStr]);

  // Segment accent colors matching the Life Ring
  const segmentAccents = {
    mind:          '#7C9A92',
    health:        '#9B7E6B',
    learning:      '#7B8FA8',
    work:          '#8B8B6B',
    relationships: '#A87B8F',
    finance:       '#6B8B7B',
  };

  // Dimension details helper
  const dimensionsMap = {
    mind: {
      title: 'Mind Sanctuary',
      icon: 'spa',
      desc: 'Cultivate mental clarity and inner stillness. Your mind is the lens through which you experience everything.',
      questions: (
        <div className="flex flex-col gap-4">
          <div className="dimension-card">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[14px]" style={{ color: segmentAccents.mind }}>self_improvement</span>
              <span className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider">Mindfulness Practice</span>
            </div>
            <div className="flex items-baseline gap-3">
              <input 
                type="text" 
                value={todayState.mindfulness || '0 min'} 
                onChange={(e) => {
                  const updated = { ...todayState, mindfulness: e.target.value };
                  setTodayState(updated);
                  saveTodayStateAPI(updated);
                }}
                className="bg-transparent border-b border-outline/50 text-2xl font-newsreader text-on-surface w-20 p-0 focus:ring-0 focus:border-secondary text-center" 
              />
              <span className="text-[10px] text-on-surface-variant tracking-wider">of</span>
              <input 
                type="text" 
                value={todayState.mindGoal || '150 min'} 
                onChange={(e) => {
                  const updated = { ...todayState, mindGoal: e.target.value };
                  setTodayState(updated);
                  saveTodayStateAPI(updated);
                }}
                className="bg-transparent border-b border-outline/50 text-2xl font-newsreader text-on-surface w-24 p-0 focus:ring-0 focus:border-secondary text-center" 
              />
            </div>
          </div>
        </div>
      )
    },
    health: {
      title: 'Physical Vitality',
      icon: 'favorite',
      desc: 'Honor your body through rest, movement, and nourishment. The vessel that carries you deserves attention.',
      questions: (
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'steps', label: 'Steps', icon: 'directions_walk', max: 10000, step: 100, format: (v) => Math.round(v).toLocaleString() },
            { key: 'water', label: 'Water', icon: 'water_drop', max: 3.0, step: 0.1, format: (v) => parseFloat(v).toFixed(1) + 'L' },
            { key: 'sleep', label: 'Sleep', icon: 'bedtime', max: 12, step: 0.25, format: (v) => { const hr = Math.floor(v); const min = Math.round((v - hr) * 60); return min > 0 ? `${hr}h ${min}m` : `${hr}h`; } },
            { key: 'exercise', label: 'Exercise', icon: 'fitness_center', max: 120, step: 5, format: (v) => Math.round(v) + 'm' },
          ].map(metric => (
            <div key={metric.key} className="dimension-card flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px]" style={{ color: segmentAccents.health }}>{metric.icon}</span>
                <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">{metric.label}</span>
              </div>
              <span className="text-xl font-newsreader text-on-surface">{todayState[metric.key] || (metric.key === 'water' ? '0L' : metric.key === 'sleep' ? '0h' : metric.key === 'exercise' ? '0m' : '0')}</span>
              <ElasticSlider
                defaultValue={getHealthRaw(metric.key, todayState[metric.key])}
                startingValue={0}
                maxValue={metric.max}
                stepSize={metric.step}
                isStepped={true}
                rangeColorClass="bg-secondary"
                onChange={(val) => handleHealthSlider(metric.key, val)}
                className="w-full"
              />
            </div>
          ))}
        </div>
      )
    },
    learning: {
      title: 'Lifelong Learning',
      icon: 'school',
      desc: 'Feed your curiosity and grow through books, practice, and new perspectives. Learning is the art of staying alive.',
      questions: (
        <div className="flex flex-col gap-3">
          <div className="dimension-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px]" style={{ color: segmentAccents.learning }}>auto_stories</span>
                <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">Reading Time</span>
              </div>
              <span className="text-xs text-on-surface font-newsreader">{getSocialTimeFormatted(socialData['bk-slider'] || 0)}</span>
            </div>
            <ElasticSlider
              defaultValue={socialData['bk-slider'] || 0}
              startingValue={0}
              maxValue={120}
              stepSize={5}
              isStepped={true}
              rangeColorClass="bg-secondary"
              onChange={(val) => handleSocialSlider('bk-slider', val)}
              className="w-full"
            />
          </div>
          <div className="dimension-card flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]" style={{ color: segmentAccents.learning }}>routine</span>
              <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">Daily Rhythms</span>
            </div>
            <div className="flex flex-col gap-2">
              {hobbies.length > 0 ? (
                hobbies.map(hobby => {
                  const isDone = tasks.some(t => t.cat === 'habit' && t.name === hobby.name && t.date === effectiveDateStr && t.done);
                  const streak = getRhythmStreak(hobby.name);
                  return (
                    <div 
                      key={hobby.id} 
                      className="flex items-center gap-3 cursor-pointer group py-0.5"
                      onClick={() => toggleRhythm(hobby.name)}
                    >
                      <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${
                        isDone ? 'bg-secondary/15 border-secondary text-secondary' : 'border-outline group-hover:border-secondary/50'
                      }`} style={{ width: 18, height: 18 }}>
                        {isDone && <span className="material-symbols-outlined text-[11px] font-bold">check</span>}
                      </div>
                      <span className={`text-xs ${isDone ? 'text-on-surface-variant line-through opacity-60' : 'text-on-surface'}`}>
                        {hobby.name}
                      </span>
                      {streak > 0 && (
                        <span className="text-[9px] font-semibold flex items-center gap-0.5 ml-auto" style={{ color: segmentAccents.learning }}>
                          <span className="material-symbols-outlined text-[10px]">local_fire_department</span>
                          {streak}d
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-on-surface-variant italic text-xs py-2">
                  No active rhythms yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    work: {
      title: 'Intentional Work',
      icon: 'work',
      desc: 'Deep focus without burnout. Align your energy with your most important work today.',
      questions: (
        <div className="flex flex-col gap-3">
          <div className="dimension-card flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]" style={{ color: segmentAccents.work }}>target</span>
              <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">Focus Priorities</span>
            </div>
            <span className="text-lg font-newsreader text-on-surface">
              {todayPriorities.length > 0 
                ? `${todayPriorities.filter(t => t.done).length} of ${todayPriorities.length} complete` 
                : 'No priorities set'}
            </span>
          </div>
        </div>
      )
    },
    relationships: {
      title: 'Deep Relationships',
      icon: 'group',
      desc: 'Meaningful connections sustain us. Tend to friendships, family, and social boundaries.',
      questions: (
        <div className="flex flex-col gap-3">
          <div className="dimension-card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px]" style={{ color: segmentAccents.relationships }}>phone_android</span>
                <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">Screen Boundaries</span>
              </div>
              <span className="text-[10px] text-on-surface-variant">{getSocialTimeFormatted(totalSocialTime)} total</span>
            </div>
            
            {[
              { key: 'ig-slider', label: 'Instagram', max: 120 },
              { key: 'sl-slider', label: 'Slack', max: 180 },
            ].map(app => (
              <div key={app.key} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-on-surface">
                  <span>{app.label}</span>
                  <span className="font-newsreader">{getSocialTimeFormatted(socialData[app.key] || 0)}</span>
                </div>
                <ElasticSlider
                  defaultValue={socialData[app.key] || 0}
                  startingValue={0}
                  maxValue={app.max}
                  stepSize={5}
                  isStepped={true}
                  rangeColorClass="bg-secondary"
                  onChange={(val) => handleSocialSlider(app.key, val)}
                />
              </div>
            ))}
          </div>
        </div>
      )
    },
    finance: {
      title: 'Financial Alignment',
      icon: 'payments',
      desc: 'Mindful spending is a form of self-respect. Track and reflect on your relationship with money.',
      questions: (
        <div className="flex flex-col gap-3">
          <div className="dimension-card flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]" style={{ color: segmentAccents.finance }}>account_balance</span>
              <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">Spend Check-In</span>
            </div>
            <span className="text-xs text-on-surface-variant leading-relaxed italic">
              Did you align with your budget and values today?
            </span>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="page active animate-fade-in w-full max-w-6xl mx-auto flex flex-col gap-10 pb-20 select-none">
      
      {/* SECTION 1: HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline pb-6">
        <div className="flex flex-col gap-1">
          <span className="font-sans text-[10px] text-secondary font-semibold tracking-widest uppercase mb-1">
            {dateStr}
          </span>
          <h1 className="font-h1 text-4xl text-on-surface font-semibold">{greetingTitle}</h1>
          <p className="font-sans text-xs text-on-surface-variant italic mt-1">
            {greetingQuote}
          </p>
        </div>
      </header>

      {/* SECTION 2: DAILY CHECK-IN */}
      <section className="bg-surface border border-outline rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <span className="font-sans text-[10px] text-secondary font-semibold tracking-widest uppercase">
            Daily Check-In
          </span>
          <h2 className="font-newsreader text-2xl text-on-surface">How is your state right now?</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Mood Picker */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            <span className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider select-none">
              Spirit & Mood
            </span>
            <div className="flex flex-wrap gap-2.5">
              {[
                { name: 'Flowing', icon: 'water_drop', colorTheme: { selected: 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400', hover: 'hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/5' } },
                { name: 'Light', icon: 'air', colorTheme: { selected: 'bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400', hover: 'hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-500/5' } },
                { name: 'Heavy', icon: 'cloud', colorTheme: { selected: 'bg-stone-500/10 border-stone-500 text-stone-600 dark:text-stone-400', hover: 'hover:border-stone-400 hover:text-stone-600 dark:hover:text-stone-400 hover:bg-stone-500/5' } },
                { name: 'Restless', icon: 'local_fire_department', colorTheme: { selected: 'bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-400', hover: 'hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/5' } },
                { name: 'Centered', icon: 'spa', colorTheme: { selected: 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400', hover: 'hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/5' } }
              ].map(moodItem => {
                const isSelected = todayState.mood === moodItem.name;
                return (
                  <button 
                    key={moodItem.name}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs tracking-wider transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-95 ${
                      isSelected 
                        ? `${moodItem.colorTheme.selected} font-medium shadow-sm` 
                        : `bg-transparent border-outline text-on-surface-variant ${moodItem.colorTheme.hover}`
                    }`}
                    onClick={() => handleMoodSelect(moodItem.name)}
                  >
                    <span className="material-symbols-outlined text-sm">{moodItem.icon}</span>
                    {moodItem.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Star Rating */}
          <div className="lg:col-span-6 flex flex-col gap-2">
            <span className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider select-none">
              Rate your general alignment
            </span>
            <div className="flex items-center gap-1.5" onMouseLeave={() => setHoveredRating(0)}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => {
                const isFilled = star <= (hoveredRating || todayState.rating || 0);
                return (
                  <span 
                    key={star}
                    className={`material-symbols-outlined text-2xl cursor-pointer transition-all duration-150 select-none ${
                      isFilled ? 'text-secondary scale-110' : 'text-on-surface-variant/50 hover:scale-125'
                    }`}
                    style={{ fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0" }}
                    onClick={() => handleRatingSelect(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                  >
                    star
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Check-In Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-t border-outline/50 pt-6">
          {/* Energy */}
          <div className="flex flex-col gap-1">
            <span className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider">Energy: {parseFloat(todayState.energy || 5).toFixed(1)}</span>
            <ElasticSlider
              defaultValue={parseFloat(todayState.energy || 5)}
              startingValue={1}
              maxValue={10}
              stepSize={0.5}
              isStepped={true}
              rangeColorClass="bg-secondary"
              onChange={(val) => handleStateSliderChange('energy', val)}
            />
          </div>

          {/* Focus */}
          <div className="flex flex-col gap-1">
            <span className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider">Focus: {parseFloat(todayState.focus || 5).toFixed(1)}</span>
            <ElasticSlider
              defaultValue={parseFloat(todayState.focus || 5)}
              startingValue={1}
              maxValue={10}
              stepSize={0.5}
              isStepped={true}
              rangeColorClass="bg-secondary"
              onChange={(val) => handleStateSliderChange('focus', val)}
            />
          </div>

          {/* Stress */}
          <div className="flex flex-col gap-1">
            <span className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider">Stress: {parseInt(todayState.stress || 0)}</span>
            <ElasticSlider
              defaultValue={parseInt(todayState.stress || 0)}
              startingValue={0}
              maxValue={10}
              stepSize={1}
              isStepped={true}
              rangeColorClass="bg-secondary"
              onChange={(val) => handleStateSliderChange('stress', val)}
            />
          </div>

          {/* Sleep Quality */}
          <div className="flex flex-col gap-1">
            <span className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider">Sleep Quality: {extData.sleepQuality}/10</span>
            <ElasticSlider
              defaultValue={extData.sleepQuality}
              startingValue={1}
              maxValue={10}
              stepSize={1}
              isStepped={true}
              rangeColorClass="bg-secondary"
              onChange={(val) => saveExtendedData({ sleepQuality: Math.round(val) })}
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: LIFE RING & DIMENSIONS DETAIL */}
      <section className="life-ring-section">
        
        {/* Left column: SVG Ring — compact, breathing room */}
        <div className="life-ring-column">
          <LifeRing 
            ratings={{
              mind: extData.mind,
              health: extData.health,
              learning: extData.learning,
              work: extData.work,
              relationships: extData.relationships,
              finance: extData.finance
            }} 
            activeSegment={activeSegment}
            onSelectSegment={(seg) => setActiveSegment(seg)}
          />
        </div>

        {/* Right column: Premium Detail Panel */}
        <div className="dimension-detail-panel">
          {/* Segment Title + Description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span 
                className="material-symbols-outlined text-[18px]"
                style={{ color: segmentAccents[activeSegment] }}
              >
                {dimensionsMap[activeSegment]?.icon}
              </span>
              <span 
                className="font-sans text-[9px] tracking-[0.15em] uppercase font-semibold"
                style={{ color: segmentAccents[activeSegment] }}
              >
                {activeSegment}
              </span>
            </div>
            <h2 className="font-newsreader text-2xl text-on-surface leading-tight">
              {dimensionsMap[activeSegment]?.title}
            </h2>
            <p className="font-sans text-[11px] text-on-surface-variant leading-relaxed">
              {dimensionsMap[activeSegment]?.desc}
            </p>
          </div>

          {/* Inline Dimension Rating — minimal, not a progress bar */}
          <div className="dimension-rating-inline">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">Dimension Rating</span>
              <span 
                className="font-newsreader text-lg font-semibold"
                style={{ color: segmentAccents[activeSegment] }}
              >
                {extData[activeSegment]}<span className="text-on-surface-variant text-xs font-sans font-normal"> /10</span>
              </span>
            </div>
            <ElasticSlider
              defaultValue={extData[activeSegment]}
              startingValue={1}
              maxValue={10}
              stepSize={1}
              isStepped={true}
              rangeColorClass="bg-secondary"
              onChange={(val) => saveExtendedData({ [activeSegment]: Math.round(val) })}
            />
          </div>

          {/* Segment-specific content */}
          <div className="dimension-content-area">
            {dimensionsMap[activeSegment]?.questions}
          </div>
        </div>
      </section>

      {/* SECTION 4 & 5: FOCUS TODAY & TIMELINE EVENTS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Focus Today (Top 3 priorities) */}
        <div className="bg-surface border border-outline rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-sm">
          <div className="flex flex-col gap-1 mb-6">
            <span className="font-sans text-[10px] text-secondary font-semibold tracking-widest uppercase">
              Focus Today
            </span>
            <h2 className="font-newsreader text-2xl text-on-surface">Main Priorities</h2>
          </div>

          <div className="flex flex-col gap-3 flex-grow">
            {todayPriorities.length > 0 ? (
              todayPriorities.map((item) => (
                <div 
                  key={item.id}
                  className="p-4 border border-outline bg-surface-container-low/20 rounded-xl flex items-center gap-4 hover:bg-surface-container-high/20 transition-all duration-300"
                >
                  <input 
                    type="checkbox"
                    checked={item.done}
                    onChange={() => handleToggleTask(item.id, item.done)}
                    className="w-5 h-5 rounded border-outline bg-transparent text-secondary focus:ring-secondary focus:ring-offset-0 transition-all cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-grow">
                    <div className={`text-sm font-semibold transition-all ${
                      item.done ? 'text-on-surface-variant line-through opacity-70' : 'text-on-surface'
                    }`}>
                      {item.name}
                    </div>
                    {item.notes && (
                      <div className="text-xs text-on-surface-variant italic mt-1">{item.notes}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-on-surface-variant text-sm py-10 italic select-none">
                Nothing planned today. Consider planning something meaningful.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events (Timeline) */}
        <div className="bg-surface border border-outline rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-sm">
          <div className="flex flex-col gap-1 mb-6">
            <span className="font-sans text-[10px] text-secondary font-semibold tracking-widest uppercase">
              Upcoming Events
            </span>
            <h2 className="font-newsreader text-2xl text-on-surface">Today's Timeline</h2>
          </div>

          <div className="flex flex-col gap-3 flex-grow justify-center">
            {todayEvents.length > 0 ? (
              todayEvents.map((item) => (
                <div 
                  key={item.id}
                  className="p-4 border border-outline bg-surface-container-low/20 rounded-xl flex items-center gap-4 hover:bg-surface-container-high/20 transition-all duration-300"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center text-secondary select-none flex-shrink-0">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                  </div>
                  <div className="flex-grow">
                    <div className="text-sm font-semibold text-on-surface">{item.name}</div>
                    <div className="text-xs text-on-surface-variant mt-1 select-none">
                      {item.time || 'No time set'}
                    </div>
                    {item.notes && (
                      <div className="text-xs text-on-surface-variant italic mt-1">{item.notes}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-on-surface-variant text-sm py-10 italic select-none">
                Nothing scheduled. Enjoy the space to reflect.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 6: DAILY REFLECTION */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface border border-outline rounded-2xl p-6 md:p-8 flex flex-col gap-4 shadow-sm">
          <label className="font-sans text-[10px] text-secondary font-semibold tracking-widest uppercase select-none">
            Gratitude Card
          </label>
          <h2 className="font-newsreader text-2xl text-on-surface leading-tight mb-2">What made today meaningful?</h2>
          <textarea 
            value={todayState.gratitude || ''} 
            onChange={(e) => {
              const updated = { ...todayState, gratitude: e.target.value };
              setTodayState(updated);
              saveTodayStateAPI(updated);
            }}
            placeholder="Write one thing you feel thankful for today..." 
            className="w-full bg-surface-container-high/30 border border-outline rounded-xl p-4 text-on-surface focus:border-secondary h-32 resize-none text-sm leading-relaxed"
          />
        </div>

        <div className="bg-surface border border-outline rounded-2xl p-6 md:p-8 flex flex-col gap-4 shadow-sm justify-between">
          <div className="flex flex-col gap-2">
            <label className="font-sans text-[10px] text-secondary font-semibold tracking-widest uppercase select-none">
              Daily Realization
            </label>
            <h2 className="font-newsreader text-2xl text-on-surface leading-tight mb-2">One Word to describe today</h2>
            <input 
              type="text"
              value={todayState.oneWord || ''} 
              onChange={(e) => {
                const updated = { ...todayState, oneWord: e.target.value };
                setTodayState(updated);
                saveTodayStateAPI(updated);
              }}
              placeholder="Stillness, alignment, focus..." 
              className="w-full bg-surface-container-high/30 border border-outline rounded-xl p-4 text-on-surface focus:border-secondary text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-sans text-[10px] text-secondary font-semibold tracking-widest uppercase select-none">
              Daily Reflection
            </label>
            <textarea 
              value={todayState.remark || ''} 
              onChange={(e) => {
                const updated = { ...todayState, remark: e.target.value };
                setTodayState(updated);
                saveTodayStateAPI(updated);
              }}
              placeholder="Capture a passing thought, event reflection, or a quiet realization..." 
              className="w-full bg-surface-container-high/30 border border-outline rounded-xl p-4 text-on-surface focus:border-secondary h-24 resize-none text-sm leading-relaxed"
            />
          </div>
        </div>
      </section>

      {/* SECTION 7: WEEKLY REFLECTION */}
      <section className="bg-surface border border-outline rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <span className="font-sans text-[10px] text-secondary font-semibold tracking-widest uppercase">
            Weekly Alignment
          </span>
          <h2 className="font-newsreader text-2xl text-on-surface">Weekly Reflection</h2>
          <p className="font-sans text-xs text-on-surface-variant italic">
            Reflect weekly to review your life dimensions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Well */}
          <div className="flex flex-col gap-2">
            <label className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider">What went well this week?</label>
            <textarea
              value={extData.weeklyWell || ''}
              onChange={(e) => saveExtendedData({ weeklyWell: e.target.value })}
              placeholder="Celebrate small alignments, connections, or learning moments..."
              className="w-full bg-surface-container-high/30 border border-outline rounded-xl p-3 text-on-surface focus:border-secondary h-28 resize-none text-xs leading-relaxed"
            />
          </div>

          {/* Attention */}
          <div className="flex flex-col gap-2">
            <label className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider">What deserves more attention?</label>
            <textarea
              value={extData.weeklyAttention || ''}
              onChange={(e) => saveExtendedData({ weeklyAttention: e.target.value })}
              placeholder="Where did balance slip? How can you tend to it next week?"
              className="w-full bg-surface-container-high/30 border border-outline rounded-xl p-3 text-on-surface focus:border-secondary h-28 resize-none text-xs leading-relaxed"
            />
          </div>

          {/* Balance */}
          <div className="flex flex-col gap-2">
            <label className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider">Where did you feel most balanced?</label>
            <textarea
              value={extData.weeklyBalance || ''}
              onChange={(e) => saveExtendedData({ weeklyBalance: e.target.value })}
              placeholder="Recognize the areas of life that flowed effortlessly..."
              className="w-full bg-surface-container-high/30 border border-outline rounded-xl p-3 text-on-surface focus:border-secondary h-28 resize-none text-xs leading-relaxed"
            />
          </div>
        </div>
      </section>

      {/* Global Effortless Save Button */}
      <div className="flex justify-end pt-4 select-none">
        <button 
          onClick={handleSaveTodayEntry}
          className="bg-secondary text-white px-8 py-3.5 rounded-xl font-sans text-xs uppercase tracking-widest hover:bg-secondary/90 transition-all shadow-sm cursor-pointer"
        >
          Save Today's Sanctuary Entry
        </button>
      </div>

    </div>
  );
}
