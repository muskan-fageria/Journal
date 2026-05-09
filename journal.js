const SUPABASE_URL = 'https://aogfbetxmzsjjdhbured.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2ZiZXR4bXpzampkaGJ1cmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTQyNDgsImV4cCI6MjA4OTA5MDI0OH0.OedI5IJQuUT-qB4INo2EH2yALrkoF3xqRMviMi9ESnM';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== BOOT & LOAD ==========
// Run intro sequence on page load
window.addEventListener('DOMContentLoaded', runIntroSequence);

// ========== DATA ==========
let data = { tasks: [], projects: [], events: [], hobbies: [], entries: [], memories: [], socialData: {}, today: { mood: '', weather: '', rating: 0, energy: 0, focus: 0, stress: 0, remark: '', gratitude: '', oneWord: '', steps: '0', water: '0L', sleep: '0h', exercise: '0m', productive: '0', mindfulness: '0 Minutes', mindGoal: '150 Minutes' } };
let currentMemoryId = null;
let projectCollapseState = {}; // NEW: Track which projects are collapsed

const DD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MM = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const RHYTHM_COLORS = ['#f87171', '#60a5fa', '#4ade80', '#fbbf24', '#f472b6', '#a78bfa', '#fb923c', '#2dd4bf', '#818cf8', '#c084fc'];
const RHYTHM_ICONS = {
  'gym': 'fitness_center', 'fitness': 'fitness_center', 'workout': 'fitness_center',
  'dsa': 'code', 'logic': 'code', 'coding': 'terminal', 'dev': 'terminal', 'webdev': 'language',
  'physics': 'science', 'science': 'science', 'study': 'menu_book', 'reading': 'menu_book',
  'dance': 'self_care', 'art': 'palette', 'design': 'draw', 'mindfulness': 'psychology'
};

const CAT_ICONS = {
  personal: 'favorite',
  work: 'work',
  social: 'groups',
  health: 'fitness_center',
  other: 'push_pin'
};

const MOOD_ICONS = {
  'Flowing': 'water_drop',
  'Light': 'light_mode',
  'Heavy': 'tsunami',
  'Restless': 'air',
  'Centered': 'filter_vintage'
};

// ========== INTRO SEQUENCE ==========
function runIntroSequence() {
  const splash = document.getElementById('intro-splash');
  const video = document.getElementById('intro-video');
  const skipBtn = document.getElementById('skip-intro');

  if (!splash) {
    checkAuthAndLoad();
    return;
  }

  if (sessionStorage.getItem('introPlayed')) {
    splash.style.display = 'none';
    checkAuthAndLoad();
    return;
  }

  const tl = gsap.timeline({
    onComplete: () => {
      sessionStorage.setItem('introPlayed', 'true');
      finishIntro();
    }
  });

  gsap.set(splash, { opacity: 1 });
  
  // Just show video and fade in skip button
  tl.to(skipBtn, { opacity: 1, duration: 1 }, 1);

  video.play().catch(e => console.log("Video autoplay blocked", e));
  video.onended = () => tl.play();

  const finishIntro = () => {
    // Start auth check immediately so it's ready when splash fades
    checkAuthAndLoad(); 

    gsap.to(splash, {
      opacity: 0,
      duration: 0.8,
      ease: "power2.inOut",
      onComplete: () => {
        splash.remove();
      }
    });
  };

  skipBtn.onclick = finishIntro;
}

// ========== AUTHENTICATION ==========
async function checkAuthAndLoad() {
  // Clear URL params if they exist so the URL is clean
  if (window.location.search) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  const { data: { session } } = await db.auth.getSession();
  
  if (session) {
    const splash = document.getElementById('login-splash');
    if (splash) splash.style.display = 'none';
    window.currentUserEmail = session.user.email;
    loadData();
  } else {
    const splash = document.getElementById('login-splash');
    if (splash) splash.style.display = 'flex';
  }
}

async function handleLogin() {
  const usernameInput = document.getElementById('login-username').value.trim().toUpperCase();
  const passwordInput = document.getElementById('login-password').value.trim();
  
  if (!usernameInput || !passwordInput) return;
  
  const spinner = document.getElementById('login-spinner');
  const status = document.getElementById('login-status');
  if (spinner) spinner.style.opacity = '1';
  if (status) status.innerText = 'Authenticating...';
  
  // Map username to the internal email format we use
  const email = usernameInput === 'MUSKAN' ? 'muskan_2@journal.local' : 'mohit_2@journal.local';
  
  // Supabase requires 6 character passwords. We pad the passwords invisibly.
  let finalPassword = passwordInput;
  if (passwordInput.toUpperCase() === 'MOHIT') finalPassword = 'MOHIT123';
  if (passwordInput.toUpperCase() === 'MUSKAN') finalPassword = 'MUSKAN123'; 
  
  let { data, error } = await db.auth.signInWithPassword({ email, password: finalPassword });
  
  if (error) {
    status.innerText = 'Creating account...';
    const signUpRes = await db.auth.signUp({ email, password: finalPassword });
    if (signUpRes.error) {
      status.innerText = 'Failed';
      toast("Authentication failed. " + signUpRes.error.message);
      setTimeout(() => { if(spinner) spinner.style.opacity = '0'; }, 2000);
      return;
    } else {
      const checkSession = await db.auth.getSession();
      if (!checkSession.data.session) {
        status.innerText = 'Failed';
        toast("Please TURN OFF 'Confirm Email' in Supabase Auth.");
        setTimeout(() => { if(spinner) spinner.style.opacity = '0'; }, 3000);
        return;
      }
    }
  }
  
  status.innerText = 'Unlocked';
  const splash = document.getElementById('login-splash');
  if (splash) {
    gsap.to(splash, { opacity: 0, duration: 0.5, onComplete: () => {
      splash.style.display = 'none';
      if(spinner) spinner.style.opacity = '0';
      loadData();
    }});
  } else {
    loadData();
  }
}

async function logout() {
  await db.auth.signOut();
  window.location.reload();
}

async function loadData() {
  try {
    const [tRes, pRes, eRes, hRes, entRes, sRes, tsRes, mRes] = await Promise.all([
      db.from('tasks').select('*'),
      db.from('projects').select('*'),
      db.from('events').select('*'),
      db.from('hobbies').select('*'),
      db.from('entries').select('*'),
      db.from('social_data').select('*'),
      db.from('today_state').select('*').single(),
      db.from('memories').select('*').order('created_at', { ascending: false })
    ]);

    if (tRes.data) data.tasks = tRes.data;
    if (pRes.data) data.projects = pRes.data;
    if (eRes.data) data.events = eRes.data;
    if (hRes.data) data.hobbies = hRes.data;
    if (entRes.data) data.entries = entRes.data.map(e => ({ ...e, dateStr: e.date_str, oneWord: e.one_word }));

    const n = new Date();
    const todayStr = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
    let isNewDay = false;

    if (tsRes.data) {
      const lastUpdate = tsRes.data.updated_at ? tsRes.data.updated_at.split('T')[0] : '';
      if (lastUpdate && lastUpdate !== todayStr) {
        // Roll over the old state into the entries table
        db.from('entries').insert({
          date: lastUpdate,
          mood: tsRes.data.mood,
          weather: tsRes.data.weather,
          rating: tsRes.data.rating,
          remark: tsRes.data.remark,
          one_word: tsRes.data.one_word,
          steps: tsRes.data.steps,
          water: tsRes.data.water,
          sleep: tsRes.data.sleep,
          exercise: tsRes.data.exercise,
          energy: tsRes.data.energy,
          focus: tsRes.data.focus,
          stress: tsRes.data.stress,
          productive: tsRes.data.productive,
          mindfulness: tsRes.data.mindfulness,
          mind_goal: tsRes.data.mind_goal
        }).then(() => console.log('Previous day archived.'));
        
        isNewDay = true;
      } else if (lastUpdate === todayStr) {
        data.today = { ...data.today, ...tsRes.data, oneWord: tsRes.data.one_word, mindGoal: tsRes.data.mind_goal };
      }
    } else {
      isNewDay = true; 
    }

    if (sRes.data) {
      data.socialData = {};
      if (!isNewDay) {
        sRes.data.forEach(row => data.socialData[row.app_id] = row.minutes);
      } else {
        db.from('social_data').delete().neq('app_id', 'dummy_to_allow_delete_all').then(() => console.log("Social data cleared for new day"));
      }
      
      ['ig-slider', 'sl-slider', 'bk-slider'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = data.socialData[id] || 0;
      });
      initSocialBars();
    }

    if (isNewDay) saveTodayState();
    if (mRes.data) data.memories = mRes.data;

    initBentoEffect();
    initButtonAnimations();

    try { initDates(); } catch(e) { console.error("initDates failed", e); }
    try { initToday(); } catch(e) { console.error("initToday failed", e); }
    
    const activePage = document.querySelector('.page.active');
    if (activePage) {
      const pageId = activePage.id.replace('page-', '');
      showPage(pageId);
    } else {
      // Check hash or default to today
      const hash = window.location.hash.replace('#', '') || 'today';
      showPage(hash);
    }
    
    try { updateStreak(); } catch(e) { console.error("updateStreak failed", e); }
  } catch (err) {
    console.error("Critical error in loadData", err);
    toast("Error loading data. Showing offline state.");
  } finally {
    initAnimations();
    // Toast removed for cleaner experience
  }
}

// ========== SPA NAVIGATION ==========
function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('nav a');
  
  // 1. Update Visibility
  pages.forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById('page-' + pageId);
  if (targetPage) {
    targetPage.classList.add('active');
    window.location.hash = pageId;
  }

  // 2. Update Nav Active State
  navLinks.forEach(link => {
    link.classList.remove('text-amber-200', 'border-l-2', 'border-amber-200/50', 'active');
    link.classList.add('text-stone-500');
    if (link.getAttribute('onclick')?.includes(`'${pageId}'`)) {
      link.classList.add('text-amber-200', 'border-l-2', 'border-amber-200/50', 'active');
      link.classList.remove('text-stone-500');
    }
  });

  // 3. Trigger Section-Specific Logic
  if (pageId === 'growth') renderGrowthPage();
  if (pageId === 'progress') renderProgressPage();
  if (pageId === 'archive') { renderLog(); renderEvents(); }
  if (pageId === 'memory') renderMemories();
  if (pageId === 'today') { 
    renderHabitsToday(); 
    setTimeout(renderTrendChart, 80); 
  }

  // 4. Reset Scroll & Refresh Animations
  window.scrollTo(0, 0);
  if (window.lenis) window.lenis.scrollTo(0, { immediate: true });
  
  // Re-run animations for the new page
  setTimeout(() => {
    initAnimations();
    ScrollTrigger.refresh();
  }, 100);
}

// ========== SMOOTH SCROLL (LENIS) ==========
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Export lenis to window for global access if needed
window.lenis = lenis;

// ========== PREMIUM ANIMATIONS (GSAP) ==========
gsap.registerPlugin(ScrollTrigger);

function initAnimations() {
  // 1. Clean up old triggers
  ScrollTrigger.getAll().forEach(t => t.kill());

  // 2. Identify all elements to animate
  const headerEls = gsap.utils.toArray("header h1, header p, header .font-label-caps, .section-header .font-label-caps");
  const bentoUnits = gsap.utils.toArray(".bento-unit");
  const individualCards = gsap.utils.toArray(".bento-card, .card").filter(el => !el.closest('.bento-unit'));
  const allButtons = gsap.utils.toArray("button:not(.nav-tabs button):not(.bento-card button)");
  
  // 3. Reset state immediately
  // We use visibility: "visible" to override the initial CSS hide once GSAP is in control
  gsap.set([...headerEls, ...bentoUnits, ...individualCards, ...allButtons], { opacity: 0, y: 25, visibility: "visible", force3D: true });
  document.body.classList.add('gsap-ready');

  // 4. Hero Animation
  gsap.to(headerEls, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    stagger: 0.05,
    ease: "power2.out"
  });

  // 5. Bento Units (Rows), Individual Cards, and Buttons
  const mainContent = [...bentoUnits, ...individualCards, ...allButtons];
  
  mainContent.forEach((el, i) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 95%",
        toggleActions: "play none none none"
      }
    });
  });

  // 6. Refresh ScrollTrigger to ensure all markers are correct
  setTimeout(() => ScrollTrigger.refresh(), 100);
}

