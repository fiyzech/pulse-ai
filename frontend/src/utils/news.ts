export interface NewsApiArticle {
  title: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
  urlToImage?: string | null;
  description?: string | null;
}

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

export interface CryptoNewsItem {
  title: string;
  description?: string;
  url: string;
  source: string;
  publishedAt: string;
  icon: string | null;
  tag: string;
}

const TRANSLATION_CACHE_KEY = "cryptopulse_news_translations_v2";
const NEWS_CACHE_KEY = "cryptopulse_crypto_news_feed_v4";
const NEWS_CACHE_TTL_MS = 15 * 60 * 1000;
const TRANSLATE_TIMEOUT_MS = 2800;
const TRANSLATE_BATCH_SIZE = 8;

type NewsCachePayload = {
  savedAt: number;
  items: CryptoNewsItem[];
};

type FetchCryptoNewsOptions = {
  translate?: boolean;
};

export const readCryptoNewsCache = (maxAgeMs = NEWS_CACHE_TTL_MS): CryptoNewsItem[] | null => {
  try {
    const raw = sessionStorage.getItem(NEWS_CACHE_KEY) || localStorage.getItem(NEWS_CACHE_KEY);
    if (!raw) return null;

    const payload = JSON.parse(raw) as NewsCachePayload;
    if (!payload?.savedAt || !Array.isArray(payload.items)) return null;
    if (Date.now() - payload.savedAt > maxAgeMs) return null;

    return payload.items;
  } catch {
    return null;
  }
};

const saveCryptoNewsCache = (items: CryptoNewsItem[]) => {
  try {
    const payload: NewsCachePayload = { savedAt: Date.now(), items };
    const serialized = JSON.stringify(payload);
    sessionStorage.setItem(NEWS_CACHE_KEY, serialized);
    localStorage.setItem(NEWS_CACHE_KEY, serialized);
  } catch {
    // ignore
  }
};

