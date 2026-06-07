import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import Sidebar from './components/Sidebar';
import TodayPage from './pages/TodayPage';
import GrowthPage from './pages/GrowthPage';
import ArchivePage from './pages/ArchivePage';
import MemoryPage from './pages/MemoryPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('today');
  const [toastMessage, setToastMessage] = useState('');
  
  // Data states
  const [todayState, setTodayState] = useState({
    mood: '',
    weather: '',
    rating: 0,
    energy: 5.0,
    focus: 5.0,
    stress: 0,
    remark: '',
    gratitude: '',
    oneWord: '',
    steps: '0',
    water: '0L',
    sleep: '0h',
    exercise: '0m',
    productive: '0',
    mindfulness: '0 Minutes',
    mindGoal: '150 Minutes'
  });
  const [socialData, setSocialData] = useState({
    'ig-slider': 45,
    'sl-slider': 70,
    'bk-slider': 20
  });
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [hobbies, setHobbies] = useState([]);
  const [entries, setEntries] = useState([]);
  const [memories, setMemories] = useState([]);

  // Splash states
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('introPlayed');
  });

  // Toast helper
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2800);
  };

  // ==========================================
  // FETCH ALL DATA
  // ==========================================
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [
          todayRes,
          socialRes,
          tasksRes,
          projectsRes,
          eventsRes,
          hobbiesRes,
          entriesRes,
          memoriesRes
        ] = await Promise.all([
          fetch('/api/today').then(r => r.json()),
          fetch('/api/social').then(r => r.json()),
          fetch('/api/tasks').then(r => r.json()),
          fetch('/api/projects').then(r => r.json()),
          fetch('/api/events').then(r => r.json()),
          fetch('/api/hobbies').then(r => r.json()),
          fetch('/api/entries').then(r => r.json()),
          fetch('/api/memories').then(r => r.json())
        ]);

        if (todayRes && Object.keys(todayRes).length > 0) setTodayState(todayRes);
        if (socialRes && Object.keys(socialRes).length > 0) setSocialData(socialRes);
        setTasks(tasksRes || []);
        setProjects(projectsRes || []);
        setEvents(eventsRes || []);
        setHobbies(hobbiesRes || []);
        setEntries(entriesRes || []);
        setMemories(memoriesRes || []);
      } catch (err) {
        console.error("Error loading data from API:", err);
        triggerToast("Failed to load local data. Showing offline state.");
      }
    };

    loadAllData();
  }, []);

  // ==========================================
  // SAVE API HELPERS
  // ==========================================
  const saveTodayStateAPI = async (updatedState) => {
    try {
      await fetch('/api/today', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedState)
      });
    } catch (err) {
      console.error("Error saving today state:", err);
    }
  };

  const saveSocialAPI = async (appId, minutes) => {
    try {
      await fetch('/api/social', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId, minutes })
      });
    } catch (err) {
      console.error("Error saving social data:", err);
    }
  };

  // ==========================================
  // INTRO ANIMATION & LENIS INITIALIZATION
  // ==========================================
  useEffect(() => {
    // Initialize Lenis scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false
    });

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // Intro Splash Video fade logic
    if (showSplash) {
      const video = document.getElementById('intro-video');
      const skipBtn = document.getElementById('skip-intro');
      
      const tl = gsap.timeline({
        onComplete: () => {
          sessionStorage.setItem('introPlayed', 'true');
          finishIntro();
        }
      });

      if (skipBtn) {
        gsap.to(skipBtn, { opacity: 1, duration: 1, delay: 1 });
      }

      if (video) {
        video.play().catch(e => console.log("Video autoplay blocked", e));
        video.onended = () => finishIntro();
      }

      const finishIntro = () => {
        const splash = document.getElementById('intro-splash');
        if (splash) {
          gsap.to(splash, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: () => {
              setShowSplash(false);
              document.body.classList.add('app-revealed');
            }
          });
        } else {
          setShowSplash(false);
        }
      };

      if (skipBtn) {
        skipBtn.onclick = finishIntro;
      }
    } else {
      document.body.classList.add('app-revealed');
    }

    return () => {
      lenis.destroy();
    };
  }, [showSplash]);

  // Bento Mouse Highlight Effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      const cards = document.querySelectorAll('.bento-card');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [currentPage]);

  // Page fade transitions effect
  useEffect(() => {
    // Quick GSAP reveal on page change
    gsap.fromTo(".page", 
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );
  }, [currentPage]);

  // ==========================================
  // DATE HELPERS
  // ==========================================
  const getEffectiveDate = () => {
    const now = new Date();
    // Subtract 4 hours (4 AM reset boundary)
    now.setHours(now.getHours() - 4);
    return now;
  };

  const getEffectiveDateStr = () => {
    const d = getEffectiveDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatDateStrDisplay = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const d = getEffectiveDate();
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  };

  const effectiveDateStr = getEffectiveDateStr();
  const dateStrDisplay = formatDateStrDisplay();

  // ==========================================
  // SAVE TODAY ENTRY TO ARCHIVE
  // ==========================================
  const handleSaveTodayEntry = async () => {
    // Archive current todayState into entries table
    const doneTasks = tasks.filter(t => t.done && t.date === effectiveDateStr && t.cat !== 'habit').map(t => t.name);
    
    const entry = {
      date: effectiveDateStr,
      dateStr: dateStrDisplay,
      mood: todayState.mood,
      weather: todayState.weather,
      rating: todayState.rating,
      remark: todayState.remark,
      gratitude: todayState.gratitude,
      oneWord: todayState.oneWord,
      tasks: doneTasks,
      energy: todayState.energy,
      focus: todayState.focus,
      productive: todayState.productive,
      steps: todayState.steps,
      water: todayState.water,
      sleep: todayState.sleep,
      exercise: todayState.exercise
    };

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      const data = await res.json();
      
      // Update state
      const existingIdx = entries.findIndex(e => e.date === effectiveDateStr);
      if (existingIdx !== -1) {
        const updated = [...entries];
        updated[existingIdx] = data;
        setEntries(updated);
      } else {
        setEntries([data, ...entries]);
      }
      
      triggerToast("Entry saved to Archive! ✨");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to save entry");
    }
  };

  return (
    <>
      {/* Background Deep Misty Forest */}
      <div className="fixed inset-0 z-[-1] pointer-events-none select-none">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2070&auto=format&fit=crop')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background"></div>
      </div>

      {/* Intro splash loading screen */}
      {showSplash && (
        <div id="intro-splash" className="fixed inset-0 z-[1000] bg-stone-950 flex items-center justify-center overflow-hidden">
          <video id="intro-video" className="w-full h-full object-cover" muted playsinline>
            <source src="/loading-video.mp4" type="video/mp4" />
          </video>
          <button 
            id="skip-intro" 
            className="absolute bottom-8 right-8 font-label-caps text-[10px] text-white/20 hover:text-white/60 uppercase tracking-[0.4em] transition-all opacity-0 cursor-pointer"
          >
            Skip
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        todayState={todayState}
        tasks={tasks}
        dateStr={dateStrDisplay}
      />

      {/* Main Content Pane */}
      <main className="md:ml-64 min-h-screen flex flex-col p-margin-page lg:p-section-gap gap-section-gap max-w-none pt-8 select-none">
        
        {currentPage === 'today' && (
          <TodayPage 
            todayState={todayState}
            setTodayState={setTodayState}
            hobbies={hobbies}
            setHobbies={setHobbies}
            tasks={tasks}
            setTasks={setTasks}
            socialData={socialData}
            setSocialData={setSocialData}
            dateStr={dateStrDisplay}
            effectiveDateStr={effectiveDateStr}
            toast={triggerToast}
            saveTodayStateAPI={saveTodayStateAPI}
            saveSocialAPI={saveSocialAPI}
          />
        )}

        {currentPage === 'growth' && (
          <GrowthPage 
            tasks={tasks}
            setTasks={setTasks}
            projects={projects}
            setProjects={setProjects}
            events={events}
            setEvents={setEvents}
            effectiveDateStr={effectiveDateStr}
            toast={triggerToast}
          />
        )}

        {currentPage === 'archive' && (
          <ArchivePage 
            entries={entries}
            toast={triggerToast}
          />
        )}

        {currentPage === 'memory' && (
          <MemoryPage 
            memories={memories}
            setMemories={setMemories}
            toast={triggerToast}
          />
        )}

        {/* Global Save Button for Today View */}
        {currentPage === 'today' && (
          <div className="flex justify-end border-t border-white/5 pt-8 mt-4 select-none">
            <button 
              onClick={handleSaveTodayEntry}
              className="bg-secondary text-stone-900 px-8 py-3.5 rounded-xl font-label-caps text-xs uppercase tracking-widest hover:bg-white hover:scale-[1.02] active:scale-95 transition-all shadow-lg cursor-pointer"
            >
              Save Today's Sanctuary Entry
            </button>
          </div>
        )}
      </main>

      {/* Toast Notification HUD */}
      {toastMessage && (
        <div className="toast-msg show select-none">
          {toastMessage}
        </div>
      )}
    </>
  );
}