function initDates() {
  const n = new Date();
  const elDate = document.getElementById('hero-date');
  if (elDate) elDate.textContent = `${DD[n.getDay()]}, ${MM[n.getMonth()]} ${n.getDate()}, ${n.getFullYear()}`;
  
  const elNavDate = document.getElementById('nav-date-display');
  if (elNavDate) elNavDate.textContent = `${DD[n.getDay()]}, ${MM[n.getMonth()]} ${n.getDate()}`;
  
  const h = n.getHours();
  const elGreet = document.getElementById('hero-greeting');
  if (elGreet) elGreet.textContent = h < 12 ? 'Good morning ✦' : h < 17 ? 'Good afternoon ✦' : 'Good evening ✦';
  
  const iso = n.toISOString().split('T')[0];
  ['t-due', 'e-date', 'p-deadline', 'taskDate', 'eventDateTime', 'projectDateFrom', 'projectDateTo'].forEach(id => { 
    const el = document.getElementById(id); 
    if (el) el.value = iso; 
  });
}

class ElasticSlider {
  constructor(el, initialValue = 0, onChange = null) {
    this.el = el;
    this.svgBg = el.querySelector('.elastic-bg');
    this.svgFill = el.querySelector('.elastic-fill');
    this.thumb = el.querySelector('.elastic-thumb');
    this.onChange = onChange;
    this.key = el.getAttribute('data-key');
    this.width = el.clientWidth || 100;
    this.value = initialValue;
    this.isDragging = false;
    this.y = 20;
    this.targetY = 20;
    this.vy = 0;
    this.tension = 0.4;
    this.friction = 0.5;
    this.bindEvents();
    this.updateVisuals(false);
    this.loop();
    window.addEventListener('resize', () => {
      this.width = this.el.clientWidth || 100;
      this.updateVisuals(false);
    });
  }
  setValue(val) { this.value = val; this.updateVisuals(false); }
  bindEvents() {
    this.el.addEventListener('pointerdown', e => {
      this.isDragging = true;
      this.el.setPointerCapture(e.pointerId);
      this.handleMove(e);
      this.thumb.style.transform = 'scale(1.3)';
    });
    this.el.addEventListener('pointermove', e => {
      if (!this.isDragging) return;
      this.handleMove(e);
    });
    const endDrag = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.targetY = 20;
      this.thumb.style.transform = 'scale(1)';
      if (this.onChange) this.onChange(this.value);
    };
    this.el.addEventListener('pointerup', endDrag);
    this.el.addEventListener('pointercancel', endDrag);
  }
  handleMove(e) {
    const rect = this.el.getBoundingClientRect();
    this.width = rect.width || 100;
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, this.width));
    this.value = Math.round((x / this.width) * 100) / 10; // Continuous value with 1 decimal
    if (this.key) {
      const valEl = document.getElementById(this.key + '-val');
      if (valEl) valEl.textContent = this.value;
    }
    let dy = e.clientY - (rect.top + rect.height/2);
    dy = Math.max(-20, Math.min(dy, 20));
    this.targetY = 20 + dy;
    this.updateVisuals(true);
  }
  updateVisuals(pulling) {
    let px = (this.value / 10) * 100;
    this.thumb.style.left = `${px}%`;
    this.thumb.style.top = `${this.y}px`;
    
    let dBg = `M0,20 Q${px},${this.y} 100,20`;
    this.svgBg.setAttribute('d', dBg);
    
    let cx = px / 2;
    let cy = 20 + (this.y - 20) / 2;
    let dFill = `M0,20 Q${cx},${cy} ${px},${this.y}`;
    this.svgFill.setAttribute('d', dFill);
  }
  loop() {
    requestAnimationFrame(() => this.loop());
    if (this.isDragging) {
      this.y += (this.targetY - this.y) * 0.5;
    } else {
      let dy = this.targetY - this.y;
      this.vy += dy * this.tension;
      this.vy *= this.friction;
      this.y += this.vy;
    }
    if (Math.abs(this.vy) > 0.01 || Math.abs(this.targetY - this.y) > 0.01 || this.isDragging) {
      this.updateVisuals(this.isDragging);
    }
  }
}
let elasticEnergy, elasticFocus;

function initToday() {
  const t = data.today;
  setRating(t.rating || 0, false);
  
  const updateQS = (key, val) => {
    const el = document.getElementById('qs-' + key);
    if (el) el.textContent = val;
    const sEl = document.getElementById('sidebar-qs-' + key);
    if (sEl) sEl.textContent = val;
  };

  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  if (t.mood) { 
    document.querySelectorAll('.mood-btn').forEach(b => { if (b.textContent.includes(t.mood)) b.classList.add('selected'); }); 
    updateQS('mood', t.mood);
  } else {
    updateQS('mood', '—');
  }
  
  updateQS('rating', t.rating ? t.rating + '/10' : '—');
  
  const energyWrap = document.getElementById('energy-wrap');
  if (energyWrap) {
    if (!elasticEnergy) {
      elasticEnergy = new ElasticSlider(energyWrap, t.energy || 0, val => {
        data.today.energy = val;
        const vEl = document.getElementById('energy-val');
        if (vEl) vEl.textContent = val;
        saveTodayState();
      });
    } else {
      elasticEnergy.setValue(t.energy || 0);
    }
  }
  const energyVal = document.getElementById('energy-val');
  if (energyVal) energyVal.textContent = t.energy || 0;
  
  const focusWrap = document.getElementById('focus-wrap');
  if (focusWrap) {
    if (!elasticFocus) {
      elasticFocus = new ElasticSlider(focusWrap, t.focus || 0, val => {
        data.today.focus = val;
        const vEl = document.getElementById('focus-val');
        if (vEl) vEl.textContent = val;
        saveTodayState();
      });
    } else {
      elasticFocus.setValue(t.focus || 0);
    }
  }
  const focusVal = document.getElementById('focus-val');
  if (focusVal) focusVal.textContent = t.focus || 0;

  const elRemark = document.getElementById('daily-remark');
  if (elRemark) elRemark.value = t.remark || '';
  
  const elGrat = document.getElementById('gratitude');
  if (elGrat) elGrat.value = t.gratitude || '';
  
  const elWord = document.getElementById('one-word');
  if (elWord) elWord.value = t.oneWord || '';

  ['steps', 'water', 'sleep', 'exercise'].forEach(k => { 
    const el = document.getElementById('h-' + k);
    if (el) el.value = t[k] || (k === 'steps' ? '0' : k === 'water' ? '0L' : k === 'sleep' ? '0h' : '0m'); 
  });
  initVitalityBars();

  const elProd = document.getElementById('h-productive');
  const qsProd = document.getElementById('qs-prod');
  if (elProd) elProd.value = t.productive || '0';
  if (qsProd) qsProd.textContent = (t.productive || '0') + 'h';

  const elMind = document.getElementById('h-mindfulness');
  if (elMind) elMind.value = t.mindfulness || '0 Minutes';
  
  const elGoal = document.getElementById('h-mind-goal');
  if (elGoal) elGoal.value = t.mindGoal || '150 Minutes';
}

// Duplicated legacy showPage removed.
// ========== MOOD / WEATHER / RATING ==========
async function saveTodayState() {
  const ts = data.today;
  const payload = {
    id: 1,
    updated_at: new Date().toISOString(),
    mood: ts.mood, weather: ts.weather, rating: ts.rating, energy: ts.energy, focus: ts.focus, stress: ts.stress,
    remark: ts.remark, gratitude: ts.gratitude, one_word: ts.oneWord,
    steps: ts.steps, water: ts.water, sleep: ts.sleep, exercise: ts.exercise, productive: ts.productive,
    mindfulness: ts.mindfulness, mind_goal: ts.mindGoal
  };
  const { data: res, error: updateErr } = await db.from('today_state').update(payload).eq('id', 1).select();
  if (updateErr) console.error("Update today_state error:", updateErr);
  
  if (!res || res.length === 0) {
    const { error: insertErr } = await db.from('today_state').insert(payload);
    if (insertErr) console.error("Insert today_state error:", insertErr);
  }
}

function selectMood(btn, emoji) { 
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected')); 
  btn.classList.add('selected'); 
  data.today.mood = emoji; 
  if (document.getElementById('qs-mood')) document.getElementById('qs-mood').textContent = emoji;
  if (document.getElementById('sidebar-qs-mood')) document.getElementById('sidebar-qs-mood').textContent = emoji;
  saveTodayState(); 
}
function selectWeather(btn, emoji, label) { document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); data.today.weather = emoji + ' ' + label; saveTodayState(); }
function setRating(n, doSave = true) {
  data.today.rating = n;
  document.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('filled', i < n));
  const L = ['', 'Terrible', 'Bad', 'Poor', 'Meh', 'Okay', 'Good', 'Great', 'Excellent', 'Amazing', 'Perfect 🌿'];
  document.getElementById('rating-label').textContent = n > 0 ? `${n}/10 — ${L[n]}` : 'Pick a star to rate';
  const val = n > 0 ? n + '/10' : '—';
  if (document.getElementById('qs-rating')) document.getElementById('qs-rating').textContent = val;
  if (document.getElementById('sidebar-qs-rating')) document.getElementById('sidebar-qs-rating').textContent = val;
  if (doSave) saveTodayState();
}
function updateSlider(sid, vid, key) { const v = document.getElementById(sid).value; document.getElementById(vid).textContent = v; data.today[key] = v; saveTodayState(); }
function updateMindfulness() {
  data.today.mindfulness = document.getElementById('h-mindfulness').value;
  data.today.mindGoal = document.getElementById('h-mind-goal').value;
  saveTodayState();
}
function updateHealth() { 
  ['steps', 'water', 'sleep', 'exercise'].forEach(k => { 
    const val = document.getElementById('h-' + k).value;
    data.today[k] = val; 
    
    // Update progress bars and range sliders visually
    const bar = document.getElementById('bar-' + k);
    const range = document.getElementById('range-' + k);
    
    let numVal = parseFloat(val.replace(/[^\d.]/g, '')) || 0;
    if (range) range.value = numVal;

    if (bar) {
      let max = 100;
      if (k === 'steps') max = 10000;
      if (k === 'water') max = 3;
      if (k === 'sleep') max = 12; // Changed to match range max
      if (k === 'exercise') max = 120; // Changed to match range max
      
      let pct = Math.min(100, Math.max(0, (numVal / max) * 100));
      bar.style.width = pct + '%';
    }
  }); 
  saveTodayState(); 
}

function initVitalityBars() {
  ['steps', 'water', 'sleep', 'exercise'].forEach(k => {
    const val = data.today[k];
    if (!val) return;
    
    const textInput = document.getElementById('h-' + k);
    const range = document.getElementById('range-' + k);
    const bar = document.getElementById('bar-' + k);
    
    if (textInput) textInput.value = val;
    
    let numVal = 0;
    if (typeof val === 'string') {
      if (k === 'sleep' && val.includes('h')) {
        let parts = val.split('h');
        let h = parseFloat(parts[0]) || 0;
        let m = parts[1] ? (parseFloat(parts[1]) || 0) : 0;
        numVal = h + (m / 60);
      } else {
        numVal = parseFloat(val.replace(/[^\d.]/g, '')) || 0;
      }
    } else {
      numVal = parseFloat(val) || 0;
    }

    if (range) range.value = numVal;
    
    if (bar) {
      let max = range ? parseFloat(range.max) : 100;
      if (!max) {
        if (k === 'steps') max = 10000;
        else if (k === 'water') max = 3;
        else if (k === 'sleep') max = 12;
        else if (k === 'exercise') max = 120;
      }
      let pct = Math.min(100, Math.max(0, (numVal / max) * 100));
      bar.style.width = pct + '%';
    }
  });
}

function updateHealthFromRange(k) {
  const range = document.getElementById('range-' + k);
  const textInput = document.getElementById('h-' + k);
  const bar = document.getElementById('bar-' + k);
  
  let val = parseFloat(range.value);
  
  // Format the text appropriately
  if (k === 'steps') {
    textInput.value = val.toLocaleString();
  } else if (k === 'water') {
    textInput.value = val.toFixed(1) + 'L';
  } else if (k === 'sleep') {
    let hr = Math.floor(val);
    let min = Math.round((val - hr) * 60);
    textInput.value = min > 0 ? `${hr}h ${min}m` : `${hr}h`;
  } else if (k === 'exercise') {
    textInput.value = val + 'm';
  }
  
  // Update bar visually
  let max = parseFloat(range.max);
  let pct = (val / max) * 100;
  if (bar) bar.style.width = pct + '%';
  
  // Save state
  data.today[k] = val;
  saveTodayState();
}

