const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "capd.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    has_link INTEGER NOT NULL,
    asks_credentials INTEGER NOT NULL,
    impersonates_brand INTEGER NOT NULL,
    score INTEGER NOT NULL,
    severity TEXT NOT NULL,
    factors TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

const insertAnalysis = db.prepare(`
  INSERT INTO analyses (
    sender,
    subject,
    body,
    has_link,
    asks_credentials,
    impersonates_brand,
    score,
    severity,
    factors,
    created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

const recentAnalyses = db.prepare(`
  SELECT
    id,
    sender,
    subject,
    score,
    severity,
    factors,
    created_at
  FROM analyses
  ORDER BY id DESC
  LIMIT ?
`);

const dashboardStats = db.prepare(`
  SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) AS high_risk,
    SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) AS medium_risk,
    COALESCE(ROUND(AVG(score), 1), 0) AS avg_score
  FROM analyses
`);

module.exports = {
  insertAnalysis,
  recentAnalyses,
  dashboardStats,
};
