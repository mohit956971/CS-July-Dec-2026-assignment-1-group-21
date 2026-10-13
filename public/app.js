const form = document.getElementById("analysis-form");
const resultEl = document.getElementById("result");

if (form && resultEl) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = {
      sender: formData.get("sender"),
      subject: formData.get("subject"),
      body: formData.get("body"),
      hasLink: formData.get("hasLink") === "on",
      asksCredentials: formData.get("asksCredentials") === "on",
      impersonatesBrand: formData.get("impersonatesBrand") === "on",
    };

    resultEl.classList.remove("hidden");
    resultEl.innerHTML = "<p>Analyzing message...</p>";

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      const factors = data.factors
        .map((factor) => `<li>${factor}</li>`)
        .join("");

      resultEl.innerHTML = `
        <h2>Risk Result: ${data.severity} (${data.score}/100)</h2>
        <p>The score combines language, behavior, and context indicators.</p>
        <ul>${factors}</ul>
        <a class="btn secondary" href="/dashboard">See dashboard updates</a>
      `;
    } catch (error) {
      resultEl.innerHTML = `<p class="error">${error.message}</p>`;
    }
  });
}
