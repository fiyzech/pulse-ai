interface MarketItem {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  iconBg: string;
}

interface MarketStatsCardProps {
  title: string;
  items: MarketItem[];
}

const topCardsData: Record<string, MarketItem[]> = {
  popular: [
    { symbol: "BTC", price: "$68,420", change: "+2.4%", isPositive: true, iconBg: "bg-[#F7931A]" },
    { symbol: "ETH", price: "$3,260", change: "-1.2%", isPositive: false, iconBg: "bg-[#627EEA]" },
    { symbol: "SOL", price: "$188", change: "+6.2%", isPositive: true, iconBg: "bg-[#14F195]" },
  ],
  futures: [
    { symbol: "BTC", price: "$68,420", change: "+2.4%", isPositive: true, iconBg: "bg-[#F7931A]" },
    { symbol: "ETH", price: "$3,260", change: "-1.2%", isPositive: false, iconBg: "bg-[#627EEA]" },
    { symbol: "SOL", price: "$188", change: "+6.2%", isPositive: true, iconBg: "bg-[#14F195]" },
  ],
  new: [
    { symbol: "BTC", price: "$68,420", change: "+2.4%", isPositive: true, iconBg: "bg-[#F7931A]" },
    { symbol: "ETH", price: "$3,260", change: "-1.2%", isPositive: false, iconBg: "bg-[#627EEA]" },
    { symbol: "SOL", price: "$188", change: "+6.2%", isPositive: true, iconBg: "bg-[#14F195]" },
  ]
};

interface MarketData {
  id: number;
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  cap: string;
  vol: string;
  color: string;
}

const mockMarkets: MarketData[] = [
  { id: 1, symbol: "BTC", price: "$68,420", change: "+2.4%", isPositive: true, cap: "$1.35T", vol: "$32.51B", color: "bg-[#F7931A]" },
  { id: 2, symbol: "ETH", price: "$3,260", change: "-1.2%", isPositive: false, cap: "$395.80B", vol: "$20.97B", color: "bg-[#627EEA]" },
  { id: 3, symbol: "SOL", price: "$188", change: "+6.2%", isPositive: true, cap: "$81.78B", vol: "$4.12B", color: "bg-[#14F195]" },
  { id: 4, symbol: "XRP", price: "$0.63", change: "+1.8%", isPositive: true, cap: "$36.20B", vol: "$1.98B", color: "bg-[#23292F]" },
  { id: 5, symbol: "DOGE", price: "$0.18", change: "-0.9%", isPositive: false, cap: "$25.66B", vol: "$1.42B", color: "bg-[#C2A633]" },
  { id: 6, symbol: "ADA", price: "$0.71", change: "+3.1%", isPositive: true, cap: "$25.10B", vol: "$880M", color: "bg-[#0033AD]" },
];

export default function MarketsPage() {
  return (
    <section className="px-10 py-6 w-full text-white font-['Montserrat'] bg-[#020203]">
      
      <p className="text-[#A3A4B0] text-[15px] mb-8 max-w-2xl leading-relaxed">
        Аналізуйте ринкові показники в реальному часі, зміни цін та додавайте активи до обраних для зручного контролю
      </p>

      {/* Верхні картки */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <MarketStatsCard title="Популярні токени" items={topCardsData.popular} />
        <MarketStatsCard title="Найкращі ф’ючерси" items={topCardsData.futures} />
        <MarketStatsCard title="Найновіші" items={topCardsData.new} />
      </div>

      {/* Основна таблиця */}
      <div className="relative p-[1px] rounded-[24px] bg-gradient-to-r from-transparent via-white/10 to-white/25">
        <div className="bg-[#08080c] rounded-[23px] overflow-hidden">
          
          {/* Header таблиці: Налаштовано перенос "Ринкова капіталізація" */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_1fr] gap-4 px-8 py-5 border-b border-white/5 text-[14px] text-[#A3A4B0] bg-gradient-to-r from-[#1A0C2A] via-[#10081A] to-[#08080c] items-center">
            <div>Монета</div>
            <div>Ціна</div>
            <div>24h</div>
            <div className="max-w-[120px] leading-tight">Ринкова капіталізація</div>
            <div>Обсяг</div>
            <div className="text-left ml-[-30px]">Дії</div>
          </div>

          <div className="divide-y divide-white/5">
            {mockMarkets.map((coin) => (
              <div key={coin.id} className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_1fr] gap-4 px-8 py-6 items-center hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full ${coin.color} flex items-center justify-center text-[12px] font-bold text-white`}>
                    {coin.symbol === "BTC" ? "₿" : coin.symbol === "ETH" ? "♦" : coin.symbol[0]}
                  </div>
                  <span className="font-semibold text-[15px]">{coin.symbol}</span>
                </div>

                <div className="text-[15px] font-medium text-white/90">{coin.price}</div>

                <div className={`text-[15px] font-medium ${coin.isPositive ? 'text-[#36D399]' : 'text-[#F87272]'}`}>
                  {coin.change}
                </div>

                <div className="text-[15px] text-[#A3A4B0]">{coin.cap}</div>
                <div className="text-[15px] text-[#A3A4B0]">{coin.vol}</div>

                <div className="flex justify-start ml-[-30px]">
                  <button className="relative p-[1px] rounded-full bg-gradient-to-r from-[#4C2475] via-[#7A40B5] to-[#B57AFF] transition-all hover:brightness-125 active:scale-95">
                    <div className="px-6 py-2 rounded-full bg-[#08080c] flex items-center justify-center">
                      <span className="text-[13px] text-white/90 font-medium">Переглянути</span>
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
    <div className="relative p-[1px] rounded-[24px] bg-gradient-to-r from-transparent via-white/10 to-white/25 h-full">
      <div className="bg-[#08080c] rounded-[23px] p-6 h-full">
        <h3 className="text-[16px] font-medium mb-5 text-white/90">{title}</h3>
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-7 w-7 rounded-full ${item.iconBg} flex items-center justify-center text-[12px] font-bold text-white shadow-sm`}>
                  {item.symbol === "BTC" ? "₿" : item.symbol === "ETH" ? "♦" : "●"}
                </div>
                <span className="text-[14px] font-medium">{item.symbol}</span>
              </div>
              <div className="flex gap-4 items-center">
                <span className="text-[14px] text-[#A3A4B0]">{item.price}</span>
                <span className={`text-[13px] w-12 text-right ${item.isPositive ? 'text-[#36D399]' : 'text-[#F87272]'}`}>
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