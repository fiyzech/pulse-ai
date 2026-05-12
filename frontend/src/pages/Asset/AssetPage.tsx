import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { createChart, ColorType, CrosshairMode, AreaSeries, CandlestickSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import {
  addFavoriteAsset,
  getAuthenticatedUserId,
  getFavoriteAsset,
  removeFavoriteAsset,
} from '../../utils/favoriteAssets';

const COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'BNB': 'binancecoin',
  'XRP': 'ripple', 'ADA': 'cardano', 'AVAX': 'avalanche-2', 'DOGE': 'dogecoin',
  'DOT': 'polkadot', 'MATIC': 'matic-network',
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
  confidence?: number | null;
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
  const { symbol: routeAsset } = useParams<{ symbol: string }>();
  const passedCoin = location.state?.coin;
  const routeAssetValue = routeAsset || '';
  const routeSymbolFromCgId = Object.entries(COINGECKO_IDS).find(([, value]) => value === routeAssetValue)?.[0];
  const routeSymbol = routeAssetValue.length <= 6 ? routeAssetValue.toUpperCase() : routeSymbolFromCgId;

  const coinShort = (passedCoin?.symbol || props.coinShort || routeSymbol || 'BTC').toUpperCase();
  const coinSymbol = `${coinShort}USDT`; 
  
  const routeName = routeAssetValue && routeAssetValue.length > 6
    ? routeAssetValue.charAt(0).toUpperCase() + routeAssetValue.slice(1).replace(/-/g, ' ')
    : coinShort;

  const coinName = passedCoin?.id
    ? passedCoin.id.charAt(0).toUpperCase() + passedCoin.id.slice(1).replace(/-/g, ' ')
    : props.coinName || routeName || 'Bitcoin';
    
  const coinIcon = passedCoin?.imgUrl || props.coinIcon || '/Bitcoin.svg';
  const cgId = passedCoin?.id || (routeSymbol ? COINGECKO_IDS[routeSymbol] : routeAssetValue) || COINGECKO_IDS[coinShort] || 'bitcoin';
  
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
    isLoading: true
  });
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | ISeriesApi<"Candlestick"> | null>(null);
  const prevPriceRef = useRef<number>(0);

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

  const handleFavoriteToggle = async () => {
    setFavoriteNotice('');
    setFavoriteLoading(true);

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

        const predictionSymbols = buildPredictionSymbolVariants(coinShort, coinSymbol, cgId);
        const params = new URLSearchParams({
          select: '*',
          symbol: `in.(${predictionSymbols.join(',')})`,
          interval: `eq.${dbInterval}`,
          order: 'created_at.desc',
          limit: '1',
        });

        const res = await fetch(`${SUPABASE_URL}/rest/v1/model_predictions?${params.toString()}`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });

        if (res.ok) {
          const data = await res.json() as ModelPrediction[];
          if (data && data.length > 0) {
            const latest = data[0];
            const conf = latest.confidence || 50;
            const signal = latest.signal || 'NO TRADE';
            const normalizedSignal = signal.toUpperCase();
            const isLong = normalizedSignal.includes('LONG');
            const isShort = normalizedSignal.includes('SHORT');

            let longP = 50;
            let shortP = 50;

            if (isLong) {
              longP = conf;
              shortP = 100 - conf;
            } else if (isShort) {
              shortP = conf;
              longP = 100 - conf;
            }

            setAiData({
              longPercent: longP,
              shortPercent: shortP,
              signal,
              isLoading: false
            });
          } else {
            setAiData({ longPercent: 50, shortPercent: 50, signal: 'NO TRADE', isLoading: false });
          }
        } else {
          setAiData({ longPercent: 50, shortPercent: 50, signal: 'NO TRADE', isLoading: false });
        }
      } catch (error) {
        console.error("Помилка завантаження AI сигналу:", error);
        setAiData({ longPercent: 50, shortPercent: 50, signal: 'NO TRADE', isLoading: false });
      }
    };

    fetchAiSignal();
  }, [coinShort, coinSymbol, cgId, timeframe]);

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
        if (!passedCoin?.rawMcap) {
          const cacheKey = `pulse_cg_${cgId}`;
          const cachedData = sessionStorage.getItem(cacheKey);
          const cachedTime = sessionStorage.getItem(`${cacheKey}_time`);

          if (cachedData && cachedTime && Date.now() - Number(cachedTime) < 120000) {
            const coinData = JSON.parse(cachedData);
            setFundamentals({
              ath: coinData.ath, mcap: coinData.market_cap, circSupply: coinData.circulating_supply,
              maxSupply: coinData.max_supply, totalSupply: coinData.total_supply,
            });
          } else {
            const cgRes = await fetch(`/api/coingecko/coins/markets?vs_currency=usd&ids=${cgId}`);
            if(cgRes.ok) {
              const cgData = await cgRes.json();
              if (cgData && cgData.length > 0) {
                const coinData = cgData[0];
                setFundamentals({
                  ath: coinData.ath, mcap: coinData.market_cap, circSupply: coinData.circulating_supply,
                  maxSupply: coinData.max_supply, totalSupply: coinData.total_supply,
                });
                sessionStorage.setItem(cacheKey, JSON.stringify(coinData));
                sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
              }
            }
          }
        }

        const tickerRes = await fetch(`/api/binance/ticker/24hr?symbol=${coinSymbol}`);
        if(tickerRes.ok) {
          setIsBinanceAvailable(true);
          const tickerData = await tickerRes.json();
          const kline1hRes = await fetch(`/api/binance/klines?symbol=${coinSymbol}&interval=1h&limit=2`);
          const kline1hData = await kline1hRes.json();
          
          let change1h = 0;
          if (kline1hData.length >= 2) {
            const open1h = parseFloat(kline1hData[1][1]);
            const current = parseFloat(kline1hData[1][4]);
            change1h = ((current - open1h) / open1h) * 100;
          }

          setStats({
            priceChange1h: change1h,
            priceChange24h: parseFloat(tickerData.priceChangePercent),
            high24h: parseFloat(tickerData.highPrice),
            low24h: parseFloat(tickerData.lowPrice),
            volume24h: parseFloat(tickerData.quoteVolume),
          });
        } else {
          setIsBinanceAvailable(false);
        }
      } catch (error) {
        console.error("Помилка завантаження статистики:", error);
      }
    };
    fetchStats();
  }, [coinSymbol, coinShort, cgId, passedCoin]);

  useEffect(() => {
    // ВИПРАВЛЕННЯ 1: Ховаємо setState всередину асинхронної функції
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

        const res = await fetch(`/api/binance/klines?symbol=${coinSymbol}&interval=${config.interval}&limit=${config.limit}`);
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
  }, [timeframe, chartType, coinSymbol, isBinanceAvailable]);

  useEffect(() => {
    if (!isBinanceAvailable) return;

    const tfConfig: Record<string, string> = {
      '1 сек': '1s', '1 хв': '1m', '5 хв': '5m', '15 хв': '15m', '1 год': '1h', '4 год': '4h', '1 день': '1d', '1 тиж': '1w', '1 міс': '1M'
    };
    const wsUrl = `wss://stream.binance.com:9443/ws/${coinSymbol.toLowerCase()}@kline_${tfConfig[timeframe] || '15m'}`;
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
    return () => ws.close();
  }, [timeframe, chartType, coinSymbol, isBinanceAvailable]);
  
  const highLowRange = stats.high24h - stats.low24h;
  const currentPositionPercent = highLowRange > 0 
    ? Math.max(0, Math.min(100, ((currentPrice - stats.low24h) / highLowRange) * 100)) 
    : 50;

  const volMcapRatio = (fundamentals.mcap > 0 && stats.volume24h > 0) 
    ? (stats.volume24h / fundamentals.mcap).toFixed(4) 
    : '---';

  // ВИПРАВЛЕННЯ 2: Задаємо змінні і реально їх використовуємо в JSX
  let signalText = "Недостатньо даних у БД\nдля цього таймфрейму";
  let signalColorClass = "text-[#8E8E8E]";
  
  if (aiData.signal.includes("LONG")) {
    signalText = "Ймовірне зростання ціни\nна цьому таймфреймі";
    signalColorClass = "text-[#00E676]";
  } else if (aiData.signal.includes("SHORT")) {
    signalText = "Ймовірне зниження ціни\nна цьому таймфреймі";
    signalColorClass = "text-[#E53232]";
  }

  return (
    <section className="w-full max-w-[1600px] mx-auto px-10 pt-7 pb-12 font-montserrat">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_261px] gap-[24px] items-start">
        
        {/* ЛІВА КОЛОНКА (Графік) */}
        <div className="w-full p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
          <div className="relative w-full h-[438px] rounded-[27px] bg-[#050506] p-8 flex flex-col overflow-hidden">
            <div className="flex justify-between items-start relative z-20 flex-wrap gap-4">
              
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-3 mb-2 w-full group relative">
                  <img src={coinIcon} alt={coinShort} className="w-[32px] h-[32px] rounded-full shrink-0" />
                  
                  <h2 className="text-[28px] font-semibold text-white flex items-baseline gap-2 min-w-0 max-w-full cursor-default">
                    <span className="truncate block">{coinName}</span>
                    <span className="text-white/50 text-[18px] shrink-0">({coinShort})</span>
                  </h2>

                  <div className="absolute left-10 -bottom-9 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 bg-[#1A1A1D] border border-white/10 text-white text-[14px] py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                    {coinName} ({coinShort})
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
                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={handleFavoriteToggle}
                    disabled={favoriteLoading}
                    className={`group relative inline-flex h-[38px] min-w-[164px] items-center justify-center gap-2 rounded-full p-[1px] transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60 ${
                      isFavorite
                        ? 'bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] shadow-[0_0_18px_rgba(131,72,193,0.35)]'
                        : 'bg-[linear-gradient(90deg,rgba(82,46,139,0.95),rgba(195,139,255,0.95))]'
                    }`}
                  >
                    <span className="flex h-full w-full items-center justify-center gap-2 rounded-full bg-[#050506] px-5 text-[13px] font-medium text-[#FFF9F9] transition-colors group-hover:bg-[#09090B]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? '#C38BFF' : 'none'} stroke="#C38BFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      {favoriteLoading ? 'Оновлення...' : isFavorite ? 'В обраному' : 'Додати в обране'}
                    </span>
                  </button>
                  {favoriteNotice && (
                    <span className="max-w-[240px] text-right text-[11px] leading-[16px] text-[#A3A4B0]">
                      {favoriteNotice}
                    </span>
                  )}
                </div>
                <div className="flex gap-4 items-center">
                  <button onClick={() => setChartType('area')} className={`text-[14px] font-medium pb-1 transition-all duration-300 border-b-2 ${chartType === 'area' ? 'text-[#FFF9F9] border-[#8348C1]' : 'text-[#FFF9F9]/50 border-transparent hover:text-[#FFF9F9]'}`}>Лінія</button>
                  <button onClick={() => setChartType('candle')} className={`text-[14px] font-medium pb-1 transition-all duration-300 border-b-2 ${chartType === 'candle' ? 'text-[#FFF9F9] border-[#8348C1]' : 'text-[#FFF9F9]/50 border-transparent hover:text-[#FFF9F9]'}`}>Свічки</button>
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
                  Пара {coinSymbol} наразі не торгується на Binance
                </span>
                <span className="text-white/30 text-[13px] mt-2">Фундаментальні дані нижче оновлені з CoinGecko</span>
              </div>
            )}

            <div className="absolute bottom-[20px] left-4 right-[10px] h-[260px] z-10" ref={chartContainerRef} />
          </div>
        </div>

        {/* ПРАВА КОЛОНКА (Віджет 1: Створити алерт) */}
        <div className="w-full h-[438px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10)]">
          <div className="w-full h-full rounded-[27px] bg-[#050506] p-6 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
                <img src="/logo-crypro-pulse.svg" alt="Logo" className="w-5 h-5 object-contain" />
                <div className="text-[15.5px] tracking-wide font-montserrat">
                  <span className="font-medium text-white">Crypto</span>
                  <span className="font-semibold bg-gradient-to-r from-[#ceafef] to-[#9a64d4] bg-clip-text text-transparent">Pulse</span>
                </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-[16px] font-medium text-white font-montserrat">Створити алерт</h3>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              </div>
              <p className="text-[12px] font-light text-[#8E8E8E] mb-5 leading-relaxed font-montserrat">Створи алерт і не пропускай важливі зміни</p>
            </div>
            <div className="flex flex-col gap-4 flex-grow">
              <div>
                <label className="text-[12px] font-light text-[#8E8E8E] mb-1.5 block font-montserrat">Умова</label>
                <div className="w-full h-[44px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
                  <div className="relative w-full h-full rounded-[27px] bg-[#050506]">
                    <select className="w-full h-full bg-transparent px-4 text-[14px] font-normal text-white appearance-none outline-none font-montserrat rounded-[27px]">
                      <option>Ціна вище ніж</option>
                      <option>Ціна нижче ніж</option>
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[12px] font-light text-[#8E8E8E] mb-1.5 block font-montserrat">Значення</label>
                  <div className="w-full h-[44px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
                      <div className="w-full h-full rounded-[27px] bg-[#050506]">
                        <input 
                          type="text" 
                          key={currentPrice} 
                          defaultValue={currentPrice > 0 ? `${currentPrice.toFixed(0)} USDT` : '---'} 
                          className="w-full h-full bg-transparent px-2 text-[14px] font-normal text-white outline-none font-montserrat text-center rounded-[27px]" 
                        />
                      </div>
                  </div>
                </div>
                <div className="w-[87px] shrink-0">
                  <label className="text-[12px] font-light text-[#8E8E8E] mb-1.5 block font-montserrat">Період</label>
                  <div className="w-full h-[44px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
                    <div className="relative w-full h-full rounded-[27px] bg-[#050506]">
                      <select className="w-full h-full bg-transparent pl-4 pr-6 text-[14px] font-normal text-white appearance-none outline-none font-montserrat rounded-[27px]">
                        <option>1 год</option>
                        <option>4 год</option>
                        <option>1 день</option>
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-[13px] font-light text-[#8E8E8E] font-montserrat">Сповіщати щоразу</span>
                  <div className="w-[36px] h-[20px] bg-[#FFF9F9]/20 rounded-full relative cursor-pointer">
                      <div className="absolute left-1 top-[2px] w-[16px] h-[16px] bg-[#FFF9F9] rounded-full"></div>
                  </div>
                </div>
                <button className="w-full h-[44px] rounded-[28px] font-montserrat font-medium text-[14px] text-[#FFF9F9] bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] shadow-[0_4px_15px_rgba(131,72,193,0.3)] hover:scale-[1.02] transition-transform">
                  Створити
                </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_261px] gap-[24px] items-end mt-[24px]">
        {/* ОСНОВНІ ДАНІ */}
        <div>
          <h3 className="text-[24px] font-semibold text-[#FFF9F9] mb-6">Основні дані</h3>
          <div className="w-full h-[300px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10)]">
            <div className="w-full h-full rounded-[27px] bg-[#050506] p-8 flex flex-col justify-between">
              <h4 className="text-[20px] font-medium text-[#FFF9F9] mb-6 font-montserrat">Графік ефективності {coinName}</h4>
              <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-4 flex-grow">
                <div className="flex flex-col gap-[22px] w-full md:w-[280px] shrink-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] font-normal text-[#8E8E8E] font-montserrat">Макс. за весь час</span>
                    <span className="text-[14px] font-normal text-[#FFF9F9] font-montserrat">{fundamentals.ath > 0 ? `${fundamentals.ath.toLocaleString('en-US')}$` : '---'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] font-normal text-[#8E8E8E] font-montserrat">Зміна ціни (1 год)</span>
                    <span className={`text-[14px] font-normal font-montserrat ${stats.priceChange1h >= 0 ? 'text-[#00E676]' : 'text-[#FF2E2E]'}`}>
                      {stats.priceChange1h !== 0 ? `${stats.priceChange1h > 0 ? '+' : ''}${stats.priceChange1h.toFixed(2)}%` : '---'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] font-normal text-[#8E8E8E] font-montserrat">Зміна ціни (24 год)</span>
                    <span className={`text-[14px] font-normal font-montserrat ${stats.priceChange24h >= 0 ? 'text-[#00E676]' : 'text-[#FF2E2E]'}`}>
                        {stats.priceChange24h !== 0 ? `${stats.priceChange24h > 0 ? '+' : ''}${stats.priceChange24h.toFixed(2)}%` : '---'}
                    </span>
                  </div>
                  <div className="pt-1">
                    <div className="flex justify-between text-[14px] font-medium text-[#FFF9F9] mb-3 font-montserrat">
                      <span>Макс. та мін. за 24 год</span>
                    </div>
                    <div className="relative w-full h-[6px] rounded-full bg-gradient-to-r from-[#FF2E2E] to-[#00E676] mb-3">
                        {stats.high24h > 0 && (
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 w-2 h-3 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)] transition-all duration-300" 
                            style={{ left: `calc(${currentPositionPercent}% - 4px)` }}
                          />
                        )}
                    </div>
                    <div className="flex justify-between text-[14px] font-normal text-[#FFF9F9] font-montserrat">
                      <span>{stats.low24h > 0 ? `${stats.low24h.toLocaleString('en-US', {maximumFractionDigits: 2})}$` : '---'}</span>
                      <span>{stats.high24h > 0 ? `${stats.high24h.toLocaleString('en-US', {maximumFractionDigits: 2})}$` : '---'}</span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block w-[1px] h-[228px] bg-gradient-to-b from-[#522E8B] to-[#B3B3B3]/10 opacity-40"></div>
                <div className="flex flex-col gap-6 w-full md:w-auto">
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
                <div className="hidden md:block w-[1px] h-[228px] bg-gradient-to-b from-[#522E8B] to-[#B3B3B3]/10 opacity-40"></div>
                <div className="flex flex-col gap-6 w-full md:w-auto">
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
    </section>
  );
}
