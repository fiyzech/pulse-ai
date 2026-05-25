import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { planLabelMap } from "../../utils/accountCache";
import type { PlanKey } from "../../utils/accountCache";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Short title: e.g. "Ліміт Watchlist" */
  title: string;
  /** One-liner explaining what's blocked */
  description: string;
  currentPlanKey: PlanKey;
}

const UPGRADE_PLAN: Record<PlanKey, PlanKey | null> = {
  free: "pro",
  pro: "business",
  business: null,
};

const planColor: Record<PlanKey, string> = {
  free: "text-white/50",
  pro: "text-[#C38BFF]",
  business: "text-[#FFD700]",
};

const planBadgeBg: Record<PlanKey, string> = {
  free: "bg-white/[0.06] border-white/10",
  pro: "bg-[#8348C1]/20 border-[#8348C1]/40",
  business: "bg-[#FFD700]/10 border-[#FFD700]/30",
};

export default function UpgradeModal({
  isOpen,
  onClose,
  title,
  description,
  currentPlanKey,
}: UpgradeModalProps) {
  const navigate = useNavigate();
  const upgradeTo = UPGRADE_PLAN[currentPlanKey];

  // Lock scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    navigate("/settings");
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative w-full max-w-[420px] p-[1px] rounded-[28px]"
        style={{
          background:
            "linear-gradient(135deg, rgba(131,72,193,0.6) 0%, rgba(179,179,179,0.18) 50%, rgba(131,72,193,0.4) 100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-[27px] bg-[#07030F] px-8 py-8 flex flex-col items-center text-center">
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.10] transition-colors text-white/50 hover:text-white text-lg cursor-pointer"
          >
            ×
          </button>

          {/* Lock icon */}
          <div className="mb-5 w-[56px] h-[56px] rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #2C1969 0%, #8348C1 100%)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M17 11H7C5.89543 11 5 11.8954 5 13V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V13C19 11.8954 18.1046 11 17 11Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M12 16C12.5523 16 13 15.5523 13 15C13 14.4477 12.5523 14 12 14C11.4477 14 11 14.4477 11 15C11 15.5523 11.4477 16 12 16Z" fill="white"/>
              <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Title */}
          <h2 className="font-montserrat text-[20px] font-semibold text-white mb-2">
            {title}
          </h2>

          {/* Description */}
          <p className="font-montserrat text-[14px] text-white/50 leading-[22px] mb-6 max-w-[320px]">
            {description}
          </p>

          {/* Current plan badge */}
          <div className="flex items-center gap-3 mb-6">
            <span className="font-montserrat text-[12px] text-white/30">Ваш план:</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[12px] font-medium font-montserrat ${planBadgeBg[currentPlanKey]} ${planColor[currentPlanKey]}`}>
              {planLabelMap[currentPlanKey]}
            </span>
            {upgradeTo && (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="#8348C1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[12px] font-medium font-montserrat ${planBadgeBg[upgradeTo]} ${planColor[upgradeTo]}`}>
                  {planLabelMap[upgradeTo]}
                </span>
              </>
            )}
          </div>

          {/* CTA */}
          {upgradeTo ? (
            <button
              type="button"
              onClick={handleUpgrade}
              className="w-full h-[48px] rounded-[28px] font-montserrat font-medium text-[14px] uppercase tracking-wider text-white cursor-pointer transition-all hover:shadow-[0_0_25px_rgba(131,72,193,0.5)] active:scale-[0.98]"
              style={{ background: "linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%)" }}
            >
              Оновити план
            </button>
          ) : (
            <p className="font-montserrat text-[13px] text-[#C38BFF]">
              У вас максимальний план — зв'яжіться з підтримкою.
            </p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mt-3 font-montserrat text-[13px] text-white/25 hover:text-white/50 transition-colors cursor-pointer"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
