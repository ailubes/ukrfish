import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.set('trust proxy', true); // Needed to get the correct IP address if behind a proxy

// --- Production-specific code ---
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the 'dist' directory
  app.use(express.static(path.join(__dirname, '..', 'dist')));
}

// Database setup
const dbPath = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '..', 'data', 'analytics.db')
  : path.join(__dirname, 'src', 'data', 'analytics.db');

// Ensure the data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL,
      user_agent TEXT,
      referrer TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// API endpoint to get the total number of unique visitors
app.get('/api/views', (req, res) => {
  db.get('SELECT COUNT(DISTINCT ip) as count FROM visits', [], (err, row: { count: number }) => {
    if (err) {
      console.error('Error querying database', err.message);
      return res.status(500).json({ error: 'Failed to retrieve view count' });
    }
    res.json({ count: row.count || 0 });
  });
});

// API endpoint to record a new visit
app.post('/api/views', (req, res) => {
  const ip = req.ip;
  const userAgent = req.get('User-Agent');
  const { referrer } = req.body;

  const sql = `INSERT INTO visits (ip, user_agent, referrer) VALUES (?, ?, ?)`;
  db.run(sql, [ip, userAgent, referrer], function (err) {
    if (err) {
      console.error('Error inserting into database', err.message);
      return res.status(500).json({ error: 'Failed to record visit' });
    }
    
    // After inserting, get the new total unique count and return it
    db.get('SELECT COUNT(DISTINCT ip) as count FROM visits', [], (err, row: { count: number }) => {
      if (err) {
        console.error('Error querying database', err.message);
        return res.status(500).json({ error: 'Failed to retrieve view count' });
      }
      res.json({ count: row.count || 0 });
    });
  });
});

// --- Production-specific code ---
if (process.env.NODE_ENV === 'production') {
  // For any other request, serve the index.html file
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});