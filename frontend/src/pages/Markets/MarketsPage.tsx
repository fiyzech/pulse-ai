import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import bookmarkPlusIcon from '../../assets/icons/bookmark-plus.svg';
import trashIcon from '../../assets/icons/trash.svg';
import eyeIcon from '../../assets/icons/eye.svg';
import trashIconRed from '../../assets/icons/trash-red.svg';
import {
  addFavoriteAsset,
  getAuthenticatedUserId,
  listFavoriteAssets,
  removeFavoriteAsset,
} from '../../utils/favoriteAssets';

// === ДАНІ ДЛЯ ВЕРХНІХ КАРТОК ===
interface MarketItem {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  imgUrl: string;
}

interface TableMarketItem {
  id: string;
  symbol: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
  cap: string;
  vol: string;
  imgUrl: string;
  // ОСЬ ЦІ ДАНІ ОБОВ'ЯЗКОВІ ДЛЯ ЕФІРУ ТА ІНШИХ:
  rawMcap: number;
  rawAth: number;
  rawCircSupply: number;
  rawTotalSupply: number;
  rawMaxSupply: number;
}

type BinanceTicker = {
  symbol: string;
};

type BinanceTicker24h = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
};

type CoinGeckoMarketCoin = {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  market_cap: number | null;
  total_volume: number | null;
  image: string;
  ath: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
};