// updateSocial merged below

function saveTodayEntry() {
  saveTodayState();
  toast('Entry Saved ✓');
}

function updateRemark() { data.today.remark = document.getElementById('daily-remark').value; saveTodayState(); }

// ========== TASKS ==========
let taskFilter = 'all', selDate = null;
async function addTask() {
  const name = document.getElementById('t-name').value.trim(); if (!name) return toast('Enter a task name');
  const task = {
    name,
    cat: document.getElementById('t-cat').value,
    priority: document.getElementById('t-priority').value,
    notes: document.getElementById('t-notes').value,
    due: document.getElementById('t-due').value,
    done: false,
    date: new Date().toISOString().split('T')[0]
  };
  const { data: res, error } = await db.from('tasks').insert(task).select();
  if (!error && res) {
    data.tasks.push(res[0]);
    ['t-name', 't-notes'].forEach(id => document.getElementById(id).value = '');
    renderTasks(); renderHabitsToday(); renderTaskChart(); updateTaskCount(); toast('Task added ✓');
  }
}
async function toggleTask(id) {
  const t = data.tasks.find(t => t.id === id);
  if (t) {
    t.done = !t.done;
    renderTasks(); renderHabitsToday(); updateTaskCount();
    await db.from('tasks').update({ done: t.done }).eq('id', id);
  }
}
async function deleteTask(id) {
  data.tasks = data.tasks.filter(t => t.id !== id);
  renderTasks(); renderHabitsToday(); updateTaskCount();
  await db.from('tasks').delete().eq('id', id);
}
async function clearCompleted() {
  const ids = data.tasks.filter(t => t.done).map(t => t.id);
  data.tasks = data.tasks.filter(t => !t.done);
  renderTasks(); renderHabitsToday(); updateTaskCount(); toast('Cleared ✓');
  if (ids.length) await db.from('tasks').delete().in('id', ids);
}
function filterTasks(f) { taskFilter = f; renderTasks(); }
function updateTaskCount() { 
  const done = data.tasks.filter(t => t.done).length, total = data.tasks.length; 
  const el = document.getElementById('task-count'); 
  if (el) el.textContent = `${done}/${total} done`; 
  if (document.getElementById('qs-tasks')) document.getElementById('qs-tasks').textContent = done;
  if (document.getElementById('sidebar-qs-tasks')) document.getElementById('sidebar-qs-tasks').textContent = done;
}
function taskHTML(t, showToggle = true) {
  return `
    <div class="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center gap-4 group transition-all hover:bg-white/10 ${t.done ? 'opacity-60' : ''}">
      <div class="w-1 h-8 rounded-full ${t.priority === 'high' ? 'bg-red-400' : t.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'}"></div>
      ${showToggle ? `
        <input type="checkbox" class="w-5 h-5 rounded border-white/20 bg-white/5 text-secondary focus:ring-secondary focus:ring-offset-0 transition-all cursor-pointer" ${t.done ? 'checked' : ''} onchange="toggleTask('${t.id}')">
      ` : `<span class="text-secondary">${t.done ? '✓' : '○'}</span>`}
      <div class="flex-grow">
        <div class="font-body-md text-on-surface ${t.done ? 'line-through text-on-surface-variant' : ''}">${t.name}</div>
        <div class="flex gap-2 mt-1 items-center">
          <span class="text-[9px] uppercase tracking-widest text-secondary px-1.5 py-0.5 rounded border border-secondary/30 bg-secondary/5">${t.cat}</span>
          ${t.notes ? `<span class="text-[10px] text-on-surface-variant italic">${t.notes}</span>` : ''}
          ${t.due ? `<span class="text-[10px] text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">calendar_today</span>${t.due}</span>` : ''}
        </div>
      </div>
      ${showToggle ? `
        <button class="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-red-400 transition-all" onclick="deleteTask('${t.id}')">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      ` : ''}
    </div>
  `;
}
function renderTasks() {
  const el = document.getElementById('task-list-main'); if (!el) return;
  let tasks = [...data.tasks];
  if (taskFilter === 'done') tasks = tasks.filter(t => t.done);
  else if (taskFilter !== 'all') tasks = tasks.filter(t => t.cat === taskFilter && !t.done);
  else tasks = tasks.filter(t => !t.done);
  el.innerHTML = tasks.length ? tasks.map(t => taskHTML(t)).join('') : '<div class="empty-state text-center text-on-surface-variant italic py-12">No tasks here.</div>';
  updateTaskCount();
}
async function addHabitTask() {
  const name = document.getElementById('h-name-new').value.trim(); if (!name) return toast('Enter a habit name');
  const task = { name, cat: 'habit', priority: 'low', notes: '', due: new Date().toISOString().split('T')[0], done: false, date: new Date().toISOString().split('T')[0] };
  const { data: res, error } = await db.from('tasks').insert(task).select();
  if (!error && res) { data.tasks.push(res[0]); document.getElementById('h-name-new').value = ''; renderHabitsToday(); updateTaskCount(); toast('Habit added ✓'); }
}
function habitHTML(t) {
  if (t.done) {
    return `<div class="flex items-center gap-4 group cursor-pointer" onclick="toggleTask('${t.id}')">
<div class="w-8 h-8 flex-shrink-0 rounded-full border border-secondary bg-secondary/10 flex items-center justify-center transition-colors shadow-[0_0_12px_rgba(230,193,131,0.2)]">
<span class="material-symbols-outlined text-[16px] text-secondary">check</span>
</div>
<span class="font-body-md text-body-md text-on-surface-variant line-through opacity-70">${t.name}</span>
<button class="ml-auto opacity-0 group-hover:opacity-100 task-del text-on-surface-variant hover:text-red-400 transition-all p-1" onclick="event.stopPropagation(); deleteTask('${t.id}')">✕</button>
</div>`;
  } else {
    return `<div class="flex items-center gap-4 group cursor-pointer" onclick="toggleTask('${t.id}')">
<div class="w-8 h-8 flex-shrink-0 rounded-full border border-secondary flex items-center justify-center group-hover:bg-secondary/5 transition-colors relative">
<svg class="absolute inset-0 w-full h-full -rotate-90 text-secondary/30" viewBox="0 0 36 36">
<path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="1.5"></path>
<path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e6c183" stroke-dasharray="100, 100" stroke-dashoffset="60" stroke-width="1.5"></path>
</svg>
</div>
<span class="font-body-md text-body-md text-on-surface group-hover:text-secondary transition-colors">${t.name}</span>
<button class="ml-auto opacity-0 group-hover:opacity-100 task-del text-on-surface-variant hover:text-red-400 transition-all p-1" onclick="event.stopPropagation(); deleteTask('${t.id}')">✕</button>
</div>`;
  }
}

function renderHabitsToday() {
  const el = document.getElementById('habit-list-today'); if (!el) return;
  const habits = data.tasks.filter(t => t.cat === 'habit');
  el.innerHTML = habits.length ? habits.map(t => habitHTML(t)).join('') : '<div class="empty-state text-center text-on-surface-variant italic text-sm mt-4"><span class="material-symbols-outlined block text-3xl mb-2 opacity-50">eco</span>No habits yet.</div>';
}

// ========== CALENDAR ==========
function buildCalStrip() {
  const strip = document.getElementById('cal-strip'); if (!strip) return;
  strip.innerHTML = '';
  const now = new Date();
  for (let i = -7; i <= 14; i++) {
    const d = new Date(now); d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const hasTasks = data.tasks.some(t => t.date === iso);
    const hasEntry = data.entries.some(e => e.date === iso);
    const el = document.createElement('div');
    el.className = 'cal-day' + (i === 0 ? ' today' : '') + (hasTasks || hasEntry ? ' has-entry' : '') + (selDate === iso ? ' sel' : '');
    el.innerHTML = `<div class="cal-wd">${DD[d.getDay()]}</div><div class="cal-d">${d.getDate()}</div>${hasTasks || hasEntry ? '<div class="cal-dot"></div>' : ''}`;
    const isoF = iso, dF = new Date(d);
    el.onclick = () => onCalClick(isoF, el, dF);
    strip.appendChild(el);
  }
}
function onCalClick(iso, el, d) {
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('.cal-day').forEach(x => x.classList.remove('sel'));
  if (selDate === iso) { selDate = null; closePastDay(); return; }
  el.classList.add('sel'); selDate = iso;
  if (iso === today) { closePastDay(); return; }
  showPastDay(iso, d);
}
function showPastDay(iso, d) {
  const panel = document.getElementById('past-day-panel');
  panel.style.display = 'block';
  document.getElementById('past-day-label').textContent = `${DD[d.getDay()]}, ${MM[d.getMonth()]} ${d.getDate()}`;
  const dayTasks = data.tasks.filter(t => t.date === iso);
  const entry = data.entries.find(e => e.date === iso);
  let html = '';
  if (dayTasks.length) html += dayTasks.map(t => taskHTML(t, false)).join('');
  else html += '<div style="font-size:0.82rem;color:var(--text-faint);font-style:italic;padding:0.5rem">No tasks on this day.</div>';
  if (entry) html += `<div style="margin-top:0.75rem;padding:0.75rem;background:var(--surface3);border-radius:8px;border-left:3px solid var(--olive-dim)">${entry.mood || entry.rating ? `<div style="font-size:0.83rem;margin-bottom:0.3rem">${entry.mood || ''} ${entry.weather || ''} ${entry.rating ? '<span style="color:var(--olive)">' + entry.rating + '/10</span>' : ''}</div>` : ''} ${entry.remark ? `<div style="font-size:0.8rem;color:var(--text-dim);font-style:italic;line-height:1.5">"${entry.remark}"</div>` : ''}</div>`;
  document.getElementById('past-day-tasks').innerHTML = html;
}
function closePastDay() { document.getElementById('past-day-panel').style.display = 'none'; selDate = null; document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('sel')); }

// ========== PROJECTS ==========
async function addProject() {
  const name = document.getElementById('p-name').value.trim(); if (!name) return toast('Enter project name');
  const p = {
    name,
    "desc": document.getElementById('p-desc').value,
    status: document.getElementById('p-status').value,
    pct: parseInt(document.getElementById('p-pct').value) || 0,
    deadline: document.getElementById('p-deadline').value
  };
  const { data: res, error } = await db.from('projects').insert(p).select();
  if (!error && res) {
    data.projects.push(res[0]);
    ['p-name', 'p-desc', 'p-pct'].forEach(id => document.getElementById(id).value = '');
    renderProjects(); renderProjectChart(); toast('Project added ✓');
  }
}
async function deleteProject(id) {
  data.projects = data.projects.filter(p => p.id !== id);
  renderProjects(); renderProjectChart();
  await db.from('projects').delete().eq('id', id);
}
async function updateProjectPct(id, val) {
  const p = data.projects.find(p => p.id === id);
  if (p) {
    p.pct = parseInt(val);
    const el = document.getElementById('proj-pct-' + id); if (el) el.textContent = val + '%';
    const bar = document.getElementById('proj-bar-' + id); if (bar) bar.style.width = val + '%';
    renderProjectChart();
    await db.from('projects').update({ pct: p.pct }).eq('id', id);
  }
}
function renderProjects() {
  const el = document.getElementById('projects-list'); if (!el) return;
  if (!data.projects.length) { el.innerHTML = '<div class="empty-state text-center text-on-surface-variant italic py-8">No projects yet.</div>'; return; }
  el.innerHTML = data.projects.map(p => `
    <div class="bg-white/5 border border-white/10 rounded-lg p-4 group">
      <div class="flex justify-between items-start mb-2">
        <div class="font-body-md text-on-surface font-semibold">${p.name}</div>
        <div class="flex gap-2">
          <span class="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded ${p.status === 'active' ? 'bg-green-400/10 text-green-400 border border-green-400/30' : p.status === 'paused' ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30' : 'bg-blue-400/10 text-blue-400 border border-blue-400/30'}">${p.status}</span>
          <button class="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-red-400 transition-all" onclick="deleteProject('${p.id}')">
            <span class="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>
      ${p.desc ? `<div class="text-xs text-on-surface-variant mb-3 line-clamp-2">${p.desc}</div>` : ''}
      <div class="flex justify-between items-center text-[10px] text-on-surface-variant mb-1 uppercase tracking-widest">
        <span>Progress</span>
        <span id="proj-pct-${p.id}">${p.pct}%</span>
      </div>
      <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-3">
        <div id="proj-bar-${p.id}" class="h-full bg-secondary transition-all duration-500" style="width:${p.pct}%"></div>
      </div>
      <input type="range" min="0" max="100" value="${p.pct}" class="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary" oninput="updateProjectPct('${p.id}',this.value)">
    </div>
  `).join('');
}

