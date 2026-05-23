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

  inFlightSnapshot = fetch(
    `/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false&price_change_percentage=1h,24h`
  )
    .then(async (response) => {
      if (response.status === 429) {
        startCoinGeckoCooldown();
        if (cached) return cached;
        throw new Error('CoinGecko rate limit');
      }

      if (!response.ok) {
        if (cached) return cached;
        throw new Error('CoinGecko market data request failed');
      }

      const data = (await response.json()) as SharedMarketCoin[];
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
