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

  return {
    userId: authUser.id,
    email: typeof row?.email === "string" ? row.email : authUser.email || "",
    firstName: typeof row?.first_name === "string" ? row.first_name : "",
    lastName: typeof row?.last_name === "string" ? row.last_name : "",
    username: typeof row?.username === "string" ? row.username : "",
    phoneNumber: typeof row?.phone_number === "string" ? row.phone_number : "",
    birthDate: typeof row?.birth_date === "string" ? row.birth_date : "",
    region: typeof row?.region === "string" ? row.region : "",
    avatarUrl: typeof row?.avatar_url === "string" ? row.avatar_url : "",
    planKey,
    billingCycle: normalizeBillingCycle(typeof row?.billing_cycle === "string" ? row.billing_cycle : "monthly"),
    cardLast4: typeof row?.card_last4 === "string" ? row.card_last4 : null,
    passwordLastChanged: typeof row?.password_last_changed === "string" ? row.password_last_changed : "",
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
