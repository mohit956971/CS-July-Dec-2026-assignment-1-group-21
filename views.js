function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function layout({ title, body, script = "" }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} | CAPD Security</title>
    <link rel="stylesheet" href="/public/style.css" />
  </head>
  <body>
    <header class="topbar">
      <a class="brand" href="/">CAPD Security</a>
      <nav>
        <a href="/">Home</a>
        <a href="/analyze">Phishing Analyzer</a>
        <a href="/dashboard">SOC Dashboard</a>
      </nav>
    </header>
    <main class="container">
      ${body}
    </main>
    ${script ? `<script src="${script}"></script>` : ""}
  </body>
</html>`;
}

function severityBadge(severity) {
  const klass =
    severity === "High" ? "badge high" : severity === "Medium" ? "badge medium" : "badge low";
  return `<span class="${klass}">${escapeHtml(severity)}</span>`;
}

module.exports = {
  layout,
  severityBadge,
  escapeHtml,
};
