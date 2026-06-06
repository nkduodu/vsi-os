/* ============================================================
   VSI AI ASSISTANT PANEL
   Generates insights based on market data
   ============================================================ */

let VSI_AI = {
  init() {
    this.panel = document.getElementById("ai-panel");
    this.toggleBtn = document.getElementById("ai-toggle");
    this.insightsBox = document.getElementById("ai-insights");

    if (this.toggleBtn) {
      this.toggleBtn.addEventListener("click", () => {
        this.panel.classList.toggle("collapsed");
      });
    }
  },

  generateInsights(coins) {
    if (!this.insightsBox) return;

    const top = [...coins].sort((a, b) => b.market_cap - a.market_cap).slice(0, 10);

    const avg24 =
      top.reduce((sum, c) => sum + (c.price_change_percentage_24h || 0), 0) /
      top.length;

    const strongest = [...coins]
      .sort((a, b) => b.score - a.score)
      .slice(0, 1)[0];

    const weakest = [...coins]
      .sort((a, b) => a.score - b.score)
      .slice(0, 1)[0];

    const memeCount = coins.filter(c => c.isMeme).length;

    let html = `
      <div class="ai-section">
        <h3>Market Pulse</h3>
        <p>The top 10 assets show an average 24h change of 
          <strong>${avg24.toFixed(2)}%</strong>.
        </p>
      </div>

      <div class="ai-section">
        <h3>Strongest Signal</h3>
        <p>
          <strong>${strongest.name}</strong> (${strongest.symbol.toUpperCase()}) 
          shows the highest momentum score.
        </p>
      </div>

      <div class="ai-section">
        <h3>Weakest Signal</h3>
        <p>
          <strong>${weakest.name}</strong> (${weakest.symbol.toUpperCase()}) 
          is showing the weakest performance in this snapshot.
        </p>
      </div>

      <div class="ai-section">
        <h3>Meme Activity</h3>
        <p>
          Detected <strong>${memeCount}</strong> meme‑classified assets in the top 100.
        </p>
      </div>

      <div class="ai-section">
        <h3>VSI Observations</h3>
        <ul>
          <li>Momentum signals are strongest in the top‑cap assets.</li>
          <li>Volatility remains elevated across speculative sectors.</li>
          <li>Stablecoins maintain dominance in liquidity flow.</li>
        </ul>
      </div>
    `;

    this.insightsBox.innerHTML = html;
  }
};

document.addEventListener("DOMContentLoaded", () => VSI_AI.init());
