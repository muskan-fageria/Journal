import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
// TASKS ENDPOINTS
// ==========================================
app.get('/api/tasks', (req, res) => {
  const db = readDB();
  res.json(db.tasks || []);
});

app.post('/api/tasks', (req, res) => {
  const db = readDB();
  const task = {
    id: generateId(),
    done: false,
    date: new Date().toISOString().split('T')[0],
    ...req.body
  };
  db.tasks = db.tasks || [];
  db.tasks.push(task);
  writeDB(db);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const index = db.tasks.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  db.tasks[index] = { ...db.tasks[index], ...req.body };
  writeDB(db);
  res.json(db.tasks[index]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.tasks = (db.tasks || []).filter(t => t.id !== id);
  writeDB(db);
  res.json({ success: true });
});

app.delete('/api/tasks', (req, res) => {
  const db = readDB();
  // If ids provided in query or body, delete those, otherwise clear all completed
  const { ids } = req.body;
  if (Array.isArray(ids)) {
    db.tasks = (db.tasks || []).filter(t => !ids.includes(t.id));
  } else {
    db.tasks = (db.tasks || []).filter(t => !t.done);
  }
  writeDB(db);
  res.json({ success: true });
});

// ==========================================
// PROJECTS ENDPOINTS
// ==========================================
app.get('/api/projects', (req, res) => {
  const db = readDB();
  res.json(db.projects || []);
});

app.post('/api/projects', (req, res) => {
  const db = readDB();
  const project = {
    id: generateId(),
    pct: 0,
    status: 'active',
    ...req.body
  };
  db.projects = db.projects || [];
  db.projects.push(project);
  writeDB(db);
  res.status(201).json(project);
});

app.put('/api/projects/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const index = db.projects.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }
  db.projects[index] = { ...db.projects[index], ...req.body };
  writeDB(db);
  res.json(db.projects[index]);
});

app.delete('/api/projects/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.projects = (db.projects || []).filter(p => p.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// ==========================================
// EVENTS ENDPOINTS
// ==========================================
app.get('/api/events', (req, res) => {
  const db = readDB();
  res.json(db.events || []);
});

app.post('/api/events', (req, res) => {
  const db = readDB();
  const event = {
    id: generateId(),
    ...req.body
  };
  db.events = db.events || [];
  db.events.push(event);
  writeDB(db);
  res.status(201).json(event);
});

app.delete('/api/events/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.events = (db.events || []).filter(e => e.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// ==========================================
// HOBBIES (RHYTHMS) ENDPOINTS
// ==========================================
app.get('/api/hobbies', (req, res) => {
  const db = readDB();
  res.json(db.hobbies || []);
});

app.post('/api/hobbies', (req, res) => {
  const db = readDB();
  const hobby = {
    id: generateId(),
    mins: 0,
    streak: 0,
    ...req.body
  };
  db.hobbies = db.hobbies || [];
  db.hobbies.push(hobby);
  writeDB(db);
  res.status(201).json(hobby);
});

app.put('/api/hobbies/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const index = db.hobbies.findIndex(h => h.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Hobby not found' });
  }
  db.hobbies[index] = { ...db.hobbies[index], ...req.body };
  writeDB(db);
  res.json(db.hobbies[index]);
});

app.delete('/api/hobbies/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.hobbies = (db.hobbies || []).filter(h => h.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// ==========================================
// ENTRIES (PAST ARCHIVED DAYS) ENDPOINTS
// ==========================================
app.get('/api/entries', (req, res) => {
  const db = readDB();
  res.json(db.entries || []);
});

app.post('/api/entries', (req, res) => {
  const db = readDB();
  const entry = {
    id: generateId(),
    created_at: new Date().toISOString(),
    ...req.body
  };
  
  db.entries = db.entries || [];
  const existingIdx = db.entries.findIndex(e => e.date === entry.date);
  if (existingIdx !== -1) {
    db.entries[existingIdx] = { ...db.entries[existingIdx], ...req.body };
  } else {
    db.entries.unshift(entry);
  }
  
  writeDB(db);
  res.json(entry);
});

// ==========================================
// TODAY STATE ENDPOINTS
// ==========================================
app.get('/api/today', (req, res) => {
  const db = readDB();
  res.json(db.todayState || {});
});

app.put('/api/today', (req, res) => {
  const db = readDB();
  db.todayState = { ...(db.todayState || {}), ...req.body, updated_at: new Date().toISOString() };
  writeDB(db);
  res.json(db.todayState);
});

// ==========================================
// SOCIAL DATA ENDPOINTS
// ==========================================
app.get('/api/social', (req, res) => {
  const db = readDB();
  res.json(db.socialData || {});
});

app.put('/api/social', (req, res) => {
  const db = readDB();
  const { app_id, minutes } = req.body;
  db.socialData = db.socialData || {};
  if (app_id) {
    db.socialData[app_id] = minutes;
  } else {
    db.socialData = { ...db.socialData, ...req.body };
  }
  writeDB(db);
  res.json(db.socialData);
});

// ==========================================
// MEMORIES ENDPOINTS
// ==========================================
app.get('/api/memories', (req, res) => {
  const db = readDB();
  const list = db.memories || [];
  // Sort by created_at descending (newest first)
  list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  res.json(list);
});

app.post('/api/memories', (req, res) => {
  const db = readDB();
  const memory = {
    id: generateId(),
    created_at: new Date().toISOString(),
    ...req.body
  };
  db.memories = db.memories || [];
  db.memories.push(memory);
  writeDB(db);
  res.status(201).json(memory);
});

app.delete('/api/memories/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.memories = (db.memories || []).filter(m => m.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// ==========================================
// DIARY ENDPOINTS
// ==========================================
app.get('/api/diary', (req, res) => {
  const db = readDB();
  const list = db.diary || [];
  // Sort by created_at descending (newest first)
  list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  res.json(list);
});

app.post('/api/diary', (req, res) => {
  const db = readDB();
  const entry = {
    id: generateId(),
    created_at: new Date().toISOString(),
    ...req.body
  };
  db.diary = db.diary || [];
  db.diary.push(entry);
  writeDB(db);
  res.status(201).json(entry);
});

app.put('/api/diary/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const index = (db.diary || []).findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Diary entry not found' });
  }
  db.diary[index] = { ...db.diary[index], ...req.body, updated_at: new Date().toISOString() };
  writeDB(db);
  res.json(db.diary[index]);
});

app.delete('/api/diary/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.diary = (db.diary || []).filter(d => d.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
