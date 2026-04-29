import { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode, AreaSeries, CandlestickSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';

export default function AssetPage() {
  const [timeframe, setTimeframe] = useState('15 хв');
  const [chartType, setChartType] = useState<'area' | 'candle'>('candle');
  
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceColor, setPriceColor] = useState<string>('text-white');
  const [priceChange, setPriceChange] = useState({ value: 0, percent: 0, isPositive: true });
  const [isLoading, setIsLoading] = useState(true);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | ISeriesApi<"Candlestick"> | null>(null);
  const prevPriceRef = useRef<number>(0);

  // 1. ІНІЦІАЛІЗАЦІЯ ГРАФІКА
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.4)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#8348C1', width: 1, style: 3, labelBackgroundColor: '#8348C1' },
        horzLine: { color: '#8348C1', width: 1, style: 3, labelBackgroundColor: '#8348C1' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
      },
      autoSize: true,
    });

    chartRef.current = chart;

    return () => {
      chart.remove();
    };
  }, []);

  // 2. ЗАВАНТАЖЕННЯ ДАНИХ (REST API)
  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true);
      try {
        const tfConfig: Record<string, { interval: string; limit: number }> = {
          '1 сек': { interval: '1s', limit: 200 },
          '1 хв': { interval: '1m', limit: 200 },
          '15 хв': { interval: '15m', limit: 200 },
          '1 год': { interval: '1h', limit: 200 },
          '4 год': { interval: '4h', limit: 200 },
          '1 день': { interval: '1d', limit: 200 },
        };

        const config = tfConfig[timeframe] || tfConfig['15 хв'];
        
        if (chartRef.current) {
          chartRef.current.applyOptions({
            timeScale: { secondsVisible: timeframe === '1 сек' || timeframe === '1 хв' }
          });
        }

        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${config.interval}&limit=${config.limit}`);
        const data = await res.json() as (string | number)[][];

        if (chartRef.current) {
          if (seriesRef.current) {
            chartRef.current.removeSeries(seriesRef.current);
          }

          if (chartType === 'candle') {
            const candleSeries = chartRef.current.addSeries(CandlestickSeries, {
              upColor: '#36D399',
              downColor: '#F87272',
              borderVisible: false,
              wickUpColor: '#36D399',
              wickDownColor: '#F87272',
            });
            seriesRef.current = candleSeries;
            
            const formattedData = data.map((item) => ({
              time: Math.floor(Number(item[0]) / 1000) as Time,
              open: parseFloat(item[1] as string),
              high: parseFloat(item[2] as string),
              low: parseFloat(item[3] as string),
              close: parseFloat(item[4] as string),
            }));
            candleSeries.setData(formattedData);
            
          } else {
            const areaSeries = chartRef.current.addSeries(AreaSeries, {
              lineColor: '#B57AFF',
              topColor: 'rgba(181, 122, 255, 0.4)',
              bottomColor: 'rgba(181, 122, 255, 0)',
              lineWidth: 3,
            });
            seriesRef.current = areaSeries;
            
            const formattedData = data.map((item) => ({
              time: Math.floor(Number(item[0]) / 1000) as Time,
              value: parseFloat(item[4] as string),
            }));
            areaSeries.setData(formattedData);
          }

          if (data.length > 1) {
            const firstPrice = parseFloat(data[0][4] as string);
            const latestPrice = parseFloat(data[data.length - 1][4] as string);
            
            setCurrentPrice(latestPrice);
            prevPriceRef.current = latestPrice;
            
            const changeValue = latestPrice - firstPrice;
            const changePercent = (changeValue / firstPrice) * 100;
            setPriceChange({
              value: Math.abs(changeValue),
              percent: Math.abs(changePercent),
              isPositive: changeValue >= 0
            });
          }
        }
      } catch (error) {
        console.error("Помилка завантаження історичних даних:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [timeframe, chartType]);

  // 3. WEBSOCKET (ЖИВІ ДАНІ)
  useEffect(() => {
    const tfConfig: Record<string, string> = {
      '1 сек': '1s', '1 хв': '1m', '15 хв': '15m', '1 год': '1h', '4 год': '4h', '1 день': '1d',
    };
    const interval = tfConfig[timeframe] || '15m';

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/btcusdt@kline_${interval}`);

    ws.onmessage = (event: MessageEvent) => {
      // Сувора типізація для WebSocket повідомлень
      const message = JSON.parse(event.data as string) as {
        k: { t: number; o: string; h: string; l: string; c: string };
      };
      const kline = message.k;

      const newLivePrice = parseFloat(kline.c);
      setCurrentPrice(newLivePrice);

      if (newLivePrice > prevPriceRef.current) setPriceColor('text-[#36D399]');
      else if (newLivePrice < prevPriceRef.current) setPriceColor('text-[#F87272]');
      setTimeout(() => setPriceColor('text-white'), 500);
      prevPriceRef.current = newLivePrice;

      if (!seriesRef.current) return;

      const timestamp = Math.floor(kline.t / 1000) as Time;
      
      if (chartType === 'candle') {
        (seriesRef.current as ISeriesApi<"Candlestick">).update({
          time: timestamp,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
        });
      } else {
        (seriesRef.current as ISeriesApi<"Area">).update({
          time: timestamp,
          value: parseFloat(kline.c),
        });
      }
    };

    return () => ws.close();
  }, [timeframe, chartType]);

  return (
    <section className="w-full max-w-[1600px] mx-auto px-10 pt-7 pb-12 font-montserrat">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_356px] gap-[24px]">
        
        {/* ЛІВА КОЛОНКА */}
        <div className="flex flex-col gap-[24px]">
          
          {/* ГРАФІК */}
          <div className="w-full p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
            <div className="relative w-full h-[500px] rounded-[27px] bg-[#050506] p-8 flex flex-col overflow-hidden">
              
              <div className="flex justify-between items-start relative z-20 flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <img src="/Bitcoin.svg" alt="BTC" className="w-[40px] h-[40px]" />
                    <h2 className="text-[28px] font-semibold text-white">Bitcoin <span className="text-white/50 text-[18px]">(BTC)</span></h2>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-[36px] font-medium leading-none transition-colors duration-300 ${priceColor}`}>
                      {currentPrice > 0 ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
                    </span>
                    <span className="text-[14px] text-white/50">USDT</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[14px] font-medium ${priceChange.isPositive ? 'text-[#36D399]' : 'text-[#F87272]'}`}>
                      {priceChange.isPositive ? '+' : '-'}{priceChange.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({priceChange.percent.toFixed(2)}%) {priceChange.isPositive ? '↑' : '↓'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  {/* ПЕРЕМИКАЧ: Лінія / Свічки */}
                  <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                    <button 
                      onClick={() => setChartType('area')} 
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${chartType === 'area' ? 'bg-[#8348C1] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                      Лінія
                    </button>
                    <button 
                      onClick={() => setChartType('candle')} 
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${chartType === 'candle' ? 'bg-[#8348C1] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                      Свічки
                    </button>
                  </div>

                  {/* ПЕРЕМИКАЧ: Таймфрейми */}
                  <div className="flex gap-2 items-center bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    {['1 сек', '1 хв', '15 хв', '1 год', '4 год', '1 день'].map((t) => (
                      <button 
                        key={t} 
                        onClick={() => setTimeframe(t)} 
                        className={`text-[12px] font-medium px-3 py-1.5 rounded-xl transition-all duration-300 ${timeframe === t ? 'bg-[#8348C1]/30 text-white shadow-lg border border-[#8348C1]/50' : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ЗОНА ГРАФІКА TRADINGVIEW */}
              <div className="absolute bottom-[20px] left-4 right-[10px] h-[320px] z-10">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#050506]/60 z-20 rounded-xl backdrop-blur-sm">
                    <div className="w-8 h-8 border-4 border-[#B57AFF] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <div ref={chartContainerRef} className="w-full h-full" />
              </div>

            </div>
          </div>

          {/* 2. ОСНОВНІ ДАНІ */}
          <div className="mt-2">
            <h3 className="text-[24px] font-semibold text-white/95 mb-6">Основні дані</h3>
            <div className="w-full p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10)]">
              <div className="w-full rounded-[27px] bg-[#050506] p-8">
                <h4 className="text-[18px] font-medium text-white mb-6">Графік ефективності Bitcoin</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-12">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[13px] text-white/50">Макс. за весь час</span>
                      <span className="text-[14px] text-white font-medium">126 198,07$</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[13px] text-white/50">Зміна ціни (1 год)</span>
                      <span className="text-[14px] text-[#36D399] font-medium">+0,04%</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[13px] text-white/50">Зміна ціни (24 год)</span>
                      <span className="text-[14px] text-[#F87272] font-medium">-4,54%</span>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between text-[12px] text-white/50 mb-2">
                        <span>Макс. та мін. за 24 год</span>
                      </div>
                      <div className="w-full h-[4px] rounded-full bg-gradient-to-r from-[#F87272] to-[#36D399] mb-2" />
                      <div className="flex justify-between text-[13px] text-white font-medium">
                        <span>69 3847,38$</span>
                        <span>69 3847,38$</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <div>
                      <p className="text-[13px] text-white/50 mb-1">Ринкова капіталізація</p>
                      <p className="text-[15px] text-white font-medium">1,32T USD</p>
                    </div>
                    <div>
                      <p className="text-[13px] text-white/50 mb-1">Макс. предложеннє</p>
                      <p className="text-[15px] text-white font-medium">21,00 M</p>
                    </div>
                    <div>
                      <p className="text-[13px] text-white/50 mb-1">Об'єм / Капіталізація</p>
                      <p className="text-[15px] text-white font-medium">0,0288</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <div>
                      <p className="text-[13px] text-white/50 mb-1">Циркул. предложеннє</p>
                      <p className="text-[15px] text-white font-medium">20,00 M</p>
                    </div>
                    <div>
                      <p className="text-[13px] text-white/50 mb-1">Всього монет</p>
                      <p className="text-[15px] text-white font-medium">20,00 M</p>
                    </div>
                    <div>
                      <p className="text-[13px] text-white/50 mb-1">Об'єм торгів</p>
                      <p className="text-[15px] text-white font-medium">49,02B USD</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. ОСТАННІ НОВИНИ */}
          <div className="mt-2">
            <h3 className="text-[24px] font-semibold text-white/95 mb-6">Останні новини</h3>
            <div className="w-full p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10)]">
              <div className="relative w-full rounded-[27px] bg-[#050506] px-8 pt-8 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[80px] gap-y-8">
                  {[
                    { time: "20 хвилин тому · The Block", title: "Bitcoin знову досяг $78 000 після заяви Трампа про відкриття Ормузької протоки" },
                    { time: "2 години тому · The Block", title: "Сенатор Блюменталь тисне на Мін'юст і Казначейство США щодо контролю за Binance" },
                    { time: "39 хвилин тому · The Block", title: "Представник X заявив, що функція Cashtags для крипти принесла $1 млрд торгового обсягу" },
                    { time: "2 години тому · The Block", title: "Bitcoin тестує рівні опору — огляд ринку" },
                    { time: "1 годину тому · The Block", title: "Індекс страху та жадібності крипторинку на максимумі з липня — огляд ринку" },
                    { time: "3 години тому · The Block", title: "Circle запускає USDC Bridge для нативних кросчейн – переказів стейблкоїнів" },
                  ].map((news, index) => (
                    <div key={index} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <img src="/Bitcoin.svg" alt="Icon" className="h-[20px] w-[20px]" />
                        <span className="text-[12px] text-white/60">{news.time}</span>
                      </div>
                      <p className="text-[15px] font-medium leading-snug text-white/90">{news.title}</p>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                  <button className="group relative flex h-[44px] px-8 items-center justify-center rounded-[28px] text-[14px] font-medium text-white hover:scale-105 transition-transform">
                    <svg className="absolute inset-0 h-full w-full pointer-events-none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="100%" height="42" rx="21" fill="none" stroke="url(#news-grad)" strokeWidth="1.5" /><defs><linearGradient id="news-grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#2C1969" /><stop offset="50%" stopColor="#8348C1" /><stop offset="100%" stopColor="#C38BFF" /></linearGradient></defs></svg>
                    <span className="relative z-10 whitespace-nowrap">Перейти до головних новин</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4. СХОЖІ МОНЕТИ */}
          <div className="mt-2">
            <h3 className="text-[24px] font-semibold text-white/95 mb-6">Схожі монети</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[180px] p-[1px] rounded-[24px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10)] cursor-pointer group">
                  <div className="relative h-full w-full rounded-[23px] bg-[#050506] p-5 overflow-hidden transition-all group-hover:bg-[#0a0a0d]">
                    <button className="absolute right-4 top-4 h-[32px] w-[32px] hover:scale-110 transition-transform z-20">
                       <img src="/buttom.svg" alt="Open" className="w-full h-full" />
                    </button>
                    <div className="flex items-center gap-2 mb-4 relative z-10">
                      <img src="/Ethereum.svg" alt="ETH" className="w-8 h-8" />
                      <div>
                        <h4 className="text-[14px] font-semibold text-white leading-tight">Ethereum</h4>
                        <p className="text-[11px] text-white/50">(ETH)</p>
                      </div>
                    </div>
                    <div className="relative z-10">
                      <p className="text-[24px] font-semibold text-white leading-none mb-1">98.432 <span className="text-[12px] font-normal text-white/50">USDT</span></p>
                      <p className="text-[11px] text-white/60">Зміна: <span className="text-[#36D399]">+2.45%</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ПРАВА КОЛОНКА (Віджети) */}
        <div className="flex flex-col gap-6 w-full xl:w-[356px] shrink-0">
          
          <div className="w-full p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10)]">
            <div className="w-full rounded-[27px] bg-[#050506] p-6">
              
              <div className="flex items-center gap-2 mb-6">
                 <img src="/logo-crypro-pulse.svg" alt="Logo" className="w-5 h-5" />
                 <span className="text-[14px] font-medium text-white/80">CryptoPulse</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-[20px] font-semibold text-white">Створити алерт</h3>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              </div>
              <p className="text-[13px] text-white/50 mb-6">Створи алерт і не пропускай важливі зміни</p>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[12px] text-white/60 mb-1 block">Умова</label>
                  <div className="relative">
                    <select className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white appearance-none outline-none focus:border-[#8348C1]">
                      <option>Ціна вище ніж</option>
                      <option>Ціна нижче ніж</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] text-white/60 mb-1 block">Значення</label>
                    <div className="relative">
                      <input type="text" defaultValue="70000" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white outline-none focus:border-[#8348C1]" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-white/40">USDT</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] text-white/60 mb-1 block">Період</label>
                    <div className="relative">
                      <select className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white appearance-none outline-none focus:border-[#8348C1]">
                        <option>1 год</option>
                        <option>4 год</option>
                        <option>1 день</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button className="w-full h-[48px] rounded-[28px] mt-4 font-montserrat font-medium text-[14px] text-white bg-gradient-to-r from-[#4A269C] to-[#9C65E8] hover:scale-[1.02] transition-transform">
                  Створити
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}