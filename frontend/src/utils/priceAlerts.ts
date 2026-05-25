import { supabase } from "../supabaseClient";

export type PriceAlertCondition =
  | "price_gt"
  | "price_gte"
  | "price_lt"
  | "price_lte"
  | "price_eq"
  | "pct_change_24h_gt"
  | "pct_change_24h_lt"
  | "rsi_gt"
  | "rsi_lt"
  | "ema20_cross_up"
  | "ema20_cross_down"
  | "ema50_cross_up"
  | "ema50_cross_down"
  | "volume_spike_gt"
  | "trailing_stop_pct"
  | "golden_cross"
  | "death_cross"
  | "bb_upper_break"
  | "bb_lower_break"
  | "new_ath"
  | "vol_24h_gt"
  | "macd_cross_up"
  | "macd_cross_down";

// Conditions that do not require a numeric target (crossover events, ATH, etc.)
export const NO_VALUE_CONDITIONS = new Set<PriceAlertCondition>([
  "ema20_cross_up",
  "ema20_cross_down",
  "ema50_cross_up",
  "ema50_cross_down",
  "golden_cross",
  "death_cross",
  "bb_upper_break",
  "bb_lower_break",
  "new_ath",
  "macd_cross_up",
  "macd_cross_down",
]);

export type PriceAlertRecord = {
  id: string;
  user_id: string | null;
  symbol: string;
  condition: PriceAlertCondition;
  target_price: number;
  is_active: boolean | null;
  max_triggers: number | null;   // null = unlimited; 1 = once; 2 = twice; etc.
  trigger_count: number;         // how many times it has already fired
};

const tableName = "alerts";

export const normalizeAlertSymbol = (symbol: string) => symbol.trim().toUpperCase();

export const getAlertConditionLabel = (condition: string) => {
  const labels: Record<string, string> = {
    price_gt:           "Ціна більше ніж",
    price_gte:          "Ціна більше або =",
    price_lt:           "Ціна менше ніж",
    price_lte:          "Ціна менше або =",
    price_eq:           "Ціна дорівнює",
    pct_change_24h_gt:  "24h зростання >",
    pct_change_24h_lt:  "24h падіння >",
    rsi_gt:             "RSI перевищить",
    rsi_lt:             "RSI опуститься нижче",
    ema20_cross_up:     "Ціна перетне EMA20 ↑",
    ema20_cross_down:   "Ціна перетне EMA20 ↓",
    ema50_cross_up:     "Ціна перетне EMA50 ↑",
    ema50_cross_down:   "Ціна перетне EMA50 ↓",
    volume_spike_gt:    "Сплеск об'єму ×",
    trailing_stop_pct:  "Trailing stop",
    golden_cross:       "Золотий хрест (MA50/MA200)",
    death_cross:        "Смертний хрест (MA50/MA200)",
    bb_upper_break:     "Пробиття верхньої BB",
    bb_lower_break:     "Пробиття нижньої BB",
    new_ath:            "Новий ATH",
    vol_24h_gt:         "Об'єм 24h більше",
    macd_cross_up:      "MACD перетинає сигнал ↑",
    macd_cross_down:    "MACD перетинає сигнал ↓",
  };
  return labels[condition] ?? "Ціна більше або =";
};

export const getAlertConditionShortLabel = (condition: string) => {
  const labels: Record<string, string> = {
    price_gt:           "Вище",
    price_gte:          "Вище або =",
    price_lt:           "Нижче",
    price_lte:          "Нижче або =",
    price_eq:           "Дорівнює",
    pct_change_24h_gt:  "24h +%",
    pct_change_24h_lt:  "24h -%",
    rsi_gt:             "RSI ↑",
    rsi_lt:             "RSI ↓",
    ema20_cross_up:     "EMA20 ↑",
    ema20_cross_down:   "EMA20 ↓",
    ema50_cross_up:     "EMA50 ↑",
    ema50_cross_down:   "EMA50 ↓",
    volume_spike_gt:    "Vol ×",
    trailing_stop_pct:  "Trailing",
    golden_cross:       "Золотий хрест",
    death_cross:        "Смертний хрест",
    bb_upper_break:     "BB верх ↑",
    bb_lower_break:     "BB низ ↓",
    new_ath:            "Новий ATH",
    vol_24h_gt:         "Vol 24h >",
    macd_cross_up:      "MACD ↑",
    macd_cross_down:    "MACD ↓",
  };
  return labels[condition] ?? "Вище або =";
};

export const getAlertConditionUnit = (condition: string) => {
  if (["pct_change_24h_gt", "pct_change_24h_lt", "trailing_stop_pct"].includes(condition)) return "%";
  if (condition === "volume_spike_gt") return "×";
  if (condition === "vol_24h_gt") return "USD";
  if (["rsi_gt", "rsi_lt"].includes(condition)) return "";
  if (NO_VALUE_CONDITIONS.has(condition as PriceAlertCondition)) return "";
  return "USDT";
};

