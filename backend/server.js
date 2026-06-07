import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, createUserClient } from './supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'data', 'db.json');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support base64 image strings

// Helper to read database
function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return {
      tasks: [],
      projects: [],
      events: [],
      hobbies: [],
      entries: [],
      memories: [],
      diary: [],
      socialData: {},
      todayState: {}
    };
  }
}

// Helper to write database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing database:", err);
    return false;
  }
}

// Generate random ID helper
function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  req.user = user;
  req.supabase = createUserClient(token);
  next();
};

app.use('/api', authenticateUser);

// ==========================================
// TASKS ENDPOINTS (Supabase)
// ==========================================
app.get('/api/tasks', async (req, res) => {
  const { data, error } = await req.supabase
    .from('tasks')
    .select('*')
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/tasks', async (req, res) => {
  const task = {
    user_id: req.user.id,
    done: false,
    date: new Date().toISOString().split('T')[0],
    ...req.body
  };
  const { data, error } = await req.supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await req.supabase
    .from('tasks')
    .update(req.body)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Task not found' });
  res.json(data);
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await req.supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/tasks', async (req, res) => {
  const { ids } = req.body;
  if (Array.isArray(ids) && ids.length > 0) {
    const { error } = await req.supabase
      .from('tasks')
      .delete()
      .in('id', ids)
      .eq('user_id', req.user.id);
    if (error) return res.status(500).json({ error: error.message });
  } else {
    const { error } = await req.supabase
      .from('tasks')
      .delete()
      .eq('done', true)
      .eq('user_id', req.user.id);
    if (error) return res.status(500).json({ error: error.message });
  }
  res.json({ success: true });
});

