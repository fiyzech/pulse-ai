import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

import { fetchCryptoNews, formatNewsTime } from "../../utils/news";
import type { CryptoNewsItem } from "../../utils/news";

// --- ТИПІЗАЦІЯ ---
interface CoinData {
  usd: number;
  usd_24h_change?: number;
  usd_1h_change?: number;
}

interface CryptoResponse {
  [key: string]: CoinData;
}

interface ChartDataPoint {
  value: number;
}

// --- ХЕЛПЕР ДЛЯ BINANCE API ---
const getChartParams = (sel: string): { interval: string; limit: number } => {
  switch (sel) {
    case "1 хв":
      return { interval: "1s", limit: 60 };
    case "5 хв":
      return { interval: "1s", limit: 300 };
    case "15 хв":
      return { interval: "1m", limit: 15 };
    case "1 год":
      return { interval: "1m", limit: 60 };
    case "4 год":
      return { interval: "5m", limit: 48 };
    case "1 д":
      return { interval: "15m", limit: 96 };
    default:
      return { interval: "1m", limit: 60 };
  }
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<string>("1 год");

  const [cryptoData, setCryptoData] = useState<CryptoResponse | null>(null);
  const [chartsData, setChartsData] = useState<Record<string, ChartDataPoint[]>>({});

  const [isPeriodOpen, setIsPeriodOpen] = useState<boolean>(false);
  const [periodSelected, setPeriodSelected] = useState<string>("1 сек");

  const [news, setNews] = useState<CryptoNewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState<boolean>(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  const timeOptions: string[] = ["1 хв", "5 хв", "15 хв", "1 год", "4 год", "1 д"];
  const timeOptions1: string[] = ["1 сек", "15 хв", "1 год", "4 год", "1 день", "1 тиж", "1 міс"];
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

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd&include_24hr_change=true&include_1h_change=true&precision=2"
        );

        const data: CryptoResponse = await res.json();

        if (data && Object.keys(data).length > 0) {
          setCryptoData(data);
        }
      } catch (e) {
        console.error("Помилка CoinGecko:", e);
      }
    };

    fetchPrices();

    const interval = setInterval(fetchPrices, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchBinanceCharts = async () => {
      const { interval, limit } = getChartParams(selected);

      const symbols = [
        { id: "bitcoin", symbol: "BTCUSDT" },
        { id: "ethereum", symbol: "ETHUSDT" },
        { id: "tether", symbol: "USDCUSDT" },
      ];

      try {
        const results = await Promise.all(
          symbols.map((s) =>
            fetch(
              `https://api.binance.com/api/v3/klines?symbol=${s.symbol}&interval=${interval}&limit=${limit}`
            )
              .then((res) => res.json())
              .then((data) => ({ id: s.id, data }))
          )
        );

        const newCharts: Record<string, ChartDataPoint[]> = {};

        results.forEach((res) => {
          if (Array.isArray(res.data)) {
            newCharts[res.id] = res.data.map((candle: any) => ({
              value: parseFloat(candle[4]),
            }));
          }
        });

        setChartsData(newCharts);
      } catch (error) {
        console.error("Помилка Binance API:", error);
      }
    };

    fetchBinanceCharts();

    const intervalId = setInterval(fetchBinanceCharts, 15000);

    return () => clearInterval(intervalId);
  }, [selected]);

  useEffect(() => {
  const loadNews = async () => {
    try {
      setNewsLoading(true);
      setNewsError(null);

      const result = await fetchCryptoNews(6, 100);

      setNews(result);
    } catch (error) {
      console.error("Помилка NewsAPI:", error);
      setNewsError("Не вдалося завантажити новини");
    } finally {
      setNewsLoading(false);
    }
  };

  loadNews();

  const intervalId = setInterval(loadNews, 10 * 60 * 1000);

  return () => clearInterval(intervalId);
}, []);

  const coins = [
    {
      name: "Bitcoin",
      symbol: "BTC",
      icon: "/Bitcoin.svg",
      path: "/asset/btc",
      id: "bitcoin",
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      icon: "/Ethereum.svg",
      path: "/asset/eth",
      id: "ethereum",
    },
    {
      name: "Tether",
      symbol: "USDT",
      icon: "/Tether.svg",
      path: "/asset/usdt",
      id: "tether",
    },
  ];

  return (
    <section className="w-full max-w-[1600px] mx-auto px-10 pt-7 pb-8">
      {/* СЕКЦІЯ 1 */}
      <div className="mb-6 relative">
        <div
          className={`relative w-full xl:w-[831px] mb-[24px] transition-all ${
            isOpen ? "z-50" : "z-0"
          }`}
        >
          <h2 className="font-montserrat text-[24px] leading-[28px] font-semibold text-white/95">
            Найпопулярніше сьогодні
          </h2>

          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <div className="p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_4px_20px_rgba(131,72,193,0.15)]">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-[45px] w-[86px] items-center justify-center gap-2 rounded-[28px] bg-[#050506] text-white transition-all hover:bg-white/5"
              >
                <span className="text-[12px] leading-[15px] font-medium">
                  {selected}
                </span>

                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
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
            </div>

            {isOpen && (
              <div className="absolute right-0 top-[53px] w-[86px] p-[1px] rounded-[16px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] z-50">
                <div className="bg-[#050506] rounded-[16px] p-1">
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
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[261px_261px_261px_261px] relative z-0">
          {coins.map((coin) => {
            const data = cryptoData?.[coin.id];
            const chartData = chartsData[coin.id] || [];

            let price = data?.usd
              ? data.usd.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "...";

            let changeValue =
              selected === "1 д" ? data?.usd_24h_change : data?.usd_1h_change;

            let isPositive = (changeValue || 0) >= 0;

            let customYDomain: [number, number] | ["auto", "auto"] = [
              "auto",
              "auto",
            ];

            if (chartData.length > 0) {
              const firstPoint = chartData[0].value;
              const lastPoint = chartData[chartData.length - 1].value;

              changeValue = ((lastPoint - firstPoint) / firstPoint) * 100;
              isPositive = changeValue >= 0;

              price =
                lastPoint < 10
                  ? lastPoint.toFixed(4)
                  : lastPoint.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    });

              const minVal = Math.min(...chartData.map((d) => d.value));
              const maxVal = Math.max(...chartData.map((d) => d.value));
              const padding = (maxVal - minVal) * 0.25 || minVal * 0.01;

              customYDomain = [minVal - padding, maxVal + padding];
            }

            const formattedChange =
              changeValue !== undefined
                ? `${isPositive ? "+" : ""}${changeValue.toFixed(2)}%`
                : "0.00%";

            const lineGradientId = `line-gradient-${coin.symbol}`;
            const glowFilterId = `glow-blur-${coin.symbol}`;

            return (
              <div
                key={coin.symbol}
                className="h-[305px] w-full p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_80px_rgba(131,72,193,0.4),0_8px_25px_rgba(0,0,0,0.5)] hover:-translate-y-1"
              >
                <div
                  onClick={() => navigate(coin.path)}
                  className="relative h-full w-full cursor-pointer rounded-[28px] bg-[#050506] transition-all overflow-hidden group/card"
                >
                  <div className="absolute right-6 top-6 h-[40px] w-[40px] transition-all duration-300 group-hover/card:scale-110 z-20">
                    <div className="absolute inset-0 rounded-full bg-[#7c3aed]/40 blur-md opacity-0 group-hover/card:opacity-100 transition-all" />
                    <img
                      src="/buttom.svg"
                      alt="open"
                      className="relative z-10 h-[40px] w-[40px]"
                    />
                  </div>

                  <div className="relative z-10 flex flex-col h-full pointer-events-none">
                    <div className="flex items-center gap-3 pt-6 pl-6">
                      <img
                        src={coin.icon}
                        alt={coin.name}
                        className="h-[40px] w-[40px]"
                      />

                      <div>
                        <h3 className="text-[16px] font-semibold text-white leading-tight">
                          {coin.name}
                        </h3>
                        <p className="text-[13px] text-white/50">{coin.symbol}</p>
                      </div>
                    </div>

                    <div className="pl-6 mt-[28px]">
                      <p className="font-montserrat text-[12px] leading-[16px] text-white/60 mb-[12px]">
                        Ціна ({timeLabelMap[selected]})
                      </p>

                      <div className="flex items-baseline gap-2">
                        <span className="font-montserrat text-[28px] font-medium leading-none text-white">
                          {price}
                        </span>
                        <span className="font-montserrat text-[14px] font-medium text-white/60">
                          USDT
                        </span>
                      </div>
                    </div>

                    <div className="pl-6 mt-[12px]">
                      <div className="flex items-center gap-1 font-montserrat text-[12px] leading-[16px]">
                        <span className="text-white/60">Зміна:</span>
                        <span
                          className={isPositive ? "text-[#24FF7A]" : "text-[#F40000]"}
                        >
                          {formattedChange}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 w-full h-[120px] pointer-events-none z-0">
                    <div
                      className="absolute bottom-[30px] left-0 w-full h-[1px] opacity-40"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #6F6C6C 50%, transparent 50%)",
                        backgroundSize: "8px 1px",
                        backgroundRepeat: "repeat-x",
                      }}
                    />

                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 45, right: 10, left: 0, bottom: 5 }}
                        style={{ overflow: "visible" }}
                      >
                        <defs>
                          <linearGradient
                            id={lineGradientId}
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop offset="0%" stopColor="#301B6D" />
                            <stop offset="50%" stopColor="#522E8B" />
                            <stop offset="100%" stopColor="#8348C1" />
                          </linearGradient>

                          <filter
                            id={glowFilterId}
                            x="-50%"
                            y="-50%"
                            width="200%"
                            height="200%"
                          >
                            <feGaussianBlur stdDeviation="10" result="blur" />
                          </filter>
                        </defs>

                        <YAxis hide domain={customYDomain} />

                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={isPositive ? `url(#${lineGradientId})` : "#7A0E0E"}
                          strokeWidth={2.5}
                          isAnimationActive={true}
                          dot={(props: any) => {
                            const { cx, cy, index } = props;

                            if (chartData.length === 0) return null;

                            const lastIndex = chartData.length - 1;
                            const startIndex = 0;

                            const isStartNode = index === startIndex;
                            const isEndNode = index === lastIndex;

                            if (!isStartNode && !isEndNode) return null;

                            const dotColor = isPositive ? "#8348C1" : "#7A0E0E";
                            const textColor = isPositive ? "#24FF7A" : "#F40000";
                            const glowColor = isPositive ? "#8348C1" : "#7A0E0E";

                            if (isStartNode) {
                              return (
                                <circle
                                  key={`dot-start-${index}`}
                                  cx={cx}
                                  cy={cy}
                                  r={3.5}
                                  fill="#FFF"
                                  stroke={dotColor}
                                  strokeWidth={2}
                                />
                              );
                            }

                            if (isEndNode) {
                              const lookbackIndex = Math.max(0, lastIndex - 6);
                              const isDropping =
                                chartData[lookbackIndex].value >
                                chartData[lastIndex].value;

                              const boxWidth = 65;
                              const boxHeight = 35;
                              const boxX = cx - boxWidth - 8;

                              let boxY = isDropping
                                ? cy + 12
                                : cy - boxHeight - 12;

                              if (boxY + boxHeight > 105) {
                                boxY = cy - boxHeight - 12;
                              }

                              if (boxY < 5) {
                                boxY = cy + 12;
                              }

                              return (
                                <g key={`dot-end-${index}`}>
                                  <rect
                                    x={boxX}
                                    y={boxY}
                                    width={boxWidth}
                                    height={boxHeight}
                                    fill={glowColor}
                                    fillOpacity={0.25}
                                    filter={`url(#${glowFilterId})`}
                                    rx={8}
                                  />

                                  <text
                                    x={boxX + boxWidth / 2}
                                    y={boxY + boxHeight / 2 + 4}
                                    fill={textColor}
                                    fontSize={12}
                                    fontFamily="Montserrat"
                                    fontWeight={500}
                                    textAnchor="middle"
                                  >
                                    {formattedChange}
                                  </text>

                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={3.5}
                                    fill="#FFF"
                                    stroke={dotColor}
                                    strokeWidth={2}
                                  />
                                </g>
                              );
                            }

                            return null;
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })}

          {/* TELEGRAM PROMO */}
          <div className="w-full self-start translate-y-[-63px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_80px_rgba(131,72,193,0.4),0_8px_25px_rgba(0,0,0,0.5)] hover:-translate-y-[67px]">
            <div
              className="relative flex h-full min-h-[368px] w-full flex-col overflow-hidden rounded-[28px] bg-[#050506] p-[24px]"
              style={{
                backgroundImage: "url('/bgTelegramDashboard.png')",
                backgroundSize: "200%",
                backgroundPosition: "center",
              }}
            >
              <div>
                <div
                  className="mb-[40px] flex items-center gap-2 cursor-pointer"
                  onClick={() => window.scrollTo(0, 0)}
                >
                  <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center">
                    <img
                      src="/logo-crypro-pulse.svg"
                      alt="CryptoPulse"
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="text-[16px] tracking-wide">
                    <span className="font-light text-white">Crypto</span>
                    <span className="font-medium bg-gradient-to-r from-[#ceafef] to-[#9a64d4] bg-clip-text text-transparent">
                      Pulse
                    </span>
                  </div>
                </div>

                <h3 className="mb-[13px] text-[18px] font-semibold text-white leading-[22px]">
                  Отримуй алерти
                  <br />в телеграм боті
                </h3>

                <p className="h-[45px] font-montserrat text-[12px] text-white">
                  Підключи Telegram, щоб миттєво отримувати сповіщення про свої
                  алерти та ринкові зміни.
                </p>
              </div>

              <div className="mt-auto flex flex-col gap-[16px] pt-[20px]">
                <button
                  onClick={() => navigate("/settings")}
                  className="flex h-[44px] w-[213px] items-center justify-center rounded-[28px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-[14px] font-medium leading-[20px] text-white transition-transform hover:scale-105"
                >
                  Підключити Telegram
                </button>

                <button className="group relative flex h-[44px] w-[213px] items-center justify-center rounded-[28px] text-[14px] font-medium leading-[20px] text-white transition-transform hover:scale-105">
                  <svg
                    className="absolute inset-0 h-full w-full pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="1"
                      y="1"
                      width="211"
                      height="42"
                      rx="21"
                      fill="none"
                      stroke="url(#gradient-border)"
                      strokeWidth="1.5"
                    />
                    <defs>
                      <linearGradient
                        id="gradient-border"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#2C1969" />
                        <stop offset="50%" stopColor="#8348C1" />
                        <stop offset="100%" stopColor="#C38BFF" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <span className="relative z-10">Дізнатись більше</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* СЕКЦІЯ 2 */}
      <div className="-mt-[63px] mb-[24px]">
        <h2 className="w-[255px] h-[28px] mb-6 font-montserrat text-[24px] leading-[28px] font-semibold text-white/95">
          Варто відстежувати
        </h2>

        <div className="w-full max-w-[1116px] h-[354px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_100px_rgba(131,72,193,0.3),0_8px_25px_rgba(0,0,0,0.4)]">
          <div className="relative flex h-full w-full items-start justify-center rounded-[28px] bg-[#050506]">
            <div className="absolute left-[24px] top-[24px] flex flex-col">
              <p className="h-[16px] text-[12px] leading-[16px] font-light text-white whitespace-nowrap">
                Останнє оновлення ~ 2 хвилини тому
              </p>

              <div className="h-[12px]" />

              <div className="flex items-center">
                <img
                  src="/Bitcoin.svg"
                  alt="Bitcoin"
                  className="w-[40px] h-[40px]"
                />

                <p className="ml-[8px] h-[32px] text-[28px] leading-[32px] font-medium text-white whitespace-nowrap">
                  Bitcoin(BTC)
                </p>

                <button
                  onClick={() => navigate("/asset/btc")}
                  className="ml-[12px] h-[40px] w-[40px] transition-all duration-300 hover:scale-110 group"
                >
                  <div className="absolute inset-0 rounded-full bg-[#7c3aed]/40 blur-md opacity-0 group-hover:opacity-100 transition-all" />
                  <img
                    src="/buttom.svg"
                    alt="btn"
                    className="relative z-10 h-[40px] w-[40px]"
                  />
                </button>
              </div>

              <div className="h-[24px]" />

              <p className="h-[16px] text-[12px] leading-[16px] font-light text-white">
                Поточна ціна
              </p>

              <div className="h-[8px]" />

              <p className="h-[44px] text-[40px] leading-[44px] font-medium text-white">
                98.432,32$
              </p>
            </div>

            <div
              className={`absolute right-[24px] top-[24px] h-[164px] w-[554px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all ${
                isPeriodOpen ? "z-50" : "z-0"
              }`}
            >
              <div className="relative h-full w-full rounded-[28px] bg-[#050506]">
                <div className="absolute left-[24px] top-[24px]">
                  <p className="font-montserrat text-[16px] text-white">
                    Оберіть період
                  </p>
                </div>

                <div className="absolute left-[24px] top-[50px]">
                  <p className="font-montserrat text-[12px] text-white">
                    Дані оновлюються відповідно до вибраного інтервалу
                  </p>
                </div>

                <div className="absolute right-[24px] top-[24px] z-20">
                  <div className="relative p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
                    <button
                      onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                      className="flex h-[36px] w-[86px] items-center justify-center gap-2 rounded-[28px] bg-[#050506] text-white transition-all hover:bg-white/5"
                    >
                      <span className="text-[12px] font-medium">
                        {periodSelected}
                      </span>

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
                      <div className="absolute right-0 top-[44px] z-50 w-[86px] p-[1px] rounded-[20px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
                        <div className="bg-[#050506] rounded-[20px] p-[6px]">
                          {timeOptions1.map((option) => (
                            <button
                              key={option}
                              onClick={() => {
                                setPeriodSelected(option);
                                setIsPeriodOpen(false);
                              }}
                              className="w-full rounded-[12px] px-2 py-1.5 text-[12px] text-white/80 transition-all hover:bg-white/10 hover:text-white"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

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

                  <div className="relative mt-[8px] h-[14px] w-full text-[12px] text-white">
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

            <div className="absolute bottom-[24px] left-[24px] right-[24px] flex gap-[18px] z-0">
              {[
                { title: "Зміна", value: "+2.45%", showPeriod: true },
                { title: "Діапазон", value: "$95K – $99K", showPeriod: true },
                {
                  title: "Останній рух (1 хв тому)",
                  value: "+0.8%",
                  showPeriod: false,
                },
                { title: "Максимум", value: "$99K", showPeriod: true },
              ].map((card, index) => (
                <div
                  key={index}
                  className="h-[118px] w-[253px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_60px_rgba(131,72,193,0.4),0_8px_25px_rgba(0,0,0,0.5)] hover:-translate-y-1"
                >
                  <div className="relative h-full w-full rounded-[28px] bg-[#050506]">
                    <p className="absolute left-[24px] top-[24px] font-montserrat text-[13px] leading-[16px] font-medium text-white">
                      {card.title}
                    </p>

                    {card.showPeriod && (
                      <div className="absolute right-[24px] top-[18px] h-[31px] w-[63px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
                        <div className="flex h-full w-full items-center justify-center rounded-[28px] bg-[#050506]">
                          <span className="font-montserrat text-[12px] leading-[15px] font-medium text-white">
                            {periodSelected}
                          </span>
                        </div>
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
      <div className="mt-[24px]">
        <h2 className="mb-6 h-[28px] w-[205px] font-montserrat text-[24px] font-semibold leading-[28px] text-white/95">
          Останні новини
        </h2>

        <div className="w-full max-w-[1116px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_100px_rgba(131,72,193,0.3),0_8px_25px_rgba(0,0,0,0.4)]">
          <div className="relative h-[439px] w-full overflow-hidden rounded-[28px] bg-[#050506] px-[24px] pt-[24px]">
            {newsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[80px] gap-y-[24px]">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="min-h-[82px] rounded-[16px] p-3 -mx-3 -my-2 animate-pulse"
                  >
                    <div className="mb-[12px] h-[24px] w-[220px] rounded-full bg-white/10" />
                    <div className="h-[18px] w-full rounded-full bg-white/10" />
                    <div className="mt-[8px] h-[18px] w-[75%] rounded-full bg-white/10" />
                  </div>
                ))}
              </div>
            )}

            {!newsLoading && newsError && (
              <div className="flex h-[300px] items-center justify-center text-center">
                <p className="font-montserrat text-[14px] text-white/60">
                  {newsError}
                </p>
              </div>
            )}

            {!newsLoading && !newsError && news.length === 0 && (
              <div className="flex h-[300px] items-center justify-center text-center">
                <p className="font-montserrat text-[14px] text-white/60">
                  Наразі немає релевантних крипто-новин
                </p>
              </div>
            )}

            {!newsLoading && !newsError && news.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[80px] gap-y-[24px]">
                {news.slice(0, 6).map((item, index) => (
                  <a
                    key={`${item.url}-${index}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col gap-[8px] min-h-[82px] cursor-pointer p-3 -mx-3 -my-2 rounded-[16px] transition-all duration-300 hover:bg-white/5"
                  >
                    <div className="flex items-center gap-[8px] h-[24px]">
                      {item.icon && (
                        <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
                          <img
                            src={item.icon}
                            alt={item.tag}
                            className="h-[18px] w-[18px] object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}

                      <span className="font-montserrat text-[12px] text-white/80 leading-none">
                        {formatNewsTime(item.publishedAt)} · {item.source}
                      </span>
                    </div>

                    <p className="font-montserrat text-[16px] font-medium leading-[22px] text-white line-clamp-2">
                      {item.title}
                    </p>
                  </a>
                ))}
              </div>
            )}

            <div className="absolute top-[373px] left-1/2 -translate-x-1/2">
              <button
                onClick={() => navigate("/news")}
                className="group relative flex h-[44px] w-[243px] items-center justify-center rounded-[28px] text-[14px] font-medium leading-[20px] text-white transition-transform hover:scale-105"
              >
                <svg
                  className="absolute inset-0 h-full w-full pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="1"
                    y="1"
                    width="241"
                    height="42"
                    rx="21"
                    fill="none"
                    stroke="url(#final-rect-grad)"
                    strokeWidth="1.5"
                  />
                  <defs>
                    <linearGradient
                      id="final-rect-grad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#2C1969" />
                      <stop offset="50%" stopColor="#8348C1" />
                      <stop offset="100%" stopColor="#C38BFF" />
                    </linearGradient>
                  </defs>
                </svg>

                <span className="relative z-10">Перейти до головних новин</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}