// ========== EVENTS ==========
async function addEvent() {
  const name = document.getElementById('e-name').value.trim(); if (!name) return toast('Enter event name');
  const e = {
    name,
    date: document.getElementById('e-date').value,
    time: document.getElementById('e-time').value,
    cat: document.getElementById('e-cat').value,
    notes: document.getElementById('e-notes').value
  };
  const { data: res, error } = await db.from('events').insert(e).select();
  if (!error && res) {
    data.events.push(res[0]);
    ['e-name', 'e-notes'].forEach(id => document.getElementById(id).value = '');
    selectECat('personal', 'favorite', 'Personal'); 
    renderEvents(); renderEventsChart(); toast('Event added ✓');
  }
}
async function deleteEvent(id) {
  data.events = data.events.filter(e => e.id !== id);
  renderEvents(); renderEventsChart();
  await db.from('events').delete().eq('id', id);
}
function renderEvents() {
  const el = document.getElementById('events-list'); if (!el) return;
  if (!data.events.length) { el.innerHTML = '<div class="empty-state text-center text-on-surface-variant italic py-8">No events captured.</div>'; return; }
  el.innerHTML = [...data.events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map(e => `
    <div class="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center gap-4 group">
      <div class="flex-shrink-0 text-center w-12 border-r border-white/10 pr-4">
        <div class="font-body-md text-on-surface font-bold">${e.time || '—'}</div>
        <div class="text-[8px] text-on-surface-variant uppercase tracking-tighter">${e.date}</div>
      </div>
      <div class="flex-grow">
        <div class="font-body-md text-on-surface">${e.name}</div>
        <div class="flex gap-2 mt-1 items-center">
          <span class="flex items-center gap-1 text-[9px] uppercase tracking-widest text-secondary px-1.5 py-0.5 rounded border border-secondary/30 bg-secondary/5">
            <span class="material-symbols-outlined text-[10px]">${CAT_ICONS[e.cat] || 'category'}</span>
            ${e.cat}
          </span>
          ${e.notes ? `<span class="text-[10px] text-on-surface-variant italic">${e.notes}</span>` : ''}
        </div>
      </div>
      <button class="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-red-400 transition-all" onclick="deleteEvent('${e.id}')">
        <span class="material-symbols-outlined text-[16px]">delete</span>
      </button>
    </div>
  `).join('');
}

// ========== HOBBIES ==========
async function addHobby() {
  const name = document.getElementById('hobby-name').value.trim(); if (!name) return toast('Enter hobby name');
  const mins = parseInt(document.getElementById('hobby-mins').value) || 0;
  const streak = parseInt(document.getElementById('hobby-streak').value) || 0;

  const ex = data.hobbies.find(h => h.name.toLowerCase() === name.toLowerCase());
  let hId = ex ? ex.id : null;
  if (ex) {
    ex.mins = mins || ex.mins;
    ex.streak = streak || ex.streak;
  } else {
    const { data: res } = await db.from('hobbies').insert({ name, mins, streak }).select();
    if (res && res[0]) {
      data.hobbies.push(res[0]);
    }
  }

  ['hobby-name', 'hobby-mins', 'hobby-streak'].forEach(id => document.getElementById(id).value = '');
  renderHobbies(); toast('Hobby logged ✓');

  if (ex) {
    await db.from('hobbies').update({ mins: ex.mins, streak: ex.streak }).eq('id', ex.id);
  }
}
async function deleteHobby(id) {
  data.hobbies = data.hobbies.filter(h => h.id !== id);
  renderHobbies();
  await db.from('hobbies').delete().eq('id', id);
}
function renderHobbies() {
  const el = document.getElementById('hobby-list'); if (!el) return;
  if (!data.hobbies.length) { el.innerHTML = '<div class="empty-state" style="padding:1rem">No hobbies yet.</div>'; return; }
  el.innerHTML = data.hobbies.map(h => `<div class="hobby-item"><div class="hobby-row"><div class="hobby-name">${h.name}</div><div class="hobby-time flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">schedule</span> ${h.mins}m</div><div class="hobby-streak flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">local_fire_department</span> ${h.streak}d</div><button class="task-del" onclick="deleteHobby('${h.id}')">✕</button></div><div class="progress-bar-wrap"><div class="progress-bar" style="width:${Math.min(100, h.mins / 120 * 100)}%;background:linear-gradient(90deg,var(--green-dim),var(--olive))"></div></div></div>`).join('');
}

// ========== SOCIAL ==========
const SOCIAL_APPS = { 
  'ig-slider': { name: 'Instagram', color: '#e1306c' }, 
  'sl-slider': { name: 'Slack', color: '#4a154b' }, 
  'bk-slider': { name: 'Books', color: '#fbc02d' },
  'tw-slider': { name: 'Twitter/X', color: '#1da1f2' }, 
  'yt-slider': { name: 'YouTube', color: '#ff4444' } 
};

async function updateSocial(key, sliderId, labelId) {
  const range = document.getElementById(sliderId);
  if (!range) return;
  const val = parseInt(range.value, 10) || 0;
  
  // Update label
  let hr = Math.floor(val / 60);
  let min = val % 60;
  let txt = hr > 0 ? `${hr}h ${min}m` : `${min}m`;
  const labelEl = document.getElementById(labelId);
  if (labelEl) labelEl.textContent = txt;
  
  // Update progress bar
  const bar = document.getElementById('bar-' + key);
  if (bar) {
    let max = parseInt(range.max, 10) || 100;
    let pct = (val / max) * 100;
    bar.style.width = pct + '%';
  }
  
  // Update total
  const sliderIds = ['ig-slider', 'sl-slider', 'bk-slider'];
  let total = 0;
  sliderIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) total += parseInt(el.value, 10) || 0;
  });
  let tHr = Math.floor(total / 60);
  let tMin = total % 60;
  let tTxt = tHr > 0 ? `${tHr}h ${tMin}m Total` : `${tMin}m Total`;
  const totalEl = document.getElementById('total-social-time');
  if (totalEl) totalEl.textContent = tTxt;

  // Persist to data and Supabase
  if (!data.socialData) data.socialData = {};
  data.socialData[sliderId] = val;
  
  updateScreenRing(); 
  if (typeof renderSocialBarChart === 'function') renderSocialBarChart();

  await db.from('social_data').upsert({ app_id: sliderId, minutes: val });
}

function initSocialBars() {
  const socialConfig = [
    { key: 'ig', slider: 'ig-slider', time: 'ig-time' },
    { key: 'sl', slider: 'sl-slider', time: 'sl-time' },
    { key: 'bk', slider: 'bk-slider', time: 'bk-time' }
  ];
  
  let total = 0;
  socialConfig.forEach(cfg => {
    const range = document.getElementById(cfg.slider);
    if (range) {
      const val = parseInt(range.value, 10) || 0;
      total += val;
      
      // Update label
      let hr = Math.floor(val / 60);
      let min = val % 60;
      let txt = hr > 0 ? `${hr}h ${min}m` : `${min}m`;
      const labelEl = document.getElementById(cfg.time);
      if (labelEl) labelEl.textContent = txt;
      
      // Update bar
      const bar = document.getElementById('bar-' + cfg.key);
      if (bar) {
        let max = parseInt(range.max, 10) || 100;
        let pct = (val / max) * 100;
        bar.style.width = pct + '%';
      }
    }
  });
  
  // Total
  let tHr = Math.floor(total / 60);
  let tMin = total % 60;
  let tTxt = tHr > 0 ? `${tHr}h ${tMin}m Total` : `${tMin}m Total`;
  const totalEl = document.getElementById('total-social-time');
  if (totalEl) totalEl.textContent = tTxt;
  
  updateScreenRing();
}

function updateScreenRing() {
  let total = 0;
  ['ig-slider', 'sl-slider', 'bk-slider'].forEach(id => { 
    total += parseInt(document.getElementById(id)?.value || 0); 
  });
  const hours = (total / 60).toFixed(1);
  const ringTotal = document.getElementById('ring-total');
  if (ringTotal) ringTotal.textContent = hours + 'h';
  
  const qsScreen = document.getElementById('qs-screen');
  if (qsScreen) qsScreen.textContent = hours + 'h';
  const sidebarScreen = document.getElementById('sidebar-qs-screen');
  if (sidebarScreen) sidebarScreen.textContent = hours + 'h';

  const goal = parseFloat(document.getElementById('screen-goal')?.value || 6) * 60;
  const ringCircle = document.getElementById('ring-circle');
  if (ringCircle) ringCircle.style.strokeDashoffset = 264 - Math.min(1, total / goal) * 264;
  
  const legend = document.getElementById('ring-legend');
  if (legend) {
    const items = Object.entries(SOCIAL_APPS).map(([id, app]) => { 
      const v = parseInt(document.getElementById(id)?.value || 0); 
      if (!v) return ''; 
      return `<div class="ring-legend-item"><div class="legend-dot" style="background:${app.color}"></div><span>${app.name}</span><span style="margin-left:auto;color:var(--olive);font-weight:500">${v}m</span></div>`; 
    }).filter(Boolean).join('');
    legend.innerHTML = items || '<div style="font-size:0.8rem;color:var(--text-faint);font-style:italic">No social logged yet.</div>';
  }
}

function saveScreenData() { updateScreenRing(); toast('Screen data saved ✓'); }

// ========== SAVE TODAY ==========
async function saveTodayEntry() {
  const today = new Date(), iso = today.toISOString().split('T')[0];
  const dateStr = `${DD[today.getDay()]}, ${MM[today.getMonth()]} ${today.getDate()}`;
  data.today.remark = document.getElementById('daily-remark').value;
  data.today.gratitude = document.getElementById('gratitude').value;
  data.today.oneWord = document.getElementById('one-word').value;
  data.today.productive = document.getElementById('h-productive').value;

  const entry = {
    date: iso,
    dateStr,
    mood: data.today.mood,
    weather: data.today.weather,
    rating: data.today.rating,
    remark: data.today.remark,
    gratitude: data.today.gratitude,
    oneWord: data.today.oneWord,
    tasks: data.tasks.filter(t => t.done).map(t => t.name),
    energy: data.today.energy,
    focus: data.today.focus,
    productive: data.today.productive
  };

  const idx = data.entries.findIndex(e => e.date === iso);
  if (idx >= 0) data.entries[idx] = entry; else data.entries.unshift(entry);
  buildCalStrip(); renderTrendChart(); updateStreak(); toast("Entry saved! ✨");

  await db.from('entries').upsert({
    date: iso,
    date_str: dateStr,
    mood: entry.mood,
    weather: entry.weather,
    rating: entry.rating,
    remark: entry.remark,
    gratitude: entry.gratitude,
    one_word: entry.oneWord,
    tasks: entry.tasks,
    energy: entry.energy,
    focus: entry.focus,
    productive: entry.productive
  });
}

