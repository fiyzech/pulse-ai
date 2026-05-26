import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import editIcon from "../../assets/icons/pencil-edit.svg";
import trashIcon from "../../assets/icons/trash.svg";
import alarm from "../../assets/icons/alarm.svg";
import question from "../../assets/icons/question-mark.svg";
import telegramIcon from "../../assets/icons/telegram.svg";
import arrowRightIcon from "../../assets/icons/arrow_right.svg";
import checkBigIcon from "../../assets/icons/check_big.svg";
import crossBigIcon from "../../assets/icons/cross_big.svg";
import checkIcon from "../../assets/icons/check.svg";
import { getAuthenticatedUserId } from "../../utils/favoriteAssets";
import {
  getAlertConditionShortLabel,
  listUserPriceAlerts,
  removePriceAlert,
  updatePriceAlert,
} from "../../utils/priceAlerts";
import type { PriceAlertCondition, PriceAlertRecord } from "../../utils/priceAlerts";
import { BOT_URL, fetchTelegramStatus, openTelegramBot } from "../../utils/telegram";

const tableGrid =
   "grid grid-cols-[1.1fr_1.15fr_0.95fr_0.9fr_0.75fr_120px]";

const conditionOptions: Array<{ value: PriceAlertCondition; label: string }> = [
  { value: "price_gt",           label: "↑ Ціна перетне вгору" },
  { value: "price_gte",          label: "≥ Ціна вище або рівна" },
  { value: "price_lt",           label: "↓ Ціна впаде нижче" },
  { value: "price_lte",          label: "≤ Ціна нижче або рівна" },
  { value: "price_eq",           label: "= Ціна точно дорівнює" },
  { value: "pct_change_24h_gt",  label: "📈 24h зростання > X%" },
  { value: "pct_change_24h_lt",  label: "📉 24h падіння > X%" },
  { value: "rsi_gt",             label: "RSI(14) перевищить X — перекупленість" },
  { value: "rsi_lt",             label: "RSI(14) впаде нижче X — перепроданість" },
  { value: "ema20_cross_up",     label: "EMA20 — ціна перетне вгору" },
  { value: "ema20_cross_down",   label: "EMA20 — ціна перетне вниз" },
  { value: "ema50_cross_up",     label: "EMA50 — ціна перетне вгору" },
  { value: "ema50_cross_down",   label: "EMA50 — ціна перетне вниз" },
  { value: "golden_cross",       label: "⭐ Золотий хрест MA50/MA200" },
  { value: "death_cross",        label: "☠ Смертний хрест MA50/MA200" },
  { value: "macd_cross_up",      label: "MACD перетинає сигнал ↑" },
  { value: "macd_cross_down",    label: "MACD перетинає сигнал ↓" },
  { value: "bb_upper_break",     label: "Пробиття верхньої BB (2σ)" },
  { value: "bb_lower_break",     label: "Пробиття нижньої BB (2σ)" },
  { value: "volume_spike_gt",    label: "Сплеск обсягу × X" },
  { value: "vol_24h_gt",         label: "Об'єм 24h > X USD" },
  { value: "new_ath",            label: "🏆 Новий ATH" },
  { value: "trailing_stop_pct",  label: "Trailing stop X%" },
];