// ==========================================
// PROJECTS ENDPOINTS (Supabase)
// ==========================================
app.get('/api/projects', async (req, res) => {
  const { data, error } = await req.supabase
    .from('projects')
    .select('*')
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/projects', async (req, res) => {
  const project = {
    user_id: req.user.id,
    pct: 0,
    status: 'active',
    ...req.body
  };
  const { data, error } = await req.supabase
    .from('projects')
    .insert(project)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.put('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await req.supabase
    .from('projects')
    .update(req.body)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Project not found' });
  res.json(data);
});

app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await req.supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ==========================================
// EVENTS ENDPOINTS (Supabase)
// ==========================================
app.get('/api/events', async (req, res) => {
  const { data, error } = await req.supabase
    .from('events')
    .select('*')
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/events', async (req, res) => {
  const event = {
    user_id: req.user.id,
    ...req.body
  };
  const { data, error } = await req.supabase
    .from('events')
    .insert(event)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.delete('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await req.supabase
    .from('events')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ==========================================
// HOBBIES (RHYTHMS) ENDPOINTS (Supabase)
// ==========================================
app.get('/api/hobbies', async (req, res) => {
  const { data, error } = await req.supabase
    .from('hobbies')
    .select('*')
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/hobbies', async (req, res) => {
  const hobby = {
    user_id: req.user.id,
    mins: 0,
    streak: 0,
    ...req.body
  };
  const { data, error } = await req.supabase
    .from('hobbies')
    .insert(hobby)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.put('/api/hobbies/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await req.supabase
    .from('hobbies')
    .update(req.body)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/hobbies/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await req.supabase
    .from('hobbies')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ==========================================
// ENTRIES (PAST ARCHIVED DAYS) ENDPOINTS (Supabase - Dynamically Synced)
// ==========================================
const formatDateStr = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

app.get('/api/entries', async (req, res) => {
  // 1. Fetch all today_state records for the user
  const { data: states, error: statesError } = await req.supabase
    .from('today_state')
    .select('*')
    .eq('user_id', req.user.id)
    .order('date', { ascending: false });

  if (statesError) return res.status(500).json({ error: statesError.message });

  // 2. Fetch all completed tasks for the user
  const { data: tasks, error: tasksError } = await req.supabase
    .from('tasks')
    .select('name, date, due')
    .eq('user_id', req.user.id)
    .eq('done', true);

  if (tasksError) return res.status(500).json({ error: tasksError.message });

  // 3. Combine them
  const entriesList = (states || []).map(row => {
    const dateKey = typeof row.date === 'string' ? row.date.split('T')[0] : new Date(row.date).toISOString().split('T')[0];
    const doneTasksForDay = (tasks || [])
      .filter(t => t.date === dateKey || t.due === dateKey)
      .map(t => t.name);

    return {
      id: row.id,
      date: dateKey,
      dateStr: formatDateStr(dateKey),
      mood: row.mood || '',
      weather: row.weather || '',
      rating: row.rating || 0,
      remark: row.remark || '',
      gratitude: row.gratitude || '',
      oneWord: row.one_word || '',
      tasks: doneTasksForDay,
      energy: row.energy || 5.0,
      focus: row.focus || 5.0,
      productive: row.productive || '0',
      steps: row.steps || '0',
      water: row.water || '0L',
      sleep: row.sleep || '0h',
      exercise: row.exercise || '0m',
      created_at: row.created_at
    };
  });

  res.json(entriesList);
});

app.post('/api/entries', async (req, res) => {
  const dateKey = req.body.date;
  const payload = {
    user_id: req.user.id,
    date: dateKey,
    mood: req.body.mood,
    weather: req.body.weather,
    rating: req.body.rating,
    remark: req.body.remark,
    gratitude: req.body.gratitude,
    one_word: req.body.oneWord,
    energy: req.body.energy,
    focus: req.body.focus,
    productive: req.body.productive,
    steps: req.body.steps,
    water: req.body.water,
    sleep: req.body.sleep,
    exercise: req.body.exercise,
    updated_at: new Date().toISOString(),
  };
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

  // 1. Upsert into today_state
  const { data: row, error: stateError } = await req.supabase
    .from('today_state')
    .upsert(payload, { onConflict: 'user_id,date' })
    .select()
    .single();

  if (stateError) return res.status(500).json({ error: stateError.message });

  // 2. Fetch completed tasks for this date
  const { data: tasks, error: tasksError } = await req.supabase
    .from('tasks')
    .select('name')
    .eq('user_id', req.user.id)
    .eq('done', true)
    .or(`date.eq.${dateKey},due.eq.${dateKey}`);

  if (tasksError) return res.status(500).json({ error: tasksError.message });

  const doneTasksForDay = (tasks || []).map(t => t.name);

  // 3. Return compiled entry
  res.json({
    id: row.id,
    date: dateKey,
    dateStr: formatDateStr(dateKey),
    mood: row.mood || '',
    weather: row.weather || '',
    rating: row.rating || 0,
    remark: row.remark || '',
    gratitude: row.gratitude || '',
    oneWord: row.one_word || '',
    tasks: doneTasksForDay,
    energy: row.energy || 5.0,
    focus: row.focus || 5.0,
    productive: row.productive || '0',
    steps: row.steps || '0',
    water: row.water || '0L',
    sleep: row.sleep || '0h',
    exercise: row.exercise || '0m',
    created_at: row.created_at
  });
});

// ==========================================
// TODAY STATE ENDPOINTS (Supabase)
// ==========================================
app.get('/api/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await req.supabase
    .from('today_state')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('date', today)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.json({});
  // Map DB snake_case to frontend camelCase
  res.json({
    mood: data.mood || '',
    weather: data.weather || '',
    rating: data.rating || 0,
    energy: data.energy || 5.0,
    focus: data.focus || 5.0,
    stress: data.stress || 0,
    remark: data.remark || '',
    gratitude: data.gratitude || '',
    oneWord: data.one_word || '',
    steps: data.steps || '0',
    water: data.water || '0L',
    sleep: data.sleep || '0h',
    exercise: data.exercise || '0m',
    productive: data.productive || '0',
    mindfulness: data.mindfulness || '0 Minutes',
    mindGoal: data.mind_goal || '150 Minutes',
  });
});

app.put('/api/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const payload = {
    user_id: req.user.id,
    date: today,
    mood: req.body.mood,
    weather: req.body.weather,
    rating: req.body.rating,
    energy: req.body.energy,
    focus: req.body.focus,
    stress: req.body.stress,
    remark: req.body.remark,
    gratitude: req.body.gratitude,
    one_word: req.body.oneWord,
    steps: req.body.steps,
    water: req.body.water,
    sleep: req.body.sleep,
    exercise: req.body.exercise,
    productive: req.body.productive,
    mindfulness: req.body.mindfulness,
    mind_goal: req.body.mindGoal,
    updated_at: new Date().toISOString(),
  };
  // Remove undefined keys
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

  const { data, error } = await req.supabase
    .from('today_state')
    .upsert(payload, { onConflict: 'user_id,date' })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ==========================================
// SOCIAL DATA ENDPOINTS (Supabase)
// ==========================================
app.get('/api/social', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await req.supabase
    .from('social_data')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('date', today);
  if (error) return res.status(500).json({ error: error.message });
  // Convert array of rows into { app_id: minutes } object for frontend
  const result = {};
  (data || []).forEach(row => { result[row.app_id] = row.minutes; });
  res.json(result);
});

app.put('/api/social', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { app_id, minutes } = req.body;
  if (!app_id) return res.status(400).json({ error: 'app_id required' });

  const payload = {
    user_id: req.user.id,
    date: today,
    app_id,
    minutes,
  };

  const { error } = await req.supabase
    .from('social_data')
    .upsert(payload, { onConflict: 'user_id,date,app_id' });
  if (error) return res.status(500).json({ error: error.message });

  // Return the full social data object
  const { data: allData } = await req.supabase
    .from('social_data')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('date', today);
  const result = {};
  (allData || []).forEach(row => { result[row.app_id] = row.minutes; });
  res.json(result);
});

// ==========================================
// MEMORIES ENDPOINTS
// ==========================================
app.get('/api/memories', async (req, res) => {
  const { data, error } = await req.supabase
    .from('memories')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/memories', async (req, res) => {
  const memory = {
    user_id: req.user.id,
    date: req.body.date || new Date().toISOString().split('T')[0],
    title: req.body.title,
    description: req.body.description,
    image_url: req.body.image_url,
    file_path: req.body.file_path,
  };
  
  const { data, error } = await req.supabase
    .from('memories')
    .insert(memory)
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.delete('/api/memories/:id', async (req, res) => {
  const { id } = req.params;
  
  // 1. Get the memory to find the file_path
  const { data: memory, error: fetchError } = await req.supabase
    .from('memories')
    .select('file_path')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    return res.status(500).json({ error: fetchError.message });
  }

  // 2. Delete the file from Supabase Storage if it exists
  if (memory && memory.file_path) {
    const { error: storageError } = await req.supabase
      .storage
      .from('memories')
      .remove([memory.file_path]);
    
    if (storageError) {
      console.error("Error deleting file from storage:", storageError);
    }
  }

  // 3. Delete the row from the database
  const { error: deleteError } = await req.supabase
    .from('memories')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (deleteError) return res.status(500).json({ error: deleteError.message });
  
  res.json({ success: true });
});

// ==========================================
// DIARY ENDPOINTS (Supabase)
// ==========================================
app.get('/api/diary', async (req, res) => {
  const { data, error } = await req.supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/diary', async (req, res) => {
  const entry = {
    user_id: req.user.id,
    ...req.body
  };
  const { data, error } = await req.supabase
    .from('diary_entries')
    .insert(entry)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.put('/api/diary/:id', async (req, res) => {
  const { id } = req.params;
  const updatePayload = {
    ...req.body,
    updated_at: new Date().toISOString()
  };
  delete updatePayload.id;
  delete updatePayload.user_id;

  const { data, error } = await req.supabase
    .from('diary_entries')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Diary entry not found' });
  res.json(data);
});

app.delete('/api/diary/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await req.supabase
    .from('diary_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
