import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createChart, ColorType, CrosshairMode, AreaSeries, CandlestickSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import {
  addFavoriteAsset,
  getAuthenticatedUserId,
  getFavoriteAsset,
  removeFavoriteAsset,
} from '../../utils/favoriteAssets';
import { fetchCryptoNews, formatNewsTime } from '../../utils/news';
import type { CryptoNewsItem } from '../../utils/news';

const COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'BNB': 'binancecoin',
  'USDT': 'tether', 'XRP': 'ripple', 'ADA': 'cardano', 'AVAX': 'avalanche-2', 'DOGE': 'dogecoin',
  'DOT': 'polkadot', 'MATIC': 'matic-network', 'ARB': 'arbitrum', 'SUI': 'sui',
  'PEPE': 'pepe', 'TIA': 'celestia', 'LINK': 'chainlink', 'NEAR': 'near',
};

const formatCurrency = (value: number) => {
  if (!value || value === 0) return '---';
  if (value >= 1e12) return (value / 1e12).toFixed(2) + ' T USD';
  if (value >= 1e9) return (value / 1e9).toFixed(2) + ' B USD';
  if (value >= 1e6) return (value / 1e6).toFixed(2) + ' M USD';
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' USD';
};

const formatSupply = (value: number, isMax: boolean = false) => {
  if (isMax && (!value || value === 0)) return 'Необмежено'; 
  if (!value || value === 0) return '---';
  if (value >= 1e9) return (value / 1e9).toFixed(2) + ' B';
  if (value >= 1e6) return (value / 1e6).toFixed(2) + ' M';
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

type ModelPrediction = {
  signal?: string;
  raw_prediction?: string;
  confidence?: number | null;
  accuracy?: number | null;
  created_at?: string;
};

const getBinancePairSymbol = (symbol: string) => {
  const normalized = symbol.toUpperCase();
  if (normalized === 'USDT') return 'USDCUSDT';
  if (normalized === 'USDC') return 'USDCUSDT';
  return `${normalized}USDT`;
};

type RelatedCoinCard = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change: number;
  chartData: { point: number; value: number }[];
};

type RelatedCoinGeckoMarketCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_24h_in_currency?: number | null;
  sparkline_in_7d?: {
    price?: number[];
  };
};

type RelatedCoinGeckoMarketChart = {
  prices?: Array<[number, number]>;
};

type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  number,
  number,
  string,
  number,
  string,
  string,
  string,
];

type BinanceTicker = {
  lastPrice?: string;
  priceChangePercent?: string;
};

type MarketCacheItem = {
  id: string;
  symbol: string;
  name: string;
  price: string;
  change: string;
  imgUrl: string;
};

type RelatedBaseAsset = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price?: number;
  change?: number;
};

