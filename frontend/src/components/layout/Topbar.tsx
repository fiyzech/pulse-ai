import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { clearAccountCache } from "../../utils/accountCache";
import notificationsIcon from "../../assets/icons/notifications-icon.svg";
import logOutIcon from "../../assets/icons/log-out-icon.svg";

// ── Notification types ────────────────────────────────────────────────────────
type AppNotification = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  ts: number; // ms timestamp; 0 = no time (triggered alerts)
};

// ID-based "seen" tracking — persists correctly across page reloads
const NOTIF_SEEN_KEY = "cryptopulse_notif_seen_ids";

function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIF_SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}

function saveSeenIds(ids: Set<string>): void {
  localStorage.setItem(NOTIF_SEEN_KEY, JSON.stringify(Array.from(ids).slice(-300)));
}

function fmtRelTime(ts: number): string {
  if (!ts) return "";
  const d = Date.now() - ts;
  if (d < 60_000)    return "Щойно";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)} хв тому`;
  if (d < 86_400_000)return `${Math.floor(d / 3_600_000)} год тому`;
  return `${Math.floor(d / 86_400_000)} дн тому`;
}

function alertCondLabel(cond: string): string {
  const m: Record<string, string> = {
    price_gt:"Ціна >", price_gte:"Ціна ≥", price_lt:"Ціна <", price_lte:"Ціна ≤",
    price_eq:"Ціна =", pct_change_24h_gt:"24h ↑%", pct_change_24h_lt:"24h ↓%",
    rsi_gt:"RSI ↑", rsi_lt:"RSI ↓", golden_cross:"Золотий хрест",
    death_cross:"Смертний хрест", ema20_cross_up:"EMA20 ↑", ema20_cross_down:"EMA20 ↓",
    ema50_cross_up:"EMA50 ↑", ema50_cross_down:"EMA50 ↓", new_ath:"Новий ATH",
    volume_spike_gt:"Сплеск об'єму", macd_cross_up:"MACD ↑", macd_cross_down:"MACD ↓",
    trailing_stop_pct:"Trailing stop",
  };
  return m[cond] ?? "Алерт";
}

type CachedMarketAsset = {
  id: string;
  symbol: string;
  imgUrl: string;
};

type SearchResult = {
  type: "page" | "asset";
  label: string;
  description: string;
  path: string;
  coin?: {
    id: string;
    symbol: string;
    imgUrl: string;
  };
};

const pageSearchItems: SearchResult[] = [
  { type: "page", label: "Головна", description: "Dashboard", path: "/dashboard" },
  { type: "page", label: "Обране", description: "Ваші збережені активи", path: "/assets" },
  { type: "page", label: "Ринки", description: "Усі криптоактиви", path: "/markets" },
  { type: "page", label: "Торгівля", description: "Trading workspace та demo угоди", path: "/trading" },
  { type: "page", label: "Алерти", description: "Цінові сповіщення", path: "/alerts" },
  { type: "page", label: "Профіль", description: "Дані акаунта", path: "/profile" },
  { type: "page", label: "Налаштування", description: "Підписка, карта, сповіщення", path: "/settings" },
  { type: "page", label: "Підтримка", description: "Допомога та FAQ", path: "/support" },
  { type: "page", label: "Новини", description: "CryptoPulse новини", path: "/news" },
];

const baseAssetSearchItems = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", imgUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.png" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", imgUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
  { id: "solana", name: "Solana", symbol: "SOL", imgUrl: "https://cryptologos.cc/logos/solana-sol-logo.png" },
  { id: "binancecoin", name: "BNB", symbol: "BNB", imgUrl: "https://cryptologos.cc/logos/bnb-bnb-logo.png" },
  { id: "ripple", name: "XRP", symbol: "XRP", imgUrl: "https://cryptologos.cc/logos/xrp-xrp-logo.png" },
  { id: "cardano", name: "Cardano", symbol: "ADA", imgUrl: "https://cryptologos.cc/logos/cardano-ada-logo.png" },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE", imgUrl: "https://cryptologos.cc/logos/dogecoin-doge-logo.png" },
  { id: "avalanche-2", name: "Avalanche", symbol: "AVAX", imgUrl: "https://cryptologos.cc/logos/avalanche-avax-logo.png" },
  { id: "chainlink", name: "Chainlink", symbol: "LINK", imgUrl: "https://cryptologos.cc/logos/chainlink-link-logo.png" },
  { id: "polkadot", name: "Polkadot", symbol: "DOT", imgUrl: "https://cryptologos.cc/logos/polkadot-new-dot-logo.png" },
  { id: "tron", name: "TRON", symbol: "TRX", imgUrl: "https://cryptologos.cc/logos/tron-trx-logo.png" },
  { id: "sui", name: "Sui", symbol: "SUI", imgUrl: "https://cryptologos.cc/logos/sui-sui-logo.png" },
  { id: "litecoin", name: "Litecoin", symbol: "LTC", imgUrl: "https://cryptologos.cc/logos/litecoin-ltc-logo.png" },
  { id: "the-open-network", name: "Toncoin", symbol: "TON", imgUrl: "https://cryptologos.cc/logos/toncoin-ton-logo.png" },
  { id: "near", name: "NEAR Protocol", symbol: "NEAR", imgUrl: "https://cryptologos.cc/logos/near-protocol-near-logo.png" },
  { id: "uniswap", name: "Uniswap", symbol: "UNI", imgUrl: "https://cryptologos.cc/logos/uniswap-uni-logo.png" },
  { id: "aptos", name: "Aptos", symbol: "APT", imgUrl: "https://cryptologos.cc/logos/aptos-apt-logo.png" },
  { id: "internet-computer", name: "Internet Computer", symbol: "ICP", imgUrl: "https://cryptologos.cc/logos/internet-computer-icp-logo.png" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ARB", imgUrl: "https://cryptologos.cc/logos/arbitrum-arb-logo.png" },
  { id: "optimism", name: "Optimism", symbol: "OP", imgUrl: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.png" },
  { id: "pepe", name: "Pepe", symbol: "PEPE", imgUrl: "https://cryptologos.cc/logos/pepe-pepe-logo.png" },
  { id: "celestia", name: "Celestia", symbol: "TIA", imgUrl: "https://cryptologos.cc/logos/celestia-tia-logo.png" },
];

const readCachedMarketAssets = (): CachedMarketAsset[] => {
  try {
    const raw = sessionStorage.getItem("pulse_table_cards");
    if (!raw) return [];

    const parsed = JSON.parse(raw) as CachedMarketAsset[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item?.id && item?.symbol)
      .map((item) => ({
        id: item.id,
        symbol: item.symbol.toUpperCase(),
        imgUrl: item.imgUrl || `https://cryptologos.cc/logos/${item.symbol.toLowerCase()}-${item.symbol.toLowerCase()}-logo.png`,
      }));
  } catch {
    return [];
  }
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // ── Notifications ──────────────────────────────────────────────────────────
  const notifRef      = useRef<HTMLDivElement>(null);
  const [showNotif,   setShowNotif]   = useState(false);
  const [notifItems,  setNotifItems]  = useState<AppNotification[]>([]);
  const [notifLoad,   setNotifLoad]   = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Helper: build notification list from DB rows
  const buildNotifications = (
    trades: Record<string, unknown>[],
    alerts: Record<string, unknown>[],
  ): AppNotification[] => {
    const items: AppNotification[] = [];

    trades.forEach(t => {
      const ts    = new Date(t.created_at as string).getTime();
      const pnl   = Number(t.pnl);
      const roe   = Number(t.roe);
      const price = Number(t.price);
      const qty   = Number(t.qty);
      const lev   = Number(t.leverage);
      const sym   = t.sym   as string;
      const side  = t.side  as string;
      const act   = t.action as string;

      if (act === "OPEN") {
        items.push({
          id: `trade_${t.id as string}`,
          icon: side === "LONG" ? "📈" : "📉",
          title: `${side === "LONG" ? "Відкрито LONG" : "Відкрито SHORT"} ${sym}`,
          subtitle: `${qty} × x${lev} @ $${price >= 1 ? price.toFixed(2) : price.toFixed(6)}`,
          ts,
        });
      } else {
        const pnlStr = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
        const roeStr = `${roe >= 0 ? "+" : ""}${roe.toFixed(1)}%`;
        items.push({
          id: `trade_${t.id as string}`,
          icon: pnl >= 0 ? "✅" : "❌",
          title: `Закрито ${side} ${sym}`,
          subtitle: `PnL: ${pnlStr} (${roeStr})`,
          ts,
        });
      }
    });

    alerts.forEach(a => {
      const tp   = Number(a.target_price);
      const cond = a.condition as string;
      const tpStr = tp > 0 ? ` $${tp >= 1 ? tp.toFixed(2) : tp.toFixed(6)}` : "";
      items.push({
        id: `alert_${a.id as string}`,
        icon: "🔔",
        title: `Алерт: ${a.symbol as string}`,
        subtitle: `${alertCondLabel(cond)}${tpStr} — ×${a.trigger_count as number}`,
        ts: 0,
      });
    });

    items.sort((a, b) => b.ts - a.ts);
    return items;
  };

  // Fetch IDs on mount → compare with seen set → compute badge
  useEffect(() => {
    const loadBadge = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: trades }, { data: alerts }] = await Promise.all([
        supabase.from("demo_trades").select("id").eq("user_id", user.id)
          .order("created_at", { ascending: false }).limit(8),
        supabase.from("alerts").select("id").eq("user_id", user.id)
          .gt("trigger_count", 0).limit(5),
      ]);

      const seen = getSeenIds();
      const allIds = [
        ...(trades  ?? []).map((r: { id: string }) => `trade_${r.id}`),
        ...(alerts ?? []).map((r: { id: string }) => `alert_${r.id}`),
      ];
      setUnreadCount(allIds.filter(id => !seen.has(id)).length);
    };
    void loadBadge();
  }, []);

  // Close panel on outside click
  useEffect(() => {
    if (!showNotif) return;
    const onDown = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotif(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showNotif]);

  const openNotifications = async () => {
    if (showNotif) { setShowNotif(false); return; }
    setShowNotif(true);
    setNotifLoad(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNotifLoad(false); return; }

    const [{ data: trades }, { data: alerts }] = await Promise.all([
      supabase.from("demo_trades")
        .select("id, sym, side, action, qty, price, leverage, pnl, roe, created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
      supabase.from("alerts")
        .select("id, symbol, condition, target_price, trigger_count")
        .eq("user_id", user.id).gt("trigger_count", 0).limit(5),
    ]);

    const items = buildNotifications(
      (trades  as Record<string, unknown>[] | null) ?? [],
      (alerts as Record<string, unknown>[] | null) ?? [],
    );

    // Mark all as seen — persists across reloads
    const seen = getSeenIds();
    items.forEach(n => seen.add(n.id));
    saveSeenIds(seen);

    setNotifItems(items);
    setUnreadCount(0);
    setNotifLoad(false);
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("dashboard")) return "Головна";
    if (path.includes("assets") || path.includes("watchlist")) return "Обране";
    if (path.includes("markets")) return "Ринки";
    if (path.includes("trading")) return "Торгівля";
    if (path.includes("alerts")) return "Алерти";
    if (path.includes("settings")) return "Налаштування";
    if (path.includes("profile")) return "Профіль";
    if (path.includes("support")) return "Підтримка";
    if (path.includes("asset")) return "Сторінка активу";
    return "Головна"; 
  };

  const handleLogout = async () => {
    try {
      // 1. Обов'язково виходимо через Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // 2. Чистимо кеш — видаляємо всі cryptopulse_* ключі
      clearAccountCache(); // видаляє cryptopulse_account_cache, _profile_cache, _settings_cache
      sessionStorage.removeItem('pulse_table_cards'); // ринковий кеш
      // Видаляємо demo-trading стан та налаштування графіку
      localStorage.removeItem('cpulse_chart_inds_v1');
      const demoPrefix = 'cryptopulse_demo_trading_account:';
      Object.keys(localStorage).filter(k => k.startsWith(demoPrefix)).forEach(k => localStorage.removeItem(k));
      
      setShowLogoutModal(false);
      
      // 3. Редирект на вхід
      navigate("/login");
    } catch (error) {
      console.error("Помилка при виході:", error);
      // Навіть якщо помилка БД, чистимо локально і виходимо
      clearAccountCache();
      navigate("/login");
    }
  };

  const searchResults = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return [];

    const cachedAssets = readCachedMarketAssets();
    const assetBySymbol = new Map<string, { id: string; name: string; symbol: string; imgUrl: string }>();

    baseAssetSearchItems.forEach((asset) => assetBySymbol.set(asset.symbol, asset));
    cachedAssets.forEach((asset) => {
      if (!assetBySymbol.has(asset.symbol)) {
        assetBySymbol.set(asset.symbol, {
          id: asset.id,
          name: asset.id.charAt(0).toUpperCase() + asset.id.slice(1).replace(/-/g, " "),
          symbol: asset.symbol,
          imgUrl: asset.imgUrl,
        });
      }
    });

    const pageMatches = pageSearchItems.filter((item) => {
      const haystack = `${item.label} ${item.description}`.toLowerCase();
      return haystack.includes(query);
    });

    const assetMatches = Array.from(assetBySymbol.values())
      .filter((asset) => {
        const haystack = `${asset.name} ${asset.symbol} ${asset.id}`.toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 8)
      .map<SearchResult>((asset) => ({
        type: "asset",
        label: `${asset.symbol} · ${asset.name}`,
        description: "Криптоактив",
        path: `/asset/${asset.id}`,
        coin: {
          id: asset.id,
          symbol: asset.symbol,
          imgUrl: asset.imgUrl,
        },
      }));

    return [...assetMatches, ...pageMatches].slice(0, 10);
  }, [searchValue]);

  const handleSearchSelect = (result: SearchResult) => {
    setSearchValue("");
    setIsSearchOpen(false);

    if (result.type === "asset" && result.coin) {
      navigate(result.path, { state: { coin: result.coin } });
      return;
    }

    navigate(result.path);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (searchResults[0]) {
      handleSearchSelect(searchResults[0]);
      return;
    }

    const rawQuery = searchValue.trim();
    if (!rawQuery) return;

    setSearchValue(rawQuery);
    setIsSearchOpen(true);
  };

  return (
    <>
      <header className="flex h-[80px] items-center justify-between border-b border-white/5 px-10 bg-[#05050A]/100 backdrop-blur-md sticky top-0 z-[50]">
        <h1 className="text-[28px] font-montserrat font-semibold text-white/90">{getPageTitle()}</h1>

        <div className="flex items-center gap-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className={`flex h-10 w-[270px] items-center gap-2.5 rounded-full border bg-transparent px-4 transition-colors ${isSearchOpen ? 'border-[#8348C1]/70' : 'border-white/10'}`}>
              <button type="submit" className="flex h-5 w-5 items-center justify-center text-white/40 transition-colors hover:text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            <input 
              type="text" 
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => window.setTimeout(() => setIsSearchOpen(false), 120)}
              placeholder="Пошук" 
              className="bg-transparent border-none outline-none text-[13px] text-white/90 w-full placeholder:text-white/30 font-montserrat"
            />
            </div>

            {isSearchOpen && searchValue.trim() && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-[100] w-[360px] overflow-hidden rounded-[20px] border border-[#8348C1]/35 bg-[#050506] shadow-[0_18px_60px_rgba(0,0,0,0.55),0_0_28px_rgba(131,72,193,0.18)]">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.path}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSearchSelect(result)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                          {result.type === "asset" && result.coin?.imgUrl ? (
                            <img src={result.coin.imgUrl} alt={result.coin.symbol} className="h-6 w-6 rounded-full object-contain" />
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A3A4B0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 12h18M3 6h18M3 18h18" />
                            </svg>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-white">{result.label}</span>
                          <span className="block truncate text-[11px] text-[#A3A4B0]">{result.description}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-5 text-center text-[13px] text-[#A3A4B0]">
                    Нічого не знайдено
                  </div>
                )}
              </div>
            )}
          </form>
          
          {/* ── Notification Bell ─────────────────────────────────── */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={openNotifications}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full border bg-transparent transition-all duration-300 hover:bg-white/5 ${
                unreadCount > 0
                  ? "border-[#8348C1]/70 shadow-[0_0_14px_rgba(131,72,193,0.55)]"
                  : "border-white/10"
              }`}
            >
              <img src={notificationsIcon} alt="Сповіщення" className="h-5 w-5 opacity-70" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#8348C1] px-[3px] text-[9px] font-bold text-white shadow-[0_0_6px_rgba(131,72,193,0.7)]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 top-[calc(100%+12px)] z-[200] w-[360px] overflow-hidden rounded-[20px] border border-[#8348C1]/30 bg-[#050506] shadow-[0_18px_60px_rgba(0,0,0,0.6),0_0_28px_rgba(131,72,193,0.15)]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                  <span className="text-[15px] font-semibold text-white">Сповіщення</span>
                  {notifItems.length > 0 && (
                    <span className="text-[11px] text-[#A3A4B0]">{notifItems.length} подій</span>
                  )}
                </div>

                {/* Content */}
                {notifLoad ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#8348C1]/30 border-t-[#8348C1]" />
                  </div>
                ) : notifItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-10">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#A3A4B0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span className="text-[13px] text-[#A3A4B0]">Немає нових сповіщень</span>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifItems.map(n => {
                      const dest = n.id.startsWith("alert_") ? "/alerts" : "/trading";
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => { navigate(dest); setShowNotif(false); }}
                          className="flex w-full cursor-pointer items-start gap-3 border-b border-white/[0.04] px-5 py-3.5 text-left last:border-0 transition-colors hover:bg-white/[0.05] active:bg-white/[0.08]"
                        >
                          <span className="mt-0.5 shrink-0 text-[18px]">{n.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-white">{n.title}</p>
                            <p className="truncate text-[11px] text-[#A3A4B0]">{n.subtitle}</p>
                          </div>
                          <div className="mt-0.5 flex shrink-0 flex-col items-end gap-1">
                            {n.ts > 0 && (
                              <span className="text-[10px] text-[#A3A4B0]/60">{fmtRelTime(n.ts)}</span>
                            )}
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#A3A4B0" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M2 5h6M5 2l3 3-3 3" />
                            </svg>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowLogoutModal(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-transparent hover:bg-white/5 transition-colors cursor-pointer"
          >
            <img src={logOutIcon} alt="Вихід" className="h-5 w-5 opacity-70" />
          </button>
        </div>
      </header>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm font-montserrat transition-opacity">
          <div className="w-[400px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] p-[1px] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
            <div className="rounded-[28px] bg-[#050506] p-8 text-center">
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] p-[1px]">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-[#050506]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A3A4B0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </div>
              </div>
              <h2 className="text-[22px] text-white font-medium mb-2">Вийти з акаунта?</h2>
              <p className="text-[14px] text-[#A3A4B0] mb-8">Вам доведеться знову ввести свої дані для входу в систему.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowLogoutModal(false)} className="group relative flex h-[44px] flex-1 items-center justify-center rounded-[28px] text-[13px] font-medium text-white transition-transform hover:scale-105 cursor-pointer">
                  <svg
                    className="absolute inset-0 h-full w-full pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="1"
                      y="1"
                      width="calc(100% - 2px)"
                      height="42"
                      rx="21"
                      fill="none"
                      stroke="url(#logout-cancel-border)"
                      strokeWidth="1.5"
                    />
                    <defs>
                      <linearGradient
                        id="logout-cancel-border"
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

                  <span className="relative z-10">Скасувати</span>
                </button>
                <button onClick={handleLogout} className="flex h-[44px] flex-1 items-center justify-center rounded-[28px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-[13px] font-medium text-white transition-transform hover:scale-105 cursor-pointer">Вийти</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
