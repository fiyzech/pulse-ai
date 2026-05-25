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

// ── CoinCap types (used as final fallback when CoinGecko is unavailable) ────
type CoinCapAsset = {
  id: string;
  rank: string;
  symbol: string;
  name: string;
  supply: string;
  maxSupply: string | null;
  marketCapUsd: string;
  volumeUsd24Hr: string;
  priceUsd: string;
  changePercent24Hr: string;
};

/**
 * Fetches top assets from CoinCap.io — completely free, no auth, CORS-enabled.
 * Used as a final fallback when CoinGecko is rate-limited or unavailable.
 */
const fetchFromCoinCap = async (limit: number): Promise<SharedMarketCoin[]> => {
  const resp = await fetch(`https://api.coincap.io/v2/assets?limit=${Math.min(limit, 200)}`);
  if (!resp.ok) throw new Error(`CoinCap error: ${resp.status}`);
  const json = await resp.json() as { data: CoinCapAsset[] };
  return (json.data || []).map((coin) => ({
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    current_price: parseFloat(coin.priceUsd) || null,
    price_change_percentage_24h: parseFloat(coin.changePercent24Hr) || null,
    price_change_percentage_1h_in_currency: null,
    market_cap: parseFloat(coin.marketCapUsd) || null,
    total_volume: parseFloat(coin.volumeUsd24Hr) || null,
    // Use CoinCap's icon CDN — publicly accessible without auth
    image: `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`,
    ath: null,
    circulating_supply: parseFloat(coin.supply) || null,
    total_supply: coin.maxSupply ? parseFloat(coin.maxSupply) : null,
    max_supply: coin.maxSupply ? parseFloat(coin.maxSupply) : null,
  }));
};

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
 * Fetches market data with a 3-tier fallback chain:
 *   1. CoinGecko direct browser request (fastest, bypasses Vercel IP blocks)
 *   2. CoinGecko via Vercel/Vite proxy (server-side request)
 *   3. CoinCap.io (free, no auth, CORS — guarantees market_cap data)
 *
 * Returns stale cache if available when all sources fail.
 */
const fetchMarketData = async (perPage: number, cached: SharedMarketCoin[] | null): Promise<SharedMarketCoin[]> => {
  const cgPath = `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false&price_change_percentage=1h,24h`;

  // ── Attempt 1: direct browser → CoinGecko ────────────────────────────────
  try {
    const resp = await fetch(`${COINGECKO_DIRECT}${cgPath}`);
    if (resp.status === 429) {
      startCoinGeckoCooldown();
    } else if (resp.ok) {
      return resp.json() as Promise<SharedMarketCoin[]>;
    }
  } catch {
    // Network/CORS error — try next source
  }

  // ── Attempt 2: CoinGecko via Vercel proxy ────────────────────────────────
  try {
    const resp = await fetch(`${COINGECKO_PROXY}${cgPath}`);
    if (resp.status === 429) {
      startCoinGeckoCooldown();
    } else if (resp.ok) {
      return resp.json() as Promise<SharedMarketCoin[]>;
    }
  } catch {
    // Proxy also failed — try CoinCap
  }

  // ── Attempt 3: CoinCap.io (always free, no auth, has market_cap) ─────────
  try {
    return await fetchFromCoinCap(perPage);
  } catch {
    // All sources failed
  }

  // ── Fallback: return stale cache or throw ─────────────────────────────────
  if (cached) return cached;
  throw new Error('All market data sources failed');
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

  inFlightSnapshot = fetchMarketData(perPage, cached)
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
