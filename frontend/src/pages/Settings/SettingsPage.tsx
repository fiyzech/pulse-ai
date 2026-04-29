import { useState } from "react";

interface Plan {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  cta: string;
  highlighted: boolean;
}

const gradientBorder =
  "linear-gradient(#0A0A0A, #0A0A0A) padding-box, linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%) border-box";

const gradientFill = "linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%)";

const plansData: Plan[] = [
  {
    name: "Безкоштовно",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "Відстеження до 60 криптовалют",
      "Оновлення даних кожних 60 секунд",
      "До 3 активних алертів",
      "Telegram сповіщення",
      "Історія сповіщень до 7 днів",
      "Базовий Dashboard",
    ],
    cta: "План оновлення",
    highlighted: false,
  },
  {
    name: "Pro",
    monthlyPrice: 7,
    yearlyPrice: 70,
    features: [
      "Все з Free +",
      "Відстеження до 100 криптовалют",
      "Оновлення даних кожні 15 секунд",
      "Повна інтеграція з Telegram",
      "Розширені типи алертів",
      "Історія сповіщень до 90 днів",
      "До 5 Watchlist",
      "Експорт даних у CSV",
      "Портфоліо трекер (прибуток/збиток)",
      "Швидка підтримка",
    ],
    cta: "План оновлення",
    highlighted: true,
  },
  {
    name: "Бізнес",
    monthlyPrice: 19,
    yearlyPrice: 190,
    features: [
      "Все з Pro, +:",
      "Необмежена кількість активів",
      "Необмежена кількість алертів",
      "Real-Time оновлення даних",
      "AI помічник",
      "Розширена аналітика",
      "API доступ для власних інтеграцій",
      "Необмежена історія даних",
      "Пріоритетна підтримка",
    ],
    cta: "План оновлення",
    highlighted: false,
  },
];

const VisaBadge = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 38,
      height: 22,
      borderRadius: 6,
      background: "#fff",
      padding: "0 4px",
      flexShrink: 0,
      overflow: "hidden",
    }}
  >
    <svg
      viewBox="0 0 256 83"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: 32, height: 11, display: "block" }}
    >
      <path d="M111.43 81.33L128.45 2H101.9L84.88 81.33H111.43ZM48.64 2L35.03 55.67C33.67 61.1 32.78 63.85 28.53 66.86C21.84 71.61 10.45 75.31 0 77.41L4.09 81.65C18.66 82.8 30.01 80.6 39.52 75.64C46.99 71.74 49.33 66.45 51.58 55.65L68.73 2H48.64ZM198.81 54.34C198.92 33.72 170.19 32.55 170.4 22.46C170.47 19.46 173.35 16.14 180.12 15.35C183.5 14.96 191.24 14.58 199.11 18.25L203.45 4.31C199.21 2.76 193.38 1.11 186.2 1.11C167.31 1.11 153.94 11.23 153.79 26.83C153.64 38.39 164.21 44.82 172.48 48.87C180.99 53.03 183.87 55.68 183.82 59.41C183.74 65.05 176.99 67.57 170.83 67.66C161.42 67.8 155.08 65.11 149.9 62.68L145.41 77.06C149.65 79.03 157.42 80.78 165.51 80.89C185.58 80.89 198.71 70.93 198.81 54.34ZM255.45 81.33L238.86 2H221.78C216.92 2 213.15 4.67 211.23 9.17L180.76 81.33H207.7L213.09 66.41H246.01L249.12 81.33H255.45ZM220.5 46.42L233.91 10.02L241.13 46.42H220.5Z" fill="#1A1F71"/>
    </svg>
  </div>
);

const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.1719 4.17188L17 10M14.0859 7.08594L7.58594 13.5859M7.58594 13.5859L4.67187 10.6719M7.58594 13.5859L10.5 16.5M10 17L17.5858 9.41421C18.3668 8.63316 18.3668 7.36684 17.5858 6.58579L14.5861 3.58609C13.805 2.80504 12.5387 2.80504 11.7577 3.58609L4.17187 11.1719L5.08594 16.0859L10 17Z" stroke="#A3A4B0" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

function SwitchToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        width: 48,
        height: 26,
        borderRadius: 999,
        border: checked ? "1px solid rgba(131,72,193,0.45)" : "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        padding: 3,
        cursor: "pointer",
        flexShrink: 0,
        transition: "border-color 0.2s",
      }}
    >
      <span style={{
        display: "block",
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: checked ? "#8348C1" : "rgba(255,255,255,0.28)",
        transform: checked ? "translateX(22px)" : "translateX(0)",
        transition: "transform 0.2s",
      }} />
    </button>
  );
}

