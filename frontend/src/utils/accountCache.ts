export type PlanKey = "free" | "pro" | "business";
export type BillingCycle = "monthly" | "yearly";

export type AccountCache = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  phoneNumber: string;
  birthDate: string;
  region: string;
  avatarUrl: string;
  planKey: PlanKey;
  billingCycle: BillingCycle;
  cardLast4: string | null;
  passwordLastChanged: string;
  updatedAt: number;
};

export const accountCacheKey = "cryptopulse_account_cache";
export const accountCacheEvent = "cryptopulse-account-cache-updated";

const isPlanKey = (value: unknown): value is PlanKey =>
  value === "free" || value === "pro" || value === "business";

const isBillingCycle = (value: unknown): value is BillingCycle =>
  value === "monthly" || value === "yearly";

export const planLabelMap: Record<PlanKey, string> = {
  free: "Безкоштовно",
  pro: "Pro",
  business: "Бізнес",
};

export const getPlanLabel = (planKey?: string | null) =>
  planLabelMap[isPlanKey(planKey) ? planKey : "free"];

export const normalizePlanKey = (planKey?: string | null): PlanKey =>
  isPlanKey(planKey) ? planKey : "free";

export const normalizeBillingCycle = (cycle?: string | null): BillingCycle =>
  isBillingCycle(cycle) ? cycle : "monthly";

export const readAccountCache = (): AccountCache | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(accountCacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AccountCache>;
    if (!parsed.userId) return null;

    return {
      userId: parsed.userId,
      email: parsed.email || "",
      firstName: parsed.firstName || "",
      lastName: parsed.lastName || "",
      username: parsed.username || "",
      phoneNumber: parsed.phoneNumber || "",
      birthDate: parsed.birthDate || "",
      region: parsed.region || "",
      avatarUrl: parsed.avatarUrl || "",
      planKey: normalizePlanKey(parsed.planKey),
      billingCycle: normalizeBillingCycle(parsed.billingCycle),
      cardLast4: parsed.cardLast4 || null,
      passwordLastChanged: parsed.passwordLastChanged || "",
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
    };
  } catch {
    return null;
  }
};

export const writeAccountCache = (account: AccountCache) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    accountCacheKey,
    JSON.stringify({ ...account, updatedAt: Date.now() }),
  );
  window.dispatchEvent(new CustomEvent(accountCacheEvent));
};

export const mergeAccountCache = (patch: Partial<AccountCache>) => {
  const current = readAccountCache();
  if (!current && !patch.userId) return;

  writeAccountCache({
    userId: patch.userId || current?.userId || "",
    email: patch.email ?? current?.email ?? "",
    firstName: patch.firstName ?? current?.firstName ?? "",
    lastName: patch.lastName ?? current?.lastName ?? "",
    username: patch.username ?? current?.username ?? "",
    phoneNumber: patch.phoneNumber ?? current?.phoneNumber ?? "",
    birthDate: patch.birthDate ?? current?.birthDate ?? "",
    region: patch.region ?? current?.region ?? "",
    avatarUrl: patch.avatarUrl ?? current?.avatarUrl ?? "",
    planKey: patch.planKey ?? current?.planKey ?? "free",
    billingCycle: patch.billingCycle ?? current?.billingCycle ?? "monthly",
    cardLast4: patch.cardLast4 !== undefined ? patch.cardLast4 : current?.cardLast4 ?? null,
    passwordLastChanged: patch.passwordLastChanged ?? current?.passwordLastChanged ?? "",
    updatedAt: Date.now(),
  });
};

export const clearAccountCache = () => {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(accountCacheKey);
  window.localStorage.removeItem("cryptopulse_profile_cache");
  window.localStorage.removeItem("cryptopulse_settings_cache");
  window.dispatchEvent(new CustomEvent(accountCacheEvent));
};
