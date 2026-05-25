export type SharedMarketCoin = {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_1h_in_currency?: number | null;
  market_cap: number | null;
  total_volume: number | null;
  image: string;
  ath: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
};

const marketSnapshotKey = 'pulse_market_snapshot_v2';
const marketSnapshotTimeKey = 'pulse_market_snapshot_time_v2';
const coingeckoCooldownKey = 'pulse_coingecko_cooldown_until';
const marketDataUpdatedEvent = 'pulse:market-data-updated';

const MARKET_SNAPSHOT_TTL_MS = 30 * 1000;
const COINGECKO_COOLDOWN_MS = 10 * 60 * 1000;

let inFlightSnapshot: Promise<SharedMarketCoin[]> | null = null;

// CoinGecko direct URL — browser requests are allowed by their CORS policy.
// Bypasses Vercel's server-side proxy which often hits CoinGecko IP rate limits.
const COINGECKO_DIRECT = 'https://api.coingecko.com/api/v3';
// Proxy path (vite dev server / vercel rewrites) — used as fallback only.
const COINGECKO_PROXY = '/api/coingecko';

const parseJsonCache = <T,>(value: string | null): T | null => {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const readSharedMarketSnapshot = () =>
  parseJsonCache<SharedMarketCoin[]>(sessionStorage.getItem(marketSnapshotKey));

export const readSharedMarketSnapshotTime = () =>
  Number(sessionStorage.getItem(marketSnapshotTimeKey) || 0);

export const isCoinGeckoCoolingDown = () =>
  Date.now() < Number(sessionStorage.getItem(coingeckoCooldownKey) || 0);

export const startCoinGeckoCooldown = () => {
  sessionStorage.setItem(coingeckoCooldownKey, String(Date.now() + COINGECKO_COOLDOWN_MS));
};

export const subscribeToMarketData = (listener: () => void) => {
  window.addEventListener(marketDataUpdatedEvent, listener);
  return () => window.removeEventListener(marketDataUpdatedEvent, listener);
};

/**
 * Fetches market data from CoinGecko, trying direct browser request first
 * (bypasses Vercel IP rate-limiting) and falling back to the proxy if needed.
 */
const fetchCoinGeckoMarkets = async (perPage: number, cached: SharedMarketCoin[] | null): Promise<SharedMarketCoin[]> => {
  const path = `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false&price_change_percentage=1h,24h`;

  // ── Attempt 1: direct browser → CoinGecko (no server proxy) ──────────────
  let directResp: Response | null = null;
  try {
    directResp = await fetch(`${COINGECKO_DIRECT}${path}`);
  } catch {
    // Network/CORS error on direct fetch — fall through to proxy
  }

  if (directResp) {
    if (directResp.status === 429) {
      startCoinGeckoCooldown();
      if (cached) return cached;
      throw new Error('CoinGecko rate limit');
    }
    if (directResp.ok) {
      return directResp.json() as Promise<SharedMarketCoin[]>;
    }
    // Status 403/5xx from direct — try proxy as fallback
  }

  // ── Attempt 2: Vercel / Vite proxy ────────────────────────────────────────
  const proxyResp = await fetch(`${COINGECKO_PROXY}${path}`);

  if (proxyResp.status === 429) {
    startCoinGeckoCooldown();
    if (cached) return cached;
    throw new Error('CoinGecko rate limit');
  }

  if (!proxyResp.ok) {
    if (cached) return cached;
    throw new Error('CoinGecko market data request failed');
  }

  return proxyResp.json() as Promise<SharedMarketCoin[]>;
};

export const fetchSharedMarketSnapshot = async ({
  force = false,
  perPage = 180,
}: {
  force?: boolean;
  perPage?: number;
} = {}) => {
  const cached = readSharedMarketSnapshot();
  const cachedTime = readSharedMarketSnapshotTime();
  const hasFreshCache =
    cached &&
    cached.length >= Math.min(perPage, 100) &&
    Date.now() - cachedTime < MARKET_SNAPSHOT_TTL_MS;

  if (!force && hasFreshCache) return cached;
  if (isCoinGeckoCoolingDown() && cached) return cached;
  if (inFlightSnapshot) return inFlightSnapshot;

  inFlightSnapshot = fetchCoinGeckoMarkets(perPage, cached)
    .then((data) => {
      sessionStorage.setItem(marketSnapshotKey, JSON.stringify(data));
      sessionStorage.setItem(marketSnapshotTimeKey, Date.now().toString());
      window.dispatchEvent(new Event(marketDataUpdatedEvent));
      return data;
    })
    .finally(() => {
      inFlightSnapshot = null;
    });

  return inFlightSnapshot;
};