export const getAlertConditionDescription = (condition: string): string => {
  const desc: Record<string, string> = {
    price_gt:           "Сповіщення, коли ціна перетне зазначений рівень вгору",
    price_gte:          "Сповіщення, коли ціна досягне або перевищить значення",
    price_lt:           "Сповіщення, коли ціна впаде нижче зазначеного рівня",
    price_lte:          "Сповіщення, коли ціна опуститься до або нижче значення",
    price_eq:           "Сповіщення при досягненні точного цінового рівня",
    pct_change_24h_gt:  "Зростання за 24h перевищує вказаний % відносно відкриття доби",
    pct_change_24h_lt:  "Падіння за 24h перевищує вказаний % відносно відкриття доби",
    rsi_gt:             "RSI(14) на 4h свічках перевищить вказане значення — зона перекупленості",
    rsi_lt:             "RSI(14) опуститься нижче вказаного — зона перепроданості",
    ema20_cross_up:     "Ціна закриється вище EMA20 — потенційний бичачий сигнал",
    ema20_cross_down:   "Ціна закриється нижче EMA20 — потенційний ведмежий сигнал",
    ema50_cross_up:     "Ціна перетне EMA50 знизу вгору — середньострокова тенденція",
    ema50_cross_down:   "Ціна перетне EMA50 зверху вниз — середньострокова тенденція",
    volume_spike_gt:    "Поточний обсяг перевищує середній у X разів — незвичайна активність",
    trailing_stop_pct:  "Сповіщення, якщо ціна відкочується від локального максимуму на X%",
    golden_cross:       "MA50 перетинає MA200 вгору — класичний бичачий сигнал (щотижневий TF)",
    death_cross:        "MA50 перетинає MA200 вниз — класичний ведмежий сигнал (щотижневий TF)",
    bb_upper_break:     "Ціна закривається вище верхньої смуги Боллінджера (2σ) — сигнал прориву",
    bb_lower_break:     "Ціна закривається нижче нижньої смуги Боллінджера (2σ) — сигнал слабкості",
    new_ath:            "Актив встановлює новий абсолютний максимум ціни",
    vol_24h_gt:         "Добовий обсяг торгів (у USD) перевищує вказане значення",
    macd_cross_up:      "Лінія MACD перетинає сигнальну лінію вгору — потенційний старт тренду",
    macd_cross_down:    "Лінія MACD перетинає сигнальну лінію вниз — потенційна зміна тренду",
  };
  return desc[condition] ?? "";
};

const ALERT_SELECT     = "id, user_id, symbol, condition, target_price, is_active, max_triggers, trigger_count";
const ALERT_SELECT_OLD = "id, user_id, symbol, condition, target_price, is_active";

const normalizeRow = (r: Record<string, unknown>): PriceAlertRecord => ({
  ...(r as PriceAlertRecord),
  trigger_count: (r.trigger_count as number) ?? 0,
  max_triggers:  (r.max_triggers  as number | null) ?? null,
});

export const listUserPriceAlerts = async (userId: string) => {
  const { data, error } = await supabase
    .from(tableName)
    .select(ALERT_SELECT)
    .eq("user_id", userId)
    .order("symbol", { ascending: true });

  if (error) {
    // Columns might not exist yet — fall back to old select so alerts still show
    const { data: fallback, error: fbErr } = await supabase
      .from(tableName)
      .select(ALERT_SELECT_OLD)
      .eq("user_id", userId)
      .order("symbol", { ascending: true });
    if (fbErr) throw fbErr;
    return (fallback || []).map(r => normalizeRow(r as Record<string, unknown>));
  }

  return (data || []).map(r => normalizeRow(r as Record<string, unknown>));
};

export const createPriceAlert = async ({
  userId,
  symbol,
  condition,
  targetPrice,
  maxTriggers = null,
}: {
  userId: string;
  symbol: string;
  condition: PriceAlertCondition;
  targetPrice: number;
  maxTriggers?: number | null;
}) => {
  const baseRow = {
    id: crypto.randomUUID(),
    user_id: userId,
    symbol: normalizeAlertSymbol(symbol),
    condition,
    target_price: targetPrice,
    is_active: true,
  };

  // Try insert with new columns
  const { data, error } = await supabase
    .from(tableName)
    .insert({ ...baseRow, max_triggers: maxTriggers, trigger_count: 0 })
    .select(ALERT_SELECT)
    .single();

  if (error) {
    // Fallback: columns don't exist yet — insert without them
    const { data: fb, error: fbErr } = await supabase
      .from(tableName)
      .insert(baseRow)
      .select(ALERT_SELECT_OLD)
      .single();
    if (fbErr) throw fbErr;
    return normalizeRow(fb as Record<string, unknown>);
  }

  return normalizeRow(data as Record<string, unknown>);
};

export const updatePriceAlert = async ({
  userId,
  id,
  condition,
  targetPrice,
  maxTriggers,
}: {
  userId: string;
  id: string;
  condition: PriceAlertCondition;
  targetPrice: number;
  maxTriggers?: number | null;
}) => {
  const patch: Record<string, unknown> = { condition, target_price: targetPrice };
  if (maxTriggers !== undefined) patch.max_triggers = maxTriggers;

  const { data, error } = await supabase
    .from(tableName)
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId)
    .select(ALERT_SELECT)
    .single();

  if (error) throw error;
  return normalizeRow(data as Record<string, unknown>);
};

/** Called each time an alert fires — increments counter and deactivates when limit reached. */
export const recordAlertTrigger = async (userId: string, alert: PriceAlertRecord) => {
  const newCount = (alert.trigger_count ?? 0) + 1;
  const shouldDeactivate = alert.max_triggers != null && newCount >= alert.max_triggers;
  const { error } = await supabase
    .from(tableName)
    .update({
      trigger_count: newCount,
      ...(shouldDeactivate ? { is_active: false } : {}),
    })
    .eq("id", alert.id)
    .eq("user_id", userId);
  if (error) throw error;
  return { newCount, shouldDeactivate };
};

export const removePriceAlert = async (userId: string, id: string) => {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
};

export const togglePriceAlert = async (userId: string, id: string, isActive: boolean) => {
  const { error } = await supabase
    .from(tableName)
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
};

export const updateAlertTargetPrice = async (userId: string, id: string, targetPrice: number) => {
  const { error } = await supabase
    .from(tableName)
    .update({ target_price: targetPrice })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
};
