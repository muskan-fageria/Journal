import React, { useState } from 'react';
import ElasticSlider from '../components/ElasticSlider';
import { authFetch } from '../utils/authFetch';

export default function GrowthPage({ 
  tasks, 
  setTasks, 
  projects, 
  setProjects, 
  events, 
  setEvents, 
  effectiveDateStr,
  toast 
}) {
  // Form states
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

  const [showCompleted, setShowCompleted] = useState(false);

  // ==========================================
  // ADD HANDLERS
  // ==========================================
  const handleAddTask = async () => {
    if (!taskName.trim()) return toast('Please enter a task name.');
    const newTask = {
      name: taskName,
      due: taskDate || null,
      priority: taskPriority,
      repeat: taskRepeat,
      notes: taskDesc,
      cat: 'work', // default category
      done: false
    };
    try {
      const res = await authFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask)
      });
      const data = await res.json();
      setTasks([...tasks, data]);
      setTaskName('');
      setTaskDesc('');
      toast('Task added ✓');
    } catch (err) {
      console.error(err);
      toast('Failed to add task');
    }
  };

  const handleAddEvent = async () => {
    if (!eventName.trim()) return toast('Please enter an event name.');
    const newEvent = {
      name: eventName,
      date: eventDateTime ? eventDateTime.split('T')[0] : null,
      time: eventDateTime ? eventDateTime.split('T')[1] : null,
      notes: eventDesc,
      cat: 'personal'
    };
    try {
      const res = await authFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify(newEvent)
      });
      const data = await res.json();
      setEvents([...events, data]);
      setEventName('');
      setEventDateTime('');
      setEventDesc('');
      toast('Event added ✓');
    } catch (err) {
      console.error(err);
      toast('Failed to add event');
    }
  };

  const handleAddProject = async () => {
    if (!projectName.trim()) return toast('Please enter a project name.');
    const newProject = {
      name: projectName,
      deadline: projectDateTo || null,
      desc: projectDesc,
      pct: parseInt(projectCompletion) || 0,
      status: 'active'
    };
    try {
      const res = await authFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(newProject)
      });
      const data = await res.json();
      setProjects([...projects, data]);
      setProjectName('');
      setProjectDesc('');
      setProjectCompletion(0);
      toast('Project added ✓');
    } catch (err) {
      console.error(err);
      toast('Failed to add project');
    }
  };

  // ==========================================
  // TOGGLE & DELETE HANDLERS
  // ==========================================
  const handleToggleTask = async (id, currentVal) => {
    const updatedVal = !currentVal;
    setTasks(tasks.map(t => t.id === id ? { ...t, done: updatedVal } : t));
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: updatedVal })
    });
  };

  const handleDeleteTask = async (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  };

  const handleProjectSlider = async (id, val) => {
    const pct = parseInt(val);
    setProjects(projects.map(p => p.id === id ? { ...p, pct } : p));
    await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pct })
    });
  };

  const handleToggleProject = async (id, isDone) => {
    const status = isDone ? 'completed' : 'active';
    const pct = isDone ? 100 : 90;
    setProjects(projects.map(p => p.id === id ? { ...p, status, pct } : p));
    await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, pct })
    });
  };

  const handleDeleteProject = async (id) => {
    setProjects(projects.filter(p => p.id !== id));
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  };

  const handleDeleteEvent = async (id) => {
    setEvents(events.filter(e => e.id !== id));
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
  };

  // ==========================================
  // CALENDAR GENERATION
  // ==========================================
  const generateWeekDays = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(startOfWeek);
      current.setDate(startOfWeek.getDate() + i);
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      days.push({
        dateKey,
        dayName: current.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNum: current.getDate(),
        isToday: current.toDateString() === today.toDateString()
      });
    }
    return days;
  };

  const weekDays = generateWeekDays();

  // Get dots for a specific day
  const getDayIndicators = (dateKey) => {
    const dayDots = [];
    const hasTasks = tasks.some(t => t.due === dateKey && t.cat !== 'habit');
    const hasEvents = events.some(e => e.date === dateKey);
    const hasProjects = projects.some(p => p.deadline === dateKey);

    if (hasTasks) dayDots.push({ color: '#4299e1', name: 'Task' });
    if (hasEvents) dayDots.push({ color: '#9f7aea', name: 'Event' });
    if (hasProjects) dayDots.push({ color: '#38b2ac', name: 'Project' });
    return dayDots;
  };

  // ==========================================
  // COMPILE UPCOMING & COMPLETED LISTS
  // ==========================================
  const upcomingItems = [
    ...tasks.filter(t => !t.done && t.cat !== 'habit').map(t => ({
      ...t,
      type: 'Task',
      badgeColor: '#4299e1',
      subtitle: `Due: ${t.due || 'No date'}`
    })),
    ...events.map(e => ({
      ...e,
      type: 'Event',
      badgeColor: '#9f7aea',
      subtitle: `Date: ${e.date ? `${e.date} ${e.time || ''}` : 'No date'}`
    })),
    ...projects.filter(p => p.status !== 'completed').map(p => ({
      ...p,
      type: 'Project',
      badgeColor: '#38b2ac',
      subtitle: `Due: ${p.deadline || 'No date'}`
    }))
  ];

  const completedItems = [
    ...tasks.filter(t => t.done && t.cat !== 'habit').map(t => ({
      ...t,
      type: 'Task',
      badgeColor: '#4299e1',
      subtitle: `Due: ${t.due || 'No date'}`
    })),
    ...projects.filter(p => p.status === 'completed').map(p => ({
      ...p,
      type: 'Project',
      badgeColor: '#38b2ac',
      subtitle: `Due: ${p.deadline || 'No date'}`
    }))
  ];

  return (
    <div className="page max-w-5xl mx-auto w-full animate-fade-in">
      <header className="mb-12">
        <span className="font-label-caps text-secondary mb-4 block tracking-widest uppercase select-none">Progress & Potential</span>
        <h1 className="font-h1 text-h1 text-on-surface mb-6 select-none">Growth</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl select-none">Shape your future by tending to the tasks and projects of today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Task Creation Form */}
        <div className="bg-white/[0.05] backdrop-blur-[20px] border border-outline-variant/30 p-8 rounded-2xl flex flex-col gap-6 bento-card">
          <h2 className="font-h2 text-xl text-stone-100 mb-2 select-none">Create New Task</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 block select-none">Task Name</label>
              <input 
                type="text" 
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-on-surface text-sm" 
                placeholder="What are you working on?" 
              />
            </div>
            <div>
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 block select-none">Due Date</label>
              <input 
                type="date" 
                value={taskDate}
                onChange={(e) => setTaskDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-on-surface text-sm" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 block select-none">Priority</label>
                <select 
                  value={taskPriority} 
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="w-full bg-stone-900 border border-white/10 rounded-lg p-3 text-on-surface text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 block select-none">Repeat</label>
                <select 
                  value={taskRepeat} 
                  onChange={(e) => setTaskRepeat(e.target.value)}
                  className="w-full bg-stone-900 border border-white/10 rounded-lg p-3 text-on-surface text-sm"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
            <div>
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 block select-none">Description</label>
              <textarea 
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-on-surface h-24 resize-none text-sm" 
                placeholder="Add any details or notes here..."
              />
            </div>
            <button 
              type="button" 
              onClick={handleAddTask} 
              className="bg-secondary/10 border border-secondary/30 text-secondary px-6 py-3 rounded-lg font-label-caps text-xs uppercase tracking-widest hover:bg-secondary/20 transition-all cursor-pointer"
            >
              Add Task
            </button>
          </div>
        </div>

        {/* Event Creation Form */}
        <div className="bg-white/[0.05] backdrop-blur-[20px] border border-outline-variant/30 p-8 rounded-2xl flex flex-col gap-6 bento-card">
          <h2 className="font-h2 text-xl text-stone-100 mb-2 select-none">Add New Event</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 block select-none">Event Name</label>
              <input 
                type="text" 
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-on-surface text-sm" 
                placeholder="What's the event?" 
              />
            </div>
            <div>
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 block select-none">Date & Time</label>
              <input 
                type="datetime-local" 
                value={eventDateTime}
                onChange={(e) => setEventDateTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-on-surface text-sm" 
              />
            </div>
            <div>
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 block select-none">Description</label>
              <textarea 
                value={eventDesc}
                onChange={(e) => setEventDesc(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-on-surface h-24 resize-none text-sm" 
                placeholder="Add any event details..."
              />
            </div>
            <button 
              type="button" 
              onClick={handleAddEvent} 
              className="bg-purple-500/10 border border-purple-500/30 text-purple-300 px-6 py-3 rounded-lg font-label-caps text-xs uppercase tracking-widest hover:bg-purple-500/20 transition-all cursor-pointer"
            >
              Add Event
            </button>
          </div>
        </div>

        {/* Project Creation Form */}
        <div className="bg-white/[0.05] backdrop-blur-[20px] border border-outline-variant/30 p-8 rounded-2xl flex flex-col gap-6 md:col-span-2 bento-card">
          <h2 className="font-h2 text-xl text-stone-100 mb-2 select-none">Add New Project</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <div>
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 block select-none">Project Name</label>
                <input 
                  type="text" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-on-surface text-sm" 
                  placeholder="What's the project?" 
                />
              </div>
              <div>
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 block select-none">Deadline</label>
                <input 
                  type="date" 
                  value={projectDateTo}
                  onChange={(e) => setProjectDateTo(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-on-surface text-sm" 
                />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 block select-none">Description</label>
                <textarea 
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-on-surface h-24 resize-none text-sm" 
                  placeholder="Add project details or goals..."
                />
              </div>
              <div>
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 flex justify-between select-none">
                  <span>Progress</span>
                  <span className="text-secondary">{projectCompletion}%</span>
                </label>
                <ElasticSlider
                  defaultValue={parseInt(projectCompletion) || 0}
                  startingValue={0}
                  maxValue={100}
                  stepSize={1}
                  isStepped={true}
                  rangeColorClass="bg-secondary"
                  onChange={(val) => setProjectCompletion(Math.round(val))}
                  className="w-full mt-2"
                />
              </div>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleAddProject} 
            className="bg-teal-500/10 border border-teal-500/30 text-teal-300 px-6 py-3 rounded-lg font-label-caps text-xs uppercase tracking-widest hover:bg-teal-500/20 transition-all cursor-pointer"
          >
            Add Project
          </button>
        </div>

        {/* Current Week Calendar */}
        <div className="bg-white/[0.05] backdrop-blur-[20px] border border-outline-variant/30 p-8 rounded-2xl md:col-span-2 bento-card">
          <h2 className="font-h2 text-xl text-stone-100 mb-6 select-none">Current Week</h2>
          <div className="flex flex-wrap md:flex-nowrap justify-between gap-3 select-none">
            {weekDays.map((day) => {
              const dots = getDayIndicators(day.dateKey);
              return (
                <div 
                  key={day.dateKey}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '12px 4px',
                    borderRadius: '12px',
                    border: `1px solid ${day.isToday ? '#e6c183' : 'rgba(255,255,255,0.08)'}`,
                    background: day.isToday ? 'rgba(230,193,131,0.05)' : 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '50px'
                  }}
                >
                  <div className={`font-sans text-[10px] font-semibold tracking-wider uppercase mb-1 ${
                    day.isToday ? 'text-secondary' : 'text-stone-500'
                  }`}>
                    {day.dayName}
                  </div>
                  <div className={`text-lg font-newsreader font-bold mb-2 ${
                    day.isToday ? 'text-secondary' : 'text-stone-300'
                  }`}>
                    {day.dateNum}
                  </div>
                  {/* Dots Container */}
                  <div className="flex justify-center items-center gap-1 h-2.5">
                    {dots.map((dot, index) => (
                      <div 
                        key={index}
                        title={dot.name}
                        className="w-1.5 h-1.5 rounded-full" 
                        style={{ backgroundColor: dot.color }}
                      ></div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcomings Section */}
        <div className="bg-white/[0.05] backdrop-blur-[20px] border border-outline-variant/30 p-8 rounded-2xl md:col-span-2 bento-card">
          <h2 className="font-h2 text-xl text-stone-100 mb-6 select-none">Upcomings</h2>
          <div className="flex flex-col gap-3">
            {upcomingItems.length > 0 ? (
              upcomingItems.map((item) => (
                <div 
                  key={item.id}
                  className="p-4 border border-white/5 bg-white/[0.02] rounded-xl flex items-center gap-4 transition-all duration-300 hover:bg-white/[0.04]"
                >
                  {item.type !== 'Event' ? (
                    <input 
                      type="checkbox"
                      checked={item.type === 'Project' ? item.status === 'completed' : item.done}
                      onChange={() => {
                        if (item.type === 'Project') {
                          handleToggleProject(item.id, item.status !== 'completed');
                        } else {
                          handleToggleTask(item.id, item.done);
                        }
                      }}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-secondary focus:ring-secondary focus:ring-offset-0 transition-all cursor-pointer flex-shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-purple-500/30 flex items-center justify-center text-purple-400 select-none flex-shrink-0 font-bold text-[10px]">
                      E
                    </div>
                  )}

                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-on-surface text-sm">{item.name}</div>
                        <div className="text-xs text-on-surface-variant select-none">{item.subtitle}</div>
                      </div>
                      <div 
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider select-none"
                        style={{ 
                          backgroundColor: `${item.badgeColor}22`,
                          color: item.badgeColor
                        }}
                      >
                        {item.type}
                      </div>
                    </div>

                    {item.notes && (
                      <div className="text-xs text-on-surface-variant italic mt-1">{item.notes}</div>
                    )}
                    {item.desc && (
                      <div className="text-xs text-on-surface-variant italic mt-1">{item.desc}</div>
                    )}

                    {item.type === 'Project' && (
                      <div className="mt-3 flex items-center gap-4">
                        <ElasticSlider
                          defaultValue={item.pct}
                          startingValue={0}
                          maxValue={100}
                          stepSize={1}
                          isStepped={true}
                          rangeColorClass="bg-teal-400"
                          onChange={(val) => handleProjectSlider(item.id, Math.round(val))}
                          className="flex-grow mt-1"
                        />
                        <span className="text-xs font-semibold text-teal-400 min-w-[32px] text-right">
                          {item.pct}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {item.type === 'Event' && (
                    <button 
                      onClick={() => handleDeleteEvent(item.id)}
                      className="text-on-surface-variant hover:text-red-400 transition-colors p-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  )}
                  {item.type === 'Task' && (
                    <button 
                      onClick={() => handleDeleteTask(item.id)}
                      className="text-on-surface-variant hover:text-red-400 transition-colors p-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-on-surface-variant text-sm py-8 italic select-none">
                No upcomings yet. Add a task, event, or project above!
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Completed Section */}
        <div className="bg-white/[0.05] backdrop-blur-[20px] border border-outline-variant/30 p-8 rounded-2xl md:col-span-2 bento-card">
          <div 
            className="flex justify-between items-center cursor-pointer group select-none"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <h2 className="font-h2 text-xl text-stone-100">Completed</h2>
            <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 group-hover:text-stone-100 ${
              showCompleted ? 'rotate-180' : ''
            }`}>
              expand_more
            </span>
          </div>

          {showCompleted && (
            <div className="flex flex-col gap-3 mt-6">
              {completedItems.length > 0 ? (
                completedItems.map((item) => (
                  <div 
                    key={item.id}
                    className="p-4 border border-white/5 bg-white/[0.01] opacity-65 hover:opacity-100 rounded-xl flex items-center gap-4 transition-all duration-300"
                  >
                    <input 
                      type="checkbox"
                      checked={true}
                      onChange={() => {
                        if (item.type === 'Project') {
                          handleToggleProject(item.id, false);
                        } else {
                          handleToggleTask(item.id, false);
                        }
                      }}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-secondary focus:ring-secondary focus:ring-offset-0 transition-all cursor-pointer flex-shrink-0"
                    />
                    
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-on-surface text-sm line-through">{item.name}</div>
                          <div className="text-xs text-on-surface-variant select-none">{item.subtitle}</div>
                        </div>
                        <div 
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider select-none"
                          style={{ 
                            backgroundColor: `${item.badgeColor}22`,
                            color: item.badgeColor
                          }}
                        >
                          {item.type}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        if (item.type === 'Project') {
                          handleDeleteProject(item.id);
                        } else {
                          handleDeleteTask(item.id);
                        }
                      }}
                      className="text-on-surface-variant hover:text-red-400 transition-colors p-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center text-on-surface-variant text-sm py-4 italic select-none">
                  No completed items yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
