import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <section className="w-full max-w-[1600px] mx-auto px-10 pt-7 pb-8">
      {/* СЕКЦІЯ 1 */}
      <div className="mb-6">
        <h2 className="w-[339px] h-[28px] mb-6 font-montserrat text-[24px] leading-[28px] font-semibold text-white/95">
          Найпопулярніше сьогодні
        </h2>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[261px_261px_261px_261px]">
          {/* 3 картки */}
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-[305px] w-full rounded-[28px] border border-white/5 bg-[#0A0A0F] hover:border-violet-500/30 transition-all cursor-pointer"
            />
          ))}

          {/* Telegram Promo */}
          <div
  className="h-[368px] w-full self-start translate-y-[-63px] rounded-[28px] overflow-hidden flex flex-col justify-between p-7"
  style={{
    backgroundImage: "url('/bgTelegramDashboard.png')",
    backgroundSize: "200%",
    backgroundPosition: "center",
  }}
>
            
            <div>
             

              <h3 className="mb-2 text-[18px] font-semibold text-white">
                Отримуй алерти в Telegram
              </h3>

              <p className="mb-6 text-[13px] leading-relaxed text-white/50">
                Підключи Telegram, щоб миттєво отримувати сповіщення про свої
                алерти та ринкові зміни.
              </p>
            </div>

            <div className="relative z-10 space-y-2.5">
              <button
                onClick={() => navigate("/settings")}
                className="w-full rounded-xl bg-[#A78BFA] py-3 text-[14px] font-semibold text-[#1b1330] hover:bg-[#BBA4FD] transition-colors"
              >
                Підключити Telegram
              </button>

              <button className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-[14px] font-medium text-white/70 hover:bg-white/10 transition-colors">
                Дізнатись більше
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* СЕКЦІЯ 2 */}
      <div className="-mt-[63px] mb-8">
        <h2 className="w-[255px] h-[28px] mb-6 font-montserrat text-[24px] leading-[28px] font-semibold text-white/95">
          Варто відстежувати
        </h2>

        <div className="w-full max-w-[1116px] h-[362px] rounded-[28px] border border-white/5 bg-[#0A0A0F] flex items-center justify-center">
          <span className="text-[14px] text-white/30">
            Тут будуть ваші активи
          </span>
        </div>
      </div>

      {/* СЕКЦІЯ 3 */}
      <div>
        <h2 className="w-[205px] h-[28px] mb-6 font-montserrat text-[24px] leading-[28px] font-semibold text-white/95">
          Останні новини
        </h2>

        <div className="w-full max-w-[1116px] h-[443px] rounded-[28px] border border-white/5 bg-[#0A0A0F] flex items-center justify-center">
          <span className="text-[14px] text-white/30">
            Стрічка новин
          </span>
        </div>
      </div>
    </section>
  );
}