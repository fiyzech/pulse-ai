import React, { useEffect, useRef } from 'react';

// Лого — ромб з двох трикутників (з градієнтами, як у попередньому коді, виглядає добре)
const LogoIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logo_left" x1="12" y1="4" x2="12" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F5F3FF" />
        <stop offset="1" stopColor="#A855F7" />
      </linearGradient>
      <linearGradient id="logo_right" x1="28" y1="4" x2="28" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#080812" />
        <stop offset="1" stopColor="#6D28D9" />
      </linearGradient>
    </defs>
    <path d="M20 4L4 20L20 36Z" fill="url(#logo_left)" />
    <path d="M20 4L36 20L20 36Z" fill="url(#logo_right)" />
  </svg>
);

// Твоя крута хвиля на Canvas (без змін)
const DotWave: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      canvas.width = W * window.devicePixelRatio;
      canvas.height = H * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.clearRect(0, 0, W, H);

      const spacingX = 18;
      const spacingY = 16;
      const cols = Math.ceil(W / spacingX) + 2;
      const rows = Math.ceil(H / spacingY) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * spacingX;

          const wave1 = Math.sin(c * 0.055 + 1.2) * 80;
          const wave2 = Math.sin(c * 0.11 + 0.4) * 40;
          const wave3 = Math.sin(c * 0.22 + 2.0) * 20;
          const waveY = wave1 + wave2 + wave3;

          const topEdge = H * 0.28 - waveY;
          const y = topEdge + r * spacingY;

          if (y < 0 || y > H + 4) continue;

          const depth = (y - topEdge) / (H - topEdge);
          const edgeDist = Math.min(x / (W * 0.12), (W - x) / (W * 0.12), 1);

          const alpha = Math.max(0, (1 - depth * 0.55) * edgeDist * 0.85);
          const radius = Math.max(0.8, 3.5 - depth * 2.2);

          if (alpha < 0.02) continue;

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(131,72,193,${alpha})`;
          ctx.fill();
        }
      }
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
};

const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#000008] overflow-hidden text-white font-['Montserrat']">

      {/* Навігаційна панель */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center py-5 px-10 bg-[#000008]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <LogoIcon />
          <span className="text-[20px] font-montserrat tracking-tight">
            {/* --- ОНОВЛЕНО ТУТ: Використано єдиний span з точним градієнтом, як на фото --- */}
            <span
              style={{
                background: 'linear-gradient(90deg, #D1D5DB 0%, #9029FF 100%)', // Світло-сірий (#D1D5DB) -> Лавандовий (#A78BFA)
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              CryptoPulse
            </span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[14px] font-medium text-white/70">
          {['Why CryptoPulse', 'Features', 'Advantages', 'How it works', 'Pricing', 'FAQ'].map((item) => (
            <a key={item} href="#" className="hover:text-white transition-colors">
              {item}
            </a>
          ))}
        </div>

        {/* Кнопка навбару з градієнтним бордером (без змін) */}
        <div
          className="rounded-lg p-px"
          style={{ background: 'linear-gradient(90deg, #2C1969 0%, #8348C1 52%, rgba(255,255,255,0.6) 100%)' }}
        >
          <button className="rounded-[7px] bg-[#000008] px-6 py-2 text-[13px] font-medium transition-all hover:bg-white/5">
            Почати відстеження
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center pt-37.5 md:pt-45 pb-10 text-center px-4">

        {/* Бейдж */}
        <div
          className="inline-flex rounded-full p-px mb-8"
          style={{ background: 'linear-gradient(90deg, #2C1969 0%, #8348C1 52%, rgba(255,255,255,0.9) 100%)' }}
        >
          <div className="flex items-center justify-center px-6 py-2 rounded-full bg-[#000008]">
            <span
              className="text-[12px] font-medium tracking-[0.15em] uppercase whitespace-nowrap"
              style={{
                background: 'linear-gradient(90deg, #6E5AC8 0%, #A090DC 45%, #ffffff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Всі ціни криптовалют — під вашим контролем
            </span>
          </div>
        </div>

        {/* Заголовок */}
        <h1 className="text-[52px] md:text-[72px] font-bold mb-6 tracking-tight leading-none text-white">
          CryptoPulse
        </h1>

        {/* Опис */}
        <p className="text-[16px] md:text-[18px] max-w-160 mb-10 text-white/80 leading-relaxed font-normal">
          Створюйте персональні сповіщення для криптовалют і отримуйте
          повідомлення, коли ціна досягає потрібного рівня.
          <br className="hidden md:block" />
          Усі сповіщення миттєво надходять через Telegram-бота.
        </p>

        {/* CTA кнопка */}
        <button
          className="hover:opacity-90 hover:scale-[1.02] rounded-xl px-10 py-3.5 text-[16px] font-semibold transition-all shadow-[0_0_20px_rgba(131,72,193,0.3)]"
          style={{ background: 'linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%)' }}
        >
          Почати відстеження
        </button>
      </section>

      {/* Dot Wave */}
      <div className="absolute bottom-0 left-0 w-full h-[40vh] md:h-[45vh] pointer-events-none z-0">
        <DotWave />
        {/* Градієнт, щоб хвиля плавно розчинялася зверху */}
        <div className="absolute top-0 left-0 w-full h-20 bg-linear-to-b from-[#000008] to-transparent" />
      </div>

    </div>
  );
};

export default LandingPage;