import { useState } from "react";
import visaLogo from '../../assets/icons/visa.svg';

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

const FEATURE_LINES_WITHOUT_BULLET = new Set(["Все з Free +", "Все з Pro, +:"]);

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
    <path d="M11.1719 4.17188L17 10M14.0859 7.08594L7.58594 13.5859M7.58594 13.5859L4.67187 10.6719M7.58594 13.5859L10.5 16.5M10 17L17.5858 9.41421C18.3668 8.63316 18.3668 7.36684 17.5858 6.58579L14.5861 3.58609C13.805 2.80504 12.5387 2.80504 11.7577 3.58609L4.17187 11.1719L5.08594 16.0859L10 17Z" stroke="#A3A4B0" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

function SwitchToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const trackW = 48;
  const trackH = 26;
  const knob = 20;
  const pad = 3;
  const travel = trackW - pad * 2 - knob;

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: trackW,
        height: trackH,
        borderRadius: 999,
        background: checked ? "rgba(60, 60, 67, 0.35)" : "rgba(255, 255, 255, 0.1)",
        border: "none",
        padding: pad,
        cursor: "pointer",
        flexShrink: 0,
        transition: "background-color 0.2s",
      }}
    >
      <span
        style={{
          display: "block",
          width: knob,
          height: knob,
          borderRadius: "50%",
          background: "#8348C1",
          transform: checked ? `translateX(${travel}px)` : "translateX(0)",
          transition: "transform 0.2s ease",
          boxShadow: "0 0 8px rgba(131, 72, 193, 0.4)",
          flexShrink: 0,
        }}
      />
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
  const [isCancelHovered, setIsCancelHovered] = useState(false);

  // --- НОВІ СТАНИ ---
  const [selectedPlan, setSelectedPlan] = useState<number>(1); // Pro вибраний за замовчуванням
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);
  const [hoveredEditBtn, setHoveredEditBtn] = useState(false);
  const [hoveredAddCard, setHoveredAddCard] = useState(false);
  const [hoveredSave, setHoveredSave] = useState(false);
  const [hoveredIconBtn, setHoveredIconBtn] = useState<string | null>(null);

  return (
    <div style={{ minHeight: "100%", width: "100%", background: "transparent", color: "#fff", fontFamily: "'Montserrat', sans-serif" }}>
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
                color: activeTab === id ? "#fff" : "rgba(255,255,255,0.35)",
                background: "none",
                border: "none",
                borderBottom: activeTab === id ? "2px solid #8b5cf6" : "2px solid transparent",
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
                <h2 style={{ fontSize: 24, fontWeight: 400, margin: 0 }}>Підписки</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16, lineHeight: "24px", fontWeight: 400, color: !isYearly ? "#fff" : "rgba(255,255,255,0.35)" }}>Місяць</span>
                  <SwitchToggle checked={isYearly} onChange={setIsYearly} />
                  <span style={{ fontSize: 16, lineHeight: "24px", fontWeight: 400, color: isYearly ? "#fff" : "rgba(255,255,255,0.35)" }}>Рік</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 356px)", gap: 24 }}>
                {plansData.map((plan, index) => {
                  const isSelected = selectedPlan === index;
                  const isHovered = hoveredPlan === index && !isSelected;

                  return (
                    <div
                      key={plan.name}
                      onClick={() => setSelectedPlan(index)}
                      onMouseEnter={() => setHoveredPlan(index)}
                      onMouseLeave={() => setHoveredPlan(null)}
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        width: 356,
                        height: 644,
                        borderRadius: 20,
                        // Бордер: вибраний = яскравий, hover = середній, звичайний = тихий
                        border: isSelected
                          ? "1px solid rgba(131,72,193,0.85)"
                          : isHovered
                            ? "1px solid rgba(131,72,193,0.4)"
                            : "1px solid rgba(255,255,255,0.08)",
                        background: "#050508",
                        padding: "28px 24px",
                        cursor: "pointer",
                        // Вибраний план більший + свічення
                        transform: isSelected ? "scale(1.04)" : "scale(1)",
                        boxShadow: isSelected
                          ? "0 0 32px rgba(131,72,193,0.28)"
                          : isHovered
                            ? "0 0 14px rgba(131,72,193,0.12)"
                            : "none",
                        transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
                        zIndex: isSelected ? 2 : 1,
                      }}
                    >
                      <p style={{ fontSize: 13, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.25em", color: "#fff", marginBottom: 16 }}>{plan.name}</p>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                        <span style={{ fontSize: 42, fontWeight: 400, letterSpacing: "-1px", color: "#fff" }}>€{isYearly ? plan.yearlyPrice : plan.monthlyPrice}</span>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>{isYearly ? "/рік" : "/місяць"}</span>
                      </div>
                      <div style={{ height: 1, background: "linear-gradient(90deg, #2C1969, #8348C1, #C38BFF)", opacity: 0.4, marginBottom: 20 }} />
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
                                color: "#fff",
                                lineHeight: 1.5,
                              }}
                            >
                              {showBullet ? (
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#8348C1", flexShrink: 0, marginTop: 6 }} />
                              ) : null}
                              {f}
                            </li>
                          );
                        })}
                      </ul>
                      <PlanButton isSelected={isSelected} cta={plan.cta} onSelect={() => setSelectedPlan(index)} />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* PAYMENT SECTION */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h2 style={{ fontSize: 22, fontWeight: 400, margin: 0 }}>Платіжні дані</h2>
              <section style={{
                position: "relative",
                width: 1116,
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(10,10,10,0.55)",
                backdropFilter: "blur(18px)",
                padding: "32px 28px",
                overflow: "hidden",
              }}>
                <div style={{ position: "absolute", right: 28, top: 26, zIndex: 2 }}>
                  <button
                    type="button"
                    onMouseEnter={() => setHoveredEditBtn(true)}
                    onMouseLeave={() => setHoveredEditBtn(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: 135, height: 36, borderRadius: 999,
                      border: "1px solid transparent",
                      background: gradientBorder,
                      color: hoveredEditBtn ? "#C38BFF" : "#A3A4B0",
                      fontSize: 14, fontWeight: 400, cursor: "pointer",
                      justifyContent: "center",
                      boxShadow: hoveredEditBtn ? "0 0 16px rgba(131,72,193,0.45)" : "none",
                      transform: hoveredEditBtn ? "translateY(-1px)" : "none",
                      transition: "color 0.2s, box-shadow 0.2s, transform 0.15s",
                    }}
                  >
                    Редагувати <EditIcon />
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 520, position: "relative" }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>Наступна оплата</p>
                    <p style={{ fontSize: 16, fontWeight: 400, marginBottom: 10 }}>17 червня 2026 р.</p>
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      borderRadius: 28,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.02)",
                      padding: "8px 16px",
                    }}>
                      <VisaBadge width={24.48} height={14.53} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em" }}>**** **** **** 3421</span>
                    </div>
                  </div>

                  <div style={{
                    width: "1116px",
                    height: "1px",
                    background: "rgba(255, 255, 255, 0.08)",
                    marginLeft: "-28px",
                    marginTop: "10px",
                    marginBottom: "10px",
                  }} />

                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Номер картки</label>
                    <div style={{
                      position: "relative",
                      width: 448,
                      borderRadius: 28,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.02)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 18px", height: 42, width: 448 }}>
                        <input type="text" defaultValue="1111 2222 3333 4444" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 400 }} />
                        <VisaBadge width={30} height={20} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "216px 216px", gap: 16, width: 448 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Термін дії</label>
                      <div style={{
                        width: 216,
                        borderRadius: 28,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.02)",
                      }}>
                        <input type="text" placeholder="ММ/РР" style={{ width: 216, height: 44, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14, fontWeight: 400, padding: "0 18px", boxSizing: "border-box" }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>CVV</label>
                      <div style={{
                        width: 216,
                        borderRadius: 28,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.02)",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 18px",
                        height: 44,
                      }}>
                        <input type="password" placeholder="****" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14, fontWeight: 400 }} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 400,
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "rgba(255,255,255,0.35)",
                      marginBottom: 8,
                    }}>
                      Ім'я на картці
                    </label>
                    <div style={{
                      width: 448,
                      borderRadius: 28,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.02)",
                    }}>
                      <input
                        type="text"
                        placeholder="Текст"
                        style={{
                          height: 42,
                          width: 448,
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          color: "#fff",
                          fontSize: 14,
                          fontWeight: 400,
                          padding: "0 20px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "8px" }}>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredAddCard(true)}
                      onMouseLeave={() => setHoveredAddCard(false)}
                      style={{
                        width: "216px",
                        height: "44px",
                        borderRadius: 999,
                        background: gradientFill,
                        border: "none",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'Montserrat', sans-serif",
                        boxShadow: hoveredAddCard ? "0 0 20px rgba(131,72,193,0.6)" : "none",
                        transform: hoveredAddCard ? "translateY(-1px)" : "none",
                        transition: "box-shadow 0.2s, transform 0.15s",
                      }}
                    >
                      Додати карту
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* HISTORY SECTION */}
            <section>
              <h2 style={{ fontSize: 22, fontWeight: 400, margin: "0 0 12px 0" }}>Історія платежів</h2>
              <div style={{
                width: 1116,
                height: 141,
                boxSizing: "border-box",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(10,10,10,0.6)",
                overflow: "auto",
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                      {["Назва плану", "Вартість", "Картка", "Дата покупки", "Дата завершення", "Дії"].map((h) => (
                        <th key={h} style={{ padding: "16px 24px", fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "20px 24px", fontSize: 14, color: "rgba(255,255,255,0.6)" }}>План "PRO"</td>
                      <td style={{ padding: "20px 24px", fontSize: 14, color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>7 EUR</td>
                      <td style={{ padding: "20px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>**** **** **** 3421</span>
                        </div>
                      </td>
                      <td style={{ padding: "20px 24px", fontSize: 14, color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>17.05.2026</td>
                      <td style={{ padding: "20px 24px", fontSize: 14, color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>17.06.2026</td>
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
                                borderRadius: 10,
                                border: hoveredIconBtn === key ? "1px solid rgba(131,72,193,0.5)" : "1px solid rgba(255,255,255,0.08)",
                                background: hoveredIconBtn === key ? "rgba(131,72,193,0.08)" : "rgba(255,255,255,0.04)",
                                padding: 8,
                                cursor: "pointer",
                                boxShadow: hoveredIconBtn === key ? "0 0 10px rgba(131,72,193,0.25)" : "none",
                                transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
                              }}
                            >
                              {key === "download" ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                                </svg>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 20 }}>
                <button
                  type="button"
                  onMouseEnter={() => setIsCancelHovered(true)}
                  onMouseLeave={() => setIsCancelHovered(false)}
                  style={{
                    borderRadius: 999,
                    border: isCancelHovered
                      ? "1px solid rgba(239, 68, 68, 1)"
                      : "1px solid rgba(239, 68, 68, 0.4)",
                    background: isCancelHovered
                      ? "rgba(239, 68, 68, 0.05)"
                      : "transparent",
                    color: isCancelHovered
                      ? "rgb(255, 100, 100)"
                      : "rgb(239, 68, 68)",
                    padding: "10px 20px",
                    fontSize: 13,
                    fontWeight: 400,
                    cursor: "pointer",
                    boxShadow: isCancelHovered ? "0 0 16px rgba(239,68,68,0.3)" : "none",
                    transition: "all 0.25s ease",
                    outline: "none",
                  }}
                >
                  Скасувати підписку
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === "notifications" && (
          <div style={{ width: "100%", maxWidth: 1116 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}>
              <h2 style={{ fontSize: 24, fontWeight: 400, margin: 0 }}>Сповіщення</h2>

              <button
                type="button"
                onMouseEnter={() => setHoveredSave(true)}
                onMouseLeave={() => setHoveredSave(false)}
                style={{
                  marginRight: 24,
                  height: 36,
                  width: 92,
                  borderRadius: 999,
                  boxSizing: "border-box",
                  fontSize: 12,
                  lineHeight: "20px",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#fff",
                  border: "1px solid transparent",
                  background: `linear-gradient(#0A0A0A, #0A0A0A) padding-box, ${gradientFill} border-box`,
                  boxShadow: hoveredSave ? "0 0 16px rgba(131,72,193,0.5)" : "none",
                  transform: hoveredSave ? "translateY(-1px)" : "none",
                  transition: "box-shadow 0.2s, transform 0.15s",
                }}
              >
                Зберегти
              </button>
            </div>

            <div style={{
              position: "relative",
              width: 1116,
              height: 270,
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(10,10,10,0.55)",
              backdropFilter: "blur(18px)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}>
              <div style={{
                position: "absolute",
                inset: "auto -120px -220px -120px",
                height: 360,
                background: "radial-gradient(closest-side, rgba(131,72,193,0.35), rgba(131,72,193,0) 70%)",
                filter: "blur(8px)",
                pointerEvents: "none",
              }} />

              <div style={{ position: "relative" }}>
                {[
                  { label: "Отримувати сповіщення на цьому веб-сайті", checked: notifyWeb, onChange: setNotifyWeb },
                  { label: "Telegram сповіщення", checked: notifyTelegram, onChange: setNotifyTelegram },
                  { label: "Сповіщення електронною поштою", checked: notifyEmail, onChange: setNotifyEmail },
                ].map((item) => (
                  <div key={item.label} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 24px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <span style={{ fontSize: 16, lineHeight: "24px", color: "#fff", fontWeight: 400 }}>{item.label}</span>
                    <SwitchToggle checked={item.checked} onChange={item.onChange} />
                  </div>
                ))}

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 24px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{ fontSize: 16, lineHeight: "24px", color: "#fff", fontWeight: 400 }}>Мова сповіщень</span>
                  <div style={{ position: "relative", minWidth: 160 }}>
                    <select
                      value={notifyLang}
                      onChange={(e) => setNotifyLang(e.target.value)}
                      style={{
                        width: "100%",
                        height: 36,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.04)",
                        color: "#fff",
                        padding: "0 34px 0 14px",
                        fontSize: 13,
                        fontWeight: 500,
                        outline: "none",
                        appearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="uk" style={{ background: "#fff", color: "#000" }}>Українська</option>
                      <option value="en" style={{ background: "#fff", color: "#000" }}>English</option>
                    </select>
                    <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.6 }} width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 24px",
                }}>
                  <span style={{ fontSize: 16, lineHeight: "24px", color: "#fff", fontWeight: 400 }}>Валюта</span>
                  <div style={{ position: "relative", minWidth: 160 }}>
                    <select
                      value={notifyCurrency}
                      onChange={(e) => setNotifyCurrency(e.target.value)}
                      style={{
                        width: "100%",
                        height: 36,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.04)",
                        color: "#fff",
                        padding: "0 34px 0 14px",
                        fontSize: 13,
                        fontWeight: 500,
                        outline: "none",
                        appearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="usd" style={{ background: "#fff", color: "#000" }}>Долар, $</option>
                      <option value="eur" style={{ background: "#fff", color: "#000" }}>Євро, €</option>
                      <option value="uah" style={{ background: "#fff", color: "#000" }}>Гривня, ₴</option>
                    </select>
                    <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.6 }} width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Окремий компонент для кнопки плану з власним hover-стейтом
function PlanButton({ isSelected, cta, onSelect }: { isSelected: boolean; cta: string; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);

  const gradientFill = "linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%)";
  const gradientBorder = "linear-gradient(#050508, #050508) padding-box, linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%) border-box";

  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      style={{
        width: "100%",
        padding: "14px 0",
        borderRadius: 14,
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.15em",
        cursor: "pointer",
        border: isSelected ? "none" : "1px solid transparent",
        background: isSelected ? gradientFill : gradientBorder,
        color: "#fff",
        fontFamily: "'Montserrat', sans-serif",
        boxShadow: hovered ? "0 0 18px rgba(131,72,193,0.55)" : "none",
        transform: hovered ? "translateY(-1px)" : "none",
        opacity: hovered ? 0.92 : 1,
        transition: "box-shadow 0.2s, transform 0.15s, opacity 0.2s",
      }}
    >
      {isSelected ? "Поточний план" : cta}
    </button>
  );
}