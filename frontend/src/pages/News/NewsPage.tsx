import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetchCryptoNews,
  formatNewsTime,
  readCryptoNewsCache,
  translateCryptoNewsItems,
} from "../../utils/news";
import type { CryptoNewsItem } from "../../utils/news";

const categories = [
  "Усі",
  "Bitcoin",
  "Ethereum",
  "Stablecoins",
  "Solana",
  "Binance",
  "ETF",
  "Регуляція",
  "Crypto",
];

export default function NewsPage() {
  const navigate = useNavigate();
  const cachedNews = readCryptoNewsCache(60 * 60 * 1000);

  const [news, setNews] = useState<CryptoNewsItem[]>(() => cachedNews || []);
  const [loading, setLoading] = useState<boolean>(() => !cachedNews);
  const [hasInitialCache] = useState<boolean>(() => Boolean(cachedNews));
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>("Усі");
  const [searchValue, setSearchValue] = useState<string>("");

  useEffect(() => {
    let isActive = true;
    const timer = window.setTimeout(() => {
    const loadNews = async () => {
      try {
          if (!hasInitialCache) setLoading(true);
        setError(null);

          const result = await fetchCryptoNews(40, 100, { translate: false });
          if (!isActive) return;

        setNews(result);
          setLoading(false);

          void translateCryptoNewsItems(result)
            .then((translated) => {
              if (isActive) setNews(translated);
            })
            .catch((error) => {
              console.warn("Переклад новин пропущено:", error);
            });
      } catch (error) {
        console.error("Помилка завантаження сторінки новин:", error);
          if (!hasInitialCache) {
            setError("Не вдалося завантажити новини");
          }
      } finally {
          if (isActive && !hasInitialCache) setLoading(false);
      }
    };

      void loadNews();
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [hasInitialCache]);

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const matchesCategory =
        activeCategory === "Усі" || item.tag === activeCategory;

      const query = searchValue.trim().toLowerCase();

      const matchesSearch =
        query.length === 0 ||
        item.title.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query) ||
        item.tag.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [news, activeCategory, searchValue]);

  return (
    <section className="w-full max-w-[1600px] mx-auto px-10 pt-7 pb-10">
      <div className="mb-[28px] flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/dashboard")}
            className="mb-[20px] flex items-center gap-2 font-montserrat text-[14px] text-white/60 transition hover:text-white"
          >
            <span className="text-[18px]">←</span>
            Назад до Dashboard
          </button>

          <h1 className="font-montserrat text-[32px] leading-[38px] font-semibold text-white">
            Головні крипто-новини
          </h1>

          <p className="mt-[10px] max-w-[650px] font-montserrat text-[14px] leading-[22px] text-white/55">
            Останні події криптоіндустрії: Bitcoin, Ethereum, ETF, біржі,
            stablecoins, регуляція, блокчейн-проєкти та ринкові зміни.
          </p>
        </div>

        <div className="hidden lg:block p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
          <div className="flex h-[92px] w-[300px] flex-col justify-center rounded-[28px] bg-[#050506] px-[24px]">
            <p className="font-montserrat text-[12px] text-white/50">
              Оновлення
            </p>
            <p className="mt-[6px] font-montserrat text-[22px] leading-[28px] font-medium text-white">
              Live crypto feed
            </p>
          </div>
        </div>
      </div>

      <div className="mb-[24px] flex flex-col gap-[16px] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-[10px]">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`h-[38px] rounded-[28px] px-[18px] font-montserrat text-[13px] transition-all ${
                activeCategory === category
                  ? "bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-white shadow-[0_10px_30px_rgba(131,72,193,0.25)]"
                  : "border border-white/10 bg-[#050506] text-white/60 hover:border-[#8348C1]/60 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="w-full lg:w-[340px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Пошук новин..."
            className="h-[44px] w-full rounded-[28px] bg-[#050506] px-[18px] font-montserrat text-[14px] text-white outline-none placeholder:text-white/35"
          />
        </div>
      </div>

      <div className="w-full p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
        <div className="min-h-[620px] rounded-[28px] bg-[#050506] p-[24px]">
          {loading && (
            <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[230px] rounded-[28px] border border-white/10 bg-white/[0.02] p-[20px] animate-pulse"
                >
                  <div className="mb-[22px] h-[28px] w-[190px] rounded-full bg-white/10" />
                  <div className="h-[20px] w-full rounded-full bg-white/10" />
                  <div className="mt-[10px] h-[20px] w-[80%] rounded-full bg-white/10" />
                  <div className="mt-[34px] h-[14px] w-[140px] rounded-full bg-white/10" />
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="flex min-h-[520px] items-center justify-center text-center">
              <div>
                <p className="font-montserrat text-[18px] text-white">
                  {error}
                </p>
                <p className="mt-[8px] font-montserrat text-[14px] text-white/45">
                  Перевір NewsAPI ключ, ліміт запитів або доступ до API.
                </p>
              </div>
            </div>
          )}

          {!loading && !error && filteredNews.length === 0 && (
            <div className="flex min-h-[520px] items-center justify-center text-center">
              <div>
                <p className="font-montserrat text-[18px] text-white">
                  Нічого не знайдено
                </p>
                <p className="mt-[8px] font-montserrat text-[14px] text-white/45">
                  Спробуй змінити категорію або пошуковий запит.
                </p>
              </div>
            </div>
          )}

          {!loading && !error && filteredNews.length > 0 && (
            <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-3">
              {filteredNews.map((item, index) => (
                <a
                  key={`${item.url}-${index}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative min-h-[230px] overflow-hidden rounded-[28px] border border-white/10 bg-[#08080A] p-[20px] transition-all duration-300 hover:-translate-y-1 hover:border-[#8348C1]/70 hover:shadow-[0_20px_60px_rgba(131,72,193,0.22)]"
                >
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(131,72,193,0.18),transparent_38%)]" />

                  <div className="relative z-10 flex items-center justify-between gap-[12px]">
                    <div className="flex min-w-0 items-center gap-[10px]">
                      {item.icon && (
                        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
                          <img
                            src={item.icon}
                            alt={item.tag}
                            className="h-[22px] w-[22px] object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="font-montserrat text-[12px] leading-[16px] text-white/55">
                          {formatNewsTime(item.publishedAt)}
                        </p>
                        <p className="truncate font-montserrat text-[12px] leading-[16px] text-white/80">
                          {item.source}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full border border-[#8348C1]/40 px-[10px] py-[5px] font-montserrat text-[11px] text-white/70">
                      {item.tag}
                    </span>
                  </div>

                  <h2 className="relative z-10 mt-[20px] font-montserrat text-[18px] font-medium leading-[26px] text-white line-clamp-3">
                    {item.title}
                  </h2>

                  {item.description && (
                    <p className="relative z-10 mt-[12px] font-montserrat text-[13px] leading-[20px] text-white/45 line-clamp-3">
                      {item.description}
                    </p>
                  )}

                  <div className="relative z-10 mt-[20px] flex items-center justify-between">
                    <span className="font-montserrat text-[13px] text-white/45">
                      Відкрити джерело
                    </span>

                    <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/5 text-white transition group-hover:bg-[#8348C1]">
                      →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
