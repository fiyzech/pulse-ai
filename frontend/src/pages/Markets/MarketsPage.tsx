import { useState } from 'react';

// === ДАНІ (БЕЗ ЗМІН) ===
interface MarketItem {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  imgUrl: string;
}

const topCardsData: Record<string, MarketItem[]> = {
  popular: [
    { symbol: "BTC", price: "$68,420", change: "+2.4%", isPositive: true, imgUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.png" },
    { symbol: "ETH", price: "$3,260", change: "-1.2%", isPositive: false, imgUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
    { symbol: "SOL", price: "$188", change: "+6.2%", isPositive: true, imgUrl: "https://cryptologos.cc/logos/solana-sol-logo.png" },
  ],
  futures: [
    { symbol: "BNB", price: "$592.10", change: "+1.1%", isPositive: true, imgUrl: "https://cryptologos.cc/logos/bnb-bnb-logo.png" },
    { symbol: "ARB", price: "$1.45", change: "-3.4%", isPositive: false, imgUrl: "https://cryptologos.cc/logos/arbitrum-arb-logo.png" },
    { symbol: "AVAX", price: "$45.20", change: "+4.2%", isPositive: true, imgUrl: "https://cryptologos.cc/logos/avalanche-avax-logo.png" },
  ],
  new: [
    { symbol: "SUI", price: "$1.62", change: "+12.4%", isPositive: true, imgUrl: "https://cryptologos.cc/logos/sui-sui-logo.png" },
    { symbol: "PEPE", price: "$0.000008", change: "+5.1%", isPositive: true, imgUrl: "https://cryptologos.cc/logos/pepe-pepe-logo.png" },
    { symbol: "TIA", price: "$12.80", change: "-2.1%", isPositive: false, imgUrl: "https://cryptologos.cc/logos/celestia-tia-logo.png" },
  ]
};

const mockMarkets = [
  { id: 1, symbol: "BTC", price: "$68,420", change: "+2.4%", isPositive: true, cap: "$1.35T", vol: "$32.51B", imgUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.png" },
  { id: 2, symbol: "ETH", price: "$3,260", change: "-1.2%", isPositive: false, cap: "$395.80B", vol: "$20.97B", imgUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
  { id: 3, symbol: "SOL", price: "$188", change: "+6.2%", isPositive: true, cap: "$81.78B", vol: "$4.12B", imgUrl: "https://cryptologos.cc/logos/solana-sol-logo.png" },
  { id: 4, symbol: "XRP", price: "$0.63", change: "+1.8%", isPositive: true, cap: "$36.20B", vol: "$1.98B", imgUrl: "https://cryptologos.cc/logos/xrp-xrp-logo.png" },
  { id: 5, symbol: "DOGE", price: "$0.18", change: "-0.9%", isPositive: false, cap: "$25.66B", vol: "$1.42B", imgUrl: "https://cryptologos.cc/logos/dogecoin-doge-logo.png" },
  { id: 6, symbol: "ADA", price: "$0.71", change: "+3.1%", isPositive: true, cap: "$25.10B", vol: "$880M", imgUrl: "https://cryptologos.cc/logos/cardano-ada-logo.png" },
];

export default function MarketsPage() {
  const globalStyles = `
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

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
        <MarketStatsCard title="Популярні токени" items={topCardsData.popular} />
        <MarketStatsCard title="Найкращі ф’ючерси" items={topCardsData.futures} />
        <MarketStatsCard title="Найновіші" items={topCardsData.new} />
      </div>

      <div 
        style={{ width: '1116px', height: '512px' }}
        className="ml-10 p-[1px] rounded-[24px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] transition-all duration-500 ease-out hover:shadow-[0_20px_100px_rgba(131,72,193,0.3),0_8px_25px_rgba(0,0,0,0.4)]"
      >
        <div className="relative h-full rounded-[24px] bg-[#050506] overflow-hidden flex flex-col no-scrollbar">
          
          <div 
            style={{ height: '57px' }}
            className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_1fr] gap-4 px-8 text-[14px] text-[#A3A4B0] font-semibold items-center bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)]"
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

          <div className="flex-1 no-scrollbar overflow-y-auto">
            {mockMarkets.map((coin) => (
              <div key={coin.id} className="row-divider grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_1fr] gap-4 px-8 items-center h-[68px]">
                <div className="flex items-center gap-3">
                  <img src={coin.imgUrl} alt={coin.symbol} className="w-7 h-7 object-contain" />
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
            ))}
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
      className="p-[1px] rounded-[24px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] transition-all duration-500 ease-out hover:shadow-[0_20px_80px_rgba(131,72,193,0.4),0_8px_25px_rgba(0,0,0,0.5)] hover:-translate-y-1"
    >
      {/* 
         Нижче — точне налаштування відступів:
         pt-[24px] - верхній
         px-[24px] - бокові
         pb-[29px] - нижній
      */}
      <div className="relative h-full rounded-[23px] bg-[#050506] pt-[24px] px-[24px] pb-[29px] flex flex-col justify-between">
        
        {/* Відступ заголовка 24px */}
        <h3 className="text-[16px] font-medium text-[#FFFFFF] leading-none mb-[24px]">
          {title}
        </h3>
        
        {/* Відступи між валютами 22px */}
        <div className="flex flex-col gap-[22px]">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between h-[20px]">
              <div className="flex items-center gap-3">
                <img src={item.imgUrl} alt={item.symbol} className="w-6 h-6 object-contain" />
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