const getTranslationCache = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(TRANSLATION_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const cryptoSourceHints = [
  "coindesk",
  "cointelegraph",
  "decrypt",
  "the block",
  "blockworks",
  "cryptoslate",
  "beincrypto",
  "bitcoin magazine",
  "bitcoinist",
  "newsbtc",
  "u.today",
  "ambcrypto",
  "crypto briefing",
  "cryptopotato",
  "coinpedia",
  "coinmarketcap",
  "coingecko",
];

const strongCryptoPatterns = [
  /\bbitcoin\b/,
  /\bbtc\b/,
  /\bethereum\b/,
  /\bether\b/,
  /\beth\b/,
  /\bcrypto\b/,
  /\bcryptocurrency\b/,
  /\baltcoin(s)?\b/,
  /\bstablecoin(s)?\b/,
  /\bdefi\b/,
  /\bnft(s)?\b/,
  /\btoken(s)?\b/,
  /\bcoinbase\b/,
  /\bbinance\b/,
  /\bbnb\b/,
  /\bsolana\b/,
  /\bsol\b/,
  /\bxrp\b/,
  /\bripple\b/,
  /\bcardano\b/,
  /\bada\b/,
  /\bdogecoin\b/,
  /\bdoge\b/,
  /\bavalanche\b/,
  /\bavax\b/,
  /\bchainlink\b/,
  /\blink\b/,
  /\bwallet(s)?\b/,
  /\bstaking\b/,
  /\bmining\b/,
  /\bspot etf(s)?\b/,
  /\bcrypto etf(s)?\b/,
  /\bsec\b.*\b(crypto|bitcoin|ethereum|coinbase|binance|token|etf)\b/,
];

const weakTechOnlyPatterns = [
  /\bcoding\b/,
  /\bprogramming\b/,
  /\bdeveloper(s)?\b/,
  /\bsoftware\b/,
  /\bjavascript\b/,
  /\btypescript\b/,
  /\bpython\b/,
  /\bgithub\b/,
  /\bopen source\b/,
  /\bapp development\b/,
  /\bai coding\b/,
  /\bvibe coding\b/,
];

// Sources that are never crypto-related
const BLOCKED_SOURCES = new Set([
  "pypi.org", "pypi", "npmjs.com", "npm", "github.com", "github",
  "stackoverflow.com", "stackoverflow", "hackernews", "hacker news",
  "ycombinator.com", "ycombinator", "dev.to", "devto",
  "registry.npmjs.org", "rubygems.org", "crates.io",
  "packagist.org", "nuget.org", "maven",
]);

// Package release title pattern: "some-package-name 1.2.3"
const PKG_RELEASE_RE = /^[\w][\w\-\.]{1,60}\s+\d+\.\d+(\.\d+)?([.\-]\S*)?$/;

const saveTranslationCache = (cache: Record<string, string>) => {
  try {
    localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
};

const isProbablyUkrainian = (text: string): boolean => {
  return /[іїєґІЇЄҐ]/.test(text);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const formatNewsTime = (dateString: string): string => {
  const publishedDate = new Date(dateString);
  const now = new Date();

  const diffMs = now.getTime() - publishedDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "щойно";
  if (diffMinutes < 60) return `${diffMinutes} хв тому`;
  if (diffHours < 24) return `${diffHours} год тому`;

  if (diffDays === 1) return "1 день тому";
  return `${diffDays} днів тому`;
};

export const getNewsIcon = (title: string, description = ""): string | null => {
  const text = `${title} ${description}`.toLowerCase();

  if (
    text.includes("bitcoin") ||
    text.includes("btc") ||
    text.includes("satoshi")
  ) {
    return "https://assets.coingecko.com/coins/images/1/large/bitcoin.png";
  }

  if (
    text.includes("ethereum") ||
    text.includes("ether") ||
    text.includes("eth") ||
    text.includes("vitalik")
  ) {
    return "https://assets.coingecko.com/coins/images/279/large/ethereum.png";
  }

  if (
    text.includes("tether") ||
    text.includes("usdt") ||
    text.includes("stablecoin") ||
    text.includes("stablecoins")
  ) {
    return "https://assets.coingecko.com/coins/images/325/large/Tether.png";
  }

  if (text.includes("solana") || /\bsol\b/.test(text)) {
    return "https://assets.coingecko.com/coins/images/4128/large/solana.png";
  }

  if (text.includes("binance") || /\bbnb\b/.test(text)) {
    return "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png";
  }

  if (text.includes("ripple") || /\bxrp\b/.test(text)) {
    return "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png";
  }

  if (text.includes("cardano") || /\bada\b/.test(text)) {
    return "https://assets.coingecko.com/coins/images/975/large/cardano.png";
  }

  if (text.includes("avalanche") || /\bavax\b/.test(text)) {
    return "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png";
  }

  if (text.includes("dogecoin") || /\bdoge\b/.test(text)) {
    return "https://assets.coingecko.com/coins/images/5/large/dogecoin.png";
  }

  if (text.includes("polygon") || /\bmatic\b/.test(text) || /\bpol\b/.test(text)) {
    return "https://assets.coingecko.com/coins/images/4713/large/polygon.png";
  }

  if (text.includes("chainlink") || /\blink\b/.test(text)) {
    return "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png";
  }

  if (text.includes("toncoin") || text.includes("telegram open network") || /\bton\b/.test(text)) {
    return "https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png";
  }

  if (
    text.includes("coinbase") ||
    text.includes("binance") ||
    text.includes("exchange") ||
    text.includes("etf") ||
    text.includes("sec") ||
    text.includes("regulation") ||
    text.includes("defi") ||
    text.includes("web3") ||
    text.includes("wallet") ||
    text.includes("blockchain")
  ) {
    return "/NewsDetails.svg";
  }

  return "/NewsDetails.svg";
};

export const getNewsTag = (title: string, description = ""): string => {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes("bitcoin") || text.includes("btc")) return "Bitcoin";

  if (
    text.includes("ethereum") ||
    text.includes("eth") ||
    text.includes("vitalik")
  ) {
    return "Ethereum";
  }

  if (
    text.includes("tether") ||
    text.includes("usdt") ||
    text.includes("stablecoin") ||
    text.includes("stablecoins")
  ) {
    return "Stablecoins";
  }

  if (text.includes("solana") || text.includes("sol")) return "Solana";
  if (text.includes("binance") || text.includes("bnb")) return "Binance";
  if (text.includes("etf")) return "ETF";

  if (
    text.includes("sec") ||
    text.includes("regulation") ||
    text.includes("regulatory") ||
    text.includes("law") ||
    text.includes("lawsuit")
  ) {
    return "Регуляція";
  }

  return "Crypto";
};

const isRelevantCryptoArticle = (article: NewsApiArticle): boolean => {
  const title = article.title?.toLowerCase() || "";
  const description = article.description?.toLowerCase() || "";
  const source = article.source?.name?.toLowerCase() || "";
  const fullText = `${title} ${description} ${source}`;

  // Hard-block known dev/package sources regardless of content
  if (BLOCKED_SOURCES.has(source)) return false;
  for (const blocked of BLOCKED_SOURCES) {
    if (source.includes(blocked)) return false;
  }

  // Block package release announcements like "some-lib 1.2.3"
  if (PKG_RELEASE_RE.test(article.title?.trim() ?? "")) return false;

  const hasStrongCryptoContext = strongCryptoPatterns.some((pattern) =>
    pattern.test(fullText)
  );
  const isCryptoSource = cryptoSourceHints.some((sourceHint) =>
    source.includes(sourceHint)
  );
  const isWeakTechOnly = weakTechOnlyPatterns.some((pattern) =>
    pattern.test(fullText)
  );

  const isBadTopic =
    title.includes("[removed]") ||
    title.includes("vladimir putin") ||
    title.includes("iran") ||
    title.includes("uranium") ||
    title.includes("hormuz") ||
    title.includes("gold etf") ||
    title.includes("gold etfs") ||
    title.includes("naval") ||
    title.includes("war") ||
    // Generic tech noise without clear crypto context
    /\bv?\d+\.\d+\.\d+\b/.test(title) ||           // "release v2.0.1" type titles
    /\brelease notes?\b/i.test(article.title ?? "") ||
    /\bchangelog\b/i.test(article.title ?? "") ||
    (isWeakTechOnly && !hasStrongCryptoContext && !isCryptoSource);

  return Boolean(
    article.title &&
      article.url &&
      article.source?.name &&
      article.publishedAt &&
      (hasStrongCryptoContext || isCryptoSource) &&
      !isBadTopic
  );
};

const removeDuplicateArticles = (
  articles: NewsApiArticle[]
): NewsApiArticle[] => {
  const seen = new Set<string>();

  return articles.filter((article) => {
    const key = `${article.title}-${article.url}`.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const googleTranslateOne = async (text: string): Promise<string> => {
  const cleanText = text.trim();

  if (!cleanText) return text;
  if (isProbablyUkrainian(cleanText)) return cleanText;

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=uk&dt=t&q=${encodeURIComponent(
    cleanText
  )}`;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);

  const res = await fetch(url, { signal: controller.signal }).finally(() => {
    window.clearTimeout(timeoutId);
  });

  if (!res.ok) {
    return cleanText;
  }

  const data = await res.json() as unknown;
  const translationRoot = Array.isArray(data) ? data[0] : null;

  const translated = Array.isArray(translationRoot)
    ? translationRoot.map((part) => Array.isArray(part) ? String(part[0] || "") : "").join("")
    : "";

  return translated || cleanText;
};

const translateTextsToUkrainian = async (
  texts: string[]
): Promise<string[]> => {
  const cache = getTranslationCache();
  const result: string[] = [...texts];

  const indexesToTranslate = texts
    .map((text, index) => ({ text: text?.trim() || "", index }))
    .filter(({ text }) => {
      if (!text) return false;
      if (isProbablyUkrainian(text)) return false;
      if (cache[text]) return false;
      return true;
    });

  texts.forEach((text, index) => {
    const cleanText = text?.trim() || "";

    if (!cleanText) {
      result[index] = text;
      return;
    }

    if (cache[cleanText]) {
      result[index] = cache[cleanText];
      return;
    }

    if (isProbablyUkrainian(cleanText)) {
      result[index] = cleanText;
    }
  });

  for (let i = 0; i < indexesToTranslate.length; i += TRANSLATE_BATCH_SIZE) {
    const batch = indexesToTranslate.slice(i, i + TRANSLATE_BATCH_SIZE);
    const translatedBatch = await Promise.all(
      batch.map(async ({ text, index }) => {
        try {
          const translated = await googleTranslateOne(text);
          return { text, index, translated };
        } catch {
          return { text, index, translated: text };
        }
      })
    );

    translatedBatch.forEach(({ text, index, translated }) => {
      result[index] = translated;
      cache[text] = translated;
    });

    saveTranslationCache(cache);

    if (i + TRANSLATE_BATCH_SIZE < indexesToTranslate.length) {
      await sleep(80);
    }
  }

  saveTranslationCache(cache);

  return result;
};

export const translateCryptoNewsItems = async (items: CryptoNewsItem[]): Promise<CryptoNewsItem[]> => {
  const titles = items.map((item) => item.title);
  const descriptions = items.map((item) => item.description || "");

  const [translatedTitles, translatedDescriptions] = await Promise.all([
    translateTextsToUkrainian(titles),
    translateTextsToUkrainian(descriptions),
  ]);

  const translatedItems = items.map((item, index) => ({
    ...item,
    title: translatedTitles[index] || item.title,
    description: translatedDescriptions[index] || item.description || "",
  }));

  saveCryptoNewsCache(translatedItems);
  return translatedItems;
};

export const fetchCryptoNews = async (
  finalCount = 6,
  rawCount = 100,
  options: FetchCryptoNewsOptions = {},
): Promise<CryptoNewsItem[]> => {
  const shouldTranslate = options.translate ?? true;
  const apiKey = import.meta.env.VITE_NEWS_API_KEY;

  if (!apiKey) {
    throw new Error("NewsAPI key is missing");
  }

  const query = encodeURIComponent(
    '("bitcoin" OR "ethereum" OR "cryptocurrency" OR "crypto market" OR "crypto exchange" OR "stablecoin" OR "solana" OR "binance" OR "coinbase" OR "coindesk" OR "cointelegraph" OR "crypto ETF" OR "defi" OR "xrp" OR "ripple" OR "staking" OR "bitcoin mining" OR "nft") NOT coding NOT programming NOT software NOT github'
  );

  const safeRawCount = Math.min(Math.max(rawCount, finalCount), 100);

  const res = await fetch(
    `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=${safeRawCount}&page=1&apiKey=${apiKey}`
  );

  if (!res.ok) {
    throw new Error(`NewsAPI error: ${res.status}`);
  }

  const data: NewsApiResponse = await res.json();

  const rawArticles = data.articles || [];

  const articles = removeDuplicateArticles(rawArticles)
    .filter(isRelevantCryptoArticle)
    .slice(0, finalCount);

  const items = articles.map((article) => ({
    title: article.title,
    description: article.description || "",
    url: article.url,
    source: article.source.name,
    publishedAt: article.publishedAt,
    icon: getNewsIcon(article.title, article.description || ""),
    tag: getNewsTag(article.title, article.description || ""),
  }));

  saveCryptoNewsCache(items);

  if (!shouldTranslate) {
    return items;
  }

  return translateCryptoNewsItems(items);
};
