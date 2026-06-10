import React, { useState } from 'react';
import ElasticSlider from '../components/ElasticSlider';
import { authFetch } from '../utils/authFetch';

export default function GoalsPage({ projects, setProjects, effectiveDateStr, toast }) {
  const [goalName, setGoalName] = useState('');
  const [goalDeadline, setGoalDeadline] = useState(effectiveDateStr);
  const [goalDesc, setGoalDesc] = useState('');
  const [goalProgress, setGoalProgress] = useState(0);

  const handleAddGoal = async () => {
    if (!goalName.trim()) return toast('Please enter a goal name.');
    const newProject = {
      name: goalName,
      deadline: goalDeadline || null,
      desc: goalDesc,
      pct: parseInt(goalProgress) || 0,
      status: 'active'
    };
    try {
      const res = await authFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(newProject)
      });
      const data = await res.json();
      setProjects([...projects, data]);
      setGoalName('');
      setGoalDesc('');
      setGoalProgress(0);
      toast('Goal added ✓');
    } catch (err) {
      console.error(err);
      toast('Failed to add goal');
    }
  };

  const handleProgressSlider = async (id, val) => {
    const pct = parseInt(val);
    setProjects(projects.map(p => p.id === id ? { ...p, pct } : p));
    await authFetch(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ pct })
    });
  };

  const handleToggleGoal = async (id, currentStatus) => {
    const isCompleted = currentStatus === 'completed';
    const status = isCompleted ? 'active' : 'completed';
    const pct = isCompleted ? 90 : 100;
    
    setProjects(projects.map(p => p.id === id ? { ...p, status, pct } : p));
    await authFetch(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, pct })
    });
    toast(isCompleted ? 'Goal marked active' : 'Goal completed! ✦');
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Let this goal fade?')) return;
    setProjects(projects.filter(p => p.id !== id));
    await authFetch(`/api/projects/${id}`, { method: 'DELETE' });
    toast('Goal deleted');
  };

  const activeGoals = projects.filter(p => p.status !== 'completed');
  const completedGoals = projects.filter(p => p.status === 'completed');

  return (
    <div className="page max-w-6xl mx-auto w-full animate-fade-in flex flex-col gap-10 pb-20 select-none">
      
      {/* Page Header */}
      <header className="border-b border-outline pb-6">
        <span className="font-sans text-[10px] text-secondary font-semibold tracking-widest uppercase mb-1 block">
          Vision & Alignment
        </span>
        <h1 className="font-h1 text-4xl text-on-surface font-semibold">Goals</h1>
        <p className="font-sans text-xs text-on-surface-variant italic mt-1">
          Direct your gaze toward your long-term intentions. Tend to them slowly and consistently.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Create Goal Form */}
        <div className="lg:col-span-5 bg-surface border border-outline p-6 md:p-8 rounded-2xl flex flex-col gap-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="font-sans text-[10px] text-secondary font-semibold tracking-widest uppercase">
              Intentions
            </span>
            <h2 className="font-newsreader text-2xl text-on-surface">Formulate Goal</h2>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider">Goal Title</label>
              <input 
                type="text" 
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="w-full bg-surface-container-high/30 border border-outline rounded-xl p-3 text-on-surface text-sm focus:border-secondary focus:ring-0" 
                placeholder="What is your focus area?" 
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider">Target Date</label>
              <input 
                type="date" 
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
                className="w-full bg-surface-container-high/30 border border-outline rounded-xl p-3 text-on-surface text-sm focus:border-secondary focus:ring-0" 
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider">Narrative / Milestones</label>
              <textarea 
                value={goalDesc}
                onChange={(e) => setGoalDesc(e.target.value)}
                className="w-full bg-surface-container-high/30 border border-outline rounded-xl p-3 text-on-surface h-24 resize-none text-sm focus:border-secondary focus:ring-0" 
                placeholder="Describe what milestone represents this goal..."
              />
            </div>

            <div className="flex flex-col gap-1 mb-2">
              <div className="flex justify-between items-center text-xs text-on-surface mb-1 select-none">
                <span className="font-sans text-[10px] text-on-surface-variant uppercase tracking-wider">Initial Progress</span>
                <span className="text-secondary font-semibold">{goalProgress}%</span>
              </div>
              <ElasticSlider
                defaultValue={goalProgress}
                startingValue={0}
                maxValue={100}
                stepSize={5}
                isStepped={true}
                rangeColorClass="bg-secondary"
                onChange={(val) => setGoalProgress(Math.round(val))}
              />
            </div>

            <button 
              type="button" 
              onClick={handleAddGoal} 
              className="bg-secondary text-white px-6 py-3 rounded-xl font-sans text-xs uppercase tracking-widest hover:bg-secondary/90 transition-all cursor-pointer shadow-sm w-full"
            >
              Add Intention
            </button>
          </div>
        </div>

        {/* Right Column: Goal List */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {/* Active Goals */}
          <div className="flex flex-col gap-4">
            <h3 className="font-newsreader text-2xl text-on-surface select-none">Active Intentions</h3>
            <div className="flex flex-col gap-4">
              {activeGoals.length > 0 ? (
                activeGoals.map((item) => (
                  <div 
                    key={item.id}
                    className="p-5 border border-outline bg-surface rounded-2xl flex flex-col gap-4 shadow-sm hover:border-secondary/40 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <input 
                        type="checkbox"
                        checked={false}
                        onChange={() => handleToggleGoal(item.id, item.status)}
                        className="w-5 h-5 rounded border-outline bg-transparent text-secondary focus:ring-secondary focus:ring-offset-0 transition-all cursor-pointer mt-1"
                      />
                      <div className="flex-grow">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-newsreader text-xl text-on-surface leading-snug">{item.name}</h4>
                          <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded font-sans tracking-wide uppercase flex-shrink-0 select-none">
                            {item.deadline ? `Target: ${item.deadline}` : 'No deadline'}
                          </span>
                        </div>
                        {item.desc && (
                          <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">{item.desc}</p>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteGoal(item.id)}
                        className="text-on-surface-variant hover:text-red-500 transition-colors p-1 cursor-pointer flex-shrink-0"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>

                    <div className="border-t border-outline/50 pt-3 flex items-center gap-4">
                      <ElasticSlider
                        defaultValue={item.pct}
                        startingValue={0}
                        maxValue={100}
                        stepSize={1}
                        isStepped={true}
                        rangeColorClass="bg-secondary"
                        onChange={(val) => handleProgressSlider(item.id, Math.round(val))}
                        className="flex-grow"
                      />
                      <span className="text-xs font-semibold text-secondary min-w-[32px] text-right">
                        {item.pct}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-on-surface-variant text-sm py-12 border border-outline border-dashed rounded-2xl italic select-none">
                  No active goals. Consider planning something meaningful.
                </div>
              )}
            </div>
          </div>

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div className="flex flex-col gap-4 mt-4">
              <h3 className="font-newsreader text-2xl text-on-surface select-none">Completed Intentions</h3>
              <div className="flex flex-col gap-3">
                {completedGoals.map((item) => (
                  <div 
                    key={item.id}
                    className="p-4 border border-outline bg-surface-container-high/20 rounded-2xl flex items-center gap-4 opacity-75 hover:opacity-100 transition-all shadow-sm"
                  >
                    <input 
                      type="checkbox"
                      checked={true}
                      onChange={() => handleToggleGoal(item.id, item.status)}
                      className="w-5 h-5 rounded border-outline bg-transparent text-secondary focus:ring-secondary focus:ring-offset-0 transition-all cursor-pointer"
                    />
                    
                    <div className="flex-grow">
                      <h4 className="font-newsreader text-lg text-on-surface line-through leading-snug">{item.name}</h4>
                      {item.desc && (
                        <p className="text-xs text-on-surface-variant line-through mt-0.5 truncate max-w-sm">{item.desc}</p>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteGoal(item.id)}
                      className="text-on-surface-variant hover:text-red-500 transition-colors p-1 cursor-pointer flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