const knownAssetMeta: Record<string, { icon: string; color: string }> = {
  BTC: { icon: "/Bitcoin.svg", color: "bg-orange-500" },
  ETH: { icon: "/Ethereum.svg", color: "bg-purple-500" },
  USDT: { icon: "/Tether.svg", color: "bg-[#4B5563]" },
  SOL: { icon: "https://cryptologos.cc/logos/solana-sol-logo.png", color: "bg-[#14F195]" },
  BNB: { icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png", color: "bg-[#F3BA2F]" },
  XRP: { icon: "https://cryptologos.cc/logos/xrp-xrp-logo.png", color: "bg-white" },
  AVAX: { icon: "https://cryptologos.cc/logos/avalanche-avax-logo.png", color: "bg-[#E84142]" },
  DOGE: { icon: "https://cryptologos.cc/logos/dogecoin-doge-logo.png", color: "bg-[#F3C623]" },
};

const getBinancePair = (symbol: string) => {
  const normalized = symbol.toUpperCase();
  if (normalized === "USDT" || normalized === "USDC") return "USDCUSDT";
  return `${normalized}USDT`;
};

const formatMoney = (value: number | null | undefined) => {
  if (!Number.isFinite(value || NaN) || !value) return "---";
  if (value < 1) return `$${value.toFixed(6)}`;
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: value >= 100 ? 2 : 4,
  })}`;
};

const sanitizePositiveDecimal = (value: string) => {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  const [whole = "", ...rest] = normalized.split(".");
  const decimal = rest.join("");
  return rest.length > 0 ? `${whole}.${decimal}` : whole;
};

const parseTargetPrice = (value: string) => {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d*\.?\d+$/.test(normalized)) return NaN;
  return Number(normalized);
};

export default function AlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<PriceAlertRecord[]>([]);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCondition, setEditCondition] = useState<PriceAlertCondition>("price_gte");
  const [editPrice, setEditPrice] = useState("");
  const [telegramConnected, setTelegramConnected] = useState<boolean | null>(null);

  const loadAlerts = useCallback(async () => {
    setError("");
    setMessage("");

    try {
      setLoading(true);
      const userId = await getAuthenticatedUserId();

      if (!userId) {
        setAlerts([]);
        setError("Увійдіть в акаунт, щоб бачити свої алерти.");
        return;
      }

      const rows = await listUserPriceAlerts(userId);
      setAlerts(rows);
      // Check Telegram connection status
      fetchTelegramStatus(userId).then(setTelegramConnected).catch(() => setTelegramConnected(false));
    } catch (loadError) {
      console.error("Помилка завантаження алертів:", loadError);
      setError("Не вдалося завантажити алерти. Перевірте таблицю alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAlerts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAlerts]);

  useEffect(() => {
    let active = true;

    const fetchPrices = async () => {
      const symbols = Array.from(new Set(alerts.map((item) => item.symbol.toUpperCase())));
      if (symbols.length === 0) {
        setCurrentPrices({});
        return;
      }

      const pairs = symbols.map(getBinancePair);

      try {
        const results = await Promise.all(
          pairs.map(async (pair, index) => {
            const response = await fetch(`/api/binance/ticker/24hr?symbol=${pair}`);
            if (!response.ok) return [symbols[index], 0] as const;
            const data = await response.json() as { lastPrice?: string };
            return [symbols[index], Number(data.lastPrice || 0)] as const;
          }),
        );

        if (active) setCurrentPrices(Object.fromEntries(results));
      } catch (priceError) {
        console.error("Помилка завантаження поточних цін алертів:", priceError);
      }
    };

    void fetchPrices();
    const intervalId = window.setInterval(fetchPrices, 15000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [alerts]);

  const stats = useMemo(() => {
    const activeAlerts = alerts.filter((item) => item.is_active !== false).length;
    const firedTotal   = alerts.reduce((s, a) => s + (a.trigger_count ?? 0), 0);
    const tgStatus = telegramConnected === null ? "..." : telegramConnected ? " Підключено" : " Не підключено";

    return [
      { title: "Активні алерти",     value: String(activeAlerts), icon: alarm },
      { title: "Разів спрацювало",   value: String(firedTotal) },
      { title: "Telegram",           value: tgStatus },
      { title: "Останнє сповіщення", value: activeAlerts > 0 ? "Очікується" : "---" },
    ];
  }, [alerts, telegramConnected]);

  const startEdit = (alert: PriceAlertRecord) => {
    setEditingId(alert.id);
    setEditCondition(alert.condition);
    setEditPrice(String(alert.target_price));
    setError("");
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPrice("");
    setMessage("");
    setError("");
  };

  const saveEdit = async (alert: PriceAlertRecord) => {
    const targetPrice = parseTargetPrice(editPrice);
    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      setError("Введіть коректне значення ціни.");
      return;
    }

    try {
      setPendingId(alert.id);
      const userId = await getAuthenticatedUserId();
      if (!userId) {
        setError("Увійдіть в акаунт, щоб редагувати алерти.");
        return;
      }

      const updated = await updatePriceAlert({
        userId,
        id: alert.id,
        condition: editCondition,
        targetPrice,
      });

      setAlerts((prev) => prev.map((item) => item.id === alert.id ? updated : item));
      setEditingId(null);
      setMessage("Алерт оновлено.");
    } catch (saveError) {
      console.error("Помилка оновлення алерту:", saveError);
      setError("Не вдалося оновити алерт.");
    } finally {
      setPendingId(null);
    }
  };

  const deleteAlert = async (alert: PriceAlertRecord) => {
    try {
      setPendingId(alert.id);
      const userId = await getAuthenticatedUserId();
      if (!userId) {
        setError("Увійдіть в акаунт, щоб видаляти алерти.");
        return;
      }

      await removePriceAlert(userId, alert.id);
      setAlerts((prev) => prev.filter((item) => item.id !== alert.id));
      setMessage("Алерт видалено.");
    } catch (deleteError) {
      console.error("Помилка видалення алерту:", deleteError);
      setError("Не вдалося видалити алерт.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="w-full px-[40px] pt-[24px] pb-8 text-white font-montserrat">
      <div className="flex justify-between items-start mb-[24px]">
        <p className="text-white text-[16px] leading-[28px] max-w-[546px] font-normal">
          Створюйте алерти на сайті та отримуйте сповіщення в Telegram,
          коли задана умова буде виконана
        </p>

        <div className="relative group">
          <button className="flex items-center gap-[10px] text-white text-[16px] leading-[28px] font-medium transition-all duration-300 cursor-pointer">
            Як створити алерт
            <img src={question} alt="Question" className="w-[18px] h-[18px]" />
          </button>

          <div className="absolute right-0 top-[58px] z-50 w-[288px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out">
            <div className="rounded-[28px] bg-[#050506] px-[24px] py-[24px]">
              <p className="text-[#A3A4B0] text-[14px] leading-[17px] font-normal">
                Перейдіть у розділ Торгівля → вкладка "Алерти" і створіть алерт з розширеними умовами.
                Після цього він автоматично з'явиться на цій сторінці.
              </p>
            </div>
          </div>
        </div>
      </div>

      {(error || message) && (
        <div className="mb-5 rounded-[18px] border border-[#25DE28]/30 bg-[#25DE28]/10 px-5 py-3 text-[13px] text-[#25DE28] shadow-[0_0_24px_rgba(37,222,40,0.12)]">
          {error || message}
        </div>
      )}

      <div className="grid grid-cols-4 gap-[24px] mb-[24px] w-full">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="h-[110px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_80px_rgba(131,72,193,0.19),0_8px_25px_rgba(0,0,0,0.5)]"
          >
            <div className="relative h-full rounded-[28px] bg-[#050506] p-5 text-center overflow-hidden flex flex-col items-center justify-center">
              <p className="text-white text-[14px] font-normal">{stat.title}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <h2 className="text-[28px] leading-none font-medium text-white">{stat.value}</h2>
                {stat.icon && <img src={stat.icon} alt="" className="w-5 h-5" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
        <div className="rounded-[28px] bg-[#050506] overflow-hidden">
            <div className={`relative ${tableGrid} items-center px-[24px] h-[57px] text-[#A3A4B0] text-[14px] font-normal bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)]`}>
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))]" />
              <span className="leading-none">Актив</span>
              <span className="leading-none">Умова</span>
              <span className="leading-none">Поточна ціна</span>
              <span className="leading-none">Статус</span>
              <span className="leading-none">Спрацювань</span>
              <span className="justify-self-center leading-none">Дії</span>
            </div>

            {loading ? (
              <div className="px-6 py-12 text-center text-[14px] text-[#A3A4B0]">Завантаження алертів...</div>
            ) : alerts.length === 0 ? (
              <div className="px-6 py-12 text-center text-[14px] text-[#A3A4B0]">Поки немає створених алертів</div>
            ) : (
              alerts.map((alert, index) => {
                const symbol = alert.symbol.toUpperCase();
                const meta = knownAssetMeta[symbol];
                const isEditing = editingId === alert.id;

                return (
                  <React.Fragment key={alert.id}>
                    <div
                      className={`group/alert-row ${tableGrid} h-[84px] cursor-pointer items-center px-6 transition-all duration-300 ease-out hover:bg-white/[0.035]`}
                      onClick={() => navigate(`/trading/${symbol}`)}                      
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ${meta?.color || "bg-[#8348C1]"}`}>
                          {meta?.icon ? (
                            <img src={meta.icon} alt={symbol} className="h-7 w-7 object-contain" />
                          ) : (
                            <span className="text-[11px] font-bold text-white">{symbol.slice(0, 2)}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-medium leading-none text-white">{symbol}/USDT</p>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="min-w-0 p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]" onClick={(event) => event.stopPropagation()}>
                          <select
                            value={editCondition}
                            onChange={(event) => setEditCondition(event.target.value as PriceAlertCondition)}
                            className="h-[38px] w-full min-w-0 rounded-[28px] bg-[#050506] px-[16px] text-[12px] text-white outline-none"
                          >
                            {conditionOptions.map((option) => (
                              <option key={option.value} value={option.value} className="bg-[#050506]">
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <p className="truncate text-[14px] font-normal leading-none text-white/90">
                          {getAlertConditionShortLabel(alert.condition)} {formatMoney(alert.target_price)}
                        </p>
                      )}

                      {isEditing ? (
                        <div className="min-w-0 p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]" onClick={(event) => event.stopPropagation()}>
                          <input
                            value={editPrice}
                            inputMode="decimal"
                            min="0"
                            onChange={(event) => setEditPrice(sanitizePositiveDecimal(event.target.value))}
                            className="h-[38px] w-full min-w-0 rounded-full bg-[#050506] px-[16px] text-[14px] text-white outline-none"
                          />
                        </div>
                      ) : (
                        <p className="truncate text-[14px] font-normal leading-none text-white/90">{formatMoney(currentPrices[symbol])}</p>
                      )}

                      <div className="flex items-center">
                        <span className={`inline-flex h-7 w-[112px] items-center justify-center gap-2 rounded-full text-[12px] font-medium leading-none ${alert.is_active === false ? "bg-white/[0.08] text-[#A3A4B0]" : "bg-[#25DE28]/10 text-[#25DE28]"}`}>
                          <span className={`h-2 w-2 shrink-0 rounded-full ${alert.is_active === false ? "bg-[#A3A4B0]" : "bg-[#25DE28]"}`} />
                          {alert.is_active === false ? "Вимкнений" : "Активний"}
                        </span>
                      </div>

                      {/* Trigger count */}
                      <div className="font-mono text-[14px] leading-none text-white/65">
                        {alert.max_triggers != null
                          ? <span>{alert.trigger_count ?? 0}<span className="text-white/30">/{alert.max_triggers}</span></span>
                          : <span>{alert.trigger_count ?? 0}<span className="text-white/30">×</span></span>
                        }
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              disabled={pendingId === alert.id}
                              onClick={(event) => {
                                event.stopPropagation();
                                saveEdit(alert);
                              }}
                              className="group relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full p-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_12px_rgba(37,222,40,0.22)] active:scale-95 disabled:opacity-60"
                            >
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#050506] transition-all duration-300 group-hover:bg-[#071407]">
                                <img src={checkBigIcon} alt="" className="h-4 w-4 transition-all duration-300 group-hover:scale-105 group-hover:brightness-125" />
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                cancelEdit();
                              }}
                              className="group relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full p-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))] transition-all duration-300 hover:scale-105 hover:bg-[linear-gradient(90deg,rgba(244,0,0,0.28),rgba(244,0,0,0.18))] hover:shadow-[0_0_12px_rgba(244,0,0,0.18)] active:scale-95"
                            >
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#050506] transition-all duration-300 group-hover:bg-[#140707]">
                                <img src={crossBigIcon} alt="" className="h-4 w-4 transition-all duration-300 group-hover:scale-105 group-hover:brightness-125" />
                              </div>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                startEdit(alert);
                              }}
                              className="group relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full p-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_12px_rgba(131,72,193,0.28)] active:scale-95"
                            >
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#050506] transition-all duration-300 group-hover:bg-[#0B0B0D]">
                                <img src={editIcon} alt="" className="h-4 w-4 transition-all duration-300 group-hover:scale-105 group-hover:brightness-125" />
                              </div>
                            </button>

                            <button
                              type="button"
                              disabled={pendingId === alert.id}
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteAlert(alert);
                              }}
                              className="group relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full p-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))] transition-all duration-300 hover:scale-105 hover:bg-[linear-gradient(90deg,rgba(244,0,0,0.28),rgba(244,0,0,0.18))] hover:shadow-[0_0_12px_rgba(244,0,0,0.18)] active:scale-95 disabled:opacity-60"
                            >
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#050506] transition-all duration-300 group-hover:bg-[#140707]">
                                <img src={trashIcon} alt="" className="h-4 w-4 transition-all duration-300 group-hover:scale-105 group-hover:brightness-125" />
                              </div>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {index !== alerts.length - 1 && (
                      <div className="px-6">
                        <div className="h-[1px] bg-[linear-gradient(90deg,rgba(82,46,139,0.26)_0%,rgba(179,179,179,0.05)_100%)]" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            )}
        </div>
      </div>

      <div className="mt-[24px] flex flex-col items-start gap-3">
        {telegramConnected === false && (
          <div className="w-fit p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-3 rounded-[28px] bg-[#050506] px-5 py-3">
              <div className="flex h-[28px] w-[28px] shrink-0 items-center justify-center">
                <img src={telegramIcon} alt="" className="h-[18px] w-[18px] object-contain" />
              </div>

              <div>
                <p className="text-[13px] font-semibold text-white">Підключіть Telegram для сповіщень</p>
                <p className="text-[11px] text-[#A3A4B0]">Отримуйте миттєві сповіщення про спрацювання алертів у боті</p>
              </div>
             
              <button
                type="button"
                onClick={openTelegramBot}
                className="ml-[12px] flex h-[44px] items-center justify-center gap-[8px] rounded-[28px] bg-[linear-gradient(90deg,rgb(44,25,105)_0%,rgb(131,72,193)_50%,rgb(195,139,255)_100%)] px-[24px] text-[14px] font-medium text-white transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <span>Відкрити бот</span>
                <img src={arrowRightIcon} alt="" className="h-[16px] w-[16px] object-contain" />
              </button>
            </div>
          </div>
        )}
        {telegramConnected === true && (
          <p className="flex items-center gap-[8px] text-[13px] leading-5 text-[#A3A4B0]">
            <img src={checkIcon} alt="" className="h-[16px] w-[16px] object-contain" />

            <span className="flex items-center gap-[4px]">
              Telegram підключено · Сповіщення надходять до{" "}
              <a href={BOT_URL} target="_blank" rel="noopener noreferrer" className="text-[#8348C1] hover:text-[#C38BFF] underline">
                @Crypto_Pulse_Official_Bot
              </a>
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
