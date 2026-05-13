import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import bookmarkPlusIcon from "../../assets/icons/bookmark-plus.svg";
import arrowUpOutlineIcon from "../../assets/icons/arrow-up-outline.svg";
import arrowDownOutlineIcon from "../../assets/icons/arrow-down-outline.svg";
import trashIcon from "../../assets/icons/trash.svg";
import eyeIcon from "../../assets/icons/eye.svg";
import {
  addFavoriteAsset,
  getAuthenticatedUserId,
  listFavoriteAssets,
  removeFavoriteAsset,
} from "../../utils/favoriteAssets";
import type { FavoriteAssetRecord } from "../../utils/favoriteAssets";

type FavoriteAssetView = {
  id: number;
  coinId: string;
  name: string;
  symbol: string;
  imageUrl: string;
  price: string;
  change: string;
  changeValue: number;
  isPositive: boolean;
  marketCap: string;
  volume: string;
  rawMcap: number;
  rawAth: number;
  rawCircSupply: number;
  rawTotalSupply: number;
  rawMaxSupply: number;
};

type BinanceTicker24h = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
};

type CoinGeckoMarketCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  market_cap: number | null;
  total_volume: number | null;
  ath: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
};

const tableGrid =
  "grid grid-cols-[1.2fr_0.9fr_0.85fr_1fr_0.75fr_88px]";

const recommendedAssets = [
  { coinId: "bitcoin", name: "Bitcoin", symbol: "BTC", imageUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.png" },
  { coinId: "ethereum", name: "Ethereum", symbol: "ETH", imageUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
  { coinId: "solana", name: "Solana", symbol: "SOL", imageUrl: "https://cryptologos.cc/logos/solana-sol-logo.png" },
  { coinId: "binancecoin", name: "BNB", symbol: "BNB", imageUrl: "https://cryptologos.cc/logos/bnb-bnb-logo.png" },
  { coinId: "ripple", name: "XRP", symbol: "XRP", imageUrl: "https://cryptologos.cc/logos/xrp-xrp-logo.png" },
  { coinId: "avalanche-2", name: "Avalanche", symbol: "AVAX", imageUrl: "https://cryptologos.cc/logos/avalanche-avax-logo.png" },
];

const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined) return "$0.00";
  if (price > 0 && price < 0.01) return `$${price}`;
  return `$${price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatChange = (change: number | null | undefined) => {
  const safeChange = change ?? 0;
  const fixed = safeChange.toFixed(1);
  return safeChange > 0 ? `+${fixed}%` : `${fixed}%`;
};

const formatCompactNumber = (num: number | null | undefined) => {
  if (!num) return "$0";
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString("en-US")}`;
};

const buildFallbackLogo = (symbol: string) =>
  `https://cryptologos.cc/logos/${symbol.toLowerCase()}-${symbol.toLowerCase()}-logo.png`;

const mapFavoritesToRows = (
  favorites: FavoriteAssetRecord[],
  binanceData: BinanceTicker24h[],
  cgData: CoinGeckoMarketCoin[],
): FavoriteAssetView[] => {
  const binanceByPair = new Map(binanceData.map((item) => [item.symbol, item]));
  const cgById = new Map(cgData.map((coin) => [coin.id, coin]));
  const cgBySymbol = new Map(cgData.map((coin) => [coin.symbol.toUpperCase(), coin]));

  return favorites.map((favorite) => {
    const symbol = favorite.symbol.toUpperCase();
    const ticker = binanceByPair.get(`${symbol}USDT`);
    const cg = cgById.get(favorite.coin_id) || cgBySymbol.get(symbol);
    const changeValue = Number(ticker?.priceChangePercent ?? cg?.price_change_percentage_24h ?? 0);
    const price = Number(ticker?.lastPrice ?? cg?.current_price ?? 0);
    const volume = Number(ticker?.quoteVolume ?? cg?.total_volume ?? 0);

    return {
      id: favorite.id,
      coinId: favorite.coin_id,
      name: favorite.name || cg?.name || symbol,
      symbol,
      imageUrl: favorite.image_url || cg?.image || buildFallbackLogo(symbol),
      price: formatPrice(price),
      change: formatChange(changeValue),
      changeValue,
      isPositive: changeValue >= 0,
      marketCap: formatCompactNumber(cg?.market_cap ?? 0),
      volume: formatCompactNumber(volume),
      rawMcap: cg?.market_cap || 0,
      rawAth: cg?.ath || 0,
      rawCircSupply: cg?.circulating_supply || 0,
      rawTotalSupply: cg?.total_supply || 0,
      rawMaxSupply: cg?.max_supply || 0,
    };
  });
};

