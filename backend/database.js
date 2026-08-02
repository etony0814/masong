const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', '肉鬆的生活日誌.db');
let db = null;

async function init() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }
  // 重建 milestones 表確保 UNIQUE 約束生效
  db.run('DROP TABLE IF EXISTS milestones');
  db.run(`
    CREATE TABLE milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL UNIQUE,
      description TEXT,
      date TEXT NOT NULL,
      icon TEXT DEFAULT '\u{1F31F}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // 重建其他表（IF NOT EXISTS）
  db.run(`
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL, mood TEXT DEFAULT 'happy',
      category TEXT DEFAULT 'daily', weight TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memory_id INTEGER, filename TEXT NOT NULL,
      caption TEXT DEFAULT '', order_index INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      drive_url TEXT DEFAULT '',
      FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memory_id INTEGER, filename TEXT NOT NULL,
      caption TEXT DEFAULT '', duration TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      drive_url TEXT DEFAULT '',
      FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
    );
  `);
  // 新增 drive_url 列（若舊資料表不存在）
  try { db.run("ALTER TABLE photos ADD COLUMN drive_url TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE videos ADD COLUMN drive_url TEXT DEFAULT ''"); } catch(e) {}
  // 插入預設里程碑
  const defaults = [
    ['肉鬆来到這個世界', '3個月大的可愛的邊境牧羊犬', '2026-04-30', '🐾'],
    ['第一次學會握手', '超聰明的肉鬆學得很快！', '2026-06-15', '🤝'],
    ['第一次去公園', '在草地上奔跑的模樣太可愛了', '2026-07-01', '🌳'],
  ];
  for (const d of defaults) {
    db.run('INSERT INTO milestones (title, description, date, icon) VALUES (?, ?, ?, ?)', d);
  }
  save();
  console.log('✅ 資料庫初始化完成');
  return db;
}

function run(sql, params = []) {
  if (!db) throw new Error('DB not initialized');
  db.run(sql, params);
  save();
}

function all(sql, params = []) {
  if (!db) throw new Error('DB not initialized');
  const result = db.exec(sql, params);
  if (result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
}

function get(sql, params = []) {
  const rows = all(sql, params);
  return rows[0] || null;
}

function insertAndGetId(sql, params = []) {
  if (!db) throw new Error('DB not initialized');
  db.run(sql, params);
  const r = db.exec('SELECT last_insert_rowid()');
  save();
  return r[0]?.values?.[0]?.[0] || 0;
}

function save() {
  if (!db) return;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

module.exports = { init, run, all, get, insertAndGetId, save };
