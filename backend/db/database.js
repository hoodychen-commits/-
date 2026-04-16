const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'member',  -- 'admin' or 'member'
    points INTEGER DEFAULT 0,
    last_checkin_date TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    points_required INTEGER NOT NULL,
    image_base64 TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,          -- 'checkin', 'admin_grant', 'redeem'
    product_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Insert default admin if not exists
const adminCount = db.prepare('SELECT count(*) as count FROM users WHERE role = ?').get('admin').count;
if (adminCount === 0) {
  // Simple password 'admin123' for MVP (in production use bcrypt)
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', 'admin123', 'admin');
}

module.exports = db;

const settingCount = db.prepare('SELECT count(*) as count FROM system_settings').get().count;
if (settingCount === 0) {
  const insertStmt = db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)');
  insertStmt.run('qr_active', 'false');
  insertStmt.run('qr_token', '');
  insertStmt.run('qr_points', '10');
}
