const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// 固定密碼
const PASSWORD = '0412';

app.use(cors());
// 自定義 JSON body parser：跳過 multipart 請求
app.use((req, res, next) => {
  if (req.headers['content-type']?.includes('multipart')) return next();
  express.json()(req, res, next);
});
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

['photos', 'videos', 'covers'].forEach(dir => {
  fs.mkdirSync(path.join(__dirname, 'uploads', dir), { recursive: true });
});

// 簡單的 session 機制（用 cookie）
app.use((req, res, next) => {
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/mesong_auth=([^;]+)/);
  req.authenticated = match ? match[1] === PASSWORD : false;
  next();
});

function requireAuth(req, res, next) {
  if (!req.authenticated) return res.status(401).json({ error: '需要登入' });
  next();
}

const storage = (subDir) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads', subDir)),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
    cb(null, name);
  }
});

const photoUpload = multer({
  storage: storage('photos'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('只允許圖片檔案'));
  }
});

const videoUpload = multer({
  storage: storage('videos'),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('只允許影片檔案'));
  }
});

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('只允許圖片檔案'));
  }
});

const AVATAR_PATH = path.join(__dirname, '../frontend/images/avatar.jpg');

// ── 登入驗證 ──
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    res.cookie('mesong_auth', PASSWORD, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true });
  } else {
    res.status(401).json({ error: '密碼錯誤' });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('mesong_auth');
  res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
  res.json({ authenticated: req.authenticated });
});

// ── 公開 API（無需登入）──
app.get('/api/memories', (req, res) => res.json(db.all('SELECT * FROM memories ORDER BY date DESC')));
app.get('/api/memories/:id', (req, res) => {
  const m = db.get('SELECT * FROM memories WHERE id=?', [req.params.id]);
  if (!m) return res.status(404).json({ error: '找不到記錄' });
  const photos = db.all('SELECT * FROM photos WHERE memory_id=?', [m.id]);
  const videos = db.all('SELECT * FROM videos WHERE memory_id=?', [m.id]);
  res.json({ ...m, photos, videos });
});
app.get('/api/photos', (req, res) => res.json(db.all('SELECT * FROM photos ORDER BY created_at DESC')));
app.get('/api/videos', (req, res) => res.json(db.all('SELECT * FROM videos ORDER BY created_at DESC')));
app.get('/api/milestones', (req, res) => res.json(db.all('SELECT * FROM milestones ORDER BY date DESC')));
app.get('/api/milestones/:id', (req, res) => {
  const m = db.get('SELECT * FROM milestones WHERE id=?', [req.params.id]);
  if (!m) return res.status(404).json({ error: '找不到里程碑' });
  res.json(m);
});
app.get('/api/overview', (req, res) => {
  const memoryCount = db.get('SELECT COUNT(*) as count FROM memories');
  const photoCount = db.get('SELECT COUNT(*) as count FROM photos');
  const videoCount = db.get('SELECT COUNT(*) as count FROM videos');
  const latestMemory = db.get('SELECT * FROM memories ORDER BY date DESC LIMIT 1');
  const milestones = db.all('SELECT * FROM milestones ORDER BY date ASC LIMIT 5');
  res.json({ memoryCount: memoryCount.count, photoCount: photoCount.count, videoCount: videoCount.count, latestMemory, milestones });
});
app.get('/api/age', (req, res) => {
  const firstMilestone = db.get("SELECT * FROM milestones ORDER BY date ASC LIMIT 1");
  if (!firstMilestone || !firstMilestone.date) return res.json({ years: 0, months: 0, days: 0, text: '' });
  const birth = new Date(firstMilestone.date);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  let text = '';
  if (years > 0) text += years + '歲';
  if (months > 0) text += ' ' + months + '個月';
  if (days > 0 && months === 0 && years === 0) text += ' ' + days + '天';
  if (!text) text = '剛出生';
  res.json({ years, months, days, text, totalDays: Math.floor((now - birth) / 86400000) });
});
app.get('/api/announcements', (req, res) => {
  const milestones = db.all('SELECT * FROM milestones ORDER BY date ASC');
  const now = new Date();
  const today = { month: now.getMonth() + 1, day: now.getDate() };
  const announcements = milestones.filter(m => {
    const d = new Date(m.date);
    return d.getMonth() + 1 === today.month && d.getDate() === today.day;
  }).map(m => m.title);
  const upcoming = [];
  for (let i = 1; i <= 7; i++) {
    const future = new Date(now);
    future.setDate(future.getDate() + i);
    const fm = { month: future.getMonth() + 1, day: future.getDate() };
    const found = milestones.find(m => {
      const d = new Date(m.date);
      return d.getMonth() + 1 === fm.month && d.getDate() === fm.day;
    });
    if (found) upcoming.push({ title: found.title, date: found.date, daysUntil: i });
  }
  res.json({ today: announcements.length > 0 ? announcements.join('、') : null, upcoming });
});
app.get('/api/avatar', (req, res) => res.json({ exists: fs.existsSync(AVATAR_PATH) }));

