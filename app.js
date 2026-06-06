/* ============================================================
   VSI COMMAND CENTER — CORE LOGIC ENGINE
   Handles:
   - Data fetch
   - Scoring
   - Rendering
   - Theme toggle
   - AI Assistant integration
   - Mobile HUD responsiveness
   ============================================================ */

const API = "/.netlify/functions/market";

let chartInstance = null;

/* ============================================================
   SCORING + SIGNALS
   ============================================================ */

function score(c) {
  const c24 = c.price_change_percentage_24h || 0;
  const c7 = c.price_change_percentage_7d_in_currency || 0;
  const vol = c.total_volume || 0;
  const mcap = c.market_cap || 1;
  const volRatio = (vol / mcap) * 100;
  return 0.5 * c24 + 0.3 * c7 + 0.2 * volRatio;
}

function classifySignal(s) {
  if (s > 25) return "buy";
  if (s > 5) return "hold";
  if (s < -20) return "drop";
  return "hold";
}

function isMemeCoin(c) {
  const name = c.name.toLowerCase();
  const symbol = c.symbol.toLowerCase();
  const memeKeywords = ["shiba", "inu", "doge", "pepe", "floki", "bonk"];
  return memeKeywords.some(k => name.includes(k) || symbol.includes(k));
}

/* ============================================================
   THEME TOGGLE
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("theme-reactor");
    });
  }
});

/* ============================================================
   MAIN LOAD FUNCTION
   ============================================================ */

async function load() {
  const errorBox = document.getElementById("error");

  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error("Failed to fetch data");

    const data = await res.json();

    const enriched = data.map(c => {
      const s = score(c);
      return {
        ...c,
        score: s,
        signal: classifySignal(s),
        isMeme: isMemeCoin(c)
      };
    });

    renderOverview(enriched);
    renderChart(enriched);
    renderCoreTiles(enriched);
    renderMomentumTiles(enriched);
    renderMemeTiles(enriched);

    // AI Assistant
    if (window.VSI_AI) {
      VSI_AI.generateInsights(enriched);
    }

    if (errorBox) {
      errorBox.style.display = "none";
      errorBox.innerText = "";
    }
  } catch (e) {
    if (errorBox) {
      errorBox.style.display = "block";
      errorBox.innerText = "Error loading data.";
    }
  }
}

/* ============================================================
   RENDER: OVERVIEW
   ============================================================ */

function renderOverview(coins) {
  const container = document.getElementById("overview");
  if (!container) return;
  container.innerHTML = "";

  const totalMcap = coins.reduce((sum, c) => sum + (c.market_cap || 0), 0);
  const totalVol = coins.reduce((sum, c) => sum + (c.total_volume || 0), 0);
  const avg24 =
    coins.reduce((sum, c) => sum + (c.price_change_percentage_24h || 0), 0) /
    coins.length;

  const items = [
    {
      label: "Total Market Cap (Top 100)",
      value: "$" + totalMcap.toLocaleString()
    },
    {
      label: "24h Volume (Top 100)",
      value: "$" + totalVol.toLocaleString()
    },
    {
      label: "Average 24h Change",
      value: (avg24 >= 0 ? "+" : "") + avg24.toFixed(2) + "%"
    }
  ];

  items.forEach(it => {
    const div = document.createElement("div");
    div.className = "overview-item";
    div.innerHTML = `
      <div class="overview-label">${it.label}</div>
      <div class="overview-value">${it.value}</div>
    `;
    container.appendChild(div);
  });
}

/* ============================================================
   RENDER: CHART
   ============================================================ */

