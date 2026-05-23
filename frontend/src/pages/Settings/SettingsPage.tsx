import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { supabase } from "../../supabaseClient";
import { mergeAccountCache, readAccountCache } from "../../utils/accountCache";
import visaLogo from '../../assets/icons/visa.svg';
import uploadicon from '../../assets/icons/share upload alt..svg';
import uploadicon2 from '../../assets/icons/Vector.svg';

interface Plan {
  name: string;
  key: "free" | "pro" | "business";
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  cta: string;
  highlighted: boolean;
}

type CardErrors = {
  cardNumber?: string;
  cardExpiry?: string;
  cardCVV?: string;
  cardName?: string;
  general?: string;
};

type SettingsCache = {
  userId?: string;
  selectedPlan: number;
  isYearly: boolean;
  savedCardLast4: string | null;
};

const gradientFill = "linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%)";
const quietInputBorder = "1px solid rgba(255,255,255,0.1)";
const errorInputBorder = "1px solid rgba(248,113,113,0.72)";
const inputBgQuiet = "linear-gradient(#050506, #050506) padding-box, linear-gradient(90deg, rgba(82, 46, 139, 0.32) 0%, rgba(179, 179, 179, 0.32) 100%) border-box";
const inputBgError = "linear-gradient(#0A0A0A, #0A0A0A) padding-box, linear-gradient(90deg, rgba(248, 113, 113, 0.72) 0%, rgba(248, 113, 113, 0.72) 100%) border-box";
const settingsCacheKey = "cryptopulse_settings_cache";


const tableGradientBorder = "linear-gradient(90deg, #522E8B 0%, #B3B3B3 100%)";

const cancelGradientBorder =
  "linear-gradient(#050506, #050506) padding-box, linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%) border-box";

const FEATURE_LINES_WITHOUT_BULLET = new Set(["Все з Free +", "Все з Pro, +:"]);

const defaultSettingsCache: SettingsCache = {
  selectedPlan: 0,
  isYearly: false,
  savedCardLast4: null,
};

const plansData: Plan[] = [
  {
    name: "Безкоштовно",
    key: "free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "Доступ до 125 активів",
      "До 5 активів у Watchlist",
      "Алерти для 1 вибраної криптовалюти",
      "До 3 активних алертів для вибраної криптовалюти",
      "Telegram-сповіщення",
      "Базовий AI-прогноз",
      "Історія алертів до 7 днів",
    ],
    cta: "План оновлення",
    highlighted: false,
  },
  {
    name: "Про",
    key: "pro",
    monthlyPrice: 7,
    yearlyPrice: 70,
    features: [
      "Все з Free +",
      "До 15 активів у Watchlist",
      "Алерти для до 5 вибраних криптовалют",
      "До 5 активних алертів для кожної вибраної криптовалюти",
      "До 100 PulseAI-запитів на місяць",
      "сторія алертів до 30 днів",
      "Швидка підтримка",
    ],
    cta: "План оновлення",
    highlighted: true,
  },
  {
    name: "Преміум",
    key: "business",
    monthlyPrice: 19,
    yearlyPrice: 190,
    features: [
      "Все з Pro, +:",
      "Необмежена кількість активів у Watchlist",
      "Алерти для до 15 вибраних криптовалют",
      "Необмежена кількість активних алертів для вибраних криптовалют",
      "Необмежені PulseAI-запити",
      "Історія алертів до 3 місяців",
      "Пріоритетна підтримка",
    ],
    cta: "План оновлення",
    highlighted: false,
  },
];

const readCachedSettings = (): SettingsCache => {
  const account = readAccountCache();
  if (account) {
    const selectedPlan = plansData.findIndex((plan) => plan.key === account.planKey);
    return {
      userId: account.userId,
      selectedPlan: selectedPlan >= 0 ? selectedPlan : 0,
      isYearly: account.billingCycle === "yearly",
      savedCardLast4: account.cardLast4,
    };
  }

  if (typeof window === "undefined") return defaultSettingsCache;

  try {
    const raw = window.localStorage.getItem(settingsCacheKey);
    if (!raw) return defaultSettingsCache;

    const parsed = JSON.parse(raw) as Partial<SettingsCache>;
    return {
      selectedPlan: typeof parsed.selectedPlan === "number" ? parsed.selectedPlan : 0,
      isYearly: Boolean(parsed.isYearly),
      savedCardLast4: parsed.savedCardLast4 || null,
      userId: parsed.userId,
    };
  } catch {
    return defaultSettingsCache;
  }
};

const writeCachedSettings = (settings: SettingsCache) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(settingsCacheKey, JSON.stringify(settings));
  mergeAccountCache({
    userId: settings.userId,
    planKey: plansData[settings.selectedPlan]?.key || "free",
    billingCycle: settings.isYearly ? "yearly" : "monthly",
    cardLast4: settings.savedCardLast4,
  });
};

const VisaBadge = ({ width, height }: { width: number; height: number }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: width,
      height: height,
      borderRadius: 4,
      background: "#fff",
      overflow: "hidden",
      flexShrink: 0,
    }}
  >
    <img
      src={visaLogo}
      alt="Visa"
      style={{
        width: "140%",
        height: "140%",
        objectFit: "contain",
      }}
    />
  </div>
);

