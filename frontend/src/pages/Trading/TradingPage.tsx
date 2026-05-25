import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createChart, ColorType, CrosshairMode, CandlestickSeries, AreaSeries, LineStyle, LineSeries, HistogramSeries } from "lightweight-charts";
import type { IChartApi, ISeriesApi, IPriceLine, Time } from "lightweight-charts";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  BellOff,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  Gauge,
  Loader2,
  Minus,
  MousePointer2,
  PanelBottom,
  PanelRight,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Trophy,
  Rewind,
  FastForward,
  Flag,
  Star,
} from "lucide-react";
import {
  createPriceAlert,
  getAlertConditionDescription,
  getAlertConditionShortLabel,
  getAlertConditionUnit,
  listUserPriceAlerts,
  NO_VALUE_CONDITIONS,
  recordAlertTrigger,
  removePriceAlert,
  togglePriceAlert,
  updateAlertTargetPrice,
  updatePriceAlert,
} from "../../utils/priceAlerts";
import type { PriceAlertCondition, PriceAlertRecord } from "../../utils/priceAlerts";
import { useAccount } from "../../context/accountContextValue";
import { supabase } from "../../supabaseClient";
import { BOT_URL, fetchTelegramStatus, openTelegramBot } from "../../utils/telegram";
import {
  listFavoriteAssets,
  addFavoriteAsset,
  removeFavoriteAsset,
} from "../../utils/favoriteAssets";
import type { FavoriteAssetRecord } from "../../utils/favoriteAssets";
import { getPlanLimits, getViewedSignalSymbols, recordSignalSymbol } from "../../utils/planLimits";
import UpgradeModal from "../../components/common/UpgradeModal";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const AI_ASSISTANT_BASE = "https://cryptomisha-ai-agent-c2fa3q367soa93m2cjyfrw.streamlit.app/";
const buildAiUrl = (userId?: string | null, planKey?: string | null) => {
  if (!userId) return AI_ASSISTANT_BASE;
  return `${AI_ASSISTANT_BASE}?userId=${encodeURIComponent(userId)}&plan=${encodeURIComponent(planKey ?? "free")}`;
};
const DEMO_KEY_PREFIX   = "cryptopulse_demo_trading_account";
const MARKET_CACHE_KEY  = "cryptopulse_trading_markets_v2";
// Нормалізована схема: 4 окремих таблиці
const DB_ACCOUNT   = "demo_accounts";
const DB_POSITIONS = "demo_positions";
const DB_ORDERS    = "demo_orders";
const DB_TRADES    = "demo_trades";
const DEFAULT_SYMBOL    = "BTC";
const DEMO_START        = 25_000;
// Таймфрейм для індикаторів (незалежно від TradingView)
const IND_TF = { label:"4h", binance:"4h", tv:"240", lim:220 };
const AUTO_PREDICTION_REFRESH_MS = 10 * 60_000;

const LEVERAGES = [1, 2, 3, 5, 10, 20, 25, 50, 100] as const;
type LeverageVal = (typeof LEVERAGES)[number];

// Розширений фолбек (25 монет)
const FALLBACK: Asset[] = [
  { id:"bitcoin",      sym:"BTC",  name:"Bitcoin",    img:"https://cryptologos.cc/logos/bitcoin-btc-logo.png",          price:104000, pct24h: 1.4,  mcap:2060e9, vol24h:54e9,  rank:1  },
  { id:"ethereum",     sym:"ETH",  name:"Ethereum",   img:"https://cryptologos.cc/logos/ethereum-eth-logo.png",         price:3450,   pct24h: 2.1,  mcap:415e9,  vol24h:22e9,  rank:2  },
  { id:"tether",       sym:"USDT", name:"Tether",     img:"https://cryptologos.cc/logos/tether-usdt-logo.png",          price:1,      pct24h: 0.0,  mcap:140e9,  vol24h:80e9,  rank:3  },
  { id:"binancecoin",  sym:"BNB",  name:"BNB",        img:"https://cryptologos.cc/logos/bnb-bnb-logo.png",              price:590,    pct24h: 0.8,  mcap:88e9,   vol24h:1.2e9, rank:4  },
  { id:"solana",       sym:"SOL",  name:"Solana",     img:"https://cryptologos.cc/logos/solana-sol-logo.png",           price:145,    pct24h: 4.2,  mcap:65e9,   vol24h:3.8e9, rank:5  },
  { id:"ripple",       sym:"XRP",  name:"XRP",        img:"https://cryptologos.cc/logos/xrp-xrp-logo.png",             price:0.61,   pct24h:-0.7,  mcap:34e9,   vol24h:1.8e9, rank:7  },
  { id:"dogecoin",     sym:"DOGE", name:"Dogecoin",   img:"https://cryptologos.cc/logos/dogecoin-doge-logo.png",        price:0.18,   pct24h: 1.2,  mcap:26e9,   vol24h:2.1e9, rank:9  },
  { id:"cardano",      sym:"ADA",  name:"Cardano",    img:"https://cryptologos.cc/logos/cardano-ada-logo.png",          price:0.45,   pct24h:-0.3,  mcap:16e9,   vol24h:0.52e9,rank:11 },
  { id:"avalanche-2",  sym:"AVAX", name:"Avalanche",  img:"https://cryptologos.cc/logos/avalanche-avax-logo.png",      price:42,     pct24h:-1.1,  mcap:15.8e9, vol24h:0.45e9,rank:12 },
  { id:"chainlink",    sym:"LINK", name:"Chainlink",  img:"https://cryptologos.cc/logos/chainlink-link-logo.png",      price:17.8,   pct24h: 1.9,  mcap:10.9e9, vol24h:0.62e9,rank:15 },
  { id:"sui",          sym:"SUI",  name:"Sui",        img:"https://cryptologos.cc/logos/sui-sui-logo.png",             price:3.72,   pct24h: 5.4,  mcap:11.1e9, vol24h:0.88e9,rank:14 },
  { id:"polkadot",     sym:"DOT",  name:"Polkadot",   img:"https://cryptologos.cc/logos/polkadot-new-dot-logo.png",   price:5.2,    pct24h: 0.5,  mcap:7.5e9,  vol24h:0.3e9, rank:20 },
  { id:"near",         sym:"NEAR", name:"NEAR",       img:"https://cryptologos.cc/logos/near-protocol-near-logo.png", price:3.1,    pct24h: 2.3,  mcap:3.4e9,  vol24h:0.28e9,rank:28 },
  { id:"uniswap",      sym:"UNI",  name:"Uniswap",    img:"https://cryptologos.cc/logos/uniswap-uni-logo.png",        price:8.9,    pct24h: 1.1,  mcap:5.3e9,  vol24h:0.18e9,rank:22 },
  { id:"litecoin",     sym:"LTC",  name:"Litecoin",   img:"https://cryptologos.cc/logos/litecoin-ltc-logo.png",       price:85,     pct24h:-0.4,  mcap:6.3e9,  vol24h:0.55e9,rank:19 },
  { id:"the-open-network", sym:"TON", name:"Toncoin", img:"https://cryptologos.cc/logos/toncoin-ton-logo.png",        price:2.8,    pct24h: 0.9,  mcap:7.1e9,  vol24h:0.2e9, rank:21 },
  { id:"arbitrum",     sym:"ARB",  name:"Arbitrum",   img:"https://cryptologos.cc/logos/arbitrum-arb-logo.png",       price:0.38,   pct24h: 1.5,  mcap:1.5e9,  vol24h:0.15e9,rank:46 },
  { id:"optimism",     sym:"OP",   name:"Optimism",   img:"https://cryptologos.cc/logos/optimism-ethereum-op-logo.png",price:0.8,   pct24h: 0.7,  mcap:0.9e9,  vol24h:0.12e9,rank:58 },
  { id:"aptos",        sym:"APT",  name:"Aptos",      img:"https://cryptologos.cc/logos/aptos-apt-logo.png",          price:5.3,    pct24h: 3.1,  mcap:3.6e9,  vol24h:0.35e9,rank:27 },
  { id:"tron",         sym:"TRX",  name:"TRON",       img:"https://cryptologos.cc/logos/tron-trx-logo.png",           price:0.22,   pct24h: 0.3,  mcap:19.5e9, vol24h:1.1e9, rank:10 },
  { id:"pepe",         sym:"PEPE", name:"Pepe",       img:"https://cryptologos.cc/logos/pepe-pepe-logo.png",          price:0.000008,pct24h:3.4,  mcap:3.3e9,  vol24h:0.6e9, rank:30 },
  { id:"celestia",     sym:"TIA",  name:"Celestia",   img:"https://cryptologos.cc/logos/celestia-tia-logo.png",       price:2.8,    pct24h: 1.8,  mcap:1.4e9,  vol24h:0.18e9,rank:50 },
  { id:"hyperliquid",  sym:"HYPE", name:"Hyperliquid",img:"https://cryptologos.cc/logos/hyperliquid-hype-logo.png",   price:24,     pct24h: 4.2,  mcap:7.2e9,  vol24h:0.9e9, rank:18 },
  { id:"render-token", sym:"RNDR", name:"Render",     img:"https://cryptologos.cc/logos/render-token-rndr-logo.png",  price:3.5,    pct24h: 1.6,  mcap:1.8e9,  vol24h:0.12e9,rank:45 },
  { id:"injective-protocol", sym:"INJ", name:"Injective",img:"https://cryptologos.cc/logos/injective-protocol-inj-logo.png",price:12,pct24h:2.1,mcap:1.2e9,vol24h:0.25e9,rank:55 },
];

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type Asset    = { id:string; sym:string; name:string; img:string; price:number; pct24h:number; mcap:number; vol24h:number; rank?:number };
type CgCoin   = { id:string; symbol:string; name:string; image:string; current_price:number|null; price_change_percentage_24h:number|null; market_cap:number|null; total_volume:number|null; market_cap_rank?:number|null };
type BinTk    = { symbol:string; lastPrice:string; priceChangePercent:string; quoteVolume:string; highPrice:string; lowPrice:string };
type BinKline = [number,string,string,string,string,string,number,string,number,string,string,string];
type Candle   = { time:number; open:number; high:number; low:number; close:number; volume:number };
type OBRow    = { price:number; qty:number; total:number };
type Ind      = { ema20:number; ema50:number; ema200:number; rsi:number; macdHist:number; bbPct:number; vwap:number; atr:number; atrPct:number; volSpike:number; support:number; resistance:number; score:number; bias:"LONG"|"SHORT"|"NEUTRAL" };
type BottomTab = "Positions"|"Orders"|"History";
type PracticeMode = "live" | "replay";
const INITIAL_VISIBLE = 100; // initial candles shown in replay before the user starts

type DemoPos = {
  id:string; sym:string; name:string; img:string;
  side:"LONG"|"SHORT"; qty:number; avgPrice:number;
  margin:number; leverage:number; liqPrice:number;
  sl?:number; tp?:number; openedAt:string;
};
type DemoOrder = {
  id:string; sym:string; name:string; img:string;
  side:"LONG"|"SHORT"; type:"Market"|"Limit";
  notional:number; leverage:number; limitPrice?:number; sl?:number; tp?:number; createdAt:string;
};
type DemoTrade = {
  id:string; sym:string; side:"LONG"|"SHORT"; action:"OPEN"|"CLOSE";
  qty:number; price:number; leverage:number; pnl:number; roe:number; createdAt:string;
};
type DemoAcc = { cash:number; positions:DemoPos[]; orders:DemoOrder[]; trades:DemoTrade[] };

type MlPred = {
  interval:  string;
  signal:    string;
  confidence:number|null;
  accuracy:  number|null;
  stop_loss: number|null;
  take_profit:number|null;
  price:     number|null;
  created_at:string;
};

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
const fUsd  = (v:number, compact=false) => {
  if (!Number.isFinite(v)) return "---";
  if (compact && Math.abs(v)>=1e12) return `$${(v/1e12).toFixed(2)}T`;
  if (compact && Math.abs(v)>=1e9)  return `$${(v/1e9).toFixed(2)}B`;
  if (compact && Math.abs(v)>=1e6)  return `$${(v/1e6).toFixed(2)}M`;
  if (v>0 && v<0.01) return `$${v.toFixed(8)}`;
  return v.toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:v>=100?2:4,maximumFractionDigits:v>=100?2:8});
};
const fPct  = (v:number) => `${v>=0?"+":""}${Number.isFinite(v)?v.toFixed(2):"0.00"}%`;
const fQty  = (v:number) => Number.isFinite(v)?v.toLocaleString("en-US",{maximumFractionDigits:v<1?6:4}):"---";
const fRoe  = (v:number) => `${v>=0?"+":""}${v.toFixed(2)}%`;
const getPair = (sym:string) => { const n=sym.toUpperCase(); if(n==="USDT"||n==="USDC") return "USDCUSDT"; if(n==="MATIC") return "POLUSDT"; return `${n}USDT`; };
const parseJ  = <T,>(v:string|null):T|null => { if(!v) return null; try{return JSON.parse(v) as T}catch{return null}};
const clamp   = (v:number,mn:number,mx:number) => Math.min(mx,Math.max(mn,v));
const now     = () => new Date().toISOString(); // ISO 8601 — safe for DB sorting and parsing

// ─────────────────────────────────────────────
// DEMO ACCOUNT
// ─────────────────────────────────────────────
const makeAcc = (): DemoAcc => ({ cash:DEMO_START, positions:[], orders:[], trades:[] });

const sanitize = (raw:DemoAcc): DemoAcc => ({
  cash:      Number.isFinite(raw.cash) && raw.cash > -1000 ? raw.cash : DEMO_START,
  positions: Array.isArray(raw.positions)
    ? raw.positions.filter(p=>p?.id && typeof p.qty==="number" && p.qty>0 && p.margin>0 && p.avgPrice>0)
    : [],
  orders: Array.isArray(raw.orders)
    ? raw.orders.filter(o=>o?.id && typeof o.notional==="number" && o.notional>0)
    : [],
  trades: Array.isArray(raw.trades)
    ? raw.trades
        .filter(t=>t?.id && t.sym && typeof t.price==="number" && t.price>=0)
        .slice(0, 200)
    : [],
});

// LocalStorage fallback (для незалогінених)
const loadAcc = (key:string):DemoAcc => {
  if(typeof window==="undefined") return makeAcc();
  const r = parseJ<DemoAcc>(window.localStorage.getItem(key));
  return r ? sanitize(r) : makeAcc();
};
const saveAcc = (key:string, acc:DemoAcc) => {
  if(typeof window==="undefined") return;
  window.localStorage.setItem(key, JSON.stringify(acc));
};

// ─── Supabase: нормалізована схема ───────────────────────────────────────────
// 4 таблиці: demo_accounts | demo_positions | demo_orders | demo_trades
// Кожна позиція/ордер/угода = окремий рядок → зручно бачити в Supabase

type DbPos = {
  id:string;user_id:string;sym:string;name:string;img:string;side:string;
  qty:number;avg_price:number;margin:number;leverage:number;liq_price:number;
  sl:number|null;tp:number|null;opened_at:string;
};
type DbOrd = {
  id:string;user_id:string;sym:string;name:string;img:string;side:string;
  order_type:string;notional:number;leverage:number;
  limit_price:number|null;sl:number|null;tp:number|null;created_at:string;
};
type DbTrade = {
  id:string;user_id:string;sym:string;side:string;action:string;
  qty:number;price:number;leverage:number;pnl:number;roe:number;created_at:string;
};

async function dbLoad(userId:string): Promise<DemoAcc|null> {
  try {
    const [accR,posR,ordR,trR] = await Promise.all([
      supabase.from(DB_ACCOUNT).select("cash").eq("user_id",userId).maybeSingle(),
      supabase.from(DB_POSITIONS).select("*").eq("user_id",userId),
      supabase.from(DB_ORDERS).select("*").eq("user_id",userId),
      supabase.from(DB_TRADES).select("*").eq("user_id",userId)
        .order("created_at",{ascending:false}).limit(200),
    ]);
    if(!accR.data) return null; // рахунок ще не створено

    const positions:DemoPos[] = ((posR.data??[]) as DbPos[]).map(p=>({
      id:p.id, sym:p.sym, name:p.name, img:p.img,
      side:p.side as "LONG"|"SHORT", qty:+p.qty, avgPrice:+p.avg_price,
      margin:+p.margin, leverage:+p.leverage as LeverageVal,
      liqPrice:+p.liq_price, sl:p.sl??undefined, tp:p.tp??undefined,
      openedAt:p.opened_at,
    }));
    const orders:DemoOrder[] = ((ordR.data??[]) as DbOrd[]).map(o=>({
      id:o.id, sym:o.sym, name:o.name, img:o.img,
      side:o.side as "LONG"|"SHORT", type:o.order_type as "Market"|"Limit",
      notional:+o.notional, leverage:+o.leverage as LeverageVal,
      limitPrice:o.limit_price??undefined, sl:o.sl??undefined, tp:o.tp??undefined,
      createdAt:o.created_at,
    }));
    const trades:DemoTrade[] = ((trR.data??[]) as DbTrade[]).map(t=>({
      id:t.id, sym:t.sym, side:t.side as "LONG"|"SHORT",
      action:t.action as "OPEN"|"CLOSE", qty:+t.qty, price:+t.price,
      leverage:+t.leverage, pnl:+t.pnl, roe:+t.roe, createdAt:t.created_at,
    }));

    return sanitize({ cash:+(accR.data as {cash:number}).cash, positions, orders, trades });
  } catch(e){ console.error("dbLoad:",e); return null; }
}

async function dbSave(userId:string, acc:DemoAcc): Promise<void> {
  try {
    // 1. Upsert рахунок (cash)
    await supabase.from(DB_ACCOUNT)
      .upsert({user_id:userId, cash:acc.cash, updated_at:new Date().toISOString()},
              {onConflict:"user_id"});

    // 2. Синхронізуємо позиції атомарно: спочатку upsert актуальних,
    //    потім видаляємо застарілі. Якщо другий крок впаде — дані не втрачаються.
    if(acc.positions.length>0){
      await supabase.from(DB_POSITIONS).upsert(acc.positions.map(p=>({
        id:p.id, user_id:userId, sym:p.sym, name:p.name, img:p.img,
        side:p.side, qty:p.qty, avg_price:p.avgPrice, margin:p.margin,
        leverage:p.leverage, liq_price:p.liqPrice,
        sl:p.sl??null, tp:p.tp??null, opened_at:p.openedAt,
      })), {onConflict:"id"});
      const keepIds = acc.positions.map(p=>p.id);
      await supabase.from(DB_POSITIONS).delete()
        .eq("user_id",userId)
        .not("id","in",`(${keepIds.join(",")})`);
    } else {
      await supabase.from(DB_POSITIONS).delete().eq("user_id",userId);
    }

    // 3. Синхронізуємо ордери атомарно (та ж стратегія)
    if(acc.orders.length>0){
      await supabase.from(DB_ORDERS).upsert(acc.orders.map(o=>({
        id:o.id, user_id:userId, sym:o.sym, name:o.name, img:o.img,
        side:o.side, order_type:o.type, notional:o.notional, leverage:o.leverage,
        limit_price:o.limitPrice??null, sl:o.sl??null, tp:o.tp??null,
        created_at:o.createdAt,
      })), {onConflict:"id"});
      const keepOrderIds = acc.orders.map(o=>o.id);
      await supabase.from(DB_ORDERS).delete()
        .eq("user_id",userId)
        .not("id","in",`(${keepOrderIds.join(",")})`);
    } else {
      await supabase.from(DB_ORDERS).delete().eq("user_id",userId);
    }

    // 4. Upsert угоди (тільки додаємо, не видаляємо)
    if(acc.trades.length>0){
      await supabase.from(DB_TRADES).upsert(
        acc.trades.slice(0,200).map(t=>({
          id:t.id, user_id:userId, sym:t.sym, side:t.side, action:t.action,
          qty:t.qty, price:t.price, leverage:t.leverage,
          pnl:t.pnl, roe:t.roe, created_at:t.createdAt,
        })),
        {onConflict:"id"}
      );
    }
  } catch(e){ console.warn("dbSave:",e); }
}

async function dbReset(userId:string): Promise<void> {
  try {
    await Promise.all([
      supabase.from(DB_ACCOUNT).upsert({user_id:userId, cash:DEMO_START, updated_at:new Date().toISOString()},{onConflict:"user_id"}),
      supabase.from(DB_POSITIONS).delete().eq("user_id",userId),
      supabase.from(DB_ORDERS).delete().eq("user_id",userId),
      supabase.from(DB_TRADES).delete().eq("user_id",userId),
    ]);
  } catch(e){ console.warn("dbReset:",e); }
}

// ─────────────────────────────────────────────
// MATH & INDICATORS
// ─────────────────────────────────────────────
const sma  = (v:number[],p:number) => v.length<p?(v.at(-1)??0):v.slice(-p).reduce((s,x)=>s+x,0)/p;
const ema  = (v:number[],p:number) => { if(!v.length)return 0; const k=2/(p+1); return v.reduce((prev,x,i)=>i===0?x:x*k+prev*(1-k),v[0]); };
const std  = (v:number[]) => { if(!v.length)return 0; const m=v.reduce((s,x)=>s+x,0)/v.length; return Math.sqrt(v.reduce((s,x)=>s+(x-m)**2,0)/v.length); };
const rsi  = (c:number[],p=14) => { if(c.length<=p)return 50; let g=0,l=0; for(let i=c.length-p;i<c.length;i++){const d=c[i]-c[i-1];if(d>=0)g+=d;else l-=d;} if(l===0)return 100; return 100-100/(1+(g/p)/(l/p)); };
const atr  = (cs:Candle[],p=14) => { if(cs.length<p+1)return 0; const sl=cs.slice(-p); const rs=sl.map((c,i)=>{const pc=i===0?cs[cs.length-p-1].close:sl[i-1].close; return Math.max(c.high-c.low,Math.abs(c.high-pc),Math.abs(c.low-pc))}); return rs.reduce((s,r)=>s+r,0)/rs.length; };

const calcInd = (cs:Candle[]): Ind => {
  const cl=cs.map(c=>c.close), hi=cs.map(c=>c.high), lo=cs.map(c=>c.low), vl=cs.map(c=>c.volume);
  const last=cs.at(-1)??{close:0,high:0,low:0,volume:0};
  const e20=ema(cl,20), e50=ema(cl,50), e200=ema(cl,200);
  const macdLine=ema(cl,12)-ema(cl,26);
  const macdSig=ema(cl.map((_,i)=>ema(cl.slice(0,i+1),12)-ema(cl.slice(0,i+1),26)),9);
  const macdH=macdLine-macdSig;
  const r=rsi(cl); const c20=cl.slice(-20); const mid=sma(c20,Math.min(20,c20.length)); const dv=std(c20);
  const bbU=mid+dv*2, bbL=mid-dv*2, bbP=bbU===bbL?50:((last.close-bbL)/(bbU-bbL))*100;
  const totPV=cs.reduce((s,c)=>s+((c.high+c.low+c.close)/3)*c.volume,0), totV=cs.reduce((s,c)=>s+c.volume,0);
  const vwap=totV?totPV/totV:last.close;
  const a=atr(cs);
  const avgV=sma(vl,Math.min(20,vl.length)), vs=avgV?last.volume/avgV:1;
  const sup=Math.min(...lo.slice(-48)), res=Math.max(...hi.slice(-48));
  let ts=0;
  if(last.close>e20)ts++;if(e20>e50)ts++;if(e50>e200)ts++;
  if(r>52&&r<72)ts++;if(macdH>0)ts++;if(vs>1.15)ts++;
  if(last.close<e20)ts--;if(macdH<0)ts--;if(r>78)ts--;
  return {ema20:e20,ema50:e50,ema200:e200,rsi:r,macdHist:macdH,bbPct:bbP,vwap,atr:a,atrPct:last.close?(a/last.close)*100:0,volSpike:vs,support:sup,resistance:res,score:ts,bias:ts>=3?"LONG":ts<=-1?"SHORT":"NEUTRAL"};
};

const mapK  = (r:BinKline):Candle => ({time:r[0],open:+r[1],high:+r[2],low:+r[3],close:+r[4],volume:+r[5]});

// ── Indicator array calculations ──
const calcEmaArr = (closes: number[], period: number): number[] => {
  if (closes.length < period) return closes.map(() => 0);
  const k = 2 / (period + 1); const res: number[] = [];
  let e = closes.slice(0, period).reduce((s,x)=>s+x,0) / period;
  for (let i = 0; i < closes.length; i++) {
    if (i < period-1) { res.push(0); continue; }
    if (i === period-1) { res.push(e); continue; }
    e = closes[i]*k + e*(1-k); res.push(e);
  }
  return res;
};
const calcVwapArr = (candles: Candle[]): number[] => {
  let cpv=0, cv=0;
  return candles.map(c => { const tp=(c.high+c.low+c.close)/3; cpv+=tp*c.volume; cv+=c.volume; return cv>0?cpv/cv:c.close; });
};
const calcBbBands = (closes: number[], period=20, mult=2) => {
  const upper: number[]=[], lower: number[]=[];
  for (let i=0; i<closes.length; i++) {
    if (i<period-1){upper.push(0);lower.push(0);continue;}
    const sl=closes.slice(i-period+1,i+1), m=sl.reduce((s,x)=>s+x,0)/period;
    const sd=Math.sqrt(sl.reduce((s,x)=>s+(x-m)**2,0)/period);
    upper.push(m+mult*sd); lower.push(m-mult*sd);
  }
  return {upper,lower};
};