function renderChart(coins) {
  const canvas = document.getElementById("priceChart");
  if (!canvas) return;

  const top = [...coins]
    .sort((a, b) => b.market_cap - a.market_cap)
    .slice(0, 6);

  const labels = top.map(c => c.name);
  const data24 = top.map(c => c.price_change_percentage_24h || 0);

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "24h % Change",
          data: data24,
          backgroundColor: data24.map(v =>
            v >= 0 ? "rgba(56, 248, 255, 0.7)" : "rgba(255, 107, 107, 0.7)"
          ),
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: "#9ca3af", font: { size: 11 } },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: "#9ca3af",
            callback: v => v + "%"
          },
          grid: { color: "rgba(31, 41, 55, 0.6)" }
        }
      },
      plugins: {
        legend: {
          labels: { color: "#e5e7eb" }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y.toFixed(2)}%`
          }
        }
      },
      animation: {
        duration: 600,
        easing: "easeOutQuart"
      }
    }
  });
}

/* ============================================================
   RENDER: CORE ASSETS
   ============================================================ */

function renderCoreTiles(coins) {
  const container = document.getElementById("core-tiles");
  if (!container) return;
  container.innerHTML = "";

  const coreSymbols = ["btc", "eth", "usdt", "bnb", "usdc", "xrp"];
  const core = coins.filter(c => coreSymbols.includes(c.symbol.toLowerCase()));

  core.forEach(c => container.appendChild(makeHoloTile(c)));
}

/* ============================================================
   RENDER: MOMENTUM
   ============================================================ */

function renderMomentumTiles(coins) {
  const container = document.getElementById("momentum-tiles");
  if (!container) return;
  container.innerHTML = "";

  const momentum = coins
    .filter(c => c.signal === "buy")
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (momentum.length === 0) {
    container.innerHTML = "<p>No strong momentum signals right now.</p>";
    return;
  }

  momentum.forEach(c => container.appendChild(makeHoloTile(c)));
}

/* ============================================================
   RENDER: MEME COINS
   ============================================================ */

function renderMemeTiles(coins) {
  const container = document.getElementById("meme-tiles");
  if (!container) return;
  container.innerHTML = "";

  const memes = coins.filter(c => c.isMeme).slice(0, 8);

  if (memes.length === 0) {
    container.innerHTML = "<p>No meme coins detected in this snapshot.</p>";
    return;
  }

  memes.forEach(c => {
    const tile = makeHoloTile(c);
    const header = tile.querySelector(".tile-header");
    if (header) {
      const tag = document.createElement("span");
      tag.className = "meme-tag";
      tag.textContent = "Meme / High Speculation";
      header.appendChild(tag);
    }
    container.appendChild(tile);
  });
}

/* ============================================================
   TILE GENERATOR
   ============================================================ */

function makeHoloTile(c) {
  const div = document.createElement("div");
  div.className = "holo-tile";

  const rotation = (c.price_change_percentage_24h || 0) * 3;
  const dialRotation = Math.max(Math.min(rotation, 120), -120);

  const signalClass =
    c.signal === "buy"
      ? "signal-buy"
      : c.signal === "drop"
      ? "signal-drop"
      : "signal-hold";

  const signalLabel =
    c.signal === "buy"
      ? "BUY"
      : c.signal === "drop"
      ? "DROP"
      : "HOLD";

  div.innerHTML = `
    <div class="dial" style="--dial-rotation:${dialRotation}deg;">
      <div class="dial-ring"></div>
      <div class="dial-inner"></div>
      <div class="dial-center">
        <span>${c.symbol.toUpperCase()}</span>
        <span>${(c.price_change_percentage_24h || 0).toFixed(1)}%</span>
      </div>
    </div>
    <div class="tile-main">
      <div class="tile-header">
        <div>
          <span class="tile-name">${c.name}</span>
          <span class="tile-symbol">${c.symbol.toUpperCase()}</span>
        </div>
        <div>
          <span class="signal-badge ${signalClass}">${signalLabel}</span>
        </div>
      </div>
      <div class="tile-price">
        $${c.current_price.toLocaleString()}
      </div>
      <div class="tile-meta">
        <span>24h:
          <span class="change ${
            c.price_change_percentage_24h >= 0 ? "positive" : "negative"
          }">
            ${(c.price_change_percentage_24h || 0).toFixed(2)}%
          </span>
        </span>
        <span>7d:
          <span class="change ${
            c.price_change_percentage_7d_in_currency >= 0 ? "positive" : "negative"
          }">
            ${(c.price_change_percentage_7d_in_currency || 0).toFixed(2)}%
          </span>
        </span>
        <span>Cap: $${(c.market_cap || 0).toLocaleString()}</span>
      </div>
    </div>
  `;

  return div;
}

/* ============================================================
   START ENGINE
   ============================================================ */

load();