const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.1719 4.17188L17 10M14.0859 7.08594L7.58594 13.5859M7.58594 13.5859L4.67187 10.6719M7.58594 13.5859L10.5 16.5M10 17L17.5858 9.41421C18.3668 8.63316 18.3668 7.36684 17.5858 6.58579L14.5861 3.58609C13.805 2.80504 12.5387 2.80504 11.7577 3.58609L4.17187 11.1719L5.08594 16.0859L10 17Z" stroke="#A3A4B0" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;

  return (
    <div style={{ marginTop: 6, marginLeft: 14, display: "flex", alignItems: "center", gap: 7, color: "#FCA5A5", fontSize: 11, lineHeight: "16px" }}>
      <span style={{ display: "flex", width: 14, height: 14, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: 999, border: "1px solid rgba(248,113,113,0.45)", background: "rgba(239,68,68,0.1)", fontSize: 9 }}>
        !
      </span>
      <span>{message}</span>
    </div>
  );
};

interface SwitchToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SwitchToggle({ checked, onChange }: SwitchToggleProps) {
  return (
    <div 
      onClick={() => onChange(!checked)}
      style={{ 
        width: 36, 
        height: 36, 
        display: "flex", 
        alignItems: "center", 
        position: "relative", 
        cursor: "pointer" 
      }}
    >
      <div style={{
        width: "100%",
        height: 16, 
        borderRadius: 16,
        background: "rgba(255, 255, 255, 0.08)", 
        transition: "background 0.3s ease"
      }} />
      
      <div style={{
        position: "absolute",
        width: 24, 
        height: 24,
        borderRadius: "50%",
        background: checked ? "#8348C1" : "#777", 
        left: checked ? 0 : 12, 
        transition: "left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), background 0.3s ease",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
      }} />
    </div>
  );
}

