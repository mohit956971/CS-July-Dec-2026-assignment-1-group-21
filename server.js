const express = require("express");
const path = require("path");
const { insertAnalysis, recentAnalyses, dashboardStats } = require("./db");
const { layout, severityBadge, escapeHtml } = require("./views");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));

const PHISHING_PATTERNS = [
  { regex: /urgent|immediately|asap|within\s*\d+\s*(minutes|hours)/i, points: 15, reason: "Urgency language" },
  { regex: /verify\s+your\s+account|account\s+suspended|security\s+alert/i, points: 15, reason: "Account fear trigger" },
  { regex: /click\s+here|open\s+this\s+link|download\s+attachment/i, points: 12, reason: "Action forcing" },
  { regex: /gift\s*card|wire\s*transfer|payment\s*request|invoice/i, points: 14, reason: "Financial lure" },
  { regex: /password|otp|2fa|one\s*time\s*code|credential/i, points: 16, reason: "Credential harvesting cues" },
  { regex: /confidential|do\s+not\s+tell\s+anyone|secret/i, points: 10, reason: "Secrecy pressure" },
];

function analyzeSignal(payload) {
  const sender = payload.sender.trim();
  const subject = payload.subject.trim();
  const body = payload.body.trim();
  const hasLink = Boolean(payload.hasLink);
  const asksCredentials = Boolean(payload.asksCredentials);
  const impersonatesBrand = Boolean(payload.impersonatesBrand);

  const combined = `${subject} ${body}`;
  let score = 0;
  const factors = [];

  for (const pattern of PHISHING_PATTERNS) {
    if (pattern.regex.test(combined)) {
      score += pattern.points;
      factors.push(pattern.reason);
    }
  }

  if (hasLink) {
    score += 12;
    factors.push("Contains external link");
  }

  if (asksCredentials) {
    score += 22;
    factors.push("Requests credentials/OTP");
  }

  if (impersonatesBrand) {
    score += 18;
    factors.push("Possible brand impersonation");
  }

  if (/(@gmail\.com|@outlook\.com|@yahoo\.com)$/i.test(sender)) {
    score += 8;
    factors.push("Uses non-corporate sender domain");
  }

  if (!factors.length) {
    factors.push("No high-risk phishing patterns detected");
  }

  score = Math.min(score, 100);

  const severity = score >= 65 ? "High" : score >= 35 ? "Medium" : "Low";

  return { sender, subject, body, hasLink, asksCredentials, impersonatesBrand, score, severity, factors };
}

app.get("/", (_req, res) => {
  res.send(
    layout({
      title: "AI-Powered Cybersecurity",
      body: `
      <section class="hero">
        <p class="kicker">AI & Cybersecurity Project</p>
        <h1>Context-Aware Phishing Defense (CAPD)</h1>
        <p>
          CAPD is an AI-inspired phishing defense website that combines language analysis,
          behavior-based indicators, and context signals to help teams spot suspicious messages.
        </p>
        <div class="cta-row">
          <a class="btn primary" href="/analyze">Start Analysis</a>
          <a class="btn secondary" href="/dashboard">View Dashboard</a>
        </div>
      </section>

      <section class="grid">
        <article class="panel">
          <h3>Threat Detection</h3>
          <p>Detect urgency, impersonation, credential theft signals, and financial scam indicators.</p>
        </article>
        <article class="panel">
          <h3>AI-Assisted Security Ops</h3>
          <p>Risk scores and explainable factors help SOC teams prioritize alerts quickly.</p>
        </article>
        <article class="panel">
          <h3>Security Awareness</h3>
          <p>Users can test suspicious messages and understand why they are risky.</p>
        </article>
      </section>
    `,
    })
  );
});

app.get("/analyze", (_req, res) => {
  res.send(
    layout({
      title: "Phishing Analyzer",
      body: `
      <section class="panel form-wrap">
        <h1>Phishing Analyzer</h1>
        <p>Submit a suspicious email or message to calculate a phishing risk score.</p>
        <form id="analysis-form" class="stack">
          <label>
            Sender Email
            <input name="sender" type="email" required placeholder="alerts@bank-security.com" />
          </label>
          <label>
            Subject
            <input name="subject" type="text" required placeholder="Urgent: Verify Your Account" />
          </label>
          <label>
            Message Body
            <textarea name="body" rows="7" required placeholder="Paste the message content here..."></textarea>
          </label>
          <label class="check"><input name="hasLink" type="checkbox" /> Contains external link</label>
          <label class="check"><input name="asksCredentials" type="checkbox" /> Asks for password / OTP / card data</label>
          <label class="check"><input name="impersonatesBrand" type="checkbox" /> Pretends to be from a trusted brand</label>
          <button class="btn primary" type="submit">Analyze Message</button>
        </form>
      </section>
      <section id="result" class="panel hidden"></section>
    `,
      script: "/public/app.js",
    })
  );
});

app.post("/api/analyze", (req, res) => {
  const sender = typeof req.body.sender === "string" ? req.body.sender : "";
  const subject = typeof req.body.subject === "string" ? req.body.subject : "";
  const body = typeof req.body.body === "string" ? req.body.body : "";

  if (!sender.trim() || !subject.trim() || !body.trim()) {
    return res.status(400).json({ error: "sender, subject, and body are required" });
  }

  const result = analyzeSignal({
    sender,
    subject,
    body,
    hasLink: req.body.hasLink === true,
    asksCredentials: req.body.asksCredentials === true,
    impersonatesBrand: req.body.impersonatesBrand === true,
  });

  insertAnalysis.run(
    result.sender,
    result.subject,
    result.body,
    result.hasLink ? 1 : 0,
    result.asksCredentials ? 1 : 0,
    result.impersonatesBrand ? 1 : 0,
    result.score,
    result.severity,
    result.factors.join(" | ")
  );

  return res.json(result);
});

app.get("/dashboard", (_req, res) => {
  const stats = dashboardStats.get();
  const rows = recentAnalyses.all(20);

  const tableRows = rows.length
    ? rows
        .map(
          (row) => `
          <tr>
            <td>${escapeHtml(row.created_at)}</td>
            <td>${escapeHtml(row.sender)}</td>
            <td>${escapeHtml(row.subject)}</td>
            <td>${row.score}</td>
            <td>${severityBadge(row.severity)}</td>
            <td>${escapeHtml(row.factors)}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="6">No analyses yet. Run the Phishing Analyzer first.</td></tr>`;

  res.send(
    layout({
      title: "SOC Dashboard",
      body: `
      <section class="grid stats">
        <article class="panel stat"><h3>Total Analyses</h3><p>${stats.total || 0}</p></article>
        <article class="panel stat"><h3>High Risk</h3><p>${stats.high_risk || 0}</p></article>
        <article class="panel stat"><h3>Medium Risk</h3><p>${stats.medium_risk || 0}</p></article>
        <article class="panel stat"><h3>Average Score</h3><p>${stats.avg_score || 0}</p></article>
      </section>

      <section class="panel">
        <h1>Recent Message Analysis</h1>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time (UTC)</th>
                <th>Sender</th>
                <th>Subject</th>
                <th>Score</th>
                <th>Severity</th>
                <th>Factors</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </section>
    `,
    })
  );
});

app.use((_req, res) => {
  res.status(404).send(
    layout({
      title: "Not Found",
      body: `<section class="panel"><h1>404</h1><p>Page not found.</p><a class="btn secondary" href="/">Go home</a></section>`,
    })
  );
});

app.listen(PORT, () => {
  console.log(`CAPD website running on http://localhost:${PORT}`);
});
