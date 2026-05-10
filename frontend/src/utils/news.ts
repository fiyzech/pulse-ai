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

const getTranslationCache = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(TRANSLATION_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

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
    return "/Bitcoin.svg";
  }

  if (
    text.includes("ethereum") ||
    text.includes("ether") ||
    text.includes("eth") ||
    text.includes("vitalik")
  ) {
    return "/Ethereum.svg";
  }

  if (
    text.includes("tether") ||
    text.includes("usdt") ||
    text.includes("stablecoin") ||
    text.includes("stablecoins")
  ) {
    return "/Tether.svg";
  }

  return null;
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

  const hasCryptoContext =
    fullText.includes("bitcoin") ||
    fullText.includes("btc") ||
    fullText.includes("ethereum") ||
    fullText.includes("eth") ||
    fullText.includes("crypto") ||
    fullText.includes("cryptocurrency") ||
    fullText.includes("blockchain") ||
    fullText.includes("stablecoin") ||
    fullText.includes("stablecoins") ||
    fullText.includes("solana") ||
    fullText.includes("binance") ||
    fullText.includes("bnb") ||
    fullText.includes("defi") ||
    fullText.includes("web3") ||
    fullText.includes("etf") ||
    fullText.includes("coinbase") ||
    fullText.includes("coindesk") ||
    fullText.includes("token") ||
    fullText.includes("tokens") ||
    fullText.includes("wallet") ||
    fullText.includes("zk") ||
    fullText.includes("layer 2") ||
    fullText.includes("layer-2") ||
    fullText.includes("nft") ||
    fullText.includes("xrp") ||
    fullText.includes("ripple") ||
    fullText.includes("staking") ||
    fullText.includes("mining");

  const isBadTopic =
    title.includes("[removed]") ||
    title.includes("vladimir putin") ||
    title.includes("iran") ||
    title.includes("uranium") ||
    title.includes("hormuz") ||
    title.includes("gold etf") ||
    title.includes("gold etfs") ||
    title.includes("naval") ||
    title.includes("war");

  return Boolean(
    article.title &&
      article.url &&
      article.source?.name &&
      article.publishedAt &&
      hasCryptoContext &&
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

  const res = await fetch(url);

  if (!res.ok) {
    return cleanText;
  }

  const data = await res.json();

  const translated = Array.isArray(data?.[0])
    ? data[0].map((part: any[]) => part?.[0]).join("")
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

  for (let i = 0; i < indexesToTranslate.length; i++) {
    const { text, index } = indexesToTranslate[i];

    try {
      const translated = await googleTranslateOne(text);

      result[index] = translated;
      cache[text] = translated;

      if (i > 0 && i % 8 === 0) {
        saveTranslationCache(cache);
        await sleep(350);
      }
    } catch {
      result[index] = text;
    }
  }

  saveTranslationCache(cache);

  return result;
};

export const fetchCryptoNews = async (
  finalCount = 6,
  rawCount = 100
): Promise<CryptoNewsItem[]> => {
  const apiKey = import.meta.env.VITE_NEWS_API_KEY;

  if (!apiKey) {
    throw new Error("NewsAPI key is missing");
  }

  const query = encodeURIComponent(
    '("bitcoin" OR "ethereum" OR "crypto" OR "cryptocurrency" OR "blockchain" OR "stablecoin" OR "solana" OR "binance" OR "defi" OR "web3" OR "coinbase" OR "coindesk" OR "crypto ETF" OR "wallet" OR "zk" OR "xrp" OR "ripple" OR "staking" OR "mining" OR "nft")'
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

  const titles = articles.map((article) => article.title);
  const descriptions = articles.map((article) => article.description || "");

  const translatedTitles = await translateTextsToUkrainian(titles);
  const translatedDescriptions = await translateTextsToUkrainian(descriptions);

  return articles.map((article, index) => ({
    title: translatedTitles[index] || article.title,
    description: translatedDescriptions[index] || "",
    url: article.url,
    source: article.source.name,
    publishedAt: article.publishedAt,
    icon: getNewsIcon(article.title, article.description || ""),
    tag: getNewsTag(article.title, article.description || ""),
  }));
};