// ── 需要登入的 API ──
app.post('/api/memories', requireAuth, (req, res) => {
  const { title, content, date, mood, category, weight } = req.body;
  const d = date || new Date().toISOString().split('T')[0];
  const id = db.insertAndGetId(
    'INSERT INTO memories (title, content, date, mood, category, weight) VALUES (?, ?, ?, ?, ?, ?)',
    [title, content || '', d, mood || 'happy', category || 'daily', weight || '']
  );
  res.json({ id, title, content, date: d, mood: mood || 'happy', category: category || 'daily', weight: weight || '' });
});
app.put('/api/memories/:id', requireAuth, (req, res) => {
  const { title, content, date, mood, category, weight } = req.body;
  db.run('UPDATE memories SET title=?, content=?, date=?, mood=?, category=?, weight=? WHERE id=?',
    [title, content, date, mood, category, weight, req.params.id]);
  res.json({ success: true });
});
app.delete('/api/memories/:id', requireAuth, (req, res) => {
  db.run('DELETE FROM photos WHERE memory_id=?', [req.params.id]);
  db.run('DELETE FROM videos WHERE memory_id=?', [req.params.id]);
  db.run('DELETE FROM memories WHERE id=?', [req.params.id]);
  res.json({ success: true });
});
app.post('/api/photos', requireAuth, photoUpload.single('photo'), (req, res) => {
  const { memory_id, caption, order_index } = req.body;
  if (!req.file) return res.status(400).json({ error: '沒有檔案' });
  const id = db.insertAndGetId(
    'INSERT INTO photos (memory_id, filename, caption, order_index) VALUES (?, ?, ?, ?)',
    [memory_id || null, req.file.filename, caption || '', order_index || 0]
  );
  res.json({ id, filename: req.file.filename });
});
app.post('/api/videos', requireAuth, videoUpload.single('video'), (req, res) => {
  const { memory_id, caption, duration } = req.body;
  if (!req.file) return res.status(400).json({ error: '沒有檔案' });
  const id = db.insertAndGetId(
    'INSERT INTO videos (memory_id, filename, caption, duration) VALUES (?, ?, ?, ?)',
    [memory_id || null, req.file.filename, caption || '', duration || '']
  );
  res.json({ id, filename: req.file.filename });
});
app.post('/api/milestones', requireAuth, (req, res) => {
  const { title, description, date, icon } = req.body;
  const id = db.insertAndGetId(
    'INSERT INTO milestones (title, description, date, icon) VALUES (?, ?, ?, ?)',
    [title, description || '', date, icon || '🌟']
  );
  res.json({ id, title, description, date, icon });
});
app.put('/api/milestones/:id', requireAuth, (req, res) => {
  const { title, description, date, icon } = req.body;
  db.run('UPDATE milestones SET title=?, description=?, date=?, icon=? WHERE id=?',
    [title, description || '', date, icon || '🌟', req.params.id]);
  res.json({ success: true });
});
app.delete('/api/milestones/:id', requireAuth, (req, res) => {
  db.run('DELETE FROM milestones WHERE id=?', [req.params.id]);
  res.json({ success: true });
});
app.delete('/api/photos/:id', requireAuth, (req, res) => {
  const photo = db.get('SELECT filename FROM photos WHERE id=?', [req.params.id]);
  if (photo) { try { fs.unlinkSync(path.join(__dirname, 'uploads', 'photos', photo.filename)); } catch (e) {} }
  db.run('DELETE FROM photos WHERE id=?', [req.params.id]);
  res.json({ success: true });
});
app.delete('/api/videos/:id', requireAuth, (req, res) => {
  const video = db.get('SELECT filename FROM videos WHERE id=?', [req.params.id]);
  if (video) { try { fs.unlinkSync(path.join(__dirname, 'uploads', 'videos', video.filename)); } catch (e) {} }
  db.run('DELETE FROM videos WHERE id=?', [req.params.id]);
  res.json({ success: true });
});
app.post('/api/avatar', requireAuth, avatarUpload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '沒有檔案' });
  fs.writeFileSync(AVATAR_PATH, req.file.buffer);
  res.json({ success: true });
});
app.delete('/api/avatar', requireAuth, (req, res) => {
  if (fs.existsSync(AVATAR_PATH)) fs.unlinkSync(AVATAR_PATH);
  res.json({ success: true });
});
// ── 首頁標題 ──
app.get('/api/hero', (req, res) => {
  const row = db.get('SELECT value FROM config WHERE key=?', ['hero_title']);
  res.json({ title: row ? row.value : null });
});
app.post('/api/hero', requireAuth, (req, res) => {
  const { title } = req.body;
  db.run('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', ['hero_title', title || '']);
  res.json({ success: true });
});


