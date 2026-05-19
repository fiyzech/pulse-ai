import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient"; // Використовуємо спільний клієнт
import { clearAccountCache } from "../../utils/accountCache";
import notificationsIcon from "../../assets/icons/notifications-icon.svg"; 
import logOutIcon from "../../assets/icons/log-out-icon.svg"; 

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

      // 2. Чистимо localStorage
      clearAccountCache();
      localStorage.removeItem('user_meta');
      localStorage.removeItem('crypto_pulse_plan');
      localStorage.removeItem('crypto_pulse_card');
      
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

    const normalized = rawQuery.toLowerCase().replace(/\s+/g, "-");
    setSearchValue("");
    setIsSearchOpen(false);
    navigate(`/asset/${normalized}`);
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
                    Нічого не знайдено. Натисніть Enter, щоб відкрити як актив.
                  </div>
                )}
              </div>
            )}
          </form>
          
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-transparent hover:bg-white/5 transition-colors">
            <img src={notificationsIcon} alt="Сповіщення" className="h-5 w-5 opacity-70" />
          </button>

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
          <div className="w-[400px] rounded-[24px] bg-[#0A0A0A] border border-white/10 p-8 text-center shadow-[0_20px_70px_rgba(0,0,0,0.5)]">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A3A4B0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </div>
            <h2 className="text-[22px] text-white font-medium mb-2">Вийти з акаунта?</h2>
            <p className="text-[14px] text-[#A3A4B0] mb-8">Вам доведеться знову ввести свої дані для входу в систему.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 h-[44px] rounded-full border border-white/10 text-white hover:bg-white/5 transition-colors text-[13px] font-medium cursor-pointer">Скасувати</button>
              <button onClick={handleLogout} className="flex-1 h-[44px] rounded-full text-white text-[13px] font-medium bg-red-500/20 border border-red-500/30 hover:bg-red-500 hover:border-red-500 transition-colors cursor-pointer">Вийти</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
