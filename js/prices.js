/**
 * Live crypto price dashboard — fetches data from CoinGecko public API.
 */

const COINS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', iconClass: 'btc' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', iconClass: 'eth' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', iconClass: 'sol' },
  { id: 'matic-network', name: 'Polygon', symbol: 'MATIC', iconClass: 'matic' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', iconClass: 'arb' },
];

const API_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=' +
  COINS.map((c) => c.id).join(',') +
  '&vs_currencies=usd&include_24hr_change=true';

const pricesGrid = document.getElementById('pricesGrid');
const lastUpdated = document.getElementById('lastUpdated');
const refreshBtn = document.getElementById('refreshBtn');
const errorContainer = document.getElementById('errorContainer');

/**
 * Safely formats price numbers. 
 * Prevents crashes if data is missing or undefined.
 */
function formatPrice(price) {
  if (typeof price !== 'number') {
    return 'N/A';
  }
  if (price >= 1000) {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function renderPriceCard(coin, data) {
  // Ensure we are passing a number (or handle if null)
  const price = data && typeof data.usd === 'number' ? data.usd : null;
  const change = data?.usd_24h_change ?? 0;
  const isUp = change >= 0;
  const arrow = isUp ? '▲' : '▼';
  const changeClass = isUp ? 'up' : 'down';

  return `
    <div class="price-card">
      <div class="price-card-header">
        <div class="coin-icon ${coin.iconClass}">${coin.symbol.charAt(0)}</div>
        <div>
          <div class="coin-name">${coin.name}</div>
          <div class="coin-symbol">${coin.symbol}</div>
        </div>
      </div>
      <div class="price-value">${formatPrice(price)}</div>
      <span class="price-change ${changeClass}">
        ${arrow} ${Math.abs(change).toFixed(2)}% (24h)
      </span>
    </div>
  `;
}

function showError(message) {
  errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

function clearError() {
  errorContainer.innerHTML = '';
}

async function fetchPrices() {
  refreshBtn.disabled = true;
  refreshBtn.textContent = '↻ Refreshing…';
  clearError();

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}. Try again in a moment.`);
    }

    const data = await response.json();

    pricesGrid.innerHTML = COINS.map((coin) => {
      // Pass the nested object to the renderer
      return renderPriceCard(coin, data[coin.id]);
    }).join('');

    const now = new Date();
    lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;
  } catch (err) {
    showError(`Failed to fetch prices: ${err.message}`);
    if (pricesGrid.querySelector('.loading-spinner')) {
      pricesGrid.innerHTML = '';
    }
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = '↻ Refresh Prices';
  }
}

refreshBtn.addEventListener('click', fetchPrices);
fetchPrices();