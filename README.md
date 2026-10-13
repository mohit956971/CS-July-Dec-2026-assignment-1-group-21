# CS-July-Dec-2026-assignment-1-group-21

## Theme: AI & Cybersecurity

This project delivers a full functional website for an AI-powered cybersecurity concept:
**Context-Aware Phishing Defense (CAPD)**.

CAPD helps organizations detect phishing attempts by combining message content signals,
behavior/context indicators, and explainable risk scoring.

## Features

- **Landing page** explaining the cybersecurity problem and solution
- **Phishing Analyzer** where users submit suspicious messages
- **AI-inspired risk scoring** with explainable detection factors
- **SOC Dashboard** with saved analysis history and risk statistics
- **SQLite persistence** for all analysis records

## Tech Stack

- Node.js + Express
- better-sqlite3 (SQLite database)
- Plain HTML/CSS/JavaScript

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server:

   ```bash
   npm start
   ```

3. Open:

   - `http://localhost:3000` (default)
   - You can override with `PORT=8080 npm start`

## Project Structure

```text
CS-July-Dec-2026-assignment-1-group-21/
├── server.js          # Express routes and phishing scoring logic
├── db.js              # SQLite schema and prepared statements
├── views.js           # Shared HTML layout/render helpers
├── public/
│   ├── style.css      # UI styling
│   └── app.js         # Analyzer form and API integration
└── capd.db            # Auto-created local database at runtime
```

## Main Endpoints

- `GET /` - Home page
- `GET /analyze` - Phishing analyzer UI
- `POST /api/analyze` - Analyze message and save result
- `GET /dashboard` - Security operations dashboard
