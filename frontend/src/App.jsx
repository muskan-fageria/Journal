import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import Sidebar from './components/Sidebar';
import TodayPage from './pages/TodayPage';
import GrowthPage from './pages/GrowthPage';
import ArchivePage from './pages/ArchivePage';
import MemoryPage from './pages/MemoryPage';
import DiaryPage from './pages/DiaryPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import { supabase } from './utils/supabase';
import { authFetch } from './utils/authFetch';

export default function App() {
  const [currentPage, setCurrentPage] = useState('today');
  const [toastMessage, setToastMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) fetchProfile(session.user.id);
      setIsCheckingAuth(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) fetchProfile(session.user.id);
      else setUserProfile(null);
      setIsCheckingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) setUserProfile(data);
    else if (error) console.error("Error fetching profile:", error);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentPage('today');
  };
  
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
    'ig-slider': 0,
    'sl-slider': 0,
    'bk-slider': 0
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
  // FETCH ALL DATA (only when authenticated)
  // ==========================================
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadAllData = async () => {
      setIsLoadingData(true);
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
          authFetch('/api/today').then(r => r.json()),
          authFetch('/api/social').then(r => r.json()),
          authFetch('/api/tasks').then(r => r.json()),
          authFetch('/api/projects').then(r => r.json()),
          authFetch('/api/events').then(r => r.json()),
          authFetch('/api/hobbies').then(r => r.json()),
          authFetch('/api/entries').then(r => r.json()),
          authFetch('/api/memories').then(r => r.json())
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
      } finally {
        setIsLoadingData(false);
      }
    };

    loadAllData();
  }, [isAuthenticated]);

  // ==========================================
  // SAVE API HELPERS
  // ==========================================
  const saveTodayStateAPI = async (updatedState) => {
    try {
      await authFetch('/api/today', {
        method: 'PUT',
        body: JSON.stringify(updatedState)
      });
    } catch (err) {
      console.error("Error saving today state:", err);
    }
  };

  const saveSocialAPI = async (appId, minutes) => {
    try {
      await authFetch('/api/social', {
        method: 'PUT',
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
      
      if (skipBtn) {
        gsap.to(skipBtn, { opacity: 1, duration: 1, delay: 1 });
      }

      const finishIntro = () => {
        sessionStorage.setItem('introPlayed', 'true');
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

      if (video) {
        video.play().catch(e => console.log("Video autoplay blocked", e));
        video.onended = finishIntro;
      }

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
    return d.toISOString().split('T')[0];
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

  const getOverallStreak = () => {
    if (!entries || entries.length === 0) return 0;
    const sortedDates = [...new Set(entries.map(e => e.date))].sort().reverse();
    const todayStr = getEffectiveDateStr();
    
    const yesterday = getEffectiveDate();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) return 0;
    
    let streak = 1;
    let current = new Date(sortedDates[0] + 'T12:00:00');
    for (let i = 1; i < sortedDates.length; i++) {
      const expected = new Date(current);
      expected.setDate(expected.getDate() - 1);
      const expectedStr = expected.toISOString().split('T')[0];
      if (sortedDates[i] === expectedStr) {
        streak++;
        current = expected;
      } else {
        break;
      }
    }
    return streak;
  };

  const augmentedUserProfile = userProfile ? {
    ...userProfile,
    streak: getOverallStreak(),
    total_entries: entries.length,
  } : null;

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
      const res = await authFetch('/api/entries', {
        method: 'POST',
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

  const showLoadingScreen = (isCheckingAuth || (isAuthenticated && isLoadingData)) && !showSplash;

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

      {/* Premium Glassmorphic Loading Screen */}
      {showLoadingScreen && (
        <div className="fixed inset-0 z-[9999] bg-[#0c120e] flex flex-col items-center justify-center gap-6 select-none animate-fade-in">
          {/* Ambient Background Glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none"></div>

          {/* Premium Glassmorphic Loading Box */}
          <div className="relative p-12 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center">
            {/* Spinner Animation */}
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-secondary/20 border-t-secondary animate-spin" style={{ animationDuration: '1.2s' }}></div>
              <div className="absolute inset-4 rounded-full bg-secondary/5 border border-secondary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-2xl select-none animate-pulse">spa</span>
              </div>
            </div>

            {/* Text */}
            <div className="flex flex-col gap-2">
              <h3 className="font-newsreader text-2xl text-stone-200 italic">Entering the Sanctuary</h3>
              <p className="font-sans text-xs tracking-[0.2em] uppercase text-stone-500 animate-pulse">Gathering your thoughts...</p>
            </div>
          </div>
        </div>
      )}

      {/* Intro splash loading screen */}
      {showSplash && (
        <div id="intro-splash" className="fixed inset-0 z-[1000] bg-stone-950 flex items-center justify-center overflow-hidden">
          <video id="intro-video" className="w-full h-full object-cover" muted playsInline>
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

      {!isAuthenticated ? (
        <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
      ) : (
        <>
          {/* Sidebar Navigation */}
          <Sidebar 
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage} 
            todayState={todayState}
            tasks={tasks}
            dateStr={dateStrDisplay}
            userProfile={augmentedUserProfile}
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
            userProfile={augmentedUserProfile}
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

        {currentPage === 'diary' && (
          <DiaryPage 
            toast={triggerToast}
          />
        )}

        {currentPage === 'profile' && (
          <ProfilePage 
            onLogout={handleLogout}
            userProfile={augmentedUserProfile}
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
      </>
      )}

      {/* Toast Notification HUD */}
      {toastMessage && (
        <div className="toast-msg show select-none">
          {toastMessage}
        </div>
      )}
    </>
  );
}