// ========== LOG ==========
function renderLog() {
  const tbody = document.getElementById('ref-tbody'), search = (document.getElementById('ref-search')?.value || '').toLowerCase();
  if (!tbody) return;
  let entries = [...data.entries];
  if (search) entries = entries.filter(e => (e.dateStr || '').toLowerCase().includes(search) || (e.remark || '').toLowerCase().includes(search) || (e.tasks || []).join(' ').toLowerCase().includes(search));
  document.getElementById('ref-count').textContent = entries.length + ' entries';
  tbody.innerHTML = entries.length
    ? entries.map(e => `
      <tr class="group hover:bg-white/[0.02] transition-colors border-b border-white/5">
        <td class="py-4 pl-2">
          <div class="font-semibold text-on-surface">${e.dateStr}</div>
          <div class="text-[10px] text-on-surface-variant uppercase tracking-widest">${e.weather || ''}</div>
        </td>
        <td class="py-4">
          <div class="flex flex-wrap gap-1 max-w-xs">
            ${(e.tasks || []).map(t => `<span class="bg-secondary/10 text-secondary text-[9px] px-1.5 py-0.5 rounded border border-secondary/20">${t}</span>`).join('') || '<span class="text-on-surface-variant italic">—</span>'}
          </div>
        </td>
        <td class="py-4">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-[18px]">${MOOD_ICONS[e.mood] || 'sentiment_satisfied'}</span>
            <span class="text-sm font-newsreader italic text-on-surface">${e.mood || '—'}</span>
          </div>
        </td>
        <td class="py-4">
          <div class="flex items-center gap-1">
            <span class="text-secondary font-h3 text-lg font-bold">${e.rating || '—'}</span>
            <span class="text-[10px] text-on-surface-variant">/10</span>
          </div>
        </td>
        <td class="py-4 pr-2">
          <div class="text-on-surface-variant italic max-w-sm line-clamp-2 hover:line-clamp-none transition-all">${e.remark || '—'}</div>
          ${e.gratitude ? `<div class="text-[10px] text-secondary mt-1 flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">favorite</span>${e.gratitude}</div>` : ''}
        </td>
      </tr>
    `).join('')
    : `<tr><td colspan="5"><div class="empty-state text-center text-on-surface-variant italic py-12">${search ? 'No matching entries.' : 'No entries yet.'}</div></td></tr>`;
  // stats
  const rated = entries.filter(e => e.rating);
  document.getElementById('avg-rating-num').textContent = rated.length ? (rated.reduce((a, b) => a + b.rating, 0) / rated.length).toFixed(1) : '—';
  const totalTasks = entries.reduce((a, e) => a + (e.tasks?.length || 0), 0);
  const statsEl = document.getElementById('ref-stats');
  if (statsEl) statsEl.innerHTML = entries.length ? `<div style="display:flex;justify-content:space-between;font-size:0.8rem;padding:0.35rem 0;border-bottom:1px solid var(--border)"><span style="color:var(--text-faint)">Days logged</span><strong>${entries.length}</strong></div><div style="display:flex;justify-content:space-between;font-size:0.8rem;padding:0.35rem 0;border-bottom:1px solid var(--border)"><span style="color:var(--text-faint)">Tasks done</span><strong>${totalTasks}</strong></div><div style="display:flex;justify-content:space-between;font-size:0.8rem;padding:0.35rem 0"><span style="color:var(--text-faint)">Avg prod hrs</span><strong>${entries.filter(e => e.productive).length ? (entries.filter(e => e.productive).reduce((a, e) => a + parseFloat(e.productive || 0), 0) / entries.filter(e => e.productive).length).toFixed(1) + 'h' : '—'}</strong></div>` : '';
  const moodEl = document.getElementById('mood-freq');
  if (moodEl) { 
    const mc = {}; entries.forEach(e => { if (e.mood) mc[e.mood] = (mc[e.mood] || 0) + 1; }); 
    moodEl.innerHTML = Object.entries(mc).sort((a, b) => b[1] - a[1]).map(([m, c]) => `
      <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.82rem">
        <span class="material-symbols-outlined text-secondary text-[16px]">${MOOD_ICONS[m] || 'sentiment_satisfied'}</span>
        <span style="color:var(--text-faint)">${m}</span>
        <strong style="color:var(--text)">${c}×</strong>
      </div>
    `).join('') || '<div style="font-size:0.82rem;color:var(--text-faint);font-style:italic">No moods yet.</div>'; 
  }
  renderLogRatingChart(entries);
}

// ========== CHARTS ==========
function drawLineSVG(svgId, pts, color) {
  const svg = document.getElementById(svgId); if (!svg) return;
  const rect = svg.parentElement?.getBoundingClientRect() || { width: 300, height: 160 };
  const W = Math.max(rect.width, 200), H = 160;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = '';
  if (!pts || pts.length < 2) { svg.innerHTML = `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="#88ab80" font-size="11" font-style="italic" font-family="Lora,serif">Not enough data yet</text>`; return; }
  const p = { t: 20, r: 12, b: 28, l: 28 };
  const iw = W - p.l - p.r, ih = H - p.t - p.b;
  const maxV = Math.max(...pts.map(x => x.y), 1);
  const xs = pts.map((_, i) => p.l + i * (iw / Math.max(pts.length - 1, 1)));
  const ys = pts.map(x => p.t + ih - (x.y / maxV) * ih);
  const pathD = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const fillD = pathD + ` L${xs[xs.length - 1].toFixed(1)},${(p.t + ih).toFixed(1)} L${p.l},${(p.t + ih).toFixed(1)} Z`;
  const gid = 'g' + Math.random().toString(36).slice(2);
  svg.innerHTML = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.22"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${fillD}" fill="url(#${gid})"/><path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${xs.map((x, i) => `<circle cx="${x.toFixed(1)}" cy="${ys[i].toFixed(1)}" r="3.5" fill="${color}"/><text x="${x.toFixed(1)}" y="${(H - 6).toFixed(1)}" text-anchor="middle" font-size="9" fill="#88ab80">${pts[i].label}</text>`).join('')}`;
}

function renderTrendChart() {
  const now = new Date(), pts = [];
  for (let i = 13; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); const iso = d.toISOString().split('T')[0]; const e = data.entries.find(x => x.date === iso); if (e && e.rating) pts.push({ y: e.rating, label: String(d.getDate()) }); }
  drawLineSVG('trend-svg', pts, '#8fb86e');
}
function renderLogRatingChart(entries) {
  const pts = [...entries].slice(0, 14).reverse().filter(e => e.rating).map(e => ({ y: e.rating, label: e.dateStr?.split(',')[0] || '' }));
  drawLineSVG('log-rating-svg', pts, '#8fb86e');
}

function drawBarChart(barId, xId, vals, colorFn) {
  const bar = document.getElementById(barId), xEl = document.getElementById(xId);
  if (!bar) return; bar.innerHTML = ''; if (xEl) xEl.innerHTML = '';
  if (!vals.length) { bar.innerHTML = '<div style="width:100%;display:flex;align-items:center;justify-content:center;font-size:0.82rem;color:var(--text-faint);font-style:italic">No data yet</div>'; return; }
  const max = Math.max(...vals.map(v => v.y), 1);
  vals.forEach(v => {
    const pct = v.y / max * 100;
    const col = document.createElement('div');
    col.className = 'chart-bar-col';
    const bg = colorFn ? colorFn(v) : 'linear-gradient(180deg,var(--olive),var(--olive-dim))';
    col.innerHTML = `<div class="chart-bar" style="height:${Math.max(pct, 2)}%;background:${bg}" data-tip="${v.label}: ${v.y}"></div>`;
    bar.appendChild(col);
    if (xEl) { const xl = document.createElement('div'); xl.className = 'chart-x-label'; xl.textContent = v.shortLabel || v.label; xEl.appendChild(xl); }
  });
}

function drawContributionGraph(containerId, vals, baseColor) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  container.className = "flex flex-row gap-1 justify-center";
  
  const max = Math.max(...vals.map(v => v.y), 1);
  const weeks = [];
  for (let i = 0; i < vals.length; i += 7) {
    weeks.push(vals.slice(i, i + 7));
  }
  
  weeks.forEach(week => {
    const col = document.createElement('div');
    col.className = "flex flex-col gap-1";
    week.forEach(v => {
      const square = document.createElement('div');
      square.className = "w-[12px] h-[12px] md:w-[14px] md:h-[14px] rounded-[2px] transition-all duration-300 hover:scale-125 cursor-help";
      
      let opacity = 0.05;
      if (v.y > 0) {
        const level = Math.min(Math.ceil((v.y / max) * 4), 4);
        opacity = 0.2 + (level * 0.2);
      }
      
      square.style.backgroundColor = v.y > 0 ? baseColor : 'rgba(255,255,255,0.05)';
      square.style.opacity = opacity;
      square.setAttribute('data-tip', `${v.label}: ${v.y} completed`);
      col.appendChild(square);
    });
    container.appendChild(col);
  });
}

function renderTaskChart() {
  const now = new Date(), vals = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); const iso = d.toISOString().split('T')[0]; vals.push({ y: data.tasks.filter(t => t.date === iso && t.done).length, label: `${DD[d.getDay()]} ${d.getDate()}`, shortLabel: DD[d.getDay()] }); }
  drawBarChart('task-bar-chart', 'task-bar-x', vals);
}

function renderSocialBarChart() {
  const vals = Object.entries(SOCIAL_APPS).map(([id, app]) => ({ y: parseInt(document.getElementById(id)?.value || 0), label: app.name, shortLabel: app.name.split('/')[0].substring(0, 5), color: app.color })).filter(v => v.y > 0);
  drawBarChart('social-bar-chart', 'social-bar-x', vals, v => `linear-gradient(180deg,${v.color}cc,${v.color}55)`);
}

function renderProjectChart() {
  const wrap = document.getElementById('project-chart-wrap'); if (!wrap) return;
  wrap.innerHTML = '';
  if (!data.projects.length) { wrap.innerHTML = '<div style="font-size:0.82rem;color:var(--text-faint);font-style:italic">No projects yet.</div>'; return; }
  data.projects.forEach(p => {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0.5rem;flex:1;min-width:80px;max-width:130px';
    const fillH = (p.pct / 100) * 120;
    col.innerHTML = `<div style="position:relative;width:100%;height:120px;background:var(--surface2);border-radius:6px;overflow:hidden;border:1px solid var(--border)"><div style="position:absolute;bottom:0;left:0;right:0;height:${fillH}px;background:linear-gradient(180deg,var(--olive),var(--olive-dim));border-radius:4px;transition:height 0.5s"></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:0.9rem;font-weight:700;color:var(--olive)">${p.pct}%</div></div><div style="font-size:0.7rem;color:var(--text-dim);text-align:center;line-height:1.3;max-width:100px">${p.name}</div><span class="project-status ${p.status}">${p.status}</span>`;
    wrap.appendChild(col);
  });
}

function renderEventsChart() {
  const wrap = document.getElementById('events-chart-wrap'); if (!wrap) return;
  wrap.innerHTML = '';
  if (!data.events.length) { wrap.innerHTML = '<div style="font-size:0.82rem;color:var(--text-faint);font-style:italic">No events yet.</div>'; return; }
  const cats = { 
    personal: { icon: 'favorite', color: '#d0be60', label: 'Personal' }, 
    work: { icon: 'work', color: '#7ab0e0', label: 'Work' }, 
    social: { icon: 'groups', color: '#8fb86e', label: 'Social' }, 
    health: { icon: 'fitness_center', color: '#52c27e', label: 'Health' }, 
    other: { icon: 'push_pin', color: '#628a5a', label: 'Other' } 
  };
  const counts = {}; data.events.forEach(e => counts[e.cat] = (counts[e.cat] || 0) + 1);
  Object.entries(counts).forEach(([cat, cnt]) => {
    const c = cats[cat] || { icon: 'category', label: cat, color: '#6a8c62' };
    const circ = 94.2, pct = cnt / data.events.length;
    wrap.innerHTML += `<div style="display:flex;flex-direction:column;align-items:center;gap:0.5rem"><div style="position:relative;width:50px;height:50px"><svg viewBox="0 0 36 36" style="width:100%;height:100%;transform:rotate(-90deg)"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--surface2)" stroke-width="3"></circle><circle cx="18" cy="18" r="15" fill="none" stroke="${c.color}" stroke-width="3" stroke-dasharray="${circ}" stroke-dashoffset="${circ - (circ*pct)}" style="transition:stroke-dashoffset 1s ease-out"></circle></svg><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:var(--text)"><span class="material-symbols-outlined text-[16px]">${c.icon}</span></div></div><span style="font-size:0.7rem;color:var(--text-dim);font-weight:600">${c.label}</span></div>`;
  });
}

