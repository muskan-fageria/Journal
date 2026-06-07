import React, { useState, useEffect, useRef } from 'react';
import { authFetch } from '../utils/authFetch';

export default function DiaryPage({ toast }) {
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    fetchDiary();
  }, []);

  const fetchDiary = async () => {
    try {
      const res = await authFetch('/api/diary');
      const data = await res.json();
      setEntries(data);
      if (data.length > 0) {
        setCurrentEntry(data[0]);
        setContent(data[0].content || '');
      } else {
        handleNewEntry();
      }
    } catch (err) {
      console.error("Error fetching diary:", err);
      toast("Failed to load diary.");
    }
  };

  const handleNewEntry = () => {
    const newDate = new Date();
    const dateStr = newDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    
    const draft = {
      title: '',
      date: dateStr,
      content: '',
      isNew: true
    };
    setCurrentEntry(draft);
    setContent('');
  };

  const handleSelectEntry = (entry) => {
    setCurrentEntry(entry);
    setContent(entry.content || '');
  };

  const handleSave = async () => {
    if (!currentEntry) return;
    setIsSaving(true);
    try {
      const payload = {
        title: currentEntry.title || currentEntry.date,
        date: currentEntry.date,
        content: content
      };

      let res;
      if (currentEntry.isNew) {
        res = await authFetch('/api/diary', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } else {
        res = await authFetch(`/api/diary/${currentEntry.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      }

      const savedEntry = await res.json();
      
      // Update local state
      if (currentEntry.isNew) {
        setEntries([savedEntry, ...entries]);
        setCurrentEntry(savedEntry);
      } else {
        setEntries(entries.map(e => e.id === savedEntry.id ? savedEntry : e));
      }
      
      toast("Diary saved beautifully. ✨");
    } catch (err) {
      console.error(err);
      toast("Failed to save diary.");
    } finally {
      setIsSaving(false);
    }
  };

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl mx-auto min-h-[80vh] page">
      
      {/* Sidebar for Entry History */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-4">
        <button 
          onClick={handleNewEntry}
          className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-stone-200 py-3 rounded-xl font-sans text-sm tracking-widest transition-all"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          NEW ENTRY
        </button>

        <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 max-h-[60vh]">
          {entries.map(entry => (
            <button
              key={entry.id}
              onClick={() => handleSelectEntry(entry)}
              className={`text-left p-3 rounded-lg border transition-all ${currentEntry?.id === entry.id ? 'bg-secondary/10 border-secondary/30 text-secondary' : 'bg-stone-900/40 border-white/5 text-stone-400 hover:bg-stone-800'}`}
            >
              <div className="font-newsreader text-lg">{entry.title}</div>
              <div className="font-sans text-xs opacity-50 truncate mt-1">{entry.content || 'Empty...'}</div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Notebook Area */}
      <div className="flex-1 bg-[#1a1c1a]/90 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl overflow-hidden flex flex-col">
        {/* Notebook Header */}
        <div className="flex flex-col gap-2 p-6 md:p-8 border-b border-white/5 bg-black/20">
          <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
            <input 
              type="text"
              value={currentEntry?.title || ''}
              onChange={(e) => setCurrentEntry({ ...currentEntry, title: e.target.value })}
              className="bg-transparent border-none outline-none font-newsreader text-3xl md:text-4xl text-stone-200 w-full placeholder:text-stone-600/50"
              placeholder="Give this entry a title..."
            />
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="shrink-0 flex items-center gap-2 bg-secondary text-stone-900 px-6 py-2.5 rounded-lg font-label-caps text-xs tracking-widest hover:bg-white transition-all disabled:opacity-50 w-full md:w-auto justify-center"
            >
              {isSaving ? 'SAVING...' : 'SAVE'}
              <span className="material-symbols-outlined text-sm">bookmark</span>
            </button>
          </div>
          <div className="font-sans text-xs tracking-widest uppercase text-stone-500 mt-2">
            {currentEntry?.date || (currentEntry?.created_at ? new Date(currentEntry.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }))}
          </div>
        </div>

        {/* Notebook Paper Body */}
        <div className="flex-1 p-8 md:p-12 relative">
          {/* Ruled Lines Background */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'linear-gradient(transparent 95%, #e6c183 100%)',
              backgroundSize: '100% 2.5rem',
              backgroundPositionY: '0.2rem'
            }}
          ></div>

          {/* Left margin line */}
          <div className="absolute top-0 bottom-0 left-10 md:left-14 w-[1px] bg-red-900/30 pointer-events-none"></div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full min-h-[500px] bg-transparent border-none outline-none resize-none font-newsreader text-[20px] leading-[2.5rem] text-stone-300 placeholder:text-stone-600/50 pl-6 md:pl-10"
            style={{ paddingTop: '0.4rem' }}
            placeholder="Begin writing your thoughts..."
            spellCheck="false"
          ></textarea>
        </div>
      </div>

    </div>
  );
}
