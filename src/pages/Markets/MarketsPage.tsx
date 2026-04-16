import { useState } from "react";

// Мокові дані для ринку
const mockMarkets = [
  { id: 1, name: "Bitcoin", symbol: "BTC", price: "€64,230.50", change: "+2.45%", isPositive: true, cap: "€1.2T", vol: "€32B", icon: "₿" },
  { id: 2, name: "Ethereum", symbol: "ETH", price: "€3,450.20", change: "+1.12%", isPositive: true, cap: "€410B", vol: "€15B", icon: "⧫" },
  { id: 3, name: "Solana", symbol: "SOL", price: "€145.80", change: "-4.20%", isPositive: false, cap: "€65B", vol: "€4B", icon: "◎" },
  { id: 4, name: "Binance Coin", symbol: "BNB", price: "€580.00", change: "+0.50%", isPositive: true, cap: "€89B", vol: "€1.2B", icon: "BNB" },
  { id: 5, name: "Cardano", symbol: "ADA", price: "€0.45", change: "-1.80%", isPositive: false, cap: "€16B", vol: "€400M", icon: "₳" },
  { id: 6, name: "Ripple", symbol: "XRP", price: "€0.58", change: "+0.10%", isPositive: true, cap: "€31B", vol: "€900M", icon: "✕" },
];

export default function MarketsPage() {
  const [activeTab, setActiveTab] = useState("All");

  return (
    <section className="px-10 py-8 max-w-[1600px] mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[28px] font-semibold text-white/95">
          Ринок криптовалют
        </h2>
        
        {/* Фільтри */}
        <div className="flex bg-[#0A0A0F] rounded-xl border border-white/5 p-1">
          {["All", "Gainers", "Losers", "Favorites"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-[14px] font-medium transition-all ${
                activeTab === tab 
                  ? "bg-white/10 text-white shadow-sm" 
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Таблиця ринку */}
      <div className="rounded-[24px] border border-white/5 bg-[#0A0A0F] overflow-hidden">
        {/* Заголовок таблиці */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-8 py-5 border-b border-white/5 text-[13px] font-medium text-white/40 uppercase tracking-wider">
          <div>Актив</div>
          <div className="text-right">Ціна</div>
          <div className="text-right">24h Зміна</div>
          <div className="text-right">Капіталізація</div>
          <div className="text-right">Об'єм (24h)</div>
          <div className="w-10"></div>
        </div>

        {/* Список активів */}
        <div className="divide-y divide-white/5">
          {mockMarkets.map((coin) => (
            <div key={coin.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-8 py-5 items-center hover:bg-white/[0.02] transition-colors group cursor-pointer">
              
              {/* Назва та іконка */}
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white font-bold">
                  {coin.icon}
                </div>
                <div>
                  <div className="text-[15px] font-medium text-white/95">{coin.name}</div>
                  <div className="text-[13px] text-white/40">{coin.symbol}</div>
                </div>
              </div>

              {/* Ціна */}
              <div className="text-right text-[15px] font-medium text-white/90">
                {coin.price}
              </div>

              {/* Зміна */}
              <div className={`text-right text-[14px] font-medium ${coin.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {coin.change}
              </div>

              {/* Капа та Об'єм */}
              <div className="text-right text-[14px] text-white/60">{coin.cap}</div>
              <div className="text-right text-[14px] text-white/60">{coin.vol}</div>

              {/* Кнопка дій */}
              <div className="text-right w-10 flex justify-end">
                <button className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all opacity-0 group-hover:opacity-100">
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}