import React from "react"

export default function FavoritesContent() {
  // Дані для блоку статистики
  const stats = [
    {
      title: "Усього в обраному",
      value: "6",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      ),
    },
    {
      title: "Зростають сьогодні",
      value: "4",
      icon: (
        // Замінив колір на #36D399
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#36D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      ),
    },
    {
      title: "Падають сьогодні",
      value: "2",
      icon: (
        // Замінив колір на #F87272
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87272" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      ),
    },
    {
      title: "Найкраща динаміка",
      value: "SOL +6.2%",
      icon: null,
      valueClass: "text-[22px] font-semibold text-[#36D399]", // Стиль успішного тексту
    },
  ];

  // Дані для таблиці "Вибрані активи."
  const favoriteAssets = [
    { name: "Bitcoin", symbol: "BTC", price: "$68,420", change: "+2.4%", marketCap: "$1.35T", volume: "$32.51B", color: "bg-[#F7931A]" },
    { name: "Ethereum", symbol: "ETH", price: "$3,260", change: "-1.2%", marketCap: "$395.80B", volume: "$20.97B", color: "bg-[#627EEA]" },
    { name: "Solana", symbol: "SOL", price: "$188", change: "+6.2%", marketCap: "$81.78B", volume: "$4.12B", color: "bg-[#14F195]" },
    { name: "XRP", symbol: "XRP", price: "$0.63", change: "+1.8%", marketCap: "$36.20B", volume: "$1.98B", color: "bg-[#23292F]" },
    { name: "Dogecoin", symbol: "DOGE", price: "$0.18", change: "-0.9%", marketCap: "$25.66B", volume: "$1.42B", color: "bg-[#F3C623]" },
    { name: "Cardano", symbol: "ADA", price: "$0.71", change: "+3.1%", marketCap: "$25.10B", volume: "$880M", color: "bg-[#0033AD]" },
  ];

  // Дані для списку "Рекомендовано"
  const recommendedAssets = [
    { symbol: "XRP", color: "bg-[#23292F]" },
    { symbol: "DOGE", color: "bg-[#F3C623]" },
    { symbol: "ADA", color: "bg-[#0033AD]" },
    { symbol: "TON", color: "bg-[#0098EA]" },
    { symbol: "BNB", color: "bg-[#F3BA2F]" },
    { symbol: "AVAX", color: "bg-[#E84142]" },
  ];

  return (
    <div className="w-full font-montserrat">
      
      {/* 1. Верхній блок (Опис + Кнопка Telegram) */}
      <div className="mb-6 flex items-start justify-between mt-[23px]">
        <p className="w-[546px] pl-[40px] font-montserrat text-[16px] font-normal leading-[28px] text-[#FFFFFF]">
          Зберігайте криптовалюти в обране, щоб швидко відстежувати ціни, зміни ринку та створювати алерти
        </p>
        <button className="mr-[40px] flex h-[44px] w-[208px] items-center justify-center rounded-[28px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-[13px] font-medium text-white transition-all hover:brightness-110 active:scale-95">
          Підключити Telegram
        </button>
      </div>

      {/* 2. Блок статистики (4 картки) */}
      <div className=" ml-[40px] mr-[40px] grid grid-cols-1 gap-[24px] lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            className="h-[108px] w-full p-[1px] rounded-[24px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]"
          >
            <div className="flex h-full w-full flex-col items-center justify-center rounded-[24px] bg-[#050506] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
              <p className="mb-1.5 text-[12px] font-medium text-[#A3A4B0]">{stat.title}</p>
              <div className="flex items-center gap-2">
                <span className={stat.valueClass || "text-[22px] font-semibold text-[#FFFFFF]"}>
                  {stat.value}
                </span>
                {stat.icon && <span>{stat.icon}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Головний контент (Таблиця + Рекомендації) */}
      <div className="ml-[40px] mr-[40px] mt-[26px] flex flex-col lg:flex-row gap-[24px]">
        
        {/* ЛІВА КОЛОНКА */}
        <div className="flex w-full flex-col lg:w-[calc(75%-6px)]">
          <h2 className="mb-[24px] text-[20px] font-semibold leading-none text-white/95">
            Вибрані активи
          </h2>
          
          <div className="w-full p-[1px] rounded-[24px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
            <div className="w-full overflow-hidden rounded-[24px] bg-[#050506] pb-6 shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
              
              <table className="w-full whitespace-nowrap text-left border-collapse">
                <thead className="bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)]">
                  <tr className="border-b border-white/5 text-[14px] font-semibold text-[#A3A4B0]">
                    <th className="py-5 pl-6 w-[18%]">Монета</th>
                    <th className="py-5 w-[15%]">Ціна</th>
                    <th className="py-5 w-[15%]">24год</th>
                    <th className="py-5 w-[22%]">Ринкова капіталізація</th>
                    <th className="py-5 w-[18%]">Обсяг</th>
                    <th className="py-5 pr-6 w-[12%] text-left">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {favoriteAssets.map((asset, index) => {
                    const isPositive = asset.change.startsWith('+');
                    return (
                      <React.Fragment key={asset.symbol}>
                        <tr className="text-[15px] font-medium text-[#FFFFFF] transition-colors hover:bg-white/[0.02]">
                          <td className="py-[14px] pl-6">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-[32px] w-[32px] items-center justify-center rounded-full ${asset.color} text-[12px] font-bold text-white shadow-sm`}>
                                {asset.symbol.charAt(0)}
                              </div>
                              <span className="font-semibold">{asset.symbol}</span>
                            </div>
                          </td>
                          <td className="py-[14px]">{asset.price}</td>
                          <td className={`py-[14px] ${isPositive ? 'text-[#36D399]' : 'text-[#F87272]'}`}>
                            {asset.change}
                          </td>
                          <td className="py-[14px]">{asset.marketCap}</td>
                          <td className="py-[14px]">{asset.volume}</td>
                          <td className="py-[14px] pr-6 text-center">
                            <div className="inline-flex h-[36px] items-center justify-center rounded-full bg-[linear-gradient(90deg,#4C2475_0%,#7A40B5_50%,#B57AFF_100%)] p-[1px] transition-all hover:scale-105 active:scale-95">
                              <button 
                              className="relative p-[1px] rounded-full transition-all hover:brightness-110 active:scale-95"
                              style={{ background: 'linear-gradient(90deg, #4C2475 0%, #7A40B5 50%, #B57AFF 100%)' }}
                            >
                              <div className="px-6 py-2 rounded-full bg-[#000000] flex items-center justify-center">
                                <span className="text-[14px] text-[#A3A4B0] font-normal">Переглянути</span>
                              </div>
                            </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Лінія під рядком */}
                        {index !== favoriteAssets.length - 1 && (
                          <tr>
                            <td colSpan={6} className="p-0">
                              <div className="mx-auto h-[1px] w-[calc(100%-48px)] bg-white/5"></div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>

            </div>
          </div>
        </div>

        {/* ПРАВА КОЛОНКА */}
        <div className="flex w-full flex-col lg:w-[calc(25%-18px)]">
          <h2 className="mb-[24px] text-[20px] font-semibold leading-none text-white/95">
            Рекомендовано 
          </h2>
          
          <div className="w-full p-[1px] rounded-[24px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
            <div className="w-full rounded-[24px] bg-[#050506] py-2 shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
              <div className="flex flex-col">
                {recommendedAssets.map((asset, index) => (
                  <React.Fragment key={asset.symbol}>
                    <div className="flex items-center justify-between px-6 py-[14px] transition-colors hover:bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-[32px] w-[32px] items-center justify-center rounded-full ${asset.color} text-[12px] font-bold text-white shadow-sm`}>
                          {asset.symbol.charAt(0)}
                        </div>
                        <span className="text-[15px] font-semibold text-[#FFFFFF]">{asset.symbol}</span>
                      </div>
                      
                      {/* === ОНОВЛЕНА КНОПКА "ДОДАТИ" === */}
                      <button 
                        className="relative p-[1px] rounded-full transition-all hover:brightness-110 active:scale-95"
                        style={{ background: 'linear-gradient(90deg, #4C2475 0%, #7A40B5 50%, #B57AFF 100%)' }}
                      >
                        <div className="px-6 py-2 rounded-full bg-[#000000] flex items-center justify-center">
                          <span className="text-[14px] text-[#A3A4B0] font-normal transition-colors hover:text-white">Додати</span>
                        </div>
                      </button>
                      {/* ================================= */}

                    </div>

                    {index !== recommendedAssets.length - 1 && (
                      <div className="mx-auto h-[1px] w-[calc(100%-48px)] bg-white/5"></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}