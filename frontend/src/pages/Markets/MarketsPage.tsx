import { useState } from 'react';

// === ТИПИ ТА ДАНІ (БЕЗ ЗМІН) ===
interface MarketItem {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  imgUrl: string;
}

interface MarketStatsCardProps {
  title: string;
  items: MarketItem[];
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
  `;

  return (
    <section className="w-full text-white font-['Montserrat'] bg-[#000000] min-h-screen pb-10">
      <style>{globalStyles}</style>
      
      <div style={{ width: '546px', height: '47px' }} className="mt-6 mb-10 ml-10 flex items-center">
        <p className="text-[#FFFFFF] text-[16px] leading-snug font-normal">
          Аналізуйте ринкові показники в реальному часі, зміни цін та додавайте активи до обраних для зручного контролю
        </p>
      </div>

      <div className="flex gap-6 mb-10 px-10">
        <MarketStatsCard title="Популярні токени" items={topCardsData.popular} />
        <MarketStatsCard title="Найкращі ф’ючерси" items={topCardsData.futures} />
        <MarketStatsCard title="Найновіші" items={topCardsData.new} />
      </div>

      {/* Нижня картка */}
      <div 
        style={{ width: '1116px' }}
        className="ml-10 p-[1px] rounded-[24px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]"
      >
        <div className="relative h-full rounded-[24px] bg-[#050506] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col no-scrollbar">
          
          <div 
            style={{ minHeight: '57px' }}
            className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_1fr] gap-4 px-8 border-b border-white/5 text-[14px] text-[#A3A4B0] font-semibold items-center bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)]"
          >
            <div>Монета</div>
            <div>Ціна</div>
            <div>24год</div>
            <div className="max-w-[120px] leading-tight">Ринкова капіталізація</div>
            <div>Обсяг</div>
            <div className="text-left mr-[-40px]">Дії</div>
          </div>

          <div className="flex-1 no-scrollbar pt-2 pb-6">
            {mockMarkets.map((coin) => (
              <div key={coin.id} className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_1fr] gap-4 px-8 items-center h-[52px] group">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 flex items-center justify-center overflow-hidden">
                    <img src={coin.imgUrl} alt={coin.symbol} className="w-full h-full object-contain" />
                  </div>
                  <span className="font-semibold text-[15px]">{coin.symbol}</span>
                </div>
                <div className="text-[15px] font-medium text-[#FFFFFF]">{coin.price}</div>
                <div className={`text-[15px] font-medium ${coin.isPositive ? 'text-[#36D399]' : 'text-[#F87272]'}`}>
                  {coin.change}
                </div>
                <div className="text-[15px] text-[#FFFFFF]">{coin.cap}</div>
                <div className="text-[15px] text-[#FFFFFF]">{coin.vol}</div>
                <div className="flex justify-start mr-[-40px]">
                  <button className="relative p-[1px] rounded-full transition-all hover:brightness-110 active:scale-95"
                    style={{ background: 'linear-gradient(90deg, #4C2475 0%, #7A40B5 50%, #B57AFF 100%)' }}
                  >
                    <div className="px-6 py-2 rounded-full bg-[#000000] flex items-center justify-center">
                      <span className="text-[14px] text-[#A3A4B0] font-normal">Переглянути</span>
                    </div>
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

function MarketStatsCard({ title, items }: MarketStatsCardProps) {
  return (
    <div 
      style={{ width: '356px', height: '199px' }} 
      className="p-[1px] rounded-[24px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]"
    >
      <div className="relative h-full rounded-[24px] bg-[#050506] p-6 shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col no-scrollbar">
        <h3 className="text-[16px] font-medium mb-[20px] text-[#FFFFFF]">{title}</h3>
        <div className="flex flex-col gap-[12px] pb-[24px]">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 flex items-center justify-center overflow-hidden">
                   <img src={item.imgUrl} alt={item.symbol} className="w-full h-full object-contain" />
                </div>
                <span className="text-[14px] font-semibold text-white">{item.symbol}</span>
              </div>
              <div className="flex gap-4 items-center">
                <span className="text-[14px] text-[#FFFFFF]">{item.price}</span>
                <span className={`text-[13px] w-12 text-right font-medium ${item.isPositive ? 'text-[#36D399]' : 'text-[#F87272]'}`}>
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