import { supabase } from "../supabaseClient";

export type PriceAlertCondition =
  | "price_gt"
  | "price_gte"
  | "price_lt"
  | "price_lte"
  | "price_eq";

export type PriceAlertRecord = {
  id: string;
  user_id: string | null;
  symbol: string;
  condition: PriceAlertCondition;
  target_price: number;
  is_active: boolean | null;
};

const tableName = "alerts";

export const normalizeAlertSymbol = (symbol: string) => symbol.trim().toUpperCase();

export const getAlertConditionLabel = (condition: string) => {
  if (condition === "price_gt") return "Ціна більше ніж";
  if (condition === "price_gte") return "Ціна більше або =";
  if (condition === "price_lt") return "Ціна менше ніж";
  if (condition === "price_lte") return "Ціна менше або =";
  if (condition === "price_eq") return "Ціна дорівнює";
  return "Ціна більше або =";
};

export const getAlertConditionShortLabel = (condition: string) => {
  if (condition === "price_gt") return "Вище";
  if (condition === "price_gte") return "Вище або =";
  if (condition === "price_lt") return "Нижче";
  if (condition === "price_lte") return "Нижче або =";
  if (condition === "price_eq") return "Дорівнює";
  return "Вище або =";
};

export const listUserPriceAlerts = async (userId: string) => {
  const { data, error } = await supabase
    .from(tableName)
    .select("id, user_id, symbol, condition, target_price, is_active")
    .eq("user_id", userId)
    .order("symbol", { ascending: true });

  if (error) throw error;
  return (data || []) as PriceAlertRecord[];
};

export const createPriceAlert = async ({
  userId,
  symbol,
  condition,
  targetPrice,
}: {
  userId: string;
  symbol: string;
  condition: PriceAlertCondition;
  targetPrice: number;
}) => {
  const { data, error } = await supabase
    .from(tableName)
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      symbol: normalizeAlertSymbol(symbol),
      condition,
      target_price: targetPrice,
      is_active: true,
    })
    .select("id, user_id, symbol, condition, target_price, is_active")
    .single();

  if (error) throw error;
  return data as PriceAlertRecord;
};

export const updatePriceAlert = async ({
  userId,
  id,
  condition,
  targetPrice,
}: {
  userId: string;
  id: string;
  condition: PriceAlertCondition;
  targetPrice: number;
}) => {
  const { data, error } = await supabase
    .from(tableName)
    .update({
      condition,
      target_price: targetPrice,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, user_id, symbol, condition, target_price, is_active")
    .single();

  if (error) throw error;
  return data as PriceAlertRecord;
};

export const removePriceAlert = async (userId: string, id: string) => {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
};
