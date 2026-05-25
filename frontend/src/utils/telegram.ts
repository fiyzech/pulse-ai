import { supabase } from "../supabaseClient";

/** Official bot URL */
export const BOT_URL = "https://t.me/Crypto_Pulse_Official_Bot";

/** Opens the Telegram bot in a new tab */
export const openTelegramBot = () => window.open(BOT_URL, "_blank", "noopener,noreferrer");

/** Fetch whether the current user has connected their Telegram account */
export const fetchTelegramStatus = async (userId: string): Promise<boolean> => {
  const { data } = await supabase
    .from("users")
    .select("telegram_id")
    .eq("id", userId)
    .maybeSingle();
  return !!(data?.telegram_id);
};
