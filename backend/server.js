const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./db/database');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-super-secret-jwt-key-for-angel-points'; // For MVP

app.use(cors());
// Need increased payload limit for base64 images
app.use(express.json({ limit: '10mb' }));

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  next();
};

/* --- Auth APIs --- */

// Login (Admin or Member)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  
  if (user) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, role: user.role, points: user.points, id: user.id });
  } else {
    res.status(401).json({ error: '帳號或密碼錯誤' });
  }
});

// Register (for users to sign up)
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  try {
    const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, password, 'member');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: '該帳號已被註冊' });
    } else {
      res.status(500).json({ error: '伺服器錯誤' });
    }
  }
});

// Get Current User Profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, username, role, points, last_checkin_date FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

/* --- Member APIs --- */

// Leaderboard - Weekly & Monthly
app.get('/api/leaderboard', authenticateToken, (req, res) => {
  const now = new Date();
  
  // Month string start (YYYY-MM-01T00:00:00.000Z)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  // Week string start (Monday)
  const day = now.getDay() || 7;
  const startOfWeekDate = new Date(now);
  startOfWeekDate.setHours(0,0,0,0);
  startOfWeekDate.setDate(now.getDate() - (day - 1));
  const startOfWeek = startOfWeekDate.toISOString();

  const getRankings = (startDate) => {
    return db.prepare(`
      SELECT u.username, SUM(t.amount) as total_points
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.amount > 0 AND t.created_at >= ?
      GROUP BY u.id
      ORDER BY total_points DESC
      LIMIT 10
    `).all(startDate);
  };

  const monthly = getRankings(startOfMonth);
  const weekly = getRankings(startOfWeek);

  res.json({ monthly, weekly });
});

// Redeem Product
app.post('/api/user/redeem', authenticateToken, (req, res) => {
  const { productId } = req.body;
  
  const generateRedeem = db.transaction(() => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(productId);
    
    if (!product) throw new Error('商品不存在或已下架');
    if (user.points < product.points_required) throw new Error('點數不足');
    
    db.prepare('UPDATE users SET points = points - ? WHERE id = ?').run(product.points_required, user.id);
    db.prepare('INSERT INTO transactions (user_id, amount, type, product_id) VALUES (?, ?, ?, ?)').run(user.id, -product.points_required, 'redeem', product.id);
  });

  try {
    generateRedeem();
    res.json({ success: true, message: '兌換成功！' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// User Scan QR
app.post('/api/user/qr/scan', authenticateToken, (req, res) => {
  const { token } = req.body;
  
  const active = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('qr_active').value;
  if (active !== 'true') return res.status(400).json({ error: '目前沒有開放掃描！' });
  
  const currentToken = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('qr_token').value;
  if (token !== currentToken) return res.status(400).json({ error: '無效或已過期的行動條碼' });
  
  const today = new Date().toISOString().split('T')[0];
  // Check if user already scanned any QR code today
  const scanCount = db.prepare(`SELECT count(*) as count FROM transactions WHERE user_id = ? AND type = 'qr_scan' AND date(created_at) = ?`).get(req.user.id, today).count;
  
  if (scanCount > 0) return res.status(400).json({ error: '您今天已經掃描領取過點數囉！' });
  
  const points = parseInt(db.prepare('SELECT value FROM system_settings WHERE key = ?').get('qr_points').value);
  
  const scanTransaction = db.transaction(() => {
    db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(points, req.user.id);
    db.prepare('INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)').run(req.user.id, points, 'qr_scan');
  });
  
  try {
    scanTransaction();
    res.json({ success: true, pointsEarned: points });
  } catch (err) {
    res.status(500).json({ error: '領取失敗' });
  }
});

// Get User History
app.get('/api/user/history', authenticateToken, (req, res) => {
  const transactions = db.prepare(`
    SELECT t.*, p.name as product_name 
    FROM transactions t 
    LEFT JOIN products p ON t.product_id = p.id 
    WHERE t.user_id = ? 
    ORDER BY t.created_at DESC
  `).all(req.user.id);
  res.json(transactions);
});

/* --- Admin APIs --- */

// Get all users
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const users = db.prepare("SELECT id, username, points, role, last_checkin_date FROM users WHERE role = 'member'").all();
  res.json(users);
});

// Admin Get History (Global History)
app.get('/api/admin/history', authenticateToken, requireAdmin, (req, res) => {
  const transactions = db.prepare(`
    SELECT t.*, p.name as product_name, u.username 
    FROM transactions t 
    LEFT JOIN products p ON t.product_id = p.id 
    LEFT JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
  `).all();
  res.json(transactions);
});

// Admin Get Systems Settings (QR State)
app.get('/api/admin/settings', authenticateToken, requireAdmin, (req, res) => {
  const settings = db.prepare('SELECT key, value FROM system_settings').all();
  const obj = Object.fromEntries(settings.map(s => [s.key, s.value]));
  res.json(obj);
});

// Admin Toggle QR Code
app.post('/api/admin/qr/toggle', authenticateToken, requireAdmin, (req, res) => {
  const { active, points } = req.body;
  const crypto = require('crypto');
  
  if (active) {
    const token = crypto.randomUUID();
    db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run('true', 'qr_active');
    db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run(token, 'qr_token');
    db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run(points.toString(), 'qr_points');
    res.json({ success: true, token, points, active: true });
  } else {
    db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run('false', 'qr_active');
    db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run('', 'qr_token');
    res.json({ success: true, active: false });
  }
});

// Grant points to a user based on performance
app.post('/api/admin/grant-points', authenticateToken, requireAdmin, (req, res) => {
  const { userId, points } = req.body;
  if (!points || points <= 0) return res.status(400).json({ error: '點數必須大於 0' });

  const grantPointsTx = db.transaction(() => {
    db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(points, userId);
    db.prepare('INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)').run(userId, points, 'admin_grant');
  });

  try {
    grantPointsTx();
    res.json({ success: true, message: '派發成功！' });
  } catch (error) {
    res.status(400).json({ error: '派發失敗' });
  }
});

// Add Product (Includes Base64 image payload)
app.post('/api/admin/products', authenticateToken, requireAdmin, (req, res) => {
  const { name, points_required, image_base64 } = req.body;
  
  if (!name || !points_required || !image_base64) {
    return res.status(400).json({ error: '缺少必要的商品資訊' });
  }

  const result = db.prepare('INSERT INTO products (name, points_required, image_base64) VALUES (?, ?, ?)').run(name, points_required, image_base64);
  res.json({ success: true, id: result.lastInsertRowid });
});

// Update Product Active Status
app.put('/api/admin/products/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  
  db.prepare('UPDATE products SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, id);
  res.json({ success: true });
});

// Delete Product
app.delete('/api/admin/products/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  // Soft delete or just hard delete if no fk constraints are breaking
  // For safety, let's just delete or mark inactive
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ success: true });
});

/* --- Public API --- */

// Get all Active Products
app.get('/api/products', (req, res) => {
  // Allow authenticated users (both admin and member) to view or just public
  const products = db.prepare('SELECT id, name, points_required, image_base64, is_active FROM products WHERE is_active = 1 ORDER BY created_at DESC').all();
  res.json(products);
});

// Admin Get all Products (including inactive)
app.get('/api/admin/products', authenticateToken, requireAdmin, (req, res) => {
  const products = db.prepare('SELECT id, name, points_required, image_base64, is_active FROM products ORDER BY created_at DESC').all();
  res.json(products);
});


// Serve Static React Frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 修正後的前端路由（不會報錯）
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});