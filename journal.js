// ========== DATA ==========
let data={tasks:[],projects:[],events:[],hobbies:[],entries:[],socialData:{},today:{mood:'',weather:'',rating:0,energy:5,focus:5,stress:3,remark:'',gratitude:'',oneWord:'',steps:'',water:'',sleep:'',exercise:'',productive:''}};
const save=()=>{try{localStorage.setItem('mj_v4',JSON.stringify(data));}catch(e){}};
(()=>{try{const s=localStorage.getItem('mj_v4');if(s)data={...data,...JSON.parse(s)};}catch(e){}})();

const DD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MM=['January','February','March','April','May','June','July','August','September','October','November','December'];

// ========== BOOT ==========
function initDates(){
  const n=new Date();
  document.getElementById('hero-date').textContent=`${DD[n.getDay()]}, ${MM[n.getMonth()]} ${n.getDate()}, ${n.getFullYear()}`;
  document.getElementById('nav-date-display').textContent=`${DD[n.getDay()]}, ${MM[n.getMonth()]} ${n.getDate()}`;
  const h=n.getHours();
  document.getElementById('hero-greeting').textContent=h<12?'Good morning ✦':h<17?'Good afternoon ✦':'Good evening ✦';
  const iso=n.toISOString().split('T')[0];
  ['t-due','e-date','p-deadline'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=iso;});
}
function initToday(){
  const t=data.today;
  if(t.rating)setRating(t.rating,false);
  if(t.mood){document.querySelectorAll('.mood-btn').forEach(b=>{if(b.textContent===t.mood)b.classList.add('selected');});document.getElementById('qs-mood').textContent=t.mood;}
  ['energy','focus','stress'].forEach(k=>{if(t[k]){document.getElementById(k+'-slider').value=t[k];document.getElementById(k+'-val').textContent=t[k];}});
  if(t.remark)document.getElementById('daily-remark').value=t.remark;
  if(t.gratitude)document.getElementById('gratitude').value=t.gratitude;
  if(t.oneWord)document.getElementById('one-word').value=t.oneWord;
  ['steps','water','sleep','exercise'].forEach(k=>{if(t[k])document.getElementById('h-'+k).value=t[k];});
  if(t.productive){document.getElementById('h-productive').value=t.productive;document.getElementById('qs-prod').textContent=t.productive+'h';}
}

// ========== NAV ==========
function showPage(name,btn){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  document.querySelectorAll('.nav-tabs button').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  if(name==='tasks'){renderTasks();buildCalStrip();renderTaskChart();}
  if(name==='projects'){renderProjects();renderProjectChart();}
  if(name==='events'){renderEvents();renderEventsChart();}
  if(name==='social'){renderSocialBarChart();updateScreenRing();}
  if(name==='log'){renderLog();}
  if(name==='today'){renderTodayTasks();setTimeout(renderTrendChart,80);}
}