const RELATED_FALLBACK_CATALOG: RelatedBaseAsset[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
  { id: 'tether', symbol: 'USDT', name: 'Tether', image: '/Tether.svg' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', image: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png' },
  { id: 'bonk', symbol: 'BONK', name: 'Bonk', image: 'https://assets.coingecko.com/coins/images/28600/large/bonk.jpg' },
  { id: 'floki', symbol: 'FLOKI', name: 'FLOKI', image: 'https://assets.coingecko.com/coins/images/16746/large/PNG_image.png' },
  { id: 'dogwifcoin', symbol: 'WIF', name: 'dogwifhat', image: 'https://assets.coingecko.com/coins/images/33566/large/dogwifhat.jpg' },
  { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', image: 'https://assets.coingecko.com/coins/images/16547/large/arb.jpg' },
  { id: 'sui', symbol: 'SUI', name: 'Sui', image: 'https://assets.coingecko.com/coins/images/26375/large/sui-ocean-square.png' },
  { id: 'pepe', symbol: 'PEPE', name: 'Pepe', image: 'https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg' },
  { id: 'celestia', symbol: 'TIA', name: 'Celestia', image: 'https://assets.coingecko.com/coins/images/31967/large/tia.jpg' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png' },
  { id: 'near', symbol: 'NEAR', name: 'Near', image: 'https://assets.coingecko.com/coins/images/10365/large/near.jpg' },
];

const RELATED_GROUPS = [
  ['bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche-2', 'sui', 'near'],
  ['arbitrum', 'avalanche-2', 'ethereum', 'solana', 'chainlink', 'binancecoin'],
  ['dogecoin', 'pepe', 'shiba-inu', 'bonk', 'floki', 'dogwifcoin'],
  ['binancecoin', 'ripple', 'chainlink', 'arbitrum', 'ethereum', 'solana'],
  ['celestia', 'arbitrum', 'sui', 'near', 'solana', 'avalanche-2'],
];

const buildCoinGeckoChartData = (prices?: number[]) => {
  const validPrices = (prices || []).filter((price) => Number.isFinite(price));

  if (validPrices.length === 0) {
    return [];
  }

  const step = Math.max(1, Math.floor(validPrices.length / 44));
  return validPrices
    .filter((_, index) => index % step === 0)
    .slice(-48)
    .map((value, point) => ({ point, value }));
};

const RELATED_CHART_CACHE_KEY = 'pulse_related_coin_charts_v1';
const RELATED_CHART_CACHE_TTL = 5 * 60 * 1000;

const readRelatedChartCache = () => {
  try {
    const raw = sessionStorage.getItem(RELATED_CHART_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, { expiresAt: number; prices: number[] }>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeRelatedChartCache = (coinId: string, prices: number[]) => {
  if (prices.length < 2) return;

  try {
    const cache = readRelatedChartCache();
    cache[coinId] = {
      expiresAt: Date.now() + RELATED_CHART_CACHE_TTL,
      prices,
    };
    sessionStorage.setItem(RELATED_CHART_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Session storage can be unavailable in private modes; live data still renders.
  }
};

const getCachedRelatedChartPrices = (coinId: string) => {
  const cached = readRelatedChartCache()[coinId];
  if (!cached || cached.expiresAt <= Date.now() || !Array.isArray(cached.prices)) return [];
  return cached.prices.filter((price) => Number.isFinite(price));
};

const loadBinanceRelatedChartPrices = async (symbol: string) => {
  const pair = getBinancePairSymbol(symbol);
  const response = await fetch(`/api/binance/klines?symbol=${pair}&interval=1h&limit=48`);
  if (!response.ok) return [];

  const data = await response.json() as BinanceKline[];
  return data
    .map((item) => Number(item[4]))
    .filter((price) => Number.isFinite(price));
};

const loadBinanceRelatedTicker = async (symbol: string) => {
  const pair = getBinancePairSymbol(symbol);
  const response = await fetch(`/api/binance/ticker/24hr?symbol=${pair}`);
  if (!response.ok) return null;

  const data = await response.json() as BinanceTicker;
  const price = Number(data.lastPrice);
  const change = Number(data.priceChangePercent);

  return {
    price: Number.isFinite(price) ? price : 0,
    change: Number.isFinite(change) ? change : 0,
  };
};

const loadRelatedChartPrices = async (coinId: string, symbol: string, sparklinePrices?: number[]) => {
  const validSparkline = (sparklinePrices || []).filter((price) => Number.isFinite(price));
  if (validSparkline.length > 1) {
    writeRelatedChartCache(coinId, validSparkline);
    return validSparkline;
  }

  const cachedPrices = getCachedRelatedChartPrices(coinId);
  if (cachedPrices.length > 1) return cachedPrices;

  const response = await fetch(`/api/coingecko/coins/${coinId}/market_chart?vs_currency=usd&days=7&interval=hourly`);
  if (!response.ok) return loadBinanceRelatedChartPrices(symbol);

  const data = await response.json() as RelatedCoinGeckoMarketChart;
  const prices = (data.prices || [])
    .map((point) => point[1])
    .filter((price) => Number.isFinite(price));

  if (prices.length > 1) {
    writeRelatedChartCache(coinId, prices);
    return prices;
  }

  const binancePrices = await loadBinanceRelatedChartPrices(symbol);
  writeRelatedChartCache(coinId, binancePrices);
  return binancePrices;
};

const buildRelatedSparklinePoints = (data: RelatedCoinCard['chartData']) => {
  if (data.length < 2) return '';

  const width = 260;
  const minY = 18;
  const maxY = 84;
  const values = data.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return data
    .map((item, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = maxY - ((item.value - min) / range) * (maxY - minY);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
};

const formatRelatedPrice = (price: number) => {
  if (!Number.isFinite(price) || price <= 0) return '---';
  if (price < 1) return price.toFixed(6);
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: price >= 100 ? 2 : 4,
  });
};

const formatRelatedChange = (change: number) =>
  `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;

const parseCachedPrice = (value?: string) => {
  if (!value || value === '...' || value === '---') return 0;
  const multiplier = value.includes('T') ? 1e12 : value.includes('B') ? 1e9 : value.includes('M') ? 1e6 : 1;
  const numeric = Number(value.replace(/[$,\sA-Z]/g, ''));
  return Number.isFinite(numeric) ? numeric * multiplier : 0;
};

const parseCachedChange = (value?: string) => {
  if (!value || value === '...') return 0;
  const numeric = Number(value.replace('%', '').replace('+', ''));
  return Number.isFinite(numeric) ? numeric : 0;
};

const readMarketCache = () => {
  try {
    const raw = sessionStorage.getItem('pulse_table_cards');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MarketCacheItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getCatalogAssetById = (id: string) =>
  RELATED_FALLBACK_CATALOG.find((asset) => asset.id === id);

const hashAssetKey = (value: string) =>
  value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

const toRelatedBaseAsset = (asset: MarketCacheItem | RelatedBaseAsset): RelatedBaseAsset => {
  if ('imgUrl' in asset) {
    return {
      id: asset.id,
      symbol: asset.symbol.toUpperCase(),
      name: asset.name || asset.symbol.toUpperCase(),
      image: asset.imgUrl,
      price: parseCachedPrice(asset.price),
      change: parseCachedChange(asset.change),
    };
  }

  return {
    ...asset,
    symbol: asset.symbol.toUpperCase(),
  };
};

const getRelatedBaseAssets = (
  currentId: string,
  currentSymbol: string,
  cachedMarkets: MarketCacheItem[],
) => {
  const normalizedId = currentId.toLowerCase();
  const normalizedSymbol = currentSymbol.toUpperCase();
  const selected = new Map<string, RelatedBaseAsset>();
  const cachedById = new Map(cachedMarkets.map((asset) => [asset.id, asset]));
  const cachedBySymbol = new Map(cachedMarkets.map((asset) => [asset.symbol.toUpperCase(), asset]));
  const currentIndex = cachedMarkets.findIndex(
    (asset) => asset.id === normalizedId || asset.symbol.toUpperCase() === normalizedSymbol,
  );

  const addCandidate = (candidate?: MarketCacheItem | RelatedBaseAsset) => {
    if (!candidate) return;
    const asset = toRelatedBaseAsset(candidate);
    if (asset.id === normalizedId || asset.symbol === normalizedSymbol) return;
    if (!asset.id || !asset.symbol || selected.has(asset.symbol)) return;
    selected.set(asset.symbol, asset);
  };

  const activeGroup = RELATED_GROUPS.find((group) => group.includes(normalizedId));
  activeGroup?.forEach((id) => addCandidate(cachedById.get(id) || getCatalogAssetById(id)));

  if (currentIndex >= 0) {
    [currentIndex - 2, currentIndex - 1, currentIndex + 1, currentIndex + 2, currentIndex + 3].forEach((index) => {
      addCandidate(cachedMarkets[index]);
    });
  }

  cachedMarkets.forEach(addCandidate);

  const rotatedFallback = [...RELATED_FALLBACK_CATALOG];
  const offset = rotatedFallback.length ? hashAssetKey(`${normalizedId}-${normalizedSymbol}`) % rotatedFallback.length : 0;
  const fallbackCandidates = [...rotatedFallback.slice(offset), ...rotatedFallback.slice(0, offset)];
  fallbackCandidates.forEach((asset) => {
    addCandidate(cachedById.get(asset.id) || cachedBySymbol.get(asset.symbol) || asset);
  });

  return Array.from(selected.values()).slice(0, 4);
};

const buildPredictionSymbolVariants = (coinShort: string, coinSymbol: string, cgId: string) => {
  const cleanShort = coinShort.toUpperCase();
  const cleanSymbol = coinSymbol.toUpperCase();
  const cleanCgId = cgId.toLowerCase();

  return Array.from(new Set([
    cleanShort,
    cleanShort.toLowerCase(),
    cleanSymbol,
    cleanSymbol.toLowerCase(),
    cleanCgId,
    cleanCgId.toUpperCase(),
  ].filter(Boolean)));
};

interface AssetPageProps {
  coinSymbol?: string; 
  coinName?: string;   
  coinShort?: string;  
  coinIcon?: string;   
}

export default function AssetPage(props: AssetPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { symbol: routeAsset } = useParams<{ symbol: string }>();
  const passedCoin = location.state?.coin;
  const routeAssetValue = (routeAsset || '').toLowerCase();
  const routeSymbolFromCgId = Object.entries(COINGECKO_IDS).find(([, value]) => value === routeAssetValue)?.[0];
  const routeCatalogAsset = getCatalogAssetById(routeAssetValue);
  const routeSymbolFromCatalog = routeCatalogAsset?.symbol;
  const routeSymbol = routeSymbolFromCgId || routeSymbolFromCatalog || (routeAssetValue.length <= 6 ? routeAssetValue.toUpperCase() : undefined);

  const coinShort = (passedCoin?.symbol || props.coinShort || routeSymbol || 'BTC').toUpperCase();
  const binancePairSymbol = getBinancePairSymbol(coinShort);
  const cgId = passedCoin?.id || COINGECKO_IDS[coinShort] || routeCatalogAsset?.id || routeAssetValue || 'bitcoin';
  const catalogAsset = getCatalogAssetById(cgId);
  
  const routeName = routeAssetValue && routeAssetValue.length > 6
    ? catalogAsset?.name || routeAssetValue.charAt(0).toUpperCase() + routeAssetValue.slice(1).replace(/-/g, ' ')
    : coinShort;

  const coinName = passedCoin?.name || (passedCoin?.id
    ? passedCoin.id.charAt(0).toUpperCase() + passedCoin.id.slice(1).replace(/-/g, ' ')
    : props.coinName || catalogAsset?.name || routeName || 'Bitcoin');
    
  const coinIcon = passedCoin?.imgUrl || props.coinIcon || catalogAsset?.image || '/Bitcoin.svg';
  
  const [timeframe, setTimeframe] = useState('15 хв');
  const [chartType, setChartType] = useState<'area' | 'candle'>('area');
  
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceColor, setPriceColor] = useState<string>('text-white');
  const [priceChange, setPriceChange] = useState({ value: 0, percent: 0, isPositive: true });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isBinanceAvailable, setIsBinanceAvailable] = useState(true); 
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteNotice, setFavoriteNotice] = useState('');
  const [assetNews, setAssetNews] = useState<CryptoNewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState('');
  const [relatedCoins, setRelatedCoins] = useState<RelatedCoinCard[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  const [stats, setStats] = useState({
    priceChange1h: 0, priceChange24h: 0, high24h: 0, low24h: 0, volume24h: 0,
  });

  const [fundamentals, setFundamentals] = useState({
    ath: passedCoin?.rawAth || 0,
    mcap: passedCoin?.rawMcap || 0,
    circSupply: passedCoin?.rawCircSupply || 0,
    maxSupply: passedCoin?.rawMaxSupply || 0,
    totalSupply: passedCoin?.rawTotalSupply || 0,
  });

  const [aiData, setAiData] = useState({
    longPercent: 50,
    shortPercent: 50,
    signal: 'NO TRADE',
    hasPrediction: false,
    isLoading: true
  });
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const noticeTimeoutRef = useRef<number | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | ISeriesApi<"Candlestick"> | null>(null);
  const prevPriceRef = useRef<number>(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [cgId]);

  useEffect(() => {
    let active = true;

    const syncFavoriteState = async () => {
      setFavoriteLoading(true);
      try {
        const userId = await getAuthenticatedUserId();
        if (!active) return;

        if (!userId) {
          setIsFavorite(false);
          return;
        }

        const favorite = await getFavoriteAsset(userId, coinShort);
        if (active) setIsFavorite(Boolean(favorite));
      } catch (error) {
        console.error('Помилка перевірки обраного:', error);
      } finally {
        if (active) setFavoriteLoading(false);
      }
    };

    syncFavoriteState();
    return () => {
      active = false;
    };
  }, [coinShort]);

  useEffect(() => {
    let active = true;

    const loadAssetNews = async () => {
      try {
        setNewsLoading(true);
        setNewsError('');
        const items = await fetchCryptoNews(6, 100);
        if (!active) return;

        const coinQuery = `${coinName} ${coinShort}`.toLowerCase();
        const coinFocused = items.filter((item) => {
          const text = `${item.title} ${item.description || ''} ${item.tag}`.toLowerCase();
          return text.includes(coinShort.toLowerCase()) || coinQuery.split(' ').some((part) => part.length > 3 && text.includes(part));
        });

        setAssetNews((coinFocused.length >= 3 ? coinFocused : items).slice(0, 6));
      } catch (error) {
        console.error('Помилка завантаження новин активу:', error);
        if (active) setNewsError('Не вдалося завантажити новини');
      } finally {
        if (active) setNewsLoading(false);
      }
    };

    loadAssetNews();
    return () => {
      active = false;
    };
  }, [coinName, coinShort]);

  useEffect(() => {
    let active = true;

    const loadRelatedCoins = async (silent = false) => {
      const baseAssets = getRelatedBaseAssets(cgId, coinShort, readMarketCache());

      try {
        if (!silent) setRelatedLoading(true);
        const ids = baseAssets.map((coin) => coin.id).filter(Boolean).join(',');
        const cgRes = ids
          ? await fetch(`/api/coingecko/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids)}&sparkline=true&price_change_percentage=24h`)
          : null;
        const cgData = cgRes && cgRes.ok ? await cgRes.json() as RelatedCoinGeckoMarketCoin[] : [];
        const cgById = new Map(cgData.map((coin) => [coin.id, coin]));
        if (!active) return;

        const initialCoins = baseAssets.map((coin) => {
          const cgCoin = cgById.get(coin.id);
          const price = Number(cgCoin?.current_price ?? coin.price ?? 0);
          const change = Number(cgCoin?.price_change_percentage_24h_in_currency ?? cgCoin?.price_change_percentage_24h ?? coin.change ?? 0);
          const chartData = buildCoinGeckoChartData(cgCoin?.sparkline_in_7d?.price);

          return {
            id: coin.id,
            symbol: (cgCoin?.symbol || coin.symbol).toUpperCase(),
            name: cgCoin?.name || coin.name,
            image: cgCoin?.image || coin.image,
            price,
            change,
            chartData,
          };
        });

        setRelatedCoins(initialCoins);
        if (!silent) setRelatedLoading(false);

        void Promise.all(initialCoins.map(async (coin) => {
          const cgCoin = cgById.get(coin.id);
          const [chartPrices, ticker] = await Promise.all([
            loadRelatedChartPrices(coin.id, coin.symbol, cgCoin?.sparkline_in_7d?.price).catch(() => []),
            (coin.price > 0 ? Promise.resolve(null) : loadBinanceRelatedTicker(coin.symbol).catch(() => null)),
          ]);

          return {
            id: coin.id,
            price: ticker?.price && ticker.price > 0 ? ticker.price : coin.price,
            change: ticker ? ticker.change : coin.change,
            chartData: buildCoinGeckoChartData(chartPrices),
          };
        })).then((updates) => {
          if (!active) return;

          setRelatedCoins((prev) => prev.map((coin) => {
            const update = updates.find((item) => item.id === coin.id);
            if (!update) return coin;

            return {
              ...coin,
              price: update.price || coin.price,
              change: update.change,
              chartData: update.chartData.length > 0 ? update.chartData : coin.chartData,
            };
          }));
        });
      } catch (error) {
        console.error('Помилка оновлення цін схожих монет:', error);
        if (active) {
          setRelatedCoins(baseAssets.map((coin) => {
            const change = coin.change ?? 0;
            return {
              id: coin.id,
              symbol: coin.symbol,
              name: coin.name,
              image: coin.image,
              price: coin.price ?? 0,
              change,
              chartData: [],
            };
          }));
        }
      } finally {
        if (active && !silent) setRelatedLoading(false);
      }
    };

    loadRelatedCoins();
    const relatedRefreshTimer = window.setInterval(() => {
      loadRelatedCoins(true);
    }, 60000);

    return () => {
      active = false;
      window.clearInterval(relatedRefreshTimer);
    };
  }, [cgId, coinShort]);

const handleFavoriteToggle = async () => {
    setFavoriteNotice('');
    setFavoriteLoading(true);

    // 1. Очищаємо попередній таймер, якщо користувач клікнув кілька разів швидко
    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current);
    }

    try {
      const userId = await getAuthenticatedUserId();
      if (!userId) {
        setFavoriteNotice('Увійдіть в акаунт, щоб зберігати активи.');
        return;
      }

      if (isFavorite) {
        await removeFavoriteAsset(userId, coinShort);
        setIsFavorite(false);
        setFavoriteNotice('Актив видалено з обраного.');
      } else {
        await addFavoriteAsset(userId, {
          coinId: cgId,
          symbol: coinShort,
          name: coinName,
          imageUrl: coinIcon,
        });
        setIsFavorite(true);
        setFavoriteNotice('Актив додано в обране.');
      }

      sessionStorage.removeItem('pulse_user_favorites');
    } catch (error) {
      console.error('Помилка оновлення обраного:', error);
      setFavoriteNotice('Не вдалося оновити обране. Перевірте таблицю user_favorites.');
    } finally {
      setFavoriteLoading(false);
      
      // 2. Встановлюємо таймер, щоб приховати повідомлення через 3 секунди (3000 мс)
      noticeTimeoutRef.current = window.setTimeout(() => {
        setFavoriteNotice('');
      }, 3000);
    }
  };

  useEffect(() => {
    const fetchAiSignal = async () => {
      const noisyTimeframes = ['1 сек', '1 хв', '5 хв', '15 хв', '1 год'];
      
      if (noisyTimeframes.includes(timeframe)) {
        setAiData({
          longPercent: 50,
          shortPercent: 50,
          signal: 'NOISY',
          hasPrediction: false,
          isLoading: false
        });
        return;
      }

      setAiData(prev => ({ ...prev, isLoading: true }));
      try {
        const SUPABASE_URL = "https://nqqsjxuztuvvsmopkxqj.supabase.co"; 
        const SUPABASE_ANON_KEY = "sb_publishable_qwJ7LAhkS-jsjMKNLtGARA_Ky_WWbek"; 

        const dbIntervalMap: Record<string, string> = {
          '4 год': '4h', '1 день': '1d', '1 тиж': '1w', '1 міс': '1M'
        };
        const dbInterval = dbIntervalMap[timeframe] || '4h';

        const predictionSymbols = buildPredictionSymbolVariants(coinShort, binancePairSymbol, cgId);

        // Спочатку шукаємо для конкретного TF, при відсутності — беремо 4h як fallback
        const fetchInterval = async (interval: string): Promise<ModelPrediction | null> => {
          const params = new URLSearchParams({
            select: 'signal,raw_prediction,confidence,accuracy,created_at',
            symbol: `in.(${predictionSymbols.join(',')})`,
            interval: `eq.${interval}`,
            order: 'created_at.desc',
            limit: '1',
          });
          const res = await fetch(`${SUPABASE_URL}/rest/v1/model_predictions?${params.toString()}`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
          });
          if (!res.ok) return null;
          const data = await res.json() as ModelPrediction[];
          return data?.[0] ?? null;
        };

        let latest = await fetchInterval(dbInterval);
        // Якщо для вибраного TF немає даних — пробуємо 4h
        if (!latest && dbInterval !== '4h') latest = await fetchInterval('4h');

        if (latest) {
          const conf = latest.confidence ?? 50;
          const signal = latest.signal || 'NO TRADE';
          const normalizedSignal = signal.toUpperCase();
          const isLong = normalizedSignal.includes('LONG');
          const isShort = normalizedSignal.includes('SHORT');
          const isNoTrade = !isLong && !isShort;

          // Для NO TRADE: показуємо нахил з raw_prediction (якщо є) зі зниженою впевненістю
          const rawDir = (latest.raw_prediction || '').toUpperCase();
          const rawIsLong  = rawDir.includes('LONG');
          const rawIsShort = rawDir.includes('SHORT');

          let longP: number;
          let shortP: number;

          if (isLong) {
            longP = conf; shortP = 100 - conf;
          } else if (isShort) {
            shortP = conf; longP = 100 - conf;
          } else if (isNoTrade && rawIsLong) {
            // NO TRADE але модель схилилась до LONG — показуємо слабкий нахил
            longP = Math.min(conf, 55); shortP = 100 - longP;
          } else if (isNoTrade && rawIsShort) {
            shortP = Math.min(conf, 55); longP = 100 - shortP;
          } else {
            longP = 50; shortP = 50;
          }

          setAiData({
            longPercent: longP,
            shortPercent: shortP,
            signal,
            hasPrediction: isLong || isShort,  // true тільки для реальних сигналів
            isLoading: false
          });
        } else {
          setAiData({ longPercent: 50, shortPercent: 50, signal: 'NO TRADE', hasPrediction: false, isLoading: false });
        }
      } catch (error) {
        console.error("Помилка завантаження AI сигналу:", error);
        setAiData({ longPercent: 50, shortPercent: 50, signal: 'NO TRADE', hasPrediction: false, isLoading: false });
      }
    };

    fetchAiSignal();
  }, [coinShort, binancePairSymbol, cgId, timeframe]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: 'rgba(255, 255, 255, 0.4)' },
      grid: { vertLines: { color: 'rgba(255, 255, 255, 0.03)' }, horzLines: { color: 'rgba(255, 255, 255, 0.03)' } },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: '#8348C1', width: 1, style: 3, labelBackgroundColor: '#8348C1' }, horzLine: { color: '#8348C1', width: 1, style: 3, labelBackgroundColor: '#8348C1' } },
      rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
      timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true },
      autoSize: true,
    });

    chartRef.current = chart;

    return () => chart.remove();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        let coinData: {
          ath?: number;
          market_cap?: number;
          circulating_supply?: number;
          max_supply?: number;
          total_supply?: number;
          high_24h?: number;
          low_24h?: number;
          total_volume?: number;
          price_change_percentage_24h?: number;
          price_change_percentage_1h_in_currency?: number;
        } | null = null;

        const cacheKey = `pulse_cg_market_v2_${cgId}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        const cachedTime = sessionStorage.getItem(`${cacheKey}_time`);

        if (cachedData && cachedTime && Date.now() - Number(cachedTime) < 120000) {
          coinData = JSON.parse(cachedData);
        } else {
          const cgRes = await fetch(`/api/coingecko/coins/markets?vs_currency=usd&ids=${encodeURIComponent(cgId)}&price_change_percentage=1h,24h`);
          if (cgRes.ok) {
            const cgData = await cgRes.json();
            if (cgData && cgData.length > 0) {
              coinData = cgData[0];
              sessionStorage.setItem(cacheKey, JSON.stringify(coinData));
              sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
            }
          }
        }

        if (coinData) {
          setFundamentals({
            ath: coinData.ath || 0,
            mcap: coinData.market_cap || 0,
            circSupply: coinData.circulating_supply || 0,
            maxSupply: coinData.max_supply || 0,
            totalSupply: coinData.total_supply || 0,
          });
        }

        const tickerRes = await fetch(`/api/binance/ticker/24hr?symbol=${binancePairSymbol}`);
        if(tickerRes.ok) {
          setIsBinanceAvailable(true);
          const tickerData = await tickerRes.json();
          const kline1hRes = await fetch(`/api/binance/klines?symbol=${binancePairSymbol}&interval=1h&limit=2`);
          const kline1hData = kline1hRes.ok ? await kline1hRes.json() : [];
          
          let change1h = 0;
          if (Array.isArray(kline1hData) && kline1hData.length >= 2) {
            const open1h = parseFloat(kline1hData[1][1]);
            const current = parseFloat(kline1hData[1][4]);
            if (open1h > 0 && Number.isFinite(current)) {
              change1h = ((current - open1h) / open1h) * 100;
            }
          }

          setStats({
            priceChange1h: change1h || coinData?.price_change_percentage_1h_in_currency || 0,
            priceChange24h: parseFloat(tickerData.priceChangePercent),
            high24h: parseFloat(tickerData.highPrice),
            low24h: parseFloat(tickerData.lowPrice),
            volume24h: parseFloat(tickerData.quoteVolume),
          });
        } else {
          setIsBinanceAvailable(false);
          if (coinData) {
            setStats({
              priceChange1h: coinData.price_change_percentage_1h_in_currency || 0,
              priceChange24h: coinData.price_change_percentage_24h || 0,
              high24h: coinData.high_24h || 0,
              low24h: coinData.low_24h || 0,
              volume24h: coinData.total_volume || 0,
            });
          }
        }
      } catch (error) {
        console.error("Помилка завантаження статистики:", error);
      }
    };
    fetchStats();
  }, [binancePairSymbol, coinShort, cgId, passedCoin]);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!isBinanceAvailable) {
        setIsLoading(false);
        return; 
      }

      setIsLoading(true);
      try {
        const tfConfig: Record<string, { interval: string; limit: number }> = {
          '1 сек': { interval: '1s', limit: 200 }, '1 хв': { interval: '1m', limit: 200 }, '5 хв': { interval: '5m', limit: 200 },
          '15 хв': { interval: '15m', limit: 200 }, '1 год': { interval: '1h', limit: 200 }, '4 год': { interval: '4h', limit: 200 },
          '1 день': { interval: '1d', limit: 200 }, '1 тиж': { interval: '1w', limit: 200 }, '1 міс': { interval: '1M', limit: 200 },
        };
        const config = tfConfig[timeframe] || tfConfig['15 хв'];
        
        if (chartRef.current) {
          chartRef.current.applyOptions({ timeScale: { secondsVisible: timeframe === '1 сек' || timeframe === '1 хв' || timeframe === '5 хв' } });
        }

        const res = await fetch(`/api/binance/klines?symbol=${binancePairSymbol}&interval=${config.interval}&limit=${config.limit}`);
        if(!res.ok) throw new Error("Binance API Error");
        
        const data = await res.json() as (string | number)[][];

        if (chartRef.current) {
          if (seriesRef.current) chartRef.current.removeSeries(seriesRef.current);

          if (chartType === 'candle') {
            const candleSeries = chartRef.current.addSeries(CandlestickSeries, {
              upColor: '#00E676', downColor: '#FF2E2E', borderVisible: false, wickUpColor: '#00E676', wickDownColor: '#FF2E2E',
            });
            seriesRef.current = candleSeries;
            candleSeries.setData(data.map((item) => ({
              time: Math.floor(Number(item[0]) / 1000) as Time, open: parseFloat(item[1] as string), high: parseFloat(item[2] as string), low: parseFloat(item[3] as string), close: parseFloat(item[4] as string),
            })));
          } else {
            const areaSeries = chartRef.current.addSeries(AreaSeries, {
              lineColor: '#B57AFF', topColor: 'rgba(181, 122, 255, 0.4)', bottomColor: 'rgba(181, 122, 255, 0)', lineWidth: 3,
            });
            seriesRef.current = areaSeries;
            areaSeries.setData(data.map((item) => ({
              time: Math.floor(Number(item[0]) / 1000) as Time, value: parseFloat(item[4] as string),
            })));
          }

          if (data.length > 1) {
            const firstPrice = parseFloat(data[0][4] as string);
            const latestPrice = parseFloat(data[data.length - 1][4] as string);
            setCurrentPrice(latestPrice);
            prevPriceRef.current = latestPrice;

            const changeValue = latestPrice - firstPrice;
            setPriceChange({ value: Math.abs(changeValue), percent: Math.abs((changeValue / firstPrice) * 100), isPositive: changeValue >= 0 });
          }

        }
      } catch (error) {
        console.error("Помилка завантаження історичних даних:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe, chartType, binancePairSymbol, isBinanceAvailable]);

  useEffect(() => {
    if (!isBinanceAvailable) return;

    const tfConfig: Record<string, string> = {
      '1 сек': '1s', '1 хв': '1m', '5 хв': '5m', '15 хв': '15m', '1 год': '1h', '4 год': '4h', '1 день': '1d', '1 тиж': '1w', '1 міс': '1M'
    };
    const wsUrl = `wss://stream.binance.com:9443/ws/${binancePairSymbol.toLowerCase()}@kline_${tfConfig[timeframe] || '15m'}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data as string);
      const newLivePrice = parseFloat(message.k.c);
      setCurrentPrice(newLivePrice);

      if (newLivePrice > prevPriceRef.current) setPriceColor('text-[#00E676]');
      else if (newLivePrice < prevPriceRef.current) setPriceColor('text-[#FF2E2E]');
      setTimeout(() => setPriceColor('text-white'), 500);
      prevPriceRef.current = newLivePrice;

      if (!seriesRef.current) return;
      const timestamp = Math.floor(message.k.t / 1000) as Time;
      if (chartType === 'candle') {
        (seriesRef.current as ISeriesApi<"Candlestick">).update({
          time: timestamp, open: parseFloat(message.k.o), high: parseFloat(message.k.h), low: parseFloat(message.k.l), close: parseFloat(message.k.c),
        });
      } else {
        (seriesRef.current as ISeriesApi<"Area">).update({ time: timestamp, value: parseFloat(message.k.c) });
      }
    };
    return () => {
      ws.onmessage = null;
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.onopen = () => ws.close();
        return;
      }
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [timeframe, chartType, binancePairSymbol, isBinanceAvailable]);
  
  const highLowRange = stats.high24h - stats.low24h;
  const currentPositionPercent = highLowRange > 0 
    ? Math.max(0, Math.min(100, ((currentPrice - stats.low24h) / highLowRange) * 100)) 
    : 50;

  const volMcapRatio = (fundamentals.mcap > 0 && stats.volume24h > 0) 
    ? (stats.volume24h / fundamentals.mcap).toFixed(4) 
    : '---';

  // ВИПРАВЛЕННЯ 2: Задаємо змінні і реально їх використовуємо в JSX
  let signalText = "Немає прогнозу для\nцього таймфрейму";
  let signalColorClass = "text-[#8E8E8E]";

  if (aiData.signal.includes("LONG")) {
    signalText = "Ймовірне зростання ціни\nна цьому таймфреймі";
    signalColorClass = "text-[#00E676]";
  } else if (aiData.signal.includes("SHORT")) {
    signalText = "Ймовірне зниження ціни\nна цьому таймфреймі";
    signalColorClass = "text-[#E53232]";
  } else if (aiData.longPercent > 50) {
    // NO TRADE але є нахил до LONG
    signalText = "Слабкий сигнал до зростання,\nвисока невизначеність";
    signalColorClass = "text-[#86efac]";
  } else if (aiData.shortPercent > 50) {
    // NO TRADE але є нахил до SHORT
    signalText = "Слабкий сигнал до зниження,\nвисока невизначеність";
    signalColorClass = "text-[#fca5a5]";
  } else if (aiData.signal !== 'NO TRADE' || aiData.longPercent !== 50) {
    signalText = "Модель не бачить переваги\nдля Long або Short";
    signalColorClass = "text-[#fbbf24]";
  }

  const handleRelatedCoinClick = (coin: RelatedCoinCard) => {
    navigate(`/asset/${coin.id}`, {
      state: {
        coin: {
          id: coin.id,
          symbol: coin.symbol,
          imgUrl: coin.image,
        },
      },
    });

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };


  const handleOpenTradingWorkspace = () => {
    navigate(`/trading/${coinShort}`, {
      state: {
        coin: {
          id: cgId,
          symbol: coinShort,
          imgUrl: coinIcon,
        },
      },
    });
  };

  return (
    <section className="w-full max-w-[1600px] mx-auto px-10 pt-7 pb-12 font-montserrat">
      {/* ГРАФІК — повна ширина */}
      <div className="w-full p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
          <div className="relative w-full h-[520px] rounded-[27px] bg-[#050506] p-8 flex flex-col overflow-hidden">
            <div className="flex justify-between items-start relative z-20 flex-wrap gap-4">
              
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-3 mb-2 w-full relative">
                  <img src={coinIcon} alt={coinShort} className="w-[32px] h-[32px] rounded-full shrink-0 object-contain" />
                  
                  <div className="group relative min-w-0">
                    <h2 className="text-[28px] font-semibold text-white flex items-baseline gap-2 min-w-0 max-w-full cursor-default">
                      <span className="truncate block">{coinName}</span>
                      <span className="text-white/50 text-[18px] shrink-0">({coinShort})</span>
                    </h2>

                    <div className="absolute left-0 -bottom-9 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 bg-[#1A1A1D] border border-white/10 text-white text-[14px] py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                      {coinName} ({coinShort})
                    </div>
                  </div>

                  <div className="relative ml-[8px] inline-flex shrink-0 translate-y-[10px] self-start">
                    <button
                      type="button"
                      onClick={handleFavoriteToggle}
                      disabled={favoriteLoading}
                      className={`group inline-flex items-center gap-2 text-[14px] font-medium transition-all duration-300 hover:scale-[1.03] active:scale-95 disabled:opacity-60 pb-1 border-b-2 border-transparent ${
                        isFavorite ? 'text-[#C38BFF] hover:text-[#C38BFF]' : 'text-white hover:text-white/80'
                      }`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={isFavorite ? '#C38BFF' : 'none'}
                        stroke={isFavorite ? '#C38BFF' : '#FFFFFF'}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mb-[1px]"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      {favoriteLoading ? 'Оновлення...' : isFavorite ? 'В обраному' : 'В обране'}
                    </button>

                    {favoriteNotice && (
                      <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-max max-w-[260px] rounded-[16px] border border-[#8348C1]/35 bg-[#050506] px-4 py-3 text-[12px] leading-[16px] text-[#FFF9F9] shadow-[0_18px_45px_rgba(0,0,0,0.45),0_0_22px_rgba(131,72,193,0.18)]">
                        {favoriteNotice}
                      </div>
                    )}
                  </div>

                </div>

                <div className="flex items-baseline gap-2">
                  <span className={`text-[36px] font-medium leading-none transition-colors duration-300 ${priceColor}`}>
                    {!isBinanceAvailable && currentPrice === 0 
                      ? 'Дані відсутні' 
                      : currentPrice > 0 
                        ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) 
                        : 'Завантаження...'}
                  </span>
                  <span className="text-[14px] text-white/50">USDT</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[14px] font-medium ${priceChange.isPositive ? 'text-[#00E676]' : 'text-[#FF2E2E]'}`}>
                    {isBinanceAvailable 
                      ? `${priceChange.isPositive ? '+' : '-'}${priceChange.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} (${priceChange.percent.toFixed(2)}%) ${priceChange.isPositive ? '↑' : '↓'}`
                      : '---'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-4 mt-1 shrink-0">
                <div className="flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={handleOpenTradingWorkspace}
                    className="group inline-flex h-[36px] items-center gap-2 rounded-full bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] px-4 text-[13px] font-medium text-white shadow-[0_4px_15px_rgba(131,72,193,0.24)] transition-all duration-300 hover:scale-[1.03] active:scale-95"
                  >
                    Торговий термінал
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M7 17L17 7M10 7H17V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <div className="flex gap-4 items-center">
                    <button onClick={() => setChartType('area')} className={`text-[14px] font-medium pb-1 transition-all duration-300 border-b-2 ${chartType === 'area' ? 'text-[#FFF9F9] border-[#8348C1]' : 'text-[#FFF9F9]/50 border-transparent hover:text-[#FFF9F9]'}`}>Лінія</button>
                    <button onClick={() => setChartType('candle')} className={`text-[14px] font-medium pb-1 transition-all duration-300 border-b-2 ${chartType === 'candle' ? 'text-[#FFF9F9] border-[#8348C1]' : 'text-[#FFF9F9]/50 border-transparent hover:text-[#FFF9F9]'}`}>Свічки</button>
                  </div>
                </div>
                <div className="flex gap-4 items-center flex-wrap justify-end">
                  {['1 сек', '1 хв', '5 хв', '15 хв', '1 год', '4 год', '1 день', '1 тиж', '1 міс'].map((t) => (
                    <button key={t} onClick={() => setTimeframe(t)} className={`text-[14px] font-medium pb-1 transition-all duration-300 border-b-2 ${timeframe === t ? 'text-[#FFF9F9] border-[#8348C1]' : 'text-[#FFF9F9]/50 border-transparent hover:text-[#FFF9F9]'}`}>{t}</button>
                  ))}
                </div>
              </div>
            </div>

            {isLoading && isBinanceAvailable && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#050506]/60 z-20 rounded-xl backdrop-blur-sm">
                <div className="w-8 h-8 border-4 border-[#B57AFF] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {!isBinanceAvailable && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050506]/80 z-20 rounded-[27px] backdrop-blur-md border border-white/5">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" className="mb-4">
                  <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" />
                  <path d="M9 12H15" strokeLinecap="round" />
                </svg>
                <span className="text-white/60 font-medium text-[16px] text-center">
                  Пара {binancePairSymbol} наразі не торгується на Binance
                </span>
                <span className="text-white/30 text-[13px] mt-2">Фундаментальні дані нижче оновлені з CoinGecko</span>
              </div>
            )}

            <div className="absolute bottom-[20px] left-4 right-[10px] h-[330px] z-10" ref={chartContainerRef} />
          </div>
        </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_261px] gap-[24px] items-end mt-[24px]">
        {/* ОСНОВНІ ДАНІ */}
        <div>
          <h3 className="text-[24px] font-semibold text-[#FFF9F9] mb-6">Основні дані</h3>
          <div className="w-full h-[300px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10)]">
            <div className="w-full h-full rounded-[27px] bg-[#050506] p-6 flex flex-col justify-between">
              <h4 className="text-[20px] font-medium text-[#FFF9F9] mb-6 font-montserrat">Графік ефективності {coinName}</h4>
              <div className="flex flex-col md:flex-row items-start gap-8 md:gap-[12px] flex-grow">
                <div className="flex flex-col gap-[12px] w-full md:w-[280px] md:pr-[34px] shrink-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] font-normal text-[#FFF9F9] font-montserrat">Макс. за весь час</span>
                    <span className="inline-block text-[14px] font-normal text-[#FFF9F9] font-montserrat md:translate-x-[34px]">{fundamentals.ath > 0 ? `${fundamentals.ath.toLocaleString('en-US')}$` : '---'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] font-normal text-[#FFF9F9] font-montserrat">Зміна ціни (1 год)</span>
                    <span className={`inline-block text-[14px] font-normal font-montserrat md:translate-x-[34px] ${stats.priceChange1h >= 0 ? 'text-[#00E676]' : 'text-[#FF2E2E]'}`}>
                      {stats.priceChange1h !== 0 ? `${stats.priceChange1h > 0 ? '+' : ''}${stats.priceChange1h.toFixed(2)}%` : '---'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] font-normal text-[#FFF9F9] font-montserrat">Зміна ціни (24 год)</span>
                    <span className={`inline-block text-[14px] font-normal font-montserrat md:translate-x-[34px] ${stats.priceChange24h >= 0 ? 'text-[#00E676]' : 'text-[#FF2E2E]'}`}>
                        {stats.priceChange24h !== 0 ? `${stats.priceChange24h > 0 ? '+' : ''}${stats.priceChange24h.toFixed(2)}%` : '---'}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-[14px] font-medium text-[#FFF9F9] mb-[12px] font-montserrat">
                      <span>Макс. та мін. за 24 год</span>
                    </div>
                    <div className="relative h-[6px] w-[calc(100%+34px)] rounded-full bg-gradient-to-r from-[#FF2E2E] to-[#00E676] mb-[12px]">
                        {stats.high24h > 0 && (
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 w-2 h-3 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)] transition-all duration-300" 
                            style={{ left: `calc(${currentPositionPercent}% - 4px)` }}
                          />
                        )}
                    </div>
                    <div className="flex w-[calc(100%+34px)] justify-between text-[14px] font-normal text-[#FFF9F9] font-montserrat">
                      <span>{stats.low24h > 0 ? `${stats.low24h.toLocaleString('en-US', {maximumFractionDigits: 2})}$` : '---'}</span>
                      <span>{stats.high24h > 0 ? `${stats.high24h.toLocaleString('en-US', {maximumFractionDigits: 2})}$` : '---'}</span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block w-[1px] h-[228px] bg-gradient-to-b from-[#B3B3B3]/10 to-[#522E8B] opacity-40 md:-mt-[32px] md:translate-x-[34px]"></div>
                <div className="flex flex-col gap-[24px] w-full md:w-[220px] md:pl-[22px] md:translate-x-[34px]">
                  <div>
                    <p className="text-[12px] font-medium text-[#8E8E8E] mb-1.5 font-montserrat">Ринкова капіталізація</p>
                    <p className="text-[14px] font-medium text-[#FFF9F9] font-montserrat">{formatCurrency(fundamentals.mcap)}</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-[#8E8E8E] mb-1.5 font-montserrat">Макс. пропозиція</p>
                    <p className="text-[14px] font-medium text-[#FFF9F9] font-montserrat">{formatSupply(fundamentals.maxSupply, true)}</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-[#8E8E8E] mb-1.5 font-montserrat">Об'єм / Капіталізація</p>
                    <p className="text-[14px] font-medium text-[#FFF9F9] font-montserrat">{volMcapRatio}</p>
                  </div>
                </div>
                <div className="hidden md:block w-[1px] h-[228px] bg-gradient-to-b from-[#B3B3B3]/10 to-[#522E8B] opacity-40 md:-mt-[32px] md:translate-x-[34px]"></div>
                <div className="flex flex-col gap-[24px] w-full md:w-[220px] md:pl-[22px] md:translate-x-[34px]">
                  <div>
                    <p className="text-[12px] font-medium text-[#8E8E8E] mb-1.5 font-montserrat">Циркул. пропозиція</p>
                    <p className="text-[14px] font-medium text-[#FFF9F9] font-montserrat">{formatSupply(fundamentals.circSupply)}</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-[#8E8E8E] mb-1.5 font-montserrat">Всього монет</p>
                    <p className="text-[14px] font-medium text-[#FFF9F9] font-montserrat">{formatSupply(fundamentals.totalSupply)}</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-[#8E8E8E] mb-1.5 font-montserrat">Об'єм торгів (24 год)</p>
                    <p className="text-[14px] font-medium text-[#FFF9F9] font-montserrat">{formatCurrency(stats.volume24h)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ВІДЖЕТ PulseAI */}
        <div className="w-full h-[352px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10)]">
          <div className="w-full h-full rounded-[27px] bg-[#050506] p-6 flex flex-col relative overflow-hidden">
            
            {aiData.isLoading && (
               <div className="absolute inset-0 bg-[#050506]/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-[27px]">
                  <div className="w-6 h-6 border-2 border-[#8348C1] border-t-transparent rounded-full animate-spin"></div>
               </div>
            )}

            <div className="flex items-center justify-between mb-8 relative z-0">
              <div className="flex items-center gap-2">
                <img src="/logo-crypro-pulse.svg" alt="PulseAI" className="w-5 h-5 object-contain" />
                <div className="text-[16px] tracking-wide font-montserrat">
                  <span className="font-medium text-white">Pulse</span>
                  <span className="font-semibold bg-gradient-to-r from-[#ceafef] to-[#9a64d4] bg-clip-text text-transparent">AI</span>
                </div>
              </div>
              <div className="h-[24px] p-[1px] rounded-[16px] bg-[linear-gradient(90deg,rgba(82,46,139,0.4),rgba(179,179,179,0.4))] shrink-0">
                  <div className="w-full h-full rounded-[15px] bg-[#050506] bg-[linear-gradient(180deg,rgba(255,255,255,0.25)_0%,transparent_35%,transparent_65%,rgba(255,255,255,0.25)_100%)] flex items-center justify-center gap-1.5 px-3">
                    <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]"></div>
                    <span className="text-[10px] font-medium text-[#8348C1] uppercase font-montserrat tracking-wider">АІ Аналіз</span>
                  </div>
              </div>
            </div>
            
            {/* ЯКЩО ТАЙМФРЕЙМ ШУМНИЙ (<4 ГОДИН) */}
            {aiData.signal === 'NOISY' ? (
              <div className="flex flex-col items-center justify-center flex-grow mb-6 text-center px-2 relative z-0">
                <div className="w-12 h-12 rounded-full bg-[#fbbf24]/10 flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <p className="text-[14px] text-[#fbbf24] font-medium font-montserrat leading-relaxed mb-1">
                  AI-прогноз недоступний
                </p>
                <p className="text-[11px] text-white/50 font-montserrat">
                  Таймфрейми менше 4 годин містять надто багато ринкового шуму. Оберіть більший період.
                </p>
              </div>
            ) : (
              // ЯКЩО ТАЙМФРЕЙМ ОК (4 ГОД або БІЛЬШЕ)
              <>
                <div className="flex justify-between items-center px-1 mb-4 relative z-0">
                  <div className="flex flex-col items-center gap-1 w-1/2">
                    <span className="text-[32px] font-medium text-[#E53232] leading-none font-montserrat">
                      {aiData.shortPercent.toFixed(0)}%
                    </span>
                    <span className="text-[14px] font-medium text-[#E53232] font-montserrat">Short</span>
                  </div>
                  <div className="w-[1px] h-[36px] bg-white/10"></div>
                  <div className="flex flex-col items-center gap-1 w-1/2">
                    <span className="text-[32px] font-medium text-[#00E676] leading-none font-montserrat">
                      {aiData.longPercent.toFixed(0)}%
                    </span>
                    <span className="text-[14px] font-medium text-[#00E676] font-montserrat">Long</span>
                  </div>
                </div>
                
                <div className="w-full h-[6px] rounded-full bg-[#E53232] mb-6 relative overflow-hidden z-0">
                   <div 
                     className="absolute top-0 right-0 h-full bg-[#00E676] transition-all duration-1000 ease-out"
                     style={{ width: `${aiData.longPercent}%` }}
                   ></div>
                </div>
                
                <div className="flex items-start gap-3 mb-6 relative z-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mt-0.5">
                    {aiData.signal.includes("LONG") ? (
                      <path d="M2 20L8 14L12 18L22 4" stroke="#00E676" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    ) : aiData.signal.includes("SHORT") ? (
                      <path d="M2 4L8 10L12 6L22 20" stroke="#E53232" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    ) : (
                      <path d="M2 12H22" stroke="#A3A4B0" strokeWidth="1.5" strokeLinecap="round"/>
                    )}
                  </svg>
                  {/* ВИПРАВЛЕННЯ 3: Вставляємо змінні прямо сюди */}
                  <p className={`text-[12px] font-medium font-montserrat leading-[1.4] ${signalColorClass}`}>
                    {signalText}
                  </p>
                </div>
              </>
            )}

            <div className="flex flex-col gap-3 mt-auto relative z-0">
              <button 
                onClick={() => window.open(`https://cryptomisha-ai-agent-c2fa3q367soa93m2cjyfrw.streamlit.app/`, '_blank', 'noopener,noreferrer')}
                className="w-full h-[44px] rounded-[28px] font-montserrat font-medium text-[14px] text-[#FFF9F9] bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] shadow-[0_4px_15px_rgba(131,72,193,0.3)] hover:scale-[1.02] transition-transform"
              >
                Запитати AI
              </button>
              <p className="text-[10px] font-medium text-[#8E8E8E] text-center font-montserrat">
                Не є фінансовою порадою
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[24px]">
        <h3 className="text-[24px] font-semibold leading-[28px] text-[#FFF9F9] mb-6">
          Останні новини
        </h3>

        <div className="w-full max-w-[1116px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_100px_rgba(131,72,193,0.22),0_8px_25px_rgba(0,0,0,0.42)]">
          <div className="relative min-h-[442px] overflow-hidden rounded-[28px] bg-[#050506] px-[24px] pt-[24px] pb-[86px]">
            {newsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[80px] gap-y-[24px]">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="min-h-[82px] rounded-[16px] p-3 -mx-3 -my-2 animate-pulse">
                    <div className="mb-[12px] h-[24px] w-[210px] rounded-full bg-white/10" />
                    <div className="h-[18px] w-full rounded-full bg-white/10" />
                    <div className="mt-[8px] h-[18px] w-[75%] rounded-full bg-white/10" />
                  </div>
                ))}
              </div>
            ) : newsError ? (
              <div className="flex h-[260px] items-center justify-center text-center text-[14px] text-white/60">
                {newsError}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[80px] gap-y-[24px]">
                {assetNews.map((item, index) => (
                  <a
                    key={`${item.url}-${index}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[82px] flex-col gap-[8px] rounded-[16px] p-3 -mx-3 -my-2 transition-all duration-300 hover:bg-white/[0.04] hover:translate-x-1"
                  >
                    <div className="flex h-[24px] items-center gap-[8px]">
                      <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#5F6068] bg-[#303137]/70">
                        <img
                          src={item.icon || coinIcon}
                          alt={item.tag || coinShort}
                          className="h-[18px] w-[18px] object-contain"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>

                      <span className="text-[12px] font-normal leading-[16px] text-[#A3A4B0]">
                        {formatNewsTime(item.publishedAt)} · {item.source}
                      </span>
                    </div>

                    <p className="text-[16px] font-medium leading-[24px] text-white line-clamp-2">
                      {item.title}
                    </p>
                  </a>
                ))}
              </div>
            )}

            <div className="absolute bottom-[24px] left-1/2 -translate-x-1/2">
              <button
                type="button"
                onClick={() => navigate('/news', {
                  state: {
                    from: 'asset',
                    returnPath: location.pathname,
                    returnState: {
                      coin: {
                        id: cgId,
                        symbol: coinShort,
                        imgUrl: coinIcon,
                        name: coinName,
                      },
                    },
                  },
                })}
                className="group relative flex h-[44px] w-[243px] items-center justify-center rounded-[28px] p-[1px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_18px_rgba(131,72,193,0.35)] active:scale-95"
              >
                <span className="flex h-full w-full items-center justify-center rounded-[28px] bg-[#050506] text-[14px] font-medium leading-[20px] text-white transition-colors group-hover:bg-[#0B0B0D]">
                  Перейти до головних новин
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[24px]">
        <h3 className="text-[24px] font-semibold leading-[28px] text-[#FFF9F9] mb-6">
          Схожі активи
        </h3>

        <div className="grid w-full max-w-[1116px] grid-cols-1 gap-[24px] md:grid-cols-2 xl:grid-cols-4">
          {relatedLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-[227px] rounded-[28px] border border-white/10 bg-[#050506] animate-pulse" />
              ))
            : relatedCoins.map((coin, index) => {
                const isPositive = coin.change >= 0;
                const gradientId = `asset-related-gradient-${coin.symbol}-${index}`;
                const sparklinePoints = buildRelatedSparklinePoints(coin.chartData);
                return (
                  <button
                    key={coin.id}
                    type="button"
                    onClick={() => handleRelatedCoinClick(coin)}
                    className="group h-[227px] w-full p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] text-left shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:scale-[1.018] hover:-translate-y-1 hover:shadow-[0_20px_80px_rgba(131,72,193,0.28),0_8px_25px_rgba(0,0,0,0.5)]"
                  >
                    <div className="relative h-full overflow-hidden rounded-[28px] bg-[#050506] px-[24px] py-[24px]">
                      <div className="relative z-10 flex items-start justify-between">
                        <div className="flex items-center gap-[12px]">
                          <div className="flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-full bg-white/5">
                            <img src={coin.image} alt={coin.symbol} className="h-full w-full object-contain" />
                          </div>
                          <div>
                            <p className="text-[14px] font-medium leading-[18px] text-white">{coin.name}</p>
                            <p className="text-[14px] font-medium leading-[18px] text-white">({coin.symbol})</p>
                          </div>
                        </div>

                        <span className="relative flex h-[40px] w-[40px] shrink-0 items-center justify-center transition-all duration-300 group-hover:scale-110">
                          <span className="absolute inset-0 rounded-full bg-[#7c3aed]/40 blur-md opacity-0 transition-all group-hover:opacity-100" />
                          <img src="/buttom.svg" alt="open" className="relative z-10 h-[40px] w-[40px]" />
                        </span>
                      </div>

                      <div className="relative z-10 mt-[18px]">
                        <div className="flex items-end gap-1">
                          <span className="text-[28px] font-medium leading-[32px] text-white">
                            {formatRelatedPrice(coin.price)}
                          </span>
                          <span className="pb-[3px] text-[12px] font-medium text-white">USDT</span>
                        </div>
                        <p className="mt-[6px] text-[12px] font-normal leading-[16px] text-white">
                          Зміна : <span className={isPositive ? 'text-[#24FF7A]' : 'text-[#F40000]'}>{formatRelatedChange(coin.change)}</span>
                        </p>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 h-[96px]">
                        <div
                          className="absolute bottom-[34px] left-0 right-0 h-[1px] opacity-35"
                          style={{
                            backgroundImage: 'linear-gradient(to right, #6F6C6C 50%, transparent 50%)',
                            backgroundSize: '8px 1px',
                            backgroundRepeat: 'repeat-x',
                          }}
                        />
                        <svg
                          className="absolute inset-0 h-full w-full"
                          viewBox="0 0 260 96"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor={isPositive ? '#2C1969' : '#5A0B0B'} />
                              <stop offset="50%" stopColor={isPositive ? '#8348C1' : '#F40000'} />
                              <stop offset="100%" stopColor={isPositive ? '#C38BFF' : '#FF2E2E'} />
                            </linearGradient>
                          </defs>
                          {sparklinePoints && (
                            <polyline
                              points={sparklinePoints}
                              fill="none"
                              stroke={`url(#${gradientId})`}
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              vectorEffect="non-scaling-stroke"
                            />
                          )}
                        </svg>
                      </div>
                    </div>
                  </button>
                );
              })}
        </div>
      </div>
    </section>
  );
}
