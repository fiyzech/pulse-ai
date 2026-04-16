import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// --- РУХЛИВА ХВИЛЯ (Більш точна під макет) ---
const DotWave: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const clamp = (v: number, min: number, max: number) =>
      Math.max(min, Math.min(max, v));

    const lerp = (a: number, b: number, n: number) => a + (b - a) * n;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * DPR;
      canvas.height = rect.height * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    const draw = () => {
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;

      ctx.clearRect(0, 0, W, H);

      t += 0.01;

      const layers = 7;

      for (let layer = 0; layer < layers; layer++) {
        const depth = layer / (layers - 1); // 0 задній, 1 передній

        const yBase = lerp(H * 0.34, H * 0.86, depth);
        const rowCount = Math.round(lerp(6, 13, 1 - depth));

        // щільніша сітка
        const xStep = lerp(12, 22, depth);
        const yStep = lerp(11, 22, depth);

        // вищі хвилі
        const ampMain = lerp(18, 52, depth);
        const ampSecondary = lerp(8, 24, depth);
        const ampLong = lerp(10, 28, depth);

        const speed = lerp(0.42, 1.12, depth);

        // чіткіші точки
        const dotBase = lerp(1.05, 4.6, depth);

        for (let row = 0; row < rowCount; row++) {
          const rowDepth = row / Math.max(rowCount - 1, 1);

          for (let x = -60; x <= W + 60; x += xStep) {
            // менше хаосу, щоб хвиля читалась чистіше
            const xShift =
              Math.sin(x * 0.01 + row * 0.85 + t * speed) * 4 +
              Math.sin(x * 0.004 - row * 1.15 - t * speed * 0.75) * 6;

            const xx = x + xShift;

            const waveA =
              Math.sin(xx * 0.011 + t * speed + row * 0.34 + layer * 0.4) * ampMain;

            const waveB =
              Math.cos(xx * 0.019 - t * speed * 1.5 + row * 0.58) * ampSecondary;

            const waveC =
              Math.sin(xx * 0.0045 + t * 0.34 + layer * 1.1) * ampLong;

            // сильніша перспектива
            const perspectiveSlope = (xx - W * 0.5) * 0.022;

            const y =
              yBase +
              row * yStep +
              waveA +
              waveB +
              waveC +
              perspectiveSlope * rowDepth * 0.22;

            if (y < H * 0.02 || y > H + 30) continue;

            const centerFade = 1 - Math.abs(xx - W / 2) / (W / 2);
            const edgeFade = clamp(centerFade * 0.72 + 0.28, 0, 1);

            const frontBoost = lerp(0.34, 1, depth);
            const rowFade = lerp(1, 0.62, rowDepth);

            const alpha = clamp(frontBoost * rowFade * edgeFade, 0, 1);
            if (alpha < 0.05) continue;

            const pulse = 0.96 + 0.08 * Math.sin(xx * 0.018 + row + t * 2);
            const r = dotBase * lerp(1, 0.78, rowDepth) * pulse;

            // основна точка
            ctx.beginPath();
            ctx.arc(xx, y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(126, 80, 237, ${alpha})`;
            ctx.fill();

            // яскраве ядро
            ctx.beginPath();
            ctx.arc(xx, y, r * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(196, 151, 255, ${alpha * 0.85})`;
            ctx.fill();

            // легке свічення тільки для ближніх шарів
            if (depth > 0.45) {
              ctx.beginPath();
              ctx.arc(xx, y, r * 1.6, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(126, 80, 237, ${alpha * 0.08})`;
              ctx.fill();
            }
          }
        }
      }

      // плавне зникання зверху
      const topFade = ctx.createLinearGradient(0, 0, 0, H * 0.28);
      topFade.addColorStop(0, 'rgba(5,5,10,1)');
      topFade.addColorStop(1, 'rgba(5,5,10,0)');
      ctx.fillStyle = topFade;
      ctx.fillRect(0, 0, W, H * 0.3);

      // нижній fade
      const bottomFade = ctx.createLinearGradient(0, H * 0.8, 0, H);
      bottomFade.addColorStop(0, 'rgba(5,5,10,0)');
      bottomFade.addColorStop(1, 'rgba(5,5,10,0.95)');
      ctx.fillStyle = bottomFade;
      ctx.fillRect(0, H * 0.8, W, H * 0.2);

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();

    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};

// --- FAQ КОМПОНЕНТ ---
const FaqItem: React.FC<{ question: string; answer?: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/10 py-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left text-[18px] font-medium hover:text-[#A78BFA] transition-colors"
      >
        {question}
        <span className="text-2xl font-light text-white/50">{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen && (
        <div className="mt-4 text-white/60 leading-relaxed text-[15px] pr-10">
          {answer ||
            'Детальна відповідь на це запитання знаходиться в процесі наповнення. Будь ласка, зверніться до служби підтримки для отримання додаткової інформації.'}
        </div>
      )}
    </div>
  );
};

// --- ГОЛОВНА СТОРІНКА ---
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="relative flex flex-col bg-[#05050A] overflow-x-hidden text-white font-['Montserrat']">
      {/* 1. НАВІГАЦІЯ */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center py-5 px-6 md:px-10 bg-[#05050A]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer">
          <img src="/logo-crypro-pulse.svg" alt="CryptoPulse" className="w-7 h-7 object-contain" />
          <span className="text-[18px] font-semibold tracking-wide text-white/90">
            CryptoPulse
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-10 text-[14px] font-medium text-white/70">
          {['Why CryptoPulse', 'Features', 'Advantages', 'How it works', 'Pricing', 'FAQ'].map(
            (item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
                className="hover:text-white transition-colors"
              >
                {item}
              </a>
            )
          )}
        </div>

        <button
        onClick={() => navigate('/dashboard')}
         className="hidden md:block px-6 py-2.5 rounded-lg border border-white/20 text-[13px] font-semibold text-white/90 hover:bg-white/5 hover:border-white/40 transition-all">
          Почати відстеження
        </button>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center pt-32 pb-20 text-center px-4 overflow-hidden">
        <div className="relative z-20 flex flex-col items-center mt-20">
          <div className="inline-flex items-center justify-center px-6 py-2 mb-8 rounded-full border border-white/10 bg-[#05050A]/50 backdrop-blur-sm shadow-[0_0_15px_rgba(138,43,226,0.15)]">
            <span className="text-[12px] font-semibold tracking-[0.05em] text-[#A78BFA] uppercase">
              Всі ціни криптовалют — під вашим контролем
            </span>
          </div>

          <h1 className="text-[64px] md:text-[80px] font-bold mb-6 tracking-tight leading-none text-white">
            CryptoPulse
          </h1>

          <p className="text-[16px] md:text-[18px] max-w-2xl mb-12 text-white/80 leading-[1.6] font-medium">
            Створюйте персональні сповіщення для криптовалют і отримуйте
            повідомлення, коли ціна досягає потрібного рівня.
            <br className="hidden md:block" />
            Усі сповіщення миттєво надходять через Telegram-бота.
          </p>

          <button
          onClick={() => navigate('/dashboard')}
            className="px-10 py-4 rounded-xl text-[15px] font-bold transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(167,139,250,0.5)]"
            style={{ background: 'linear-gradient(90deg, #7E50ED 0%, #A074F8 100%)', color: '#ffffff' }}
          >
            Почати відстеження
          </button>
        </div>

        {/* Анімована хвиля */}
        <div className="absolute bottom-0 left-0 w-full h-[34vh] md:h-[38vh] pointer-events-none z-10">
          <DotWave />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#05050A] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#05050A] to-transparent" />
        </div>
      </section>

      {/* 3. ЧОМУ САМЕ CRYPTOPULSE */}
      <section
        id="why-cryptopulse"
        className="relative py-24 px-6 md:px-10 flex flex-col items-center z-20 bg-[#05050A]"
      >
        <h2 className="text-[36px] md:text-[42px] font-bold mb-16 text-center leading-tight">
          Чому варто користуватися
          <br />
          нашим сервісом
        </h2>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto items-center">
          <div className="space-y-8 text-white/70 text-[16px] md:text-[18px] leading-[1.7] font-medium">
            <p>
              <strong className="text-white">Налаштовуйте персональні сповіщення</strong> про
              зміну цін криптовалюті отримуйте повідомлення, коли ринок досягає заданих вами
              умов.
            </p>
            <p>
              Система автоматично відстежує коливання вартості активів та миттєво надсилає
              сповіщення через Telegram.
            </p>
          </div>

          <div className="h-[350px] rounded-3xl bg-gradient-to-tr from-[#1A0B2E] to-black border border-white/10 flex items-center justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.15)_0,transparent_70%)]"></div>
            <img
              src="/phone-mockup.png"
              alt="App interface"
              className="absolute bottom-0 w-[80%] object-contain translate-y-10 drop-shadow-[0_-10px_30px_rgba(138,43,226,0.3)]"
            />
          </div>
        </div>
      </section>

      {/* 4. КЛЮЧОВІ ФУНКЦІЇ */}
      <section
        id="features"
        className="py-24 px-6 md:px-10 bg-black/40 border-t border-white/5 relative z-20"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-[36px] md:text-[42px] font-bold mb-16 text-center leading-tight">
            Ключові функції для
            <br />
            відстеження криптовалют
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'ВІДСТЕЖЕННЯ ЦІН', desc: 'Слідкуйте за змінами ринку в реальному часі.' },
              { title: 'ЗРУЧНИЙ ІНТЕРФЕЙС', desc: 'Для швидкої роботи з активами та алертами.' },
              { title: 'ПЕРСОНАЛЬНІ АЛЕРТИ', desc: 'Миттєві сповіщення прямо у ваш Telegram.' },
              { title: 'ШІ АСИСТЕНТ', desc: 'Використовуйте потужність штучного інтелекту.' },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.05] hover:border-white/20 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-[#7E50ED]/20 flex items-center justify-center mb-6 text-[#A78BFA] group-hover:scale-110 transition-transform">
                  ✦
                </div>
                <h3 className="text-[18px] font-bold mb-3">{feature.title}</h3>
                <p className="text-[14px] text-white/60 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. ЯК ЦЕ ПРАЦЮЄ */}
      <section id="how-it-works" className="py-24 px-6 md:px-10 relative z-20 bg-[#05050A]">
        <h2 className="text-[36px] md:text-[42px] font-bold mb-20 text-center">
          Почніть у кілька кроків
        </h2>

        <div className="flex flex-col md:flex-row justify-center gap-10 max-w-5xl mx-auto">
          {[
            { step: '01', title: 'Створіть акаунт', bg: 'from-[#2A1551]' },
            { step: '02', title: 'Обери план', bg: 'from-[#1A1A3A]' },
            { step: '03', title: 'Відстежуй крипту', bg: 'from-[#2D1B4E]' },
          ].map((item, i) => (
            <div key={i} className="flex-1 relative flex flex-col items-center text-center group">
              <div
                className={`w-full h-56 rounded-3xl bg-gradient-to-b ${item.bg} to-transparent border border-white/10 mb-8 flex items-center justify-center text-[80px] font-bold text-white/5 group-hover:text-white/10 transition-colors`}
              >
                {item.step}
              </div>
              <h3 className="text-[20px] font-semibold">{item.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* 6. ТАРИФИ */}
      <section
        id="pricing"
        className="py-24 px-6 md:px-10 bg-black/40 border-t border-b border-white/5 relative z-20"
      >
        <div className="text-center mb-20">
          <h2 className="text-[36px] md:text-[42px] font-bold mb-6">
            Знайдіть план, який відповідає
            <br />
            вашим потребам
          </h2>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="w-full md:w-1/3 p-10 rounded-3xl border border-white/10 bg-[#0A0A10] flex flex-col">
            <h3 className="text-[24px] font-semibold mb-2">Free</h3>
            <div className="text-[48px] font-bold mb-8">
              €0 <span className="text-[16px] text-white/50 font-normal">/міс</span>
            </div>
            <ul className="space-y-5 mb-10 text-[15px] text-white/70 font-medium">
              <li className="flex items-center gap-3">
                <span className="text-[#A78BFA]">✓</span> Відстеження до 5 криптовалют
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#A78BFA]">✓</span> Оновлення даних кожні 5 хв
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#A78BFA]">✓</span> До 3 активних алертів
              </li>
            </ul>
            <button className="w-full py-3.5 rounded-xl border border-white/20 font-semibold hover:bg-white/10 transition-colors mt-auto">
              Почати зараз
            </button>
          </div>

          {/* Base Plan */}
          <div
            className="w-full md:w-1/3 p-[1px] rounded-3xl relative"
            style={{ background: 'linear-gradient(180deg, #7E50ED 0%, transparent 100%)' }}
          >
            <div className="h-full w-full bg-[#0E071A] rounded-[23px] p-10 relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 bg-[#7E50ED] text-[11px] uppercase tracking-wider font-bold px-4 py-1.5 rounded-bl-xl">
                Популярний
              </div>
              <h3 className="text-[24px] font-semibold mb-2 text-white">Base</h3>
              <div className="text-[48px] font-bold mb-8 text-white">
                €7 <span className="text-[16px] text-white/60 font-normal">/міс</span>
              </div>
              <ul className="space-y-5 mb-10 text-[15px] text-white/90 font-medium">
                <li className="flex items-center gap-3">
                  <span className="text-[#A78BFA]">✓</span> Безлімітні криптовалюти
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#A78BFA]">✓</span> Оновлення кожну хвилину
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#A78BFA]">✓</span> 50 активних сповіщень
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#A78BFA]">✓</span> Інтеграція з Telegram
                </li>
              </ul>
              <button className="w-full py-3.5 rounded-xl font-bold bg-[#7E50ED] hover:bg-[#6A3CD9] transition-colors shadow-[0_0_20px_rgba(126,80,237,0.4)] mt-auto text-white">
                Почати зараз
              </button>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="w-full md:w-1/3 p-10 rounded-3xl border border-white/10 bg-[#0A0A10] flex flex-col">
            <h3 className="text-[24px] font-semibold mb-2">Pro</h3>
            <div className="text-[48px] font-bold mb-8">
              €19 <span className="text-[16px] text-white/50 font-normal">/міс</span>
            </div>
            <ul className="space-y-5 mb-10 text-[15px] text-white/70 font-medium">
              <li className="flex items-center gap-3">
                <span className="text-[#A78BFA]">✓</span> Оновлення кожні 15 секунд
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#A78BFA]">✓</span> Розширена аналітика портфеля
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#A78BFA]">✓</span> Історія сповіщень до 90 днів
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#A78BFA]">✓</span> ШІ асистент
              </li>
            </ul>
            <button className="w-full py-3.5 rounded-xl border border-white/20 font-semibold hover:bg-white/10 transition-colors mt-auto">
              Почати зараз
            </button>
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section
        id="faq"
        className="py-24 px-6 md:px-10 relative z-20 max-w-4xl mx-auto w-full bg-[#05050A]"
      >
        <h2 className="text-[36px] md:text-[42px] font-bold mb-12 text-center">
          Поширені запитання
        </h2>

        <div className="flex flex-col">
          <FaqItem
            question="Що таке CryptoPulse?"
            answer="CryptoPulse — це зручний сервіс для автоматичного відстеження цін на криптовалюти зі зручними сповіщеннями прямо у ваш Telegram. Ви самі задаєте умови, а ми слідкуємо за ринком 24/7."
          />
          <FaqItem question="Які криптовалюти підтримуються?" />
          <FaqItem question="Чи можу я користуватися CryptoPulse з мобільного пристрою?" />
          <FaqItem question="Як я можу звернутися до служби підтримки?" />
        </div>
      </section>

      {/* 8. CTA ПЕРЕД ФУТЕРОМ */}
      <section className="py-24 px-6 md:px-10 text-center relative z-20 overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-[#7E50ED]/10 blur-[120px] rounded-full max-w-4xl mx-auto h-[400px] z-0"></div>

        <div className="relative z-10">
          <h2 className="text-[40px] md:text-[56px] font-bold mb-8 leading-tight">
            Слідкуйте за ринком
            <br />
            без зайвих зусиль
          </h2>

          <p className="text-[16px] md:text-[18px] text-white/60 mb-12 max-w-xl mx-auto font-medium leading-relaxed">
            Відстежуйте ціни, автоматизуйте сповіщення та залишайтесь на крок попереду без
            постійної перевірки графіка.
          </p>

          <button
          onClick={() => navigate('/dashboard')}
            className="px-10 py-4 rounded-xl text-[15px] font-bold transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(126,80,237,0.3)]"
            style={{ background: 'linear-gradient(90deg, #7E50ED 0%, #A074F8 100%)', color: '#ffffff' }}
          >
            Почати відстеження
          </button>
        </div>
      </section>

      {/* ФУТЕР */}
      <footer className="py-8 px-6 md:px-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] font-medium text-white/40 z-20 bg-[#05050A]">
        <div className="flex items-center gap-2">
          <img src="/logo-crypro-pulse.svg" alt="CryptoPulse" className="w-5 h-5 opacity-40 grayscale" />
          <span>© 2024 CryptoPulse. Всі права захищено.</span>
        </div>

        <div className="flex gap-8">
          <a href="#" className="hover:text-white transition-colors">
            Умови використання
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Політика конфіденційності
          </a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;