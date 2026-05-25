import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { mergeAccountCache } from "../../utils/accountCache";
import visaLogo from "../../assets/icons/visa.svg";
import firstGradPic from "../../assets/images/first-grad-pic.svg?url";
import secondGradPic from "../../assets/images/second-grad-pic.svg?url";

interface Plan {
  name: string;
  key: "free" | "pro" | "business";
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyMonthEquiv: number | null; // ціна/місяць при річній оплаті
  yearlySaving: number | null;     // скільки економить за рік
  features: string[];
}

const FEATURE_LINES_WITHOUT_BULLET = new Set(["Все з Free, плюс:", "Все з Pro, плюс:"]);

const plansData: Plan[] = [
  {
    name: "Безкоштовно",
    key: "free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthEquiv: null,
    yearlySaving: null,
    features: [
      "Доступ до 125 активів",
      "Demo Trading ($25,000 стартовий баланс)",
      "Бектестинг стратегій",
      "До 5 активів у Watchlist",
      "Алерти для 1 криптовалюти",
      "До 3 активних алертів",
      "Telegram-сповіщення",
      "До 5 PulseAI-запитів на місяць",
      "Історія алертів до 7 днів",
    ],
  },
  {
    name: "Pro",
    key: "pro",
    monthlyPrice: 9,
    yearlyPrice: 84,
    yearlyMonthEquiv: 7,
    yearlySaving: 24,
    features: [
      "Все з Free, плюс:",
      "До 15 активів у Watchlist",
      "Алерти для 5 криптовалют",
      "До 5 активних алертів для кожної",
      "До 100 PulseAI-запитів на місяць",
      "Історія алертів до 30 днів",
      "Швидка підтримка",
    ],
  },
  {
    name: "Преміум",
    key: "business",
    monthlyPrice: 19,
    yearlyPrice: 180,
    yearlyMonthEquiv: 15,
    yearlySaving: 48,
    features: [
      "Все з Pro, плюс:",
      "Необмежений Watchlist",
      "Алерти для 15 криптовалют",
      "Необмежена кількість алертів",
      "Необмежені PulseAI-запити",
      "Історія алертів до 3 місяців",
      "Пріоритетна підтримка",
    ],
  },
];

