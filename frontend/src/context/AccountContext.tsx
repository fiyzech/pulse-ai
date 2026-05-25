import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AccountContext } from "./accountContextValue";
import { supabase } from "../supabaseClient";
import {
  accountCacheEvent,
  clearAccountCache,
  mergeAccountCache,
  normalizeBillingCycle,
  normalizePlanKey,
  readAccountCache,
  writeAccountCache,
} from "../utils/accountCache";
import type { AccountCache } from "../utils/accountCache";

const buildAccountFromRows = (
  authUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  },
  row?: Record<string, unknown> | null,
): AccountCache => {
  const planKey = normalizePlanKey(
    typeof row?.active_plan === "string"
      ? row.active_plan
      : typeof row?.subscription === "string"
        ? row.subscription
        : "free",
  );

  // Extract Google/OAuth metadata as fallback for empty DB fields
  const meta = authUser.user_metadata ?? {};
  const oauthFullName =
    typeof meta.full_name === "string" ? meta.full_name :
    typeof meta.name === "string" ? meta.name : "";
  const nameParts = oauthFullName.trim().split(/\s+/);
  const oauthFirstName = nameParts[0] ?? "";
  const oauthLastName = nameParts[1] ?? ""; // only second word, skip patronymic
  const oauthAvatar =
    typeof meta.avatar_url === "string" ? meta.avatar_url :
    typeof meta.picture === "string" ? meta.picture : "";

  const str = (v: unknown) => (typeof v === "string" && v.length > 0 ? v : null);

  return {
    userId: authUser.id,
    email: str(row?.email) ?? authUser.email ?? "",
    firstName: str(row?.first_name) ?? oauthFirstName,
    lastName: str(row?.last_name) ?? oauthLastName,
    username: str(row?.username) ?? "",
    phoneNumber: str(row?.phone_number) ?? "",
    birthDate: str(row?.birth_date) ?? "",
    region: str(row?.region) ?? "",
    avatarUrl: str(row?.avatar_url) ?? oauthAvatar,
    planKey,
    billingCycle: normalizeBillingCycle(typeof row?.billing_cycle === "string" ? row.billing_cycle : "monthly"),
    cardLast4: typeof row?.card_last4 === "string" ? row.card_last4 : null,
    planActivatedAt: readAccountCache()?.planActivatedAt ?? null,
    passwordLastChanged: str(row?.password_last_changed) ?? "",
    updatedAt: Date.now(),
  };
};

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AccountCache | null>(() => readAccountCache());
  const [loading, setLoading] = useState(!readAccountCache());

  const refreshAccount = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      clearAccountCache();
      setAccount(null);
      setLoading(false);
      return null;
    }

    const { data, error } = await supabase
      .from("users")
      .select("email, first_name, last_name, username, phone_number, birth_date, region, avatar_url, active_plan, subscription, billing_cycle, card_last4, password_last_changed")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Account refresh error:", error);
      setLoading(false);
      return readAccountCache();
    }

    // Auto-create users row for new OAuth users (Google, Apple, etc.)
    if (!data) {
      const meta = user.user_metadata ?? {};
      const oauthFullName =
        typeof meta.full_name === "string" ? meta.full_name :
        typeof meta.name === "string" ? meta.name : "";
      const nameParts = oauthFullName.trim().split(/\s+/);
      const oauthFirstName = nameParts[0] ?? "";
      const oauthLastName = nameParts[1] ?? ""; // only second word, skip patronymic
      const oauthAvatar =
        typeof meta.avatar_url === "string" ? meta.avatar_url :
        typeof meta.picture === "string" ? meta.picture : "";

      await supabase.from("users").upsert({
        id: user.id,
        email: user.email ?? "",
        first_name: oauthFirstName || null,
        last_name: oauthLastName || null,
        username: null,
        avatar_url: oauthAvatar || null,
        active_plan: "free",
        billing_cycle: "monthly",
      }, { onConflict: "id" });
    }

    const nextAccount = buildAccountFromRows(user, data);
    writeAccountCache(nextAccount);
    setAccount(nextAccount);
    setLoading(false);
    return nextAccount;
  };

  const mergeAccount = (patch: Partial<AccountCache>) => {
    mergeAccountCache(patch);
    setAccount(readAccountCache());
  };

  const clearAccount = () => {
    clearAccountCache();
    setAccount(null);
  };

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => {
      void refreshAccount();
    }, 0);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearAccount();
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        void refreshAccount();
      }
    });

    const handleCacheUpdate = () => setAccount(readAccountCache());
    window.addEventListener(accountCacheEvent, handleCacheUpdate);

    return () => {
      window.clearTimeout(refreshTimer);
      subscription.unsubscribe();
      window.removeEventListener(accountCacheEvent, handleCacheUpdate);
    };
  }, []);

  const value = useMemo(
    () => ({ account, loading, refreshAccount, mergeAccount, clearAccount }),
    [account, loading],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}
