import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <section className="px-10 py-8 max-w-[1600px] mx-auto w-full">
      
      {/* СЕКЦІЯ 1: Популярне + Telegram Promo */}
      <div className="mb-8">
        <h2 className="text-[20px] font-semibold mb-5 text-white/95">
          Популярне сьогодні
        </h2>
        
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Ліва частина: 3 картки */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 flex-1">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[220px] rounded-[24px] border border-white/5 bg-[#0A0A0F] hover:border-violet-500/30 transition-all cursor-pointer"
              />
            ))}
          </div>

          {/* Права частина: Telegram Promo */}
          <div className="w-full xl:w-[380px] shrink-0">
            <div className="h-full min-h-[220px] rounded-[24px] border border-[#7E50ED]/20 bg-[linear-gradient(145deg,rgba(26,11,54,0.6)_0%,rgba(10,5,20,0.8)_100%)] p-7 relative overflow-hidden flex flex-col justify-between">
              {/* Світіння на фоні */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#7E50ED]/20 blur-[50px] rounded-full pointer-events-none" />
              
              <div>
                <div className="mb-4 flex items-center gap-2.5">
                  <img 
                    src="/logo-crypro-pulse.svg" 
                    alt="CryptoPulse" 
                    className="h-6 w-6"
                  />
                  <span className="text-[16px] font-medium text-white">
                    CryptoPulse
                  </span>
                </div>

                <h3 className="mb-2 text-[18px] font-semibold text-white">
                  Отримуй алерти в Telegram
                </h3>
                <p className="mb-6 text-[13px] leading-relaxed text-white/50 max-w-[90%]">
                  Підключи Telegram, щоб миттєво отримувати сповіщення про свої
                  алерти та ринкові зміни.
                </p>
              </div>

              <div className="space-y-2.5 z-10 relative">
                <button 
                  onClick={() => navigate('/settings')} // Можемо кидати в налаштування для прив'язки
                  className="w-full py-3 rounded-xl bg-[#A78BFA] text-[14px] font-semibold text-[#1b1330] hover:bg-[#BBA4FD] transition-colors"
                >
                  Підключити Telegram
                </button>
                <button className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-[14px] font-medium text-white/70 hover:bg-white/10 transition-colors">
                  Дізнатись більше
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* СЕКЦІЯ 2: Відстежувані активи */}
      <div className="mb-8">
        <h2 className="text-[22px] font-semibold mb-5 text-white/95">
          Відстежувані активи
        </h2>
        <div className="h-[280px] rounded-[24px] border border-white/5 bg-[#0A0A0F] flex items-center justify-center">
          <span className="text-[14px] text-white/30">Тут будуть ваші активи</span>
        </div>
      </div>

      {/* СЕКЦІЯ 3: Останні новини */}
      <div>
        <h2 className="text-[22px] font-semibold mb-5 text-white/95">
          Останні новини
        </h2>
        <div className="h-[280px] rounded-[24px] border border-white/5 bg-[#0A0A0F] flex items-center justify-center">
          <span className="text-[14px] text-white/30">Стрічка новин</span>
        </div>
      </div>

    </section>
  );
}