export default function SelectPlanPage() {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [cardName, setCardName] = useState("");

  const formatCardNumber = (val: string) => val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (val: string) => {
    const v = val.replace(/\D/g, "").slice(0, 4);
    return v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v;
  };

  const saveSubscriptionToDb = async (planIndex: number, cardLast4: string | null) => {
    setLoading(true);
    try {
      const planName = plansData[planIndex].key;
      const cycle = isYearly ? "yearly" : "monthly";
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Сесія не знайдена. Увійдіть ще раз.");
        navigate("/login");
        return;
      }

      const updatePayload = {
        active_plan: planName,
        subscription: planName,
        billing_cycle: cycle,
        card_last4: cardLast4,
      };

      const { data: updated, error: updateError } = await supabase
        .from("users")
        .update(updatePayload)
        .eq("id", user.id)
        .select("id")
        .maybeSingle();

      if (updateError) throw updateError;

      if (!updated) {
        const { error: insertError } = await supabase.from("users").insert({
          id: user.id,
          email: user.email,
          hashed_password: "managed_by_supabase",
          is_active: true,
          username: user.user_metadata?.username ?? null,
          first_name: user.user_metadata?.first_name ?? null,
          last_name: user.user_metadata?.last_name ?? null,
          phone_number: user.user_metadata?.phone_number ?? null,
          birth_date: user.user_metadata?.birth_date ?? null,
          region: user.user_metadata?.region ?? null,
          ...updatePayload,
        });
        if (insertError) throw insertError;
      }

      const planActivatedAt = planIndex === 0 ? null : new Date().toISOString();
      if (planActivatedAt) {
        localStorage.setItem(`cpulse_plan_activated_${user.id}`, planActivatedAt);
      } else {
        localStorage.removeItem(`cpulse_plan_activated_${user.id}`);
      }

      mergeAccountCache({
        userId: user.id,
        email: user.email || "",
        firstName: typeof user.user_metadata?.first_name === "string" ? user.user_metadata.first_name : "",
        lastName: typeof user.user_metadata?.last_name === "string" ? user.user_metadata.last_name : "",
        username: typeof user.user_metadata?.username === "string" ? user.user_metadata.username : "",
        phoneNumber: typeof user.user_metadata?.phone_number === "string" ? user.user_metadata.phone_number : "",
        birthDate: typeof user.user_metadata?.birth_date === "string" ? user.user_metadata.birth_date : "",
        region: typeof user.user_metadata?.region === "string" ? user.user_metadata.region : "",
        planKey: planName,
        billingCycle: cycle,
        cardLast4,
        planActivatedAt,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Помилка збереження плану:", error);
      alert("Не вдалося зберегти план у базі");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async (index: number) => {
    setSelectedPlan(index);
    if (index === 0) {
      await saveSubscriptionToDb(0, null);
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanCard = cardNumber.replace(/\s/g, "");
    if (selectedPlan === null) return;
    if (cleanCard.length !== 16) return alert("Введіть коректний номер картки");
    if (cardExpiry.length !== 5) return alert("Введіть термін дії");
    if (cardCVV.length < 3) return alert("Введіть CVV");
    if (!cardName.trim()) return alert("Введіть ім'я на картці");
    await saveSubscriptionToDb(selectedPlan, cleanCard.slice(-4));
  };

  return (
    <div className="min-h-screen bg-[#010004] flex flex-col items-center justify-center relative overflow-hidden font-montserrat p-4">
      <img src={firstGradPic} alt="" className="absolute top-[-10%] -left-[10%] w-[600px] opacity-60 pointer-events-none mix-blend-screen z-0" />
      <img src={secondGradPic} alt="" className="absolute bottom-0 -right-[5%] w-[500px] opacity-50 pointer-events-none mix-blend-screen z-0" />

      <div className="z-10 w-full max-w-[1116px] text-center mb-[40px]">
        <h1 className="text-white text-[32px] font-bold">Оберіть свій план</h1>
        <p className="font-light text-[16px] text-[#A3A4B0] mt-[4px]">Цей крок обов'язковий для завершення реєстрації</p>
        <div className="flex items-center justify-center mt-8">
          <div className="flex items-center bg-white/[0.06] rounded-full p-1 gap-1 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-[14px] font-medium transition-all duration-200 ${!isYearly ? "bg-[#8348C1] text-white shadow-[0_2px_12px_rgba(131,72,193,0.4)]" : "text-white/50 hover:text-white/80"}`}
            >
              Місяць
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-[14px] font-medium transition-all duration-200 ${isYearly ? "bg-[#8348C1] text-white shadow-[0_2px_12px_rgba(131,72,193,0.4)]" : "text-white/50 hover:text-white/80"}`}
            >
              Рік
              <span className="bg-[#24FF7A]/15 text-[#24FF7A] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#24FF7A]/25 leading-none">−22%</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 z-10">
        {plansData.map((plan, index) => {
          const isSelected = selectedPlan === index;
          return (
            <div key={plan.name} onClick={() => handlePlanSelect(index)} className={`relative flex flex-col w-full md:w-[356px] h-[644px] rounded-2xl bg-[#050508] p-7 cursor-pointer transition-all border ${isSelected ? "border-[#8348C1] scale-[1.04] shadow-[0_0_32px_rgba(131,72,193,0.28)]" : "border-white/10"}`}>
              <p className="text-[13px] uppercase tracking-[0.25em] text-white mb-4">{plan.name}</p>
              {/* Price block */}
              {isYearly && plan.yearlyMonthEquiv !== null ? (
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-light text-white">€{plan.yearlyMonthEquiv.toFixed(2)}</span>
                    <span className="text-[13px] text-white/40">/міс</span>
                    <span className="text-[13px] text-white/25 line-through">€{plan.monthlyPrice}</span>
                  </div>
                  <p className="text-[11px] text-white/35 mt-1">
                    оплата €{plan.yearlyPrice}/рік
                    {plan.yearlySaving && (
                      <span className="ml-2 text-[#24FF7A] font-semibold">· економите €{plan.yearlySaving}</span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-light text-white">€{plan.monthlyPrice}</span>
                  <span className="text-[13px] text-white/40">/місяць</span>
                </div>
              )}
              <div className="h-[1px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] opacity-40 mb-6" />
              <ul className="flex-1 flex flex-col gap-3 text-[13px] text-white list-none p-0">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2.5 items-start">
                    {!FEATURE_LINES_WITHOUT_BULLET.has(f) && <span className="w-1.5 h-1.5 rounded-full bg-[#8348C1] mt-1.5 shrink-0" />}
                    {f}
                  </li>
                ))}
              </ul>
              <button disabled={loading} className={`w-full py-3.5 rounded-2xl text-[11px] font-bold tracking-widest transition-all ${isSelected ? "bg-gradient-to-r from-[#2C1969] to-[#C38BFF] text-white" : "border border-[#8348C1] border-opacity-30 text-white"}`}>
                {loading && isSelected ? "ЗБЕРЕЖЕННЯ..." : isSelected ? "ОБРАНО" : "ОБРАТИ ПЛАН"}
              </button>
            </div>
          );
        })}
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handlePaymentSubmit} className="w-full max-w-[500px] rounded-[20px] bg-[#0a0a0a] border border-white/10 p-8 shadow-[0_20px_70px_rgba(0,0,0,0.5)]">
            <h2 className="text-[22px] text-white font-medium mb-4">Додати платіжні дані</h2>

            {/* ⚠️ Payment gateway not yet connected — demo only */}
            <div className="mb-5 flex items-start gap-3 rounded-[14px] border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <span className="mt-px text-amber-400 text-[16px] leading-none shrink-0">⚠️</span>
              <p className="text-[12px] text-amber-300/90 leading-relaxed">
                <strong>Платіжна система в розробці.</strong> Реального списання коштів не відбудеться.
                Підписка буде активована без оплати для демонстрації.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-[11px] text-white/35 uppercase tracking-widest mb-2">Номер картки</label>
                <div className="flex items-center px-4 h-[44px] rounded-full border border-white/10 bg-white/5">
                  <input type="text" maxLength={19} value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} placeholder="1111 2222 3333 4444" className="flex-1 bg-transparent border-none outline-none text-white text-sm" />
                  <img src={visaLogo} alt="Visa" className="w-8 h-5 object-contain" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))} maxLength={5} placeholder="ММ/РР" className="w-full h-[44px] px-4 rounded-full border border-white/10 bg-white/5 text-white text-sm outline-none" />
                <input type="password" value={cardCVV} onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="CVV" maxLength={3} className="w-full h-[44px] px-4 rounded-full border border-white/10 bg-white/5 text-white text-sm outline-none tracking-widest" />
              </div>
              <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} placeholder="ІМ'Я НА КАРТЦІ" className="w-full h-[44px] px-4 rounded-full border border-white/10 bg-white/5 text-white text-sm outline-none uppercase" />
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 h-[44px] rounded-full border border-[#A3A4B0]/30 text-[#A3A4B0] hover:text-white transition-colors text-[13px] font-medium cursor-pointer">Скасувати</button>
              <button type="submit" disabled={loading} className="flex-1 h-[44px] rounded-full text-white text-[13px] font-medium disabled:opacity-50 cursor-pointer bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF]">
                {loading ? "Обробка..." : "Активувати план (ДЕМО)"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