const initialTopCardsData: Record<string, MarketItem[]> = {
  popular: [
    { symbol: "BTC", price: "...", change: "...", isPositive: true, imgUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.png" },
    { symbol: "ETH", price: "...", change: "...", isPositive: true, imgUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
    { symbol: "SOL", price: "...", change: "...", isPositive: true, imgUrl: "https://cryptologos.cc/logos/solana-sol-logo.png" },
  ],
  futures: [
    { symbol: "BNB", price: "...", change: "...", isPositive: true, imgUrl: "https://cryptologos.cc/logos/bnb-bnb-logo.png" },
    { symbol: "ARB", price: "...", change: "...", isPositive: true, imgUrl: "https://cryptologos.cc/logos/arbitrum-arb-logo.png" },
    { symbol: "AVAX", price: "...", change: "...", isPositive: true, imgUrl: "https://cryptologos.cc/logos/avalanche-avax-logo.png" },
  ],
  new: [
    { symbol: "SUI", price: "...", change: "...", isPositive: true, imgUrl: "https://cryptologos.cc/logos/sui-sui-logo.png" },
    { symbol: "PEPE", price: "...", change: "...", isPositive: true, imgUrl: "https://cryptologos.cc/logos/pepe-pepe-logo.png" },
    { symbol: "TIA", price: "...", change: "...", isPositive: true, imgUrl: "https://cryptologos.cc/logos/celestia-tia-logo.png" },
  ]
};

const topCardsIds: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana',
  BNB: 'binancecoin', ARB: 'arbitrum', AVAX: 'avalanche-2',
  SUI: 'sui', PEPE: 'pepe', TIA: 'celestia'
};

const COINGECKO_COOLDOWN_MS = 10 * 60 * 1000;
const coingeckoCooldownKey = 'pulse_coingecko_cooldown_until';

const isCoinGeckoCoolingDown = () => {
  const until = Number(sessionStorage.getItem(coingeckoCooldownKey) || 0);
  return Date.now() < until;
};

const startCoinGeckoCooldown = () => {
  sessionStorage.setItem(coingeckoCooldownKey, String(Date.now() + COINGECKO_COOLDOWN_MS));
};

const parseJsonCache = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export default function MarketsPage() {
  const navigate = useNavigate();

  const [liveTopData, setLiveTopData] = useState<Record<string, { price: number; change: number }>>({});
  const [allTableMarkets, setAllTableMarkets] = useState<TableMarketItem[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(30);
  const [apiError, setApiError] = useState<string | null>(null);
  const [favoriteUserId, setFavoriteUserId] = useState<string | null>(null);
  const [favoriteSymbols, setFavoriteSymbols] = useState<Set<string>>(new Set());
  const [pendingFavorites, setPendingFavorites] = useState<Set<string>>(new Set());
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [hoveredTrash, setHoveredTrash] = useState<string | null>(null);

  const formatPrice = (price: number | null) => {
    if (!price) return "$0.00";
    if (price < 0.01) return `$${price}`;
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatChange = (change: number | null) => {
    if (change === null || change === undefined) return "0.0%";
    const fixed = change.toFixed(1);
    return change > 0 ? `+${fixed}%` : `${fixed}%`;
  };

  const formatCompactNumber = (num: number | null) => {
    if (!num) return "$0";
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString('en-US')}`;
  };

  useEffect(() => {
    const fetchTopCards = async () => {
      try {
        const cachedTopData = sessionStorage.getItem('pulse_top_cards');
        const cachedTopTime = sessionStorage.getItem('pulse_top_time');
        const staleTopData = parseJsonCache<Record<string, { price: number; change: number }>>(cachedTopData);

        if (staleTopData && cachedTopTime && Date.now() - Number(cachedTopTime) < 60000) {
          setLiveTopData(staleTopData);
          return;
        }

        if (isCoinGeckoCoolingDown()) {
          if (staleTopData) setLiveTopData(staleTopData);
          return;
        }

        const topIds = Object.values(topCardsIds).join(',');
        const res = await fetch(`/api/coingecko/simple/price?ids=${topIds}&vs_currencies=usd&include_24hr_change=true`);

        if (res.status === 429) {
          startCoinGeckoCooldown();
          if (staleTopData) setLiveTopData(staleTopData);
          return;
        }

        if (res.ok) {
          const topData = await res.json();
          const parsedTop: Record<string, { price: number; change: number }> = {};
          Object.entries(topCardsIds).forEach(([symbol, id]) => {
            if (topData[id]) {
              parsedTop[symbol] = { price: topData[id].usd, change: topData[id].usd_24h_change };
            }
          });
          setLiveTopData(parsedTop);
          sessionStorage.setItem('pulse_top_cards', JSON.stringify(parsedTop));
          sessionStorage.setItem('pulse_top_time', Date.now().toString());
        }
      } catch (error) {
        console.error('Помилка завантаження топ карток:', error);
      }
    };

    fetchTopCards();
    const intervalId = setInterval(fetchTopCards, 60000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchTableData = async () => {
      try {
        setApiError(null);

        const cachedTableData = sessionStorage.getItem('pulse_table_cards');
        const cachedTableTime = sessionStorage.getItem('pulse_table_time');
        const staleTableData = parseJsonCache<TableMarketItem[]>(cachedTableData);

        if (staleTableData && cachedTableTime && Date.now() - Number(cachedTableTime) < 120000) {
          setAllTableMarkets(staleTableData);
          return;
        }

        if (isCoinGeckoCoolingDown() && staleTableData) {
          setAllTableMarkets(staleTableData);
          setApiError(null);
          return;
        }

        const [binanceRes, cgRes] = await Promise.all([
          fetch('/api/binance/ticker/24hr'),
          fetch('/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false')
        ]);

        if (cgRes.status === 429) {
          startCoinGeckoCooldown();
          if (staleTableData) {
            setAllTableMarkets(staleTableData);
            setApiError(null);
            return;
          }

          if (binanceRes.ok) {
            const binanceData = await binanceRes.json() as BinanceTicker24h[];
            const ignoredStablecoins = ['USDT', 'USDC', 'DAI', 'FDUSD', 'TUSD', 'USDD', 'USDS'];
            const fallbackTable = binanceData
              .filter((item) => item.symbol.endsWith('USDT'))
              .map((item) => item.symbol.replace(/USDT$/, ''))
              .filter((symbol) => !ignoredStablecoins.includes(symbol))
              .slice(0, 125)
              .map((symbol) => {
                const ticker = binanceData.find((item) => item.symbol === `${symbol}USDT`);
                const change = Number(ticker?.priceChangePercent || 0);
                return {
                  id: topCardsIds[symbol] || symbol.toLowerCase(),
                  symbol,
                  name: symbol,
                  price: formatPrice(Number(ticker?.lastPrice || 0)),
                  change: formatChange(change),
                  isPositive: change > 0,
                  cap: '---',
                  vol: formatCompactNumber(Number(ticker?.quoteVolume || 0)),
                  imgUrl: `https://cryptologos.cc/logos/${symbol.toLowerCase()}-${symbol.toLowerCase()}-logo.png`,
                  rawMcap: 0,
                  rawAth: 0,
                  rawCircSupply: 0,
                  rawTotalSupply: 0,
                  rawMaxSupply: 0,
                };
              });

            setAllTableMarkets(fallbackTable);
            sessionStorage.setItem('pulse_table_cards', JSON.stringify(fallbackTable));
            sessionStorage.setItem('pulse_table_time', Date.now().toString());
            setApiError(null);
            return;
          }

          setApiError("CoinGecko тимчасово обмежив запити. Показуємо останні доступні дані.");
          return;
        }

        if (binanceRes.ok && cgRes.ok) {
          const binanceData = await binanceRes.json() as BinanceTicker[];
          const cgData = await cgRes.json() as CoinGeckoMarketCoin[];

          const validBinancePairs = new Set(
            binanceData
              .filter((item) => item.symbol.endsWith('USDT'))
              .map((item) => item.symbol)
          );

          const ignoredStablecoins = ['USDT', 'USDC', 'DAI', 'FDUSD', 'TUSD', 'USDD', 'USDS'];

          const validBinanceCoins = cgData.filter((coin) => {
            const symbolUpper = coin.symbol.toUpperCase();
            if (ignoredStablecoins.includes(symbolUpper)) return false;
            return validBinancePairs.has(`${symbolUpper}USDT`);
          });

          const final125Coins = validBinanceCoins.slice(0, 125);

          const formattedTable = final125Coins.map((coin) => ({
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            price: formatPrice(coin.current_price),
            change: formatChange(coin.price_change_percentage_24h),
            isPositive: (coin.price_change_percentage_24h ?? 0) > 0,
            cap: formatCompactNumber(coin.market_cap),
            vol: formatCompactNumber(coin.total_volume),
            imgUrl: coin.image,
            rawMcap: coin.market_cap || 0,
            rawAth: coin.ath || 0,
            rawCircSupply: coin.circulating_supply || 0,
            rawTotalSupply: coin.total_supply || 0,
            rawMaxSupply: coin.max_supply || 0
          }));

          setAllTableMarkets(formattedTable);
          sessionStorage.setItem('pulse_table_cards', JSON.stringify(formattedTable));
          sessionStorage.setItem('pulse_table_time', Date.now().toString());
        }
      } catch (error) {
        console.error('Помилка завантаження таблиці:', error);
      }
    };

    fetchTableData();
    const intervalId = setInterval(fetchTableData, 120000);
    return () => clearInterval(intervalId);
  }, []);

  const mergeLiveStats = (items: MarketItem[]) => {
    return items.map(item => {
      const live = liveTopData[item.symbol];
      if (!live) return item;
      return {
        ...item,
        price: formatPrice(live.price),
        change: formatChange(live.change),
        isPositive: live.change > 0
      };
    });
  };

  const currentPopular = mergeLiveStats(initialTopCardsData.popular);
  const currentFutures = mergeLiveStats(initialTopCardsData.futures);
  const currentNew = mergeLiveStats(initialTopCardsData.new);

  const handleViewClick = (coin: TableMarketItem) => {
    navigate(`/asset/${coin.id}`, { state: { coin } });
  };

  const loadFavoriteSymbols = useCallback(async () => {
    try {
      const userId = await getAuthenticatedUserId();
      if (!userId) {
        setFavoriteUserId(null);
        setFavoriteSymbols(new Set());
        return;
      }

      setFavoriteUserId(userId);
      const favorites = await listFavoriteAssets(userId);
      setFavoriteSymbols(new Set(favorites.map((favorite) => favorite.symbol.toUpperCase())));
    } catch (error) {
      console.error('Помилка завантаження обраного:', error);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFavoriteSymbols();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadFavoriteSymbols]);

  const handleFavoriteToggle = async (coin: TableMarketItem) => {
    const symbol = coin.symbol.toUpperCase();
    if (pendingFavorites.has(symbol)) return;

    const wasFavorite = favoriteSymbols.has(symbol);
    const userId = favoriteUserId || await getAuthenticatedUserId();

    if (!userId) {
      setFavoriteError('Увійдіть в акаунт, щоб додавати активи в обране.');
      return;
    }

    if (!favoriteUserId) setFavoriteUserId(userId);

    setFavoriteError(null);
    setPendingFavorites((prev) => new Set(prev).add(symbol));
    setFavoriteSymbols((prev) => {
      const next = new Set(prev);
      if (wasFavorite) next.delete(symbol);
      else next.add(symbol);
      return next;
    });

    try {
      if (wasFavorite) {
        await removeFavoriteAsset(userId, symbol);
      } else {
        await addFavoriteAsset(userId, {
          coinId: coin.id,
          symbol,
          name: coin.name || symbol,
          imageUrl: coin.imgUrl,
        });
      }

      sessionStorage.removeItem('pulse_user_favorites');
    } catch (error) {
      console.error('Помилка оновлення обраного:', error);
      setFavoriteSymbols((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.add(symbol);
        else next.delete(symbol);
        return next;
      });
      setFavoriteError('Не вдалося оновити обране. Перевірте таблицю user_favorites.');
    } finally {
      setPendingFavorites((prev) => {
        const next = new Set(prev);
        next.delete(symbol);
        return next;
      });
    }
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 30, allTableMarkets.length));
  };

  const visibleTableMarkets = allTableMarkets.slice(0, visibleCount);
  const hasMore = visibleCount < allTableMarkets.length;

  const globalStyles = `
    .row-divider { position: relative; }
    .row-divider::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 32px;
      right: 32px;
      height: 1px;
      background: linear-gradient(90deg, #522E8B 0%, rgba(179, 179, 179, 0.1) 100%);
      opacity: 0.32;
      pointer-events: none;
    }

    .action-button {
      position: relative;
      border-radius: 9999px;
      background: #050506;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 24px;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
    }
    
    .action-button:hover {
      opacity: 0.8;
      transform: scale(1.02);
    }

    .action-button::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 9999px; 
      padding: 1px;
      background: linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }

    .load-more-btn {
      position: relative;
      border-radius: 9999px;
      background: #050506;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 32px;
      cursor: pointer;
      transition: all 0.3s ease-in-out;
    }
    .load-more-btn:hover {
      background: rgba(82,46,139,0.15);
      transform: translateY(-2px);
    }
    .load-more-btn::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 9999px; 
      padding: 1px;
      background: linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }
  `;

  return (
    <section className="w-full text-white font-['Montserrat'] bg-[#000000] min-h-screen pb-10">
      <style>{globalStyles}</style>

      <div style={{ width: '546px' }} className="mt-[24px] mb-[24px] ml-[40px] flex items-center">
        <p className="text-[#FFFFFF] text-[16px] leading-[28px] font-normal">
          Аналізуйте ринкові показники в реальному часі, зміни цін та додавайте активи до обраних для зручного контролю
        </p>
      </div>

      <div className="flex gap-[24px] mb-[26px] px-10">
        <MarketStatsCard title="Популярні токени" items={currentPopular} />
        <MarketStatsCard title="Найкращі ф’ючерси" items={currentFutures} />
        <MarketStatsCard title="Найновіші" items={currentNew} />
      </div>

      {favoriteError && (
        <div className="mx-10 mb-4 rounded-[18px] border border-[#8348C1]/40 bg-[#050506] px-5 py-3 text-[13px] text-[#C38BFF]">
          {favoriteError}
        </div>
      )}

      <div
        style={{ width: '1116px' }}
        className="ml-10 p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.12),0_8px_25px_rgba(0,0,0,0.35)]"
      >
        <div className="relative rounded-[28px] bg-[#050506] flex flex-col overflow-hidden">

          <div
            style={{ height: '57px' }}
            className="relative grid grid-cols-[1.45fr_1fr_1fr_1.45fr_1fr_116px] items-center px-[24px] text-[#A3A4B0] text-[14px] font-normal font-['Montserrat'] bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)] min-h-[57px] rounded-t-[28px]"
          >
            {/* Лінія розмежування (вона залишається на місці) */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))]" />

            {/* Назви колонок */}
            <div className="flex items-center">Актив</div>
            <div>Ціна</div>
            <div>24год</div>
            <div className="flex flex-col justify-center leading-[1.1]">
              <span>Ринкова</span>
              <span>капіталізація</span>
            </div>
            <div>Обсяг</div>
            <div className="pl-[20px] text-left">Дії</div>
          </div>

          <div className="flex flex-col">
            {apiError && allTableMarkets.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-[#FF4B4B] text-[15px]">
                {apiError}
              </div>
            ) : allTableMarkets.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-[#A3A4B0] text-[15px]">
                Завантаження криптовалют...
              </div>
            ) : (
              visibleTableMarkets.map((coin) => {
                const isFavorite = favoriteSymbols.has(coin.symbol);

                return (
                  <div key={coin.id} className="relative group">
                    {/* Основний контейнер рядка */}
                    <div
                      className="grid grid-cols-[1.45fr_1fr_1fr_1.45fr_1fr_116px] items-center px-[24px] h-[68px]"
                    >
                      {/* 1. Стовпчик Монета */}
                      <div className="flex items-center gap-3">
                        <img src={coin.imgUrl} alt="" className="w-7 h-7 rounded-full object-contain" />
                        <span className="text-[14px] font-medium font-['Montserrat'] text-white uppercase">{coin.symbol}</span>
                      </div>

                      {/* 2. Ціна */}
                      <div className="text-[14px] font-normal font-['Montserrat'] text-[#FFFFFF]">
                        {coin.price}
                      </div>

                      {/* 3. Зміна за 24г */}
                      <div className={`text-[14px] font-normal font-['Montserrat'] ${coin.isPositive ? 'text-[#36D399]' : 'text-[#F87272]'}`}>
                        {coin.change}
                      </div>

                      {/* 4. Капіталізація */}
                      <div className="text-[14px] font-normal font-['Montserrat'] text-[#FFFFFF]">
                        {coin.cap}
                      </div>

                      {/* 5. Обсяг */}
                      <div className="text-[14px] font-normal font-['Montserrat'] text-[#FFFFFF]">
                        {coin.vol}
                      </div>

                      {/* Кнопки дій */}
                      <div className="flex items-center justify-start gap-[24px] pl-[20px] pr-[24px]">
                        {/* Кнопка Око */}
                        <button
                          type="button"
                          className="group/btn relative inline-flex w-8 h-8 flex-shrink-0 items-center justify-center rounded-full p-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_12px_rgba(131,72,193,0.28)] active:scale-95 cursor-pointer"
                          onClick={() => handleViewClick(coin)}
                        >
                          <span className="flex h-full w-full items-center justify-center rounded-full bg-[#050506] transition-all duration-300 group-hover/btn:bg-[#0B0B0D]">
                            <img src={eyeIcon} alt="" className="w-4 h-4 opacity-70 grayscale brightness-125 transition-all duration-300 group-hover/btn:scale-105 group-hover/btn:opacity-100 group-hover/btn:grayscale-0 group-hover/btn:brightness-150"/>
                          </span>
                        </button>

                        {/* Кнопка Зберегти */}
                        <button
                          type="button"
                          className="group/btn relative inline-flex w-8 h-8 flex-shrink-0 items-center justify-center rounded-full p-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_12px_rgba(131,72,193,0.28)] active:scale-95 cursor-pointer"
                          onClick={() => handleFavoriteToggle(coin)}
                        >
                          <span className="flex h-full w-full items-center justify-center rounded-full bg-[#050506] transition-all duration-300 group-hover/btn:bg-[#0B0B0D]">
                          {isFavorite ? (
                            <img src={trashIconRed} alt="" className="w-[18px] h-[18px] opacity-120 grayscale contrast-[0.45] transition-all duration-300 group-hover/btn:scale-105 group-hover/btn:grayscale-0 group-hover/btn:brightness-100 group-hover/btn:contrast-100"/>
                          ) : (
                            <img src={bookmarkPlusIcon} alt="" className="w-[18px] h-[18px] opacity-70 grayscale brightness-125 transition-all duration-300 group-hover/btn:scale-105 group-hover/btn:opacity-100 group-hover/btn:grayscale-0 group-hover/btn:brightness-100"/>
                          )}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* ГРАДІЄНТНА ЛІНІЯ — вона позиціонована відносно "relative" батька */}
                    <div className="absolute bottom-0 left-[24px] right-[24px] opacity-[0.32]">
                      <div className="h-[1px] bg-[linear-gradient(90deg,#522E8B_0%,rgba(179,179,179,0.1)_100%)]" />
                    </div>
                  </div>
                );
              })
            )}

            {hasMore && allTableMarkets.length > 0 && !apiError && (
              <div className="flex justify-center items-center py-8">
                <button
                  className="load-more-btn"
                  onClick={handleLoadMore}
                >
                  <span className="text-[15px] font-medium text-white tracking-wide">Завантажити ще</span>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}

function MarketStatsCard({ title, items }: { title: string, items: MarketItem[] }) {
  return (
    <div
      style={{ width: '356px', height: 'auto', minHeight: '199px' }}
      className="p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_80px_rgba(131,72,193,0.19),0_8px_25px_rgba(0,0,0,0.5)]"
    >
      <div className="relative h-full rounded-[28px] bg-[#050506] overflow-hidden">

        {/* Хедер залишаємо */}
        <div className="relative h-[57px] flex items-center px-[24px] rounded-t-[28px] overflow-hidden bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)]">
          <h3 className="text-[16px] text-white font-medium font-['Montserrat'] leading-none relative z-10">
            {title}
          </h3>
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.2),rgba(82,46,139,0.2))]" />
        </div>

        {/* ОДРАЗУ список токенів без зайвих обгорток зверху */}
        <div className="flex flex-col gap-[22px] p-[24px] pt-[20px]">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between h-[20px]">
              <div className="flex items-center gap-3">
                <img src={item.imgUrl} alt={item.symbol} className="w-6 h-6 object-contain rounded-full" />
                <span className="text-[14px] font-medium font-['Montserrat'] text-[#FFFFFF] leading-none uppercase">
                  {item.symbol}
                </span>
              </div>
              <div className="flex gap-4 items-center">
                <span className="text-[14px] text-[#FFFFFF] font-normal font-['Montserrat'] leading-none w-[100px] text-left">
                  {item.price}
                </span>
                <span className={`text-[14px] w-[50px] text-right font-normal font-['Montserrat'] leading-none ${item.isPositive ? 'text-[#36D399]' : 'text-[#F87272]'}`}>
                  {item.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
