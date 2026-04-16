export default function SupportPage() {
  return (
    <section className="px-10 py-8 max-w-[1200px] mx-auto w-full">
      
      {/* Hero секція підтримки */}
      <div className="text-center mb-16 mt-8">
        <h2 className="text-[40px] font-semibold text-white mb-4">
          Чим ми можемо допомогти?
        </h2>
        <p className="text-[16px] text-white/50 mb-8 max-w-lg mx-auto">
          Знайдіть відповіді на поширені запитання або зв'яжіться з нашою командою підтримки.
        </p>
        
        <div className="max-w-2xl mx-auto flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-[#0A0A0F] px-6 shadow-lg shadow-black/20 focus-within:border-violet-500/50 transition-colors">
          <span className="text-xl text-white/40">⌕</span>
          <input 
            type="text" 
            placeholder="Опишіть вашу проблему..." 
            className="bg-transparent border-none outline-none text-[15px] text-white/90 w-full placeholder:text-white/30"
          />
        </div>
      </div>

      {/* Картки категорій */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {[
          { title: "Налаштування сповіщень", icon: "🔔", desc: "Як створити та керувати алертами в Telegram." },
          { title: "Акаунт та Білінг", icon: "👤", desc: "Управління підпискою, зміна пароля та оплата." },
          { title: "PulseAI Асистент", icon: "✦", desc: "Як використовувати ШІ для аналізу крипторинку." }
        ].map((item, i) => (
          <div key={i} className="rounded-[24px] border border-white/5 bg-[#0A0A0F] p-8 hover:bg-white/[0.02] transition-colors cursor-pointer group">
            <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <h3 className="text-[18px] font-semibold text-white/90 mb-3">{item.title}</h3>
            <p className="text-[14px] leading-relaxed text-white/50">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Зв'язок з підтримкою */}
      <div className="rounded-[32px] border border-white/5 bg-[linear-gradient(180deg,rgba(10,10,15,0.8)_0%,rgba(5,5,10,0.9)_100%)] p-10 flex flex-col md:flex-row gap-12 items-center">
        <div className="flex-1">
          <h2 className="text-[28px] font-semibold text-white mb-4">
            Не знайшли відповіді?
          </h2>
          <p className="text-[15px] text-white/50 leading-relaxed mb-8">
            Наша команда на зв'язку 24/7. Напишіть нам напряму через Telegram або надішліть email, і ми допоможемо вирішити ваше питання в найкоротші терміни.
          </p>
          <div className="flex gap-4">
            <button className="px-6 py-3.5 rounded-xl bg-[#7E50ED] text-[14px] font-semibold text-white hover:bg-[#6A3CD9] transition-colors shadow-[0_0_20px_rgba(126,80,237,0.3)]">
              Написати в Telegram
            </button>
            <button className="px-6 py-3.5 rounded-xl border border-white/10 bg-white/5 text-[14px] font-medium text-white/80 hover:bg-white/10 transition-colors">
              support@cryptopulse.io
            </button>
          </div>
        </div>

        {/* Декоративний елемент (Ілюстрація) */}
        <div className="hidden md:flex w-[300px] h-[250px] rounded-2xl bg-gradient-to-tr from-[#1A0B2E] to-[#0A0514] border border-white/5 items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(126,80,237,0.15)_0,transparent_70%)]"></div>
          <div className="text-[80px] opacity-20">💬</div>
        </div>
      </div>

    </section>
  );
}