import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

// ─── Типи ────────────────────────────────────────────────────────────────────

interface DemoTrade {
  id: number;
  user_id: string;
  sym: string;
  side: string;
  action: string;
  qty: number;
  price: number;
  leverage: number;
  pnl: number | null;
  roe: number | null;
  created_at: string;
}

interface TradeStats {
  totalTrades: number;
  winRate: number | null;
  totalPnl: number;
  bestTrade: DemoTrade | null;
  worstTrade: DemoTrade | null;
  mostTradedSym: string | null;
  avgLeverage: number | null;
  totalVolume: number;
}

// ─── Хелпери форматування ────────────────────────────────────────────────────

const formatUsd = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatPct = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// ─── Обчислення статистики ───────────────────────────────────────────────────

function computeStats(trades: DemoTrade[]): TradeStats {
  const closeTrades = trades.filter((t) => t.action === "CLOSE");
  const openTrades = trades.filter((t) => t.action === "OPEN");

  // Win rate
  let winRate: number | null = null;
  if (closeTrades.length > 0) {
    const wins = closeTrades.filter((t) => (t.pnl ?? 0) > 0).length;
    winRate = (wins / closeTrades.length) * 100;
  }

  // Total PnL
  const totalPnl = closeTrades.reduce((acc, t) => acc + (t.pnl ?? 0), 0);

  // Best / Worst
  const sortedClose = [...closeTrades].sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0));
  const bestTrade = sortedClose[0] ?? null;
  const worstTrade = sortedClose[sortedClose.length - 1] ?? null;

  // Most traded symbol
  let mostTradedSym: string | null = null;
  if (trades.length > 0) {
    const freq: Record<string, number> = {};
    trades.forEach((t) => {
      freq[t.sym] = (freq[t.sym] ?? 0) + 1;
    });
    mostTradedSym = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }

  // Average leverage
  let avgLeverage: number | null = null;
  if (trades.length > 0) {
    avgLeverage = trades.reduce((acc, t) => acc + (t.leverage ?? 0), 0) / trades.length;
  }

  // Total volume (OPEN trades)
  const totalVolume = openTrades.reduce((acc, t) => acc + (t.qty ?? 0) * (t.price ?? 0), 0);

  return {
    totalTrades: trades.length,
    winRate,
    totalPnl,
    bestTrade,
    worstTrade,
    mostTradedSym,
    avgLeverage,
    totalVolume,
  };
}

// ─── Skeleton card ───────────────────────────────────────────────────────────