export default function FavoritesContent() {
  const navigate = useNavigate();
  const [favoriteAssets, setFavoriteAssets] = useState<FavoriteAssetView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingSymbol, setPendingSymbol] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const userId = await getAuthenticatedUserId();

      if (!userId) {
        setFavoriteAssets([]);
        setError("Увійдіть в акаунт, щоб бачити свої обрані активи.");
        return;
      }

      const favorites = await listFavoriteAssets(userId);

      if (favorites.length === 0) {
        setFavoriteAssets([]);
        return;
      }

      const ids = Array.from(new Set(favorites.map((asset) => asset.coin_id).filter(Boolean))).join(",");

      const [binanceRes, cgRes] = await Promise.all([
        fetch("/api/binance/ticker/24hr"),
        ids
          ? fetch(`/api/coingecko/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids)}&sparkline=false`)
          : Promise.resolve(null),
      ]);

      const binanceData = binanceRes.ok ? ((await binanceRes.json()) as BinanceTicker24h[]) : [];
      const cgData = cgRes && cgRes.ok ? ((await cgRes.json()) as CoinGeckoMarketCoin[]) : [];

      setFavoriteAssets(mapFavoritesToRows(favorites, binanceData, cgData));
      sessionStorage.setItem("pulse_user_favorites", JSON.stringify(favorites));
    } catch (err) {
      console.error("Помилка завантаження обраного:", err);
      setError("Не вдалося завантажити обране. Перевірте таблицю user_favorites.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFavorites();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadFavorites]);

  const stats = useMemo(() => {
    const growing = favoriteAssets.filter((asset) => asset.isPositive).length;
    const falling = favoriteAssets.length - growing;
    const best = favoriteAssets.reduce<FavoriteAssetView | null>((acc, asset) => {
      if (!acc || asset.changeValue > acc.changeValue) return asset;
      return acc;
    }, null);

    return [
      {
        title: "Усього в обраному",
        value: String(favoriteAssets.length),
        icon: bookmarkPlusIcon,
      },
      {
        title: "Зростають сьогодні",
        value: String(growing),
        icon: arrowUpOutlineIcon,
      },
      {
        title: "Падають сьогодні",
        value: String(falling),
        icon: arrowDownOutlineIcon,
      },
      {
        title: "Найкраща динаміка",
        value: best ? `${best.symbol} ${best.change}` : "---",
        icon: null,
        valueClass: best?.isPositive
          ? "text-[30px] leading-none font-normal text-[#25DE28]"
          : "text-[30px] leading-none font-normal text-white",
      },
    ];
  }, [favoriteAssets]);

  const favoriteSymbols = useMemo(
    () => new Set(favoriteAssets.map((asset) => asset.symbol)),
    [favoriteAssets],
  );

  const visibleRecommendedAssets = useMemo(
    () => recommendedAssets.filter((asset) => !favoriteSymbols.has(asset.symbol)).slice(0, 6),
    [favoriteSymbols],
  );

  const handleViewAsset = (asset: FavoriteAssetView) => {
    navigate(`/asset/${asset.coinId || asset.symbol.toLowerCase()}`, {
      state: {
        coin: {
          id: asset.coinId,
          symbol: asset.symbol,
          imgUrl: asset.imageUrl,
          rawMcap: asset.rawMcap,
          rawAth: asset.rawAth,
          rawCircSupply: asset.rawCircSupply,
          rawTotalSupply: asset.rawTotalSupply,
          rawMaxSupply: asset.rawMaxSupply,
        },
      },
    });
  };

  const handleRemoveAsset = async (symbol: string) => {
    setPendingSymbol(symbol);
    setError("");

    try {
      const userId = await getAuthenticatedUserId();

      if (!userId) {
        setError("Увійдіть в акаунт, щоб змінювати обране.");
        return;
      }

      await removeFavoriteAsset(userId, symbol);
      setFavoriteAssets((prev) => prev.filter((asset) => asset.symbol !== symbol));
      sessionStorage.removeItem("pulse_user_favorites");
    } catch (err) {
      console.error("Помилка видалення з обраного:", err);
      setError("Не вдалося видалити актив з обраного.");
    } finally {
      setPendingSymbol(null);
    }
  };

  const handleAddRecommended = async (asset: (typeof recommendedAssets)[number]) => {
    setPendingSymbol(asset.symbol);
    setError("");

    try {
      const userId = await getAuthenticatedUserId();

      if (!userId) {
        setError("Увійдіть в акаунт, щоб додавати активи.");
        return;
      }

      await addFavoriteAsset(userId, asset);
      sessionStorage.removeItem("pulse_user_favorites");
      await loadFavorites();
    } catch (err) {
      console.error("Помилка додавання в обране:", err);
      setError("Не вдалося додати актив в обране.");
    } finally {
      setPendingSymbol(null);
    }
  };

  return (
    <div className="w-full px-[40px] pt-[24px] pb-8 text-white font-montserrat">
      <div className="flex justify-between items-start mb-[24px]">
        <p className="text-white text-[16px] leading-[28px] max-w-[546px] font-normal">
          Зберігайте криптовалюти в обране, щоб швидко відстежувати ціни,
          зміни ринку та створювати алерти
        </p>

        <button className="min-w-[208px] h-[44px] px-6 rounded-full flex items-center justify-center bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-white text-[14px] leading-[20px] font-medium transition-all duration-300 ease-out hover:scale-105 hover:shadow-[0_0_15px_rgba(131,72,193,0.4)] active:scale-[0.98] cursor-pointer">
          Підключити Telegram
        </button>
      </div>

      {error && (
        <div className="mb-[24px] rounded-[18px] border border-[#8348C1]/40 bg-[#050506] px-5 py-3 text-[13px] text-[#C38BFF]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-[24px] mb-[24px] w-full">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="h-[110px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_80px_rgba(131,72,193,0.19),0_8px_25px_rgba(0,0,0,0.5)]"
          >
            <div className="relative h-full rounded-[28px] bg-[#050506] p-5 text-center overflow-hidden flex flex-col items-center justify-center">
              <p className="text-white text-[14px] font-normal">
                {stat.title}
              </p>

              <div className="flex items-center justify-center gap-1 mt-2">
                <h2
                  className={
                    stat.valueClass ||
                    "text-[28px] leading-none font-medium text-white"
                  }
                >
                  {stat.value}
                </h2>

                {stat.icon && <img src={stat.icon} alt="" className="w-5 h-5" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-[24px] w-full">
        <div className="col-span-3">
          <h2 className="mb-[24px] text-[24px] leading-[28px] font-semibold text-white">
            Вибрані активи
          </h2>

          <div className="w-full h-[519px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
            <div className="h-full rounded-[28px] bg-[#050506] overflow-hidden">
              <div
                className={`relative ${tableGrid} items-center px-[24px] h-[57px] text-[#A3A4B0] text-[14px] font-normal bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)]`}
              >
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))]" />
                <span>Монета</span>
                <span>Ціна</span>
                <span>24год</span>
                <span className="block leading-[18px]">
                  Ринкова <br />
                  капіталізація
                </span>
                <span>Обсяг</span>
                <span>Дії</span>
              </div>

              <div className="h-[calc(100%-57px)] overflow-y-auto">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-[14px] text-[#A3A4B0]">
                    Завантаження обраного...
                  </div>
                ) : favoriteAssets.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-[14px] text-[#A3A4B0]">
                    Поки немає обраних активів
                  </div>
                ) : (
                  favoriteAssets.map((asset, index) => (
                    <React.Fragment key={asset.symbol}>
                      <div
                        className={`${tableGrid} items-center px-[24px] h-[76px] transition-all duration-300 ease-out `}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                            <img
                              src={asset.imageUrl}
                              alt={asset.symbol}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.src = buildFallbackLogo(asset.symbol);
                              }}
                            />
                          </div>

                          <p className="text-[14px] font-medium text-white">
                            {asset.symbol}
                          </p>
                        </div>

                        <p className="text-[14px] font-normal text-white">
                          {asset.price}
                        </p>

                        <p
                          className={`text-[14px] font-medium ${
                            asset.isPositive ? "text-[#25DE28]" : "text-[#F40000]"
                          }`}
                        >
                          {asset.change}
                        </p>

                        <p className="text-[14px] font-normal text-white">
                          {asset.marketCap}
                        </p>

                        <p className="text-[14px] font-normal text-white">
                          {asset.volume}
                        </p>

                        <div className="flex items-center justify-end gap-[16px] pr-[8px]">
                          <button
                            type="button"
                            onClick={() => handleViewAsset(asset)}
                            className="group relative inline-flex w-8 h-8 items-center justify-center rounded-full p-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_12px_rgba(131,72,193,0.28)] active:scale-95 cursor-pointer"
                          >
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#050506] transition-all duration-300 group-hover:bg-[#0B0B0D]">
                              <img src={eyeIcon} alt="" className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:brightness-125" />
                            </div>
                          </button>

                          <button
                            type="button"
                            disabled={pendingSymbol === asset.symbol}
                            onClick={() => handleRemoveAsset(asset.symbol)}
                            className="group relative inline-flex w-8 h-8 items-center justify-center rounded-full p-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))] hover:bg-[linear-gradient(90deg,#1C102F_0%,#FF4444_100%)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(255,68,68,0.35)] active:scale-95 cursor-pointer disabled:opacity-60"
                          >
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#050506] transition-all duration-300 group-hover:bg-[#140707]">
                              <img src={trashIcon} alt="" className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:brightness-125" />
                            </div>
                          </button>
                        </div>
                      </div>

                      {index !== favoriteAssets.length - 1 && (
                        <div className="px-[24px]">
                          <div className="h-[1px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32)_0%,rgba(179,179,179,0.032)_100%)]" />
                        </div>
                      )}
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1">
          <h2 className="mb-[24px] text-[24px] leading-[28px] font-semibold text-white">
            Рекомендовано
          </h2>

          <div className="w-[279px] h-[462px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
            <div className="h-full rounded-[28px] bg-[#050506] overflow-hidden">
              {visibleRecommendedAssets.length === 0 ? (
                <div className="flex h-full items-center justify-center px-6 text-center text-[13px] text-[#A3A4B0]">
                  Усі базові рекомендації вже додані
                </div>
              ) : (
                visibleRecommendedAssets.map((asset, index) => (
                  <React.Fragment key={asset.symbol}>
                    <div className="flex items-center justify-between px-6 h-[76px] transition-all duration-300 ease-out">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                          <img
                            src={asset.imageUrl}
                            alt={asset.symbol}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = buildFallbackLogo(asset.symbol);
                            }}
                          />
                        </div>

                        <p className="text-[14px] font-medium text-white">
                          {asset.symbol}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={pendingSymbol === asset.symbol}
                        onClick={() => handleAddRecommended(asset)}
                        className="group relative inline-flex h-[36px] w-[86px] items-center justify-center rounded-full p-[1px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(131,72,193,0.4)] active:scale-95 cursor-pointer disabled:opacity-60"
                      >
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-[#050506] transition-all group-hover:bg-[#0B0B0D]">
                          <span className="text-[14px] font-normal text-white">
                            {pendingSymbol === asset.symbol ? "..." : "Додати"}
                          </span>
                        </div>
                      </button>
                    </div>

                    {index !== visibleRecommendedAssets.length - 1 && (
                      <div className="px-[24px]">
                        <div className="h-[1px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32)_0%,rgba(179,179,179,0.032)_100%)]" />
                      </div>
                    )}
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
