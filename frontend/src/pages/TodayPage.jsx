import React, { useState } from 'react';
import ElasticSlider from '../components/ElasticSlider';

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
  saveSocialAPI
}) {
  const [newHobbyName, setNewHobbyName] = useState('');

  // ==========================================
  // MOOD & RATING HANDLERS
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
    toast(`Day rated ${rating}/10`);
  };

  const getRatingLabel = (n) => {
    const labels = [
      '', 'Terrible', 'Bad', 'Poor', 'Meh', 'Okay', 'Good', 'Great', 'Excellent', 'Amazing', 'Perfect 🌿'
    ];
    return n > 0 ? `${n}/10 — ${labels[n]}` : 'Pick a star to rate';
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
      const response = await fetch('/api/hobbies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      await fetch(`/api/hobbies/${hobbyId}`, { method: 'DELETE' });
      setHobbies(hobbies.filter(h => h.id !== hobbyId));
      
      // Also clean up tracking tasks for this rhythm
      const tasksToKeep = tasks.filter(t => !(t.cat === 'habit' && t.name === hobbyName));
      setTasks(tasksToKeep);
      
      await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
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
      // Toggle off: delete task
      const existing = tasks.find(t => t.cat === 'habit' && t.name === hobbyName && t.date === effectiveDateStr);
      if (existing) {
        setTasks(tasks.filter(t => t.id !== existing.id));
        await fetch(`/api/tasks/${existing.id}`, { method: 'DELETE' });
      }
    } else {
      // Toggle on: create completed task
      const newTask = {
        name: hobbyName,
        cat: 'habit',
        priority: 'low',
        notes: '',
        due: effectiveDateStr,
        done: true,
        date: effectiveDateStr
      };
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      const data = await response.json();
      setTasks([...tasks, data]);
    }
  };

  // Streak calculations
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

  // Streak calculations for Consistency Card
  const getOverallStreak = () => {
    // Count consecutive days with entries OR todayState completed
    // Simply look at task history and todayState ratings
    return 3; // Placeholder for now, or calculated from entries
  };

  // ==========================================
  // DIGITAL SPACE SOCIAL TIME HANDLERS
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
  const totalSocialHours = (totalSocialTime / 60).toFixed(1);

  // SVG Screen Ring offset
  const screenGoal = 6 * 60; // 6 hours
  const strokeOffset = 264 - Math.min(1, totalSocialTime / screenGoal) * 264;

  const SOCIAL_APPS = { 
    'ig-slider': { name: 'Instagram', color: '#e1306c', icon: 'photo_camera', key: 'ig-slider', max: 120 }, 
    'sl-slider': { name: 'Slack', color: '#4a154b', icon: 'forum', key: 'sl-slider', max: 180 }, 
    'bk-slider': { name: 'Books', color: '#fbc02d', icon: 'menu_book', key: 'bk-slider', max: 120 } 
  };

  // Handle elastic updates
  const handleElasticChange = (key, val) => {
    const updated = { ...todayState, [key]: val };
    setTodayState(updated);
    saveTodayStateAPI(updated);
  };

  const [greeting, setGreeting] = useState(() => {
    const hr = new Date().getHours();
    return hr < 12 ? 'Good morning ✦' : hr < 17 ? 'Good afternoon ✦' : 'Good evening ✦';
  });

  return (
    <div className="page active animate-fade-in">
      <header className="max-w-4xl pt-8 md:pt-12">
        <span className="font-label-caps text-secondary mb-4 block tracking-widest uppercase select-none">
          {dateStr}
        </span>
        <h1 className="font-h1 text-h1 text-on-surface mb-6 select-none">{greeting}</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl select-none">
          How is your day unfolding? Take a breath before you begin.
        </p>
      </header>

      {/* Reflection & Rhythms */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mt-section-gap">
        <div className="lg:col-span-8 bg-white/[0.05] backdrop-blur-[20px] border border-outline-variant/30 rounded-xl p-8 md:p-12 flex flex-col justify-between min-h-[360px] group transition-all duration-500 relative overflow-hidden bento-card">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-secondary/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>
          <div className="relative z-10">
            <span className="font-label-caps text-label-caps text-secondary mb-8 block tracking-widest uppercase select-none">Current State</span>
            <h2 className="font-h2 text-h2 text-on-surface max-w-xl leading-snug mb-6 select-none">How does your spirit feel?</h2>
            
            <div className="mood-picker flex flex-wrap gap-4 mb-8">
              {[
                { name: 'Flowing', icon: 'water_drop' },
                { name: 'Light', icon: 'air' },
                { name: 'Heavy', icon: 'cloud' },
                { name: 'Restless', icon: 'local_fire_department' },
                { name: 'Centered', icon: 'spa' }
              ].map(moodItem => {
                const isSelected = todayState.mood === moodItem.name;
                return (
                  <button 
                    key={moodItem.name}
                    className={`mood-btn flex flex-col items-center gap-4 p-5 rounded-xl border border-transparent hover:bg-white/5 hover:border-outline-variant/30 transition-all group/mood w-28 cursor-pointer ${
                      isSelected ? 'selected border-secondary/30 bg-white/5' : ''
                    }`}
                    onClick={() => handleMoodSelect(moodItem.name)}
                  >
                    <span 
                      className={`material-symbols-outlined text-4xl text-on-surface-variant group-hover/mood:text-secondary transition-colors ${
                        isSelected ? 'text-secondary' : ''
                      }`}
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
                    >
                      {moodItem.icon}
                    </span>
                    <span className={`font-label-caps text-[11px] tracking-widest text-on-surface-variant group-hover/mood:text-on-surface uppercase ${
                      isSelected ? 'text-on-surface' : ''
                    }`}>
                      {moodItem.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider mb-2 block select-none">Rate your day</span>
                <div className="rating-stars flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => {
                    const isFilled = star <= (todayState.rating || 0);
                    return (
                      <span 
                        key={star}
                        className={`star ${isFilled ? 'filled' : ''}`}
                        onClick={() => handleRatingSelect(star)}
                      >
                        ★
                      </span>
                    );
                  })}
                </div>
                <div className="text-[10px] text-on-surface-variant mt-1 select-none">
                  {getRatingLabel(todayState.rating || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rhythms */}
        <div className="lg:col-span-4 bg-white/[0.05] backdrop-blur-[20px] border border-outline-variant/30 rounded-xl p-8 flex flex-col relative overflow-hidden group bento-card">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-secondary/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col h-full">
            <span className="font-label-caps text-label-caps text-secondary mb-8 block tracking-widest uppercase select-none">Rhythms</span>
            <div className="flex flex-col gap-4 flex-grow justify-start">
              {hobbies.length > 0 ? (
                hobbies.map(hobby => {
                  const isDone = tasks.some(t => t.cat === 'habit' && t.name === hobby.name && t.date === effectiveDateStr && t.done);
                  const streak = getRhythmStreak(hobby.name);

                  return (
                    <div 
                      key={hobby.id} 
                      className="flex items-center gap-4 group cursor-pointer"
                      onClick={() => toggleRhythm(hobby.name)}
                    >
                      <div className={`w-8 h-8 flex-shrink-0 rounded-full border border-secondary flex items-center justify-center transition-all ${
                        isDone ? 'bg-secondary/10 shadow-[0_0_12px_rgba(230,193,131,0.2)]' : 'group-hover:bg-secondary/5'
                      }`}>
                        {isDone ? (
                          <span className="material-symbols-outlined text-[16px] text-secondary">check</span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-secondary/50"></span>
                        )}
                      </div>
                      <span className={`font-body-md text-body-md transition-all ${
                        isDone ? 'text-on-surface-variant line-through opacity-70' : 'text-on-surface group-hover:text-secondary'
                      }`}>
                        {hobby.name}
                      </span>
                      {streak > 0 && (
                        <span className="text-[10px] text-secondary/80 font-label-caps flex items-center gap-0.5 select-none">
                          <span className="material-symbols-outlined text-[12px]">local_fire_department</span>
                          {streak}d
                        </span>
                      )}
                      <button 
                        className="ml-auto opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-red-400 transition-all p-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHobby(hobby.id, hobby.name);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state text-center text-on-surface-variant italic text-sm mt-4 select-none">
                  <span className="material-symbols-outlined block text-3xl mb-2 opacity-50">eco</span>
                  No rhythms yet.
                </div>
              )}
            </div>
            
            <div className="mt-8 border-t border-white/10 pt-6">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider block mb-3 select-none">Add Rhythm</span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newHobbyName}
                  onChange={(e) => setNewHobbyName(e.target.value)}
                  placeholder="e.g. Morning Stillness" 
                  className="w-full bg-surface-container-high border border-outline-variant rounded-md text-sm p-2 text-on-surface focus:ring-secondary focus:border-secondary"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddHobby(); }}
                />
                <button 
                  className="bg-secondary/10 border border-secondary/30 text-secondary px-4 py-2 rounded-md font-label-caps uppercase text-xs hover:bg-secondary/20 transition-colors cursor-pointer"
                  onClick={handleAddHobby}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vitality & Consistency */}
      <section className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {/* Health Metrics (Vitality) */}
          <div className="bg-white/[0.03] backdrop-blur-[20px] border border-outline-variant/20 rounded-xl p-6 flex flex-col gap-6 bento-card">
            <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase select-none">Vitality</span>
            <div className="grid grid-cols-2 gap-4">
              {/* Steps */}
              <div className="bg-white/5 rounded-lg p-4 flex flex-col gap-2 border border-white/5">
                <div className="flex items-center gap-2 text-secondary select-none">
                  <span className="material-symbols-outlined text-[18px]">directions_walk</span>
                  <span className="font-label-caps text-[10px] uppercase tracking-wider">Steps</span>
                </div>
                <div className="text-xl font-h3 text-on-surface w-full p-0">
                  {todayState.steps || '0'}
                </div>
                <ElasticSlider
                  defaultValue={getHealthRaw('steps', todayState.steps)}
                  startingValue={0}
                  maxValue={10000}
                  stepSize={100}
                  isStepped={true}
                  rangeColorClass="bg-secondary"
                  onChange={(val) => handleHealthSlider('steps', val)}
                  className="w-full mt-2"
                />
              </div>

              {/* Water */}
              <div className="bg-white/5 rounded-lg p-4 flex flex-col gap-2 border border-white/5">
                <div className="flex items-center gap-2 text-blue-300 select-none">
                  <span className="material-symbols-outlined text-[18px]">water_drop</span>
                  <span className="font-label-caps text-[10px] uppercase tracking-wider">Water</span>
                </div>
                <div className="text-xl font-h3 text-on-surface w-full p-0">
                  {todayState.water || '0L'}
                </div>
                <ElasticSlider
                  defaultValue={getHealthRaw('water', todayState.water)}
                  startingValue={0}
                  maxValue={3}
                  stepSize={0.1}
                  isStepped={true}
                  rangeColorClass="bg-blue-300"
                  onChange={(val) => handleHealthSlider('water', val)}
                  className="w-full mt-2"
                />
              </div>

              {/* Sleep */}
              <div className="bg-white/5 rounded-lg p-4 flex flex-col gap-2 border border-white/5">
                <div className="flex items-center gap-2 text-purple-300 select-none">
                  <span className="material-symbols-outlined text-[18px]">bedtime</span>
                  <span className="font-label-caps text-[10px] uppercase tracking-wider">Sleep</span>
                </div>
                <div className="text-xl font-h3 text-on-surface w-full p-0">
                  {todayState.sleep || '0h'}
                </div>
                <ElasticSlider
                  defaultValue={getHealthRaw('sleep', todayState.sleep)}
                  startingValue={0}
                  maxValue={12}
                  stepSize={0.25}
                  isStepped={true}
                  rangeColorClass="bg-purple-300"
                  onChange={(val) => handleHealthSlider('sleep', val)}
                  className="w-full mt-2"
                />
              </div>

              {/* Exercise */}
              <div className="bg-white/5 rounded-lg p-4 flex flex-col gap-2 border border-white/5">
                <div className="flex items-center gap-2 text-green-300 select-none">
                  <span className="material-symbols-outlined text-[18px]">fitness_center</span>
                  <span className="font-label-caps text-[10px] uppercase tracking-wider">Exercise</span>
                </div>
                <div className="text-xl font-h3 text-on-surface w-full p-0">
                  {todayState.exercise || '0m'}
                </div>
                <ElasticSlider
                  defaultValue={getHealthRaw('exercise', todayState.exercise)}
                  startingValue={0}
                  maxValue={120}
                  stepSize={5}
                  isStepped={true}
                  rangeColorClass="bg-green-300"
                  onChange={(val) => handleHealthSlider('exercise', val)}
                  className="w-full mt-2"
                />
              </div>
            </div>
          </div>

          {/* Consistency */}
          <div className="bg-white/[0.03] backdrop-blur-[20px] border border-outline-variant/20 rounded-xl p-6 flex flex-col gap-6 justify-between flex-grow bento-card">
            <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase select-none">Consistency</span>
            <div className="flex items-center justify-center flex-col gap-2 flex-grow">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90 text-secondary/10" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2"></path>
                  <path 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    fill="none" 
                    stroke="#e6c183" 
                    strokeDasharray={`${Math.min(100, getOverallStreak() * 10)}, 100`} 
                    strokeDashoffset="0" 
                    strokeWidth="2"
                  ></path>
                </svg>
                <div className="flex flex-col items-center text-center select-none">
                  <span className="font-h2 text-3xl text-on-surface">{getOverallStreak()}</span>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">Day Streak</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider select-none">Mindfulness</span>
                <input 
                  type="text" 
                  value={todayState.mindfulness || '0 Minutes'} 
                  onChange={(e) => {
                    const updated = { ...todayState, mindfulness: e.target.value };
                    setTodayState(updated);
                    saveTodayStateAPI(updated);
                  }}
                  className="bg-transparent border-none text-xl font-h3 text-on-surface w-full p-0 focus:ring-0 focus:border-none" 
                />
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider select-none">Goal</span>
                <input 
                  type="text" 
                  value={todayState.mindGoal || '150 Minutes'} 
                  onChange={(e) => {
                    const updated = { ...todayState, mindGoal: e.target.value };
                    setTodayState(updated);
                    saveTodayStateAPI(updated);
                  }}
                  className="bg-transparent border-none text-xl font-h3 text-on-surface w-full p-0 focus:ring-0 focus:border-none text-right" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Digital Space & Consistency */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          {/* Digital Space */}
          <div className="bg-white/[0.03] backdrop-blur-[20px] border border-outline-variant/20 rounded-xl p-6 flex flex-col flex-shrink-0 bento-card">
            <div className="flex items-center justify-between mb-6 select-none">
              <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">Digital Space</span>
              <span className="text-xs text-on-surface-variant">{getSocialTimeFormatted(totalSocialTime)} Total</span>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-2" style={{ maxHeight: '250px' }}>
              {Object.values(SOCIAL_APPS).map((app) => {
                const currentMins = socialData[app.key] || 0;
                return (
                  <div key={app.key} className="flex items-center gap-4">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ 
                        backgroundColor: `${app.color}1a`, 
                        border: `1px solid ${app.color}33`,
                        color: app.color
                      }}
                    >
                      <span className="material-symbols-outlined text-[16px]">{app.icon}</span>
                    </div>
                    <div className="flex-grow flex flex-col">
                      <div className="flex justify-between items-center mb-1 select-none">
                        <span className="font-body-md text-sm text-on-surface">{app.name}</span>
                        <span className="font-label-caps text-[10px] text-on-surface-variant">
                          {getSocialTimeFormatted(currentMins)}
                        </span>
                      </div>
                      <ElasticSlider
                        defaultValue={currentMins}
                        startingValue={0}
                        maxValue={app.max}
                        stepSize={1}
                        isStepped={true}
                        rangeColorStyle={{ backgroundColor: `${app.color}cc` }}
                        onChange={(val) => handleSocialSlider(app.key, val)}
                        className="w-full mt-1.5"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Visual Ring for Digital Space */}
            <div className="flex items-center gap-6 border-t border-white/5 mt-6 pt-6 select-none">
              <div className="relative w-[70px] h-[70px] flex-shrink-0 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90 text-stone-850" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6"></circle>
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="42" 
                    fill="none" 
                    stroke="#e6c183" 
                    strokeWidth="6" 
                    strokeDasharray="264" 
                    strokeDashoffset={strokeOffset}
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                  ></circle>
                </svg>
                <span className="text-xs font-semibold text-stone-200">{totalSocialHours}h</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-stone-500 uppercase tracking-widest">Goal Limit</span>
                <span className="text-sm text-stone-300 font-newsreader italic">6.0 hrs / day</span>
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* Extra Inputs (Remarks, Gratitude, One Word) */}
      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="bg-white/[0.03] backdrop-blur-[20px] border border-outline-variant/20 rounded-xl p-6 flex flex-col gap-4 bento-card">
          <label className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase select-none">Daily Remark</label>
          <textarea 
            value={todayState.remark || ''} 
            onChange={(e) => {
              const updated = { ...todayState, remark: e.target.value };
              setTodayState(updated);
              saveTodayStateAPI(updated);
            }}
            placeholder="Capture a passing thought, event reflection, or a quiet realization..." 
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-on-surface focus:border-secondary h-28 resize-none text-sm leading-relaxed"
          />
        </div>

        <div className="bg-white/[0.03] backdrop-blur-[20px] border border-outline-variant/20 rounded-xl p-6 flex flex-col gap-4 bento-card">
          <label className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase select-none">Gratitude</label>
          <textarea 
            value={todayState.gratitude || ''} 
            onChange={(e) => {
              const updated = { ...todayState, gratitude: e.target.value };
              setTodayState(updated);
              saveTodayStateAPI(updated);
            }}
            placeholder="Write one thing you feel thankful for today..." 
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-on-surface focus:border-secondary h-28 resize-none text-sm leading-relaxed"
          />
        </div>

        <div className="bg-white/[0.03] backdrop-blur-[20px] border border-outline-variant/20 rounded-xl p-6 flex flex-col gap-4 bento-card">
          <label className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase select-none">One Word</label>
          <input 
            type="text"
            value={todayState.oneWord || ''} 
            onChange={(e) => {
              const updated = { ...todayState, oneWord: e.target.value };
              setTodayState(updated);
              saveTodayStateAPI(updated);
            }}
            placeholder="Today described in one word..." 
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-on-surface focus:border-secondary text-sm"
          />
        </div>
      </section>
    </div>
  );
}