const getPnl = (pos:DemoPos, price:number) => pos.side==="LONG"?(price-pos.avgPrice)*pos.qty:(pos.avgPrice-price)*pos.qty;
const getLiqPrice = (side:"LONG"|"SHORT", avgPrice:number, lev:number) =>
  lev<=1 ? 0 : side==="LONG" ? avgPrice*(1-0.9/lev) : avgPrice*(1+0.9/lev);

// ─────────────────────────────────────────────
// DEMO TRADING LOGIC
// ─────────────────────────────────────────────
const execOpen = (acc:DemoAcc, order:DemoOrder, fill:number): {next:DemoAcc; error?:string} => {
  if(!Number.isFinite(order.notional)||order.notional<=0) return {next:acc,error:"Вкажіть коректну суму."};
  if(acc.cash<order.notional) return {next:acc,error:`Недостатньо USDT. Баланс: ${fUsd(acc.cash)}`};
  const lev  = order.leverage;
  const qty  = (order.notional*lev)/fill;
  const liqP = getLiqPrice(order.side, fill, lev);
  const ex   = acc.positions.find(p=>p.sym===order.sym&&p.side===order.side);
  const rest = acc.positions.filter(p=>!(p.sym===order.sym&&p.side===order.side));
  const merged:DemoPos = ex
    ? { ...ex, qty:ex.qty+qty, avgPrice:(ex.avgPrice*ex.qty+fill*qty)/(ex.qty+qty), margin:ex.margin+order.notional, leverage:lev, liqPrice:getLiqPrice(order.side,(ex.avgPrice*ex.qty+fill*qty)/(ex.qty+qty),lev), sl:order.sl??ex.sl, tp:order.tp??ex.tp }
    : { id:crypto.randomUUID(), sym:order.sym, name:order.name, img:order.img, side:order.side, qty, avgPrice:fill, margin:order.notional, leverage:lev, liqPrice:liqP, sl:order.sl, tp:order.tp, openedAt:now() };
  const trade:DemoTrade = {id:crypto.randomUUID(),sym:order.sym,side:order.side,action:"OPEN",qty,price:fill,leverage:lev,pnl:0,roe:0,createdAt:now()};
  return {next:{cash:acc.cash-order.notional,positions:[merged,...rest],orders:acc.orders,trades:[trade,...acc.trades].slice(0,100)}};
};

const execClose = (acc:DemoAcc, pos:DemoPos, fill:number): DemoAcc => {
  const pnl = getPnl(pos,fill);
  const roe = (pnl/pos.margin)*100;
  const trade:DemoTrade = {id:crypto.randomUUID(),sym:pos.sym,side:pos.side,action:"CLOSE",qty:pos.qty,price:fill,leverage:pos.leverage,pnl,roe,createdAt:now()};
  return {cash:acc.cash+pos.margin+pnl,positions:acc.positions.filter(p=>p.id!==pos.id),orders:acc.orders,trades:[trade,...acc.trades].slice(0,100)};
};

// ─────────────────────────────────────────────
// FETCH MARKETS — той самий підхід що й MarketsPage (250 монет)
// ─────────────────────────────────────────────
const STABLE = new Set(["USDT","USDC","DAI","FDUSD","TUSD","USDD","USDS","BUSD"]);

async function fetchMarkets(): Promise<Asset[]> {
  const cached = parseJ<{savedAt:number;assets:Asset[]}>(sessionStorage.getItem(MARKET_CACHE_KEY));
  if(cached&&Date.now()-cached.savedAt<120_000) return cached.assets;

  try {
    const [cgRes, binRes] = await Promise.all([
      fetch("/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false"),
      fetch("/api/binance/ticker/24hr"),
    ]);
    const binance:BinTk[] = binRes.ok ? await binRes.json() : [];
    const byPair = new Map(binance.map(t=>[t.symbol,t]));

    if(cgRes.ok) {
      const cg:CgCoin[] = await cgRes.json();
      const assets = cg
        .map<Asset>(c=>{
          const sym=c.symbol.toUpperCase();
          const tk=byPair.get(getPair(sym));
          return {id:c.id, sym, name:c.name, img:c.image,
            price:+(tk?.lastPrice??c.current_price??0),
            pct24h:+(tk?.priceChangePercent??c.price_change_percentage_24h??0),
            mcap:c.market_cap??0, vol24h:+(tk?.quoteVolume??c.total_volume??0),
            rank:c.market_cap_rank??undefined};
        })
        .filter(a=>a.price>0&&!STABLE.has(a.sym))
        .slice(0,150);
      sessionStorage.setItem(MARKET_CACHE_KEY, JSON.stringify({savedAt:Date.now(),assets}));
      return assets;
    }
  } catch(e){ console.error("fetchMarkets:",e); }
  return FALLBACK.filter(a=>!STABLE.has(a.sym));
}

// ─────────────────────────────────────────────
// LIGHTWEIGHT CHART COMPONENT
// ─────────────────────────────────────────────
// Primary TFs shown as buttons; secondary go into the "▾ Ще" dropdown
const TF_PRIMARY  = ["1m","5m","15m","30m","1h","4h","1d","1w"] as const;
const TF_SECONDARY = ["3m","2h","6h","8h","12h","3d","1M"] as const;
const TF_OPTIONS  = [...TF_PRIMARY, ...TF_SECONDARY] as const;
const IND_LS_KEY = "cpulse_chart_inds_v1";
const IND_DEFAULTS = { vol:true, ema20:false, ema50:false, ema200:false, vwap:false, bb:false } as Record<string,boolean>;
const loadInds = (): Record<string,boolean> => { try { return JSON.parse(localStorage.getItem(IND_LS_KEY)??"{}"); } catch { return {}; } };
type ChartTf = (typeof TF_OPTIONS)[number];
const TF_BINANCE: Record<ChartTf,string> = {
  "1m":"1m","3m":"3m","5m":"5m","15m":"15m","30m":"30m",
  "1h":"1h","2h":"2h","4h":"4h","6h":"6h","8h":"8h","12h":"12h",
  "1d":"1d","3d":"3d","1w":"1w","1M":"1M",
};
const TF_LABELS: Record<ChartTf,string> = {
  "1m":"1хв","3m":"3хв","5m":"5хв","15m":"15хв","30m":"30хв",
  "1h":"1год","2h":"2год","4h":"4год","6h":"6год","8h":"8год","12h":"12год",
  "1d":"1д","3d":"3д","1w":"1тиж","1M":"1міс",
};

type DrawMode = "cursor" | "hline";
const ALERT_CONDS_PRICE = new Set(["price_gt","price_gte","price_lt","price_lte","price_eq"]);
type PosLines = { entry?: IPriceLine; liq?: IPriceLine; sl?: IPriceLine; tp?: IPriceLine };

