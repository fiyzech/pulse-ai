import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createChart, ColorType, CrosshairMode, CandlestickSeries, AreaSeries, LineStyle } from "lightweight-charts";
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
  ChevronDown,
  ChevronUp,
  Edit2,
  Gauge,
  Loader2,
  Minus,
  MousePointer2,
  PanelBottom,
  PanelRight,
  Plus,
  RefreshCw,
  Search,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import {
  createPriceAlert,
  getAlertConditionDescription,
  getAlertConditionShortLabel,
  getAlertConditionUnit,
  listUserPriceAlerts,
  NO_VALUE_CONDITIONS,
  removePriceAlert,
  togglePriceAlert,
  updateAlertTargetPrice,
} from "../../utils/priceAlerts";
import type { PriceAlertCondition, PriceAlertRecord } from "../../utils/priceAlerts";
import { useAccount } from "../../context/accountContextValue";
import { supabase } from "../../supabaseClient";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const AI_ASSISTANT_URL  = "https://cryptomisha-ai-agent-c2fa3q367soa93m2cjyfrw.streamlit.app/";
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

type TvApi  = { remove?:()=>void };
type TvCtor = new(o:Record<string,unknown>)=>TvApi;
declare global { interface Window { TradingView?:{ widget:TvCtor } } }

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
const now     = () => new Date().toLocaleString("uk-UA",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});

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

    // 2. Синхронізуємо позиції: видаляємо старі → вставляємо актуальні
    await supabase.from(DB_POSITIONS).delete().eq("user_id",userId);
    if(acc.positions.length>0){
      await supabase.from(DB_POSITIONS).insert(acc.positions.map(p=>({
        id:p.id, user_id:userId, sym:p.sym, name:p.name, img:p.img,
        side:p.side, qty:p.qty, avg_price:p.avgPrice, margin:p.margin,
        leverage:p.leverage, liq_price:p.liqPrice,
        sl:p.sl??null, tp:p.tp??null, opened_at:p.openedAt,
      })));
    }

    // 3. Синхронізуємо ордери
    await supabase.from(DB_ORDERS).delete().eq("user_id",userId);
    if(acc.orders.length>0){
      await supabase.from(DB_ORDERS).insert(acc.orders.map(o=>({
        id:o.id, user_id:userId, sym:o.sym, name:o.name, img:o.img,
        side:o.side, order_type:o.type, notional:o.notional, leverage:o.leverage,
        limit_price:o.limitPrice??null, sl:o.sl??null, tp:o.tp??null,
        created_at:o.createdAt,
      })));
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
const TF_OPTIONS = ["1m","5m","15m","1h","4h","1d","1w"] as const;
type ChartTf = (typeof TF_OPTIONS)[number];
const TF_BINANCE: Record<ChartTf,string> = {"1m":"1m","5m":"5m","15m":"15m","1h":"1h","4h":"4h","1d":"1d","1w":"1w"};
const TF_LABELS:  Record<ChartTf,string> = {"1m":"1хв","5m":"5хв","15m":"15хв","1h":"1год","4h":"4год","1d":"1д","1w":"1тиж"};

type DrawMode = "cursor" | "hline";
const ALERT_CONDS_PRICE = new Set(["price_gt","price_gte","price_lt","price_lte","price_eq"]);
type PosLines = { entry?: IPriceLine; liq?: IPriceLine; sl?: IPriceLine; tp?: IPriceLine };

function TradingLWChart({
  pair, alerts, positions,
  onUpdatePositionSlTp, onUpdateAlertPrice, onAlertTriggered,
}: {
  pair: string;
  alerts: PriceAlertRecord[];
  positions: DemoPos[];
  onUpdatePositionSlTp: (posId: string, sl?: number, tp?: number) => void;
  onUpdateAlertPrice: (alertId: string, price: number) => void;
  onAlertTriggered: (alert: PriceAlertRecord, price: number) => void;
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

  const [tf, setTf]           = useState<ChartTf>("4h");
  const [ctype, setCtype]     = useState<"candle"|"area">("candle");
  const [drawMode, setDrawMode] = useState<DrawMode>("cursor");
  const [loading, setLoading] = useState(true);

  useEffect(() => { alertsRef.current = alerts; }, [alerts]);
  useEffect(() => { positionsRef.current = positions; }, [positions]);
  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);
  useEffect(() => { ctypeRef.current = ctype; }, [ctype]);
  useEffect(() => { onUpdateSlTpRef.current = onUpdatePositionSlTp; }, [onUpdatePositionSlTp]);
  useEffect(() => { onUpdateAlertPriceRef.current = onUpdateAlertPrice; }, [onUpdateAlertPrice]);
  useEffect(() => { onAlertTriggeredRef.current = onAlertTriggered; }, [onAlertTriggered]);

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
      const price = chart.priceScale("right").coordinateToPrice(param.point.y);
      if (!price || price <= 0) return;
      const label = price < 1 ? price.toFixed(6) : price.toLocaleString("en-US",{maximumFractionDigits:2});
      try {
        const line = seriesRef.current.createPriceLine({
          price, color: "#94A3B8", lineWidth: 1, lineStyle: LineStyle.Solid,
          axisLabelVisible: true, title: label,
        });
        userLinesRef.current.push(line);
        userPricesRef.current.push(price);
      } catch {}
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
        if (line) try { seriesRef.current!.removePriceLine(line); } catch {}
      }
    });
    posLinesMapRef.current.clear();

    // Remove old alert lines
    alertLinesMapRef.current.forEach(line => {
      try { seriesRef.current!.removePriceLine(line); } catch {}
    });
    alertLinesMapRef.current.clear();

    // Draw position lines
    positionsRef.current.forEach(pos => {
      if (!seriesRef.current) return;
      const isLong = pos.side === "LONG";
      const pl: PosLines = {};
      try {
        pl.entry = seriesRef.current.createPriceLine({
          price: pos.avgPrice, color: isLong ? "#26a69a" : "#ef5350",
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
            price: pos.sl, color: "#ef5350",
            lineWidth: 1, lineStyle: LineStyle.SparseDotted,
            axisLabelVisible: true, title: "SL",
          });
        }
        if (pos.tp && pos.tp > 0) {
          pl.tp = seriesRef.current.createPriceLine({
            price: pos.tp, color: "#26a69a",
            lineWidth: 1, lineStyle: LineStyle.SparseDotted,
            axisLabelVisible: true, title: "TP",
          });
        }
        posLinesMapRef.current.set(pos.id, pl);
      } catch {}
    });

    // Draw alert lines (price-based only, dashed)
    alertsRef.current
      .filter(a => a.is_active !== false && ALERT_CONDS_PRICE.has(a.condition))
      .forEach(al => {
        if (!seriesRef.current) return;
        const isUp = al.condition === "price_gt" || al.condition === "price_gte";
        const isEq = al.condition === "price_eq";
        const color = isUp ? "#26a69a" : isEq ? "#C38BFF" : "#ef5350";
        try {
          const line = seriesRef.current.createPriceLine({
            price: al.target_price, color, lineWidth: 1, lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: isUp ? "▲" : isEq ? "●" : "▼",
          });
          alertLinesMapRef.current.set(al.id, line);
        } catch {}
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
      } catch {}
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
      const chart = chartRef.current;
      let currentDragPrice = foundInitPrice;
      let isDragging = false;

      const onMoveDoc = (ev: MouseEvent) => {
        isDragging = true;
        const r = container.getBoundingClientRect();
        const price = chart.priceScale("right").coordinateToPrice(ev.clientY - r.top);
        if (price && price > 0) {
          currentDragPrice = price;
          try { dragLine.applyOptions({ price }); } catch {}
        }
      };
      const onUpDoc = () => {
        document.removeEventListener("mousemove", onMoveDoc);
        document.removeEventListener("mouseup", onUpDoc);
        container.style.cursor = "default";
        if (!isDragging) return;
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

  // ── Fetch candles + rebuild series ──
  useEffect(() => {
    if (!chartRef.current) return;
    let dead = false;
    setLoading(true);
    currentKRef.current = null;
    prevPriceRef.current = 0;

    const load = async () => {
      try {
        const res = await fetch(`/api/binance/klines?symbol=${pair}&interval=${TF_BINANCE[tf]}&limit=500`);
        if (!res.ok || dead || !chartRef.current) return;
        const raw = await res.json() as (string|number)[][];

        if (seriesRef.current) { try { chartRef.current.removeSeries(seriesRef.current); } catch {} seriesRef.current = null; }

        if (ctype === "candle") {
          const s = chartRef.current.addSeries(CandlestickSeries, {
            upColor:"#26a69a", downColor:"#ef5350", borderVisible:false,
            wickUpColor:"#26a69a", wickDownColor:"#ef5350",
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

        refreshLines();
        refreshUserLines();
      } catch {} finally {
        if (!dead) setLoading(false);
      }
    };
    load();
    return () => { dead = true; };
  }, [pair, tf, ctype, refreshLines, refreshUserLines]);

  // ── Kline WebSocket — keeps OHLC in sync ──
  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${pair.toLowerCase()}@kline_${TF_BINANCE[tf]}`);
    ws.onmessage = (e: MessageEvent) => {
      const { k } = JSON.parse(e.data as string);
      const t = Math.floor(k.t/1000);
      currentKRef.current = { o:+k.o, h:+k.h, l:+k.l, c:+k.c, t };
    };
    return () => { ws.onmessage = null; if (ws.readyState < 2) ws.close(); };
  }, [pair, tf]);

  // ── aggTrade WebSocket — tick-by-tick realtime + alert crossing check ──
  useEffect(() => {
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
  }, [pair]);

  // ── Clear all user-drawn lines ──
  const clearUserLines = useCallback(() => {
    userLinesRef.current.forEach(l => { try { seriesRef.current?.removePriceLine(l); } catch {} });
    userLinesRef.current = [];
    userPricesRef.current = [];
  }, []);

  const drawTools: { id: DrawMode; icon: React.ReactNode; label: string }[] = [
    { id: "cursor", icon: <MousePointer2 size={14}/>, label: "Курсор" },
    { id: "hline",  icon: <Minus size={14}/>,         label: "Горизонтальна лінія" },
  ];

  return (
    <div className="h-full w-full flex flex-col bg-[#08080A]">
      {/* ── Top bar: TF + chart type ── */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-white/5 shrink-0 bg-[#050506]">
        {TF_OPTIONS.map(t => (
          <button key={t} type="button" onClick={() => setTf(t)}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${tf===t?"bg-[#8348C1]/20 text-[#C38BFF]":"text-white/35 hover:text-white"}`}>
            {TF_LABELS[t]}
          </button>
        ))}
        <div className="ml-auto flex gap-1 items-center">
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
            <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${isLong?"bg-[#26a69a]/20 text-[#26a69a]":"bg-[#ef5350]/20 text-[#ef5350]"}`}>
              {pos.side}
            </span>
            <span className="text-[13px] font-bold">{pos.sym}/USDT</span>
            <span className="text-[10px] text-white/40">{pos.leverage}x</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X size={15}/></button>
        </div>

        {/* PnL summary */}
        <div className={`rounded-xl px-3 py-2.5 mb-3 border text-center ${pnl>=0?"bg-[#26a69a]/10 border-[#26a69a]/20":"bg-[#ef5350]/10 border-[#ef5350]/20"}`}>
          <div className={`text-[15px] font-bold ${pnl>=0?"text-[#26a69a]":"text-[#ef5350]"}`}>
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
                    className="text-[8px] px-1.5 py-0.5 rounded bg-[#ef5350]/10 text-[#ef5350]/70 hover:text-[#ef5350] transition-colors">
                    -{p}%
                  </button>
                ))}
              </div>
            )}
          </div>
          <input value={sl} onChange={e => setSl(e.target.value)}
            className="w-full bg-[#050506] border border-[#ef5350]/20 rounded-xl px-3 py-2 text-[12px] text-white outline-none focus:border-[#ef5350]/50 transition-colors"
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
                    className="text-[8px] px-1.5 py-0.5 rounded bg-[#26a69a]/10 text-[#26a69a]/70 hover:text-[#26a69a] transition-colors">
                    +{p}%
                  </button>
                ))}
              </div>
            )}
          </div>
          <input value={tp} onChange={e => setTp(e.target.value)}
            className="w-full bg-[#050506] border border-[#26a69a]/20 rounded-xl px-3 py-2 text-[12px] text-white outline-none focus:border-[#26a69a]/50 transition-colors"
            placeholder={isLong ? `> ${fUsd(pos.avgPrice)}` : `< ${fUsd(pos.avgPrice)}`}/>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button type="button" onClick={handleSave}
            className="flex-1 py-2 rounded-xl bg-[#8348C1]/20 text-[#C38BFF] text-[12px] font-semibold hover:bg-[#8348C1]/30 transition-colors">
            Зберегти SL / TP
          </button>
          <button type="button" onClick={() => { onClosePos(pos); onClose(); }}
            className="flex-1 py-2 rounded-xl bg-[#ef5350]/10 text-[#ef5350] text-[12px] font-semibold hover:bg-[#ef5350]/20 transition-colors">
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
// TRADINGVIEW WIDGET (kept as fallback, unused)
// ─────────────────────────────────────────────
function TvWidget({pair, interval}:{pair:string; interval:string}) {
  const id = useMemo(()=>`tv_${pair}_${interval}`.replace(/[^a-zA-Z0-9_]/g,"_"),[pair,interval]);

  useEffect(()=>{
    let w:TvApi|null=null, dead=false;
    const create=()=>{
      if(dead||!window.TradingView)return;
      const el=document.getElementById(id); if(!el)return;
      el.innerHTML="";
      w=new window.TradingView.widget({
        autosize:true, symbol:`BINANCE:${pair}`, interval,
        timezone:"Europe/Kyiv", theme:"dark", style:"1", locale:"uk",
        toolbar_bg:"#050506", backgroundColor:"#050506",
        gridColor:"rgba(255,255,255,0.04)",
        hide_side_toolbar:false, allow_symbol_change:false, save_image:false,
        // НЕ додаємо studies — чистий графік за замовчуванням
        container_id:id,
      });
    };
    if(window.TradingView){ create(); }
    else {
      const ex=document.querySelector<HTMLScriptElement>('script[src="https://s3.tradingview.com/tv.js"]');
      const sc=ex??Object.assign(document.createElement("script"),{src:"https://s3.tradingview.com/tv.js",async:true});
      sc.onload=create; if(!ex)document.body.appendChild(sc);
    }
    return ()=>{
      dead=true;
      try{w?.remove?.();}catch{ /* TradingView cleanup bug — ignore */ }
      const el=document.getElementById(id); if(el)el.innerHTML="";
    };
  },[id,interval,pair]);

  return <div id={id} className="h-full w-full"/>;
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function TradingPage() {
  const navigate = useNavigate();
  const {symbol} = useParams<{symbol:string}>();
  const {account} = useAccount();
  const routeSym = (symbol??DEFAULT_SYMBOL).toUpperCase();

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

  const ind = useMemo(()=>calcInd(candles.length?candles:[{time:0,open:price,high:price,low:price,close:price,volume:1}]),[candles,price]);

  const filtCoins = useMemo(()=>{
    const q=coinQ.trim().toLowerCase();
    return q ? markets.filter(a=>`${a.sym} ${a.name}`.toLowerCase().includes(q)).slice(0,50) : markets.slice(0,80);
  },[coinQ,markets]);

  // Актуальна ціна для будь-якої позиції: поточний asset → живий price, решта → livePrices
  const posPrice  = useCallback((sym:string)=> sym===asset.sym ? price : (livePrices[sym] || 0), [asset.sym, price, livePrices]);
  const totalPnl  = demo.positions.reduce((s,p)=>s+getPnl(p,posPrice(p.sym)||p.avgPrice),0);
  const equity    = demo.cash+demo.positions.reduce((s,p)=>s+p.margin+getPnl(p,posPrice(p.sym)||p.avgPrice),0);
  const notN      = +notional;
  const posSize   = price>0&&notN>0 ? (notN*leverage)/price : 0;
  const posVal    = posSize*price;

  // SL/TP suggestion based on ATR
  const sugSl = side==="LONG" ? price-ind.atr*1.5 : price+ind.atr*1.5;
  const sugTp = side==="LONG" ? price+ind.atr*2.5 : price-ind.atr*2.5;

  // Risk / Reward
  const slN=+sl, tpN=+tp;
  const riskPts   = sl&&slN>0 ? Math.abs(price-slN) : 0;
  const rewardPts = tp&&tpN>0 ? Math.abs(tpN-price) : 0;
  const rrRatio   = riskPts>0&&rewardPts>0 ? (rewardPts/riskPts) : 0;

  // Liq price preview
  const liqPreview = leverage>1 ? getLiqPrice(side,price,leverage) : 0;

  // ── Effects ──

  // Завантаження demo-акаунту: Supabase якщо залогінений, localStorage якщо гість
  useEffect(()=>{
    // Гість: useState вже ініціалізував з localStorage — нічого не робимо
    if(!userId) return;
    // Залогінений: завантажуємо з Supabase (async — setState в callback, не синхронно)
    let active=true;
    dbLoad(userId).then(remote=>{
      if(!active) return;
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
    const syms=[...new Set(demo.positions.map(p=>p.sym).filter(s=>s!==asset.sym))].sort();
    return syms.join(",");
  },[demo.positions, asset.sym]);

  useEffect(()=>{
    const syms = otherPosSig ? otherPosSig.split(",") : [];
    if(!syms.length){ setLivePrices({}); return; }
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

  // Авто-закриття позицій (SL / TP / Liquidation)
  // ВАЖЛИВО: перевіряємо ТІЛЬКИ позиції/ордери поточного активу,
  // щоб ціна ETH не закривала позиції BTC при переключенні активу
  useEffect(()=>{
    if(!price || !isTickerForPair)return;
    const t=setTimeout(()=>{
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
        });
        // SL / TP / Liq — тільки для поточного символу
        next.positions.forEach(pos=>{
          if(pos.sym !== asset.sym) return; // ← критичний фікс
          const hitSl  = pos.sl   ? (pos.side==="LONG"?price<=pos.sl  :price>=pos.sl)   : false;
          const hitTp  = pos.tp   ? (pos.side==="LONG"?price>=pos.tp  :price<=pos.tp)   : false;
          const hitLiq = pos.liqPrice>0 ? (pos.side==="LONG"?price<=pos.liqPrice:price>=pos.liqPrice) : false;
          if(hitSl||hitTp||hitLiq){ next=execClose(next,pos,hitLiq?pos.liqPrice:price); changed=true; }
        });
        return changed?next:cur;
      });
    },0);
    return()=>clearTimeout(t);
  },[price, asset.sym, isTickerForPair]);

  // ── Actions ──
  const goAsset = (a:Asset)=>{ setCoinOpen(false);setCoinQ(""); navigate(`/trading/${a.sym}`); };

  const submitOrder = ()=>{
    setTradeErr("");
    const amt=+notional, lp=+limitPx, slN2=+sl, tpN2=+tp;
    if(!Number.isFinite(amt)||amt<=0) return setTradeErr("Вкажіть суму угоди в USDT.");
    const order:DemoOrder = {
      id:crypto.randomUUID(), sym:asset.sym, name:asset.name, img:asset.img,
      side, type:otype, notional:amt, leverage,
      sl:slN2>0?slN2:undefined, tp:tpN2>0?tpN2:undefined, createdAt:now(),
    };
    if(otype==="Limit"){
      if(!Number.isFinite(lp)||lp<=0) return setTradeErr("Вкажіть ліміт ціну.");
      setDemo(cur=>({...cur,orders:[{...order,limitPrice:lp},...cur.orders].slice(0,20)}));
      setBotTab("Orders"); if(!bottomOpen)setBottomOpen(true); return;
    }
    const r=execOpen(demo,order,price);
    if(r.error)return setTradeErr(r.error);
    setDemo(r.next); setBotTab("Positions"); if(!bottomOpen)setBottomOpen(true);
  };

  const cancelOrder   = (id:string)     => setDemo(cur=>({...cur,orders:cur.orders.filter(o=>o.id!==id)}));
  const closePosition = (pos:DemoPos, fill = price) => setDemo(cur=>execClose(cur,pos,fill));
  const addBalance    = (amt:number)    => setDemo(cur=>({...cur,cash:cur.cash+amt}));
  const resetDemo     = ()=>{
    if(!window.confirm("Скинути демо рахунок? Усі позиції та історія будуть видалені."))return;
    setDemo(makeAcc());
    setTradeErr("");
    if(userId) void dbReset(userId);
  };

  // ── ATR Quick SL presets ──
  const applyAtrSl = (mult:number)=>setSl((side==="LONG"?price-ind.atr*mult:price+ind.atr*mult).toFixed(price<1?6:2));
  const applyAtrTp = (mult:number)=>setTp((side==="LONG"?price+ind.atr*mult:price-ind.atr*mult).toFixed(price<1?6:2));

  // ── Алерти ──
  const [alertCond, setAlertCond]         = useState<PriceAlertCondition>("price_gt");
  const [alertVal, setAlertVal]           = useState("");
  const [alertMsg, setAlertMsg]           = useState("");
  const [alertErr, setAlertErr]           = useState("");
  const [alertLoading, setAlertLoading]   = useState(false);
  const [assetAlerts, setAssetAlerts]     = useState<PriceAlertRecord[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [deletingId, setDeletingId]       = useState<string|null>(null);
  const [togglingId, setTogglingId]       = useState<string|null>(null);

  // Position edit modal + toasts
  const [editingPos, setEditingPos]       = useState<DemoPos|null>(null);
  const [toasts, setToasts]               = useState<ToastItem[]>([]);

  const pushToast = useCallback((msg: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev.slice(-4), { id, msg }]); // max 5 toasts
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 8_000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Alert helpers ──
  const getAlertDefault = useCallback((cond: PriceAlertCondition): string => {
    if (NO_VALUE_CONDITIONS.has(cond)) return "";
    const p = price > 0 ? price : 0;
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
  }, [price]);

  const getAlertCondContext = (cond: PriceAlertCondition): string => {
    switch (cond) {
      case "price_gt": case "price_lt": case "price_gte": case "price_lte": case "price_eq":
        return `Ціна зараз: ${fUsd(price)}`;
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

  const loadAssetAlerts = useCallback(async () => {
    if (!userId) return;
    setAlertsLoading(true);
    try {
      const rows = await listUserPriceAlerts(userId);
      setAssetAlerts(rows.filter(r => r.symbol.toUpperCase() === asset.sym));
    } catch { /* ігноруємо */ }
    finally { setAlertsLoading(false); }
  }, [userId, asset.sym]);

  const handleCreateAlert = async () => {
    setAlertMsg(""); setAlertErr("");
    if (!userId) { setAlertErr("Увійдіть в акаунт."); return; }
    const isNoValue = NO_VALUE_CONDITIONS.has(alertCond);
    const num = isNoValue ? 0 : parseFloat(alertVal.replace(",", "."));
    if (!isNoValue && (!Number.isFinite(num) || num <= 0)) { setAlertErr("Введіть коректне значення."); return; }
    setAlertLoading(true);
    try {
      await createPriceAlert({ userId, symbol: asset.sym, condition: alertCond, targetPrice: num });
      setAlertMsg("Алерт створено!");
      setAlertVal(getAlertDefault(alertCond));
      void loadAssetAlerts();
    } catch { setAlertErr("Помилка при створенні алерту."); }
    finally { setAlertLoading(false); }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!userId) return;
    setDeletingId(id);
    try {
      await removePriceAlert(userId, id);
      setAssetAlerts(prev => prev.filter(a => a.id !== id));
    } catch { /* ігноруємо */ }
    finally { setDeletingId(null); }
  };

  const handleToggleAlert = useCallback(async (id: string, currentActive: boolean|null) => {
    if (!userId) return;
    const newActive = !currentActive;
    setAssetAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: newActive } : a));
    setTogglingId(id);
    try { await togglePriceAlert(userId, id, newActive); }
    catch { setAssetAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: currentActive } : a)); }
    finally { setTogglingId(null); }
  }, [userId]);

  const handleUpdateSlTp = useCallback((posId: string, sl?: number, tp?: number) => {
    setDemo(cur => ({
      ...cur,
      positions: cur.positions.map(p => p.id === posId ? { ...p, sl, tp } : p),
    }));
    // Keep editingPos in sync if it's the same position
    setEditingPos(prev => prev?.id === posId ? { ...prev, sl, tp } : prev);
  }, []);

  const handleUpdateAlertPrice = useCallback(async (alertId: string, newPrice: number) => {
    if (!userId) return;
    setAssetAlerts(prev => prev.map(a => a.id === alertId ? { ...a, target_price: newPrice } : a));
    try { await updateAlertTargetPrice(userId, alertId, newPrice); }
    catch { void loadAssetAlerts(); } // revert on error
  }, [userId, loadAssetAlerts]);

  const handleAlertTriggered = useCallback((alert: PriceAlertRecord, triggerPrice: number) => {
    const condLabel = getAlertConditionShortLabel(alert.condition);
    const priceStr  = fUsd(triggerPrice);
    const targetStr = alert.target_price > 0 ? ` @ ${fUsd(alert.target_price)}` : "";
    pushToast(`🚨 ${alert.symbol}: ${condLabel}${targetStr} — ціна ${priceStr}`);
  }, [pushToast]);

  // Авто-заповнення значення при зміні умови
  useEffect(() => {
    setAlertVal(getAlertDefault(alertCond));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertCond]);

  // Завантажуємо алерти при відкритті вкладки або при зміні символу
  useEffect(() => {
    void loadAssetAlerts();
  }, [loadAssetAlerts]);

  useEffect(() => {
    if (rightTab === "Alerts") void loadAssetAlerts();
  }, [rightTab, loadAssetAlerts]);

  // ── ML прогнози з Supabase ──
  const [mlPreds, setMlPreds]         = useState<MlPred[]>([]);
  const [mlAges,  setMlAges]          = useState<Record<string,string>>({});
  const [mlLoading, setMlLoading]     = useState(false);
  const [mlRefreshing, setMlRefreshing] = useState(false);

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
    void fetchPreds(active);
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
    void requestFreshPrediction("auto");

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
                        <div className={`text-[10px] font-medium ${a.pct24h>=0?"text-[#00E676]":"text-[#F40000]"}`}>{fPct(a.pct24h)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-white/10 shrink-0"/>
          {/* Price */}
          <span className={`text-[15px] font-bold shrink-0 ${isGreen?"text-[#00E676]":"text-[#F40000]"}`}>
            {loading&&!price?<Loader2 size={13} className="animate-spin inline"/>:fUsd(price)}
          </span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${isGreen?"bg-[#00E676]/10 text-[#00E676]":"bg-[#F40000]/10 text-[#F40000]"}`}>
            {fPct(pct24h)}
          </span>
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
          <a href={AI_ASSISTANT_URL} target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex h-7 items-center gap-1 rounded-lg bg-gradient-to-r from-[#2C1969] to-[#8348C1] px-2.5 text-[11px] font-semibold hover:opacity-80 transition-opacity">
            <Bot size={12}/> PulseAI
          </a>
          <button type="button" onClick={()=>void loadData()} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors">
            <RefreshCw size={13} className={loading?"animate-spin":""}/>
          </button>
          <div className="h-4 w-px bg-white/10"/>
          <button type="button" onClick={()=>setPanelOpen(v=>!v)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${panelOpen?"bg-[#8348C1]/20 text-[#C38BFF]":"text-white/50 hover:bg-white/5 hover:text-white"}`}>
            <PanelRight size={16}/>
          </button>
        </div>
      </header>

      {/* ══ WORKSPACE ══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* CENTER */}
        <main className="flex flex-1 flex-col min-w-0 bg-[#08080A]">

          {/* Chart — lightweight-charts with real price lines + drag SL/TP */}
          <div className="flex-1 min-h-0">
            <TradingLWChart
              pair={pair}
              alerts={assetAlerts}
              positions={demo.positions.filter(p=>p.sym===asset.sym)}
              onUpdatePositionSlTp={handleUpdateSlTp}
              onUpdateAlertPrice={handleUpdateAlertPrice}
              onAlertTriggered={handleAlertTriggered}
            />
          </div>

          {/* Bottom Panel */}
          <div className={`flex flex-col border-t border-white/10 bg-[#050506] shrink-0 transition-all duration-300 ${bottomOpen?"h-[210px]":"h-[34px]"}`}>

            {/* Tab bar */}
            <div className="flex h-[34px] items-center justify-between px-3 border-b border-white/5 shrink-0 bg-[#08080A]">
              <div className="flex items-center h-full">
                {(["Positions","Orders","History"] as BottomTab[]).map(tab=>{
                  const cnt=tab==="Positions"?demo.positions.length:tab==="Orders"?demo.orders.length:demo.trades.length;
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
                  <span className={`ml-4 text-[11px] font-semibold ${totalPnl>=0?"text-[#00E676]":"text-[#F40000]"}`}>
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
                  demo.positions.length===0
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
                          {demo.positions.map(pos=>{
                            const liveP = posPrice(pos.sym);
                            const fillP = liveP || pos.avgPrice;
                            const pnl=getPnl(pos,fillP);
                            const roe=(pnl/pos.margin)*100;
                            const priceReady = liveP > 0;
                            return (
                              <tr key={pos.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer"
                                onClick={e=>{
                                  if((e.target as HTMLElement).closest("button")) return;
                                  setEditingPos(pos);
                                }}>
                                <td className="px-2.5 py-2">
                                  <div className="flex items-center gap-1.5">
                                    <img src={pos.img} alt={pos.sym} className="h-4 w-4 rounded-full" onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none"}}/>
                                    <span className="font-semibold">{pos.sym}</span>
                                  </div>
                                </td>
                                <td className={`px-2.5 py-2 font-bold ${pos.side==="LONG"?"text-[#26a69a]":"text-[#ef5350]"}`}>{pos.side}</td>
                                <td className="px-2.5 py-2"><span className="bg-[#8348C1]/20 text-[#C38BFF] rounded px-1.5 py-0.5 text-[9px] font-bold">{pos.leverage}x</span></td>
                                <td className="px-2.5 py-2 text-white/80">{fQty(pos.qty)}</td>
                                <td className="px-2.5 py-2 text-white/80">{fUsd(pos.avgPrice)}</td>
                                <td className="px-2.5 py-2">
                                  {priceReady
                                    ? <span className="font-semibold text-white">{fUsd(liveP)}</span>
                                    : <span className="text-white/20 text-[9px] animate-pulse">завант...</span>}
                                </td>
                                <td className="px-2.5 py-2 text-white/80">{fUsd(pos.margin)}</td>
                                <td className={`px-2.5 py-2 font-semibold ${pnl>=0?"text-[#26a69a]":"text-[#ef5350]"}`}>
                                  {priceReady ? <>{pnl>=0?"+":""}{fUsd(pnl)}</> : <span className="text-white/20">---</span>}
                                </td>
                                <td className={`px-2.5 py-2 font-semibold ${roe>=0?"text-[#26a69a]":"text-[#ef5350]"}`}>
                                  {priceReady ? fRoe(roe) : <span className="text-white/20">---</span>}
                                </td>
                                <td className="px-2.5 py-2 text-amber-400/80 text-[10px]">{pos.liqPrice>0?fUsd(pos.liqPrice):"—"}</td>
                                <td className="px-2.5 py-2 text-[#ef5350]/80">{pos.sl&&pos.sl>0?fUsd(pos.sl):"—"}</td>
                                <td className="px-2.5 py-2 text-[#26a69a]/80">{pos.tp&&pos.tp>0?fUsd(pos.tp):"—"}</td>
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
                  demo.orders.length===0
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
                          {demo.orders.map(o=>(
                            <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                              <td className="px-2.5 py-2"><div className="flex items-center gap-1.5"><img src={o.img} alt={o.sym} className="h-4 w-4 rounded-full" onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none"}}/><span className="font-semibold">{o.sym}</span></div></td>
                              <td className={`px-2.5 py-2 font-bold ${o.side==="LONG"?"text-[#00E676]":"text-[#F40000]"}`}>{o.side}</td>
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
                  demo.trades.length===0
                    ? <Empty text="Немає закритих угод"/>
                    : <table className="w-full text-left text-[10.5px]">
                        <thead className="sticky top-0 bg-[#050506] z-10">
                          <tr className="text-white/30 border-b border-white/5">
                            {["Символ","Сторона","Плечі","Дія","Кількість","Ціна","PnL","ROE%","Час"].map(h=>(
                              <th key={h} className="px-2.5 py-2 font-medium whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {demo.trades.map(t=>(
                            <tr key={t.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                              <td className="px-2.5 py-2 font-semibold">{t.sym}</td>
                              <td className={`px-2.5 py-2 font-bold ${t.side==="LONG"?"text-[#00E676]":"text-[#F40000]"}`}>{t.side}</td>
                              <td className="px-2.5 py-2"><span className="bg-[#8348C1]/20 text-[#C38BFF] rounded px-1.5 py-0.5 text-[9px] font-bold">{t.leverage}x</span></td>
                              <td className="px-2.5 py-2">
                                <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${t.action==="OPEN"?"bg-[#8348C1]/20 text-[#C38BFF]":"bg-white/10 text-white/60"}`}>
                                  {t.action==="OPEN"?"Відкрито":"Закрито"}
                                </span>
                              </td>
                              <td className="px-2.5 py-2 text-white/80">{fQty(t.qty)}</td>
                              <td className="px-2.5 py-2 text-white/80">{fUsd(t.price)}</td>
                              <td className={`px-2.5 py-2 font-semibold ${t.pnl>0?"text-[#00E676]":t.pnl<0?"text-[#F40000]":"text-white/40"}`}>
                                {t.action==="CLOSE"?(t.pnl>=0?"+":"")+fUsd(t.pnl):"—"}
                              </td>
                              <td className={`px-2.5 py-2 font-semibold ${t.roe>0?"text-[#00E676]":t.roe<0?"text-[#F40000]":"text-white/40"}`}>
                                {t.action==="CLOSE"?fRoe(t.roe):"—"}
                              </td>
                              <td className="px-2.5 py-2 text-white/30 whitespace-nowrap">{t.createdAt}</td>
                            </tr>
                          ))}
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
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">Demo баланс</span>
                    <span className={`font-bold ${demo.cash<0?"text-[#F40000]":"text-white"}`}>{fUsd(demo.cash)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">Equity</span>
                    <span className={`font-bold ${equity>=DEMO_START?"text-[#00E676]":"text-[#F40000]"}`}>{fUsd(equity)}</span>
                  </div>
                  {totalPnl!==0&&(
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/40">Open PnL</span>
                      <span className={`font-semibold ${totalPnl>=0?"text-[#00E676]":"text-[#F40000]"}`}>{totalPnl>=0?"+":""}{fUsd(totalPnl)}</span>
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
                  {demo.cash<1000&&(
                    <div className="flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 p-1.5 text-[10px] text-amber-300">
                      <AlertTriangle size={10}/> Поповніть баланс
                    </div>
                  )}
                </div>

                {/* LONG / SHORT */}
                <div className="flex rounded-xl bg-[#08080A] p-0.5 border border-white/10">
                  {(["LONG","SHORT"] as const).map(s=>(
                    <button key={s} type="button" onClick={()=>setSide(s)}
                      className={`h-8 flex-1 rounded-lg text-[12px] font-bold transition-all ${side===s?(s==="LONG"?"bg-[#00E676] text-black":"bg-[#F40000] text-white"):"text-white/40 hover:text-white hover:bg-white/5"}`}>
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
                            className="text-[8px] px-1.5 py-0.5 rounded bg-[#00E676]/10 text-[#00E676]/70 hover:text-[#00E676] transition-colors">
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
                      <div className={`rounded-lg px-2.5 py-1.5 text-[10px] ${rrRatio>=2?"bg-[#00E676]/10 border border-[#00E676]/20":"bg-amber-500/10 border border-amber-500/20"}`}>
                        <div className="text-white/40 mb-0.5">Risk / Reward</div>
                        <div className={`font-bold ${rrRatio>=2?"text-[#00E676]":"text-amber-400"}`}>1 : {rrRatio.toFixed(2)}</div>
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
                    className={`h-[40px] w-full rounded-xl text-[13px] font-bold tracking-wide transition-opacity hover:opacity-90 ${side==="LONG"?"bg-[#00E676] text-black":"bg-[#F40000] text-white"}`}>
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
                  {mlPreds.length===0&&!mlLoading&&(
                    <div className="rounded-xl border border-white/5 bg-[#08080A] p-3 text-center text-[10px] text-white/25">
                      Немає прогнозів для {asset.sym}
                    </div>
                  )}
                  {(["4h","1d","1w","1M"] as const).map(tf2=>{
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

                    const signalColor = isLong?"text-[#00E676]":isShort?"text-[#F40000]":"text-white/40";
                    const signalBg    = isStale
                      ? "bg-amber-500/5 border-amber-500/20"
                      : isLong?"bg-[#00E676]/10 border-[#00E676]/20"
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
                            <div className="flex justify-between"><span className="text-white/35">TP</span><span className="font-semibold text-[#00E676]">{fUsd(p.take_profit)}</span></div>
                          )}
                        </div>

                        {/* Confidence bar */}
                        {p.confidence!=null&&!isNo&&(
                          <div className="mt-2 h-[3px] w-full bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${isStale?"bg-amber-400":isLong?"bg-[#00E676]":"bg-[#F40000]"}`}
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
                          className="rounded px-2 py-0.5 bg-[#00E676]/10 text-[#00E676]/70 hover:text-[#00E676] text-[9px] font-semibold transition-colors">
                          +{pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Support / Resistance */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/5">
                    <div className="rounded-lg border border-white/5 bg-[#08080A] p-2">
                      <div className="text-[9px] text-white/35 font-semibold mb-1 flex items-center gap-1"><Target size={9}/>Підтримка</div>
                      <div className="text-[11px] text-[#00E676] font-medium">{fUsd(ind.support)}</div>
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
                        type="number"
                        inputMode="decimal"
                        value={alertVal}
                        onChange={e=>{setAlertVal(e.target.value);setAlertMsg("");setAlertErr("");}}
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

                {/* Feedback */}
                {(alertErr||alertMsg)&&(
                  <div className={`rounded-lg px-2.5 py-1.5 text-[10px] ${alertErr?"bg-red-500/10 border border-red-500/20 text-red-300":"bg-[#00E676]/10 border border-[#00E676]/20 text-[#00E676]"}`}>
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

                {/* Existing alerts for this asset */}
                <div className="text-[9px] font-semibold text-white/35 uppercase tracking-wider flex items-center justify-between">
                  <span>Активні · {asset.sym}</span>
                  {alertsLoading&&<Loader2 size={9} className="animate-spin text-[#8348C1]"/>}
                </div>

                {!userId?(
                  <div className="text-[10px] text-white/25 text-center py-2">Увійдіть, щоб бачити алерти</div>
                ):assetAlerts.length===0&&!alertsLoading?(
                  <div className="text-[10px] text-white/25 text-center py-2">Немає алертів для {asset.sym}</div>
                ):(
                  <div className="space-y-1.5">
                    {assetAlerts.map(al=>{
                      const isPrice = ALERT_CONDS_PRICE.has(al.condition);
                      const isUp = al.condition.includes("_up")||al.condition.includes("_gt")||al.condition==="golden_cross"||al.condition==="new_ath"||al.condition==="bb_upper_break";
                      const isActive = al.is_active !== false;
                      const dotColor = !isActive?"bg-white/20":isUp?"bg-[#26a69a]":"bg-[#ef5350]";
                      const unit = getAlertConditionUnit(al.condition);
                      return (
                        <div key={al.id} className={`rounded-xl border px-2.5 py-2 transition-colors ${!isActive?"border-white/5 bg-white/[0.02]":"border-[#8348C1]/20 bg-[#8348C1]/5"}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] font-semibold text-white truncate">
                                {getAlertConditionShortLabel(al.condition)}
                                {al.target_price>0&&isPrice&&<span className="ml-1 font-mono text-white/60">{fUsd(al.target_price)}</span>}
                                {al.target_price>0&&!isPrice&&<span className="ml-1 font-mono text-white/60">{al.target_price}{unit?" "+unit:""}</span>}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`}/>
                                <span className={`text-[9px] ${!isActive?"text-white/25":"text-[#26a69a]/70"}`}>
                                  {!isActive?"Призупинено":"Активний"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              {/* Toggle active/paused */}
                              <button type="button"
                                disabled={togglingId===al.id}
                                onClick={()=>void handleToggleAlert(al.id, al.is_active)}
                                title={isActive?"Призупинити":"Активувати"}
                                className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${isActive?"text-[#26a69a]/60 hover:bg-[#26a69a]/10 hover:text-[#26a69a]":"text-white/25 hover:bg-white/10 hover:text-white"}`}>
                                {togglingId===al.id?<Loader2 size={10} className="animate-spin"/>:isActive?<Bell size={10}/>:<BellOff size={10}/>}
                              </button>
                              {/* Delete */}
                              <button type="button"
                                disabled={deletingId===al.id}
                                onClick={()=>void handleDeleteAlert(al.id)}
                                title="Видалити"
                                className="flex h-6 w-6 items-center justify-center rounded-lg text-white/25 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-40">
                                {deletingId===al.id?<Loader2 size={10} className="animate-spin"/>:<Trash2 size={10}/>}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
        currentPrice={editingPos ? posPrice(editingPos.sym) : 0}
        onClose={() => setEditingPos(null)}
        onSave={handleUpdateSlTp}
        onClosePos={pos => closePosition(pos, posPrice(pos.sym) || pos.avgPrice)}
      />

      {/* Alert toasts */}
      <ToastNotifications items={toasts} onDismiss={dismissToast}/>
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
  const cls=tone==="green"?"text-[#00E676]":tone==="red"?"text-[#F40000]":tone==="yellow"?"text-[#fbbf24]":"text-white";
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
        <span className={`h-1.5 w-1.5 rounded-full ${active?"bg-[#00E676]":"bg-[#fbbf24]"}`}/>
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
            <div className={`absolute inset-y-0 right-0 ${tone==="green"?"bg-[#00E676]/8":"bg-[#F40000]/8"}`} style={{width:`${clamp((r.total/max)*100,2,100)}%`}}/>
            <div className="relative flex justify-between gap-2 text-[10px] font-medium">
              <span className={tone==="green"?"text-[#00E676]":"text-[#F40000]"}>{fUsd(r.price)}</span>
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
