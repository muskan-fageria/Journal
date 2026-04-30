const SUPABASE_URL = 'https://aogfbetxmzsjjdhbured.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2ZiZXR4bXpzampkaGJ1cmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTQyNDgsImV4cCI6MjA4OTA5MDI0OH0.OedI5IJQuUT-qB4INo2EH2yALrkoF3xqRMviMi9ESnM';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== BOOT & LOAD ==========
// Load data immediately on page load
window.addEventListener('DOMContentLoaded', loadData);

// ========== DATA ==========
let data = { tasks: [], projects: [], events: [], hobbies: [], entries: [], memories: [], socialData: {}, today: { mood: '', weather: '', rating: 0, energy: 0, focus: 0, stress: 0, remark: '', gratitude: '', oneWord: '', steps: '0', water: '0L', sleep: '0h', exercise: '0m', productive: '0', mindfulness: '0 Minutes', mindGoal: '150 Minutes' } };

const DD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MM = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

async function loadData() {
  toast("Loading data...");
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
      if (lastUpdate !== todayStr) {
        isNewDay = true;
      } else {
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

    try { initDates(); } catch(e) { console.error("initDates failed", e); }
    try { initToday(); } catch(e) { console.error("initToday failed", e); }
    
    const activePage = document.querySelector('.page.active');
    if (activePage) {
      const pageId = activePage.id.replace('page-', '');
      showPage(pageId);
    } else {
      const path = window.location.pathname;
      if (path.includes('growth')) renderTasks();
      if (path.includes('archive')) { renderLog(); renderEvents(); }
      if (path.includes('memory')) renderMemories();
    }
    
    try { updateStreak(); } catch(e) { console.error("updateStreak failed", e); }
  } catch (err) {
    console.error("Critical error in loadData", err);
    toast("Error loading data. Showing offline state.");
  } finally {
    initAnimations();
    toast("Data loaded ✓");
  }
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
  const headerEls = gsap.utils.toArray("header h1, header p, .font-label-caps");
  const bentoUnits = gsap.utils.toArray(".bento-unit");
  const individualCards = gsap.utils.toArray(".bento-card, .card").filter(el => !el.closest('.bento-unit'));
  const allButtons = gsap.utils.toArray("button:not(.nav-tabs button)");
  
  // 3. Reset state immediately
  // We use visibility: "visible" to override the initial CSS hide once GSAP is in control
  gsap.set([...headerEls, ...bentoUnits, ...individualCards, ...allButtons], { opacity: 0, y: 50, visibility: "visible", force3D: true });
  document.body.classList.add('gsap-ready');

  // 4. Hero Animation
  gsap.to(headerEls, {
    opacity: 1,
    y: 0,
    duration: 1,
    stagger: 0.1,
    ease: "power3.out"
  });

  // 5. Bento Units (Rows), Individual Cards, and Buttons
  const mainContent = [...bentoUnits, ...individualCards, ...allButtons];
  
  mainContent.forEach((el, i) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power4.out",
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

// ========== NAV ==========
function showPage(name, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + name);
  if (target) target.classList.add('active');
  
  // Update sidebar active state
  document.querySelectorAll('nav a').forEach(a => {
    a.classList.remove('active', 'text-amber-200', 'border-l-2', 'border-amber-200/50');
    a.classList.add('text-stone-500');
    
    // Check if this link matches the current page name (either via onclick or href)
    const onclickText = a.getAttribute('onclick') || '';
    const hrefText = a.getAttribute('href') || '';
    if (onclickText.includes(`'${name}'`) || hrefText.includes(`${name}.html`) || (name === 'today' && (hrefText.includes('journal (1).html') || hrefText === '/'))) {
      a.classList.add('active', 'text-amber-200', 'border-l-2', 'border-amber-200/50');
      a.classList.remove('text-stone-500');
    }
  });
  
  if (btn) {
    btn.classList.add('active', 'text-amber-200', 'border-l-2', 'border-amber-200/50');
    btn.classList.remove('text-stone-500');
  }

  if (name === 'growth') { 
    renderTasks(); 
    buildCalStrip(); 
    renderTaskChart(); 
    renderProjects(); 
    renderProjectChart(); 
  }
  if (name === 'archive') { 
    renderEvents(); 
    renderEventsChart(); 
    renderLog(); 
  }
  if (name === 'today') { 
    renderHabitsToday(); 
    setTimeout(renderTrendChart, 80); 
  }
  if (name === 'memory') {
    renderMemories();
  }
  
  initBentoEffect();
  initAnimations();
}

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
  await db.from('today_state').upsert(payload);
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
        <div class="flex gap-2 mt-1">
          <span class="text-[9px] uppercase tracking-widest text-secondary px-1.5 py-0.5 rounded border border-secondary/30 bg-secondary/5">${e.cat}</span>
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
  el.innerHTML = data.hobbies.map(h => `<div class="hobby-item"><div class="hobby-row"><div class="hobby-name">${h.name}</div><div class="hobby-time">⏱ ${h.mins}m</div><div class="hobby-streak">🔥 ${h.streak}d</div><button class="task-del" onclick="deleteHobby('${h.id}')">✕</button></div><div class="progress-bar-wrap"><div class="progress-bar" style="width:${Math.min(100, h.mins / 120 * 100)}%;background:linear-gradient(90deg,var(--green-dim),var(--olive))"></div></div></div>`).join('');
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
        <td class="py-4 text-lg">${e.mood || '—'}</td>
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
  if (moodEl) { const mc = {}; entries.forEach(e => { if (e.mood) mc[e.mood] = (mc[e.mood] || 0) + 1; }); moodEl.innerHTML = Object.entries(mc).sort((a, b) => b[1] - a[1]).map(([m, c]) => `<div style="display:flex;align-items:center;gap:0.35rem;font-size:0.82rem"><span style="font-size:1.15rem">${m}</span><span style="color:var(--text-faint)">${c}×</span></div>`).join('') || '<div style="font-size:0.82rem;color:var(--text-faint);font-style:italic">No moods yet.</div>'; }
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
  const cats = { personal: { label: '💛 Personal', color: '#d0be60' }, work: { label: '💼 Work', color: '#7ab0e0' }, social: { label: '🎉 Social', color: '#8fb86e' }, health: { label: '💪 Health', color: '#52c27e' }, other: { label: '📌 Other', color: '#628a5a' } };
  const counts = {}; data.events.forEach(e => counts[e.cat] = (counts[e.cat] || 0) + 1);
  Object.entries(counts).forEach(([cat, cnt]) => {
    const c = cats[cat] || { label: cat, color: '#6a8c62' };
    const circ = 94.2, pct = cnt / data.events.length;
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0.5rem';
    item.innerHTML = `<div style="position:relative;width:70px;height:70px"><svg viewBox="0 0 36 36" width="70" height="70" style="transform:rotate(-90deg)"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--surface3)" stroke-width="4"/><circle cx="18" cy="18" r="15" fill="none" stroke="${c.color}" stroke-width="4" stroke-dasharray="${(pct * circ).toFixed(1)} ${circ}" stroke-linecap="round"/></svg><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:0.9rem;font-weight:700;color:${c.color}">${cnt}</div></div><div style="font-size:0.7rem;color:var(--text-dim);text-align:center">${c.label}</div>`;
    wrap.appendChild(item);
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
// ========== MEMORIES ==========
function renderMemories() {
  const container = document.getElementById('memory-grid');
  if (!container) return;
  
  if (data.memories.length === 0) {
    container.innerHTML = '<div class="col-span-full py-20 text-center text-stone-500 italic">No memories captured yet. Land a thought or image here.</div>';
    return;
  }
  
  container.innerHTML = '';
  data.memories.forEach((mem, idx) => {
    // Determine card span logic for bento grid
    let spanClass = 'col-span-1';
    if (idx % 5 === 0) spanClass = 'col-span-1 md:col-span-2 lg:col-span-1 row-span-2';
    if (idx % 5 === 3) spanClass = 'col-span-1 md:col-span-2';

    const card = document.createElement('div');
    card.className = `glass-panel rounded-xl overflow-hidden flex flex-col h-full group transition-all duration-500 bento-card ${spanClass}`;
    
    let imgHtml = '';
    if (mem.image_url) {
      imgHtml = `
        <div class="relative ${spanClass.includes('row-span-2') ? 'h-64 md:h-80' : 'h-40'} w-full overflow-hidden">
          <img src="${mem.image_url}" class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-1000 ease-in-out opacity-80" alt="Memory Image">
          <div class="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
        </div>
      `;
    }

    const date = new Date(mem.created_at || Date.now());
    const dateStr = `${MM[date.getMonth()]} ${date.getDate()}${getOrdinal(date.getDate())}`;

    card.innerHTML = `
      ${imgHtml}
      <div class="p-8 flex flex-col flex-1 relative z-10 ${mem.image_url ? '-mt-10' : ''}">
        <div class="flex items-center justify-between mb-4">
          <span class="font-label-caps text-label-caps text-secondary tracking-widest uppercase">${dateStr}</span>
          <button onclick="deleteMemory('${mem.id}')" class="text-stone-600 hover:text-red-400 transition-colors"><span class="material-symbols-outlined text-sm">delete</span></button>
        </div>
        <h3 class="font-h3 text-h3 text-on-surface mb-6 ${mem.is_italic ? 'italic text-stone-300' : 'text-stone-200'}">${mem.content}</h3>
        ${mem.tags ? `
          <div class="mt-auto flex gap-2 flex-wrap">
            ${mem.tags.split(',').map(tag => `
              <span class="px-3 py-1 rounded-full border border-outline-variant text-on-surface-variant font-label-caps text-[10px] uppercase flex items-center gap-1 bg-surface-container-low/50">
                ${tag.trim()}
              </span>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
    container.appendChild(card);
  });
  initBentoEffect();
}

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

async function addMemory() {
  const content = document.getElementById('m-content').value;
  const imageUrl = document.getElementById('m-image').value;
  const tags = document.getElementById('m-tags').value;
  const isItalic = document.getElementById('m-italic').checked;

  if (!content) { toast("Please enter a memory..."); return; }

  const newMem = {
    content,
    image_url: imageUrl || null,
    tags: tags || null,
    is_italic: isItalic,
    created_at: new Date().toISOString()
  };

  toast("Saving memory...");
  const { data: savedData, error } = await db.from('memories').insert(newMem).select();
  
  if (error) {
    console.error(error);
    toast("Error saving to database");
    // Local fallback
    data.memories.unshift({ ...newMem, id: Date.now().toString() });
  } else if (savedData) {
    data.memories.unshift(savedData[0]);
  }

  renderMemories();
  
  // Clear inputs
  document.getElementById('m-content').value = '';
  document.getElementById('m-image').value = '';
  document.getElementById('m-tags').value = '';
  document.getElementById('m-italic').checked = false;
  
  toast("Memory captured ✓");
  closeMemoryModal();
}

async function deleteMemory(id) {
  if (!confirm("Are you sure you want to forget this memory?")) return;
  
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
  }
}

function closeMemoryModal() {
  const modal = document.getElementById('memory-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
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