// ── 匯出（需登入）──
function sendFile(res, data, filename) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="' + safeName + '"');
  res.send(data);
}

app.get('/api/export/json', requireAuth, (req, res) => {
  const data = {
    memories: db.all('SELECT * FROM memories ORDER BY date DESC'),
    photos: db.all('SELECT * FROM photos ORDER BY created_at DESC'),
    videos: db.all('SELECT * FROM videos ORDER BY created_at DESC'),
    milestones: db.all('SELECT * FROM milestones ORDER BY date DESC'),
    exportedAt: new Date().toISOString()
  };
  res.setHeader('Content-Type', 'application/json');
  sendFile(res, Buffer.from(JSON.stringify(data, null, 2)), 'mesong-backup.json');
});

app.get('/api/export/csv', requireAuth, (req, res) => {
  const memories = db.all('SELECT * FROM memories ORDER BY date DESC');
  const headers = ['ID', 'Title', 'Content', 'Date', 'Mood', 'Category', 'Weight_kg', 'CreatedAt'];
  const rows = memories.map(m =>
    [m.id, m.title, (m.content || '').replace(/"/g, '""'), m.date, m.mood, m.category, m.weight || '', m.created_at]
      .map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  sendFile(res, Buffer.from('\uFEFF' + csv, 'utf8'), 'mesong-records.csv');
});

app.get('/api/export/db', requireAuth, (req, res) => {
  const dbPath = path.join(__dirname, 'data', '肉鬆的生活日誌.db');
  if (!fs.existsSync(dbPath)) return res.status(404).json({ error: 'DB not found' });
  const buf = fs.readFileSync(dbPath);
  res.setHeader('Content-Type', 'application/octet-stream');
  sendFile(res, buf, 'mesong-database.db');
});

async function start() {
  await db.init();
  app.listen(PORT, () => console.log(`🐕 肉鬆的生活日誌 → http://localhost:${PORT}`));
}
start();