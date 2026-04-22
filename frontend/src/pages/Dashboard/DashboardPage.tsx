import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("1 год");

  const timeOptions = ["1 хв", "5 хв", "15 хв", "1 год", "4 год", "1 д"];

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
      <div className="mb-6">
        <div className="mb-[17px] flex items-start justify-between">
          <h2 className="w-[339px] h-[28px] font-montserrat text-[24px] leading-[28px] font-semibold text-white/95">
            Найпопулярніше сьогодні
          </h2>

          <div className="flex w-[371px] items-start gap-6">
            <div className="relative">
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

            <div className="w-[261px]" />
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
                  className="absolute right-6 top-6 h-[40px] w-[40px]"
                >
                  <img
                    src="/buttom.svg"
                    alt="open"
                    className="h-[40px] w-[40px]"
                  />
                </button>

                {/* ІКОНКА + НАЗВА */}
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

                {/* ЦІНА (таймфрейм) */}
                <div className="ml-6 mt-[28px] h-[16px] w-[120px]">
                  <p className="font-montserrat text-[12px] leading-[16px] text-white">
                    Ціна ({timeLabelMap[selected]})
                  </p>
                </div>

                {/* ЗМІНА */}
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
          <div className="flex h-full w-full items-center justify-center rounded-[28px] bg-black">
            <span className="text-[14px] text-white/30">
              Тут будуть ваші активи
            </span>
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