export default function SettingsPage() {
  const cachedSettings = readCachedSettings();
  const [isYearly, setIsYearly] = useState(cachedSettings.isYearly);
  const [activeTab, setActiveTab] = useState<"subscriptions" | "notifications">("subscriptions");
  const [notifyWeb, setNotifyWeb] = useState(true);
  const [notifyTelegram, setNotifyTelegram] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyLang, setNotifyLang] = useState("uk");
  const [notifyCurrency, setNotifyCurrency] = useState("usd");
  const [isCancelHovered, setIsCancelHovered] = useState(false);
  const [hoveredCancelCard, setHoveredCancelCard] = useState(false);


  const [selectedPlan, setSelectedPlan] = useState<number>(cachedSettings.selectedPlan);
  const [savedCardLast4, setSavedCardLast4] = useState<string | null>(cachedSettings.savedCardLast4);
  const [isEditingCard, setIsEditingCard] = useState(!cachedSettings.savedCardLast4);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [showCVV, setShowCVV] = useState(false);
  const [cardCVV, setCardCVV] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardErrors, setCardErrors] = useState<CardErrors>({});

  const [hoveredEditBtn, setHoveredEditBtn] = useState(false);
  const [hoveredAddCard, setHoveredAddCard] = useState(false);
  const [hoveredSave, setHoveredSave] = useState(false);
  const [hoveredIconBtn, setHoveredIconBtn] = useState<string | null>(null);
  const [isEditActive, setIsEditActive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchUserData = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;
      if (userError || !user) {
        console.error("Settings auth error:", userError);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("active_plan, subscription, billing_cycle, card_last4")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.error("Settings load error:", error);
        return;
      }

      if (data) {
        const planMap: Record<string, number> = { free: 0, pro: 1, business: 2 };
        const plan = data.active_plan || data.subscription || "free";
        const nextSettings = {
          userId: user.id,
          selectedPlan: planMap[plan] ?? 0,
          isYearly: data.billing_cycle === "yearly",
          savedCardLast4: data.card_last4,
        };

        setSelectedPlan(nextSettings.selectedPlan);
        setIsYearly(nextSettings.isYearly);
        setSavedCardLast4(nextSettings.savedCardLast4);
        writeCachedSettings(nextSettings);
      }
    };

    void fetchUserData();

    return () => {
      cancelled = true;
    };
  }, []);

  const getCurrentUserId = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      alert("Сесія не знайдена. Увійдіть ще раз.");
      return null;
    }

    return user.id;
  };

  const updateSubscription = async (planIndex: number, yearly: boolean) => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const planName = plansData[planIndex].key;
    const cycle = yearly ? "yearly" : "monthly";

    const { error } = await supabase
      .from("users")
      .update({
        active_plan: planName,
        subscription: planName,
        billing_cycle: cycle,
      })
      .eq("id", userId)
      .select("id")
      .single();

    if (error) {
      console.error("Subscription update error:", error);
      alert("Не вдалося оновити підписку");
      return false;
    }

    writeCachedSettings({
      userId,
      selectedPlan: planIndex,
      isYearly: yearly,
      savedCardLast4,
    });

    return true;
  };

  const handleUpdatePlan = async (index: number) => {
    const previousPlan = selectedPlan;
    setSelectedPlan(index);

    const updated = await updateSubscription(index, isYearly);
    if (!updated) {
      setSelectedPlan(previousPlan);
      return;
    }

    if (index !== 0 && !savedCardLast4) {
      setIsEditingCard(true);
    }
  };

  const handleToggleCycle = async (newVal: boolean) => {
    const previousValue = isYearly;
    setIsYearly(newVal);

    const updated = await updateSubscription(selectedPlan, newVal);
    if (!updated) setIsYearly(previousValue);
  };

  const handleCardNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 16);
    val = val.replace(/(.{4})/g, "$1 ").trim();
    setCardNumber(val);
    setCardErrors((prev) => ({ ...prev, cardNumber: undefined, general: undefined }));
  };

  const handleExpiryChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2, 4);
    setCardExpiry(val);
    setCardErrors((prev) => ({ ...prev, cardExpiry: undefined, general: undefined }));
  };

  const validateCard = () => {
    const errors: CardErrors = {};
    const cleanCard = cardNumber.replace(/\s/g, "");
    const [monthRaw, yearRaw] = cardExpiry.split("/");
    const month = Number(monthRaw);
    const year = Number(yearRaw);

    if (cleanCard.length !== 16) {
      errors.cardNumber = "Введіть 16 цифр картки";
    }

    if (!/^\d{2}\/\d{2}$/.test(cardExpiry) || month < 1 || month > 12) {
      errors.cardExpiry = "Формат ММ/РР, місяць 01-12";
    } else {
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        errors.cardExpiry = "Термін дії вже минув";
      }
    }

    if (!/^\d{3}$/.test(cardCVV)) {
      errors.cardCVV = "Введіть 3 цифри CVV";
    }

    if (cardName.trim().length < 2) {
      errors.cardName = "Введіть ім'я на картці";
    }

    return errors;
  };

  const handleSaveCard = async () => {
    const errors = validateCard();
    setCardErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const userId = await getCurrentUserId();
    if (!userId) return;

    const last4 = cardNumber.replace(/\s/g, "").slice(-4);

    const { error } = await supabase
      .from("users")
      .update({ card_last4: last4 })
      .eq("id", userId)
      .select("id")
      .single();

    if (error) {
      console.error("Card save error:", error);
      setCardErrors({ general: "Не вдалося зберегти карту. Спробуйте ще раз." });
      return;
    }

    setSavedCardLast4(last4);
    setIsEditingCard(false);
    setCardNumber("");
    setCardExpiry("");
    setCardCVV("");
    setCardName("");
    setCardErrors({});
    writeCachedSettings({
      userId,
      selectedPlan,
      isYearly,
      savedCardLast4: last4,
    });
  };

  const handleCancelCardEdit = () => {
    setIsEditingCard(false);
    setCardNumber("");
    setCardExpiry("");
    setCardCVV("");
    setCardName("");
    setCardErrors({});
  };

  const handleDeleteCard = async () => {
    if (!window.confirm("Ви впевнені, що хочете видалити платіжні дані?")) return;

    const userId = await getCurrentUserId();
    if (!userId) return;

    const { error } = await supabase
      .from("users")
      .update({ card_last4: null })
      .eq("id", userId)
      .select("id")
      .single();

    if (error) {
      console.error("Card delete error:", error);
      alert("Не вдалося видалити карту");
      return;
    }

    setSavedCardLast4(null);
    setIsEditingCard(false);
    setCardNumber("");
    setCardExpiry("");
    setCardCVV("");
    setCardName("");
    writeCachedSettings({
      userId,
      selectedPlan,
      isYearly,
      savedCardLast4: null,
    });
  };

  const handleCancelSubscription = async () => {
    const previousPlan = selectedPlan;
    setSelectedPlan(0);

    const updated = await updateSubscription(0, false);
    if (!updated) {
      setSelectedPlan(previousPlan);
      return;
    }

    setIsYearly(false);
  };

  return (
    <div style={{ minHeight: "100%", width: "100%", background: "transparent", color: "#fff", fontFamily: "'Montserrat', sans-serif", letterSpacing: 0 }}>
      <div style={{ padding: "32px 40px", maxWidth: 1240 }}>

        {/* TABS */}
        <div style={{ display: "flex", gap: 24, borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 28 }}>
          {([["subscriptions", "Підписки"], ["notifications", "Сповіщення"]] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              style={{
                padding: "0 0 12px 0",
                fontSize: 16,
                lineHeight: "24px",
                fontWeight: 400,
                letterSpacing: 0,
                color: activeTab === id ? "#fff" : "rgba(255,255,255,0.35)",
                background: "none",
                border: "none",
                borderBottom: activeTab === id ? "2px solid #522E8B" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: -1,
                filter: activeTab === id ? "drop-shadow(0 0 8px rgba(139,92,246,0.6))" : "none",
                transition: "color 0.2s, filter 0.2s",
              }}
            >{label}</button>
          ))}
        </div>

        {activeTab === "subscriptions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <section>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 34, width: 1116 }}>
                <h2 style={{ fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: 0 }}>Підписки</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16, lineHeight: "24px", fontWeight: 400, letterSpacing: 0, color: !isYearly ? "#fff" : "rgba(255,255,255,0.35)" }}>Місяць</span>
                  <SwitchToggle checked={isYearly} onChange={handleToggleCycle} />
                  <span style={{ fontSize: 16, lineHeight: "24px", fontWeight: 400, letterSpacing: 0, color: isYearly ? "#fff" : "rgba(255,255,255,0.35)" }}>Рік</span>
                </div>
              </div>

             <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 356px)", gap: 24 }}>
                {plansData.map((plan, index) => {
                  const isSelected = selectedPlan === index;

                  return (
                    <div
                      key={plan.name}
                      onClick={() => handleUpdatePlan(index)}
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        width: 356,
                        height: 644,
                        borderRadius: 28,
                        padding: "28px 24px",
                        cursor: "pointer",
                        background: "linear-gradient(#050508, #050508) padding-box, linear-gradient(90deg, rgba(82, 46, 139, 0.32), rgba(179, 179, 179, 0.32)) border-box",
                        border: "1px solid transparent",
                        transform: isSelected ? "scale(1.04)" : "scale(1)",
                        transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
                        zIndex: isSelected ? 2 : 1,
                      }}
                    >
                      <p style={{ fontSize: 14, fontWeight: 500, letterSpacing: 0, color: "#fff", marginBottom: 12 }}>{plan.name}</p>
                      
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                        <span style={{ fontSize: 40, fontWeight: 400, letterSpacing: 0, color: "#fff" }}>€{isYearly ? plan.yearlyPrice : plan.monthlyPrice}</span>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 400, letterSpacing: 0 }}>{isYearly ? "/рік" : "/місяць"}</span>
                      </div>
                      
                      <div style={{ width:308, height: 1, background: "linear-gradient(90deg, rgba(131, 72, 193, 0) 0%, #8348C1 50%, rgba(131, 72, 193, 0) 100%)", opacity: 0.4, marginLeft: "auto", marginRight: "auto", marginBottom: 20 }} />
                      
                      <ul style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, marginBottom: 24, padding: 0, listStyle: "none" }}>
                        {plan.features.map((f) => {
                          const showBullet = !FEATURE_LINES_WITHOUT_BULLET.has(f);
                          return (
                            <li
                              key={f}
                              style={{
                                display: "flex",
                                gap: showBullet ? 10 : 0,
                                alignItems: "flex-start",
                                fontSize: 13,
                                fontWeight: 400, 
                                letterSpacing: 0,
                                color: "#fff",
                                lineHeight: 1.5,
                                marginBottom: showBullet ? 0 : 12,
                              }}
                            >
                              {showBullet ? (
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", flexShrink: 0, marginTop: 6 }} />
                              ) : null}
                              {f}
                            </li>
                          );
                        })}
                      </ul>
                      <PlanButton isSelected={isSelected} cta={plan.cta} onSelect={() => handleUpdatePlan(index)} />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* PAYMENT SECTION */}
            <div style={{ display: "flex", flexDirection: "column", gap: 17 }}>
              <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: 0 }}>Платіжні дані</h2>
             <section style={{
                  position: "relative",
                  width: 1116,
                  borderRadius: 28, // Оновлено згідно з макетом (було 20)
                  border: "1px solid transparent", // Прозорий бордер для того, щоб було видно border-box градієнт
                  background: "linear-gradient(#050506, #050506) padding-box, linear-gradient(90deg, rgba(82, 46, 139, 0.32) 0%, rgba(179, 179, 179, 0.32) 100%) border-box",
                  backdropFilter: "blur(18px)",
                  padding: "24px",
                  overflow: "hidden",
            boxShadow: "0 20px 100px rgba(131, 72, 193, 0.15), 0 8px 25px rgba(0, 0, 0, 0.1)",
                }}>
                
                <div style={{ position: "absolute", right: 24, top: 192, zIndex: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCardErrors({});
                      setIsEditingCard(true);
                    }}
                    onMouseEnter={() => setHoveredEditBtn(true)}
                    onMouseLeave={() => {
                      setHoveredEditBtn(false);
                      setIsEditActive(false);
                    }}
                    onMouseDown={() => setIsEditActive(true)}
                    onMouseUp={() => setIsEditActive(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      width: 135,
                      height: 36,
                      borderRadius: 28,
                      border: "1px solid transparent",
                      cursor: "pointer",
                      background: hoveredEditBtn
                        ? "linear-gradient(#0B0B0D, #0B0B0D) padding-box, linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%) border-box"
                        : "linear-gradient(#050506, #050506) padding-box, linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%) border-box",
                      color: hoveredEditBtn || isEditActive ? "#FFFFFF" : "#A3A4B0",
                      transition: "all 0.3s ease",
                      transform: isEditActive ? "scale(0.95)" : hoveredEditBtn ? "scale(1.05)" : "scale(1)",
                      boxShadow: hoveredEditBtn ? "0 0 15px rgba(131, 72, 193, 0.4)" : "none",
                      outline: "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        width: "100%",
                        height: "100%",
                        borderRadius: 999,
                        background: hoveredEditBtn ? "#0B0B0D" : "#050506",
                        color: hoveredEditBtn || isEditActive ? "#FFFFFF" : "#A3A4B0",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 400 }}>Редагувати</span>
                      <div style={{
                        display: "flex",
                        color: hoveredEditBtn || isEditActive ? "#FFFFFF" : "#A3A4B0",
                        transition: "color 0.3s ease"
                      }}>
                        <EditIcon />
                      </div>
                    </div>
                  </button>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 520, position: "relative" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 400, letterSpacing: 0, color: "#A3A4B0", marginBottom: 6 }}>Наступна оплата</p>
                    <p style={{ fontSize: 16, fontWeight: 400, letterSpacing: 0, marginBottom: 12 }}>
                      {selectedPlan !== 0 && savedCardLast4 
                        ? (isYearly ? "17 травня 2027 р." : "17 червня 2026 р.") 
                        : "Не заплановано"}
                    </p>
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      borderRadius: 28,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "linear-gradient(#050506, #050506) padding-box, linear-gradient(90deg, rgba(82, 46, 139, 0.32) 0%, rgba(179, 179, 179, 0.32) 100%) border-box",
                      padding: "8px 16px",
                    }}>
                      <VisaBadge width={24.48} height={14.53} />
                      <span style={{ fontSize: 13, fontWeight: 400, letterSpacing: 0, color: "rgba(255,255,255,0.65)",  }}>
                        {savedCardLast4 ? `**** **** **** ${savedCardLast4}` : "Картку не додано"}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    width: "1116px",
                    height: "1px",
                    background: "linear-gradient(90deg, #522E8B 0%, rgba(179, 179, 179, 0.1) 100%)",
                    opacity: 0.32,
                    marginLeft: "-28px",
                    marginTop: "10px",
                    marginBottom: "10px",
                  }} />

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 300, letterSpacing: 0, color: "white", marginBottom: 8 }}>Номер картки</label>
                    <div style={{
                      position: "relative",
                      width: 448,
                      borderRadius: 28,
                      border: "1px solid transparent",
                      background: cardErrors.cardNumber ? inputBgError : inputBgQuiet,
                      boxShadow: cardErrors.cardNumber ? "0 0 14px rgba(239,68,68,0.14)" : "none",
                      transition: "background 0.2s, box-shadow 0.2s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 18px", height: 42, width: 448,  }}>
                       <input
                       
                          type="text"
                          value={isEditingCard ? cardNumber : savedCardLast4 ? `**** **** **** ${savedCardLast4}` : cardNumber}
                          onChange={handleCardNumberChange}
                          onFocus={() => setIsEditingCard(true)}
                          maxLength={19}
                          placeholder="1111 2222 3333 4444"
                          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 400, letterSpacing: 0 }}
                        />
                        <VisaBadge width={30} height={20} />
                      </div>
                    </div>
                    <FieldError message={cardErrors.cardNumber} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "216px 216px", gap: 16, width: 448 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 400, letterSpacing: 0, color: "rgba(255,255,255,0.35)"}}>Термін дії</label>
                      <div style={{
                        width: 216,
                        borderRadius: 28,
                        border: "1px solid transparent",
                        background: cardErrors.cardExpiry ? inputBgError : inputBgQuiet,
                        boxShadow: cardErrors.cardExpiry ? "0 0 14px rgba(239,68,68,0.14)" : "none",
                        transition: "background 0.2s, box-shadow 0.2s",
                      }}>
                        <input
                          type="text"
                          value={isEditingCard ? cardExpiry : savedCardLast4 ? "**/**" : cardExpiry}
                          onChange={handleExpiryChange}
                          onFocus={() => setIsEditingCard(true)}
                          maxLength={5}
                          placeholder="ММ/РР"
                          style={{ width: 216, height: 44, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14, fontWeight: 400, letterSpacing: 0, padding: "0 18px", boxSizing: "border-box" }}
                        />
                      </div>
                      <FieldError message={cardErrors.cardExpiry} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 400, letterSpacing: 0, color: "rgba(255,255,255,0.35)"}}>CVV</label>
                      <div style={{
                        width: 216,
                        borderRadius: 28,
                        border: "1px solid transparent",
                        background: cardErrors.cardCVV ? inputBgError : inputBgQuiet,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 18px",
                        height: 44,
                        boxSizing: "border-box",
                        boxShadow: cardErrors.cardCVV ? "0 0 14px rgba(239,68,68,0.14)" : "none",
                        transition: "background 0.2s, box-shadow 0.2s",
                      }}>
                        <input
                          type={showCVV ? "text" : "password"}
                          value={isEditingCard ? cardCVV : cardCVV}
                          onChange={(e) => {
                            setCardCVV(e.target.value.replace(/\D/g, "").slice(0, 3));
                            setCardErrors((prev) => ({ ...prev, cardCVV: undefined, general: undefined }));
                          }}
                          onFocus={() => setIsEditingCard(true)}
                          placeholder="***"
                          maxLength={3}
                          style={{ 
                            flex: 1, 
                            background: "transparent", 
                            border: "none", 
                            outline: "none", 
                            color: "#fff", 
                            fontSize: 14, 
                            fontWeight: 400, 
                            letterSpacing: 0,
                            width: "100%",
                            position: "relative",
                            top: cardCVV === "" ? "4px" : "0px"
                          }}
                        />
                        
                        <button
                          type="button"
                          onClick={() => setShowCVV(!showCVV)}
                          style={{
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            marginLeft: 8,
                            color: "#A3A4B0",
                            transition: "color 0.2s"
                          }}
                        >
                          {showCVV ? (
                            <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1.5 6C1.5 6 5 1.5 9 1.5C13 1.5 16.5 6 16.5 6C16.5 6 13 10.5 9 10.5C5 10.5 1.5 6 1.5 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="9" cy="6" r="2.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="18" height="9" viewBox="0 0 18 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1.5 1.5C1.5 1.5 5.5 6 9 6C12.5 6 16.5 1.5 16.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M9 6V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M4.5 4.5L2.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M13.5 4.5L15.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      </div>
                      <FieldError message={cardErrors.cardCVV} />
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 400,
                      letterSpacing: 0,
                      color: "rgba(255,255,255,0.35)",
                      marginBottom: 8,
                    }}>
                      Ім'я на картці
                    </label>
                   <div style={{
                      width: 448,
                      borderRadius: 28,
                      border: "1px solid transparent",
                      background: cardErrors.cardName ? inputBgError : inputBgQuiet,
                      boxShadow: cardErrors.cardName ? "0 0 14px rgba(239,68,68,0.14)" : "none",
                      transition: "background 0.2s, box-shadow 0.2s",
                    }}>
                      <input
                        type="text"
                        value={isEditingCard ? cardName : savedCardLast4 ? "Власник картки" : cardName}
                        onChange={(e) => {
                          setCardName(e.target.value.toUpperCase());
                          setCardErrors((prev) => ({ ...prev, cardName: undefined, general: undefined }));
                        }}
                        onFocus={() => setIsEditingCard(true)}
                        placeholder="Ім'я на картці"
                        style={{
                          height: 42,
                          width: 448,
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          color: "#fff",
                          fontSize: 14,
                          fontWeight: 400,
                          letterSpacing: 0,
                          padding: "0 20px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <FieldError message={cardErrors.cardName} />
                  </div>

                  <FieldError message={cardErrors.general} />

                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: 16 }}>
                    <button
  type="button"
  onClick={isEditingCard ? handleSaveCard : () => {
    setCardErrors({});
    setIsEditingCard(true);
  }}
  onMouseEnter={() => setHoveredAddCard(true)}
  onMouseLeave={() => setHoveredAddCard(false)}
  style={{
    width: "216px",
    height: "44px",
    borderRadius: 999,
    background: gradientFill,
    border: "none",
    color: "#fff",
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: 0,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Montserrat', sans-serif",
    boxShadow: "none",
    // Оновлена анімація:
    transform: hoveredAddCard ? "translateY(-1px) scale(1.05)" : "none",
    transition: "all 0.3s ease",
  }}