function SkeletonStatCard() {
  return (
    <div className="p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
      <div className="h-full rounded-[28px] bg-[#050506] p-6 flex flex-col gap-3">
        <div className="h-4 w-2/3 rounded-full animate-pulse bg-white/[0.06]" />
        <div className="h-8 w-1/2 rounded-full animate-pulse bg-white/[0.06]" />
        <div className="h-3 w-3/4 rounded-full animate-pulse bg-white/[0.06]" />
      </div>
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  sub,
  valueColor,
}: {
  title: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_80px_rgba(131,72,193,0.19),0_8px_25px_rgba(0,0,0,0.5)]">
      <div className="h-full rounded-[28px] bg-[#050506] p-6 flex flex-col gap-2">
        <p className="font-montserrat text-[13px] leading-[16px] text-white/60">{title}</p>
        <p
          className={`font-montserrat text-[28px] font-medium leading-none ${valueColor ?? "text-white"}`}
        >
          {value}
        </p>
        {sub && (
          <p className="font-montserrat text-[12px] text-white/40 leading-[16px]">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ─── Головний компонент ───────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState<DemoTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrades = async () => {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setTrades([]);
          setLoading(false);
          return;
        }

        const { data, error: dbError } = await supabase
          .from("demo_trades")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (dbError) throw dbError;
        setTrades((data as DemoTrade[]) ?? []);
      } catch (err) {
        console.error("Помилка завантаження торгів:", err);
        setError("Не вдалося завантажити торгові записи");
      } finally {
        setLoading(false);
      }
    };

    void loadTrades();
  }, []);

  const stats = computeStats(trades);
  const recentTrades = trades.slice(0, 20);

  // ─── Порожній стан ─────────────────────────────────────────────────────────

  if (!loading && trades.length === 0 && !error) {
    return (
      <div className="w-full min-h-screen bg-[#050506] flex flex-col items-center justify-center gap-6 px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[linear-gradient(135deg,rgba(82,46,139,0.4),rgba(179,179,179,0.1))] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <h2 className="font-montserrat text-[22px] font-semibold text-white/80">
            Немає торгових записів
          </h2>
          <p className="font-montserrat text-[14px] text-white/40 max-w-[320px] leading-[20px]">
            Відкрийте першу угоду на демо-рахунку, щоб тут з'явилась статистика
          </p>
        </div>
        <button
          onClick={() => navigate("/trading")}
          className="h-[44px] px-8 rounded-full bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] font-montserrat text-[14px] font-medium text-white transition-transform hover:scale-105 cursor-pointer"
        >
          Перейти до торгівлі
        </button>
      </div>
    );
  }

  // ─── Картки статистики ──────────────────────────────────────────────────────

  const statCards = loading
    ? null
    : [
        {
          title: "Усього угод",
          value: String(stats.totalTrades),
          sub: "OPEN + CLOSE",
        },
        {
          title: "Відсоток прибуткових",
          value: stats.winRate !== null ? `${stats.winRate.toFixed(1)}%` : "—",
          sub: "по CLOSE угодах",
          valueColor:
            stats.winRate !== null
              ? stats.winRate >= 50
                ? "text-[#24FF7A]"
                : "text-[#F40000]"
              : undefined,
        },
        {
          title: "Загальний PnL",
          value: stats.totalPnl !== 0 ? formatUsd(stats.totalPnl) : "$0.00",
          sub: "сума закритих угод",
          valueColor:
            stats.totalPnl > 0
              ? "text-[#24FF7A]"
              : stats.totalPnl < 0
              ? "text-[#F40000]"
              : undefined,
        },
        {
          title: "Найкраща угода",
          value: stats.bestTrade
            ? formatUsd(stats.bestTrade.pnl ?? 0)
            : "—",
          sub: stats.bestTrade
            ? `${stats.bestTrade.sym} · ${stats.bestTrade.side} · ROE ${formatPct(stats.bestTrade.roe ?? 0)}`
            : undefined,
          valueColor: "text-[#24FF7A]",
        },
        {
          title: "Найгірша угода",
          value: stats.worstTrade
            ? formatUsd(stats.worstTrade.pnl ?? 0)
            : "—",
          sub: stats.worstTrade
            ? `${stats.worstTrade.sym} · ${stats.worstTrade.side} · ROE ${formatPct(stats.worstTrade.roe ?? 0)}`
            : undefined,
          valueColor: "text-[#F40000]",
        },
        {
          title: "Найпопулярніший актив",
          value: stats.mostTradedSym ?? "—",
          sub: "за кількістю угод",
        },
        {
          title: "Середнє плече",
          value: stats.avgLeverage !== null ? `${stats.avgLeverage.toFixed(1)}x` : "—",
          sub: "по всіх угодах",
        },
        {
          title: "Загальний об'єм",
          value: stats.totalVolume > 0 ? formatUsd(stats.totalVolume) : "$0.00",
          sub: "сума OPEN угод (qty × price)",
        },
      ];

  return (
    <div className="w-full px-10 pt-7 pb-12 font-montserrat">
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="font-montserrat text-[24px] font-semibold leading-[28px] text-white/95">
          Аналітика
        </h1>
        <p className="mt-1 font-montserrat text-[14px] text-white/40">
          Статистика ваших демо-угод
        </p>
      </div>

      {/* Помилка */}
      {error && (
        <div className="mb-6 rounded-[18px] border border-[#8348C1]/40 bg-[#050506] px-5 py-3 text-[13px] text-[#C38BFF]">
          {error}
        </div>
      )}

      {/* Сітка карток */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonStatCard key={i} />)
          : statCards!.map((card, i) => (
              <StatCard
                key={i}
                title={card.title}
                value={card.value}
                sub={card.sub}
                valueColor={card.valueColor}
              />
            ))}
      </div>

      {/* Таблиця останніх угод */}
      {!loading && trades.length > 0 && (
        <>
          <h2 className="font-montserrat text-[20px] font-semibold leading-[24px] text-white/95 mb-4">
            Останні 20 угод
          </h2>

          <div className="w-full p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
            <div className="rounded-[28px] bg-[#050506] overflow-hidden">
              {/* Хедер таблиці */}
              <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr_1fr_1fr] items-center px-6 h-[57px] text-[#A3A4B0] text-[13px] font-normal bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)] relative rounded-t-[28px]">
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))]" />
                <span>Актив</span>
                <span>Сторона</span>
                <span>Дія</span>
                <span>Ціна</span>
                <span>PnL</span>
                <span>ROE</span>
                <span>Дата</span>
              </div>

              {/* Рядки */}
              <div className="flex flex-col">
                {recentTrades.map((trade, index) => {
                  const isLong = trade.side === "LONG";
                  const isClose = trade.action === "CLOSE";
                  const pnlPositive = (trade.pnl ?? 0) > 0;

                  return (
                    <div key={trade.id} className="relative">
                      <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr_1fr_1fr] items-center px-6 h-[60px]">
                        {/* Актив */}
                        <span className="font-montserrat text-[14px] font-medium text-white">
                          {trade.sym}
                        </span>

                        {/* Сторона */}
                        <span
                          className={`font-montserrat text-[13px] font-medium ${
                            isLong ? "text-[#24FF7A]" : "text-[#F40000]"
                          }`}
                        >
                          {trade.side}
                        </span>

                        {/* Дія */}
                        <span className="font-montserrat text-[13px] text-white/60">
                          {trade.action}
                        </span>

                        {/* Ціна */}
                        <span className="font-montserrat text-[13px] text-white">
                          {formatUsd(trade.price ?? 0)}
                        </span>

                        {/* PnL */}
                        <span
                          className={`font-montserrat text-[13px] font-medium ${
                            !isClose
                              ? "text-white/40"
                              : pnlPositive
                              ? "text-[#24FF7A]"
                              : "text-[#F40000]"
                          }`}
                        >
                          {isClose ? formatUsd(trade.pnl ?? 0) : "—"}
                        </span>

                        {/* ROE */}
                        <span
                          className={`font-montserrat text-[13px] ${
                            !isClose
                              ? "text-white/40"
                              : pnlPositive
                              ? "text-[#24FF7A]"
                              : "text-[#F40000]"
                          }`}
                        >
                          {isClose ? formatPct(trade.roe ?? 0) : "—"}
                        </span>

                        {/* Дата */}
                        <span className="font-montserrat text-[12px] text-white/40">
                          {formatDate(trade.created_at)}
                        </span>
                      </div>

                      {index !== recentTrades.length - 1 && (
                        <div className="absolute bottom-0 left-6 right-6 h-[1px] opacity-[0.32] bg-[linear-gradient(90deg,#522E8B_0%,rgba(179,179,179,0.1)_100%)]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Skeleton таблиці під час завантаження */}
      {loading && (
        <div className="w-full p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
          <div className="rounded-[28px] bg-[#050506] p-6 flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[52px] rounded-[14px] animate-pulse bg-white/[0.06]"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
