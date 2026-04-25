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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      ),
    },
    {
      title: "Падають сьогодні",
      value: "2",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      ),
    },
    {
      title: "Найкраща динаміка",
      value: "SOL +6.2%",
      icon: null,
      valueClass: "text-[22px] font-semibold text-white", // Більший текст для останнього блоку
    },
  ];

  // Дані для таблиці "Вибрані активи"
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
        <button className="mr-[40px] flex h-[42px] items-center justify-center rounded-full bg-gradient-to-r from-[#5B21B6] to-[#8B5CF6] px-6 text-[13px] font-medium text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all hover:scale-105">
          Підключити Telegram
        </button>
      </div>

      {/* 2. Блок статистики (4 картки) */}
      <div className=" ml-[40px] mr-[40px] grid grid-cols-1 gap-[24px] lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            // Висота 108, радіус 28, і градієнт бордера точно з Фігми
            className="h-[108px] w-full rounded-[28px] bg-gradient-to-br from-[#522F8B] to-[#FFFFFFE5] p-[1px]"
          >
            <div className="flex h-full w-full flex-col items-center justify-center rounded-[28px] bg-[#050508]">
              <p className="mb-1.5 text-[12px] font-medium text-white/50">{stat.title}</p>
              <div className="flex items-center gap-2">
                <span className={stat.valueClass || "text-[22px] font-semibold text-white"}>
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
        
        {/* ЛІВА КОЛОНКА: Займає рівно 3 колонки (75% мінус частина відступу 24px) */}
        <div className="flex w-full flex-col lg:w-[calc(75%-6px)]">
          <h2 className="mb-[24px] text-[20px] font-semibold leading-none text-white/95">
            Вибрані активи
          </h2>
          
          <div className="w-full rounded-[28px] bg-gradient-to-br from-[#522F8B] to-[#FFFFFFE5] p-[1px]">
            {/* Змінили p-6 на pb-6, щоб фон шапки міг торкатися країв */}
            <div className="w-full overflow-hidden rounded-[28px] bg-[#050506] pb-6">
              
              <table className="w-full whitespace-nowrap text-left border-collapse">
                <thead className="bg-gradient-to-r from-[#210131]/80 to-transparent">
                  <tr className="border-b border-[#FFFFFFE5]/20 text-[13px] font-medium text-[#FFFFFFE5]">
                    {/* Додали pl-6 */}
                    <th className="py-5 pl-6 w-[18%]">Монета</th>
                    <th className="py-5 w-[15%]">Ціна</th>
                    <th className="py-5 w-[15%]">24год</th>
                    <th className="py-5 w-[22%]">Ринкова<br />капіталізація</th>
                    <th className="py-5 w-[18%]">Обсяг</th>
                    {/* Додали pr-6 */}
                    <th className="py-5 pr-6 w-[12%] text-left">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {favoriteAssets.map((asset, index) => {
                    const isPositive = asset.change.startsWith('+');
                    return (
                      
                      <React.Fragment key={asset.symbol}>
                        <tr key={asset.symbol} className="text-[14px] text-white/90 transition-colors hover:bg-white/[0.02]">
                        {/* Сюди додали pl-6 */}
                        <td className="py-[14px] pl-6">
                          <div className="flex items-center gap-3">
                            {/* Збільшив іконку до 32px, бо на макеті вона масивніша */}
                            <div className={`flex h-[32px] w-[32px] items-center justify-center rounded-full ${asset.color} text-[12px] font-bold text-white shadow-sm`}>
                              {asset.symbol.charAt(0)}
                            </div>
                            <span className="font-bold">{asset.symbol}</span>
                          </div>
                        </td>
                        <td className="py-[14px]">{asset.price}</td>
                        <td className={`py-[14px] font-medium ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {asset.change}
                        </td>
                        {/* Сірий текст для капіталізації та обсягу */}
                        <td className="py-[14px] text-[#FFFFFFE5]">{asset.marketCap}</td>
                        <td className="py-[14px] text-[#FFFFFFE5]">{asset.volume}</td>
                        
                      
                          {/* Кнопка: прибрав фіолетовий бордер, зробив білий/10, як на макеті */}
                        <td className="py-[14px] pr-6 text-center">
                          {/* Обгортка для градієнтного бордера */}
                          <div className="inline-flex h-[36px] items-center justify-center rounded-[28px] bg-gradient-to-r from-[#2C1959] via-[#6348C1] to-[#C388FF] p-[1px] transition-all hover:scale-105">
                            {/* Сама кнопка */}
                            <button className="flex h-full w-full items-center justify-center rounded-[28px] bg-[#050506] px-[14px] text-[12px] font-medium text-[#FFFFFFE5] transition-colors hover:text-white">
                              Переглянути
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Лінія під рядком */}
                      {index !== favoriteAssets.length - 1 && (
                        <tr>
                          <td colSpan={6} className="p-0">
                            {/* Додали w-[calc(100%-48px)] і mx-auto, щоб лінія мала по 24px відступу з боків */}
                            <div className="mx-auto h-[1px] w-[calc(100%-48px)] bg-gradient-to-r from-[#522F8B] to-[#FFFFFFE5]/10"></div>
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

        {/* ПРАВА КОЛОНКА: Займає рівно 1 колонку (25% мінус частина відступу 24px) */}
        <div className="flex w-full flex-col lg:w-[calc(25%-18px)]">
          <h2 className="mb-[24px] text-[20px] font-semibold leading-none text-white/95">
            Рекомендовано 
          </h2>
          
          {/* Забрали h-[453px], щоб блок підлаштовувався під контент */}
          <div className="w-full rounded-[28px] bg-gradient-to-br from-[#522E8B] to-[#FFFFFFE5] p-[1px]">
            {/* Змінили p-6 на py-2, а бокові відступи перенесли в самі елементи */}
            <div className="w-full rounded-[28px] bg-[#050506] py-2">
              <div className="flex flex-col">
                {recommendedAssets.map((asset, index) => (
                  <React.Fragment key={asset.symbol}>
                    {/* Додали px-6 для відступів, hover-ефект як у таблиці */}
                    <div className="flex items-center justify-between px-6 py-[14px] transition-colors hover:bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        {/* Збільшили іконку до 32px і шрифт до 14px, як зліва */}
                        <div className={`flex h-[32px] w-[32px] items-center justify-center rounded-full ${asset.color} text-[12px] font-bold text-white shadow-sm`}>
                          {asset.symbol.charAt(0)}
                        </div>
                        <span className="text-[14px] font-bold text-white/90">{asset.symbol}</span>
                      </div>
                      
                      {/* Кнопка "Додати" тепер у стилі кнопки "Переглянути" */}
                      <div className="inline-flex h-[36px] items-center justify-center rounded-[28px] bg-gradient-to-r from-[#2C1959] via-[#6348C1] to-[#C388FF] p-[1px] transition-all hover:scale-105">
                        {/* Сама кнопка */}
                        <button className="flex h-full w-full items-center justify-center rounded-[28px] bg-[#050506] px-[14px] text-[12px] font-medium text-[#FFFFFFE5] transition-colors hover:text-white">
                          Додати
                        </button>
                      </div>
                    </div>

                    {/* Та сама лінія-градієнт, що й зліва */}
                    {index !== recommendedAssets.length - 1 && (
                      <div className="mx-auto h-[1px] w-[calc(100%-48px)] bg-gradient-to-r from-[#522F8B] to-[#FFFFFFE5]/10"></div>
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