export default function SettingsPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [activeTab, setActiveTab] = useState<"subscriptions" | "notifications">("subscriptions");
  const [notifyWeb, setNotifyWeb] = useState(true);
  const [notifyTelegram, setNotifyTelegram] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyLang, setNotifyLang] = useState("uk");
  const [notifyCurrency, setNotifyCurrency] = useState("usd");

  return (
    <div style={{ minHeight: "100%", width: "100%", background: "transparent", color: "#fff", fontFamily: "'Montserrat', sans-serif" }}>
      <div style={{ padding: "32px 40px", maxWidth: 1240 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 18px" }}>Налаштування</h1>

        {/* Таби */}
        <div style={{ display: "flex", gap: 24, borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 28 }}>
          {([["subscriptions", "Підписки"], ["notifications", "Сповіщення"]] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              style={{
                paddingBottom: 12,
                fontSize: 15,
                fontWeight: 600,
                color: activeTab === id ? "#fff" : "rgba(255,255,255,0.35)",
                background: "none",
                border: "none",
                borderBottom: activeTab === id ? "2px solid #8b5cf6" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: -1,
                filter: activeTab === id ? "drop-shadow(0 0 8px rgba(139,92,246,0.6))" : "none",
              }}
            >{label}</button>
          ))}
        </div>

        {/* ПІДПИСКИ */}
        {activeTab === "subscriptions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24}}>

            {/* Плани */}
            <section>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 34 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Підписки</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: !isYearly ? "#fff" : "rgba(255,255,255,0.35)" }}>Місяць</span>
                  <SwitchToggle checked={isYearly} onChange={setIsYearly} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: isYearly ? "#fff" : "rgba(255,255,255,0.35)" }}>Рік</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 356px)", gap: 24 }}>
                {plansData.map((plan) => (
                  <div
                    key={plan.name}
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      width: 356,
                      height: 644,
                      borderRadius: 20,
                      border: plan.highlighted ? "1px solid rgba(131,72,193,0.5)" : "1px solid rgba(255,255,255,0.08)",
                      background: "#050508",
                      padding: "28px 24px",
                      minHeight: 520,
                      boxShadow: plan.highlighted ? "0 0 40px rgba(131,72,193,0.15)" : "none",
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.25em", color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>{plan.name}</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                      <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-1px" }}>€{isYearly ? plan.yearlyPrice : plan.monthlyPrice}</span>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>{isYearly ? "/рік" : "/місяць"}</span>
                    </div>
                    <div style={{ height: 1, background: "linear-gradient(90deg, #2C1969, #8348C1, #C38BFF)", opacity: 0.4, marginBottom: 20 }} />
                    <ul style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, marginBottom: 24, padding: 0, listStyle: "none" }}>
                      {plan.features.map((f) => (
                        <li key={f} style={{ display: "flex", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#8348C1", flexShrink: 0, marginTop: 6 }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      style={{
                        width: "100%",
                        padding: "14px 0",
                        borderRadius: 14,
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        cursor: "pointer",
                        border: plan.highlighted ? "none" : "1px solid transparent",
                        background: plan.highlighted ? gradientFill : gradientBorder,
                        color: "#fff",
                      }}
                    >{plan.cta}</button>
                  </div>
                ))}
              </div>
            </section>

            <h2 style={{ fontSize: 22, fontWeight: 700, margin: "12px 0" }}>Платіжні дані</h2>
            <section style={{
              position: "relative",
              width: 1116,
              height: 494,
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(10,10,10,0.55)",
              backdropFilter: "blur(18px)",
              padding: "32px 28px",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute",
                inset: "auto -140px -220px -140px",
                height: 360,
                background: "radial-gradient(closest-side, rgba(131,72,193,0.35), rgba(131,72,193,0) 70%)",
                filter: "blur(8px)",
                pointerEvents: "none",
              }} />
              <div style={{ position: "absolute", right: 28, top: 26, zIndex: 2 }}>
                <button type="button" style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: 135, height: 36, borderRadius: 999,
                  border: "1px solid transparent",
                  background: gradientBorder,
                  color: "#A3A4B0", fontSize: 14, fontWeight: 400, cursor: "pointer",
                  justifyContent: "center",
                }}>
                  Редагувати <EditIcon />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 520, position: "relative" }}>
                {/* Наступна оплата */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>Наступна оплата</p>
                  <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>17 червня 2026 р.</p>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 10, borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "8px 16px" }}>
                    <VisaBadge />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em" }}>**** **** **** 3421</span>
                  </div>
                </div>

                {/* Номер картки */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Номер картки</label>
                  <div style={{ position: "relative", width: 448, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", height: 44 }}>
                      <input type="text" defaultValue="1111 2222 3333 4444" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14, fontWeight: 600 }} />
                      <VisaBadge />
                    </div>
                  </div>
                </div>

                {/* Термін дії + CVV */}
                <div style={{ display: "grid", gridTemplateColumns: "216px 216px", gap: 16, width: 448 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Термін дії</label>
                    <div style={{ width: 216, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                      <input type="text" placeholder="ММ/РР" style={{ width: "100%", height: 44, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14, fontWeight: 600, padding: "0 14px", boxSizing: "border-box" }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>CVV</label>
                    <div style={{ width: 216, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", padding: "0 14px", height: 44 }}>
                      <input type="password" placeholder="****" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14, fontWeight: 600 }} />
                      <svg width="22" height="14" viewBox="0 0 22 14" fill="none" style={{ flexShrink: 0, cursor: "pointer", opacity: 0.5 }}>
                        <path d="M2 3C4 7 8 11 11 11C14 11 18 7 20 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        <path d="M5 8L3.5 11" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        <path d="M11 11V14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        <path d="M17 8L18.5 11" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Ім'я на картці */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Ім'я на картці</label>
                  <div style={{ width: 448, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                    <input type="text" placeholder="Текст" style={{ width: "100%", height: 44, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14, fontWeight: 600, padding: "0 14px", boxSizing: "border-box" }} />
                  </div>
                </div>

                {/* Кнопки */}
                <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                  <button type="button" style={{
                    borderRadius: 999, padding: "12px 32px",
                    background: gradientFill,
                    border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.15em", cursor: "pointer",
                  }}>Зберегти</button>
                  <button type="button" style={{
                    borderRadius: 999, padding: "12px 24px",
                    border: "1px solid transparent",
                    background: gradientBorder,
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.15em", cursor: "pointer",
                  }}>Додати картку</button>
                </div>
              </div>
            </section>

            {/* Історія платежів */}
            <section>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: "12px 0" }}>Історія платежів</h2>
              <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(10,10,10,0.6)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                      {["Назва плану", "Вартість", "Картка", "Дата покупки", "Дата завершення", "Дії"].map((h) => (
                        <th key={h} style={{ padding: "16px 24px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "20px 24px", fontSize: 14, color: "rgba(255,255,255,0.6)" }}>План "PRO"</td>
                      <td style={{ padding: "20px 24px", fontSize: 14, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>7 EUR</td>
                      <td style={{ padding: "20px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <VisaBadge />
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>**** **** **** 3421</span>
                        </div>
                      </td>
                      <td style={{ padding: "20px 24px", fontSize: 14, color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>17.05.2026</td>
                      <td style={{ padding: "20px 24px", fontSize: 14, color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>17.06.2026</td>
                      <td style={{ padding: "20px 24px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button type="button" style={{ display: "inline-flex", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", padding: 8, cursor: "pointer" }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                            </svg>
                          </button>
                          <button type="button" style={{ display: "inline-flex", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", padding: 8, cursor: "pointer" }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 20 }}>
                <button type="button" style={{
                  borderRadius: 999, border: "1px solid rgba(239,68,68,0.4)",
                  background: "transparent", color: "rgb(239,68,68)",
                  padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>Скасувати підписку</button>
              </div>
            </section>
          </div>
        )}

        {/* СПОВІЩЕННЯ */}
        {activeTab === "notifications" && (
          <div style={{ maxWidth: 760 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Сповіщення</h2>
              <button type="button" style={{
                borderRadius: 999,
                border: "none",
                background: gradientFill,
                color: "#fff",
                padding: "10px 28px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}>Зберегти</button>
            </div>

           <div style={{
               position: "relative",
              width: 1116,
              height: 260,
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(10,10,10,0.55)",
              backdropFilter: "blur(18px)",
              overflow: "hidden",
              }}>
              <div style={{
                position: "absolute",
                inset: "auto -120px -220px -120px",
                height: 360,
                background: "radial-gradient(closest-side, rgba(131,72,193,0.35), rgba(131,72,193,0) 70%)",
                filter: "blur(8px)",
                pointerEvents: "none",
              }} />
              {[
                { label: "Отримувати сповіщення на цьому веб-сайті", checked: notifyWeb, onChange: setNotifyWeb },
                { label: "Telegram сповіщення", checked: notifyTelegram, onChange: setNotifyTelegram },
                { label: "Сповіщення електронною поштою", checked: notifyEmail, onChange: setNotifyEmail },
              ].map(({ label, checked, onChange }, i, arr) => (
                <div key={label} style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 24px", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <span style={{ fontSize: 15, color: "rgba(255,255,255,0.9)" }}>{label}</span>
                  <SwitchToggle checked={checked} onChange={onChange} />
                </div>
              ))}
              {/* Мова */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 15, color: "rgba(255,255,255,0.9)" }}>Мова сповіщень</span>
                <div style={{ position: "relative", minWidth: 138 }}>
                  <select value={notifyLang} onChange={(e) => setNotifyLang(e.target.value)} style={{ width: "100%", height: 32, borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff", padding: "0 30px 0 14px", fontSize: 12, fontWeight: 500, outline: "none", appearance: "none", cursor: "pointer" }}>
                    <option value="uk">Українська</option>
                    <option value="en">English</option>
                  </select>
                  <svg style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.45 }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              {/* Валюта */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 15, color: "rgba(255,255,255,0.9)" }}>Валюта</span>
                <div style={{ position: "relative", minWidth: 120 }}>
                  <select value={notifyCurrency} onChange={(e) => setNotifyCurrency(e.target.value)} style={{ width: "100%", height: 32, borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff", padding: "0 30px 0 14px", fontSize: 12, fontWeight: 500, outline: "none", appearance: "none", cursor: "pointer" }}>
                    <option value="usd">Долар, $</option>
                    <option value="eur">Євро, €</option>
                    <option value="uah">Гривня, ₴</option>
                  </select>
                  <svg style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.45 }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}