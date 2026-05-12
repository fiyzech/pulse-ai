import React from "react";

import bookmarkPlusIcon from "../../assets/icons/bookmark-plus.svg";
import arrowUpOutlineIcon from "../../assets/icons/arrow-up-outline.svg";
import arrowDownOutlineIcon from "../../assets/icons/arrow-down-outline.svg";
import trashIcon from "../../assets/icons/trash.svg";
import eyeIcon from "../../assets/icons/eye.svg";

const tableGrid =
  "grid grid-cols-[1.2fr_0.9fr_0.85fr_1fr_0.75fr_88px]";

export default function FavoritesContent() {
  const stats = [
    {
      title: "Усього в обраному",
      value: "6",
      icon: bookmarkPlusIcon,
    },
    {
      title: "Зростають сьогодні",
      value: "4",
      icon: arrowUpOutlineIcon,
    },
    {
      title: "Падають сьогодні",
      value: "2",
      icon: arrowDownOutlineIcon,
    },
    {
      title: "Найкраща динаміка",
      value: "SOL +6.2%",
      icon: null,
      valueClass: "text-[30px] leading-none font-normal text-white",
    },
  ];

  const favoriteAssets = [
    {
      symbol: "BTC",
      price: "$68,420",
      change: "+2.4%",
      marketCap: "$1.35T",
      volume: "$32.51B",
      color: "bg-[#F7931A]",
    },
    {
      symbol: "ETH",
      price: "$3,260",
      change: "-1.2%",
      marketCap: "$395.80B",
      volume: "$20.97B",
      color: "bg-[#627EEA]",
    },
    {
      symbol: "SOL",
      price: "$188",
      change: "+6.2%",
      marketCap: "$81.78B",
      volume: "$4.12B",
      color: "bg-[#14F195]",
    },
    {
      symbol: "XRP",
      price: "$0.63",
      change: "+1.8%",
      marketCap: "$36.20B",
      volume: "$1.98B",
      color: "bg-[#23292F]",
    },
    {
      symbol: "DOGE",
      price: "$0.18",
      change: "-0.9%",
      marketCap: "$25.66B",
      volume: "$1.42B",
      color: "bg-[#F3C623]",
    },
    {
      symbol: "ADA",
      price: "$0.71",
      change: "+3.1%",
      marketCap: "$25.10B",
      volume: "$880M",
      color: "bg-[#0033AD]",
    },
  ];

  const recommendedAssets = [
    { symbol: "XRP", color: "bg-[#23292F]" },
    { symbol: "DOGE", color: "bg-[#F3C623]" },
    { symbol: "ADA", color: "bg-[#0033AD]" },
    { symbol: "TON", color: "bg-[#0098EA]" },
    { symbol: "BNB", color: "bg-[#F3BA2F]" },
    { symbol: "AVAX", color: "bg-[#E84142]" },
  ];

  return (
    <div className="w-full px-[40px] pt-[24px] pb-8 text-white font-montserrat">
      {/* TOP */}
      <div className="flex justify-between items-start mb-[24px]">
        <p className="text-white text-[16px] leading-[28px] max-w-[546px] font-normal">
          Зберігайте криптовалюти в обране, щоб швидко відстежувати ціни,
          зміни ринку та створювати алерти
        </p>

        <button className="min-w-[208px] h-[44px] px-6 rounded-full flex items-center justify-center bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-white text-[14px] leading-[20px] font-medium transition-all duration-300 ease-out hover:scale-105 hover:shadow-[0_0_15px_rgba(131,72,193,0.4)] active:scale-[0.98] cursor-pointer">
          Підключити Telegram
        </button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-4 gap-[24px] mb-[24px] w-full">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="h-[110px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_80px_rgba(131,72,193,0.4),0_8px_25px_rgba(0,0,0,0.5)]  hover:-translate-y-1"
          >
            <div className="relative h-full rounded-[28px] bg-[#050506] p-5 text-center overflow-hidden flex flex-col items-center justify-center">
              <p className="text-white text-[14px] font-normal">
                {stat.title}
              </p>

              <div className="flex items-center justify-center gap-1 mt-2">
                <h2
                  className={
                    stat.valueClass ||
                    "text-[28px] leading-none font-medium text-white"
                  }
                >
                  {stat.value}
                </h2>

                {stat.icon && <img src={stat.icon} alt="" className="w-5 h-5" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-4 gap-[24px] w-full">
        {/* LEFT */}
        <div className="col-span-3">
          <h2 className="mb-[24px] text-[24px] leading-[28px] font-semibold text-white">
            Вибрані активи
          </h2>

          {/* TABLE */}
          <div className="w-full h-[519px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
            <div className="h-full rounded-[28px] bg-[#050506] overflow-hidden">
              {/* HEADER */}
              <div
                className={`relative ${tableGrid} items-center px-[24px] h-[57px] text-[#A3A4B0] text-[14px] font-normal bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)]`}
              >
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))]" />

                <span>Монета</span>
                <span>Ціна</span>
                <span>24год</span>

                <span className="block leading-[18px]">
                  Ринкова <br />
                  капіталізація
                </span>

                <span>Обсяг</span>
                <span>Дії</span>
              </div>

              {favoriteAssets.map((asset, index) => {
                const isPositive = asset.change.startsWith("+");

                return (
                  <React.Fragment key={asset.symbol}>
                    {/* ROW */}
                    <div
                      className={`${tableGrid} items-center px-[24px] h-[76px] transition-all duration-300 ease-out hover:bg-white/5`}
                    >
                      {/* MONETA */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full ${asset.color} flex items-center justify-center text-[12px] font-bold text-white`}
                        >
                          {asset.symbol.charAt(0)}
                        </div>

                        <p className="text-[14px] font-medium text-white">
                          {asset.symbol}
                        </p>
                      </div>

                      {/* PRICE */}
                      <p className="text-[14px] font-normal text-white">
                        {asset.price}
                      </p>

                      {/* CHANGE */}
                      <p
                        className={`text-[14px] font-medium ${
                          isPositive ? "text-[#25DE28]" : "text-[#F40000]"
                        }`}
                      >
                        {asset.change}
                      </p>

                      {/* MARKET CAP */}
                      <p className="text-[14px] font-normal text-white">
                        {asset.marketCap}
                      </p>

                      {/* VOLUME */}
                      <p className="text-[14px] font-normal text-white">
                        {asset.volume}
                      </p>
                      {/* ACTIONS */}
                      <div className="flex items-center justify-end gap-[16px] pr-[8px]">

                        {/* VIEW */}
                        <button
                          className="
                          group relative inline-flex w-8 h-8 items-center justify-center rounded-full p-[1px] 
                          bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))] transition-all duration-300 hover:scale-110
                          hover:shadow-[0_0_12px_rgba(131,72,193,0.28)] active:scale-95 cursor-pointer"
                        >
                          <div
                            className="
                              flex h-full w-full items-center justify-center rounded-full
                              bg-[#050506] transition-all duration-300 group-hover:bg-[#0B0B0D]"
                             >
                          <img
                            src={eyeIcon}
                            alt=""
                            className="
                              w-4 h-4
                              transition-all duration-300
                              group-hover:scale-110
                              group-hover:brightness-125"
                          />
                        </div>
                      </button>

                      {/* DELETE */}
                      <button
                        className="
                          group relative inline-flex w-8 h-8 items-center justify-center rounded-full p-[1px]
                          bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))]
                          hover:bg-[linear-gradient(90deg,#1C102F_0%,#FF4444_100%)] transition-all duration-300
                          hover:scale-110 hover:shadow-[0_0_15px_rgba(255,68,68,0.35)] active:scale-95 cursor-pointer"
                      >
                        <div
                          className="
                            flex h-full w-full items-center justify-center rounded-full
                            bg-[#050506] transition-all duration-300 group-hover:bg-[#140707]"
                        >
                          <img
                            src={trashIcon}
                            alt=""
                            className="
                              w-4 h-4 transition-all duration-300
                              group-hover:scale-110 group-hover:brightness-125"
                          />
                        </div>
                      </button>
                     </div>
                    </div>

                  {index !== favoriteAssets.length - 1 && (
                    <div className="px-[24px]">
                        <div className="h-[1px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32)_0%,rgba(179,179,179,0.032)_100%)]" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="col-span-1">
          <h2 className="mb-[24px] text-[24px] leading-[28px] font-semibold text-white">
            Рекомендовано
          </h2>

          <div className="w-[279px] h-[462px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]]">
            <div className="h-full rounded-[28px] bg-[#050506] overflow-hidden">
              {recommendedAssets.map((asset, index) => (
                <React.Fragment key={asset.symbol}>
                  <div className="flex items-center justify-between px-6 h-[76px] transition-all duration-300 ease-out hover:bg-white/5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full ${asset.color} flex items-center justify-center text-[12px] font-bold text-white`}
                      >
                        {asset.symbol.charAt(0)}
                      </div>

                      <p className="text-[14px] font-medium text-white">
                        {asset.symbol}
                      </p>
                    </div>

                    <button className="group relative inline-flex h-[36px] w-[86px] items-center justify-center rounded-full p-[1px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(131,72,193,0.4)] active:scale-95 cursor-pointer">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#050506] transition-all group-hover:bg-[#0B0B0D]">
                        <span className="text-[14px] font-normal text-white">
                          Додати
                        </span>
                      </div>
                    </button>
                  </div>

                  {index !== recommendedAssets.length - 1 && (
                    <div className="px-[24px]">
                      <div className="h-[1px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32)_0%,rgba(179,179,179,0.032)_100%)]" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}