import { useState, useEffect } from 'react';

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

// ID тільки для верхніх карток
const topCardsIds: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana',
  BNB: 'binancecoin', ARB: 'arbitrum', AVAX: 'avalanche-2',
  SUI: 'sui', PEPE: 'pepe', TIA: 'celestia'
};

export default function MarketsPage() {
  const [liveTopData, setLiveTopData] = useState<Record<string, { price: number; change: number }>>({});
  const [tableMarkets, setTableMarkets] = useState<TableMarketItem[]>([]);

  // Хелпери для форматування
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
    const fetchAllData = async () => {
      try {
        // 1. Отримуємо дані для верхніх карток
        const ids = Object.values(topCardsIds).join(',');
        const topRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
        if (topRes.ok) {
          const topData = await topRes.json();
          const parsedTop: Record<string, { price: number; change: number }> = {};
          Object.entries(topCardsIds).forEach(([symbol, id]) => {
            if (topData[id]) {
              parsedTop[symbol] = { price: topData[id].usd, change: topData[id].usd_24h_change };
            }
          });
          setLiveTopData(parsedTop);
        }

        // 2. Отримуємо 125 монет для таблиці
        const marketsRes = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=125&page=1&sparkline=false');
        if (marketsRes.ok) {
          const marketsData = await marketsRes.json();
          const formattedTable = marketsData.map((coin: any) => ({
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            price: formatPrice(coin.current_price),
            change: formatChange(coin.price_change_percentage_24h),
            isPositive: coin.price_change_percentage_24h > 0,
            cap: formatCompactNumber(coin.market_cap),
            vol: formatCompactNumber(coin.total_volume),
            imgUrl: coin.image 
          }));
          setTableMarkets(formattedTable);
        }
      } catch (error) {
        console.error('Помилка завантаження даних:', error);
      }
    };

    fetchAllData();
    
    // Оновлення кожні 2 хвилини
    const intervalId = setInterval(fetchAllData, 120000); 
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
      -webkit-mask: 
         linear-gradient(#fff 0 0) content-box, 
         linear-gradient(#fff 0 0);
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

          <div className="flex flex-col pb-4">
            {tableMarkets.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-[#A3A4B0] text-[15px]">
                Завантаження криптовалют...
              </div>
            ) : (
              tableMarkets.map((coin) => (
                <div 
                  key={coin.id} 
                  // ОСЬ ТУТ МАГІЯ: додав hover:bg-[rgba(82,46,139,0.15)] та transition-colors duration-300
className="row-divider grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_1fr] gap-4 px-8 items-center h-[68px] min-h-[68px] bg-transparent hover:bg-white/5 transition-colors duration-300 ease-in-out cursor-default"                >
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
                    <button className="action-button">
                      <span className="text-[14px] font-medium text-[#FFFFFF] whitespace-nowrap font-['Montserrat']">
                        Переглянути
                      </span>
                    </button>
                  </div>
                </div>
              ))
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