>
  {isEditingCard ? "Зберегти" : savedCardLast4 ? "Оновити карту" : "Додати карту"}
</button>

                    {isEditingCard && (
                     <button
  type="button"
  onClick={handleCancelCardEdit}
  onMouseEnter={() => setHoveredCancelCard(true)}
  onMouseLeave={() => setHoveredCancelCard(false)}
  style={{
    width: "168px",
    height: "44px",
    borderRadius: 999,
    border: "1px solid transparent",
    background: cancelGradientBorder,
    color: "#A3A4B0",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'Montserrat', sans-serif",
    boxShadow: "none",
    // Анімація: transition-all (всі властивості), duration-300 (0.3s), hover:scale-105 (збільшення до 1.05)
    transition: "all 0.3s ease",
    transform: hoveredCancelCard ? "scale(1.05)" : "scale(1)",
  }}
>
  Скасувати
</button>
                    )}

                    {isEditingCard && savedCardLast4 && (
                      <button
                        type="button"
                        onClick={handleDeleteCard}
                        style={{
                          borderRadius: 999,
                          border: "1px solid rgba(239, 68, 68, 0.4)",
                          background: "transparent",
                          color: "rgb(239, 68, 68)",
                          padding: "10px 20px",
                          fontSize: 13,
                          fontWeight: 400,
                          cursor: "pointer",
                        }}
                      >
                        Видалити
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* HISTORY SECTION */}
            <section>
              <h2 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 21px 0", letterSpacing: 0 }}>Історія платежів</h2>
              
              
              <div style={{
                position: "relative",
                width: 1116,
                borderRadius: 28,
                background: "#050506", 
                border: "none",
                backdropFilter: "blur(18px)",
                boxSizing: "border-box",
                overflow: "hidden",
            boxShadow: "0 20px 100px rgba(131, 72, 193, 0.15), 0 8px 25px rgba(0, 0, 0, 0.1)",
              }}>

                {/* 1. ВЕРХНЯ ОБВОДКА (Хедер) - обводка зверху, зліва і справа */}
  <div style={{
    position: "absolute",
    top: 0, 
    left: 0, 
    width: "100%", 
    height: 57,
    padding: "1px",
    borderRadius: "28px 28px 0 0",
    background: "linear-gradient(90deg, rgba(179,179,179,0.03) 0%, rgba(82, 46, 139, 0.32) 100%)",
    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
    pointerEvents: "none",
    zIndex: 4,
    boxSizing: "border-box", // Тепер рамка не вилазить за краї, кути будуть цілими
  }} />

  {/* 2. НИЖНЯ ОБВОДКА (Тіло таблиці) - обводка знизу, зліва і справа */}
  <div style={{
    position: "absolute",
    top: 57,      // Стикається точно з хедером
    bottom: 0,    // Йде до самого низу
    left: 0, 
    width: "100%", 
    padding: "0 1px 1px 1px", // 0 для верху, 1px товщина для боків і низу
    borderRadius: "0 0 28px 28px",
    background: "linear-gradient(90deg, rgba(82, 46, 139, 0.32) 0%, rgba(179, 179, 179, 0.32) 100%)",
    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
    pointerEvents: "none",
    zIndex: 4,
    boxSizing: "border-box",
  }} />
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "57px",
                  borderRadius: "28px 28px 0 0",
                  background: "linear-gradient(270deg, #010315 0%, #342662 54%, #6043A4 100%)",
                  opacity: 0.2,
                  pointerEvents: "none",
                  zIndex: 1,
                }} />

                <div style={{
                  position: "relative",
                  width: "100%",
                  zIndex: 3
                }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ height: "57px", color: "#A3A4B0", fontSize: "14px", fontWeight: 400 }}>
                        {["Назва плану", "Вартість", "Картка", "Дата покупки", "Дата завершення", "Дії"].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "0 24px",
                              fontWeight: 400,
                              letterSpacing: 0,
                              whiteSpace: "nowrap",
                              verticalAlign: "middle"
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody style={{ background: "#050506" }}>
                      {selectedPlan !== 0 && savedCardLast4 ? (
                        <tr style={{ background: "#050506" }}>
                          <td style={{ padding: "20px 24px", fontSize: 14, letterSpacing: 0, color: "rgba(255,255,255,0.6)" }}>План "{plansData[selectedPlan].name}"</td>
                          <td style={{ padding: "20px 24px", fontSize: 14, letterSpacing: 0, color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>{isYearly ? plansData[selectedPlan].yearlyPrice : plansData[selectedPlan].monthlyPrice} EUR</td>
                          <td style={{ padding: "20px 24px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 13, letterSpacing: 0, color: "rgba(255,255,255,0.55)" }}>**** **** **** {savedCardLast4}</span>
                            </div>
                          </td>
                          <td style={{ padding: "20px 24px", fontSize: 14, letterSpacing: 0, color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>17.05.2026</td>
                          <td style={{ padding: "20px 24px", fontSize: 14, letterSpacing: 0, color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>{isYearly ? "17.05.2027" : "17.06.2026"}</td>
                          <td style={{ padding: "20px 24px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                              {["download", "link"].map((key) => (
                                <button
                                  key={key}
                                  type="button"
                                  onMouseEnter={() => setHoveredIconBtn(key)}
                                  onMouseLeave={() => setHoveredIconBtn(null)}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 40,
                                    height: 40,
                                    padding: "1px",
                                    borderRadius: "50%",
                                    border: "none",
                                    cursor: "pointer",
                                    background: "linear-gradient(90deg, rgba(179, 179, 179, 0.32), rgba(82, 46, 139, 0.32))",
                                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                    transform: hoveredIconBtn === key ? "scale(1.1)" : "scale(1)",
                                    boxShadow: hoveredIconBtn === key ? "0 0 12px rgba(131, 72, 193, 0.28)" : "none",
                                  }}
                                >
                                  <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: "50%",
                                    background: hoveredIconBtn === key ? "#0B0B0D" : "#050506",
                                    transition: "background 0.3s ease",
                                  }}>
                                    {key === "download" ? (
                                      <img src={uploadicon2} alt="download" style={{ width: "16px", height: "16px" }} />
                                    ) : (
                                      <img src={uploadicon} alt="link" style={{ width: "16px", height: "16px" }} />
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr style={{ background: "#050506" }}>
                          <td
                            colSpan={6}
                            style={{
                              padding: "40px",
                              textAlign: "center",
                              color: "rgba(255,255,255,0.4)",
                              background: "#050506",
                              border: "none",
                            }}
                          >
                            Немає історій транзакцій
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {selectedPlan !== 0 && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  onMouseEnter={() => setIsCancelHovered(true)}
                  onMouseLeave={() => setIsCancelHovered(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 201,
                    height: 44,
                    borderRadius: 28,
                    border: "1px solid transparent",
                    cursor: "pointer",
                    background: isCancelHovered
                      ? "linear-gradient(#0B0B0D, #0B0B0D) padding-box, linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%) border-box"
                      : "linear-gradient(#050506, #050506) padding-box, linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%) border-box",
                    color: "#F40000",
                    fontSize: 13,
                    fontWeight: 400,
                    fontFamily: "'Montserrat', sans-serif",
                    transition: "all 0.3s ease",
                    transform: isCancelHovered ? "scale(1.02)" : "scale(1)",
                    outline: "none",
                  }}
                >
                  Скасувати підписку
                </button>
              </div>
            )}
            
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
        <section style={{ width: "100%", maxWidth: 1116 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Сповіщення</h2>
          </div>

          <div style={{
            width: 1116,
            padding: 1,
            borderRadius: 28,
            background: "linear-gradient(90deg, rgba(82,46,139,0.32) 0%, rgba(179,179,179,0.32) 100%)",
            marginBottom: 24,
            boxShadow: "0 20px 100px rgba(131, 72, 193, 0.15), 0 8px 25px rgba(0, 0, 0, 0.1)",
          }}>
            <div style={{ 
              width: "100%", 
              height: "100%", 
              borderRadius: 27,
              background: "#050506",
              backdropFilter: "blur(18px)", 
              overflow: "hidden", 
              display: "flex", 
              flexDirection: "column", 
            }}>
              
              <div style={{ display: "flex", alignItems: "center", padding: "0 24px", height: 84, boxSizing: "border-box", flexShrink: 0 }}>
                <span style={{ fontSize: 16, color: "#fff", fontWeight: 400, flex: 1 }}>Отримувати сповіщення на цьому веб-сайті</span>
                <div style={{ marginLeft: 84 }}>
                  <SwitchToggle checked={notifyWeb} onChange={setNotifyWeb} />
                </div>
              </div>

              <div style={{ height: 1, minHeight: 1, margin: "0 24px", background: "linear-gradient(90deg, rgba(82, 46, 139, 0.32) 0%, rgba(179, 179, 179, 0.32) 100%)", flexShrink: 0 }} />

              <div style={{ display: "flex", alignItems: "center", padding: "0 24px", height: 84, boxSizing: "border-box", flexShrink: 0 }}>
                <span style={{ fontSize: 16, color: "#fff", fontWeight: 400, flex: 1 }}>Telegram сповіщення</span>
                <div style={{ marginLeft: 84 }}>
                  <SwitchToggle checked={notifyTelegram} onChange={setNotifyTelegram} />
                </div>
              </div>

              <div style={{ height: 1, minHeight: 1, margin: "0 24px", background: "linear-gradient(90deg, rgba(82, 46, 139, 0.32) 0%, rgba(179, 179, 179, 0.32) 100%)", flexShrink: 0 }} />

              <div style={{ display: "flex", alignItems: "center", padding: "0 24px", height: 84, boxSizing: "border-box", flexShrink: 0 }}>
                <span style={{ fontSize: 16, color: "#fff", fontWeight: 400, flex: 1 }}>Сповіщення електронною поштою</span>
                <div style={{ marginLeft: 84 }}>
                  <SwitchToggle checked={notifyEmail} onChange={setNotifyEmail} />
                </div>
              </div>

              <div style={{ height: 1, minHeight: 1, margin: "0 24px", background: "linear-gradient(90deg, rgba(82, 46, 139, 0.32) 0%, rgba(179, 179, 179, 0.32) 100%)", flexShrink: 0 }} />

              <div style={{ display: "flex", alignItems: "center", padding: "0 24px", height: 84, boxSizing: "border-box", flexShrink: 0 }}>
                <span style={{ fontSize: 16, color: "#fff", fontWeight: 400, flex: 1 }}>Мова сповіщень</span>
                
                <div style={{ position: "relative", minWidth: 133, marginLeft: 84 }}>
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: 28, padding: 1,
                    background: "linear-gradient(90deg, rgba(82, 46, 139, 0.32) 0%, rgba(179, 179, 179, 0.32) 100%)",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor", maskComposite: "exclude", pointerEvents: "none"
                  }} />

                  <select value={notifyLang} onChange={(e) => setNotifyLang(e.target.value)} style={{ 
                    width: "100%", height: 36, borderRadius: 28, border: "none", 
                    background: "rgba(255,255,255,0.04)",
                    color: "#fff", padding: "0 34px 0 14px", fontSize: 13, appearance: "none", cursor: "pointer", 
                    display: "block", position: "relative", zIndex: 1, outline: "none" 
                  }}>
                    <option value="uk" style={{ background: "#111" }}>Українська</option>
                    <option value="en" style={{ background: "#111" }}>English</option>
                  </select>
                  <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 2 }} width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              
              <div style={{ height: 1, minHeight: 1, margin: "0 24px", background: "linear-gradient(90deg, rgba(82, 46, 139, 0.32) 0%, rgba(179, 179, 179, 0.32) 100%)", flexShrink: 0 }} />

             <div style={{ display: "flex", alignItems: "center", padding: "0 24px", height: 84, boxSizing: "border-box", flexShrink: 0 }}>
              <span style={{ fontSize: 16, color: "#fff", fontWeight: 400, flex: 1 }}>Валюта</span>
              
              <div style={{ position: "relative", minWidth: 114, marginLeft: 84 }}>
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 28, padding: 1,
                  background: "linear-gradient(90deg, rgba(82, 46, 139, 0.32) 0%, rgba(179, 179, 179, 0.32) 100%)",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor", maskComposite: "exclude", pointerEvents: "none"
                }} />

                <select value={notifyCurrency} onChange={(e) => setNotifyCurrency(e.target.value)} style={{ 
                  width: "100%", height: 36, borderRadius: 28, border: "none", 
                  background: "rgba(255,255,255,0.04)", 
                  color: "#fff", padding: "0 34px 0 14px", fontSize: 13, appearance: "none", cursor: "pointer", 
                  display: "block", position: "relative", zIndex: 1, outline: "none" 
                }}>
                  <option value="usd" style={{ background: "#111" }}>Долар, $</option>
                  <option value="eur" style={{ background: "#111" }}>Євро, €</option>
                  <option value="uah" style={{ background: "#111" }}>Гривня, ₴</option>
                </select>
                <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 2 }} width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <button
              type="button" onMouseEnter={() => setHoveredSave(true)} onMouseLeave={() => setHoveredSave(false)}
              style={{
                height: 44, width: 216, borderRadius: 999, fontSize: 14, fontWeight: 500, cursor: "pointer", color: "#fff", border: "none",
                background: "linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%)", boxShadow: "none",
                transform: hoveredSave ? "translateY(-1px) scale(1.05)" : "none", transition: "all 0.3s ease", fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Зберегти
            </button>
          </div>
        </section>
        )}
      </div>
    </div>
  );
}

function PlanButton({ isSelected, cta, onSelect }: { isSelected: boolean; cta: string; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);

  const gradientFill = "linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%)";
  const gradientBorder = "linear-gradient(#050508, #050508) padding-box, linear-gradient(90deg, #2C1969 0%, #8348C1 52%, #FFFFFF 100%) border-box";

  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      style={{
        width: "100%",
        padding: "14px 0",
        borderRadius: 28,
        fontWeight: 500,
        letterSpacing: 0,
        cursor: "pointer",
        border: isSelected ? "none" : "1px solid transparent",
        background: isSelected ? gradientFill : gradientBorder,
        color: "#fff",
        fontFamily: "'Montserrat', sans-serif",
        boxShadow: "none",
        transform: hovered ? "translateY(-1px) scale(1.05)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      {isSelected ? "Поточний план" : cta}
    </button>
  );
}