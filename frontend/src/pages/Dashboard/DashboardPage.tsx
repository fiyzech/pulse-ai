import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("1 год");

  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [periodSelected, setPeriodSelected] = useState("1 сек");

  const timeOptions = ["1 хв", "5 хв", "15 хв", "1 год", "4 год", "1 д"];
  const timeOptions1 = ["1 сек", "15 хв", "1 год", "4 год", "1 день", "1 тиж", "1 міс"];

  const timeline: string[] = ["1 сек", "15 хв", "1 год", "4 год", "1 день", "1 тиж", "1 міс"];

  const activeIndex = timeline.indexOf(periodSelected);
  const positionPercent =
    activeIndex >= 0 ? (activeIndex / (timeline.length - 1)) * 100 : 0;

  const timeLabelMap: Record<string, string> = {
    "1 хв": "1 хвилина",
    "5 хв": "5 хвилин",
    "15 хв": "15 хвилин",
    "1 год": "1 година",
    "4 год": "4 години",
    "1 д": "1 день",
  };

  const coins = [
    {
      name: "Bitcoin",
      symbol: "BTC",
      icon: "/Bitcoin.svg",
      path: "/markets",
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      icon: "/Ethereum.svg",
      path: "/markets",
    },
    {
      name: "Tether",
      symbol: "USDT",
      icon: "/Tether.svg",
      path: "/markets",
    },
  ];

  return (
    <section className="w-full max-w-[1600px] mx-auto px-10 pt-7 pb-8">
      {/* СЕКЦІЯ 1 */}
      <div className="mb-6 relative">
        
        {/* ОНОВЛЕНИЙ HEADER: Заголовок + Кнопка  */}
        <div className="flex w-full flex-col sm:flex-row sm:items-center justify-between xl:w-[831px] mb-[24px]">
          <h2 className="font-montserrat text-[24px] leading-[28px] font-semibold text-white/95">
            Найпопулярніше сьогодні
          </h2>

          {/* КНОПКА ВИБОРУ ПЕРІОДУ */}
          <div className="relative mt-4 sm:mt-0 translate-y-[5px]">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-[45px] w-[86px] shrink-0 items-center justify-center gap-2 rounded-[28px] border border-[#7c3aed]/40 bg-black text-white/90 transition-all hover:border-violet-500/50"
            >
              <span className="text-[12px] leading-[15px] font-medium">
                {selected}
              </span>

              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className={`shrink-0 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <path
                  d="M2.5 7.5L6 4L9.5 7.5"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {isOpen && (
              <div className="absolute right-0 top-[53px] z-50 w-[80px] rounded-[16px] border border-[#7c3aed]/30 bg-black p-1 shadow-lg">
                {timeOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSelected(option);
                      setIsOpen(false);
                    }}
                    className="w-full rounded-lg px-2 py-1.5 text-center text-[12px] text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[261px_261px_261px_261px]">
          {coins.map((coin) => (
            <div
              key={coin.symbol}
              className="h-[305px] w-full rounded-[28px] bg-gradient-to-br from-[#7c3aed]/45 via-[#2b114d]/25 to-white/20 p-[1px]"
            >
              <div className="relative h-full w-full cursor-pointer rounded-[28px] bg-black transition-all">
                <button
                  onClick={() => navigate(coin.path)}
                  className="absolute right-6 top-6 h-[40px] w-[40px] transition-all duration-300 hover:scale-110 group"
                >
                  <div className="absolute inset-0 rounded-full bg-[#7c3aed]/40 blur-md opacity-0 group-hover:opacity-100 transition-all duration-300" />

                  <img
                    src="/buttom.svg"
                    alt="open"
                    className="relative z-10 h-[40px] w-[40px]"
                  />
                </button>

                <div className="flex items-center gap-3 pt-6 pl-6">
                  <img
                    src={coin.icon}
                    alt={coin.name}
                    className="h-[40px] w-[40px]"
                  />

                  <div>
                    <h3 className="text-[16px] font-semibold text-white">
                      {coin.name}
                    </h3>
                    <p className="text-[13px] text-white/40">{coin.symbol}</p>
                  </div>
                </div>

                <div className="ml-6 mt-[28px] h-[16px] w-[120px]">
                  <p className="font-montserrat text-[12px] leading-[16px] text-white">
                    Ціна ({timeLabelMap[selected]})
                  </p>
                </div>

                <div className="absolute left-6 top-[164px] h-[16px] w-[120px]">
                  <p className="font-montserrat text-[12px] leading-[16px] text-white">
                    Зміна:
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Telegram Promo */}
          <div className="h-[368px] w-full self-start translate-y-[-63px] rounded-[28px] bg-gradient-to-br from-[#7c3aed]/45 via-[#2b114d]/25 to-white/20 p-[1px]">
            <div
              className="h-full w-full overflow-hidden rounded-[28px] flex flex-col justify-between p-7"
              style={{
                backgroundImage: "url('/bgTelegramDashboard.png')",
                backgroundSize: "200%",
                backgroundPosition: "center",
              }}
            >
              <div>
                <h3 className="mb-2 text-[18px] font-semibold text-white">
                  Отримуй алерти в Telegram
                </h3>

                <p className="mb-6 text-[13px] leading-relaxed text-white/50">
                  Підключи Telegram, щоб миттєво отримувати сповіщення про свої
                  алерти та ринкові зміни.
                </p>
              </div>

              <div className="relative z-10 space-y-2.5">
                <button
                  onClick={() => navigate("/settings")}
                  className="w-full rounded-xl bg-[#A78BFA] py-3 text-[14px] font-semibold text-[#1b1330] transition-colors hover:bg-[#BBA4FD]"
                >
                  Підключити Telegram
                </button>

                <button className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-[14px] font-medium text-white/70 transition-colors hover:bg-white/10">
                  Дізнатись більше
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* СЕКЦІЯ 2 */}
      <div className="-mt-[63px] mb-8">
        <h2 className="w-[255px] h-[28px] mb-6 font-montserrat text-[24px] leading-[28px] font-semibold text-white/95">
          Варто відстежувати
        </h2>

        <div className="w-full max-w-[1116px] h-[362px] rounded-[28px] bg-gradient-to-br from-[#7c3aed]/45 via-[#2b114d]/25 to-white/20 p-[1px]">
          <div className="relative flex h-full w-full items-start justify-center rounded-[28px] bg-black">
            <div className="absolute left-[24px] top-[24px] flex flex-col">
              <p className="h-[16px] text-[12px] leading-[16px] font-light text-white/70 whitespace-nowrap">
                Останнє оновлення ~ 2 хвилини тому
              </p>

              <div className="h-[12px]" />

              <div className="flex items-center">
                <img src="/Bitcoin.svg" className="w-[40px] h-[40px]" />
                <p className="ml-[8px] h-[32px] text-[28px] leading-[32px] font-medium text-white whitespace-nowrap">
                  Bitcoin(BTC)
                </p>

                <button
                  onClick={() => navigate("/markets")}
                  className="ml-[12px] h-[40px] w-[40px] transition-all duration-300 hover:scale-110 group"
                >
                  <div className="absolute inset-0 rounded-full bg-[#7c3aed]/40 blur-md opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  <img src="/buttom.svg" className="relative z-10 h-[40px] w-[40px]" />
                </button>
              </div>

              <div className="h-[24px]" />

              <p className="h-[16px] text-[12px] leading-[16px] font-light text-white/60">
                Поточна ціна
              </p>

              <div className="h-[8px]" />

              <p className="h-[44px] text-[40px] leading-[44px] font-medium text-white">
                98.432,32$
              </p>
            </div>

            {/* ВЕЛИКИЙ БЛОК */}
            <div className="absolute right-[24px] top-[29px] h-[156px] w-[554px] rounded-[28px] bg-gradient-to-br from-[#7c3aed]/45 via-[#2b114d]/25 to-white/20 p-[1px]">
              <div className="relative h-full w-full rounded-[28px] bg-black">
                <div className="absolute left-[24px] top-[24px]">
                  <p className="font-montserrat text-[16px] text-white">
                    Оберіть період
                  </p>
                </div>

                <div className="absolute left-[24px] top-[50px]">
                  <p className="font-montserrat text-[12px] text-white/70">
                    Дані оновлюються відповідно до вибраного інтервалу
                  </p>
                </div>

                {/* DROPDOWN СЕКЦІЇ 2 */}
                <div className="absolute right-[24px] top-[24px]">
                  <div className="relative">
                    <button
                      onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                      className="flex h-[36px] w-[86px] items-center justify-center gap-2 rounded-[28px] border border-[#7c3aed]/40 bg-black text-white/90 transition-all duration-200 hover:border-[#7c3aed]"
                    >
                      <span className="text-[12px]">{periodSelected}</span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        className={`transition-transform ${
                          isPeriodOpen ? "rotate-180" : ""
                        }`}
                      >
                        <path
                          d="M2.5 7.5L6 4L9.5 7.5"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>

                    {isPeriodOpen && (
                      <div className="absolute right-0 top-[44px] z-50 w-[80px] rounded-[20px] border border-[#7c3aed]/30 bg-black p-[6px] backdrop-blur-md">
                        {timeOptions1.map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setPeriodSelected(option);
                              setIsPeriodOpen(false);
                            }}
                            className="w-full rounded-[12px] px-2 py-1.5 text-[12px] text-white/80 transition-all duration-200 hover:bg-[#7c3aed]/20 hover:text-white"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ЛІНІЯ */}
                <div className="absolute left-[24px] top-[86px] w-[506px]">
                  <div className="relative h-[24px] w-full">
                    <div className="absolute left-0 top-[12px] h-[1px] w-full bg-white/15" />
                    <div
                      className="absolute left-0 top-[12px] h-[1px] bg-gradient-to-r from-white/40 via-[#a855f7]/70 to-[#7c3aed]/80 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{ width: `${positionPercent}%` }}
                    />
                    {timeline.map((item, index) => {
                      const tickPosition = (index / (timeline.length - 1)) * 100;
                      return (
                        <div
                          key={item}
                          className="absolute top-[6px] h-[12px] w-[1px] bg-white/20"
                          style={{
                            left: `${tickPosition}%`,
                            transform: "translateX(-50%)",
                          }}
                        />
                      );
                    })}
                    <div
                      className="absolute top-[12px] h-[10px] w-[10px] rounded-full bg-[#8B5CF6] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{
                        left: `${positionPercent}%`,
                        transform: "translate(-50%, -45%)",
                      }}
                    />
                  </div>
                  <div className="relative mt-[8px] h-[14px] w-full text-[12px] text-white/55">
                    {timeline.map((item, index) => {
                      let labelPosition = (index / (timeline.length - 1)) * 100;
                      if (index === 0) labelPosition = 0;
                      if (index === timeline.length - 1) labelPosition = 100.4;
                      return (
                        <span
                          key={item}
                          className="absolute top-0 whitespace-nowrap"
                          style={{
                            left: `${labelPosition}%`,
                            transform:
                              index === 0
                                ? "translateX(0)"
                                : index === timeline.length - 1
                                ? "translateX(-100%)"
                                : "translateX(-50%)",
                          }}
                        >
                          {item}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* НИЖНІ КАРТОЧКИ */}
            <div className="absolute bottom-[34px] left-[24px] right-[30px] flex gap-[18px]">
              {[
                { title: "Зміна", value: "+2.45%", showPeriod: true },
                { title: "Діапазон", value: "$95K – $99K", showPeriod: true },
                { title: "Останній рух (1 хв тому)", value: "+0.8%", showPeriod: false },
                { title: "Максимум", value: "$99K", showPeriod: true },
              ].map((card, index) => (
                <div
                  key={index}
                  className="h-[118px] w-[253px] shrink-0 rounded-[28px] bg-gradient-to-br from-[#7c3aed]/45 via-[#2b114d]/25 to-white/20 p-[1px]"
                >
                  <div className="relative h-full w-full rounded-[28px] bg-black">
                    <p className="absolute left-[24px] top-[24px] font-montserrat text-[13px] leading-[16px] font-medium text-white">
                      {card.title}
                    </p>
                    {card.showPeriod && (
                      <div className="absolute right-[24px] top-[18px] flex h-[31px] w-[63px] items-center justify-center rounded-[28px] border border-[#7c3aed]/40 bg-black">
                        <span className="font-montserrat text-[12px] leading-[15px] font-medium text-white">
                          {periodSelected}
                        </span>
                      </div>
                    )}
                    <p className="absolute left-[24px] top-[52px] h-[38px] font-montserrat text-[32px] leading-[38px] font-medium text-white">
                      {card.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* СЕКЦІЯ 3 */}
      <div>
        <h2 className="w-[205px] h-[28px] mb-6 font-montserrat text-[24px] leading-[28px] font-semibold text-white/95">
          Останні новини
        </h2>
        <div className="w-full max-w-[1116px] h-[443px] rounded-[28px] bg-gradient-to-br from-[#7c3aed]/45 via-[#2b114d]/25 to-white/20 p-[1px]">
          <div className="flex h-full w-full items-center justify-center rounded-[28px] bg-black">
            <span className="text-[14px] text-white/30">Стрічка новин</span>
          </div>
        </div>
      </div>
    </section>
  );
}