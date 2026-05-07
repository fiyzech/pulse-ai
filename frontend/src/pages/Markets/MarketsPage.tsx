import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

export default function MarketsPage() {
  const navigate = useNavigate();

  const [liveTopData, setLiveTopData] = useState<Record<string, { price: number; change: number }>>({});
  const [allTableMarkets, setAllTableMarkets] = useState<TableMarketItem[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(30); 
  const [apiError, setApiError] = useState<string | null>(null);

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

        if (cachedTopData && cachedTopTime && Date.now() - Number(cachedTopTime) < 60000) {
          setLiveTopData(JSON.parse(cachedTopData));
          return; 
        }

        const topIds = Object.values(topCardsIds).join(',');
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${topIds}&vs_currencies=usd&include_24hr_change=true`);
        
        if (res.status === 429) return;

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

        if (cachedTableData && cachedTableTime && Date.now() - Number(cachedTableTime) < 120000) {
          setAllTableMarkets(JSON.parse(cachedTableData));
          return; 
        }

        const [binanceRes, cgRes] = await Promise.all([
          fetch('https://api.binance.com/api/v3/ticker/price'),
          fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false')
        ]);

        if (cgRes.status === 429) {
          setApiError("Забагато запитів. Зачекайте хвилинку...");
          return;
        }

        if (binanceRes.ok && cgRes.ok) {
          const binanceData = await binanceRes.json();
          const cgData = await cgRes.json();

          const validBinancePairs = new Set(
            binanceData
              .filter((item: any) => item.symbol.endsWith('USDT'))
              .map((item: any) => item.symbol)
          );

          const ignoredStablecoins = ['USDT', 'USDC', 'DAI', 'FDUSD', 'TUSD', 'USDD', 'USDS'];

          const validBinanceCoins = cgData.filter((coin: any) => {
            const symbolUpper = coin.symbol.toUpperCase();
            if (ignoredStablecoins.includes(symbolUpper)) return false;
            return validBinancePairs.has(`${symbolUpper}USDT`);
          });

          const final125Coins = validBinanceCoins.slice(0, 125);

          const formattedTable = final125Coins.map((coin: any) => ({
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            price: formatPrice(coin.current_price),
            change: formatChange(coin.price_change_percentage_24h),
            isPositive: coin.price_change_percentage_24h > 0,
            cap: formatCompactNumber(coin.market_cap),
            vol: formatCompactNumber(coin.total_volume),
            imgUrl: coin.image,
            // ПАКУЄМО СИРІ ДАНІ ДЛЯ АКТИВУ (ЦЕ ВАЖЛИВО ДЛЯ ЕФІРУ!)
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
        <p className="text-[#FFFFFF] text-[16px] leading-snug font-normal">
          Аналізуйте ринкові показники в реальному часі, зміни цін та додавайте активи до обраних для зручного контролю
        </p>
      </div>

      <div className="flex gap-[24px] mb-[26px] px-10">
        <MarketStatsCard title="Популярні токени" items={currentPopular} />
        <MarketStatsCard title="Найкращі ф’ючерси" items={currentFutures} />
        <MarketStatsCard title="Найновіші" items={currentNew} />
      </div>

      <div 
        style={{ width: '1116px' }}
        className="ml-10 p-[1px] rounded-[24px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] transition-all duration-500 ease-out hover:shadow-[0_20px_100px_rgba(131,72,193,0.3),0_8px_25px_rgba(0,0,0,0.4)]"
      >
        <div className="relative rounded-[24px] bg-[#050506] flex flex-col overflow-hidden">
          
          <div 
            style={{ height: '57px' }}
            className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_1fr] gap-4 px-8 text-[14px] text-[#A3A4B0] font-semibold items-center bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)] min-h-[57px] rounded-t-[24px]"
          >
            <div>Монета</div>
            <div>Ціна</div>
            <div>24год</div>
            <div className="flex flex-col leading-tight">
              <span>Ринкова</span>
              <span>капіталізація</span>
            </div>
            <div>Обсяг</div>
            <div className="pl-4">Дії</div>
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
              visibleTableMarkets.map((coin) => (
                <div 
                  key={coin.id} 
                  className="row-divider grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_1fr] gap-4 px-8 items-center h-[68px] min-h-[68px] bg-transparent hover:bg-white/5 transition-colors duration-300 ease-in-out cursor-default"                
                >
                  <div className="flex items-center gap-3">
                    <img src={coin.imgUrl} alt={coin.symbol} className="w-7 h-7 object-contain rounded-full" />
                    <span className="font-semibold text-[15px]">{coin.symbol}</span>
                  </div>
                  <div className="text-[15px] text-[#FFFFFF]">{coin.price}</div>
                  <div className={`text-[15px] font-medium ${coin.isPositive ? 'text-[#36D399]' : 'text-[#F87272]'}`}>
                    {coin.change}
                  </div>
                  <div className="text-[15px] text-[#FFFFFF]">{coin.cap}</div>
                  <div className="text-[15px] text-[#FFFFFF]">{coin.vol}</div>
                  
                  <div className="flex items-center">
                    <button 
                      className="action-button"
                      onClick={() => handleViewClick(coin)} 
                    >
                      <span className="text-[14px] font-medium text-[#FFFFFF] whitespace-nowrap font-['Montserrat']">
                        Переглянути
                      </span>
                    </button>
                  </div>
                </div>
              ))
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
      style={{ width: '356px', height: '199px' }} 
      className="p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] transition-all duration-500 ease-out hover:shadow-[0_20px_80px_rgba(131,72,193,0.4),0_8px_25px_rgba(0,0,0,0.5)] hover:-translate-y-1"
    >
      <div className="relative h-full rounded-[28px] bg-[#050506] pt-[24px] px-[24px] pb-[29px] flex flex-col justify-between">
        <h3 className="text-[16px] font-medium text-[#FFFFFF] leading-none mb-[24px]">
          {title}
        </h3>
        
        <div className="flex flex-col gap-[22px]">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between h-[20px]">
              <div className="flex items-center gap-3">
                <img src={item.imgUrl} alt={item.symbol} className="w-6 h-6 object-contain rounded-full" />
                <span className="text-[14px] font-semibold text-white leading-none">{item.symbol}</span>
              </div>
              <div className="flex gap-4 items-center">
                <span className="text-[14px] text-[#FFFFFF] font-medium leading-none">{item.price}</span>
                <span className={`text-[13px] w-[50px] text-right font-medium leading-none ${item.isPositive ? 'text-[#36D399]' : 'text-[#F87272]'}`}>
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