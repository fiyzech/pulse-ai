import { normalizePlanKey } from "./accountCache";
import type { PlanKey } from "./accountCache";

export type PlanLimits = {
  /** Max watchlist items. null = unlimited */
  watchlistMax: number | null;
  /** Max distinct crypto symbols that can have alerts. null = unlimited */
  alertSymbolsMax: number | null;
  /** Max active alerts per symbol. null = unlimited */
  alertsPerSymbolMax: number | null;
  /** Max total active alerts across all symbols. null = unlimited */
  totalActiveAlertsMax: number | null;
  /** Max unique symbols for which ML signals can be viewed per month. null = unlimited */
  signalSymbolsPerMonth: number | null;
};

const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  free: {
    watchlistMax: 5,
    alertSymbolsMax: 1,
    alertsPerSymbolMax: null,
    totalActiveAlertsMax: 3,
    signalSymbolsPerMonth: 3,
  },
  pro: {
    watchlistMax: 15,
    alertSymbolsMax: 5,
    alertsPerSymbolMax: 5,
    totalActiveAlertsMax: null,
    signalSymbolsPerMonth: 10,
  },
  business: {
    watchlistMax: null,
    alertSymbolsMax: 15,
    alertsPerSymbolMax: null,
    totalActiveAlertsMax: null,
    signalSymbolsPerMonth: null,
  },
};

export const getPlanLimits = (planKey?: string | null): PlanLimits =>
  PLAN_LIMITS[normalizePlanKey(planKey)];

// ── Signal quota helpers (localStorage) ─────────────────────────────────────

const signalQuotaKey = (userId: string) => {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  return `cpulse_sig_${userId}_${month}`;
};

export const getViewedSignalSymbols = (userId: string): Set<string> => {
  try {
    const raw = localStorage.getItem(signalQuotaKey(userId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
};

export const recordSignalSymbol = (userId: string, symbol: string): void => {
  try {
    const viewed = getViewedSignalSymbols(userId);
    viewed.add(symbol.toUpperCase());
    localStorage.setItem(signalQuotaKey(userId), JSON.stringify([...viewed]));
  } catch { /* ignore */ }
};