/** Floating badge shown bottom-left of the chart when an alert fires */
function ChartAlertBadge({ msg }: { msg: string }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading]   = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 4000);
    const t2 = setTimeout(() => setVisible(false), 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  if (!visible) return null;
  return (
    <div
      className="absolute bottom-10 left-3 z-20 pointer-events-none flex items-start gap-2
                 bg-[#0B0B12]/95 border border-[#8348C1]/60 rounded-xl px-3 py-2.5 shadow-xl
                 max-w-[260px] transition-opacity duration-700"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <span className="text-[16px] leading-none shrink-0">🚨</span>
      <span className="text-[11px] font-semibold text-[#E0C4FF] leading-snug break-words">
        {msg.replace("🚨 ", "")}
      </span>
    </div>
  );
}

function TradingLWChart({
  pair, alerts, positions,
  onUpdatePositionSlTp, onUpdateAlertPrice, onAlertTriggered, onAlertClick,
  chartAlertNotif,
  replayCandles, replayIndex,
}: {
  pair: string;
  alerts: PriceAlertRecord[];
  positions: DemoPos[];
  onUpdatePositionSlTp: (posId: string, sl?: number, tp?: number) => void;
  onUpdateAlertPrice: (alertId: string, price: number) => void;
  onAlertTriggered: (alert: PriceAlertRecord, price: number) => void | Promise<void>;
  onAlertClick: (alertId: string) => void;
  chartAlertNotif?: { msg: string; ts: number } | null;
  replayCandles?: Candle[];
  replayIndex?: number;
}) {
  const containerRef     = useRef<HTMLDivElement>(null);
  const chartRef         = useRef<IChartApi|null>(null);
  const seriesRef        = useRef<ISeriesApi<"Candlestick">|ISeriesApi<"Area">|null>(null);
  const posLinesMapRef   = useRef<Map<string,PosLines>>(new Map());
  const alertLinesMapRef = useRef<Map<string,IPriceLine>>(new Map());
  const userLinesRef     = useRef<IPriceLine[]>([]);
  const userPricesRef    = useRef<number[]>([]);
  const currentKRef      = useRef<{o:number;h:number;l:number;c:number;t:number}|null>(null);
  const rafRef           = useRef<number|null>(null);
  const prevPriceRef     = useRef<number>(0);
  const alertCooldownRef = useRef<Set<string>>(new Set());
  const hasDraggedRef    = useRef(false);
  const alertsRef        = useRef(alerts);
  const positionsRef     = useRef(positions);
  const drawModeRef      = useRef<DrawMode>("cursor");
  const ctypeRef         = useRef<"candle"|"area">("candle");
  const onUpdateSlTpRef  = useRef(onUpdatePositionSlTp);
  const onUpdateAlertPriceRef = useRef(onUpdateAlertPrice);
  const onAlertTriggeredRef   = useRef(onAlertTriggered);
  const onAlertClickRef       = useRef(onAlertClick);

  const [tf, setTf]           = useState<ChartTf>("4h");
  const [showTfMore, setShowTfMore] = useState(false);
  const [ctype, setCtype]     = useState<"candle"|"area">("candle");
  const [drawMode, setDrawMode] = useState<DrawMode>("cursor");
  const [loading, setLoading] = useState(true);
  const [inds, setInds]       = useState<Record<string,boolean>>(() => ({ ...IND_DEFAULTS, ...loadInds() }));

  const indsRef          = useRef(inds);
  const rawKlinesRef     = useRef<(string|number)[][]>([]);
  const indSeriesMapRef  = useRef<Map<string, object>>(new Map());

  // Replay chart tracking
  const prevReplayIdxRef     = useRef(-1);
  const prevReplayCandlesRef = useRef<Candle[] | undefined>(undefined);
  const isReplay = !!replayCandles && replayCandles.length > 0;

  useEffect(() => { alertsRef.current = alerts; }, [alerts]);
  useEffect(() => { positionsRef.current = positions; }, [positions]);
  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);
  useEffect(() => { ctypeRef.current = ctype; }, [ctype]);
  useEffect(() => { onUpdateSlTpRef.current = onUpdatePositionSlTp; }, [onUpdatePositionSlTp]);
  useEffect(() => { onUpdateAlertPriceRef.current = onUpdateAlertPrice; }, [onUpdateAlertPrice]);
  useEffect(() => { onAlertTriggeredRef.current = onAlertTriggered; }, [onAlertTriggered]);
  useEffect(() => { onAlertClickRef.current = onAlertClick; }, [onAlertClick]);

  // ── Indicator helpers ──
  const clearIndSeries = useCallback(() => {
    if (!chartRef.current) return;
    indSeriesMapRef.current.forEach(s => {
      try { chartRef.current!.removeSeries(s as ISeriesApi<"Line">); } catch {/* ignore */}
    });
    indSeriesMapRef.current.clear();
  }, []);

  const buildIndSeries = useCallback((raw: (string|number)[][]) => {
    if (!chartRef.current || !raw.length) return;
    const chart = chartRef.current;
    const cur = indsRef.current;
    const times = raw.map(k => Math.floor(Number(k[0])/1000) as Time);
    const closes = raw.map(k => +k[4]);

    if (cur.vol) {
      try {
        const vs = chart.addSeries(HistogramSeries, { priceScaleId:"vol", lastValueVisible:false, priceLineVisible:false });
        chart.priceScale("vol").applyOptions({ scaleMargins:{ top:0.78, bottom:0 } });
        vs.setData(raw.map((k,i) => ({ time:times[i], value:+k[5], color: +k[4]>= +k[1]?"rgba(38,166,154,0.45)":"rgba(239,83,80,0.45)" })));
        indSeriesMapRef.current.set("vol", vs);
      } catch {/* ignore */}
    }
    if (cur.ema20) {
      try {
        const arr = calcEmaArr(closes, 20);
        const s = chart.addSeries(LineSeries, { color:"#F7931A", lineWidth:1, lastValueVisible:false, priceLineVisible:false, crosshairMarkerVisible:false });
        s.setData(arr.map((v,i) => ({ time:times[i], value:v })).filter(d => d.value > 0));
        indSeriesMapRef.current.set("ema20", s);
      } catch {/* ignore */}
    }
    if (cur.ema50) {
      try {
        const arr = calcEmaArr(closes, 50);
        const s = chart.addSeries(LineSeries, { color:"#9945FF", lineWidth:1, lastValueVisible:false, priceLineVisible:false, crosshairMarkerVisible:false });
        s.setData(arr.map((v,i) => ({ time:times[i], value:v })).filter(d => d.value > 0));
        indSeriesMapRef.current.set("ema50", s);
      } catch {/* ignore */}
    }
    if (cur.ema200) {
      try {
        const arr = calcEmaArr(closes, 200);
        const s = chart.addSeries(LineSeries, { color:"#14F195", lineWidth:1, lastValueVisible:false, priceLineVisible:false, crosshairMarkerVisible:false });
        s.setData(arr.map((v,i) => ({ time:times[i], value:v })).filter(d => d.value > 0));
        indSeriesMapRef.current.set("ema200", s);
      } catch {/* ignore */}
    }
    if (cur.vwap) {
      try {
        const candles2: Candle[] = raw.map(k => ({ time:+k[0], open:+k[1], high:+k[2], low:+k[3], close:+k[4], volume:+k[5] }));
        const arr = calcVwapArr(candles2);
        const s = chart.addSeries(LineSeries, { color:"#00BFFF", lineWidth:1, lineStyle:LineStyle.Dashed, lastValueVisible:false, priceLineVisible:false, crosshairMarkerVisible:false });
        s.setData(arr.map((v,i) => ({ time:times[i], value:v })));
        indSeriesMapRef.current.set("vwap", s);
      } catch {/* ignore */}
    }
    if (cur.bb) {
      try {
        const { upper, lower } = calcBbBands(closes);
        const su = chart.addSeries(LineSeries, { color:"rgba(147,196,255,0.55)", lineWidth:1, lastValueVisible:false, priceLineVisible:false, crosshairMarkerVisible:false });
        su.setData(upper.map((v,i) => ({ time:times[i], value:v })).filter(d => d.value > 0));
        const sl2 = chart.addSeries(LineSeries, { color:"rgba(147,196,255,0.55)", lineWidth:1, lastValueVisible:false, priceLineVisible:false, crosshairMarkerVisible:false });
        sl2.setData(lower.map((v,i) => ({ time:times[i], value:v })).filter(d => d.value > 0));
        indSeriesMapRef.current.set("bb_u", su);
        indSeriesMapRef.current.set("bb_l", sl2);
      } catch {/* ignore */}
    }
  }, []);

  // Persist inds to localStorage + rebuild on change
  useEffect(() => {
    indsRef.current = inds;
    localStorage.setItem(IND_LS_KEY, JSON.stringify(inds));
    if (rawKlinesRef.current.length > 0) {
      clearIndSeries();
      buildIndSeries(rawKlinesRef.current);
    }
  }, [inds, clearIndSeries, buildIndSeries]);

  // ── Create chart (once) ──
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "rgba(255,255,255,0.4)" },
      grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
      crosshair: { mode: CrosshairMode.Normal,
        vertLine: { color:"#8348C1",width:1,style:3,labelBackgroundColor:"#8348C1" },
        horzLine: { color:"#8348C1",width:1,style:3,labelBackgroundColor:"#8348C1" } },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
      timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: true, secondsVisible: false },
      autoSize: true,
    });
    chartRef.current = chart;

    // ── Drawing: click handler (reads drawModeRef so no re-subscribe needed) ──
    chart.subscribeClick((param) => {
      if (drawModeRef.current !== "hline") return;
      if (!param.point || !seriesRef.current) return;
      const price = seriesRef.current.coordinateToPrice(param.point.y);
      if (!price || price <= 0) return;
      const label = price < 1 ? price.toFixed(6) : price.toLocaleString("en-US",{maximumFractionDigits:2});
      try {
        const line = seriesRef.current.createPriceLine({
          price, color: "#94A3B8", lineWidth: 1, lineStyle: LineStyle.Solid,
          axisLabelVisible: true, title: label,
        });
        userLinesRef.current.push(line);
        userPricesRef.current.push(price);
      } catch {/* ignore */}
      setDrawMode("cursor");
    });

    return () => { chart.remove(); chartRef.current = null; };
  }, []);

  // ── Refresh position + alert lines (map-based for drag access) ──
  const refreshLines = useCallback(() => {
    if (!seriesRef.current) return;

    // Remove old position lines
    posLinesMapRef.current.forEach(lines => {
      for (const line of Object.values(lines)) {
        if (line) try { seriesRef.current!.removePriceLine(line); } catch {/* ignore */}
      }
    });
    posLinesMapRef.current.clear();

    // Remove old alert lines
    alertLinesMapRef.current.forEach(line => {
      try { seriesRef.current!.removePriceLine(line); } catch {/* ignore */}
    });
    alertLinesMapRef.current.clear();

    // Draw position lines
    positionsRef.current.forEach(pos => {
      if (!seriesRef.current) return;
      const isLong = pos.side === "LONG";
      const pl: PosLines = {};
      try {
        pl.entry = seriesRef.current.createPriceLine({
          price: pos.avgPrice, color: isLong ? "#25DE28" : "#F40000",
          lineWidth: 2, lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: isLong ? `L ${pos.leverage}x` : `S ${pos.leverage}x`,
        });
        if (pos.liqPrice > 0) {
          pl.liq = seriesRef.current.createPriceLine({
            price: pos.liqPrice, color: "#FF9800",
            lineWidth: 1, lineStyle: LineStyle.Dashed,
            axisLabelVisible: true, title: "Liq",
          });
        }
        if (pos.sl && pos.sl > 0) {
          pl.sl = seriesRef.current.createPriceLine({
            price: pos.sl, color: "#F40000",
            lineWidth: 1, lineStyle: LineStyle.SparseDotted,
            axisLabelVisible: true, title: "SL",
          });
        }
        if (pos.tp && pos.tp > 0) {
          pl.tp = seriesRef.current.createPriceLine({
            price: pos.tp, color: "#25DE28",
            lineWidth: 1, lineStyle: LineStyle.SparseDotted,
            axisLabelVisible: true, title: "TP",
          });
        }
        posLinesMapRef.current.set(pos.id, pl);
      } catch {/* ignore */}
    });

    // Draw alert lines (price-based only, dashed)
    alertsRef.current
      .filter(a => a.is_active !== false && ALERT_CONDS_PRICE.has(a.condition))
      .forEach(al => {
        if (!seriesRef.current) return;
        const isUp = al.condition === "price_gt" || al.condition === "price_gte";
        const isEq = al.condition === "price_eq";
        const color = isUp ? "#25DE28" : isEq ? "#C38BFF" : "#F40000";
        try {
          const line = seriesRef.current.createPriceLine({
            price: al.target_price, color, lineWidth: 1, lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: isUp ? "▲" : isEq ? "●" : "▼",
          });
          alertLinesMapRef.current.set(al.id, line);
        } catch {/* ignore */}
      });
  }, []);

  // ── Re-draw user lines on series change ──
  const refreshUserLines = useCallback(() => {
    if (!seriesRef.current) return;
    userLinesRef.current = [];
    userPricesRef.current.forEach(price => {
      if (!seriesRef.current) return;
      const label = price < 1 ? price.toFixed(6) : price.toLocaleString("en-US",{maximumFractionDigits:2});
      try {
        userLinesRef.current.push(seriesRef.current.createPriceLine({
          price, color: "#94A3B8", lineWidth: 1, lineStyle: LineStyle.Solid,
          axisLabelVisible: true, title: label,
        }));
      } catch {/* ignore */}
    });
  }, []);

  // Refresh alert/position lines when they change
  useEffect(() => { refreshLines(); }, [alerts, positions, refreshLines]);

  // ── Native mouse: cursor hint + drag SL/TP/alert lines ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMove = (e: MouseEvent) => {
      if (!seriesRef.current || drawModeRef.current === "hline") return;
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const THRESHOLD = 8;
      let found = false;
      outer: for (const pos of positionsRef.current) {
        for (const v of [pos.sl, pos.tp] as (number|undefined)[]) {
          if (!v || v <= 0) continue;
          const coord = seriesRef.current.priceToCoordinate(v);
          if (coord !== null && Math.abs(y - coord) <= THRESHOLD) { found = true; break outer; }
        }
      }
      if (!found) {
        for (const al of alertsRef.current) {
          if (!ALERT_CONDS_PRICE.has(al.condition) || !al.is_active) continue;
          const coord = seriesRef.current.priceToCoordinate(al.target_price);
          if (coord !== null && Math.abs(y - coord) <= THRESHOLD) { found = true; break; }
        }
      }
      container.style.cursor = found ? "ns-resize" : "default";
    };

    const onDown = (e: MouseEvent) => {
      if (!seriesRef.current || !chartRef.current || drawModeRef.current === "hline") return;
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const THRESHOLD = 8;

      let foundLine: IPriceLine|null = null;
      let foundKind = "";
      let foundPosId = "";
      let foundAlertId = "";
      let foundInitPrice = 0;

      outer: for (const pos of positionsRef.current) {
        const pl = posLinesMapRef.current.get(pos.id);
        if (!pl) continue;
        if (pos.sl && pos.sl > 0 && pl.sl) {
          const coord = seriesRef.current.priceToCoordinate(pos.sl);
          if (coord !== null && Math.abs(y - coord) <= THRESHOLD) {
            foundLine = pl.sl; foundKind = "sl"; foundPosId = pos.id; foundInitPrice = pos.sl;
            break outer;
          }
        }
        if (pos.tp && pos.tp > 0 && pl.tp) {
          const coord = seriesRef.current.priceToCoordinate(pos.tp);
          if (coord !== null && Math.abs(y - coord) <= THRESHOLD) {
            foundLine = pl.tp; foundKind = "tp"; foundPosId = pos.id; foundInitPrice = pos.tp;
            break outer;
          }
        }
      }
      if (!foundLine) {
        for (const al of alertsRef.current) {
          if (!ALERT_CONDS_PRICE.has(al.condition) || !al.is_active) continue;
          const line = alertLinesMapRef.current.get(al.id);
          if (!line) continue;
          const coord = seriesRef.current.priceToCoordinate(al.target_price);
          if (coord !== null && Math.abs(y - coord) <= THRESHOLD) {
            foundLine = line; foundKind = "alert"; foundAlertId = al.id; foundInitPrice = al.target_price;
            break;
          }
        }
      }
      if (!foundLine) return;

      e.stopPropagation();
      container.style.cursor = "ns-resize";
      const dragLine = foundLine, dragKind = foundKind, dragPosId = foundPosId, dragAlertId = foundAlertId;
      let currentDragPrice = foundInitPrice;
      let isDragging = false;

      const onMoveDoc = (ev: MouseEvent) => {
        isDragging = true;
        const r = container.getBoundingClientRect();
        const price = seriesRef.current?.coordinateToPrice(ev.clientY - r.top);
        if (price && price > 0) {
          currentDragPrice = price;
          try { dragLine.applyOptions({ price }); } catch {/* ignore */}
        }
      };
      const onUpDoc = () => {
        document.removeEventListener("mousemove", onMoveDoc);
        document.removeEventListener("mouseup", onUpDoc);
        container.style.cursor = "default";
        if (!isDragging) {
          // It was a click (not a drag) — open edit for alert line
          if (dragKind === "alert" && dragAlertId) {
            onAlertClickRef.current(dragAlertId);
          }
          return;
        }
        hasDraggedRef.current = true;
        setTimeout(() => { hasDraggedRef.current = false; }, 200);
        if (dragKind === "sl") {
          const pos = positionsRef.current.find(p => p.id === dragPosId);
          if (pos) onUpdateSlTpRef.current(dragPosId, currentDragPrice, pos.tp);
        } else if (dragKind === "tp") {
          const pos = positionsRef.current.find(p => p.id === dragPosId);
          if (pos) onUpdateSlTpRef.current(dragPosId, pos.sl, currentDragPrice);
        } else if (dragKind === "alert") {
          onUpdateAlertPriceRef.current(dragAlertId, currentDragPrice);
        }
      };
      document.addEventListener("mousemove", onMoveDoc);
      document.addEventListener("mouseup", onUpDoc);
    };

    container.addEventListener("mousemove", onMove);
    container.addEventListener("mousedown", onDown, { capture: true });
    return () => {
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mousedown", onDown, { capture: true });
    };
  }, []); // all dynamic data via refs — no re-subscribe needed

  // ── REPLAY: render historical candles (full-rebuild or incremental) ──
  useEffect(() => {
    if (!isReplay || !chartRef.current || !replayCandles?.length || replayIndex === undefined) return;
    const chart = chartRef.current;
    const idx = replayIndex;
    const candlesChanged = replayCandles !== prevReplayCandlesRef.current;
    const needsFull = candlesChanged || prevReplayIdxRef.current < 0 || idx < prevReplayIdxRef.current || !seriesRef.current;
    prevReplayCandlesRef.current = replayCandles;

    if (needsFull) {
      if (seriesRef.current) { try { chart.removeSeries(seriesRef.current); } catch {/* ignore */} seriesRef.current = null; }
      clearIndSeries();
      const vis = replayCandles.slice(0, idx + 1);
      rawKlinesRef.current = vis.map(c => [c.time, String(c.open), String(c.high), String(c.low), String(c.close), String(c.volume), 0,"0",0,"0","0","0"]) as unknown as (string|number)[][];
      if (ctype === "candle") {
        const s = chart.addSeries(CandlestickSeries, { upColor:"#25DE28", downColor:"#F40000", borderVisible:false, wickUpColor:"#25DE28", wickDownColor:"#F40000" });
        seriesRef.current = s;
        s.setData(vis.map(c => ({ time:Math.floor(c.time/1000) as Time, open:c.open, high:c.high, low:c.low, close:c.close })));
        const last = vis[vis.length-1];
        if (last) currentKRef.current = { o:last.open, h:last.high, l:last.low, c:last.close, t:Math.floor(last.time/1000) };
      } else {
        const s = chart.addSeries(AreaSeries, { lineColor:"#B57AFF", topColor:"rgba(181,122,255,0.35)", bottomColor:"rgba(181,122,255,0)", lineWidth:2 });
        seriesRef.current = s;
        s.setData(vis.map(c => ({ time:Math.floor(c.time/1000) as Time, value:c.close })));
      }
      buildIndSeries(rawKlinesRef.current);
      refreshLines(); refreshUserLines();
      setLoading(false);
    } else {
      const c = replayCandles[idx];
      if (c && seriesRef.current) {
        try {
          if (ctype === "candle") {
            (seriesRef.current as ISeriesApi<"Candlestick">).update({ time:Math.floor(c.time/1000) as Time, open:c.open, high:c.high, low:c.low, close:c.close });
          } else {
            (seriesRef.current as ISeriesApi<"Area">).update({ time:Math.floor(c.time/1000) as Time, value:c.close });
          }
          currentKRef.current = { o:c.open, h:c.high, l:c.low, c:c.close, t:Math.floor(c.time/1000) };
        } catch {/* ignore */}
      }
    }
    prevReplayIdxRef.current = idx;
  }, [replayIndex, replayCandles, isReplay, ctype, refreshLines, refreshUserLines, clearIndSeries, buildIndSeries]);

  // Reset replay tracking refs when leaving replay
  useEffect(() => {
    if (!isReplay) { prevReplayIdxRef.current = -1; prevReplayCandlesRef.current = undefined; }
  }, [isReplay]);

  // ── Fetch candles + rebuild series ──
  useEffect(() => {
    if (!chartRef.current) return;
    if (isReplay) { setLoading(false); return; } // eslint-disable-line react-hooks/set-state-in-effect
    let dead = false;
    setLoading(true);
    currentKRef.current = null;
    prevPriceRef.current = 0;

    const load = async () => {
      try {
        const res = await fetch(`/api/binance/klines?symbol=${pair}&interval=${TF_BINANCE[tf]}&limit=500`);
        if (!res.ok || dead || !chartRef.current) return;
        const raw = await res.json() as (string|number)[][];

        if (seriesRef.current) { try { chartRef.current.removeSeries(seriesRef.current); } catch {/* ignore */} seriesRef.current = null; }
        clearIndSeries();

        rawKlinesRef.current = raw;

        if (ctype === "candle") {
          const s = chartRef.current.addSeries(CandlestickSeries, {
            upColor:"#25DE28", downColor:"#F40000", borderVisible:false,
            wickUpColor:"#25DE28", wickDownColor:"#F40000",
          });
          seriesRef.current = s;
          s.setData(raw.map(k => ({
            time: Math.floor(Number(k[0])/1000) as Time,
            open:+k[1], high:+k[2], low:+k[3], close:+k[4],
          })));
          if (raw.length > 0) {
            const last = raw[raw.length-1];
            currentKRef.current = { o:+last[1], h:+last[2], l:+last[3], c:+last[4], t:Math.floor(Number(last[0])/1000) };
          }
        } else {
          const s = chartRef.current.addSeries(AreaSeries, {
            lineColor:"#B57AFF", topColor:"rgba(181,122,255,0.35)", bottomColor:"rgba(181,122,255,0)", lineWidth:2,
          });
          seriesRef.current = s;
          s.setData(raw.map(k => ({ time: Math.floor(Number(k[0])/1000) as Time, value:+k[4] })));
        }

        buildIndSeries(raw);
        refreshLines();
        refreshUserLines();
      } catch {/* ignore */} finally {
        if (!dead) setLoading(false);
      }
    };
    load();
    return () => { dead = true; };
  }, [pair, tf, ctype, refreshLines, refreshUserLines, clearIndSeries, buildIndSeries, isReplay]);

  // ── Kline WebSocket — keeps OHLC in sync (live only) ──
  useEffect(() => {
    if (isReplay) return;
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${pair.toLowerCase()}@kline_${TF_BINANCE[tf]}`);
    ws.onmessage = (e: MessageEvent) => {
      const { k } = JSON.parse(e.data as string);
      const t = Math.floor(k.t/1000);
      currentKRef.current = { o:+k.o, h:+k.h, l:+k.l, c:+k.c, t };
    };
    return () => { ws.onmessage = null; if (ws.readyState < 2) ws.close(); };
  }, [pair, tf, isReplay]);

  // ── aggTrade WebSocket — tick-by-tick realtime + alert crossing check (live only) ──
  useEffect(() => {
    if (isReplay) return;
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${pair.toLowerCase()}@aggTrade`);
    ws.onmessage = (e: MessageEvent) => {
      if (rafRef.current) return;
      const msg = JSON.parse(e.data as string) as { p: string };
      const price = +msg.p;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (!seriesRef.current) return;
        const ck = currentKRef.current;
        if (!ck) return;
        const time = ck.t as Time;
        if (ctypeRef.current === "candle") {
          (seriesRef.current as ISeriesApi<"Candlestick">).update({
            time, open: ck.o,
            high: Math.max(ck.h, price),
            low:  Math.min(ck.l, price),
            close: price,
          });
          currentKRef.current = { ...ck, h: Math.max(ck.h,price), l: Math.min(ck.l,price), c: price };
        } else {
          (seriesRef.current as ISeriesApi<"Area">).update({ time, value: price });
        }
        // ── Alert crossing detection ──
        const prevP = prevPriceRef.current;
        prevPriceRef.current = price;
        if (prevP > 0) {
          alertsRef.current.forEach(al => {
            if (!al.is_active) return;
            if (alertCooldownRef.current.has(al.id)) return;
            if (!ALERT_CONDS_PRICE.has(al.condition)) return;
            const t = al.target_price;
            let hit = false;
            switch (al.condition) {
              case "price_gt":  hit = prevP <= t && price > t; break;
              case "price_gte": hit = prevP < t  && price >= t; break;
              case "price_lt":  hit = prevP >= t && price < t; break;
              case "price_lte": hit = prevP > t  && price <= t; break;
              case "price_eq":  hit = Math.abs(price-t)/t < 0.001 && Math.abs(prevP-t)/t >= 0.001; break;
            }
            if (hit) {
              onAlertTriggeredRef.current(al, price);
              alertCooldownRef.current.add(al.id);
              setTimeout(() => alertCooldownRef.current.delete(al.id), 60_000);
            }
          });
        }
      });
    };
    return () => {
      ws.onmessage = null;
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (ws.readyState < 2) ws.close();
    };
  }, [pair, isReplay]);

  // ── Clear all user-drawn lines ──
  const clearUserLines = useCallback(() => {
    userLinesRef.current.forEach(l => { try { seriesRef.current?.removePriceLine(l); } catch {/* ignore */} });
    userLinesRef.current = [];
    userPricesRef.current = [];
  }, []);

  const drawTools: { id: DrawMode; icon: React.ReactNode; label: string }[] = [
    { id: "cursor", icon: <MousePointer2 size={14}/>, label: "Курсор" },
    { id: "hline",  icon: <Minus size={14}/>,         label: "Горизонтальна лінія" },
  ];

  return (
    <div className="h-full w-full flex flex-col bg-[#08080A]">
      {/* ── Top bar: TF + chart type + indicators ── */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-white/5 shrink-0 bg-[#050506] overflow-x-auto">
        {/* Primary TF buttons */}
        {TF_PRIMARY.map(t => (
          <button key={t} type="button" onClick={() => setTf(t)}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors shrink-0 ${tf===t?"bg-[#8348C1]/20 text-[#C38BFF]":"text-white/35 hover:text-white"}`}>
            {TF_LABELS[t]}
          </button>
        ))}
        {/* "More" dropdown for secondary TFs */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowTfMore(v => !v)}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-0.5 ${
              TF_SECONDARY.includes(tf as typeof TF_SECONDARY[number])
                ? "bg-[#8348C1]/20 text-[#C38BFF]"
                : "text-white/35 hover:text-white"
            }`}
          >
            {TF_SECONDARY.includes(tf as typeof TF_SECONDARY[number]) ? TF_LABELS[tf] : "Ще"}
            <ChevronDown size={10}/>
          </button>
          {showTfMore && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-[#13131A] border border-white/10 rounded-xl shadow-xl py-1 min-w-[80px]">
              {TF_SECONDARY.map(t => (
                <button key={t} type="button"
                  onClick={() => { setTf(t); setShowTfMore(false); }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold transition-colors ${tf===t?"text-[#C38BFF] bg-[#8348C1]/15":"text-white/50 hover:text-white hover:bg-white/5"}`}>
                  {TF_LABELS[t]}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="w-px h-4 bg-white/10 mx-1 shrink-0"/>
        {/* Indicators */}
        {([
          { key:"vol",   label:"Vol",   color:"text-[#25DE28]" },
          { key:"ema20", label:"EMA20", color:"text-[#F7931A]" },
          { key:"ema50", label:"EMA50", color:"text-[#9945FF]" },
          { key:"ema200",label:"EMA200",color:"text-[#14F195]" },
          { key:"vwap",  label:"VWAP",  color:"text-[#00BFFF]" },
          { key:"bb",    label:"BB",    color:"text-[#93C4FF]" },
        ] as const).map(({ key, label, color }) => (
          <button key={key} type="button"
            onClick={() => setInds(prev => ({ ...prev, [key]: !prev[key] }))}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors shrink-0 ${inds[key]?`bg-white/10 ${color}`:"text-white/25 hover:text-white/60"}`}>
            {label}
          </button>
        ))}
        <div className="ml-auto flex gap-1 items-center shrink-0">
          <div className="w-px h-4 bg-white/10 mx-0.5"/>
          <button type="button" onClick={() => setCtype("candle")}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${ctype==="candle"?"bg-white/10 text-white":"text-white/25 hover:text-white"}`}>
            Свічки
          </button>
          <button type="button" onClick={() => setCtype("area")}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${ctype==="area"?"bg-white/10 text-white":"text-white/25 hover:text-white"}`}>
            Лінія
          </button>
        </div>
      </div>

      {/* ── Chart area with left toolbar ── */}
      <div className="relative flex-1 min-h-0 flex">

        {/* Drawing toolbar (left side) */}
        <div className="flex flex-col items-center gap-1 px-1 pt-2 w-[34px] shrink-0 border-r border-white/5 bg-[#050506]">
          {drawTools.map(tool => (
            <button key={tool.id} type="button"
              title={tool.label}
              onClick={() => setDrawMode(d => d === tool.id ? "cursor" : tool.id)}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${drawMode===tool.id?"bg-[#8348C1]/30 text-[#C38BFF]":"text-white/30 hover:text-white hover:bg-white/5"}`}>
              {tool.icon}
            </button>
          ))}
          {/* Separator */}
          <div className="w-5 h-px bg-white/5 my-0.5"/>
          {/* Clear user lines */}
          <button type="button" title="Очистити лінії"
            onClick={clearUserLines}
            className="w-7 h-7 flex items-center justify-center rounded-md text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 size={12}/>
          </button>
        </div>

        {/* Chart canvas */}
        <div className="relative flex-1 min-w-0">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#08080A]/70">
              <div className="w-6 h-6 border-2 border-[#B57AFF] border-t-transparent rounded-full animate-spin"/>
            </div>
          )}
          <div
            ref={containerRef}
            className="absolute inset-0"
            style={{ cursor: drawMode === "hline" ? "crosshair" : "default" }}
          />
          {/* Drawing mode hint */}
          {drawMode === "hline" && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none bg-[#0B0B12]/90 border border-[#8348C1]/40 rounded-full px-3 py-1 text-[10px] text-[#C38BFF] font-medium">
              Клікніть на графік щоб поставити лінію · Esc — скасувати
            </div>
          )}
          {/* Alert fired — bottom-left overlay */}
          {chartAlertNotif && (
            <ChartAlertBadge key={chartAlertNotif.ts} msg={chartAlertNotif.msg}/>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// POSITION EDIT MODAL
// ─────────────────────────────────────────────
function PosEditModal({ pos, currentPrice, onClose, onSave, onClosePos }: {
  pos: DemoPos|null;
  currentPrice: number;
  onClose: () => void;
  onSave: (posId: string, sl?: number, tp?: number) => void;
  onClosePos: (pos: DemoPos) => void;
}) {
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const prevId = useRef<string|null>(null);

  useEffect(() => {
    if (pos && pos.id !== prevId.current) {
      prevId.current = pos.id;
      setSl(pos.sl && pos.sl > 0 ? pos.sl.toFixed(pos.sl < 1 ? 6 : 2) : "");
      setTp(pos.tp && pos.tp > 0 ? pos.tp.toFixed(pos.tp < 1 ? 6 : 2) : "");
    }
  }, [pos]);

  useEffect(() => {
    if (!pos) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [pos, onClose]);

  if (!pos) return null;

  const isLong = pos.side === "LONG";
  const liveP  = currentPrice || pos.avgPrice;
  const pnl    = (isLong ? liveP - pos.avgPrice : pos.avgPrice - liveP) * pos.qty;
  const roe    = pos.margin > 0 ? (pnl / pos.margin) * 100 : 0;
  const dec    = pos.avgPrice < 1 ? 6 : 2;

  const handleSave = () => {
    const slN = parseFloat(sl.replace(",","."));
    const tpN = parseFloat(tp.replace(",","."));
    onSave(pos.id,
      Number.isFinite(slN) && slN > 0 ? slN : undefined,
      Number.isFinite(tpN) && tpN > 0 ? tpN : undefined,
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[340px] bg-[#0B0B12] border border-white/10 rounded-2xl p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${isLong?"bg-[#25DE28]/20 text-[#25DE28]":"bg-[#F40000]/20 text-[#F40000]"}`}>
              {pos.side}
            </span>
            <span className="text-[13px] font-bold">{pos.sym}/USDT</span>
            <span className="text-[10px] text-white/40">{pos.leverage}x</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X size={15}/></button>
        </div>

        {/* PnL summary */}
        <div className={`rounded-xl px-3 py-2.5 mb-3 border text-center ${pnl>=0?"bg-[#25DE28]/10 border-[#25DE28]/20":"bg-[#F40000]/10 border-[#F40000]/20"}`}>
          <div className={`text-[15px] font-bold ${pnl>=0?"text-[#25DE28]":"text-[#F40000]"}`}>
            {pnl>=0?"+":""}{pnl.toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2})}
            <span className="text-[11px] ml-2 opacity-70">{roe>=0?"+":""}{roe.toFixed(2)}%</span>
          </div>
          <div className="text-[9px] text-white/40 mt-0.5">
            Entry {fUsd(pos.avgPrice)} → Mark {fUsd(liveP)}
            {pos.liqPrice > 0 && <> · Liq <span className="text-amber-400">{fUsd(pos.liqPrice)}</span></>}
          </div>
        </div>

        {/* SL */}
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-white/40">Stop Loss</label>
            {pos.avgPrice > 0 && (
              <div className="flex gap-1">
                {[1,2,3].map(p => (
                  <button key={p} type="button"
                    onClick={() => setSl((isLong ? pos.avgPrice*(1-p/100) : pos.avgPrice*(1+p/100)).toFixed(dec))}
                    className="text-[8px] px-1.5 py-0.5 rounded bg-[#F40000]/10 text-[#F40000]/70 hover:text-[#F40000] transition-colors">
                    -{p}%
                  </button>
                ))}
              </div>
            )}
          </div>
          <input value={sl} onChange={e => setSl(e.target.value)}
            className="w-full bg-[#050506] border border-[#F40000]/20 rounded-xl px-3 py-2 text-[12px] text-white outline-none focus:border-[#F40000]/50 transition-colors"
            placeholder={isLong ? `< ${fUsd(pos.avgPrice)}` : `> ${fUsd(pos.avgPrice)}`}/>
        </div>

        {/* TP */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-white/40">Take Profit</label>
            {pos.avgPrice > 0 && (
              <div className="flex gap-1">
                {[2,3,5].map(p => (
                  <button key={p} type="button"
                    onClick={() => setTp((isLong ? pos.avgPrice*(1+p/100) : pos.avgPrice*(1-p/100)).toFixed(dec))}
                    className="text-[8px] px-1.5 py-0.5 rounded bg-[#25DE28]/10 text-[#25DE28]/70 hover:text-[#25DE28] transition-colors">
                    +{p}%
                  </button>
                ))}
              </div>
            )}
          </div>
          <input value={tp} onChange={e => setTp(e.target.value)}
            className="w-full bg-[#050506] border border-[#25DE28]/20 rounded-xl px-3 py-2 text-[12px] text-white outline-none focus:border-[#25DE28]/50 transition-colors"
            placeholder={isLong ? `> ${fUsd(pos.avgPrice)}` : `< ${fUsd(pos.avgPrice)}`}/>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button type="button" onClick={handleSave}
            className="flex-1 py-2 rounded-xl bg-[#8348C1]/20 text-[#C38BFF] text-[12px] font-semibold hover:bg-[#8348C1]/30 transition-colors">
            Зберегти SL / TP
          </button>
          <button type="button" onClick={() => { onClosePos(pos); onClose(); }}
            className="flex-1 py-2 rounded-xl bg-[#F40000]/10 text-[#F40000] text-[12px] font-semibold hover:bg-[#F40000]/20 transition-colors">
            Закрити позицію
          </button>
        </div>
        <button type="button" onClick={onClose}
          className="w-full mt-2 py-1 text-[10px] text-white/25 hover:text-white/50 transition-colors">
          Скасувати (Esc)
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TOAST NOTIFICATIONS
// ─────────────────────────────────────────────
type ToastItem = { id: string; msg: string };
function ToastNotifications({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed top-[54px] right-3 z-[100] flex flex-col gap-1.5 pointer-events-none max-w-[280px]">
      {items.map(t => (
        <div key={t.id} className="pointer-events-auto flex items-start gap-2 rounded-xl border border-[#8348C1]/40 bg-[#0B0B12]/95 px-3 py-2 shadow-2xl backdrop-blur-sm">
          <Bell size={12} className="text-[#C38BFF] shrink-0 mt-0.5"/>
          <div className="flex-1 min-w-0 text-[10px] text-white/80 leading-relaxed">{t.msg}</div>
          <button className="text-white/30 hover:text-white shrink-0 transition-colors" onClick={() => onDismiss(t.id)}>
            <X size={11}/>
          </button>
        </div>
      ))}
    </div>
  );
}


// ─────────────────────────────────────────────
// SESSION SUMMARY MODAL
// ─────────────────────────────────────────────
async function fetchGroqReview(prompt: string): Promise<string> {
  const key = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
  if (!key) return "Ключ AI не знайдено.";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 400,
    }),
  });
  if (!res.ok) return "Не вдалося отримати AI-відповідь.";
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content?.trim() ?? "Порожня відповідь.";
}

function SessionSummaryModal({ demo, snapshot, planKey, onContinue, onNewSession, onClose }: {
  demo: DemoAcc;
  snapshot: DemoAcc;
  planKey: string;
  onContinue: () => void;
  onNewSession: () => void;
  onClose: () => void;
}) {
  const snapshotIds = useMemo(() => new Set(snapshot.trades.map(t=>t.id)), [snapshot]);
  const sessionTrades = demo.trades.filter(t => !snapshotIds.has(t.id) && t.action === "CLOSE");
  const wins   = sessionTrades.filter(t => t.pnl > 0);
  const losses = sessionTrades.filter(t => t.pnl < 0);
  const totalPnl = sessionTrades.reduce((s,t) => s+t.pnl, 0);
  const winRate  = sessionTrades.length ? (wins.length/sessionTrades.length*100) : 0;
  const bestTrade  = sessionTrades.reduce<DemoTrade|null>((b,t) => !b||t.pnl>b.pnl?t:b, null);
  const worstTrade = sessionTrades.reduce<DemoTrade|null>((w,t) => !w||t.pnl<w.pnl?t:w, null);
  const sessionPnlVsStart = demo.cash - snapshot.cash;
  const isPro = planKey === "pro" || planKey === "business";

  const [aiReview, setAiReview] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!isPro || sessionTrades.length === 0) return;
    setAiLoading(true);
    const avgPnl = (totalPnl / sessionTrades.length).toFixed(2);
    const best = bestTrade ? `+$${bestTrade.pnl.toFixed(2)} (${bestTrade.sym})` : "—";
    const worst = worstTrade ? `$${worstTrade.pnl.toFixed(2)} (${worstTrade.sym})` : "—";
    const prompt = `Ти — Pulse-AI, крипто-наставник і ментор трейдера. Проаналізуй результати торгової сесії учня та дай чесний, корисний розбір українською мовою.

Дані сесії:
- Кількість угод: ${sessionTrades.length}
- Win Rate: ${winRate.toFixed(1)}%
- Прибуткових: ${wins.length}, Збиткових: ${losses.length}
- Загальний PnL: ${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}
- Середній PnL/угоду: $${avgPnl}
- Краща угода: ${best}
- Найгірша угода: ${worst}

Напиши структурований розбір у 3 частинах (без заголовків, суцільним текстом):
1. Коротка оцінка сесії (1-2 речення)
2. Що зроблено добре або що пішло не так — конкретно, по цифрах
3. Одна практична порада на наступну сесію

Стиль: як досвідчений трейдер говорить з учнем — чесно, по справі, без води. До 120 слів.`;

    fetchGroqReview(prompt)
      .then(text => setAiReview(text))
      .catch(() => setAiReview("Не вдалося завантажити AI-розбір."))
      .finally(() => setAiLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const h = (e:KeyboardEvent) => { if(e.key==="Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[520px] max-h-[90vh] overflow-y-auto bg-[#0B0B12] border border-[#8348C1]/30 rounded-2xl shadow-2xl p-6" onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2C1969] to-[#8348C1] flex items-center justify-center">
              <Trophy size={16} className="text-white"/>
            </div>
            <div>
              <h2 className="text-[15px] font-bold">Підсумок сесії</h2>
              <p className="text-[10px] text-white/40">Replay Practice Mode</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X size={15}/></button>
        </div>

        {/* PnL Banner */}
        <div className={`rounded-xl px-4 py-3 mb-4 border text-center ${totalPnl>=0?"bg-[#25DE28]/10 border-[#25DE28]/25":"bg-[#F40000]/10 border-[#F40000]/25"}`}>
          <div className={`text-[22px] font-bold ${totalPnl>=0?"text-[#25DE28]":"text-[#F40000]"}`}>
            {totalPnl>=0?"+":""}{fUsd(totalPnl)}
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">
            Загальний PnL за сесію · Зміна балансу: {sessionPnlVsStart>=0?"+":""}{fUsd(sessionPnlVsStart)}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label:"Угод", value: sessionTrades.length.toString() },
            { label:"Win Rate", value: sessionTrades.length ? `${winRate.toFixed(0)}%` : "—", color: winRate>=50?"text-[#25DE28]":"text-[#F40000]" },
            { label:"Прибуткових", value: wins.length.toString(), color:"text-[#25DE28]" },
            { label:"Збиткових",   value: losses.length.toString(), color:"text-[#F40000]" },
            { label:"Краща угода", value: bestTrade ? (bestTrade.pnl>=0?"+":"")+fUsd(bestTrade.pnl) : "—", color:"text-[#25DE28]" },
            { label:"Гірша угода", value: worstTrade ? (worstTrade.pnl>=0?"+":"")+fUsd(worstTrade.pnl) : "—", color:"text-[#F40000]" },
          ].map(({label,value,color}) => (
            <div key={label} className="rounded-xl bg-[#050506] border border-white/5 p-2.5 text-center">
              <div className="text-[9px] text-white/35 font-semibold uppercase tracking-wider mb-1">{label}</div>
              <div className={`text-[14px] font-bold ${color??""}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Win rate bar */}
        {sessionTrades.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-[9px] text-white/40 mb-1">
              <span>Win {wins.length}</span><span>Loss {losses.length}</span>
            </div>
            <div className="h-2 rounded-full bg-[#F40000]/20 overflow-hidden">
              <div className="h-full bg-[#25DE28] rounded-full transition-all" style={{width:`${clamp(winRate,0,100)}%`}}/>
            </div>
          </div>
        )}

        {/* PulseAI Review */}
        <div className="rounded-xl bg-gradient-to-br from-[#2C1969]/30 to-[#0B0B12] border border-[#8348C1]/30 p-3 mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Bot size={11} className="text-[#C38BFF]"/>
            <span className="text-[9px] font-bold text-[#C38BFF] uppercase tracking-wider">PulseAI Review</span>
          </div>

          {!isPro ? (
            /* FREE PLAN — upsell */
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="text-[11px] text-white/50 text-center leading-relaxed">
                🔒 Персональний AI-розбір твоєї сесії доступний лише на плані <span className="text-[#C38BFF] font-semibold">Pro</span> та вище.
              </div>
              <div className="text-[10px] text-white/30 text-center">
                Отримай детальний аналіз угод, помилок і порад від AI-наставника.
              </div>
            </div>
          ) : sessionTrades.length === 0 ? (
            <p className="text-[11px] text-white/70 leading-relaxed">
              Ти не відкрив жодної угоди під час цієї сесії. Спробуй знайти точку входу та потренуватись в наступний раз!
            </p>
          ) : aiLoading ? (
            <div className="flex items-center gap-2 py-1">
              <div className="w-3 h-3 rounded-full border-2 border-[#C38BFF] border-t-transparent animate-spin"/>
              <span className="text-[11px] text-white/40 italic">Pulse-AI аналізує сесію...</span>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-white/80 leading-relaxed">{aiReview}</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-[9px] text-white/40">
                <div>📊 Avg PnL/угода: <span className={totalPnl>=0?"text-[#25DE28]":"text-[#F40000]"}>{(totalPnl/(sessionTrades.length||1)).toFixed(2)}$</span></div>
                <div>🎯 Точність: <span className="text-white">{winRate.toFixed(0)}%</span></div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={onContinue}
            className="py-2 rounded-xl bg-[#8348C1]/15 text-[#C38BFF] text-[11px] font-semibold hover:bg-[#8348C1]/25 transition-colors border border-[#8348C1]/20">
            Продовжити
          </button>
          <button type="button" onClick={onNewSession}
            className="py-2 rounded-xl bg-[#25DE28]/15 text-[#25DE28] text-[11px] font-semibold hover:bg-[#25DE28]/25 transition-colors border border-[#25DE28]/20">
            Нова сесія
          </button>
          <button type="button" onClick={onClose}
            className="py-2 rounded-xl bg-white/5 text-white/40 text-[11px] font-semibold hover:bg-white/10 transition-colors">
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function TradingPage() {
  const navigate = useNavigate();
  const {symbol} = useParams<{symbol:string}>();
  const {account} = useAccount();
  const routeSym = (symbol??DEFAULT_SYMBOL).toUpperCase();

  // Practice mode
  const [mode, setMode]             = useState<PracticeMode>("live");
  const [replayTf, setReplayTf]     = useState<ChartTf>("1h");
  const [replayStartDate, setReplayStartDate] = useState<string>(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().split("T")[0];
  });
  const [replayEndDate, setReplayEndDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [replayCandles, setReplayCandles]     = useState<Candle[]>([]);
  const [replayIndex, setReplayIndex]         = useState(0);
  const [replayPlaying, setReplayPlaying]     = useState(false);
  const [replaySpeed, setReplaySpeed]         = useState<1|2|5|10>(1);
  const [replayLoading, setReplayLoading]     = useState(false);
  const [showSummary, setShowSummary]         = useState(false);
  const [replaySnapshot, setReplaySnapshot]   = useState<DemoAcc|null>(null);
  const prevReplayPriceRef = useRef(0);

  // Layout
  const [panelOpen, setPanelOpen]   = useState(true);
  const [bottomOpen, setBottomOpen] = useState(false);
  const [rightTab, setRightTab]     = useState<"Trade"|"Data"|"Alerts">("Trade");
  const [botTab, setBotTab]         = useState<BottomTab>("Positions");

  // Coin selector
  const [coinOpen, setCoinOpen]     = useState(false);
  const [coinQ, setCoinQ]           = useState("");
  const coinRef = useRef<HTMLDivElement>(null);

  // Data
  const [markets, setMarkets]       = useState<Asset[]>(FALLBACK.filter(a=>!STABLE.has(a.sym)));
  const [ticker, setTicker]         = useState<BinTk|null>(null);
  const [candles, setCandles]       = useState<Candle[]>([]);
  const [ob, setOb]                 = useState<{bids:OBRow[];asks:OBRow[]}>({bids:[],asks:[]});
  const [loading, setLoading]       = useState(true);
  const [dataErr, setDataErr]       = useState("");

  // Trade form
  const [side, setSide]             = useState<"LONG"|"SHORT">("LONG");
  const [otype, setOtype]           = useState<"Market"|"Limit">("Market");
  const [leverage, setLeverage]     = useState<LeverageVal>(1);
  const [notional, setNotional]     = useState("1000");
  const [limitPx, setLimitPx]       = useState("");
  const [sl, setSl]                 = useState("");
  const [tp, setTp]                 = useState("");
  const [tradeErr, setTradeErr]     = useState("");

  // Demo account — Supabase (залогінений) або localStorage (гість)
  const userId  = account?.userId ?? null;
  const demoKey = `${DEMO_KEY_PREFIX}:${userId??"guest"}`;
  const [demo, setDemo]         = useState<DemoAcc>(()=>loadAcc(demoKey));
  const [dbReady, setDbReady]   = useState(!userId); // true = дані вже завантажені
  const [noAccount, setNoAccount] = useState(false); // true = перший візит, немає demo_accounts
  const [upgradeModal, setUpgradeModal] = useState<{ title: string; description: string } | null>(null);

  // ── Replay account: completely separate from Live Demo ──
  // Ephemeral (never persisted), always reset to makeAcc() at session start.
  // Positions/orders/history in replay NEVER bleed into the live account.
  const [replayDemo, setReplayDemo] = useState<DemoAcc>(makeAcc);

  // Живі ціни для позицій інших символів (не поточний asset)
  const [livePrices, setLivePrices] = useState<Record<string,number>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const autoPredictionTimer = useRef<ReturnType<typeof setInterval>|null>(null);
  const lastPredictionRequest = useRef<Record<string, number>>({});
  const latestPairRef = useRef("");

  // ── Computed ──
  const asset = useMemo(()=>{
    const f=markets.find(m=>m.sym===routeSym);
    if(f)return f;
    return {...FALLBACK[0],id:routeSym.toLowerCase(),sym:routeSym,name:routeSym,img:`https://cryptologos.cc/logos/${routeSym.toLowerCase()}-${routeSym.toLowerCase()}-logo.png`};
  },[markets,routeSym]);

  const pair    = getPair(asset.sym);
  const isTickerForPair = ticker?.symbol === pair;
  const price   = +(isTickerForPair ? ticker?.lastPrice : asset.price??0);
  const pct24h  = +(ticker?.priceChangePercent??asset.pct24h??0);
  const h24     = +(ticker?.highPrice??0);
  const l24     = +(ticker?.lowPrice??0);
  const v24     = +(ticker?.quoteVolume??asset.vol24h??0);
  const isGreen = pct24h>=0;

  // ── Active account router ──
  // All trading UI reads from activeDemo; mutations go through setActiveDemo.
  const activeDemo = mode === "live" ? demo : replayDemo;
  // modeRef lets stable callbacks (useCallback with []) know the current mode
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  const setActiveDemo = useCallback((fn: (prev: DemoAcc) => DemoAcc) => {
    if (modeRef.current === "live") setDemo(fn);
    else setReplayDemo(fn);
  }, []); // stable — uses ref internally

  // Effective price: live or replay
  const replayPrice = (mode === "replay" && replayCandles.length > 0 && replayIndex < replayCandles.length)
    ? replayCandles[replayIndex].close
    : 0;
  const effectivePrice = mode === "live" ? price : replayPrice;

  const ind = useMemo(()=>calcInd(candles.length?candles:[{time:0,open:effectivePrice,high:effectivePrice,low:effectivePrice,close:effectivePrice,volume:1}]),[candles,effectivePrice]);

  const filtCoins = useMemo(()=>{
    const q=coinQ.trim().toLowerCase();
    return q ? markets.filter(a=>`${a.sym} ${a.name}`.toLowerCase().includes(q)).slice(0,50) : markets.slice(0,80);
  },[coinQ,markets]);

  // Актуальна ціна для будь-якої позиції: поточний asset → effectivePrice, решта → livePrices
  const posPrice  = useCallback((sym:string)=> sym===asset.sym ? effectivePrice : (livePrices[sym] || 0), [asset.sym, effectivePrice, livePrices]);
  const totalPnl  = activeDemo.positions.reduce((s,p)=>s+getPnl(p,posPrice(p.sym)||p.avgPrice),0);
  const equity    = activeDemo.cash+activeDemo.positions.reduce((s,p)=>s+p.margin+getPnl(p,posPrice(p.sym)||p.avgPrice),0);
  const notN      = +notional;
  const posSize   = effectivePrice>0&&notN>0 ? (notN*leverage)/effectivePrice : 0;
  const posVal    = posSize*effectivePrice;

  // SL/TP suggestion based on ATR
  const sugSl = side==="LONG" ? effectivePrice-ind.atr*1.5 : effectivePrice+ind.atr*1.5;
  const sugTp = side==="LONG" ? effectivePrice+ind.atr*2.5 : effectivePrice-ind.atr*2.5;

  // Risk / Reward
  const slN=+sl, tpN=+tp;
  const riskPts   = sl&&slN>0 ? Math.abs(effectivePrice-slN) : 0;
  const rewardPts = tp&&tpN>0 ? Math.abs(tpN-effectivePrice) : 0;
  const rrRatio   = riskPts>0&&rewardPts>0 ? (rewardPts/riskPts) : 0;

  // Liq price preview
  const liqPreview = leverage>1 ? getLiqPrice(side,effectivePrice,leverage) : 0;

  // allAlerts = every user alert (all symbols); assetAlerts = derived subset for chart
  // Declared early so the replay effect below can reference them without a forward-reference issue
  const [allAlerts, setAllAlerts]     = useState<PriceAlertRecord[]>([]);
  const assetAlerts = useMemo(
    () => allAlerts.filter(r => r.symbol.toUpperCase() === asset.sym),
    [allAlerts, asset.sym],
  );

  // ── Effects ──

  // Завантаження demo-акаунту: Supabase якщо залогінений, localStorage якщо гість
  useEffect(()=>{
    // Гість: useState вже ініціалізував з localStorage — нічого не робимо
    if(!userId) return;
    // Залогінений: завантажуємо з Supabase (async — setState в callback, не синхронно)
    let active=true;
    dbLoad(userId).then(remote=>{
      if(!active) return;
      if(remote === null) setNoAccount(true);
      setDemo(remote ?? loadAcc(demoKey));
      setDbReady(true);
    });
    return()=>{ active=false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[userId]);

  // Збереження: завжди у localStorage + дебаунс до Supabase
  useEffect(()=>{
    if(!dbReady) return;
    saveAcc(demoKey, demo);
    if(userId){
      if(saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(()=>{ void dbSave(userId, demo); }, 1500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[demo]);

  useEffect(()=>{ let a=true; fetchMarkets().then(m=>{if(a)setMarkets(m)}); return()=>{a=false}; },[]);

  useEffect(()=>{
    latestPairRef.current = pair;
  },[pair]);

  useEffect(()=>{
    if(!coinOpen)return;
    const h=(e:MouseEvent)=>{ if(coinRef.current&&!coinRef.current.contains(e.target as Node))setCoinOpen(false); };
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[coinOpen]);

  const loadData = useCallback(async()=>{
    setLoading(true); setDataErr("");
    try {
      const [tkR,klR,dpR]=await Promise.all([
        fetch(`/api/binance/ticker/24hr?symbol=${pair}`),
        fetch(`/api/binance/klines?symbol=${pair}&interval=${IND_TF.binance}&limit=${IND_TF.lim}`),
        fetch(`/api/binance/depth?symbol=${pair}&limit=20`),
      ]);
      if(latestPairRef.current !== pair) return;
      if(tkR.ok)setTicker(await tkR.json()); else setTicker(null);
      if(klR.ok)setCandles(((await klR.json()) as BinKline[]).map(mapK)); else setCandles([]);
      if(dpR.ok){
        const d=await dpR.json() as {bids?:[string,string][];asks?:[string,string][]};
        if(latestPairRef.current !== pair) return;
        const mp=(rows?:[string,string][])=>(rows??[]).slice(0,12).map(r=>({price:+r[0],qty:+r[1],total:+r[0]*+r[1]}));
        setOb({bids:mp(d.bids),asks:mp(d.asks)});
      }
    } catch{ setDataErr("Помилка завантаження."); }
    finally{ setLoading(false); }
  },[pair]);

  useEffect(()=>{
    const t=setTimeout(()=>void loadData(),0);
    const id=setInterval(()=>void loadData(),20_000);
    return()=>{clearTimeout(t);clearInterval(id);};
  },[loadData]);

  // Окремий тікер для позицій інших символів (щоб Поточна ціна не була "---")
  const otherPosSig = useMemo(()=>{
    const syms=[...new Set(activeDemo.positions.map(p=>p.sym).filter(s=>s!==asset.sym))].sort();
    return syms.join(",");
  },[activeDemo.positions, asset.sym]);

  useEffect(()=>{
    const syms = otherPosSig ? otherPosSig.split(",") : [];
    if(!syms.length){ setLivePrices({}); return; } // eslint-disable-line react-hooks/set-state-in-effect
    const fetchAll = async()=>{
      const res: Record<string,number> = {};
      await Promise.all(syms.map(async sym=>{
        try{
          const r=await fetch(`/api/binance/ticker/24hr?symbol=${getPair(sym)}`);
          if(r.ok){ const d=await r.json() as {lastPrice?:string}; const p=+(d.lastPrice??0); if(p>0)res[sym]=p; }
        }catch{/* ignore */}
      }));
      setLivePrices(res);
    };
    void fetchAll();
    const id=setInterval(()=>void fetchAll(),20_000);
    return()=>clearInterval(id);
  },[otherPosSig]);

  useEffect(()=>{
    const t=setTimeout(()=>{setLimitPx("");setSl("");setTp("");setTradeErr("");},0);
    return()=>clearTimeout(t);
  },[asset.sym]);

  // ── Replay: alert check + auto-close per candle tick ──
  useEffect(()=>{
    if(mode !== "replay" || !replayCandles.length || replayIndex === undefined) return;
    const rPrice = replayCandles[replayIndex]?.close ?? 0;
    if(!rPrice) return;
    const prevP = prevReplayPriceRef.current;
    prevReplayPriceRef.current = rPrice;
    // Alert crossing in replay
    if(prevP > 0) {
      assetAlerts.forEach(al => {
        if(!al.is_active || !ALERT_CONDS_PRICE.has(al.condition)) return;
        const t = al.target_price; let hit = false;
        switch(al.condition){
          case "price_gt":  hit = prevP<=t && rPrice>t; break;
          case "price_gte": hit = prevP<t  && rPrice>=t; break;
          case "price_lt":  hit = prevP>=t && rPrice<t; break;
          case "price_lte": hit = prevP>t  && rPrice<=t; break;
          case "price_eq":  hit = Math.abs(rPrice-t)/t<0.001 && Math.abs(prevP-t)/t>=0.001; break;
        }
        if(hit) void handleAlertTriggered(al, rPrice); // eslint-disable-line react-hooks/immutability
      });
    }
    // Auto-close SL/TP/Liq in replay (uses replayDemo — NOT live demo)
    const toastMsgs: string[] = [];
    setReplayDemo(cur=>{
      let next=cur, changed=false;
      cur.positions.forEach(pos=>{
        if(pos.sym !== asset.sym) return;
        const hitSl  = pos.sl   ? (pos.side==="LONG"?rPrice<=pos.sl  :rPrice>=pos.sl)   : false;
        const hitTp  = pos.tp   ? (pos.side==="LONG"?rPrice>=pos.tp  :rPrice<=pos.tp)   : false;
        const hitLiq = pos.liqPrice>0 ? (pos.side==="LONG"?rPrice<=pos.liqPrice:rPrice>=pos.liqPrice) : false;
        if(hitSl||hitTp||hitLiq){
          const fillP = hitLiq?pos.liqPrice:rPrice;
          const pnl = getPnl(pos,fillP);
          const reason = hitLiq?"⚠️ Ліквідація":hitSl?"🔴 Stop Loss":"🟢 Take Profit";
          toastMsgs.push(`${reason} ${pos.sym} ${pos.side} — ${pnl>=0?"+":""}${fUsd(pnl)}`);
          next=execClose(next,pos,fillP); changed=true;
        }
      });
      return changed?next:cur;
    });
    toastMsgs.forEach(m=>pushToastRef.current(m));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[replayIndex, mode]);

  // Авто-закриття позицій (SL / TP / Liquidation) — Live mode only
  // ВАЖЛИВО: перевіряємо ТІЛЬКИ позиції/ордери поточного активу,
  // щоб ціна ETH не закривала позиції BTC при переключенні активу
  useEffect(()=>{
    if(mode !== "live") return; // handled by replay effect above
    if(!price || !isTickerForPair)return;
    const t=setTimeout(()=>{
      const toastMsgs: string[] = [];
      setDemo(cur=>{
        let next=cur,changed=false;
        // Limit fills — тільки для поточного символу
        cur.orders.forEach(o=>{
          if(o.sym !== asset.sym) return; // ← критичний фікс
          if(o.type!=="Limit"||!o.limitPrice)return;
          const fill=o.side==="LONG"?price<=o.limitPrice:price>=o.limitPrice;
          if(!fill)return;
          const r=execOpen({...next,orders:next.orders.filter(x=>x.id!==o.id)},o,o.limitPrice);
          next=r.next; changed=true;
          toastMsgs.push(`✅ Ліміт виконано: ${o.sym} ${o.side} @ ${fUsd(o.limitPrice)}`);
        });
        // SL / TP / Liq — тільки для поточного символу
        next.positions.forEach(pos=>{
          if(pos.sym !== asset.sym) return; // ← критичний фікс
          const hitSl  = pos.sl   ? (pos.side==="LONG"?price<=pos.sl  :price>=pos.sl)   : false;
          const hitTp  = pos.tp   ? (pos.side==="LONG"?price>=pos.tp  :price<=pos.tp)   : false;
          const hitLiq = pos.liqPrice>0 ? (pos.side==="LONG"?price<=pos.liqPrice:price>=pos.liqPrice) : false;
          if(hitSl||hitTp||hitLiq){
            const fillP = hitLiq ? pos.liqPrice : price;
            const pnl = getPnl(pos, fillP);
            const reason = hitLiq?"⚠️ Ліквідація":hitSl?"🔴 Stop Loss":"🟢 Take Profit";
            toastMsgs.push(`${reason} ${pos.sym} ${pos.side} — ${pnl>=0?"+":""}${fUsd(pnl)}`);
            next=execClose(next,pos,fillP); changed=true;
          }
        });
        return changed?next:cur;
      });
      toastMsgs.forEach(m => pushToastRef.current(m));
    },0);
    return()=>clearTimeout(t);
  },[price, asset.sym, isTickerForPair, mode]);

  // ── Actions ──
  const goAsset = (a:Asset)=>{ setCoinOpen(false);setCoinQ(""); navigate(`/trading/${a.sym}`); };

  const submitOrder = ()=>{
    setTradeErr("");
    const amt=+notional, lp=+limitPx, slN2=+sl, tpN2=+tp;
    if(!Number.isFinite(amt)||amt<=0) return setTradeErr("Вкажіть суму угоди в USDT.");
    const entryP = otype==="Limit"&&lp>0 ? lp : effectivePrice;
    if(slN2>0 && entryP>0) {
      if(side==="LONG"  && slN2>=entryP) return setTradeErr("Stop Loss для LONG повинен бути нижче ціни входу.");
      if(side==="SHORT" && slN2<=entryP) return setTradeErr("Stop Loss для SHORT повинен бути вище ціни входу.");
    }
    if(tpN2>0 && entryP>0) {
      if(side==="LONG"  && tpN2<=entryP) return setTradeErr("Take Profit для LONG повинен бути вище ціни входу.");
      if(side==="SHORT" && tpN2>=entryP) return setTradeErr("Take Profit для SHORT повинен бути нижче ціни входу.");
    }
    const order:DemoOrder = {
      id:crypto.randomUUID(), sym:asset.sym, name:asset.name, img:asset.img,
      side, type:otype, notional:amt, leverage,
      sl:slN2>0?slN2:undefined, tp:tpN2>0?tpN2:undefined, createdAt:now(),
    };
    if(otype==="Limit"){
      if(!Number.isFinite(lp)||lp<=0) return setTradeErr("Вкажіть ліміт ціну.");
      setActiveDemo(cur=>({...cur,orders:[{...order,limitPrice:lp},...cur.orders].slice(0,20)}));
      setBotTab("Orders"); if(!bottomOpen)setBottomOpen(true); return;
    }
    const r=execOpen(activeDemo,order,effectivePrice);
    if(r.error)return setTradeErr(r.error);
    setActiveDemo(()=>r.next);
    if(mode === "live" && userId) void dbSave(userId, r.next);
    setBotTab("Positions"); if(!bottomOpen)setBottomOpen(true);
  };

  const cancelOrder   = (id:string)     => setActiveDemo(cur=>({...cur,orders:cur.orders.filter(o=>o.id!==id)}));
  const closePosition = (pos:DemoPos, fill = effectivePrice) => setActiveDemo(cur=>{
    const next = execClose(cur,pos,fill);
    if(mode === "live" && userId) void dbSave(userId, next);
    return next;
  });
  const addBalance    = (amt:number)    => setActiveDemo(cur=>({...cur,cash:cur.cash+amt}));
  const resetDemo     = ()=>{
    if(!window.confirm("Скинути демо рахунок? Усі позиції та історія будуть видалені."))return;
    if(mode === "live"){
      setDemo(makeAcc());
      if(userId) void dbReset(userId);
    } else {
      setReplayDemo(makeAcc());
    }
    setTradeErr("");
  };

  // ── ATR Quick SL presets ──
  const applyAtrSl = (mult:number)=>setSl((side==="LONG"?effectivePrice-ind.atr*mult:effectivePrice+ind.atr*mult).toFixed(effectivePrice<1?6:2));
  const applyAtrTp = (mult:number)=>setTp((side==="LONG"?effectivePrice+ind.atr*mult:effectivePrice-ind.atr*mult).toFixed(effectivePrice<1?6:2));

  // ── Replay actions ──
  const REPLAY_CONTEXT = 60; // context candles shown before the selected start date

  const loadReplayCandles = useCallback(async () => {
    if(!replayStartDate) return;
    setReplayLoading(true); setReplayPlaying(false);
    try {
      const startMs = new Date(replayStartDate).getTime();
      const endMs   = replayEndDate
        ? new Date(replayEndDate).getTime() + 86_400_000 - 1  // inclusive end-of-day
        : Date.now();

      // Calculate candle duration for this timeframe
      const tfMinutes: Record<ChartTf, number> = {
        "1m":1, "3m":3, "5m":5, "15m":15, "30m":30,
        "1h":60, "2h":120, "4h":240, "6h":360, "8h":480, "12h":720,
        "1d":1440, "3d":4320, "1w":10080, "1M":43200,
      };
      const candleMs = (tfMinutes[replayTf] ?? 60) * 60_000;

      // Load context candles before the start date so the chart isn't empty
      const contextStartMs = startMs - REPLAY_CONTEXT * candleMs;

      // How many candles fit from contextStart to endMs (cap at 1000)
      const calcLimit = Math.min(Math.ceil((endMs - contextStartMs) / candleMs), 1000);
      const limit     = Math.max(calcLimit, REPLAY_CONTEXT + 10);

      const res = await fetch(
        `/api/binance/klines?symbol=${pair}&interval=${TF_BINANCE[replayTf]}&startTime=${contextStartMs}&endTime=${endMs}&limit=${limit}`
      );
      if(!res.ok) return;
      const raw = await res.json() as BinKline[];
      const candles2 = raw.map(mapK);

      // Find the index of the first candle at or after the user's selected start date
      const startIdx = candles2.findIndex(c => c.time * 1000 >= startMs);
      const contextIdx = startIdx > 0 ? startIdx : Math.min(REPLAY_CONTEXT, candles2.length - 1);

      setReplayCandles(candles2);
      setReplayIndex(contextIdx); // context visible, replay cursor at selected start date
      // Reset replay account to $25k fresh — completely isolated from live demo
      const freshAcc = makeAcc();
      setReplayDemo(freshAcc);
      setReplaySnapshot(freshAcc);
      prevReplayPriceRef.current = 0;
    } catch {/* ignore */}
    finally { setReplayLoading(false); }
  }, [replayStartDate, replayEndDate, pair, replayTf]); // no `demo` dep — replay is independent

  const handleReplayRestart = useCallback(() => {
    setReplayIndex(Math.min(INITIAL_VISIBLE - 1, replayCandles.length - 1));
    setReplayPlaying(false);
    prevReplayPriceRef.current = 0;
  }, [replayCandles.length]);

  const handleEndSession = useCallback(() => {
    setReplayPlaying(false);
    setShowSummary(true);
  }, []);

  // Replay timer: advance one candle at a time
  useEffect(()=>{
    if(mode !== "replay" || !replayPlaying || !replayCandles.length) return;
    const delay = Math.max(50, 1000 / replaySpeed);
    const id = setInterval(()=>{
      setReplayIndex(i=>{
        if(i >= replayCandles.length - 1){
          setReplayPlaying(false);
          setShowSummary(true);
          return i;
        }
        return i + 1;
      });
    }, delay);
    return ()=>clearInterval(id);
  },[mode, replayPlaying, replaySpeed, replayCandles.length]);

  // When switching mode, clean up replay state
  useEffect(()=>{
    if(mode === "live"){
      setReplayCandles([]); setReplayIndex(0); setReplayPlaying(false); prevReplayPriceRef.current = 0; // eslint-disable-line react-hooks/set-state-in-effect
    }
  },[mode]);

  // ── Алерти ──
  const [alertCond, setAlertCond]         = useState<PriceAlertCondition>("price_gt");
  const [alertVal, setAlertVal]           = useState("");
  const [alertMsg, setAlertMsg]           = useState("");
  const [alertErr, setAlertErr]           = useState("");
  const [alertLoading, setAlertLoading]   = useState(false);
  const [alertMaxTriggers, setAlertMaxTriggers] = useState<number | null>(null); // null = unlimited
  // Inline edit state for existing alerts
  const [editingAlertId, setEditingAlertId]       = useState<string | null>(null);
  const [editAlertCond, setEditAlertCond]         = useState<PriceAlertCondition>("price_gt");
  const [editAlertVal, setEditAlertVal]           = useState("");
  const [editAlertMaxTriggers, setEditAlertMaxTriggers] = useState<number | null>(null);
  const [editAlertLoading, setEditAlertLoading]   = useState(false);
  // Chart overlay notification when alert fires
  const [chartAlertNotif, setChartAlertNotif]     = useState<{msg: string; ts: number} | null>(null);
  // Telegram connection status
  const [tgConnected, setTgConnected]             = useState<boolean | null>(null);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [deletingId, setDeletingId]       = useState<string|null>(null);
  const [togglingId, setTogglingId]       = useState<string|null>(null);

  // Watchlist (user_favorites)
  const [watchlist, setWatchlist]         = useState<FavoriteAssetRecord[]>([]);
  const [watchlistPrices, setWatchlistPrices] = useState<Record<string, number>>({});
  const [watchlistOpen, setWatchlistOpen] = useState(true);

  const isFavorite = useMemo(() => watchlist.some(w => w.symbol === asset.sym), [watchlist, asset.sym]);

  // Position edit modal + toasts
  const [editingPos, setEditingPos]       = useState<DemoPos|null>(null);
  const [toasts, setToasts]               = useState<ToastItem[]>([]);

  const pushToast = useCallback((msg: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev.slice(-4), { id, msg }]); // max 5 toasts
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 8_000);
  }, []);
  const pushToastRef = useRef(pushToast);
  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => { pushToastRef.current = pushToast; }, [pushToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Alert helpers ──
  const getAlertDefault = useCallback((cond: PriceAlertCondition): string => {
    if (NO_VALUE_CONDITIONS.has(cond)) return "";
    const p = effectivePrice > 0 ? effectivePrice : 0;
    const dec = p < 1 ? 6 : 2;
    switch (cond) {
      case "price_gt":         return (p * 1.02).toFixed(dec);
      case "price_lt":         return (p * 0.98).toFixed(dec);
      case "price_gte":        return p.toFixed(dec);
      case "price_lte":        return p.toFixed(dec);
      case "price_eq":         return p.toFixed(dec);
      case "pct_change_24h_gt":return "5";
      case "pct_change_24h_lt":return "5";
      case "rsi_gt":           return "70";
      case "rsi_lt":           return "30";
      case "volume_spike_gt":  return "2";
      case "trailing_stop_pct":return "5";
      case "vol_24h_gt":       return "1000000000";
      default:                 return "";
    }
  }, [effectivePrice]);

  const getAlertCondContext = (cond: PriceAlertCondition): string => {
    switch (cond) {
      case "price_gt": case "price_lt": case "price_gte": case "price_lte": case "price_eq":
        return `Ціна зараз: ${fUsd(effectivePrice)}`;
      case "pct_change_24h_gt": case "pct_change_24h_lt":
        return `24h зараз: ${fPct(pct24h)}`;
      case "rsi_gt": case "rsi_lt":
        return `RSI(14) зараз: ${ind.rsi.toFixed(1)}`;
      case "ema20_cross_up": case "ema20_cross_down":
        return `EMA20 зараз: ${fUsd(ind.ema20)}`;
      case "ema50_cross_up": case "ema50_cross_down":
        return `EMA50 зараз: ${fUsd(ind.ema50)}`;
      case "volume_spike_gt":
        return `Vol spike зараз: ${ind.volSpike.toFixed(2)}×`;
      case "trailing_stop_pct":
        return "Відкат від локального максимуму";
      case "golden_cross": case "death_cross":
        return `EMA200 зараз: ${fUsd(ind.ema200)}`;
      case "bb_upper_break": case "bb_lower_break":
        return `BB%: ${(ind.bbPct * 100).toFixed(0)}% (0=низ, 100=верх)`;
      case "new_ath":
        return "Подія — не потрібне значення";
      case "vol_24h_gt":
        return "Добовий обсяг у USD";
      case "macd_cross_up": case "macd_cross_down":
        return `MACD hist: ${ind.macdHist.toFixed(4)}`;
      default: return "";
    }
  };

  const sanitizeAlertValue = (value: string) => {
    const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
    const [whole = "", ...rest] = normalized.split(".");
    const decimal = rest.join("");
    return rest.length > 0 ? `${whole}.${decimal}` : whole;
  };

  const parseAlertValue = (value: string) => {
    const normalized = value.trim().replace(",", ".");
    if (!/^\d*\.?\d+$/.test(normalized)) return NaN;
    return Number(normalized);
  };

  const loadAllAlerts = useCallback(async () => {
    if (!userId) return;
    setAlertsLoading(true);
    try {
      const rows = await listUserPriceAlerts(userId);
      setAllAlerts(rows);
    } catch { /* ігноруємо */ }
    finally { setAlertsLoading(false); }
  }, [userId]);

  const handleCreateAlert = async () => {
    setAlertMsg(""); setAlertErr("");
    if (!userId) { setAlertErr("Увійдіть в акаунт."); return; }
    const isNoValue = NO_VALUE_CONDITIONS.has(alertCond);
    const num = isNoValue ? 0 : parseAlertValue(alertVal);
    if (!isNoValue && (!Number.isFinite(num) || num <= 0)) { setAlertErr("Введіть коректне значення."); return; }

    // ── Plan limit checks ──
    const limits = getPlanLimits(account?.planKey);
    const activeAlerts = allAlerts.filter(a => a.is_active !== false);
    const alertSymbols = new Set(activeAlerts.map(a => a.symbol.toUpperCase()));
    const isNewSymbol = !alertSymbols.has(asset.sym.toUpperCase());

    if (limits.alertSymbolsMax !== null && isNewSymbol && alertSymbols.size >= limits.alertSymbolsMax) {
      setUpgradeModal({
        title: "Ліміт алертів",
        description: `Ваш план дозволяє створювати алерти для ${limits.alertSymbolsMax} ${limits.alertSymbolsMax === 1 ? "криптовалюти" : "криптовалют"}. Оновіть план для більшої кількості.`,
      });
      return;
    }
    if (limits.totalActiveAlertsMax !== null && activeAlerts.length >= limits.totalActiveAlertsMax) {
      setUpgradeModal({
        title: "Ліміт алертів",
        description: `Ваш план дозволяє мати до ${limits.totalActiveAlertsMax} активних алертів. Видаліть існуючий або оновіть план.`,
      });
      return;
    }
    if (limits.alertsPerSymbolMax !== null) {
      const perSymbol = activeAlerts.filter(a => a.symbol.toUpperCase() === asset.sym.toUpperCase()).length;
      if (perSymbol >= limits.alertsPerSymbolMax) {
        setUpgradeModal({
          title: "Ліміт алертів",
          description: `Ваш план дозволяє до ${limits.alertsPerSymbolMax} активних алертів для кожної криптовалюти. Видаліть існуючий або оновіть план.`,
        });
        return;
      }
    }

    setAlertLoading(true);
    try {
      await createPriceAlert({ userId, symbol: asset.sym, condition: alertCond, targetPrice: num, maxTriggers: alertMaxTriggers });
      setAlertMsg("Алерт створено!");
      setTimeout(() => setAlertMsg(m => m === "Алерт створено!" ? "" : m), 3000);
      setAlertVal(getAlertDefault(alertCond));
      void loadAllAlerts();
    } catch { setAlertErr("Помилка при створенні алерту."); }
    finally { setAlertLoading(false); }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!userId) return;
    setDeletingId(id);
    try {
      await removePriceAlert(userId, id);
      setAllAlerts(prev => prev.filter(a => a.id !== id));
    } catch { /* ігноруємо */ }
    finally { setDeletingId(null); }
  };

  const handleToggleAlert = useCallback(async (id: string, currentActive: boolean|null) => {
    if (!userId) return;
    const newActive = !currentActive;
    setAllAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: newActive } : a));
    setTogglingId(id);
    try { await togglePriceAlert(userId, id, newActive); }
    catch { setAllAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: currentActive } : a)); }
    finally { setTogglingId(null); }
  }, [userId]);

  const handleUpdateSlTp = useCallback((posId: string, sl?: number, tp?: number) => { // eslint-disable-line react-hooks/preserve-manual-memoization
    setActiveDemo(cur => ({
      ...cur,
      positions: cur.positions.map(p => p.id === posId ? { ...p, sl, tp } : p),
    }));
    // Keep editingPos in sync if it's the same position
    setEditingPos(prev => prev?.id === posId ? { ...prev, sl, tp } : prev);
  }, [setActiveDemo]);

  const handleUpdateAlertPrice = useCallback(async (alertId: string, newPrice: number) => {
    if (!userId) return;
    setAllAlerts(prev => prev.map(a => a.id === alertId ? { ...a, target_price: newPrice } : a));
    try { await updateAlertTargetPrice(userId, alertId, newPrice); }
    catch { void loadAllAlerts(); } // revert on error
  }, [userId, loadAllAlerts]);

  const openAlertEdit = useCallback((alert: PriceAlertRecord) => { // eslint-disable-line react-hooks/preserve-manual-memoization
    setEditingAlertId(alert.id);
    setEditAlertCond(alert.condition);
    setEditAlertVal(alert.target_price > 0 ? String(alert.target_price) : "");
    setEditAlertMaxTriggers(alert.max_triggers ?? null);
  }, []);

  const handleSaveAlertEdit = async () => {
    if (!userId || !editingAlertId) return;
    const isNoValue = NO_VALUE_CONDITIONS.has(editAlertCond);
    const num = isNoValue ? 0 : parseAlertValue(editAlertVal);
    if (!isNoValue && (!Number.isFinite(num) || num <= 0)) return;
    setEditAlertLoading(true);
    try {
      const updated = await updatePriceAlert({
        userId, id: editingAlertId,
        condition: editAlertCond, targetPrice: num,
        maxTriggers: editAlertMaxTriggers,
      });
      setAllAlerts(prev => prev.map(a => a.id === editingAlertId ? { ...a, ...updated } : a));
      setEditingAlertId(null);
    } catch { /* ignore */ }
    finally { setEditAlertLoading(false); }
  };

  const handleAlertClickOnChart = useCallback((alertId: string) => {
    setRightTab("Alerts");
    const alert = assetAlerts.find(a => a.id === alertId);
    if (alert) openAlertEdit(alert);
  }, [assetAlerts, openAlertEdit]);

  const handleAlertTriggered = useCallback(async (alert: PriceAlertRecord, triggerPrice: number) => { // eslint-disable-line react-hooks/preserve-manual-memoization
    // Never fire real alerts during replay/backtesting (use ref to avoid stale closure)
    if (modeRef.current === "replay") return;

    const condLabel = getAlertConditionShortLabel(alert.condition);
    const priceStr  = fUsd(triggerPrice);
    const targetStr = alert.target_price > 0 ? ` @ ${fUsd(alert.target_price)}` : "";
    const msg = `🚨 ${alert.symbol}: ${condLabel}${targetStr} — ціна ${priceStr}`;
    pushToast(msg);
    setChartAlertNotif({ msg, ts: Date.now() });

    if (userId) {
      // Optimistic update of trigger_count in local state
      const newCount = (alert.trigger_count ?? 0) + 1;
      const willDeactivate = alert.max_triggers != null && newCount >= alert.max_triggers;
      setAllAlerts(prev => prev.map(a =>
        a.id === alert.id
          ? { ...a, trigger_count: newCount, is_active: willDeactivate ? false : a.is_active }
          : a
      ));

      // Persist to DB: increment counter + deactivate if limit reached
      void recordAlertTrigger(userId, alert).catch(() => {});

      // Send Telegram notification if user is connected via bot
      // In production VITE_BOT_HTTP_URL points to the Render bot service
      const botBase = (import.meta.env.VITE_BOT_HTTP_URL as string | undefined)?.replace(/\/$/, "") ?? "";
      const notifyUrl = botBase ? `${botBase}/notify` : "/api/notify";
      void fetch(notifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, message: msg }),
      }).catch(() => {/* silently ignore if bot is not available */});
    }
  }, [pushToast, userId]);

  // Авто-заповнення значення при зміні умови
  useEffect(() => {
    setAlertVal(getAlertDefault(alertCond)); // eslint-disable-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertCond]);

  // Завантажуємо всі алерти при логіні або при відкритті вкладки
  useEffect(() => {
    void loadAllAlerts(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [loadAllAlerts]);

  useEffect(() => {
    if (rightTab === "Alerts") void loadAllAlerts(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [rightTab, loadAllAlerts]);

  // Fetch Telegram connection status once when userId is known
  useEffect(() => {
    if (userId) fetchTelegramStatus(userId).then(setTgConnected).catch(() => setTgConnected(false));
  }, [userId]);

  // ── Watchlist ──
  useEffect(() => {
    if (!userId) return;
    let active = true;
    listFavoriteAssets(userId)
      .then(rows => { if (active) setWatchlist(rows); })
      .catch(() => {});
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (!watchlist.length) { setWatchlistPrices({}); return; } // eslint-disable-line react-hooks/set-state-in-effect
    let active = true;
    const fetchWlPrices = async () => {
      const res: Record<string, number> = {};
      await Promise.all(watchlist.map(async w => {
        try {
          const r = await fetch(`/api/binance/ticker/24hr?symbol=${getPair(w.symbol)}`);
          if (r.ok) {
            const d = await r.json() as { lastPrice?: string };
            res[w.symbol] = +(d.lastPrice || 0);
          }
        } catch { /* ignore */ }
      }));
      if (active) setWatchlistPrices(res);
    };
    void fetchWlPrices();
    const wlId = setInterval(() => void fetchWlPrices(), 15_000);
    return () => { active = false; clearInterval(wlId); };
  }, [watchlist]);

  const toggleFavorite = useCallback(async () => {
    if (!userId) return;
    if (isFavorite) {
      setWatchlist(prev => prev.filter(w => w.symbol !== asset.sym));
      try { await removeFavoriteAsset(userId, asset.sym); }
      catch { listFavoriteAssets(userId).then(r => setWatchlist(r)).catch(() => {}); }
    } else {
      // Plan limit check
      const limits = getPlanLimits(account?.planKey);
      if (limits.watchlistMax !== null && watchlist.length >= limits.watchlistMax) {
        setUpgradeModal({
          title: "Ліміт Watchlist",
          description: `Ваш план дозволяє додавати до ${limits.watchlistMax} активів у Watchlist. Оновіть план, щоб розширити список.`,
        });
        return;
      }
      try {
        const added = await addFavoriteAsset(userId, {
          coinId: asset.id,
          symbol: asset.sym,
          name: asset.name,
          imageUrl: asset.img,
        });
        setWatchlist(prev => [added, ...prev]);
      } catch { /* ignore */ }
    }
  }, [userId, asset, isFavorite, watchlist, account]);

  // ── ML прогнози з Supabase ──
  const [mlPreds, setMlPreds]         = useState<MlPred[]>([]);
  const [mlAges,  setMlAges]          = useState<Record<string,string>>({});
  const [mlLoading, setMlLoading]     = useState(false);
  const [mlRefreshing, setMlRefreshing] = useState(false);

  // ── Signal quota (plan-based per-symbol monthly limit) ──
  const [signalUnlocked, setSignalUnlocked] = useState(false);

  // On symbol change — check if already unlocked this month
  useEffect(() => {
    const limits = getPlanLimits(account?.planKey);
    if (limits.signalSymbolsPerMonth === null) {
      // Business = unlimited, always open
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSignalUnlocked(true);
      return;
    }
    if (!userId) {
      setSignalUnlocked(false);
      return;
    }
    const viewed = getViewedSignalSymbols(userId);
    // Only auto-open if user previously unlocked this symbol
    setSignalUnlocked(viewed.has(asset.sym.toUpperCase()));
  }, [asset.sym, account?.planKey, userId]);

  // Called when user clicks "Відкрити сигнал"
  const handleUnlockSignal = () => {
    if (!userId) return;
    const limits = getPlanLimits(account?.planKey);
    if (limits.signalSymbolsPerMonth === null) {
      setSignalUnlocked(true);
      return;
    }
    const viewed = getViewedSignalSymbols(userId);
    if (viewed.size < limits.signalSymbolsPerMonth) {
      recordSignalSymbol(userId, asset.sym);
      setSignalUnlocked(true);
    } else {
      setUpgradeModal({
        title: "Ліміт AI-сигналів",
        description: `Ваш план дозволяє відкривати AI-сигнали для ${limits.signalSymbolsPerMonth} символів на місяць. Оновіть план для необмеженого доступу.`,
      });
    }
  };

  /** Завантажує прогнози з Supabase для поточного asset.sym */
  const fetchPreds = useCallback(async (active?: { ok: boolean }): Promise<MlPred[]> => {
    setMlLoading(true);
    try {
      const { data, error } = await supabase
        .from("model_predictions")
        .select("interval,signal,confidence,accuracy,stop_loss,take_profit,price,created_at")
        .eq("symbol", asset.sym)
        .in("interval", ["4h","1d","1w","1M"])
        .order("created_at", { ascending: false })
        .limit(20);

      if(active && !active.ok) return [];
      if(error||!data){ setMlPreds([]); setMlAges({}); return []; }

      // Залишаємо тільки найсвіжіший прогноз для кожного таймфрейму
      const seen = new Set<string>();
      const latest: MlPred[] = [];
      for(const row of data as MlPred[]){
        if(!seen.has(row.interval)){ seen.add(row.interval); latest.push(row); }
      }
      setMlPreds(latest);

      // Обчислюємо вік прогнозів тут (в ефекті), а не під час рендеру
      const fetchedAt = new Date().getTime();
      const ages: Record<string,string> = {};
      for(const p of latest){
        const ms = p.created_at ? Math.max(0, fetchedAt - new Date(p.created_at).getTime()) : null;
        ages[p.interval] = ms==null ? "" : ms<3_600_000
          ? `${Math.round(ms/60_000)}хв тому`
          : `${Math.round(ms/3_600_000)}г тому`;
      }
      setMlAges(ages);
      return latest;
    } catch{ if(!active||active.ok){ setMlPreds([]); setMlAges({}); } return []; }
    finally{ if(!active||active.ok) setMlLoading(false); }
  }, [asset.sym]);

  useEffect(()=>{
    const active = { ok: true };
    void fetchPreds(active); // eslint-disable-line react-hooks/set-state-in-effect
    return ()=>{ active.ok = false; };
  },[fetchPreds]);

  /**
   * Натискання "Оновити":
   * 1. Пінгуємо бот → він генерує свіжий прогноз у фоні
   * 2. Кожні 5 с перевіряємо Supabase поки не з'явиться новий запис
   * 3. Зупиняємось після 3 хвилин (36 спроб) або якщо з'явився новий прогноз
   */
  const requestFreshPrediction = useCallback(async (source: "manual"|"auto" = "manual") => {
    const BOT_URL = import.meta.env.VITE_BOT_URL as string | undefined;
    const requestKey = `${asset.sym}:${source}`;
    const nowMs = Date.now();

    if(source === "auto" && nowMs - (lastPredictionRequest.current[requestKey] ?? 0) < AUTO_PREDICTION_REFRESH_MS - 5_000){
      return;
    }
    lastPredictionRequest.current[requestKey] = nowMs;

    if(!BOT_URL){
      // Немає URL бота — просто перезавантажуємо з Supabase
      void fetchPreds();
      return;
    }
    const beforeStamp = Math.max(0, ...mlPreds.map(p => new Date(p.created_at).getTime()).filter(Number.isFinite));
    setMlRefreshing(true);
    try {
      // Тригер на бот (fire-and-forget). no-cors потрібен для Render,
      // бо відповідь нам не потрібна: свіжий результат читаємо з Supabase polling нижче.
      await fetch(`${BOT_URL}/predict?symbol=${encodeURIComponent(asset.sym)}&ts=${Date.now()}`, {
        method: "GET",
        mode: "no-cors",
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      }).catch(()=>{ /* timeout або мережеві помилки — ігноруємо */ });
    } catch { /* ігноруємо мережеві помилки */ }

    let attempts = 0;
    const MAX_ATTEMPTS = source === "auto" ? 12 : 36;
    const poll = async (): Promise<void> => {
      attempts++;
      const latest = await fetchPreds();
      const latestStamp = Math.max(0, ...latest.map(p => new Date(p.created_at).getTime()).filter(Number.isFinite));

      if(latestStamp > beforeStamp){
        setMlRefreshing(false);
        return;
      }

      if(attempts < MAX_ATTEMPTS){
        setTimeout(()=>{ void poll(); }, 5_000);
      } else {
        setMlRefreshing(false);
      }
    };
    setTimeout(()=>{ void poll(); }, 5_000);
  }, [asset.sym, fetchPreds, mlPreds]);

  useEffect(()=>{
    void requestFreshPrediction("auto"); // eslint-disable-line react-hooks/set-state-in-effect

    if(autoPredictionTimer.current) clearInterval(autoPredictionTimer.current);
    autoPredictionTimer.current = setInterval(()=>{
      if(document.visibilityState === "visible") void requestFreshPrediction("auto");
    }, AUTO_PREDICTION_REFRESH_MS);

    const onVisible = () => {
      if(document.visibilityState === "visible") void requestFreshPrediction("auto");
    };
    document.addEventListener("visibilitychange", onVisible);

    return()=>{
      if(autoPredictionTimer.current) clearInterval(autoPredictionTimer.current);
      autoPredictionTimer.current = null;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [requestFreshPrediction]);

  // ════════════════════════════════════════════
  // Поки завантажуємо з БД — показуємо splash
  if(!dbReady){
    return (
      <div className="flex h-screen items-center justify-center bg-[#010004] text-white flex-col gap-3">
        <Loader2 size={32} className="animate-spin text-[#8348C1]"/>
        <span className="text-[13px] text-white/40">Завантаження торгового рахунку...</span>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // Перший візит — запрошення розпочати demo
  if(noAccount && userId){
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#010004] text-white gap-0" style={{fontFamily:"'Montserrat',sans-serif"}}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-200px] left-[10%] w-[600px] h-[600px] bg-[#522E8B]/20 blur-[140px] rounded-full"/>
          <div className="absolute bottom-[-200px] right-[10%] w-[500px] h-[500px] bg-[#8348C1]/15 blur-[140px] rounded-full"/>
        </div>
        <div className="relative z-10 flex flex-col items-center text-center max-w-[480px] px-6">
          {/* Chart icon */}
          <div className="mb-8 flex h-[80px] w-[80px] items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,rgba(131,72,193,0.25),rgba(44,25,105,0.4))] border border-[#8348C1]/30 shadow-[0_0_40px_rgba(131,72,193,0.2)]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="#8348C1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-[28px] font-bold mb-3 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Demo Trading
          </h2>
          <p className="text-[14px] text-white/50 leading-relaxed mb-2">
            Практикуйте торгівлю криптовалютами без ризику.
          </p>
          <p className="text-[13px] text-[#8348C1] font-medium mb-10">
            Стартовий баланс: <span className="text-white font-bold">$25,000</span> віртуальних коштів
          </p>

          {/* Features */}
          <div className="w-full grid grid-cols-3 gap-3 mb-10">
            {[
              { icon: "📊", title: "Реальні графіки", desc: "Binance live data" },
              { icon: "⚡", title: "Ф'ючерси з плечем", desc: "До 100×" },
              { icon: "🎯", title: "Аналітика", desc: "PnL, Win rate" },
            ].map(f=>(
              <div key={f.title} className="rounded-[16px] bg-white/[0.04] border border-white/[0.07] p-4 flex flex-col items-center gap-2 text-center">
                <span className="text-[22px]">{f.icon}</span>
                <span className="text-[12px] font-medium text-white/80">{f.title}</span>
                <span className="text-[11px] text-white/40">{f.desc}</span>
              </div>
            ))}
          </div>

          <button
            onClick={()=>setNoAccount(false)}
            className="w-full max-w-[320px] h-[50px] rounded-full bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-white text-[15px] font-semibold transition-transform hover:scale-[1.03] active:scale-[0.97] shadow-[0_4px_24px_rgba(131,72,193,0.35)]"
          >
            Розпочати з $25,000
          </button>
          <button onClick={()=>window.history.back()} className="mt-4 text-[12px] text-white/30 hover:text-white/60 transition-colors">
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#010004] text-white overflow-hidden" style={{fontFamily:"'Montserrat',sans-serif"}}>

      {/* ══ HEADER ══ */}
      <header className="flex h-[46px] shrink-0 items-center justify-between border-b border-white/10 bg-[#050506] px-3 gap-2">

        {/* Left */}
        <div className="flex items-center gap-2 h-full min-w-0">
          <Link to="/dashboard" className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-white/50 hover:bg-white/5 hover:text-white transition-colors">
            <ArrowLeft size={15}/>
          </Link>
          <div className="h-4 w-px bg-white/10 shrink-0"/>

          {/* Mode switcher */}
          <div className="flex shrink-0 items-center bg-[#0B0B12] border border-white/10 rounded-lg p-0.5">
            <button type="button" onClick={()=>setMode("live")}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${mode==="live"?"bg-[#8348C1] text-white":"text-white/35 hover:text-white"}`}>
              Live Demo
            </button>
            <button type="button" onClick={()=>setMode("replay")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${mode==="replay"?"bg-[#F7931A] text-[#0B0B12]":"text-white/35 hover:text-white"}`}>
              <Rewind size={9}/> Replay
            </button>
          </div>
          <div className="h-4 w-px bg-white/10 shrink-0"/>

          {/* Coin selector */}
          <div ref={coinRef} className="relative">
            <button type="button" onClick={()=>{setCoinOpen(v=>!v);setCoinQ("");}}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-white/5 transition-colors">
              <img src={asset.img} alt={asset.sym} className="h-5 w-5 rounded-full shrink-0"
                onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none"}}/>
              <span className="text-[14px] font-bold">{asset.sym}</span>
              <span className="text-[10px] text-white/40">/ USDT</span>
              <ChevronDown size={11} className={`text-white/40 transition-transform ${coinOpen?"rotate-180":""}`}/>
            </button>

            {coinOpen&&(
              <div className="absolute top-full left-0 mt-1 w-[330px] bg-[#0A0A10] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-2 border-b border-white/5">
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
                    <Search size={12} className="text-white/40 shrink-0"/>
                    <input autoFocus value={coinQ} onChange={e=>setCoinQ(e.target.value)}
                      placeholder="Пошук серед 150+ монет..." className="bg-transparent text-[12px] text-white outline-none w-full placeholder:text-white/30"/>
                    {coinQ&&<button type="button" onClick={()=>setCoinQ("")}><X size={11} className="text-white/30 hover:text-white"/></button>}
                  </div>
                </div>
                <div className="grid grid-cols-[10px_1fr_auto] gap-0 px-3 py-1.5 text-[9px] uppercase tracking-wider text-white/25 font-semibold border-b border-white/5">
                  <span/><span>Монета</span><span className="text-right">Ціна / 24h</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {filtCoins.map((a,i)=>(
                    <button key={a.id} type="button" onClick={()=>goAsset(a)}
                      className={`flex w-full items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors border-b border-white/[0.03] ${a.sym===asset.sym?"bg-[#8348C1]/10":""}`}>
                      <span className="text-[9px] text-white/25 w-5 shrink-0 text-right">{a.rank??i+1}</span>
                      <img src={a.img} alt={a.sym} className="h-6 w-6 rounded-full shrink-0" onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none"}}/>
                      <div className="text-left min-w-0 flex-1">
                        <div className="text-[12px] font-semibold">{a.sym} <span className="text-white/30 font-normal text-[10px]">USDT</span></div>
                        <div className="text-[9px] text-white/40 truncate">{a.name}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px]">{fUsd(a.price)}</div>
                        <div className={`text-[10px] font-medium ${a.pct24h>=0?"text-[#25DE28]":"text-[#F40000]"}`}>{fPct(a.pct24h)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-white/10 shrink-0"/>
          {/* Favorite / Watchlist star */}
          {userId && (
            <button type="button"
              title={isFavorite ? "Видалити з вотчлісту" : "Додати до вотчлісту"}
              onClick={() => void toggleFavorite()}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors hover:bg-white/5">
              <Star size={13} className={isFavorite ? "fill-yellow-400 text-yellow-400" : "text-white/30 hover:text-yellow-400"} fill={isFavorite ? "currentColor" : "none"}/>
            </button>
          )}
          {/* Live dot (live mode only) */}
          {mode === "live" && (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25DE28] opacity-60"/>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#25DE28]"/>
            </span>
          )}
          {/* Replay indicator */}
          {mode === "replay" && replayCandles.length > 0 && (
            <span className="shrink-0 flex items-center gap-1 text-[9px] font-semibold text-[#F7931A] bg-[#F7931A]/10 rounded px-1.5 py-0.5 border border-[#F7931A]/20">
              <Rewind size={8}/>
              {new Date(replayCandles[replayIndex]?.time ?? 0).toLocaleDateString("uk-UA",{day:"2-digit",month:"short",year:"numeric"})}
              <span className="text-white/30">·</span>
              {replayIndex+1}/{replayCandles.length}
            </span>
          )}
          {/* Price */}
          <span className={`text-[15px] font-bold shrink-0 ${isGreen?"text-[#25DE28]":"text-[#F40000]"}`}>
            {loading&&!effectivePrice?<Loader2 size={13} className="animate-spin inline"/>:fUsd(effectivePrice)}
          </span>
          {mode === "live" && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${isGreen?"bg-[#25DE28]/10 text-[#25DE28]":"bg-[#F40000]/10 text-[#F40000]"}`}>
            {fPct(pct24h)}
          </span>
          )}
          {h24>0&&(
            <div className="hidden xl:flex items-center gap-3 ml-2 text-[10px] text-white/40">
              <span>H: <span className="text-white">{fUsd(h24)}</span></span>
              <span>L: <span className="text-white">{fUsd(l24)}</span></span>
              <span>Vol: <span className="text-white">{fUsd(v24,true)}</span></span>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 shrink-0">
          {dataErr&&<span title={dataErr}><AlertTriangle size={14} className="text-red-400"/></span>}
          <a href={buildAiUrl(account?.userId, account?.planKey)} target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex h-7 items-center gap-1 rounded-lg bg-gradient-to-r from-[#2C1969] to-[#8348C1] px-2.5 text-[11px] font-semibold hover:opacity-80 transition-opacity">
            <Bot size={12}/> PulseAI
          </a>
          <button type="button" onClick={()=>void loadData()} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors">
            <RefreshCw size={13} className={loading?"animate-spin":""}/>
          </button>
          <button type="button" onClick={() => setWatchlistOpen(v => !v)}
            title="Вотчліст"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${watchlistOpen ? "bg-[#8348C1]/20 text-[#C38BFF]" : "text-white/50 hover:bg-white/5 hover:text-white"}`}>
            <Star size={14} fill={watchlistOpen ? "currentColor" : "none"}/>
          </button>
          <div className="h-4 w-px bg-white/10"/>
          <button type="button" onClick={()=>setPanelOpen(v=>!v)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${panelOpen?"bg-[#8348C1]/20 text-[#C38BFF]":"text-white/50 hover:bg-white/5 hover:text-white"}`}>
            <PanelRight size={16}/>
          </button>
        </div>
      </header>

      {/* ══ REPLAY CONTROLS BAR ══ */}
      {mode === "replay" && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#050506] border-b border-[#F7931A]/20 shrink-0 overflow-x-auto">
          {/* Educational badge */}
          <span className="shrink-0 flex items-center gap-1 text-[9px] font-bold text-[#F7931A] bg-[#F7931A]/10 rounded-lg px-2 py-1 border border-[#F7931A]/20 whitespace-nowrap">
            <BookOpen size={9}/> PRACTICE REPLAY
          </span>

          <div className="w-px h-5 bg-white/10 shrink-0"/>

          {/* Quick date presets */}
          {([
            { label:"1Т",  months:0, days:7  },
            { label:"1М",  months:1, days:0  },
            { label:"3М",  months:3, days:0  },
            { label:"6М",  months:6, days:0  },
          ] as const).map(({ label, months, days }) => {
            const today = new Date();
            const from  = new Date(today);
            if (months) from.setMonth(from.getMonth() - months);
            else        from.setDate(from.getDate() - days);
            const fromStr = from.toISOString().split("T")[0];
            const toStr   = today.toISOString().split("T")[0];
            const active  = replayStartDate === fromStr && replayEndDate === toStr;
            return (
              <button key={label} type="button"
                onClick={() => { setReplayStartDate(fromStr); setReplayEndDate(toStr); }}
                className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors shrink-0 ${
                  active
                    ? "bg-[#F7931A] text-[#0B0B12]"
                    : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                }`}>
                {label}
              </button>
            );
          })}

          <div className="w-px h-5 bg-white/10 shrink-0"/>

          {/* Date inputs */}
          <input type="date" value={replayStartDate}
            onChange={e => { setReplayStartDate(e.target.value); if(replayEndDate && e.target.value > replayEndDate) setReplayEndDate(e.target.value); }}
            className="bg-[#0B0B12] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none focus:border-[#F7931A]/50 transition-colors shrink-0 w-[110px]"
            max={replayEndDate || new Date().toISOString().split("T")[0]}/>
          <span className="text-[9px] text-white/30 shrink-0">—</span>
          <input type="date" value={replayEndDate}
            onChange={e => setReplayEndDate(e.target.value)}
            className="bg-[#0B0B12] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none focus:border-[#F7931A]/50 transition-colors shrink-0 w-[110px]"
            min={replayStartDate} max={new Date().toISOString().split("T")[0]}/>

          {/* TF selector */}
          <select value={replayTf} onChange={e=>setReplayTf(e.target.value as ChartTf)}
            className="bg-[#0B0B12] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none shrink-0">
            {TF_OPTIONS.map(t=><option key={t} value={t}>{TF_LABELS[t]}</option>)}
          </select>

          {/* Load button */}
          <button type="button" onClick={()=>void loadReplayCandles()} disabled={replayLoading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F7931A]/15 text-[#F7931A] text-[10px] font-semibold hover:bg-[#F7931A]/25 transition-colors disabled:opacity-50 shrink-0 border border-[#F7931A]/20 whitespace-nowrap">
            {replayLoading?<Loader2 size={10} className="animate-spin"/>:<FastForward size={10}/>}
            {replayLoading?"Завантаження...":"Завантажити"}
          </button>

          {replayCandles.length > 0 && (
            <>
              <div className="w-px h-5 bg-white/10 shrink-0"/>

              {/* Play / Pause */}
              <button type="button" onClick={()=>setReplayPlaying(p=>!p)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-white transition-colors shrink-0 ${replayPlaying?"bg-[#F7931A]/20 text-[#F7931A]":"bg-white/5 hover:bg-white/10"}`}>
                {replayPlaying?<Pause size={13}/>:<Play size={13}/>}
              </button>

              {/* Restart */}
              <button type="button" onClick={handleReplayRestart}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors shrink-0">
                <RotateCcw size={12}/>
              </button>

              {/* Speed selector */}
              <div className="flex items-center gap-0.5 bg-[#0B0B12] border border-white/10 rounded-lg p-0.5 shrink-0">
                {([1,2,5,10] as const).map(s=>(
                  <button key={s} type="button" onClick={()=>setReplaySpeed(s)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${replaySpeed===s?"bg-[#F7931A] text-[#0B0B12]":"text-white/40 hover:text-white"}`}>
                    {s}x
                  </button>
                ))}
              </div>

              {/* Progress bar */}
              <div className="flex-1 min-w-[80px] max-w-[200px]">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#F7931A] rounded-full transition-all"
                    style={{width:`${replayCandles.length>0?((replayIndex+1)/replayCandles.length*100):0}%`}}/>
                </div>
              </div>

              <div className="w-px h-5 bg-white/10 shrink-0"/>

              {/* End session */}
              <button type="button" onClick={handleEndSession}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-white/50 text-[10px] font-semibold hover:bg-red-500/10 hover:text-red-400 transition-colors shrink-0 border border-white/5 whitespace-nowrap">
                <Flag size={9}/> Завершити
              </button>
            </>
          )}
        </div>
      )}

      {/* ══ WORKSPACE ══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT WATCHLIST SIDEBAR */}
        <aside className={`shrink-0 overflow-hidden border-r border-white/10 bg-[#050506] transition-all duration-300 flex flex-col ${watchlistOpen ? "w-[150px]" : "w-0 border-transparent"}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-2 h-[38px] border-b border-white/10 shrink-0">
            <div className="text-[9px] font-bold text-white/35 uppercase tracking-wider flex items-center gap-1">
              <Star size={8}/> Вотчліст
            </div>
            {userId && (
              <button type="button"
                title={isFavorite ? "Видалити з вотчлісту" : "Додати поточний"}
                onClick={() => void toggleFavorite()}
                className="flex h-5 w-5 items-center justify-center rounded text-white/30 hover:text-yellow-400 hover:bg-white/5 transition-colors">
                <Star size={10} className={isFavorite ? "fill-yellow-400 text-yellow-400" : ""} fill={isFavorite ? "currentColor" : "none"}/>
              </button>
            )}
          </div>
          {/* List */}
          <div className="flex-1 overflow-y-auto py-1">
            {!userId ? (
              <div className="text-center text-[9px] text-white/20 px-2 py-4 leading-relaxed">Увійдіть,<br/>щоб додати</div>
            ) : watchlist.length === 0 ? (
              <div className="text-center text-[9px] text-white/20 px-2 py-4 leading-relaxed">Порожньо.<br/>Натисни ★ щоб<br/>зберегти монету</div>
            ) : (
              watchlist.map(w => {
                const wPrice = watchlistPrices[w.symbol] || 0;
                const isCur = w.symbol === asset.sym;
                return (
                  <button key={w.id} type="button"
                    onClick={() => navigate(`/trading/${w.symbol}`)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/5 transition-colors text-left border-b border-white/[0.03] ${isCur ? "bg-[#8348C1]/10" : ""}`}
                  >
                    <img src={w.image_url} alt={w.symbol} className="h-5 w-5 rounded-full shrink-0 object-contain"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}/>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className={`text-[10px] font-semibold truncate ${isCur ? "text-[#C38BFF]" : "text-white/80"}`}>{w.symbol}</div>
                      {wPrice > 0 && (
                        <div className="text-[8px] font-mono text-white/35 truncate">{fUsd(wPrice)}</div>
                      )}
                    </div>
                    {isCur && <span className="w-1.5 h-1.5 rounded-full bg-[#C38BFF] shrink-0"/>}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* CENTER */}
        <main className="flex flex-1 flex-col min-w-0 bg-[#08080A]">

          {/* Chart — lightweight-charts with real price lines + drag SL/TP */}
          <div className="flex-1 min-h-0">
            <TradingLWChart
              pair={pair}
              alerts={assetAlerts}
              positions={activeDemo.positions.filter(p=>p.sym===asset.sym)}
              onUpdatePositionSlTp={handleUpdateSlTp}
              onUpdateAlertPrice={handleUpdateAlertPrice}
              onAlertTriggered={handleAlertTriggered}
              onAlertClick={handleAlertClickOnChart}
              chartAlertNotif={chartAlertNotif}
              replayCandles={mode==="replay"?replayCandles:undefined}
              replayIndex={mode==="replay"?replayIndex:undefined}
            />
          </div>

          {/* Bottom Panel */}
          <div className={`flex flex-col border-t border-white/10 bg-[#050506] shrink-0 transition-all duration-300 ${bottomOpen?"h-[210px]":"h-[34px]"}`}>

            {/* Tab bar */}
            <div className="flex h-[34px] items-center justify-between px-3 border-b border-white/5 shrink-0 bg-[#08080A]">
              <div className="flex items-center h-full">
                {(["Positions","Orders","History"] as BottomTab[]).map(tab=>{
                  const cnt=tab==="Positions"?activeDemo.positions.length:tab==="Orders"?activeDemo.orders.length:activeDemo.trades.length;
                  return (
                    <button key={tab} type="button"
                      onClick={()=>{setBotTab(tab);if(!bottomOpen)setBottomOpen(true);}}
                      className={`h-full px-3 text-[11px] font-semibold border-b-2 transition-colors whitespace-nowrap ${botTab===tab&&bottomOpen?"border-[#8348C1] text-white":"border-transparent text-white/40 hover:text-white"}`}>
                      {tab==="Positions"?"Позиції":tab==="Orders"?"Ордери":"Історія"}
                      <span className={`ml-1 ${cnt>0?"text-white/60":"text-white/25"}`}>({cnt})</span>
                    </button>
                  );
                })}
                {totalPnl!==0&&bottomOpen&&(
                  <span className={`ml-4 text-[11px] font-semibold ${totalPnl>=0?"text-[#25DE28]":"text-[#F40000]"}`}>
                    PnL: {totalPnl>=0?"+":""}{fUsd(totalPnl)}
                  </span>
                )}
              </div>
              <button type="button" onClick={()=>setBottomOpen(v=>!v)}
                className="flex items-center gap-0.5 text-[10px] text-white/35 hover:text-white transition-colors px-1">
                <PanelBottom size={12}/>
                {bottomOpen?<ChevronDown size={10}/>:<ChevronUp size={10}/>}
              </button>
            </div>

            {bottomOpen&&(
              <div className="flex-1 overflow-auto">

                {/* POSITIONS */}
                {botTab==="Positions"&&(
                  activeDemo.positions.length===0
                    ? <Empty text="Немає відкритих позицій"/>
                    : <table className="w-full text-left text-[10.5px]">
                        <thead className="sticky top-0 bg-[#050506] z-10">
                          <tr className="text-white/30 border-b border-white/5">
                            {["Символ","Сторона","Плечі","Розмір","Ціна входу","Поточна","Маржа","PnL","ROE%","Ліквід.","SL","TP",""].map(h=>(
                              <th key={h} className="px-2.5 py-2 font-medium whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeDemo.positions.map(pos=>{
                            const liveP = posPrice(pos.sym);
                            const fillP = liveP || pos.avgPrice;
                            const pnl=getPnl(pos,fillP);
                            const roe=(pnl/pos.margin)*100;
                            const priceReady = liveP > 0;
                            return (
                              <tr key={pos.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer"
                                onClick={e=>{
                                  if((e.target as HTMLElement).closest("button")) return;
                                  navigate(`/trading/${pos.sym}`);
                                }}>
                                <td className="px-2.5 py-2">
                                  <div className="flex items-center gap-1.5">
                                    <img src={pos.img} alt={pos.sym} className="h-4 w-4 rounded-full" onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none"}}/>
                                    <span className="font-semibold">{pos.sym}</span>
                                  </div>
                                </td>
                                <td className={`px-2.5 py-2 font-bold ${pos.side==="LONG"?"text-[#25DE28]":"text-[#F40000]"}`}>{pos.side}</td>
                                <td className="px-2.5 py-2"><span className="bg-[#8348C1]/20 text-[#C38BFF] rounded px-1.5 py-0.5 text-[9px] font-bold">{pos.leverage}x</span></td>
                                <td className="px-2.5 py-2 text-white/80">{fQty(pos.qty)}</td>
                                <td className="px-2.5 py-2 text-white/80">{fUsd(pos.avgPrice)}</td>
                                <td className="px-2.5 py-2">
                                  {priceReady
                                    ? <span className="font-semibold text-white">{fUsd(liveP)}</span>
                                    : <span className="text-white/20 text-[9px] animate-pulse">завант...</span>}
                                </td>
                                <td className="px-2.5 py-2 text-white/80">{fUsd(pos.margin)}</td>
                                <td className={`px-2.5 py-2 font-semibold ${pnl>=0?"text-[#25DE28]":"text-[#F40000]"}`}>
                                  {priceReady ? <>{pnl>=0?"+":""}{fUsd(pnl)}</> : <span className="text-white/20">---</span>}
                                </td>
                                <td className={`px-2.5 py-2 font-semibold ${roe>=0?"text-[#25DE28]":"text-[#F40000]"}`}>
                                  {priceReady ? fRoe(roe) : <span className="text-white/20">---</span>}
                                </td>
                                <td className="px-2.5 py-2 text-amber-400/80 text-[10px]">{pos.liqPrice>0?fUsd(pos.liqPrice):"—"}</td>
                                <td className="px-2.5 py-2 text-[#F40000]/80">{pos.sl&&pos.sl>0?fUsd(pos.sl):"—"}</td>
                                <td className="px-2.5 py-2 text-[#25DE28]/80">{pos.tp&&pos.tp>0?fUsd(pos.tp):"—"}</td>
                                <td className="px-2.5 py-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button type="button"
                                      onClick={e=>{e.stopPropagation();setEditingPos(pos);}}
                                      className="flex h-6 w-6 items-center justify-center rounded text-white/25 hover:bg-[#8348C1]/20 hover:text-[#C38BFF] transition-colors"
                                      title="Редагувати SL/TP">
                                      <Edit2 size={10}/>
                                    </button>
                                    <button type="button"
                                      onClick={e=>{e.stopPropagation();closePosition(pos,fillP);}}
                                      className="rounded px-2 py-0.5 bg-white/5 text-[10px] hover:bg-red-500/20 hover:text-red-400 transition-colors">
                                      Закрити
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                )}

                {/* ORDERS */}
                {botTab==="Orders"&&(
                  activeDemo.orders.length===0
                    ? <Empty text="Немає активних ордерів"/>
                    : <table className="w-full text-left text-[10.5px]">
                        <thead className="sticky top-0 bg-[#050506] z-10">
                          <tr className="text-white/30 border-b border-white/5">
                            {["Символ","Сторона","Плечі","Тип","Сума","Ліміт","SL","TP","Час",""].map(h=>(
                              <th key={h} className="px-2.5 py-2 font-medium whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeDemo.orders.map(o=>(
                            <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                              <td className="px-2.5 py-2"><div className="flex items-center gap-1.5"><img src={o.img} alt={o.sym} className="h-4 w-4 rounded-full" onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none"}}/><span className="font-semibold">{o.sym}</span></div></td>
                              <td className={`px-2.5 py-2 font-bold ${o.side==="LONG"?"text-[#25DE28]":"text-[#F40000]"}`}>{o.side}</td>
                              <td className="px-2.5 py-2"><span className="bg-[#8348C1]/20 text-[#C38BFF] rounded px-1.5 py-0.5 text-[9px] font-bold">{o.leverage}x</span></td>
                              <td className="px-2.5 py-2 text-white/60">{o.type}</td>
                              <td className="px-2.5 py-2 text-white/80">{fUsd(o.notional)}</td>
                              <td className="px-2.5 py-2 text-white/80">{o.limitPrice?fUsd(o.limitPrice):"—"}</td>
                              <td className="px-2.5 py-2 text-white/40">{o.sl?fUsd(o.sl):"—"}</td>
                              <td className="px-2.5 py-2 text-white/40">{o.tp?fUsd(o.tp):"—"}</td>
                              <td className="px-2.5 py-2 text-white/30 whitespace-nowrap">{o.createdAt}</td>
                              <td className="px-2.5 py-2 text-right">
                                <button type="button" onClick={()=>cancelOrder(o.id)} className="rounded px-2 py-0.5 bg-white/5 text-[10px] hover:bg-red-500/20 hover:text-red-400 transition-colors">Скасувати</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                )}

                {/* HISTORY */}
                {botTab==="History"&&(
                  activeDemo.trades.length===0
                    ? <Empty text="Немає закритих угод"/>
                    : <table className="w-full text-left text-[10.5px]">
                        <thead className="sticky top-0 bg-[#050506] z-10">
                          <tr className="text-white/30 border-b border-white/5">
                            {["Символ","Сторона","Плечі","Результат","Дія","Кількість","Ціна","PnL","ROE%","Час"].map(h=>(
                              <th key={h} className="px-2.5 py-2 font-medium whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeDemo.trades.map(t=>{
                            const isWin = t.action==="CLOSE" && t.pnl>0;
                            const isLoss= t.action==="CLOSE" && t.pnl<0;
                            return (
                            <tr key={t.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                              <td className="px-2.5 py-2 font-semibold">{t.sym}</td>
                              <td className={`px-2.5 py-2 font-bold ${t.side==="LONG"?"text-[#25DE28]":"text-[#F40000]"}`}>{t.side}</td>
                              <td className="px-2.5 py-2"><span className="bg-[#8348C1]/20 text-[#C38BFF] rounded px-1.5 py-0.5 text-[9px] font-bold">{t.leverage}x</span></td>
                              <td className="px-2.5 py-2">
                                {t.action==="CLOSE"?(
                                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${isWin?"bg-[#25DE28]/15 text-[#25DE28]":isLoss?"bg-[#F40000]/15 text-[#F40000]":"bg-white/10 text-white/40"}`}>
                                    {isWin?"WIN":isLoss?"LOSS":"0"}
                                  </span>
                                ):<span className="text-white/20 text-[9px]">—</span>}
                              </td>
                              <td className="px-2.5 py-2">
                                <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${t.action==="OPEN"?"bg-[#8348C1]/20 text-[#C38BFF]":"bg-white/10 text-white/60"}`}>
                                  {t.action==="OPEN"?"Відкрито":"Закрито"}
                                </span>
                              </td>
                              <td className="px-2.5 py-2 text-white/80">{fQty(t.qty)}</td>
                              <td className="px-2.5 py-2 text-white/80">{fUsd(t.price)}</td>
                              <td className={`px-2.5 py-2 font-semibold ${t.pnl>0?"text-[#25DE28]":t.pnl<0?"text-[#F40000]":"text-white/40"}`}>
                                {t.action==="CLOSE"?(t.pnl>=0?"+":"")+fUsd(t.pnl):"—"}
                              </td>
                              <td className={`px-2.5 py-2 font-semibold ${t.roe>0?"text-[#25DE28]":t.roe<0?"text-[#F40000]":"text-white/40"}`}>
                                {t.action==="CLOSE"?fRoe(t.roe):"—"}
                              </td>
                              <td className="px-2.5 py-2 text-white/30 whitespace-nowrap">{t.createdAt}</td>
                            </tr>
                          );})}
                        </tbody>
                      </table>
                )}
              </div>
            )}
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className={`shrink-0 overflow-hidden border-l border-white/10 bg-[#050506] transition-all duration-300 flex flex-col ${panelOpen?"w-[295px]":"w-0 border-transparent"}`}>

          {/* Tabs */}
          <div className="flex h-[38px] border-b border-white/10 shrink-0">
            {(["Trade","Data","Alerts"] as const).map(t=>(
              <button key={t} type="button" onClick={()=>setRightTab(t)}
                className={`h-full flex-1 text-[11px] font-semibold border-b-2 transition-colors flex items-center justify-center gap-1 ${rightTab===t?"border-[#8348C1] text-white":"border-transparent text-white/40 hover:text-white"}`}>
                {t==="Trade"?"Угода":t==="Data"?"Аналітика":<><Bell size={9}/> Алерти</>}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">

            {/* ══ TRADE TAB ══ */}
            {rightTab==="Trade"&&(
              <>
                {/* Balance */}
                <div className="rounded-xl border border-white/5 bg-[#08080A] p-3 space-y-1.5">
                  {/* Account label */}
                  {mode === "replay" && (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-[#F7931A] bg-[#F7931A]/10 rounded px-1.5 py-0.5 w-fit mb-1">
                      📚 Replay Account
                    </div>
                  )}
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">Demo баланс</span>
                    <span className={`font-bold ${activeDemo.cash<0?"text-[#F40000]":"text-white"}`}>{fUsd(activeDemo.cash)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">Equity</span>
                    <span className={`font-bold ${equity>=DEMO_START?"text-[#25DE28]":"text-[#F40000]"}`}>{fUsd(equity)}</span>
                  </div>
                  {totalPnl!==0&&(
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/40">Open PnL</span>
                      <span className={`font-semibold ${totalPnl>=0?"text-[#25DE28]":"text-[#F40000]"}`}>{totalPnl>=0?"+":""}{fUsd(totalPnl)}</span>
                    </div>
                  )}
                  {/* Поповнення */}
                  <div className="flex gap-1.5 pt-1">
                    {[5000,10000,25000].map(a=>(
                      <button key={a} type="button" onClick={()=>addBalance(a)}
                        className="flex-1 flex items-center justify-center gap-0.5 rounded-lg bg-[#8348C1]/10 border border-[#8348C1]/20 text-[10px] font-semibold text-[#C38BFF] hover:bg-[#8348C1]/20 transition-colors py-1">
                        <Plus size={9}/>${(a/1000).toFixed(0)}k
                      </button>
                    ))}
                  </div>
                  {activeDemo.cash<1000&&(
                    <div className="flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 p-1.5 text-[10px] text-amber-300">
                      <AlertTriangle size={10}/> Поповніть баланс
                    </div>
                  )}
                </div>

                {/* LONG / SHORT */}
                <div className="flex rounded-xl bg-[#08080A] p-0.5 border border-white/10">
                  {(["LONG","SHORT"] as const).map(s=>(
                    <button key={s} type="button" onClick={()=>setSide(s)}
                      className={`h-8 flex-1 rounded-lg text-[12px] font-bold transition-all ${side===s?(s==="LONG"?"bg-[#25DE28] text-black":"bg-[#F40000] text-white"):"text-white/40 hover:text-white hover:bg-white/5"}`}>
                      {s==="LONG"?<span className="flex items-center justify-center gap-1"><TrendingUp size={13}/>LONG</span>:<span className="flex items-center justify-center gap-1"><TrendingDown size={13}/>SHORT</span>}
                    </button>
                  ))}
                </div>

                {/* Market / Limit */}
                <div className="flex gap-1.5">
                  {(["Market","Limit"] as const).map(t=>(
                    <button key={t} type="button" onClick={()=>setOtype(t)}
                      className={`h-7 flex-1 rounded-lg text-[11px] font-medium border transition-colors ${otype===t?"border-white/20 bg-white/10 text-white":"border-white/5 text-white/40 hover:border-white/10 hover:text-white"}`}>
                      {t}
                    </button>
                  ))}
                </div>

                {/* ── LEVERAGE ── */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-white/40 font-semibold">Плечі</span>
                    <span className="text-[11px] font-bold text-[#C38BFF]">{leverage}x</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {LEVERAGES.map(l=>(
                      <button key={l} type="button" onClick={()=>setLeverage(l)}
                        className={`rounded-lg py-1 text-[10px] font-bold transition-colors ${leverage===l?"bg-[#8348C1] text-white":"bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"} ${l>=50?"border border-amber-500/30":""}`}>
                        {l}x
                      </button>
                    ))}
                  </div>
                  {leverage>=10&&(
                    <div className="flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 p-1.5 mt-1.5 text-[9px] text-amber-300">
                      <AlertTriangle size={9}/> Високі плечі = високий ризик ліквідації
                    </div>
                  )}
                </div>

                {/* Inputs */}
                <div className="space-y-2">
                  {otype==="Limit"&&(
                    <TInput label="Ціна (USDT)" value={limitPx} onChange={setLimitPx}
                      placeholder={price>0?price.toFixed(price<1?6:2):"0"}/>
                  )}
                  <TInput label="Маржа (USDT)" value={notional} onChange={setNotional} placeholder="1000"/>

                  {/* Position preview */}
                  {posSize>0&&(
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className="rounded-lg bg-white/5 px-2.5 py-1.5">
                        <div className="text-white/40 mb-0.5">Розмір позиції</div>
                        <div className="font-semibold text-white">{fQty(posSize)} {asset.sym}</div>
                      </div>
                      <div className="rounded-lg bg-white/5 px-2.5 py-1.5">
                        <div className="text-white/40 mb-0.5">Вартість позиції</div>
                        <div className="font-semibold text-white">{fUsd(posVal)}</div>
                      </div>
                    </div>
                  )}

                  {/* SL / TP з ATR пресетами */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40 font-medium">Stop Loss</span>
                      <div className="flex gap-1">
                        {[1,1.5,2].map(m=>(
                          <button key={m} type="button" onClick={()=>applyAtrSl(m)}
                            className="text-[8px] px-1.5 py-0.5 rounded bg-[#F40000]/10 text-[#F40000]/70 hover:text-[#F40000] transition-colors">
                            {m}ATR
                          </button>
                        ))}
                      </div>
                    </div>
                    <TInput label="" value={sl} onChange={setSl}
                      placeholder={sugSl>0?sugSl.toFixed(sugSl<1?6:2):"—"}/>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40 font-medium">Take Profit</span>
                      <div className="flex gap-1">
                        {[2,3,5].map(m=>(
                          <button key={m} type="button" onClick={()=>applyAtrTp(m)}
                            className="text-[8px] px-1.5 py-0.5 rounded bg-[#25DE28]/10 text-[#25DE28]/70 hover:text-[#25DE28] transition-colors">
                            {m}ATR
                          </button>
                        ))}
                      </div>
                    </div>
                    <TInput label="" value={tp} onChange={setTp}
                      placeholder={sugTp>0?sugTp.toFixed(sugTp<1?6:2):"—"}/>
                  </div>

                  {/* Risk / Reward + Liquidation */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {rrRatio>0&&(
                      <div className={`rounded-lg px-2.5 py-1.5 text-[10px] ${rrRatio>=2?"bg-[#25DE28]/10 border border-[#25DE28]/20":"bg-amber-500/10 border border-amber-500/20"}`}>
                        <div className="text-white/40 mb-0.5">Risk / Reward</div>
                        <div className={`font-bold ${rrRatio>=2?"text-[#25DE28]":"text-amber-400"}`}>1 : {rrRatio.toFixed(2)}</div>
                      </div>
                    )}
                    {liqPreview>0&&(
                      <div className="rounded-lg px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-[10px]">
                        <div className="text-white/40 mb-0.5">Ліквідація</div>
                        <div className="font-bold text-amber-400">{fUsd(liqPreview)}</div>
                      </div>
                    )}
                  </div>

                  {tradeErr&&(
                    <div className="flex gap-1.5 rounded-lg bg-red-500/10 p-2 text-[11px] text-red-300 border border-red-500/20">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5"/>{tradeErr}
                    </div>
                  )}

                  <button type="button" onClick={submitOrder}
                    className={`h-[40px] w-full rounded-xl text-[13px] font-bold tracking-wide transition-opacity hover:opacity-90 ${side==="LONG"?"bg-[#25DE28] text-black":"bg-[#F40000] text-white"}`}>
                    {side==="LONG"?"▲ Buy / LONG":"▼ Sell / SHORT"} {asset.sym}
                    {leverage>1&&<span className="ml-1 opacity-70 text-[11px]">{leverage}x</span>}
                  </button>
                  <button type="button" onClick={resetDemo} className="w-full text-center text-[9px] text-white/20 hover:text-white/50 transition-colors">
                    Скинути демо рахунок
                  </button>
                </div>
              </>
            )}

            {/* ══ DATA TAB ══ */}
            {rightTab==="Data"&&(
              <>
                {/* AI прогнози з ML-моделі */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[9px] font-semibold text-white/35 uppercase tracking-wider flex items-center gap-1">
                      <Bot size={9}/> AI Прогнози · {asset.sym}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(mlLoading||mlRefreshing)&&<Loader2 size={10} className="animate-spin text-[#8348C1]"/>}
                      <button
                        type="button"
                        disabled={mlRefreshing}
                        onClick={()=>{ void requestFreshPrediction("manual"); }}
                        title={mlRefreshing ? "Генерую прогноз..." : "Запросити свіжий прогноз"}
                        className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[8px] font-semibold text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <RefreshCw size={8} className={mlRefreshing?"animate-spin":""}/>
                        {mlRefreshing ? "Оновлення..." : "Оновити"}
                      </button>
                    </div>
                  </div>
                  {mlPreds.length===0&&!mlLoading&&signalUnlocked&&(
                    <div className="rounded-xl border border-white/5 bg-[#08080A] p-3 text-center text-[10px] text-white/25">
                      Немає прогнозів для {asset.sym}
                    </div>
                  )}

                  {/* Signal lock screen — explicit unlock required */}
                  {!signalUnlocked&&(()=>{
                    const limits = getPlanLimits(account?.planKey);
                    const max = limits.signalSymbolsPerMonth ?? 0;
                    const used = userId ? getViewedSignalSymbols(userId).size : 0;
                    const remaining = Math.max(0, max - used);
                    const canUnlock = remaining > 0;
                    return (
                      <div className="relative rounded-xl overflow-hidden">
                        {/* Blurred fake signal cards */}
                        <div className="blur-sm pointer-events-none select-none space-y-2" aria-hidden>
                          {(["4h","1d","1w","1M"] as const).map(tf2=>(
                            <div key={tf2} className="rounded-xl border border-[#25DE28]/20 bg-[#25DE28]/10 p-2.5">
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold bg-white/10 rounded px-1.5 py-0.5 text-white/60">{tf2}</span>
                                  <span className="text-[11px] font-bold text-[#25DE28]">LONG</span>
                                </div>
                                <span className="text-[8px] text-white/25">1год тому</span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px]">
                                <div className="flex justify-between"><span className="text-white/35">Впевненість</span><span className="font-semibold text-white">82.5%</span></div>
                                <div className="flex justify-between"><span className="text-white/35">Точність</span><span className="font-semibold text-white">76.3%</span></div>
                              </div>
                              <div className="mt-2 h-[3px] w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-[#25DE28]" style={{width:"82%"}}/>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Lock overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#08080A]/85 backdrop-blur-[2px] rounded-xl px-3 py-4 text-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#8348C1]/20 border border-[#8348C1]/40 flex items-center justify-center">
                            <Bot size={16} className="text-[#C38BFF]"/>
                          </div>
                          <div className="text-[11px] font-bold text-white/90">AI Сигнал · {asset.sym}</div>
                          {canUnlock ? (
                            <>
                              <div className="text-[9px] text-white/50 leading-relaxed">
                                Залишилось відкриттів: <span className="text-[#C38BFF] font-semibold">{remaining}</span> з <span className="text-[#C38BFF] font-semibold">{max}</span> цього місяця
                              </div>
                              <button
                                type="button"
                                onClick={handleUnlockSignal}
                                className="mt-1 rounded-lg bg-[#8348C1] hover:bg-[#9B59D6] px-4 py-1.5 text-[10px] font-semibold text-white transition-colors flex items-center gap-1.5"
                              >
                                🔓 Відкрити сигнал
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="text-[9px] text-white/50 leading-relaxed">
                                Ліміт вичерпано — <span className="text-[#C38BFF] font-semibold">{max}/{max}</span> символів відкрито цього місяця
                              </div>
                              <button
                                type="button"
                                onClick={()=>setUpgradeModal({ title:"Більше AI-сигналів", description:`Ваш план дозволяє відкривати AI-сигнали для ${max} символів на місяць. Оновіть план для необмеженого доступу.` })}
                                className="mt-1 rounded-lg bg-[#8348C1] hover:bg-[#9B59D6] px-3 py-1.5 text-[10px] font-semibold text-white transition-colors"
                              >
                                Оновити план
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {signalUnlocked&&(["4h","1d","1w","1M"] as const).map(tf2=>{
                    const p = mlPreds.find(x=>x.interval===tf2);
                    if(!p) return null;
                    const isLong  = p.signal?.includes("LONG");
                    const isShort = p.signal?.includes("SHORT");
                    const isNo    = !isLong&&!isShort;
                    const cleanSignal = p.signal?.replace("🟢","").replace("🔴","").replace("⚪","").trim()??"-";
                    const ageStr = mlAges[tf2] ?? "";

                    // Перевірка актуальності: ціна суттєво змінилась від моменту прогнозу
                    const predPrice   = p.price ?? 0;
                    const priceDiffPct = predPrice>0 ? Math.abs(price-predPrice)/predPrice*100 : 0;
                    const isStale     = priceDiffPct > 5; // ціна змінилась >5%

                    // Невалідний SL: для LONG SL має бути НИЖЧЕ ціни, для SHORT — ВИЩЕ
                    const slInvalid = !isNo && p.stop_loss!=null && price>0 && (
                      (isLong  && p.stop_loss >= price) ||
                      (isShort && p.stop_loss <= price)
                    );

                    const signalColor = isLong?"text-[#25DE28]":isShort?"text-[#F40000]":"text-white/40";
                    const signalBg    = isStale
                      ? "bg-amber-500/5 border-amber-500/20"
                      : isLong?"bg-[#25DE28]/10 border-[#25DE28]/20"
                      : isShort?"bg-[#F40000]/10 border-[#F40000]/20"
                      : "bg-white/5 border-white/10";

                    return (
                      <div key={tf2} className={`rounded-xl border p-2.5 ${signalBg}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold bg-white/10 rounded px-1.5 py-0.5 text-white/60">{tf2}</span>
                            <span className={`text-[11px] font-bold ${isStale?"text-amber-400":signalColor}`}>{cleanSignal}</span>
                            {isStale&&<span className="text-[8px] text-amber-400/70">⚠ застарів</span>}
                          </div>
                          <span className="text-[8px] text-white/25">{ageStr}</span>
                        </div>

                        {/* Попередження про застарілий прогноз */}
                        {isStale&&(
                          <div className="mb-1.5 flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-[8px] text-amber-300">
                            <AlertTriangle size={8} className="shrink-0"/>
                            Ціна змінилась на {priceDiffPct.toFixed(1)}% — запит на свіжий прогноз запускається автоматично
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px]">
                          {p.confidence!=null&&(
                            <div className="flex justify-between"><span className="text-white/35">Впевненість</span><span className="font-semibold text-white">{p.confidence.toFixed(1)}%</span></div>
                          )}
                          {p.accuracy!=null&&(
                            <div className="flex justify-between"><span className="text-white/35">Точність</span><span className="font-semibold text-white">{p.accuracy.toFixed(1)}%</span></div>
                          )}
                          {p.stop_loss!=null&&!isNo&&(
                            <div className="flex justify-between items-center gap-1">
                              <span className="text-white/35">SL</span>
                              <span className={`font-semibold flex items-center gap-0.5 ${slInvalid?"text-amber-400":"text-[#F40000]"}`}>
                                {slInvalid&&<AlertTriangle size={7}/>}
                                {fUsd(p.stop_loss)}
                              </span>
                            </div>
                          )}
                          {p.take_profit!=null&&!isNo&&(
                            <div className="flex justify-between"><span className="text-white/35">TP</span><span className="font-semibold text-[#25DE28]">{fUsd(p.take_profit)}</span></div>
                          )}
                        </div>

                        {/* Confidence bar */}
                        {p.confidence!=null&&!isNo&&(
                          <div className="mt-2 h-[3px] w-full bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${isStale?"bg-amber-400":isLong?"bg-[#25DE28]":"bg-[#F40000]"}`}
                              style={{width:`${clamp(p.confidence,0,100)}%`}}/>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-white/5"/>

                <div className="space-y-2">
                  <div className="text-[9px] font-semibold text-white/35 uppercase tracking-wider">Технічний сигнал</div>
                  <SCard icon={<Gauge size={12}/>} label="Pulse Signal" value={ind.bias}
                    detail={`${clamp(52+Math.abs(ind.score)*7,52,91).toFixed(0)}% впевненість`}
                    tone={ind.bias==="LONG"?"green":ind.bias==="SHORT"?"red":"yellow"}/>
                  <div className="grid grid-cols-2 gap-1.5">
                    <SCard icon={<Activity size={12}/>} label="RSI" value={ind.rsi.toFixed(1)}
                      detail={ind.rsi>70?"Перекупл.":ind.rsi<30?"Перепрод.":"Нейтрально"}
                      tone={ind.rsi>70?"red":ind.rsi<30?"green":"neutral"}/>
                    <SCard icon={<BarChart3 size={12}/>} label="MACD"
                      value={(ind.macdHist>=0?"+":"")+ind.macdHist.toFixed(3)}
                      detail="Гістограма" tone={ind.macdHist>=0?"green":"red"}/>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <IPill label="EMA 20"    value={fUsd(ind.ema20)}              active={price>=ind.ema20}/>
                    <IPill label="EMA 50"    value={fUsd(ind.ema50)}              active={price>=ind.ema50}/>
                    <IPill label="ATR %"     value={`${ind.atrPct.toFixed(2)}%`}  active={ind.atrPct>0.4}/>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <IPill label="BB %"      value={`${ind.bbPct.toFixed(1)}%`}   active={ind.bbPct>50}/>
                    <IPill label="Vol Spike" value={`${ind.volSpike.toFixed(2)}x`} active={ind.volSpike>1.5}/>
                  </div>

                  {/* Швидкі SL/TP кнопки на основі ціни */}
                  <div className="pt-1 border-t border-white/5">
                    <div className="text-[9px] font-semibold text-white/35 uppercase tracking-wider mb-1.5">Швидкі SL %</div>
                    <div className="flex gap-1 flex-wrap">
                      {[0.5,1,2,3,5].map(pct=>(
                        <button key={pct} type="button"
                          onClick={()=>{
                            setRightTab("Trade");
                            setSl((side==="LONG"?price*(1-pct/100):price*(1+pct/100)).toFixed(price<1?6:2));
                          }}
                          className="rounded px-2 py-0.5 bg-[#F40000]/10 text-[#F40000]/70 hover:text-[#F40000] text-[9px] font-semibold transition-colors">
                          -{pct}%
                        </button>
                      ))}
                    </div>
                    <div className="text-[9px] font-semibold text-white/35 uppercase tracking-wider mb-1.5 mt-2">Швидкі TP %</div>
                    <div className="flex gap-1 flex-wrap">
                      {[1,2,3,5,10].map(pct=>(
                        <button key={pct} type="button"
                          onClick={()=>{
                            setRightTab("Trade");
                            setTp((side==="LONG"?price*(1+pct/100):price*(1-pct/100)).toFixed(price<1?6:2));
                          }}
                          className="rounded px-2 py-0.5 bg-[#25DE28]/10 text-[#25DE28]/70 hover:text-[#25DE28] text-[9px] font-semibold transition-colors">
                          +{pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Support / Resistance */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/5">
                    <div className="rounded-lg border border-white/5 bg-[#08080A] p-2">
                      <div className="text-[9px] text-white/35 font-semibold mb-1 flex items-center gap-1"><Target size={9}/>Підтримка</div>
                      <div className="text-[11px] text-[#25DE28] font-medium">{fUsd(ind.support)}</div>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-[#08080A] p-2">
                      <div className="text-[9px] text-white/35 font-semibold mb-1 flex items-center gap-1"><Target size={9}/>Опір</div>
                      <div className="text-[11px] text-[#F40000] font-medium">{fUsd(ind.resistance)}</div>
                    </div>
                  </div>
                </div>

                {/* Order Book */}
                <div className="pt-2 border-t border-white/5">
                  <div className="text-[9px] font-semibold text-white/35 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Zap size={9}/>Order Book
                  </div>
                  {ob.asks.length===0&&ob.bids.length===0
                    ? <div className="text-[11px] text-white/25 text-center py-3">Завантаження...</div>
                    : <div className="space-y-2">
                        <OBSide title="Asks (Продаж)" rows={ob.asks} tone="red"/>
                        <div className="border-t border-white/5 pt-2">
                          <OBSide title="Bids (Купівля)" rows={ob.bids} tone="green"/>
                        </div>
                      </div>
                  }
                </div>
              </>
            )}

            {/* ══ ALERTS TAB ══ */}
            {rightTab==="Alerts"&&(
              <div className="space-y-3">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="text-[9px] font-semibold text-white/35 uppercase tracking-wider flex items-center gap-1">
                    <Bell size={9}/> Новий алерт · {asset.sym}
                  </div>
                  {price>0&&(
                    <span className="text-[9px] text-white/30 font-mono">{fUsd(price)}</span>
                  )}
                </div>

                {/* Condition categories + select */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] text-white/40 font-medium">Умова</label>

                  {/* Category pills */}
                  <div className="flex flex-wrap gap-1 mb-1">
                    {(["Ціна","24h","RSI","EMA","MACD","BB","Подія","Ризик"] as const).map(cat=>{
                      const catMap:{[k:string]:PriceAlertCondition[]}={
                        "Ціна":  ["price_gt","price_lt","price_gte","price_lte","price_eq"],
                        "24h":   ["pct_change_24h_gt","pct_change_24h_lt"],
                        "RSI":   ["rsi_gt","rsi_lt"],
                        "EMA":   ["ema20_cross_up","ema20_cross_down","ema50_cross_up","ema50_cross_down","golden_cross","death_cross"],
                        "MACD":  ["macd_cross_up","macd_cross_down"],
                        "BB":    ["bb_upper_break","bb_lower_break"],
                        "Подія": ["new_ath","volume_spike_gt","vol_24h_gt"],
                        "Ризик": ["trailing_stop_pct"],
                      };
                      const isActive=catMap[cat]?.includes(alertCond);
                      return (
                        <button key={cat} type="button"
                          onClick={()=>{ const first=catMap[cat]?.[0]; if(first){setAlertCond(first);setAlertMsg("");setAlertErr("");} }}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-semibold transition-all border ${isActive?"bg-[#8348C1]/20 text-[#C38BFF] border-[#8348C1]/40":"bg-white/[0.03] text-white/30 border-white/10 hover:text-white/60"}`}>
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative bg-[#08080A] border border-white/10 rounded-xl focus-within:border-[#8348C1]/60 transition-colors">
                    <select
                      value={alertCond}
                      onChange={e=>{setAlertCond(e.target.value as PriceAlertCondition);setAlertMsg("");setAlertErr("");}}
                      className="w-full bg-transparent text-[12px] text-white outline-none px-3 py-2.5 appearance-none rounded-xl"
                    >
                      <optgroup label="── Ціна">
                        <option value="price_gt"  className="bg-[#08080A]">↑ Ціна перетне вгору</option>
                        <option value="price_lt"  className="bg-[#08080A]">↓ Ціна впаде нижче</option>
                        <option value="price_gte" className="bg-[#08080A]">≥ Ціна вище або рівна</option>
                        <option value="price_lte" className="bg-[#08080A]">≤ Ціна нижче або рівна</option>
                        <option value="price_eq"  className="bg-[#08080A]">= Ціна точно дорівнює</option>
                      </optgroup>
                      <optgroup label="── 24h Зміна">
                        <option value="pct_change_24h_gt" className="bg-[#08080A]">📈 24h зростання &gt; X%</option>
                        <option value="pct_change_24h_lt" className="bg-[#08080A]">📉 24h падіння &gt; X%</option>
                      </optgroup>
                      <optgroup label="── RSI">
                        <option value="rsi_gt" className="bg-[#08080A]">RSI(14) перевищить X — перекупленість</option>
                        <option value="rsi_lt" className="bg-[#08080A]">RSI(14) впаде нижче X — перепроданість</option>
                      </optgroup>
                      <optgroup label="── EMA перетини">
                        <option value="ema20_cross_up"   className="bg-[#08080A]">EMA20 — ціна перетне вгору</option>
                        <option value="ema20_cross_down" className="bg-[#08080A]">EMA20 — ціна перетне вниз</option>
                        <option value="ema50_cross_up"   className="bg-[#08080A]">EMA50 — ціна перетне вгору</option>
                        <option value="ema50_cross_down" className="bg-[#08080A]">EMA50 — ціна перетне вниз</option>
                        <option value="golden_cross"     className="bg-[#08080A]">⭐ Золотий хрест MA50/MA200</option>
                        <option value="death_cross"      className="bg-[#08080A]">☠ Смертний хрест MA50/MA200</option>
                      </optgroup>
                      <optgroup label="── MACD">
                        <option value="macd_cross_up"   className="bg-[#08080A]">MACD перетинає сигнал ↑</option>
                        <option value="macd_cross_down" className="bg-[#08080A]">MACD перетинає сигнал ↓</option>
                      </optgroup>
                      <optgroup label="── Bollinger Bands">
                        <option value="bb_upper_break" className="bg-[#08080A]">Пробиття верхньої BB (2σ)</option>
                        <option value="bb_lower_break" className="bg-[#08080A]">Пробиття нижньої BB (2σ)</option>
                      </optgroup>
                      <optgroup label="── Обсяг та події">
                        <option value="volume_spike_gt" className="bg-[#08080A]">Сплеск обсягу × X</option>
                        <option value="vol_24h_gt"      className="bg-[#08080A]">Об'єм 24h &gt; X USD</option>
                        <option value="new_ath"         className="bg-[#08080A]">🏆 Новий ATH</option>
                      </optgroup>
                      <optgroup label="── Ризик">
                        <option value="trailing_stop_pct" className="bg-[#08080A]">Trailing stop X%</option>
                      </optgroup>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                      <ChevronDown size={11} className="text-white/30"/>
                    </div>
                  </div>

                  {/* Description + context */}
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 px-2 py-1.5 space-y-0.5">
                    <div className="text-[9px] text-white/50 leading-relaxed">{getAlertConditionDescription(alertCond)}</div>
                    {getAlertCondContext(alertCond)&&(
                      <div className="text-[9px] text-[#8348C1] font-semibold">{getAlertCondContext(alertCond)}</div>
                    )}
                  </div>
                </div>

                {/* Value input — hidden for no-value conditions */}
                {!NO_VALUE_CONDITIONS.has(alertCond)&&(
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[9px] text-white/40 font-medium">Значення</label>
                      {["price_gt","price_lt","price_gte","price_lte","price_eq"].includes(alertCond)&&price>0&&(
                        <button type="button"
                          onClick={()=>setAlertVal(price<1?price.toFixed(6):price.toFixed(2))}
                          className="text-[9px] text-[#8348C1] hover:text-[#C38BFF] transition-colors">
                          ↓ Поточна ціна
                        </button>
                      )}
                    </div>
                    <label className="flex bg-[#08080A] border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#8348C1]/60 transition-colors cursor-text gap-2 items-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        min="0"
                        value={alertVal}
                        onChange={e=>{setAlertVal(sanitizeAlertValue(e.target.value));setAlertMsg("");setAlertErr("");}}
                        className="flex-1 bg-transparent text-[12px] text-white font-medium outline-none placeholder:text-white/20 min-w-0"
                        placeholder="0"
                      />
                      <span className="text-[10px] text-white/40 shrink-0">
                        {getAlertConditionUnit(alertCond)||"RSI"}
                      </span>
                    </label>
                  </div>
                )}

                {/* No-value badge */}
                {NO_VALUE_CONDITIONS.has(alertCond)&&(
                  <div className="flex items-center gap-1.5 rounded-lg bg-[#8348C1]/10 border border-[#8348C1]/20 px-2.5 py-2">
                    <Bell size={10} className="text-[#C38BFF] shrink-0"/>
                    <span className="text-[10px] text-[#C38BFF]">Подія — значення не потрібне</span>
                  </div>
                )}

                {/* Trigger limit selector */}
                <div className="space-y-1">
                  <label className="block text-[9px] text-white/40 font-medium">Кількість спрацювань</label>
                  <div className="grid grid-cols-4 gap-1">
                    {([
                      { label: "∞", value: null,  hint: "Кожного разу" },
                      { label: "1×", value: 1,    hint: "Один раз" },
                      { label: "2×", value: 2,    hint: "Двічі" },
                      { label: "5×", value: 5,    hint: "П'ять разів" },
                    ] as { label: string; value: number | null; hint: string }[]).map(opt => (
                      <button
                        key={String(opt.value)}
                        type="button"
                        title={opt.hint}
                        onClick={() => setAlertMaxTriggers(opt.value)}
                        className={`h-[28px] rounded-lg text-[11px] font-bold border transition-colors ${
                          alertMaxTriggers === opt.value
                            ? "bg-[#8348C1] border-[#8348C1] text-white"
                            : "bg-transparent border-white/10 text-white/50 hover:border-[#8348C1]/50 hover:text-white/80"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {alertMaxTriggers !== null && (
                    <div className="text-[9px] text-white/30">
                      Алерт деактивується після {alertMaxTriggers === 1 ? "першого" : alertMaxTriggers === 2 ? "другого" : `${alertMaxTriggers}-го`} спрацювання
                    </div>
                  )}
                </div>

                {/* Feedback */}
                {(alertErr||alertMsg)&&(
                  <div className={`rounded-lg px-2.5 py-1.5 text-[10px] ${alertErr?"bg-red-500/10 border border-red-500/20 text-red-300":"bg-[#25DE28]/10 border border-[#25DE28]/20 text-[#25DE28]"}`}>
                    {alertErr||alertMsg}
                  </div>
                )}

                {/* Create button */}
                {!userId?(
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-[10px] text-amber-300 flex items-center gap-1">
                    <AlertTriangle size={10}/> Увійдіть в акаунт для створення алертів
                  </div>
                ):(
                  <button type="button" onClick={handleCreateAlert} disabled={alertLoading}
                    className="h-[36px] w-full rounded-xl text-[12px] font-bold bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-1.5">
                    {alertLoading?<Loader2 size={12} className="animate-spin"/>:<Bell size={12}/>}
                    {alertLoading?"Створення...":"Створити алерт"}
                  </button>
                )}

                {/* Divider */}
                <div className="border-t border-white/5 pt-1"/>

                {/* All user alerts */}
                <div className="text-[9px] font-semibold text-white/35 uppercase tracking-wider flex items-center justify-between">
                  <span>Всі алерти</span>
                  {alertsLoading&&<Loader2 size={9} className="animate-spin text-[#8348C1]"/>}
                </div>

                {!userId?(
                  <div className="text-[10px] text-white/25 text-center py-2">Увійдіть, щоб бачити алерти</div>
                ):allAlerts.length===0&&!alertsLoading?(
                  <div className="text-[10px] text-white/25 text-center py-2">Немає алертів</div>
                ):(
                  <div className="space-y-1.5">
                    {allAlerts.map(al=>{
                      const isPrice = ALERT_CONDS_PRICE.has(al.condition);
                      const isUp = al.condition.includes("_up")||al.condition.includes("_gt")||al.condition==="golden_cross"||al.condition==="new_ath"||al.condition==="bb_upper_break";
                      const isActive = al.is_active !== false;
                      const dotColor = !isActive?"bg-white/20":isUp?"bg-[#25DE28]":"bg-[#F40000]";
                      const unit = getAlertConditionUnit(al.condition);
                      const isEditing = editingAlertId === al.id;
                      const cardCls = isEditing
                        ? "border-[#8348C1]/50 bg-[#8348C1]/10"
                        : !isActive ? "border-white/5 bg-white/[0.02]"
                        : "border-[#8348C1]/20 bg-[#8348C1]/5";
                      return (
                        <div key={al.id} className={`rounded-xl border transition-colors ${cardCls}`}>
                          {isEditing ? (
                            /* ── Inline edit form ── */
                            <div className="px-2.5 py-2.5 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-semibold text-[#C38BFF] uppercase tracking-wide">Редагувати алерт</span>
                                <button type="button" onClick={()=>setEditingAlertId(null)} className="text-white/30 hover:text-white/70 transition-colors">
                                  <X size={11}/>
                                </button>
                              </div>
                              {/* Condition select */}
                              <div className="relative">
                                <select
                                  value={editAlertCond}
                                  onChange={e=>setEditAlertCond(e.target.value as PriceAlertCondition)}
                                  className="w-full appearance-none bg-[#08080A] border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white/80 outline-none focus:border-[#8348C1]/60 pr-6"
                                >
                                  <option value="price_gt">Вище</option>
                                  <option value="price_gte">Вище або =</option>
                                  <option value="price_lt">Нижче</option>
                                  <option value="price_lte">Нижче або =</option>
                                  <option value="price_eq">Дорівнює</option>
                                  <option value="pct_change_24h_gt">24h зростання %</option>
                                  <option value="pct_change_24h_lt">24h падіння %</option>
                                  <option value="rsi_gt">RSI більше</option>
                                  <option value="rsi_lt">RSI менше</option>
                                  <option value="ema20_cross_up">EMA20 ↑</option>
                                  <option value="ema20_cross_down">EMA20 ↓</option>
                                  <option value="ema50_cross_up">EMA50 ↑</option>
                                  <option value="ema50_cross_down">EMA50 ↓</option>
                                  <option value="volume_spike_gt">Сплеск об'єму ×</option>
                                  <option value="trailing_stop_pct">Trailing stop %</option>
                                  <option value="golden_cross">Золотий хрест</option>
                                  <option value="death_cross">Смертний хрест</option>
                                  <option value="bb_upper_break">BB верх ↑</option>
                                  <option value="bb_lower_break">BB низ ↓</option>
                                  <option value="new_ath">Новий ATH</option>
                                  <option value="vol_24h_gt">Об'єм 24h</option>
                                  <option value="macd_cross_up">MACD ↑</option>
                                  <option value="macd_cross_down">MACD ↓</option>
                                </select>
                                <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/30"/>
                              </div>
                              {/* Value input (hidden for no-value conditions) */}
                              {!NO_VALUE_CONDITIONS.has(editAlertCond) && (
                                <label className="flex bg-[#08080A] border border-white/10 rounded-lg px-2.5 py-1.5 focus-within:border-[#8348C1]/60 transition-colors cursor-text gap-2 items-center">
                                  <input
                                    type="number" inputMode="decimal"
                                    value={editAlertVal}
                                    onChange={e=>setEditAlertVal(sanitizeAlertValue(e.target.value))}
                                    className="flex-1 bg-transparent text-[11px] text-white font-medium outline-none placeholder:text-white/20 min-w-0"
                                    placeholder="0"
                                  />
                                  <span className="text-[9px] text-white/40 shrink-0">{getAlertConditionUnit(editAlertCond)||"RSI"}</span>
                                </label>
                              )}
                              {/* Trigger limit selector */}
                              <div className="space-y-1">
                                <label className="block text-[9px] text-white/35">Спрацювань</label>
                                <div className="grid grid-cols-4 gap-1">
                                  {([
                                    { label:"∞", value:null },
                                    { label:"1×", value:1 },
                                    { label:"2×", value:2 },
                                    { label:"5×", value:5 },
                                  ] as {label:string;value:number|null}[]).map(opt=>(
                                    <button key={String(opt.value)} type="button"
                                      onClick={()=>setEditAlertMaxTriggers(opt.value)}
                                      className={`h-[24px] rounded-lg text-[10px] font-bold border transition-colors ${
                                        editAlertMaxTriggers===opt.value
                                          ?"bg-[#8348C1] border-[#8348C1] text-white"
                                          :"bg-transparent border-white/10 text-white/45 hover:border-[#8348C1]/50 hover:text-white/80"
                                      }`}>
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {/* Save / Cancel */}
                              <div className="flex gap-1.5">
                                <button type="button" onClick={()=>setEditingAlertId(null)}
                                  className="flex-1 h-[28px] rounded-lg text-[10px] border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors">
                                  Скасувати
                                </button>
                                <button type="button" onClick={()=>void handleSaveAlertEdit()} disabled={editAlertLoading}
                                  className="flex-1 h-[28px] rounded-lg text-[10px] font-bold bg-[#8348C1] text-white hover:bg-[#9B5FD4] disabled:opacity-60 transition-colors flex items-center justify-center gap-1">
                                  {editAlertLoading?<Loader2 size={9} className="animate-spin"/>:<Check size={9}/>}
                                  Зберегти
                                </button>
                              </div>
                            </div>
                          ) : (
                          /* ── Normal row ── */
                          <div className="px-2.5 py-2 flex items-center justify-between gap-2"
                            onClick={() => {
                              if (al.symbol.toUpperCase() === asset.sym) {
                                openAlertEdit(al);
                              } else {
                                navigate(`/trading/${al.symbol.toUpperCase()}`);
                              }
                            }}
                            style={{cursor:"pointer"}}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] font-semibold text-white truncate">
                                <span className={`text-[8px] rounded px-1 py-0.5 mr-1 font-bold ${al.symbol.toUpperCase() === asset.sym ? "bg-[#8348C1]/20 text-[#C38BFF]" : "bg-white/5 text-white/40"}`}>
                                  {al.symbol.toUpperCase()}
                                </span>
                                {getAlertConditionShortLabel(al.condition)}
                                {al.target_price>0&&isPrice&&<span className="ml-1 font-mono text-white/60">{fUsd(al.target_price)}</span>}
                                {al.target_price>0&&!isPrice&&<span className="ml-1 font-mono text-white/60">{al.target_price}{unit?" "+unit:""}</span>}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`}/>
                                <span className={`text-[9px] ${!isActive?"text-white/25":"text-[#25DE28]/70"}`}>
                                  {!isActive?"Призупинено":"Активний"}
                                </span>
                                {/* Trigger counter badge */}
                                {al.max_triggers != null ? (
                                  <span className="text-[8px] font-mono text-white/30 bg-white/5 rounded px-1">
                                    {al.trigger_count ?? 0}/{al.max_triggers}×
                                  </span>
                                ) : (al.trigger_count ?? 0) > 0 ? (
                                  <span className="text-[8px] font-mono text-white/20 bg-white/5 rounded px-1">
                                    {al.trigger_count}×
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              {/* Edit button */}
                              <button type="button"
                                onClick={e=>{e.stopPropagation();openAlertEdit(al);}}
                                title="Редагувати"
                                className="flex h-6 w-6 items-center justify-center rounded-lg text-white/25 hover:bg-[#8348C1]/20 hover:text-[#C38BFF] transition-colors">
                                <Pencil size={10}/>
                              </button>
                              {/* Toggle active/paused */}
                              <button type="button"
                                disabled={togglingId===al.id}
                                onClick={e=>{e.stopPropagation();void handleToggleAlert(al.id, al.is_active);}}
                                title={isActive?"Призупинити":"Активувати"}
                                className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${isActive?"text-[#25DE28]/60 hover:bg-[#25DE28]/10 hover:text-[#25DE28]":"text-white/25 hover:bg-white/10 hover:text-white"}`}>
                                {togglingId===al.id?<Loader2 size={10} className="animate-spin"/>:isActive?<Bell size={10}/>:<BellOff size={10}/>}
                              </button>
                              {/* Delete */}
                              <button type="button"
                                disabled={deletingId===al.id}
                                onClick={e=>{e.stopPropagation();void handleDeleteAlert(al.id);}}
                                title="Видалити"
                                className="flex h-6 w-6 items-center justify-center rounded-lg text-white/25 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-40">
                                {deletingId===al.id?<Loader2 size={10} className="animate-spin"/>:<Trash2 size={10}/>}
                              </button>
                            </div>
                          </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Telegram status / connect banner */}
                {tgConnected === false && (
                  <button type="button" onClick={openTelegramBot}
                    className="w-full flex items-center gap-2 rounded-xl border border-[#8348C1]/25 bg-[#8348C1]/5 px-2.5 py-2 hover:bg-[#8348C1]/10 transition-colors text-left">
                    <span className="text-[14px] shrink-0">📱</span>
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-[#C38BFF]">Підключити Telegram</div>
                      <div className="text-[8px] text-white/35 truncate">Отримуй алерти прямо в боті</div>
                    </div>
                    <span className="ml-auto text-[9px] text-[#8348C1] shrink-0">→</span>
                  </button>
                )}
                {tgConnected === true && (
                  <a href={BOT_URL} target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center gap-2 rounded-xl border border-[#25DE28]/20 bg-[#25DE28]/5 px-2.5 py-2 hover:bg-[#25DE28]/10 transition-colors">
                    <span className="text-[14px] shrink-0">✅</span>
                    <div className="text-[10px] font-semibold text-[#25DE28]">Telegram підключено</div>
                    <span className="ml-auto text-[9px] text-white/25 shrink-0">Відкрити →</span>
                  </a>
                )}

                {/* Link to all alerts */}
                <button type="button"
                  onClick={()=>navigate("/alerts")}
                  className="w-full text-center text-[9px] text-[#8348C1] hover:text-[#C38BFF] transition-colors pt-1">
                  Всі алерти →
                </button>

              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Position edit modal */}
      <PosEditModal
        pos={editingPos}
        currentPrice={editingPos ? (editingPos.sym === asset.sym ? effectivePrice : posPrice(editingPos.sym)) : 0}
        onClose={() => setEditingPos(null)}
        onSave={handleUpdateSlTp}
        onClosePos={pos => closePosition(pos, pos.sym === asset.sym ? effectivePrice : (posPrice(pos.sym) || pos.avgPrice))}
      />

      {/* Session summary modal (Replay Practice) */}
      {showSummary && replaySnapshot && (
        <SessionSummaryModal
          demo={replayDemo}
          snapshot={replaySnapshot}
          planKey={account?.planKey ?? "free"}
          onContinue={() => setShowSummary(false)}
          onNewSession={() => {
            setShowSummary(false);
            setReplayCandles([]);
            setReplayIndex(0);
            setReplayPlaying(false);
            prevReplayPriceRef.current = 0;
          }}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* Alert toasts */}
      <ToastNotifications items={toasts} onDismiss={dismissToast}/>

      {/* Plan upgrade modal */}
      <UpgradeModal
        isOpen={upgradeModal !== null}
        onClose={() => setUpgradeModal(null)}
        title={upgradeModal?.title ?? ""}
        description={upgradeModal?.description ?? ""}
        currentPlanKey={account?.planKey ?? "free"}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// UTILITY COMPONENTS
// ─────────────────────────────────────────────
function Empty({text}:{text:string}) {
  return <div className="flex items-center justify-center h-full text-[11px] text-white/25 py-6">{text}</div>;
}

function SCard({icon,label,value,detail,tone="neutral"}:{icon:ReactNode;label:string;value:string;detail:string;tone?:"green"|"red"|"yellow"|"neutral"}) {
  const cls=tone==="green"?"text-[#25DE28]":tone==="red"?"text-[#F40000]":tone==="yellow"?"text-[#fbbf24]":"text-white";
  return (
    <div className="rounded-xl border border-white/5 bg-[#08080A] p-2.5">
      <div className="mb-1 flex items-center gap-1 text-[9px] text-white/35 font-semibold uppercase tracking-wider">{icon}{label}</div>
      <div className={`text-[12px] font-bold ${cls}`}>{value}</div>
      <div className="mt-0.5 text-[9px] text-white/25">{detail}</div>
    </div>
  );
}

function IPill({label,value,active}:{label:string;value:string;active:boolean}) {
  return (
    <div className="rounded-lg border border-white/5 bg-[#08080A] p-2 flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-[8px] text-white/35 font-semibold">{label}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${active?"bg-[#25DE28]":"bg-[#fbbf24]"}`}/>
      </div>
      <div className="text-[10px] font-medium text-white truncate" title={value}>{value}</div>
    </div>
  );
}

function OBSide({title,rows,tone}:{title:string;rows:OBRow[];tone:"green"|"red"}) {
  const max=Math.max(...rows.map(r=>r.total),1);
  return (
    <div>
      <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-white/25">{title}</div>
      <div className="space-y-[1px]">
        {rows.slice(0,8).map(r=>(
          <div key={`${title}-${r.price}`} className="relative overflow-hidden px-1.5 py-[3px] rounded-sm">
            <div className={`absolute inset-y-0 right-0 ${tone==="green"?"bg-[#25DE28]/8":"bg-[#F40000]/8"}`} style={{width:`${clamp((r.total/max)*100,2,100)}%`}}/>
            <div className="relative flex justify-between gap-2 text-[10px] font-medium">
              <span className={tone==="green"?"text-[#25DE28]":"text-[#F40000]"}>{fUsd(r.price)}</span>
              <span className="text-white/50">{fQty(r.qty)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TInput({label,value,onChange,placeholder}:{label:string;value:string;onChange:(v:string)=>void;placeholder:string}) {
  return (
    <label className={`block bg-[#08080A] border border-white/10 rounded-xl px-3 focus-within:border-[#8348C1]/60 transition-colors cursor-text ${label?"py-1.5":"py-2"}`}>
      {label&&<span className="block text-[9px] text-white/40 font-medium mb-0.5">{label}</span>}
      <input type="number" inputMode="decimal" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-transparent text-[12px] text-white font-medium outline-none placeholder:text-white/20"/>
    </label>
  );
}
