import { supabase } from "../supabaseClient";

export type FavoriteAssetPayload = {
  coinId: string;
  symbol: string;
  name: string;
  imageUrl: string;
};

export type FavoriteAssetRecord = {
  id: number;
  user_id: string;
  coin_id: string;
  symbol: string;
  name: string;
  image_url: string;
  created_at: string;
};

const tableName = "user_favorites";

export const normalizeFavoriteSymbol = (symbol: string) => symbol.trim().toUpperCase();

export const getAuthenticatedUserId = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) return session.user.id;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user.id;
};

export const listFavoriteAssets = async (userId: string) => {
  const { data, error } = await supabase
    .from(tableName)
    .select("id, user_id, coin_id, symbol, name, image_url, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as FavoriteAssetRecord[];
};

export const getFavoriteAsset = async (userId: string, symbol: string) => {
  const { data, error } = await supabase
    .from(tableName)
    .select("id, user_id, coin_id, symbol, name, image_url, created_at")
    .eq("user_id", userId)
    .eq("symbol", normalizeFavoriteSymbol(symbol))
    .maybeSingle();

  if (error) throw error;
  return data as FavoriteAssetRecord | null;
};

export const addFavoriteAsset = async (userId: string, payload: FavoriteAssetPayload) => {
  const symbol = normalizeFavoriteSymbol(payload.symbol);

  const { data, error } = await supabase
    .from(tableName)
    .upsert(
      {
        user_id: userId,
        coin_id: payload.coinId,
        symbol,
        name: payload.name || symbol,
        image_url: payload.imageUrl || "",
      },
      { onConflict: "user_id,symbol" },
    )
    .select("id, user_id, coin_id, symbol, name, image_url, created_at")
    .single();

  if (error) throw error;
  return data as FavoriteAssetRecord;
};

export const removeFavoriteAsset = async (userId: string, symbol: string) => {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq("user_id", userId)
    .eq("symbol", normalizeFavoriteSymbol(symbol));

  if (error) throw error;
};