// ========== MOOD / WEATHER / RATING ==========
function selectMood(btn,emoji){document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');data.today.mood=emoji;document.getElementById('qs-mood').textContent=emoji;save();}
function selectWeather(btn,emoji,label){document.querySelectorAll('.weather-btn').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');data.today.weather=emoji+' '+label;save();}
function setRating(n,doSave=true){
  data.today.rating=n;
  document.querySelectorAll('.star').forEach((s,i)=>s.classList.toggle('filled',i<n));
  const L=['','Terrible','Bad','Poor','Meh','Okay','Good','Great','Excellent','Amazing','Perfect 🌿'];
  document.getElementById('rating-label').textContent=`${n}/10 — ${L[n]}`;
  document.getElementById('qs-rating').textContent=n+'/10';
  if(doSave)save();
}
function updateSlider(sid,vid,key){const v=document.getElementById(sid).value;document.getElementById(vid).textContent=v;data.today[key]=v;save();}
function updateHealth(){['steps','water','sleep','exercise'].forEach(k=>{data.today[k]=document.getElementById('h-'+k).value;});save();}
function updateRemark(){data.today.remark=document.getElementById('daily-remark').value;save();}

// ========== TASKS ==========
let taskFilter='all',selDate=null;
function addTask(){
  const name=document.getElementById('t-name').value.trim();if(!name)return toast('Enter a task name');
  data.tasks.push({id:Date.now(),name,cat:document.getElementById('t-cat').value,priority:document.getElementById('t-priority').value,notes:document.getElementById('t-notes').value,due:document.getElementById('t-due').value,done:false,date:new Date().toISOString().split('T')[0]});
  ['t-name','t-notes'].forEach(id=>document.getElementById(id).value='');
  save();renderTasks();renderTodayTasks();renderTaskChart();updateTaskCount();toast('Task added ✓');
}
function toggleTask(id){const t=data.tasks.find(t=>t.id===id);if(t){t.done=!t.done;save();renderTasks();renderTodayTasks();updateTaskCount();}}
function deleteTask(id){data.tasks=data.tasks.filter(t=>t.id!==id);save();renderTasks();renderTodayTasks();updateTaskCount();}
function clearCompleted(){data.tasks=data.tasks.filter(t=>!t.done);save();renderTasks();renderTodayTasks();updateTaskCount();toast('Cleared ✓');}
function filterTasks(f){taskFilter=f;renderTasks();}
function updateTaskCount(){const done=data.tasks.filter(t=>t.done).length,total=data.tasks.length;const el=document.getElementById('task-count');if(el)el.textContent=`${done}/${total} done`;document.getElementById('qs-tasks').textContent=done;}
function taskHTML(t,showToggle=true){return`<div class="task-item ${t.done?'done':''}"><div class="priority ${t.priority}"></div>${showToggle?`<input type="checkbox" class="task-check" ${t.done?'checked':''} onchange="toggleTask(${t.id})">`:'<span style="font-size:0.8rem">'+(t.done?'✓':'○')+'</span>'}<div style="flex:1"><div class="task-text">${t.name}</div><div class="task-meta"><span class="tag ${t.cat}">${t.cat}</span>${t.notes?`<span>${t.notes}</span>`:''} ${t.due?`<span>📅 ${t.due}</span>`:''}</div></div>${showToggle?`<button class="task-del" onclick="deleteTask(${t.id})">✕</button>`:''}</div>`;}
function renderTasks(){
  const el=document.getElementById('task-list-main');if(!el)return;
  let tasks=[...data.tasks];
  if(taskFilter==='done')tasks=tasks.filter(t=>t.done);
  else if(taskFilter!=='all')tasks=tasks.filter(t=>t.cat===taskFilter&&!t.done);
  else tasks=tasks.filter(t=>!t.done);
  el.innerHTML=tasks.length?tasks.map(t=>taskHTML(t)).join(''):'<div class="empty-state"><div class="es-icon">🌿</div>No tasks here.</div>';
  updateTaskCount();
}
function renderTodayTasks(){
  const el=document.getElementById('today-tasks-list');if(!el)return;
  const tasks=data.tasks.filter(t=>!t.done).slice(0,8);
  el.innerHTML=tasks.length?tasks.map(t=>taskHTML(t)).join(''):'<div class="empty-state" style="padding:1.5rem"><div class="es-icon">📋</div>No tasks yet!</div>';
}

// ========== CALENDAR ==========
function buildCalStrip(){
  const strip=document.getElementById('cal-strip');if(!strip)return;
  strip.innerHTML='';
  const now=new Date();
  for(let i=-7;i<=14;i++){
    const d=new Date(now);d.setDate(d.getDate()+i);
    const iso=d.toISOString().split('T')[0];
    const hasTasks=data.tasks.some(t=>t.date===iso);
    const hasEntry=data.entries.some(e=>e.date===iso);
    const el=document.createElement('div');
    el.className='cal-day'+(i===0?' today':'')+(hasTasks||hasEntry?' has-entry':'')+(selDate===iso?' sel':'');
    el.innerHTML=`<div class="cal-wd">${DD[d.getDay()]}</div><div class="cal-d">${d.getDate()}</div>${hasTasks||hasEntry?'<div class="cal-dot"></div>':''}`;
    const isoF=iso,dF=new Date(d);
    el.onclick=()=>onCalClick(isoF,el,dF);
    strip.appendChild(el);
  }
}
function onCalClick(iso,el,d){
  const today=new Date().toISOString().split('T')[0];
  document.querySelectorAll('.cal-day').forEach(x=>x.classList.remove('sel'));
  if(selDate===iso){selDate=null;closePastDay();return;}
  el.classList.add('sel');selDate=iso;
  if(iso===today){closePastDay();return;}
  showPastDay(iso,d);
}
function showPastDay(iso,d){
  const panel=document.getElementById('past-day-panel');
  panel.style.display='block';
  document.getElementById('past-day-label').textContent=`${DD[d.getDay()]}, ${MM[d.getMonth()]} ${d.getDate()}`;
  const dayTasks=data.tasks.filter(t=>t.date===iso);
  const entry=data.entries.find(e=>e.date===iso);
  let html='';
  if(dayTasks.length)html+=dayTasks.map(t=>taskHTML(t,false)).join('');
  else html+='<div style="font-size:0.82rem;color:var(--text-faint);font-style:italic;padding:0.5rem">No tasks on this day.</div>';
  if(entry)html+=`<div style="margin-top:0.75rem;padding:0.75rem;background:var(--surface3);border-radius:8px;border-left:3px solid var(--olive-dim)">${entry.mood||entry.rating?`<div style="font-size:0.83rem;margin-bottom:0.3rem">${entry.mood||''} ${entry.weather||''} ${entry.rating?'<span style="color:var(--olive)">'+entry.rating+'/10</span>':''}</div>`:''} ${entry.remark?`<div style="font-size:0.8rem;color:var(--text-dim);font-style:italic;line-height:1.5">"${entry.remark}"</div>`:''}</div>`;
  document.getElementById('past-day-tasks').innerHTML=html;
}
function closePastDay(){document.getElementById('past-day-panel').style.display='none';selDate=null;document.querySelectorAll('.cal-day').forEach(d=>d.classList.remove('sel'));}

// ========== PROJECTS ==========
function addProject(){
  const name=document.getElementById('p-name').value.trim();if(!name)return toast('Enter project name');
  data.projects.push({id:Date.now(),name,desc:document.getElementById('p-desc').value,status:document.getElementById('p-status').value,pct:parseInt(document.getElementById('p-pct').value)||0,deadline:document.getElementById('p-deadline').value});
  ['p-name','p-desc','p-pct'].forEach(id=>document.getElementById(id).value='');
  save();renderProjects();renderProjectChart();toast('Project added ✓');
}
function deleteProject(id){data.projects=data.projects.filter(p=>p.id!==id);save();renderProjects();renderProjectChart();}
function updateProjectPct(id,val){const p=data.projects.find(p=>p.id===id);if(p){p.pct=parseInt(val);save();}const el=document.getElementById('proj-pct-'+id);if(el)el.textContent=val+'%';const bar=document.getElementById('proj-bar-'+id);if(bar)bar.style.width=val+'%';renderProjectChart();}
function renderProjects(){
  const el=document.getElementById('projects-list');if(!el)return;
  if(!data.projects.length){el.innerHTML='<div class="empty-state"><div class="es-icon">🗂️</div>No projects yet.</div>';return;}
  el.innerHTML=data.projects.map(p=>`<div class="project-item"><div class="project-header"><div class="project-name">${p.name}</div><div style="display:flex;gap:0.5rem;align-items:center"><span class="project-status ${p.status}">${p.status}</span><button class="task-del" onclick="deleteProject(${p.id})">✕</button></div></div>${p.desc?`<div class="project-desc">${p.desc}</div>`:''} ${p.deadline?`<div style="font-size:0.7rem;color:var(--text-faint);margin-bottom:0.5rem">📅 ${p.deadline}</div>`:''}<div class="project-progress-label"><span>Progress</span><span class="project-pct" id="proj-pct-${p.id}">${p.pct}%</span></div><div class="progress-bar-wrap"><div class="progress-bar" id="proj-bar-${p.id}" style="width:${p.pct}%"></div></div><input type="range" min="0" max="100" value="${p.pct}" style="width:100%;margin-top:0.5rem" oninput="updateProjectPct(${p.id},this.value)"></div>`).join('');
}

// ========== EVENTS ==========
function addEvent(){
  const name=document.getElementById('e-name').value.trim();if(!name)return toast('Enter event name');
  data.events.push({id:Date.now(),name,date:document.getElementById('e-date').value,time:document.getElementById('e-time').value,cat:document.getElementById('e-cat').value,notes:document.getElementById('e-notes').value});
  ['e-name','e-notes'].forEach(id=>document.getElementById(id).value='');
  save();renderEvents();renderEventsChart();toast('Event added ✓');
}
function deleteEvent(id){data.events=data.events.filter(e=>e.id!==id);save();renderEvents();renderEventsChart();}
function renderEvents(){
  const el=document.getElementById('events-list');if(!el)return;
  if(!data.events.length){el.innerHTML='<div class="empty-state"><div class="es-icon">🌿</div>No events yet.</div>';return;}
  el.innerHTML=[...data.events].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(e=>`<div class="event-item"><div><div class="event-time">${e.time||'—'}</div><div style="font-size:0.65rem;color:var(--text-faint)">${e.date}</div></div><div class="event-info"><div class="event-name">${e.name} <span class="tag ${e.cat}">${e.cat}</span></div>${e.notes?`<div class="event-note">${e.notes}</div>`:''}</div><button class="task-del" onclick="deleteEvent(${e.id})">✕</button></div>`).join('');
}

// ========== HOBBIES ==========
function addHobby(){
  const name=document.getElementById('hobby-name').value.trim();if(!name)return toast('Enter hobby name');
  const ex=data.hobbies.find(h=>h.name.toLowerCase()===name.toLowerCase());
  if(ex){ex.mins=parseInt(document.getElementById('hobby-mins').value)||ex.mins;ex.streak=parseInt(document.getElementById('hobby-streak').value)||ex.streak;}
  else data.hobbies.push({name,mins:parseInt(document.getElementById('hobby-mins').value)||0,streak:parseInt(document.getElementById('hobby-streak').value)||0});
  ['hobby-name','hobby-mins','hobby-streak'].forEach(id=>document.getElementById(id).value='');
  save();renderHobbies();toast('Hobby logged ✓');
}
function deleteHobby(i){data.hobbies.splice(i,1);save();renderHobbies();}
function renderHobbies(){
  const el=document.getElementById('hobby-list');if(!el)return;
  if(!data.hobbies.length){el.innerHTML='<div class="empty-state" style="padding:1rem">No hobbies yet.</div>';return;}
  el.innerHTML=data.hobbies.map((h,i)=>`<div class="hobby-item"><div class="hobby-row"><div class="hobby-name">${h.name}</div><div class="hobby-time">⏱ ${h.mins}m</div><div class="hobby-streak">🔥 ${h.streak}d</div><button class="task-del" onclick="deleteHobby(${i})">✕</button></div><div class="progress-bar-wrap"><div class="progress-bar" style="width:${Math.min(100,h.mins/120*100)}%;background:linear-gradient(90deg,var(--green-dim),var(--olive))"></div></div></div>`).join('');
}

// ========== SOCIAL ==========
const SOCIAL_APPS={'ig-slider':{name:'Instagram',color:'#e1306c'},'tw-slider':{name:'Twitter/X',color:'#1da1f2'},'yt-slider':{name:'YouTube',color:'#ff4444'},'tt-slider':{name:'TikTok',color:'#a0c878'},'li-slider':{name:'LinkedIn',color:'#0077b5'},'sc-slider':{name:'Snapchat',color:'#d4c46e'},'wa-slider':{name:'WhatsApp',color:'#25d366'}};
function updateSocial(sid,tid){
  const v=parseInt(document.getElementById(sid).value);
  const h=Math.floor(v/60),m=v%60;
  document.getElementById(tid).textContent=h>0?`${h}h ${m}m`:`${m} min`;
  if(!data.socialData)data.socialData={};
  data.socialData[sid]=v;
  save();updateScreenRing();renderSocialBarChart();
}
function updateScreenRing(){
  let total=0;
  Object.keys(SOCIAL_APPS).forEach(id=>{total+=parseInt(document.getElementById(id)?.value||0);});
  ['sc-learning','sc-gaming','sc-work','sc-stream','sc-news','sc-shop'].forEach(id=>{total+=parseInt(document.getElementById(id)?.value||0);});
  const hours=(total/60).toFixed(1);
  document.getElementById('ring-total').textContent=hours+'h';
  document.getElementById('qs-screen').textContent=hours+'h';
  const goal=parseFloat(document.getElementById('screen-goal')?.value||6)*60;
  document.getElementById('ring-circle').style.strokeDashoffset=264-Math.min(1,total/goal)*264;
  const legend=document.getElementById('ring-legend');
  if(legend){
    const items=Object.entries(SOCIAL_APPS).map(([id,app])=>{const v=parseInt(document.getElementById(id)?.value||0);if(!v)return'';return`<div class="ring-legend-item"><div class="legend-dot" style="background:${app.color}"></div><span>${app.name}</span><span style="margin-left:auto;color:var(--olive);font-weight:500">${v}m</span></div>`;}).filter(Boolean).join('');
    legend.innerHTML=items||'<div style="font-size:0.8rem;color:var(--text-faint);font-style:italic">No social logged yet.</div>';
  }
}
function saveScreenData(){updateScreenRing();toast('Screen data saved ✓');}

// ========== SAVE TODAY ==========
function saveTodayEntry(){
  const today=new Date(),iso=today.toISOString().split('T')[0];
  const dateStr=`${DD[today.getDay()]}, ${MM[today.getMonth()]} ${today.getDate()}`;
  data.today.remark=document.getElementById('daily-remark').value;
  data.today.gratitude=document.getElementById('gratitude').value;
  data.today.oneWord=document.getElementById('one-word').value;
  data.today.productive=document.getElementById('h-productive').value;
  const entry={date:iso,dateStr,mood:data.today.mood,weather:data.today.weather,rating:data.today.rating,remark:data.today.remark,gratitude:data.today.gratitude,oneWord:data.today.oneWord,tasks:data.tasks.filter(t=>t.done).map(t=>t.name),energy:data.today.energy,focus:data.today.focus,productive:data.today.productive};
  const idx=data.entries.findIndex(e=>e.date===iso);
  if(idx>=0)data.entries[idx]=entry;else data.entries.unshift(entry);
  save();buildCalStrip();renderTrendChart();toast("Entry saved! ✨");
}

// ========== LOG ==========
function renderLog(){
  const tbody=document.getElementById('ref-tbody'),search=(document.getElementById('ref-search')?.value||'').toLowerCase();
  if(!tbody)return;
  let entries=[...data.entries];
  if(search)entries=entries.filter(e=>(e.dateStr||'').toLowerCase().includes(search)||(e.remark||'').toLowerCase().includes(search)||(e.tasks||[]).join(' ').toLowerCase().includes(search));
  document.getElementById('ref-count').textContent=entries.length+' entries';
  tbody.innerHTML=entries.length
    ?entries.map(e=>`<tr><td class="date-col">${e.dateStr}<br><span style="font-size:0.62rem;color:var(--text-faint)">${e.weather||''}</span></td><td class="tasks-col">${e.tasks?.length?e.tasks.map(t=>`<div style="margin-bottom:0.2rem">✓ ${t}</div>`).join(''):'<span style="color:var(--text-faint);font-style:italic">—</span>'}</td><td>${e.mood||'—'}</td><td><span style="font-family:'Playfair Display',serif;color:var(--olive);font-weight:600">${e.rating||'—'}</span>${e.rating?'/10':''}</td><td class="remarks-col">${e.remark||'<span style="color:var(--text-faint)">—</span>'}${e.gratitude?`<br><span style="font-size:0.7rem;color:var(--sage)">🙏 ${e.gratitude}</span>`:''}</td></tr>`).join('')
    :`<tr><td colspan="5"><div class="empty-state"><div class="es-icon">📖</div>${search?'No matching entries.':'No entries yet.'}</div></td></tr>`;
  // stats
  const rated=entries.filter(e=>e.rating);
  document.getElementById('avg-rating-num').textContent=rated.length?(rated.reduce((a,b)=>a+b.rating,0)/rated.length).toFixed(1):'—';
  const totalTasks=entries.reduce((a,e)=>a+(e.tasks?.length||0),0);
  const statsEl=document.getElementById('ref-stats');
  if(statsEl)statsEl.innerHTML=entries.length?`<div style="display:flex;justify-content:space-between;font-size:0.8rem;padding:0.35rem 0;border-bottom:1px solid var(--border)"><span style="color:var(--text-faint)">Days logged</span><strong>${entries.length}</strong></div><div style="display:flex;justify-content:space-between;font-size:0.8rem;padding:0.35rem 0;border-bottom:1px solid var(--border)"><span style="color:var(--text-faint)">Tasks done</span><strong>${totalTasks}</strong></div><div style="display:flex;justify-content:space-between;font-size:0.8rem;padding:0.35rem 0"><span style="color:var(--text-faint)">Avg prod hrs</span><strong>${entries.filter(e=>e.productive).length?(entries.filter(e=>e.productive).reduce((a,e)=>a+parseFloat(e.productive||0),0)/entries.filter(e=>e.productive).length).toFixed(1)+'h':'—'}</strong></div>`:'';
  const moodEl=document.getElementById('mood-freq');
  if(moodEl){const mc={};entries.forEach(e=>{if(e.mood)mc[e.mood]=(mc[e.mood]||0)+1;});moodEl.innerHTML=Object.entries(mc).sort((a,b)=>b[1]-a[1]).map(([m,c])=>`<div style="display:flex;align-items:center;gap:0.35rem;font-size:0.82rem"><span style="font-size:1.15rem">${m}</span><span style="color:var(--text-faint)">${c}×</span></div>`).join('')||'<div style="font-size:0.82rem;color:var(--text-faint);font-style:italic">No moods yet.</div>';}
  renderLogRatingChart(entries);
}

// ========== CHARTS ==========
function drawLineSVG(svgId,pts,color){
  const svg=document.getElementById(svgId);if(!svg)return;
  const rect=svg.parentElement?.getBoundingClientRect()||{width:300,height:160};
  const W=Math.max(rect.width,200),H=160;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.innerHTML='';
  if(!pts||pts.length<2){svg.innerHTML=`<text x="${W/2}" y="${H/2}" text-anchor="middle" fill="#486448" font-size="11" font-style="italic" font-family="Lora,serif">Not enough data yet</text>`;return;}
  const p={t:20,r:12,b:28,l:28};
  const iw=W-p.l-p.r,ih=H-p.t-p.b;
  const maxV=Math.max(...pts.map(x=>x.y),1);
  const xs=pts.map((_,i)=>p.l+i*(iw/Math.max(pts.length-1,1)));
  const ys=pts.map(x=>p.t+ih-(x.y/maxV)*ih);
  const pathD=xs.map((x,i)=>`${i===0?'M':'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const fillD=pathD+` L${xs[xs.length-1].toFixed(1)},${(p.t+ih).toFixed(1)} L${p.l},${(p.t+ih).toFixed(1)} Z`;
  const gid='g'+Math.random().toString(36).slice(2);
  svg.innerHTML=`<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.22"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${fillD}" fill="url(#${gid})"/><path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${xs.map((x,i)=>`<circle cx="${x.toFixed(1)}" cy="${ys[i].toFixed(1)}" r="3.5" fill="${color}"/><text x="${x.toFixed(1)}" y="${(H-6).toFixed(1)}" text-anchor="middle" font-size="9" fill="#486448">${pts[i].label}</text>`).join('')}`;
}

function renderTrendChart(){
  const now=new Date(),pts=[];
  for(let i=13;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);const iso=d.toISOString().split('T')[0];const e=data.entries.find(x=>x.date===iso);if(e&&e.rating)pts.push({y:e.rating,label:String(d.getDate())});}
  drawLineSVG('trend-svg',pts,'#8fb86e');
}
function renderLogRatingChart(entries){
  const pts=[...entries].slice(0,14).reverse().filter(e=>e.rating).map(e=>({y:e.rating,label:e.dateStr?.split(',')[0]||''}));
  drawLineSVG('log-rating-svg',pts,'#8fb86e');
}

function drawBarChart(barId,xId,vals,colorFn){
  const bar=document.getElementById(barId),xEl=document.getElementById(xId);
  if(!bar)return;bar.innerHTML='';if(xEl)xEl.innerHTML='';
  if(!vals.length){bar.innerHTML='<div style="width:100%;display:flex;align-items:center;justify-content:center;font-size:0.82rem;color:var(--text-faint);font-style:italic">No data yet</div>';return;}
  const max=Math.max(...vals.map(v=>v.y),1);
  vals.forEach(v=>{
    const pct=v.y/max*100;
    const col=document.createElement('div');
    col.className='chart-bar-col';
    const bg=colorFn?colorFn(v):'linear-gradient(180deg,var(--olive),var(--olive-dim))';
    col.innerHTML=`<div class="chart-bar" style="height:${Math.max(pct,2)}%;background:${bg}" data-tip="${v.label}: ${v.y}"></div>`;
    bar.appendChild(col);
    if(xEl){const xl=document.createElement('div');xl.className='chart-x-label';xl.textContent=v.shortLabel||v.label;xEl.appendChild(xl);}
  });
}

function renderTaskChart(){
  const now=new Date(),vals=[];
  for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);const iso=d.toISOString().split('T')[0];vals.push({y:data.tasks.filter(t=>t.date===iso&&t.done).length,label:`${DD[d.getDay()]} ${d.getDate()}`,shortLabel:DD[d.getDay()]});}
  drawBarChart('task-bar-chart','task-bar-x',vals);
}

function renderSocialBarChart(){
  const vals=Object.entries(SOCIAL_APPS).map(([id,app])=>({y:parseInt(document.getElementById(id)?.value||0),label:app.name,shortLabel:app.name.split('/')[0].substring(0,5),color:app.color})).filter(v=>v.y>0);
  drawBarChart('social-bar-chart','social-bar-x',vals,v=>`linear-gradient(180deg,${v.color}cc,${v.color}55)`);
}

function renderProjectChart(){
  const wrap=document.getElementById('project-chart-wrap');if(!wrap)return;
  wrap.innerHTML='';
  if(!data.projects.length){wrap.innerHTML='<div style="font-size:0.82rem;color:var(--text-faint);font-style:italic">No projects yet.</div>';return;}
  data.projects.forEach(p=>{
    const col=document.createElement('div');
    col.style.cssText='display:flex;flex-direction:column;align-items:center;gap:0.5rem;flex:1;min-width:80px;max-width:130px';
    const fillH=(p.pct/100)*120;
    col.innerHTML=`<div style="position:relative;width:100%;height:120px;background:var(--surface2);border-radius:6px;overflow:hidden;border:1px solid var(--border)"><div style="position:absolute;bottom:0;left:0;right:0;height:${fillH}px;background:linear-gradient(180deg,var(--olive),var(--olive-dim));border-radius:4px;transition:height 0.5s"></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:0.9rem;font-weight:700;color:var(--olive)">${p.pct}%</div></div><div style="font-size:0.7rem;color:var(--text-dim);text-align:center;line-height:1.3;max-width:100px">${p.name}</div><span class="project-status ${p.status}">${p.status}</span>`;
    wrap.appendChild(col);
  });
}

function renderEventsChart(){
  const wrap=document.getElementById('events-chart-wrap');if(!wrap)return;
  wrap.innerHTML='';
  if(!data.events.length){wrap.innerHTML='<div style="font-size:0.82rem;color:var(--text-faint);font-style:italic">No events yet.</div>';return;}
  const cats={personal:{label:'💛 Personal',color:'#d0be60'},work:{label:'💼 Work',color:'#7ab0e0'},social:{label:'🎉 Social',color:'#8fb86e'},health:{label:'💪 Health',color:'#52c27e'},other:{label:'📌 Other',color:'#628a5a'}};
  const counts={};data.events.forEach(e=>counts[e.cat]=(counts[e.cat]||0)+1);
  Object.entries(counts).forEach(([cat,cnt])=>{
    const c=cats[cat]||{label:cat,color:'#6a8c62'};
    const circ=94.2,pct=cnt/data.events.length;
    const item=document.createElement('div');
    item.style.cssText='display:flex;flex-direction:column;align-items:center;gap:0.5rem';
    item.innerHTML=`<div style="position:relative;width:70px;height:70px"><svg viewBox="0 0 36 36" width="70" height="70" style="transform:rotate(-90deg)"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--surface3)" stroke-width="4"/><circle cx="18" cy="18" r="15" fill="none" stroke="${c.color}" stroke-width="4" stroke-dasharray="${(pct*circ).toFixed(1)} ${circ}" stroke-linecap="round"/></svg><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:0.9rem;font-weight:700;color:${c.color}">${cnt}</div></div><div style="font-size:0.7rem;color:var(--text-dim);text-align:center">${c.label}</div>`;
    wrap.appendChild(item);
  });
}

// ========== EXPORT ==========
function exportCSV(){
  if(!data.entries.length)return toast('No entries to export');
  const h=['Date','Mood','Weather','Rating','Tasks Done','Remarks','Gratitude'];
  const rows=data.entries.map(e=>[e.dateStr,e.mood||'',e.weather||'',e.rating||'',(e.tasks||[]).join('; '),(e.remark||'').replace(/,/g,';'),e.gratitude||'']);
  const csv=[h,...rows].map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='my-journal.csv';a.click();
  toast('Exported ✓');
}

// ========== TOAST ==========
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2800);}

// ========== INIT ==========
initDates();initToday();renderTodayTasks();renderHobbies();buildCalStrip();
setTimeout(()=>{renderTrendChart();updateTaskCount();},120);