function renderProgressPage() {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  // Helper to extract data from entries and today_state
  const getVal = (dateStr, key) => {
    const todayStr = new Date().toISOString().split('T')[0];
    let raw = 0;
    if (dateStr === todayStr && data.today[key] !== undefined) {
      raw = data.today[key];
    } else {
      const entry = data.entries.find(e => e.date === dateStr || e.dateStr === dateStr);
      raw = entry ? entry[key] : 0;
    }

    if (key === 'mood') {
      const map = { 'Centered': 5, 'Flowing': 4, 'Light': 3, 'Restless': 2, 'Heavy': 1 };
      return map[raw] || 0;
    }
    
    if (typeof raw === 'string') {
        if (key === 'sleep' && raw.includes('h')) {
          let parts = raw.split('h');
          return (parseFloat(parts[0]) || 0) + ((parseFloat(parts[1]) || 0) / 60);
        }
        return parseFloat(raw.replace(/[^\d.]/g, '')) || 0;
    }
    return parseFloat(raw) || 0;
  };

  const getTaskCount = (dateStr, keyword) => {
    return data.tasks.filter(t => 
      (t.date === dateStr || t.due === dateStr) && 
      (t.done || t.status === 'done') && 
      t.name.toLowerCase().includes(keyword.toLowerCase())
    ).length;
  };

  const stepsVals = dates.map(d => ({ label: d, shortLabel: d.substring(5), y: getVal(d, 'steps') }));
  drawBarChart('prog-steps-chart', 'prog-steps-labels', stepsVals, () => 'linear-gradient(180deg, #d0be60cc, #d0be6055)');

  const waterVals = dates.map(d => ({ label: d, shortLabel: d.substring(5), y: getVal(d, 'water') }));
  drawBarChart('prog-water-chart', 'prog-water-labels', waterVals, () => 'linear-gradient(180deg, #60a5facc, #60a5fa55)');

  const sleepVals = dates.map(d => ({ label: d, shortLabel: d.substring(5), y: getVal(d, 'sleep') }));
  drawBarChart('prog-sleep-chart', 'prog-sleep-labels', sleepVals, () => 'linear-gradient(180deg, #818cf8cc, #818cf855)');

  const exerciseVals = dates.map(d => ({ label: d, shortLabel: d.substring(5), y: getVal(d, 'exercise') }));
  drawBarChart('prog-exercise-chart', 'prog-exercise-labels', exerciseVals, () => 'linear-gradient(180deg, #4ade80cc, #4ade8055)');

  // Contribution data (8 weeks = 56 days)
  const contributionDates = [];
  for (let i = 55; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    contributionDates.push(d.toISOString().split('T')[0]);
  }

  // Dynamically identify rhythms from habits
  const habitNames = [...new Set(data.tasks.filter(t => t.cat === 'habit').map(t => t.name))];
  const container = document.getElementById('rhythms-container');
  container.innerHTML = '';

  if (habitNames.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-on-surface-variant italic border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
        <span class="material-symbols-outlined block text-4xl mb-4 opacity-30">eco</span>
        Define your habits in the main dashboard to start tracking rhythms.
      </div>
    `;
  }

  habitNames.forEach((name, index) => {
    const safeId = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const color = RHYTHM_COLORS[index % RHYTHM_COLORS.length];
    const icon = RHYTHM_ICONS[name.toLowerCase()] || RHYTHM_ICONS[Object.keys(RHYTHM_ICONS).find(k => name.toLowerCase().includes(k))] || 'eco';

    const card = document.createElement('div');
    card.className = "bg-white/[0.05] backdrop-blur-[20px] border border-outline-variant/30 rounded-xl p-6 bento-card";
    card.innerHTML = `
      <div class="flex justify-between items-center mb-6">
        <span class="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">${name}</span>
        <span class="material-symbols-outlined text-[20px]" style="color: ${color}">${icon}</span>
      </div>
      <div id="prog-${safeId}-chart" class="min-h-[120px] flex items-center justify-center"></div>
      <div class="mt-4 flex justify-between text-[8px] font-label-caps text-on-surface-variant/40 uppercase tracking-widest">
        <span>Last 8 Weeks</span>
        <span>Today</span>
      </div>
    `;
    container.appendChild(card);
    
    const vals = contributionDates.map(d => ({ label: d, y: getTaskCount(d, name) }));
    drawContributionGraph(`prog-${safeId}-chart`, vals, color);
  });
}

// ========== EXPORT ==========
function exportCSV() {
  if (!data.entries.length) return toast('No entries to export');
  const h = ['Date', 'Mood', 'Weather', 'Rating', 'Tasks Done', 'Remarks', 'Gratitude'];
  const rows = data.entries.map(e => [e.dateStr, e.mood || '', e.weather || '', e.rating || '', (e.tasks || []).join('; '), (e.remark || '').replace(/,/g, ';'), e.gratitude || '']);
  const csv = [h, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'my-journal.csv'; a.click();
  toast('Exported ✓');
}

// ========== TOAST ==========
function toast(msg) { const el = document.getElementById('toast'); el.textContent = msg; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2800); }

// ========== MEMORY UTILS ==========
function getSanitizedImages(image_url) {
  if (!image_url) return [];
  
  // NEW FORMAT: Pipe separated
  if (image_url.includes('|')) {
    return image_url.split('|').map(u => u.trim()).filter(u => u);
  }
  
  // LEGACY FORMAT: Comma separated (tricky due to Base64 data URLs)
  const rawParts = image_url.split(',').map(u => u.trim()).filter(u => u);
  const images = [];
  let current = "";
  
  for (const part of rawParts) {
    // If it starts with a protocol, it's a new image
    if (part.toLowerCase().startsWith('data:') || 
        part.toLowerCase().startsWith('http') || 
        part.toLowerCase().startsWith('blob:')) {
      if (current) images.push(current);
      current = part;
    } else {
      // Otherwise, it's the data part of a Base64 string that got split
      current += (current ? ',' : '') + part;
    }
  }
  if (current) images.push(current);
  return images.filter(img => img.length > 10); // Filter out tiny junk
}

function collectImagesFromContainer(containerId) {
  const images = [];
  const container = document.getElementById(containerId);
  if (!container) return [];
  
  container.querySelectorAll('.m-image-input-group').forEach(group => {
    const urlInput = group.querySelector('.m-image-url-input');
    const preview = group.querySelector('.m-preview-v2');
    
    if (preview && preview.src && preview.src.startsWith('data:image')) {
      images.push(preview.src);
    } else if (urlInput && urlInput.value.trim()) {
      images.push(urlInput.value.trim());
    }
  });
  return images.filter(i => i);
}

function createImageInputGroup(containerId, initialValue = '', isBase64 = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const group = document.createElement('div');
  group.className = 'm-image-input-group flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300';
  
  const isFilled = initialValue && isBase64;
  const isUrl = initialValue && !isBase64;

  group.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center gap-4 ${isFilled ? 'hidden' : ''}">
      <label class="flex-grow flex items-center justify-center gap-2 bg-white/5 border border-dashed border-white/20 rounded-xl p-4 cursor-pointer hover:bg-white/10 hover:border-secondary/50 transition-all group">
        <span class="material-symbols-outlined text-on-surface-variant group-hover:text-secondary">upload_file</span>
        <span class="text-xs text-on-surface-variant group-hover:text-on-surface">Upload</span>
        <input type="file" accept="image/*" class="hidden" onchange="handleMemoryFileV2(this)">
      </label>
      <div class="text-on-surface-variant text-[10px] uppercase text-center">or</div>
      <input type="text" placeholder="Image URL..." value="${isUrl ? initialValue : ''}" class="m-image-url-input flex-grow bg-white/5 border border-white/10 rounded-xl p-4 text-on-surface focus:border-secondary focus:ring-0 text-sm">
      <button onclick="removeImageInputV2(this, '${containerId}')" class="text-stone-500 hover:text-red-400 transition-colors self-end md:self-auto">
        <span class="material-symbols-outlined">delete</span>
      </button>
    </div>
    <div class="m-preview-container-v2 ${isFilled ? '' : 'hidden'}">
      <div class="relative w-full h-32 rounded-xl overflow-hidden border border-white/10">
        <img class="m-preview-v2 w-full h-full object-cover" src="${isFilled ? initialValue : ''}">
        <button onclick="removeImageInputV2(this, '${containerId}')" class="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/80 transition-colors">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  `;
  container.appendChild(group);
}

function removeImageInputV2(btn, containerId) {
  const group = btn.closest('.m-image-input-group');
  const container = document.getElementById(containerId);
  if (container.querySelectorAll('.m-image-input-group').length > 1) {
    group.remove();
  } else {
    // Just clear it
    const urlInput = group.querySelector('.m-image-url-input');
    const previewImg = group.querySelector('.m-preview-v2');
    const previewCont = group.querySelector('.m-preview-container-v2');
    const inputRow = group.querySelector('.flex');
    if (urlInput) urlInput.value = '';
    if (previewImg) previewImg.src = '';
    if (previewCont) previewCont.classList.add('hidden');
    if (inputRow) inputRow.classList.remove('hidden');
  }
}

function handleMemoryFileV2(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    const group = input.closest('.m-image-input-group');
    const previewImg = group.querySelector('.m-preview-v2');
    const previewCont = group.querySelector('.m-preview-container-v2');
    const urlInput = group.querySelector('.m-image-url-input');
    const inputRow = group.querySelector('.flex');

    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewCont.classList.remove('hidden');
      if (inputRow) inputRow.classList.add('hidden');
      if (urlInput) urlInput.value = ''; // Clear URL if file uploaded
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// ========== MEMORIES ==========
function renderMemories() {
  const container = document.getElementById('memory-grid');
  if (!container) return;
  
  if (data.memories.length === 0) {
    container.innerHTML = '<div class="col-span-full py-20 text-center text-stone-500 italic">No memories captured yet. Land a thought or image here.</div>';
    return;
  }
  
  container.innerHTML = '';
  try {
    data.memories.forEach((mem, idx) => {
      // Determine card span logic for bento grid
      let spanClass = 'col-span-1';
      if (idx % 5 === 0) spanClass = 'col-span-1 md:col-span-2 lg:col-span-1 row-span-2';
      if (idx % 5 === 3) spanClass = 'col-span-1 md:col-span-2';

      const card = document.createElement('div');
      card.className = `glass-panel rounded-xl overflow-hidden flex flex-col h-full group transition-all duration-500 bento-card cursor-pointer ${spanClass}`;
      card.onclick = (e) => {
        if (e.target.closest('button')) return;
        showMemoryDetail(mem.id);
      };
      
      let imgHtml = '';
      const images = getSanitizedImages(mem.image_url);
      if (images.length > 0) {
        const firstImg = images[0];
        const count = images.length;
        imgHtml = `
          <div class="relative ${spanClass.includes('row-span-2') ? 'h-64 md:h-80' : 'h-40'} w-full overflow-hidden">
            <img src="${firstImg}" class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-1000 ease-in-out opacity-80" alt="Memory Image">
            ${count > 1 ? `<div class="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">filter</span> +${count-1}</div>` : ''}
            <div class="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
          </div>
        `;
      }

      const date = new Date(mem.created_at || Date.now());
      const dateStr = `${MM[date.getMonth()]} ${date.getDate()}${getOrdinal(date.getDate())}`;

      card.innerHTML = `
        ${imgHtml}
        <div class="p-8 flex flex-col flex-grow relative z-10 text-center ${mem.image_url ? 'bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent -mt-20 pt-24' : ''}">
          <div class="flex items-center justify-between mb-6">
            <div class="w-8"></div>
            <span class="font-label-caps text-[10px] text-stone-100 tracking-widest uppercase border-b border-stone-100/20 pb-1">${dateStr}</span>
            <button onclick="deleteMemory('${mem.id}')" class="gsap-btn text-stone-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
          
          <div class="flex-grow flex flex-col items-center justify-center gap-2">
            <h3 class="font-newsreader text-xl font-bold text-stone-100 group-hover:text-secondary transition-colors line-clamp-1">
              ${mem.title || 'Untitled Moment'}
            </h3>
            <p class="font-newsreader text-sm leading-relaxed text-stone-400 line-clamp-2 ${mem.is_italic ? 'italic' : ''}">
              ${mem.content || ''}
            </p>
          </div>
          
          ${mem.tags ? `
            <div class="flex flex-wrap justify-center gap-2 mt-8">
              ${mem.tags.split(',').map(tag => tag.trim()).filter(t => t).map(tag => `
                <span class="px-3 py-1 rounded-full border border-outline-variant/30 text-stone-400 font-label-caps text-[10px] uppercase flex items-center gap-1 bg-surface-container-low/30 backdrop-blur-sm">
                  ${tag}
                </span>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
      container.appendChild(card);
    });
    
    initBentoEffect();
    initButtonAnimations();
  } catch (err) {
    console.error("renderMemories Error:", err);
    toast("Error displaying memories. Check console.");
  }
}

function showMemoryDetail(id) {
  const mem = data.memories.find(m => m.id === id);
  if (!mem) return;
  
  currentMemoryId = id;
  toggleMemoryEdit(false);
  
  const imgCont = document.getElementById('mem-detail-image-container');
  const img = document.getElementById('mem-detail-image');
  const title = document.getElementById('mem-detail-title');
  const content = document.getElementById('mem-detail-content');
  const dateEl = document.getElementById('mem-detail-date');
  const tagsEl = document.getElementById('mem-detail-tags');
  
  if (title) title.textContent = mem.title || 'Untitled Moment';
  if (content) {
    content.textContent = mem.content;
    content.className = `font-newsreader text-2xl md:text-3xl text-on-surface/80 leading-relaxed ${mem.is_italic ? 'italic' : ''}`;
  }
  
  const images = getSanitizedImages(mem.image_url);
  if (images.length > 0) {
    img.src = images[0];
    imgCont.classList.remove('hidden');
    
    // If multiple images, show a mini grid/carousel
    if (images.length > 1) {
      const grid = document.createElement('div');
      grid.className = "grid grid-cols-4 gap-2 mt-4 px-8 pb-4";
      images.forEach((url, i) => {
        const thumb = document.createElement('div');
        thumb.className = `h-16 rounded-lg overflow-hidden border ${i === 0 ? 'border-secondary' : 'border-white/10'} cursor-pointer opacity-70 hover:opacity-100 transition-all`;
        thumb.innerHTML = `<img src="${url}" class="w-full h-full object-cover">`;
        thumb.onclick = () => {
          img.src = url;
          grid.querySelectorAll('div').forEach(d => {
            d.classList.remove('border-secondary');
            d.classList.add('border-white/10');
          });
          thumb.classList.remove('border-white/10');
          thumb.classList.add('border-secondary');
        };
        grid.appendChild(thumb);
      });
      // Append grid after the image container
      const existing = document.getElementById('mem-detail-gallery');
      if (existing) existing.remove();
      
      const galleryWrap = document.createElement('div');
      galleryWrap.id = 'mem-detail-gallery';
      galleryWrap.appendChild(grid);
      imgCont.parentNode.insertBefore(galleryWrap, imgCont.nextSibling);
    } else {
      const existing = document.getElementById('mem-detail-gallery');
      if (existing) existing.remove();
    }
  } else {
    imgCont.classList.add('hidden');
    const existing = document.getElementById('mem-detail-gallery');
    if (existing) existing.remove();
  }
  
  const date = new Date(mem.created_at || Date.now());
  dateEl.textContent = `${MM[date.getMonth()]} ${date.getDate()}${getOrdinal(date.getDate())}, ${date.getFullYear()}`;
  
  tagsEl.innerHTML = (mem.tags || '').split(',').map(tag => tag.trim()).filter(t => t).map(tag => `
    <span class="px-4 py-1.5 rounded-full border border-outline-variant/30 text-stone-400 font-label-caps text-xs uppercase bg-surface-container-low/30 backdrop-blur-sm">
      ${tag}
    </span>
  `).join('');
  
  showPage('memory-detail');
}

function toggleMemoryEdit(on) {
  const viewMode = document.getElementById('mem-view-mode');
  const editMode = document.getElementById('mem-edit-mode');
  const editBtn = document.getElementById('mem-edit-btn');
  
  if (on) {
    const mem = data.memories.find(m => m.id === currentMemoryId);
    if (!mem) return;
    
    document.getElementById('edit-mem-title').value = mem.title || '';
    document.getElementById('edit-mem-content').value = mem.content;
    document.getElementById('edit-mem-tags').value = mem.tags || '';
    document.getElementById('edit-mem-italic').checked = mem.is_italic;
    
    const container = document.getElementById('edit-mem-images-container');
    container.innerHTML = '';
    const images = getSanitizedImages(mem.image_url);
    if (images.length === 0) {
      createImageInputGroup('edit-mem-images-container');
    } else {
      images.forEach(url => {
        createImageInputGroup('edit-mem-images-container', url, url.startsWith('data:image'));
      });
    }
    
    viewMode.classList.add('hidden');
    editMode.classList.remove('hidden');
    editBtn.classList.add('hidden');
  } else {
    viewMode.classList.remove('hidden');
    editMode.classList.add('hidden');
    editBtn.classList.remove('hidden');
  }
}

async function saveMemoryEdit() {
  if (!currentMemoryId) return;
  
  const title = document.getElementById('edit-mem-title').value.trim();
  const content = document.getElementById('edit-mem-content').value.trim();
  const tags = document.getElementById('edit-mem-tags').value.trim();
  const isItalic = document.getElementById('edit-mem-italic').checked;
  const images = collectImagesFromContainer('edit-mem-images-container');
  const finalImageUrl = images.join('|');
  
  if (!title && !content) return toast('Please enter a name or description');
  
  const { error } = await db.from('memories').update({
    title,
    content,
    image_url: finalImageUrl || null,
    tags,
    is_italic: isItalic
  }).eq('id', currentMemoryId);
  
  if (error) {
    toast('Error updating memory');
    console.error(error);
  } else {
    toast('Memory refined ✓');
    loadData(); // Refresh everything
    showMemoryDetail(currentMemoryId); // Stay on page and update view
  }
}

async function deleteMemoryFromDetail() {
  if (!currentMemoryId) return;
  const confirmed = await customConfirm("Delete Memory", "This echo will fade forever. Proceed?");
  if (confirmed) {
    const { error } = await db.from('memories').delete().eq('id', currentMemoryId);
    if (error) {
      toast('Error fading memory');
    } else {
      toast('Memory faded ✓');
      loadData();
      showPage('memory');
    }
  }
}

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

async function addMemory() {
  const title = document.getElementById('m-title').value.trim();
  const content = document.getElementById('m-content').value.trim();
  const tags = document.getElementById('m-tags').value.trim();
  const isItalic = document.getElementById('m-italic').checked;

  if (!title && !content) { toast("Please enter a name or description..."); return; }

  const images = collectImagesFromContainer('m-images-container');
  const finalImageUrl = images.join('|');

  const newMem = {
    title,
    content,
    image_url: finalImageUrl || null,
    tags: tags || null,
    is_italic: isItalic,
    user_email: window.currentUserEmail,
    created_at: new Date().toISOString()
  };

  toast("Preserving memory...");
  const { data: savedData, error } = await db.from('memories').insert(newMem).select();
  
  if (error) {
    console.error(error);
    toast("Error saving to database");
    data.memories.unshift({ ...newMem, id: Date.now().toString() });
  } else if (savedData) {
    data.memories.unshift(savedData[0]);
  }

  renderMemories();
  clearMemoryForm();
  toast("Memory captured ✓");
  closeMemoryModal();
}

function addImageInput() {
  createImageInputGroup('m-images-container');
}

function addEditImageInput() {
  createImageInputGroup('edit-mem-images-container');
}

function clearMemoryForm() {
  document.getElementById('m-title').value = '';
  document.getElementById('m-content').value = '';
  document.getElementById('m-tags').value = '';
  document.getElementById('m-italic').checked = true;
  
  const container = document.getElementById('m-images-container');
  container.innerHTML = '';
  createImageInputGroup('m-images-container');
}

async function deleteMemory(id) {
  const confirmed = await customConfirm("Forget Memory?", "Are you sure you want to let this memory go? This action cannot be undone.");
  if (!confirmed) return;
  
  toast("Deleting...");
  const { error } = await db.from('memories').delete().eq('id', id);
  
  if (!error) {
    data.memories = data.memories.filter(m => m.id != id);
    renderMemories();
    toast("Memory deleted");
  } else {
    toast("Error deleting memory");
  }
}

function openMemoryModal() {
  const modal = document.getElementById('memory-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('modal-open');
    if (window.lenis) window.lenis.stop();
  }
}

function closeMemoryModal() {
  const modal = document.getElementById('memory-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.classList.remove('modal-open');
    if (window.lenis) window.lenis.start();
  }
}

function updateStreak() {
  const elNum = document.getElementById('streak-num');
  const elPath = document.getElementById('streak-path');
  if (!elNum || !elPath) return;

  const dates = [...new Set(data.entries.map(e => e.date))].sort().reverse();
  const today = new Date();
  today.setHours(0,0,0,0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let streak = 0;
  if (dates.length > 0) {
    if (dates[0] === todayStr || dates[0] === yesterdayStr) {
      streak = 1;
      let current = new Date(dates[0] + 'T00:00:00');
      for (let i = 1; i < dates.length; i++) {
        let nextExpected = new Date(current);
        nextExpected.setDate(nextExpected.getDate() - 1);
        let nextExpectedStr = nextExpected.toISOString().split('T')[0];
        if (dates[i] === nextExpectedStr) {
          streak++;
          current = nextExpected;
        } else {
          break;
        }
      }
    }
  }

  elNum.textContent = streak;
  const goal = 30;
  const pct = Math.min(100, (streak / goal) * 100);
  elPath.setAttribute('stroke-dasharray', `${pct}, 100`);
}

function initBentoEffect() {
  const cards = document.querySelectorAll('.bento-card');
  cards.forEach(card => {
    if (!card.querySelector('.bento-border')) {
      const border = document.createElement('div');
      border.className = 'bento-border';
      card.appendChild(border);
    }
  });

  if (!window.bentoListenerAdded) {
    window.addEventListener('mousemove', (e) => {
      // Use requestAnimationFrame for smoothness
      requestAnimationFrame(() => {
        const cards = document.querySelectorAll('.bento-card');
        cards.forEach(card => {
          const rect = card.getBoundingClientRect();
          // Use viewport-relative coordinates consistently
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          card.style.setProperty('--mouse-x', `${x}px`);
          card.style.setProperty('--mouse-y', `${y}px`);
        });
      });
    });
    window.bentoListenerAdded = true;
  }
}

function initButtonAnimations() {
  const btns = document.querySelectorAll('.gsap-btn');
  btns.forEach(btn => {
    if (btn.dataset.gsapInited) return;
    
    btn.addEventListener('mouseenter', () => {
      gsap.to(btn, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out"
      });
    });
    
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        scale: 1,
        duration: 0.3,
        ease: "power2.inOut"
      });
    });
    
    btn.dataset.gsapInited = "true";
  });
}

// ========== GROWTH PAGE HELPERS ==========
async function addTaskV2() {
    const name = document.getElementById('taskName').value;
    const date = document.getElementById('taskDate').value;
    const priority = document.getElementById('taskPriority').value;
    const notes = document.getElementById('taskDesc').value;
    
    if (!name) { toast("Enter task name"); return; }
    
    const task = { name, cat: 'task', priority, notes, due: date, done: false, date: date || new Date().toISOString().split('T')[0] };
    toast("Sowing task...");
    const { data: res, error } = await db.from('tasks').insert(task).select();
    if (error) {
        toast("Error saving task: " + error.message);
        console.error("Task insert error:", error);
        return;
    }
    if (res) {
        data.tasks.push(res[0]);
        renderGrowthPage();
        toast("Task added ✓");
        ['taskName', 'taskDate', 'taskDesc'].forEach(id => document.getElementById(id).value = '');
    }
}

async function addEventV2() {
    const name = document.getElementById('eventName').value;
    const datetime = document.getElementById('eventDateTime').value;
    const desc = document.getElementById('eventDesc').value;
    if (!name) { toast("Enter event name"); return; }
    
    const dt = datetime ? new Date(datetime) : new Date();
    const event = { name, date: dt.toISOString().split('T')[0], time: dt.toTimeString().split(' ')[0], notes: desc, cat: 'event' };
    toast("Marking event...");
    const { data: res, error } = await db.from('events').insert(event).select();
    if (error) {
        toast("Error saving event: " + error.message);
        console.error("Event insert error:", error);
        return;
    }
    if (res) {
        data.events.push(res[0]);
        renderGrowthPage();
        toast("Event added ✓");
        ['eventName', 'eventDateTime', 'eventDesc'].forEach(id => document.getElementById(id).value = '');
    }
}

async function addProjectV2() {
    const name = document.getElementById('projectName').value;
    const dateTo = document.getElementById('projectDateTo').value;
    const pct = document.getElementById('projectCompletion').value;
    const desc = document.getElementById('projectDesc').value;
    if (!name) { toast("Enter project name"); return; }
    
    const project = { name, "desc": desc, status: 'active', pct: parseInt(pct), deadline: dateTo, todos: [] };
    toast("Launching project...");
    const { data: res, error } = await db.from('projects').insert(project).select();
    if (error) {
        toast("Error saving project: " + error.message);
        console.error("Project insert error:", error);
        return;
    }
    if (res) {
        data.projects.push(res[0]);
        renderGrowthPage();
        toast("Project added ✓");
        ['projectName', 'projectDateFrom', 'projectDateTo', 'projectDesc'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('projectCompletion').value = 0;
        document.getElementById('completionValue').innerText = '0%';
    }
}

function toggleCompleted() {
    const container = document.getElementById('completedContainer');
    const chevron = document.getElementById('completedChevron');
    if (!container || !chevron) return;
    const isHidden = container.classList.contains('hidden');
    if (isHidden) {
        container.classList.remove('hidden');
        container.classList.add('flex');
        chevron.style.transform = 'rotate(180deg)';
    } else {
        container.classList.add('hidden');
        container.classList.remove('flex');
        chevron.style.transform = 'rotate(0deg)';
    }
}

function renderGrowthPage() {
    generateWeeklyCalendar();
    renderUpcomings();
}

function generateWeeklyCalendar() {
    const calendar = document.getElementById('weekCalendar');
    if (!calendar) return;
    calendar.innerHTML = '';
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    
    for (let i = 0; i < 7; i++) {
        const cur = new Date(start);
        cur.setDate(start.getDate() + i);
        const isToday = cur.toDateString() === today.toDateString();
        const iso = cur.toISOString().split('T')[0];
        const hasActivity = data.tasks.some(t => t.due === iso) || data.events.some(e => e.date === iso);
        
        const dayDiv = document.createElement('div');
        dayDiv.className = `flex-1 flex flex-col items-center p-4 rounded-xl border transition-all ${isToday ? 'bg-secondary/10 border-secondary/40 text-secondary' : 'bg-white/5 border-white/10 text-on-surface-variant'}`;
        dayDiv.innerHTML = `
            <span class="text-[10px] uppercase tracking-widest mb-1 font-semibold">${cur.toLocaleDateString('en-US', { weekday: 'short' })}</span>
            <span class="text-lg font-bold mb-2">${cur.getDate()}</span>
            ${hasActivity ? '<div class="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(230,193,131,0.6)]"></div>' : '<div class="w-1.5 h-1.5"></div>'}
        `;
        calendar.appendChild(dayDiv);
    }
}

function renderUpcomings() {
    const upContainer = document.getElementById('upcomingContainer');
    const compContainer = document.getElementById('completedContainer');
    if (!upContainer || !compContainer) return;

    upContainer.innerHTML = '';
    compContainer.innerHTML = '';

    const allItems = [
        ...data.tasks.map(t => ({...t, type: 'task'})),
        ...data.events.map(e => ({...e, type: 'event'})),
        ...data.projects.map(p => ({...p, type: 'project'}))
    ];

    allItems.sort((a, b) => new Date(a.due || a.date || a.deadline) - new Date(b.due || b.date || b.deadline));

    const upcoming = allItems.filter(i => !i.done && i.status !== 'done');
    const completed = allItems.filter(i => i.done || i.status === 'done');

    if (upcoming.length === 0) {
        upContainer.innerHTML = '<div class="text-center text-on-surface-variant italic py-8">No upcomings yet.</div>';
    } else {
        upcoming.forEach(item => upContainer.appendChild(createItemEl(item)));
    }

    if (completed.length === 0) {
        compContainer.innerHTML = '<div class="text-center text-on-surface-variant italic py-8">No completed items yet.</div>';
    } else {
        completed.forEach(item => compContainer.appendChild(createItemEl(item)));
    }
}

function createItemEl(i) {
    const el = document.createElement('div');
    el.className = `bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-4 group hover:bg-white/10 transition-all ${i.done || i.status === 'done' ? 'opacity-60' : ''}`;
    
    let color = i.type === 'task' ? '#bdcabe' : i.type === 'event' ? '#9f7aea' : '#38b2ac';
    if (i.priority === 'high') color = '#f87171';
    
    let innerHTML = `
        <div class="flex items-center gap-4">
            <div class="w-1 h-8 rounded-full" style="background-color: ${color}"></div>
            <div class="flex-grow">
                <div class="flex items-center gap-2">
                    <span class="text-on-surface font-medium">${i.name}</span>
                    <span class="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border" style="border-color: ${color}44; color: ${color}; background: ${color}11">${i.type}</span>
                </div>
                <div class="text-xs text-on-surface-variant mt-1">${i.due || i.date || i.deadline || 'No date'}</div>
            </div>
            ${i.type === 'project' ? `<div class="text-xs font-semibold text-secondary">${i.pct}%</div>` : ''}
            <div class="flex items-center gap-2">
                ${i.type === 'project' ? `
                <button onclick="toggleProjectCollapse('${i.id}')" class="text-on-surface-variant hover:text-stone-100 transition-all transform ${projectCollapseState[i.id] ? '-rotate-90' : ''}" title="Toggle Tasks">
                    <span class="material-symbols-outlined text-[20px]">expand_more</span>
                </button>
                ` : ''}
                <button onclick="toggleItemDone('${i.id}', '${i.type}')" class="text-on-surface-variant hover:text-secondary transition-colors" title="Toggle Status">
                    <span class="material-symbols-outlined">${i.done || i.status === 'done' ? 'undo' : 'check_circle'}</span>
                </button>
                <button onclick="deleteItem('${i.id}', '${i.type}')" class="text-on-surface-variant hover:text-red-400 transition-colors" title="Delete">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
            </div>
        </div>
    `;

    // Add project todo list UI
    if (i.type === 'project') {
        const todos = i.todos || [];
        
        let todosHtml = `<div id="project-todos-${i.id}" class="mt-1 flex flex-col gap-2 pl-5 border-l-2 border-white/5 transition-all duration-300 ${projectCollapseState[i.id] ? 'hidden' : ''}">`;
        
        todos.forEach((todo, index) => {
            todosHtml += `
                <div class="flex items-center justify-between group/todo mt-1">
                    <div class="flex items-center gap-3 cursor-pointer" onclick="toggleProjectTodo('${i.id}', ${index})">
                        <span class="material-symbols-outlined text-[16px] ${todo.done ? 'text-secondary' : 'text-stone-500'}">
                            ${todo.done ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        <span class="text-sm ${todo.done ? 'text-stone-500 line-through' : 'text-stone-300'}">${todo.text}</span>
                    </div>
                </div>
            `;
        });
        
        // Add new todo input
        todosHtml += `
            <div class="flex items-center gap-3 mt-3">
                <span class="material-symbols-outlined text-[16px] text-stone-600">add_box</span>
                <input type="text" id="new-todo-${i.id}" class="bg-transparent border-b border-white/10 text-sm text-stone-300 focus:outline-none focus:border-secondary transition-colors w-full pb-1" placeholder="Add a sub-task..." onkeypress="if(event.key === 'Enter') addProjectTodo('${i.id}')">
                <button onclick="addProjectTodo('${i.id}')" class="text-[10px] uppercase tracking-widest text-secondary hover:text-white transition-colors">Add</button>
            </div>
        `;
        
        todosHtml += '</div>';
        innerHTML += todosHtml;
    }
    
    el.innerHTML = innerHTML;
    return el;
}

async function addProjectTodo(projectId) {
    const input = document.getElementById(`new-todo-${projectId}`);
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    
    const p = data.projects.find(p => p.id === projectId);
    if (!p) return;
    
    if (!p.todos) p.todos = [];
    p.todos.push({ text: text, done: false });
    
    // Auto calculate pct
    const total = p.todos.length;
    const completed = p.todos.filter(t => t.done).length;
    p.pct = Math.round((completed / total) * 100);
    if (p.pct === 100) p.status = 'done';
    else p.status = 'active';

    toast("Adding task...");
    await db.from('projects').update({ todos: p.todos, pct: p.pct, status: p.status }).eq('id', projectId);
    renderGrowthPage();
}

async function toggleProjectTodo(projectId, index) {
    const p = data.projects.find(p => p.id === projectId);
    if (!p || !p.todos) return;
    p.todos[index].done = !p.todos[index].done;
    
    // Auto calculate pct
    const total = p.todos.length;
    const completed = p.todos.filter(t => t.done).length;
    p.pct = Math.round((completed / total) * 100);
    if (p.pct === 100) p.status = 'done';
    else p.status = 'active';

    renderUpcomings();
    await db.from('projects').update({ todos: p.todos, pct: p.pct, status: p.status }).eq('id', projectId);
}

function toggleProjectCollapse(projectId) {
    projectCollapseState[projectId] = !projectCollapseState[projectId];
    renderUpcomings();
}

async function toggleItemDone(id, type) {
    toast("Updating...");
    if (type === 'task') {
        const t = data.tasks.find(t => t.id === id);
        if (t) {
            t.done = !t.done;
            await db.from('tasks').update({ done: t.done }).eq('id', id);
        }
    } else if (type === 'project') {
        const p = data.projects.find(p => p.id === id);
        if (p) {
            p.status = p.status === 'done' ? 'active' : 'done';
            await db.from('projects').update({ status: p.status, pct: p.status === 'done' ? 100 : p.pct }).eq('id', id);
        }
    }
    renderGrowthPage();
    toast("Progress updated ✓");
}

async function deleteItem(id, type) {
    const confirmed = await customConfirm("Delete " + type.charAt(0).toUpperCase() + type.slice(1) + "?", `Are you sure you want to remove this ${type} from your horizon?`);
    if (!confirmed) return;
    
    toast(`Deleting ${type}...`);
    
    try {
        if (type === 'task') {
            const { error } = await db.from('tasks').delete().eq('id', id);
            if (error) throw error;
            data.tasks = data.tasks.filter(t => t.id !== id);
        } else if (type === 'project') {
            const { error } = await db.from('projects').delete().eq('id', id);
            if (error) throw error;
            data.projects = data.projects.filter(p => p.id !== id);
        } else if (type === 'event') {
            const { error } = await db.from('events').delete().eq('id', id);
            if (error) throw error;
            data.events = data.events.filter(e => e.id !== id);
        }
        
        renderGrowthPage();
        toast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted ✓`);
    } catch (err) {
        console.error("Delete failed:", err);
        toast("Error deleting item: " + err.message);
    }
}

let confirmPromise = null;

function customConfirm(title, message) {
    const modal = document.getElementById('confirmModal');
    const content = document.getElementById('confirmContent');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');

    if (!modal || !content) return Promise.resolve(false);

    titleEl.textContent = title;
    msgEl.textContent = message;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);

    return new Promise((resolve) => {
        confirmPromise = resolve;
    });
}

function closeConfirm(result) {
    const modal = document.getElementById('confirmModal');
    const content = document.getElementById('confirmContent');

    if (!modal || !content) return;

    content.classList.add('scale-95', 'opacity-0');
    content.classList.remove('scale-100', 'opacity-100');

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        if (confirmPromise) {
            confirmPromise(result);
            confirmPromise = null;
        }
    }, 300);
}

// Custom Dropdown Logic
function selectECat(val, icon, label) {
    document.getElementById('e-cat').value = val;
    document.getElementById('e-cat-selected').innerHTML = `
        <span class="material-symbols-outlined text-secondary text-[18px]">${icon}</span>
        <span>${label}</span>
    `;
    const options = document.getElementById('e-cat-options');
    options.classList.add('hidden');
    document.getElementById('e-cat-chevron').style.transform = 'rotate(0deg)';
    
    // Update active class
    document.querySelectorAll('#e-cat-options .dropdown-item').forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('onclick').includes(`'${val}'`)) el.classList.add('active');
    });
}

// Global click listener for dropdowns
window.addEventListener('click', (e) => {
    const dropdownBtn = document.getElementById('e-cat-btn');
    const options = document.getElementById('e-cat-options');
    const chevron = document.getElementById('e-cat-chevron');
    
    if (dropdownBtn && dropdownBtn.contains(e.target)) {
        const isHidden = options.classList.contains('hidden');
        options.classList.toggle('hidden');
        chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    } else if (options && !options.contains(e.target)) {
        options.classList.add('hidden');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
});
