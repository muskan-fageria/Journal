import React, { useState, useEffect, useRef } from 'react';
import { authFetch } from '../utils/authFetch';

export default function DiaryPage({ entries: reflectionLogs, setEntries: setReflectionLogs, toast, effectiveDateStr, dateStr }) {
  const [activeTab, setActiveTab] = useState('diary'); // 'diary' (free writing) or 'reflections' (archive logs)
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [currentDiaryEntry, setCurrentDiaryEntry] = useState(null);
  const [diaryContent, setDiaryContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef(null);

  const [selectedReflection, setSelectedReflection] = useState(null);

  // Fetch diary entries on load
  useEffect(() => {
    fetchDiary();
  }, []);

  const fetchDiary = async () => {
    try {
      const res = await authFetch('/api/diary');
      const data = await res.json();
      setDiaryEntries(data);
      if (data.length > 0) {
        setCurrentDiaryEntry(data[0]);
        setDiaryContent(data[0].content || '');
      } else {
        handleNewDiaryEntry();
      }
    } catch (err) {
      console.error("Error fetching diary:", err);
      toast("Failed to load writing room.");
    }
  };

  // Automatically select the first reflection log if tab is switched
  useEffect(() => {
    if (activeTab === 'reflections' && reflectionLogs.length > 0 && !selectedReflection) {
      setSelectedReflection(reflectionLogs[0]);
    }
  }, [activeTab, reflectionLogs, selectedReflection]);

  const handleNewDiaryEntry = () => {
    const draft = {
      title: '',
      date: dateStr,
      content: '',
      isNew: true
    };
    setCurrentDiaryEntry(draft);
    setDiaryContent('');
  };

  const handleSelectDiaryEntry = (entry) => {
    setCurrentDiaryEntry(entry);
    setDiaryContent(entry.content || '');
  };

  const handleSaveDiary = async () => {
    if (!currentDiaryEntry) return;
    setIsSaving(true);
    try {
      const payload = {
        title: currentDiaryEntry.title || currentDiaryEntry.date,
        date: currentDiaryEntry.date,
        content: diaryContent
      };

      let res;
      if (currentDiaryEntry.isNew) {
        res = await authFetch('/api/diary', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } else {
        res = await authFetch(`/api/diary/${currentDiaryEntry.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      }

      const savedEntry = await res.json();
      
      if (currentDiaryEntry.isNew) {
        setDiaryEntries([savedEntry, ...diaryEntries]);
        setCurrentDiaryEntry(savedEntry);
      } else {
        setDiaryEntries(diaryEntries.map(e => e.id === savedEntry.id ? savedEntry : e));
      }
      
      toast("Diary saved beautifully. ✨");
    } catch (err) {
      console.error(err);
      toast("Failed to save diary.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDiaryEntry = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this diary entry?')) return;
    try {
      await authFetch(`/api/diary/${id}`, { method: 'DELETE' });
      const filtered = diaryEntries.filter(entry => entry.id !== id);
      setDiaryEntries(filtered);
      if (currentDiaryEntry?.id === id) {
        if (filtered.length > 0) {
          setCurrentDiaryEntry(filtered[0]);
          setDiaryContent(filtered[0].content || '');
        } else {
          handleNewDiaryEntry();
        }
      }
      toast('Diary entry deleted');
    } catch (err) {
      console.error(err);
      toast('Failed to delete entry');
    }
  };

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [diaryContent]);

  // Parse dimension ratings and check-ins for the selected reflection
  const getParsedReflection = (refl) => {
    if (!refl) return null;
    const defaultData = {
      health: 5,
      work: 5,
      learning: 5,
      relationships: 5,
      finance: 5,
      mind: 5,
      sleepQuality: 5
    };
    
    // We parsed serialized ratings inside e.weather (which we map in backend server.js to e.weather)
    if (!refl.weather) return defaultData;
    try {
      const parsed = JSON.parse(refl.weather);
      return { ...defaultData, ...parsed };
    } catch (e) {
      // Check if refl.weather is standard weather string or ratings JSON
      return defaultData;
    }
  };

  const currentReflData = getParsedReflection(selectedReflection);

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl mx-auto min-h-[80vh] page active animate-fade-in select-none">
      
      {/* Sidebar for Navigation Tabs & Entry Lists */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-6">
        
        {/* Navigation Tabs Toggle */}
        <div className="flex bg-surface-container-high p-1 rounded-xl border border-outline">
          <button
            onClick={() => setActiveTab('diary')}
            className={`flex-1 py-2 rounded-lg font-sans text-[10px] tracking-wider uppercase font-semibold transition-all ${
              activeTab === 'diary' 
                ? 'bg-secondary text-white shadow-sm' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Writing Room
          </button>
          <button
            onClick={() => setActiveTab('reflections')}
            className={`flex-1 py-2 rounded-lg font-sans text-[10px] tracking-wider uppercase font-semibold transition-all ${
              activeTab === 'reflections' 
                ? 'bg-secondary text-white shadow-sm' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Reflections Log
          </button>
        </div>

        {/* Action Button for Writing Room */}
        {activeTab === 'diary' && (
          <button 
            onClick={handleNewDiaryEntry}
            className="flex items-center justify-center gap-2 bg-surface-container-high hover:bg-surface border border-outline text-on-surface py-3 rounded-xl font-sans text-xs tracking-widest uppercase transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            New Free Write
          </button>
        )}

        {/* Scrollable list of entries */}
        <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 max-h-[65vh]">
          {activeTab === 'diary' ? (
            diaryEntries.map(entry => (
              <div
                key={entry.id}
                onClick={() => handleSelectDiaryEntry(entry)}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 group relative ${
                  currentDiaryEntry?.id === entry.id 
                    ? 'bg-secondary/10 border-secondary/30 text-secondary' 
                    : 'bg-surface border-outline text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <div className="font-newsreader text-lg leading-snug font-semibold text-on-surface pr-6">
                  {entry.title || entry.date || 'Untitled'}
                </div>
                <div className="font-sans text-[10px] tracking-wide uppercase opacity-60">
                  {entry.date}
                </div>
                
                {/* Delete Entry Button */}
                <button
                  onClick={(e) => handleDeleteDiaryEntry(entry.id, e)}
                  className="absolute right-3 top-4 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))
          ) : (
            reflectionLogs.map(refl => {
              const parsed = getParsedReflection(refl);
              const ratings = [parsed.mind, parsed.health, parsed.learning, parsed.work, parsed.relationships, parsed.finance];
              const balance = ratings.reduce((a, b) => a + b, 0) / ratings.length;

              return (
                <button
                  key={refl.id}
                  onClick={() => setSelectedReflection(refl)}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                    selectedReflection?.id === refl.id 
                      ? 'bg-secondary/10 border-secondary/30 text-secondary' 
                      : 'bg-surface border-outline text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <div className="font-newsreader text-base font-semibold text-on-surface">
                    {refl.dateStr || refl.date}
                  </div>
                  <div className="flex justify-between items-center text-[10px] tracking-wider uppercase opacity-75 mt-1 select-none w-full">
                    <span>Mood: {refl.mood || 'None'}</span>
                    <span className="font-semibold text-secondary">Bal: {balance.toFixed(1)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Notebook or Summary View Area */}
      <div className="flex-1 bg-surface rounded-2xl border border-outline shadow-sm overflow-hidden flex flex-col min-h-[600px] transition-all">
        
        {/* VIEW 1: FREE WRITING ROOM */}
        {activeTab === 'diary' && currentDiaryEntry && (
          <>
            {/* Notebook Header */}
            <div className="flex flex-col gap-2 p-6 md:p-8 border-b border-outline bg-surface-container-low/20">
              <div className="flex items-center justify-between gap-4">
                <input 
                  type="text"
                  value={currentDiaryEntry.title || ''}
                  onChange={(e) => setCurrentDiaryEntry({ ...currentDiaryEntry, title: e.target.value })}
                  className="bg-transparent border-none outline-none font-newsreader text-3xl text-on-surface w-full placeholder:text-on-surface-variant/40"
                  placeholder="Give this entry a title..."
                />
                <button 
                  onClick={handleSaveDiary}
                  disabled={isSaving}
                  className="shrink-0 flex items-center gap-2 bg-secondary text-white px-6 py-2.5 rounded-xl font-sans text-xs tracking-widest uppercase hover:bg-secondary/90 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'SAVING...' : 'SAVE'}
                  <span className="material-symbols-outlined text-sm">bookmark</span>
                </button>
              </div>
              <div className="font-sans text-[10px] tracking-widest uppercase text-on-surface-variant mt-2">
                {currentDiaryEntry.date || new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            {/* Notebook Paper Body */}
            <div className="flex-1 p-8 md:p-12 relative">
              {/* Ruled Lines Background */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  backgroundImage: 'linear-gradient(transparent 95%, var(--olive) 100%)',
                  backgroundSize: '100% 2.5rem',
                  backgroundPositionY: '0.2rem'
                }}
              ></div>

              {/* Left margin line */}
              <div className="absolute top-0 bottom-0 left-10 md:left-14 w-[1px] bg-red-900/10 pointer-events-none"></div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={diaryContent}
                onChange={(e) => setDiaryContent(e.target.value)}
                className="w-full h-full min-h-[480px] bg-transparent border-none outline-none resize-none font-newsreader text-[18px] leading-[2.5rem] text-on-surface placeholder:text-on-surface-variant/30 pl-6 md:pl-10"
                style={{ paddingTop: '0.4rem' }}
                placeholder="Begin writing your thoughts..."
                spellCheck="false"
              ></textarea>
            </div>
          </>
        )}

        {/* VIEW 2: STRUCTURED DAILY REFLECTION SUMMARY */}
        {activeTab === 'reflections' && (
          selectedReflection ? (
            <div className="p-8 md:p-12 flex flex-col gap-8 overflow-y-auto max-h-[75vh] custom-scrollbar">
              
              {/* Summary Header */}
              <div className="border-b border-outline pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-sans text-[10px] text-secondary font-semibold tracking-widest uppercase">
                    Daily Reflection Log
                  </span>
                  <h2 className="font-newsreader text-3xl text-on-surface font-semibold">
                    {selectedReflection.dateStr || selectedReflection.date}
                  </h2>
                </div>
                
                {/* Balance Score */}
                <div className="bg-secondary/10 px-6 py-3 rounded-xl border border-secondary/30 flex flex-col items-center">
                  <span className="font-sans text-[8px] tracking-widest uppercase text-secondary font-semibold">Today's Balance</span>
                  <span className="font-newsreader text-3xl text-secondary font-bold mt-1">
                    {((currentReflData.mind + currentReflData.health + currentReflData.learning + currentReflData.work + currentReflData.relationships + currentReflData.finance) / 6).toFixed(1)}/10
                  </span>
                </div>
              </div>

              {/* Grid: Check-In Stats & Dimension Balances */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Stats Summary Column */}
                <div className="flex flex-col gap-6">
                  <h3 className="font-newsreader text-xl text-on-surface select-none">Daily Check-In</h3>
                  
                  <div className="bg-surface-container-high/30 p-5 rounded-2xl border border-outline flex flex-col gap-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-on-surface-variant">Mood / Spirit</span>
                      <span className="font-semibold text-on-surface bg-secondary/15 text-secondary px-3 py-1 rounded-full text-[10px] uppercase tracking-wide">
                        {selectedReflection.mood || 'Not recorded'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-outline/30 pt-3">
                      <span className="text-on-surface-variant">Overall Day Rating</span>
                      <span className="font-semibold text-on-surface">{selectedReflection.rating ? `${selectedReflection.rating}/10` : '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-outline/30 pt-3">
                      <span className="text-on-surface-variant">Energy state</span>
                      <span className="font-semibold text-on-surface">{selectedReflection.energy || '—'}/10</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-outline/30 pt-3">
                      <span className="text-on-surface-variant">Focus alignment</span>
                      <span className="font-semibold text-on-surface">{selectedReflection.focus || '—'}/10</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-outline/30 pt-3">
                      <span className="text-on-surface-variant">Stress factor</span>
                      <span className="font-semibold text-on-surface">{selectedReflection.stress || '0'}/10</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-outline/30 pt-3">
                      <span className="text-on-surface-variant">Sleep quality</span>
                      <span className="font-semibold text-on-surface">{currentReflData.sleepQuality}/10</span>
                    </div>
                  </div>
                </div>

                {/* Dimension Ratings Column */}
                <div className="flex flex-col gap-6">
                  <h3 className="font-newsreader text-xl text-on-surface select-none">Life Dimensions Balance</h3>
                  
                  <div className="bg-surface-container-high/30 p-5 rounded-2xl border border-outline flex flex-col gap-3">
                    {[
                      { key: 'mind', label: 'Mind' },
                      { key: 'health', label: 'Health' },
                      { key: 'learning', label: 'Learning' },
                      { key: 'work', label: 'Work' },
                      { key: 'relationships', label: 'Relationships' },
                      { key: 'finance', label: 'Finance' }
                    ].map(dim => (
                      <div key={dim.key} className="flex items-center justify-between text-xs py-1 border-b border-outline/20 last:border-0">
                        <span className="text-on-surface-variant font-medium">{dim.label}</span>
                        <div className="flex items-center gap-3">
                          {/* Small static progress indicator */}
                          <div className="w-20 h-1.5 rounded-full bg-border overflow-hidden">
                            <div 
                              className="h-full bg-secondary"
                              style={{ width: `${(currentReflData[dim.key] || 5) * 10}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-on-surface min-w-[20px] text-right">
                            {currentReflData[dim.key] || 5}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Remarks, Gratitude & Word */}
              <div className="flex flex-col gap-6 border-t border-outline pt-6">
                <h3 className="font-newsreader text-xl text-on-surface select-none">Self-Reflections</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-surface-container-high/30 p-5 rounded-xl border border-outline flex flex-col gap-2">
                    <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">One Word</span>
                    <span className="font-newsreader text-lg text-secondary italic font-semibold">
                      "{selectedReflection.oneWord || '—'}"
                    </span>
                  </div>
                  
                  <div className="bg-surface-container-high/30 p-5 rounded-xl border border-outline flex flex-col gap-2 md:col-span-2">
                    <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">Gratitude realization</span>
                    <p className="text-xs text-on-surface leading-relaxed">
                      {selectedReflection.gratitude || 'No gratitude logged today.'}
                    </p>
                  </div>

                  <div className="bg-surface-container-high/30 p-5 rounded-xl border border-outline flex flex-col gap-2 md:col-span-3">
                    <span className="font-sans text-[9px] text-on-surface-variant uppercase tracking-wider">Passing réalisation / Remark</span>
                    <p className="text-xs text-on-surface leading-relaxed">
                      {selectedReflection.remark || 'No remark logged today.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tasks completed */}
              {selectedReflection.tasks && selectedReflection.tasks.length > 0 && (
                <div className="flex flex-col gap-4 border-t border-outline pt-6">
                  <h3 className="font-newsreader text-lg text-on-surface select-none">Completed Priorities</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedReflection.tasks.map((taskName, idx) => (
                      <span 
                        key={idx}
                        className="bg-surface border border-outline px-3 py-1.5 rounded-lg text-xs text-on-surface-variant flex items-center gap-1.5 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[14px] text-secondary">check_circle</span>
                        {taskName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-grow py-24 text-on-surface-variant italic text-sm">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">history</span>
              No reflections log found. Begin check-ins to build history!
            </div>
          )
        )}
      </div>

    </div>
  );
}
