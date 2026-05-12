import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const recommendedAssets = [
  { coinId: "bitcoin", name: "Bitcoin", symbol: "BTC", imageUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.png" },
  { coinId: "ethereum", name: "Ethereum", symbol: "ETH", imageUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
  { coinId: "solana", name: "Solana", symbol: "SOL", imageUrl: "https://cryptologos.cc/logos/solana-sol-logo.png" },
  { coinId: "binancecoin", name: "BNB", symbol: "BNB", imageUrl: "https://cryptologos.cc/logos/bnb-bnb-logo.png" },
  { coinId: "ripple", name: "XRP", symbol: "XRP", imageUrl: "https://cryptologos.cc/logos/xrp-xrp-logo.png" },
  { coinId: "avalanche-2", name: "Avalanche", symbol: "AVAX", imageUrl: "https://cryptologos.cc/logos/avalanche-avax-logo.png" },
];

const formatPrice = (price: number | null | undefined) => {
  if (!price) return "$0.00";
  if (price < 0.01) return `$${price}`;
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        ),
      },
      {
        title: "Зростають сьогодні",
        value: String(growing),
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#36D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        ),
      },
      {
        title: "Падають сьогодні",
        value: String(falling),
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87272" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        ),
      },
      {
        title: "Найкраща динаміка",
        value: best ? `${best.symbol} ${best.change}` : "---",
        icon: null,
        valueClass: best?.isPositive ? "text-[22px] font-semibold text-[#36D399]" : "text-[22px] font-semibold text-[#FFFFFF]",
      },
    ];
  }, [favoriteAssets]);

  const favoriteSymbols = new Set(favoriteAssets.map((asset) => asset.symbol));
  const visibleRecommendedAssets = recommendedAssets.filter((asset) => !favoriteSymbols.has(asset.symbol)).slice(0, 6);

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
    <div className="w-full font-montserrat">
      <div className="mb-6 flex items-start justify-between mt-[23px]">
        <p className="w-[546px] pl-[40px] font-montserrat text-[16px] font-normal leading-[28px] text-[#FFFFFF]">
          Зберігайте криптовалюти в обране, щоб швидко відстежувати ціни, зміни ринку та створювати алерти
        </p>
        <button className="mr-[40px] flex h-[44px] w-[208px] items-center justify-center rounded-[28px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-[13px] font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(131,72,193,0.5)] active:scale-95">
          Підключити Telegram
        </button>
      </div>

      {error && (
        <div className="mx-[40px] mb-5 rounded-[18px] border border-[#8348C1]/40 bg-[#050506] px-5 py-3 text-[13px] text-[#C38BFF]">
          {error}
        </div>
      )}

      <div className="ml-[40px] mr-[40px] grid grid-cols-1 gap-[24px] lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            className="h-[108px] w-full p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] transition-all duration-500 ease-out hover:shadow-[0_10px_40px_rgba(131,72,193,0.25),0_4px_15px_rgba(0,0,0,0.4)] hover:-translate-y-1"
          >
            <div className="flex h-full w-full flex-col items-center justify-center rounded-[28px] bg-[#050506] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
              <p className="mb-1.5 text-[12px] font-medium text-[#A3A4B0]">{stat.title}</p>
              <div className="flex items-center gap-2">
                <span className={stat.valueClass || "text-[22px] font-semibold text-[#FFFFFF]"}>
                  {stat.value}
                </span>
                {stat.icon && <span>{stat.icon}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="ml-[40px] mr-[40px] mt-[26px] flex flex-col lg:flex-row gap-[24px]">
        <div className="flex w-full flex-col lg:w-[calc(75%-6px)]">
          <h2 className="mb-[24px] text-[20px] font-semibold leading-none text-white/95">
            Вибрані активи
          </h2>
          
          <div className="w-full p-[1px] rounded-[24px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
            <div className="w-full overflow-hidden rounded-[24px] bg-[#050506] pb-6 shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
              <table className="w-full whitespace-nowrap text-left border-collapse">
                <thead className="bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)]">
                  <tr className="border-b border-white/5 text-[14px] font-semibold text-[#A3A4B0]">
                    <th className="py-5 pl-6 w-[18%]">Монета</th>
                    <th className="py-5 w-[15%]">Ціна</th>
                    <th className="py-5 w-[15%]">24год</th>
                    <th className="py-5 w-[22%]">Ринкова капіталізація</th>
                    <th className="py-5 w-[18%]">Обсяг</th>
                    <th className="py-5 pr-6 w-[12%] text-left">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[14px] text-[#A3A4B0]">
                        Завантаження обраного...
                      </td>
                    </tr>
                  ) : favoriteAssets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[14px] text-[#A3A4B0]">
                        Поки немає обраних активів
                      </td>
                    </tr>
                  ) : (
                    favoriteAssets.map((asset, index) => (
                      <React.Fragment key={asset.symbol}>
                        <tr className="text-[15px] font-medium text-[#FFFFFF] transition-colors hover:bg-white/[0.02]">
                          <td className="py-[14px] pl-6">
                            <div className="flex items-center gap-3">
                              <img src={asset.imageUrl} alt={asset.symbol} className="h-[32px] w-[32px] rounded-full object-contain" />
                              <span className="font-semibold">{asset.symbol}</span>
                            </div>
                          </td>
                          <td className="py-[14px]">{asset.price}</td>
                          <td className={`py-[14px] ${asset.isPositive ? "text-[#36D399]" : "text-[#F87272]"}`}>
                            {asset.change}
                          </td>
                          <td className="py-[14px]">{asset.marketCap}</td>
                          <td className="py-[14px]">{asset.volume}</td>
                          <td className="py-[14px] pr-6">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleViewAsset(asset)}
                                className="group relative inline-flex h-[38px] w-[118px] items-center justify-center rounded-full p-[1px] bg-gradient-to-r from-[#4C2475] via-[#7A40B5] to-[#B57AFF] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(131,72,193,0.4)] active:scale-95"
                              >
                                <span className="flex h-full w-full items-center justify-center rounded-full bg-[#000000] text-[14px] font-normal text-[#A3A4B0] transition-colors group-hover:text-white">
                                  Переглянути
                                </span>
                              </button>
                              <button
                                type="button"
                                disabled={pendingSymbol === asset.symbol}
                                onClick={() => handleRemoveAsset(asset.symbol)}
                                className="group relative inline-flex h-[38px] w-[92px] items-center justify-center rounded-full p-[1px] bg-gradient-to-r from-[#4C2475] via-[#7A40B5] to-[#B57AFF] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(131,72,193,0.4)] active:scale-95 disabled:opacity-60"
                              >
                                <span className="flex h-full w-full items-center justify-center rounded-full bg-[#000000] text-[14px] font-normal text-[#A3A4B0] transition-colors group-hover:text-white">
                                  {pendingSymbol === asset.symbol ? "..." : "Видалити"}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {index !== favoriteAssets.length - 1 && (
                          <tr>
                            <td colSpan={6} className="p-0">
                              <div className="mx-auto h-[1px] w-[calc(100%-48px)] bg-white/5"></div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col lg:w-[calc(25%-18px)]">
          <h2 className="mb-[24px] text-[20px] font-semibold leading-none text-white/95">
            Рекомендовано 
          </h2>
          <div className="w-full p-[1px] rounded-[24px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
            <div className="w-full rounded-[24px] bg-[#050506] py-2 shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
              <div className="flex flex-col">
                {visibleRecommendedAssets.length === 0 ? (
                  <div className="px-6 py-8 text-center text-[13px] text-[#A3A4B0]">
                    Усі базові рекомендації вже додані
                  </div>
                ) : (
                  visibleRecommendedAssets.map((asset, index) => (
                    <React.Fragment key={asset.symbol}>
                      <div className="flex items-center justify-between px-6 py-[14px] transition-colors hover:bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <img src={asset.imageUrl} alt={asset.symbol} className="h-[32px] w-[32px] rounded-full object-contain" />
                          <span className="text-[15px] font-semibold text-[#FFFFFF]">{asset.symbol}</span>
                        </div>
                        <button
                          type="button"
                          disabled={pendingSymbol === asset.symbol}
                          onClick={() => handleAddRecommended(asset)}
                          className="group relative inline-flex h-[38px] w-[90px] items-center justify-center rounded-full p-[1px] bg-gradient-to-r from-[#4C2475] via-[#7A40B5] to-[#B57AFF] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(131,72,193,0.4)] active:scale-95 disabled:opacity-60"
                        >
                          <span className="flex h-full w-full items-center justify-center rounded-full bg-[#000000] text-[14px] font-normal text-[#A3A4B0] transition-colors group-hover:text-white">
                            {pendingSymbol === asset.symbol ? "..." : "Додати"}
                          </span>
                        </button>
                      </div>
                      {index !== visibleRecommendedAssets.length - 1 && (
                        <div className="mx-auto h-[1px] w-[calc(100%-48px)] bg-white/5"></div>
                      )}
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
