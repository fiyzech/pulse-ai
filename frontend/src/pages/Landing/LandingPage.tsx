import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Імпорти картинок
import thirdGradPic from '../../assets/images/third-grad-pic.svg';
import welcomeImg from '../../assets/images/welcome_bage.svg';
import plansImg from '../../assets/images/plans2.jpg';
import laptopImg from '../../assets/images/laptop.svg';
import whyCryptoPic from '../../assets/images/why-crupto-pic.svg';
import firstGradPic from '../../assets/images/first-grad-pic.svg';
import secondGradPic from '../../assets/images/second-grad-pic.svg';
import lastPhoto from '../../assets/images/lastPhoto.svg';
import sixthGridPic from '../../assets/images/sixth-grid-pic.svg';
import seventhGridPic from '../../assets/images/seventh-grid-pic.svg';
import eighthGridPic from '../../assets/images/eighth-grid-pic.svg';

// Імпорт фону для тарифу Pro
import bgForPro from '../../assets/images/bg-for-pro.svg';

// --- РУХЛИВА ХВИЛЯ ---
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
        const depth = layer / (layers - 1); 

        const yBase = lerp(H * 0.34, H * 0.86, depth);
        const rowCount = Math.round(lerp(6, 13, 1 - depth));

        const xStep = lerp(12, 22, depth);
        const yStep = lerp(11, 22, depth);

        const ampMain = lerp(18, 52, depth);
        const ampSecondary = lerp(8, 24, depth);
        const ampLong = lerp(10, 28, depth);

        const speed = lerp(0.42, 1.12, depth);
        const dotBase = lerp(1.05, 4.6, depth);

        for (let row = 0; row < rowCount; row++) {
          const rowDepth = row / Math.max(rowCount - 1, 1);

          for (let x = -60; x <= W + 60; x += xStep) {
            const xShift =
              Math.sin(x * 0.01 + row * 0.85 + t * speed) * 4 +
              Math.sin(x * 0.004 - row * 1.15 - t * speed * 0.75) * 6;

            const xx = x + xShift;

            const waveA = Math.sin(xx * 0.011 + t * speed + row * 0.34 + layer * 0.4) * ampMain;
            const waveB = Math.cos(xx * 0.019 - t * speed * 1.5 + row * 0.58) * ampSecondary;
            const waveC = Math.sin(xx * 0.0045 + t * 0.34 + layer * 1.1) * ampLong;

            const perspectiveSlope = (xx - W * 0.5) * 0.022;

            const y = yBase + row * yStep + waveA + waveB + waveC + perspectiveSlope * rowDepth * 0.22;

            if (y < H * 0.02 || y > H + 30) continue;

            const centerFade = 1 - Math.abs(xx - W / 2) / (W / 2);
            const edgeFade = clamp(centerFade * 0.72 + 0.28, 0, 1);

            const frontBoost = lerp(0.34, 1, depth);
            const rowFade = lerp(1, 0.62, rowDepth);

            const alpha = clamp(frontBoost * rowFade * edgeFade, 0, 1);
            if (alpha < 0.05) continue;

            const pulse = 0.96 + 0.08 * Math.sin(xx * 0.018 + row + t * 2);
            const r = dotBase * lerp(1, 0.78, rowDepth) * pulse;

            ctx.beginPath();
            ctx.arc(xx, y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(126, 80, 237, ${alpha})`;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(xx, y, r * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(196, 151, 255, ${alpha * 0.85})`;
            ctx.fill();

            if (depth > 0.45) {
              ctx.beginPath();
              ctx.arc(xx, y, r * 1.6, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(126, 80, 237, ${alpha * 0.08})`;
              ctx.fill();
            }
          }
        }
      }

      const topFade = ctx.createLinearGradient(0, 0, 0, H * 0.28);
      topFade.addColorStop(0, 'rgba(5,5,10,1)');
      topFade.addColorStop(1, 'rgba(5,5,10,0)');
      ctx.fillStyle = topFade;
      ctx.fillRect(0, 0, W, H * 0.3);

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
    /* Зовнішній div = рамка + градієнт */
    <div className="mb-4 p-[1px] rounded-[16px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] transition-all duration-300 transform-gpu group">
      
      
      <div 
        className={`relative h-full rounded-[15px] transition-all duration-300 overflow-hidden shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] ${
          isOpen 
            ? 'bg-[linear-gradient(180deg,#FFFFFF_-200%,#000008_38%,#000008_72%,#FFFFFF_200%)]' 
            : 'bg-[#000008] hover:bg-[#05050A]'
        }`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex justify-between items-center text-left transition-all duration-300 relative z-10 px-8 py-5 ${isOpen ? 'pb-4' : 'pb-5'}`}
        >
          <span className="font-montserrat font-medium text-[18px] text-white">
            {question}
          </span>
          <svg 
            width="20" height="20" viewBox="0 0 24 24" fill="none" 
            className={`transition-transform duration-300 group-hover:scale-110 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="M6 9L12 15L18 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Плавне відкриття */}
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out relative z-10 ${
            isOpen ? 'max-h-[500px] opacity-100 pb-10' : 'max-h-0 opacity-0 pb-0'
          }`}
        >
          <div className="px-8 font-montserrat font-light text-[14px] leading-[22px] text-white/70 pt-1">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
};


// --- ОНОВЛЕНИЙ КОМПОНЕНТ КАРТКИ "ЯК ЦЕ ПРАЦЮЄ" ---
const StepCard: React.FC<{ number: string; title: string; description: string; imgSrc: string }> = ({ number, title, description, imgSrc }) => {
  
  const imageScaleClass = (number === '1' || number === '2') 
    ? 'scale-[1.25] group-hover:scale-[1.30]' 
    : 'scale-100 group-hover:scale-[1.05]';

  return (
    <div className="relative w-full max-w-[375px] mx-auto h-auto lg:h-[471px] rounded-[16px] p-[1px] bg-gradient-to-br from-[#522E8B]/60 to-[#B3B3B3]/60 mt-10 md:mt-0 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.03] hover:z-20 hover:shadow-[0_15px_40px_rgba(131,72,193,0.3)] group transform-gpu flex flex-col shrink-0">
      
      {/* Badge (Кружечок з цифрою) */}
      <div className="absolute -top-[30px] -left-[15px] lg:-left-[20px] w-[60px] h-[60px] rounded-full p-[1px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[52%] to-[#FFFFFF] shadow-[0_0_15px_rgba(131,72,193,0.3)] z-30 transition-transform duration-500 group-hover:scale-110">
        <div className="w-full h-full rounded-full bg-[#000000] flex items-center justify-center">
            <span className="font-montserrat font-medium text-[24px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[52%] to-[#FFFFFF] bg-clip-text text-transparent">
                {number}
            </span>
        </div>
      </div>

      <div className="w-full h-full rounded-[15px] bg-[#05050A] flex flex-col px-[32px] pt-[40px] pb-[32px] relative z-10 overflow-hidden">
        
         {/* Легке світіння всередині при наведенні */}
         <div className="absolute inset-0 bg-[#8348C1]/0 group-hover:bg-[#000000]/10 blur-[40px] rounded-[15px] transition-colors duration-500 pointer-events-none z-0"></div>

        {/* Картинка */}
        <div className="w-full flex justify-center items-center h-[220px] relative z-10 mb-[30px]">
          <img 
            src={imgSrc} 
            alt={title} 
            className={`max-h-[100%] w-auto object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-transform duration-500 origin-center ${imageScaleClass}`} 
          />
        </div>

        {/* Текстовий блок: прибрали h-[64px], оскільки всі заголовки влазять в 1 рядок */}
        <div className="relative z-10 flex flex-col flex-grow">
          <h3 className="font-montserrat font-medium text-[22px] leading-[32px] text-[#FFFFFF] mb-[16px] transition-colors duration-300 group-hover:text-[#ceafef]">
            {title}
          </h3>
          
          <p className="font-montserrat font-normal text-[14px] leading-[24px] text-white/[0.71] transition-colors duration-300 group-hover:text-white/90">
            {description}
          </p>
        </div>

      </div>
    </div>
  );
};


// --- ГОЛОВНА СТОРІНКА ---
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(true);

  const navLinks = [
    { label: 'Чому CryptoPulse', href: '#why-cryptopulse' },
    { label: 'Функції', href: '#features' },
    { label: 'Переваги', href: '#benefits' }, 
    { label: 'Як це працює', href: '#how-it-works' },
    { label: 'Тарифи', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
   <div className="relative flex flex-col bg-[#000008] overflow-x-hidden text-[#FFFFFF] font-montserrat antialiased">
      
      {/* 1. НАВІГАЦІЯ */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center py-5 px-[50px] bg-[#000008]/95">
        
        {/* ЛІВА ЧАСТИНА: Логотип + Навігація */}
        <div className="flex items-center">
          
          {/* Логотип (135x27 як на фігмі) */}
          <div className="flex items-center gap-3 cursor-pointer w-[135px] h-[27px]" onClick={() => window.scrollTo(0, 0)}>
            <img src="/logo-crypro-pulse.svg" alt="CryptoPulse" className="w-7 h-7 object-contain" />
            <div className="text-[18px] font-montserrat tracking-wide">
              <span className="font-light text-white">Crypto</span>
              <span className="font-medium bg-gradient-to-r from-[#ceafef] to-[#9a64d4] bg-clip-text text-transparent">Pulse</span>
            </div>
          </div>

          {/* Лінки навігації (відступ 145px від логотипу) */}
          <div className="hidden lg:flex items-center gap-10 text-[16px] font-montserrat font-light text-white/90 ml-[145px]">
            {navLinks.map((item) => (
              <a key={item.label} href={item.href} className="hover:text-white transition-colors">
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* ПРАВА ЧАСТИНА: Кнопка 235x44 */}
        <button
          onClick={() => navigate('/register')}
          className="hidden md:flex w-[235px] h-[44px] p-[1px] rounded-[28px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[52%] to-[#FFFFFF] transition-all hover:shadow-[0_0_15px_rgba(131,72,193,0.3)] group transform-gpu"
        >
          <div className="flex items-center justify-center w-full h-full rounded-[27px] bg-[#000008] group-hover:bg-[#120B1D] transition-colors">
            <span className="font-montserrat font-semibold text-[13px] leading-[20px] tracking-[0.04em] text-white">
              Почати відстеження
            </span>
          </div>
        </button>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center pt-2 pb-40 text-center px-4 overflow-hidden transform-gpu">
        <div className="relative z-20 flex flex-col items-center mt-20">
          <div className="inline-flex h-[48px] p-[1px] mb-8 rounded-full bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[52%] to-[#FFFFFF]">
            <div className="flex items-center justify-center w-full h-full px-[16px] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_-30%,#000008_30%,#000008_70%,rgba(255,255,255,0.1)_130%)]">
              <span className="font-montserrat font-medium text-[16px] leading-[24px] uppercase bg-gradient-to-r from-[#6B46C1] via-[#9F7AEA] via-[40%] to-white to-[70%] bg-clip-text text-transparent">
                Всі ціни криптовалют — під вашим контролем
              </span>
            </div>
          </div>

          <h1 className="text-[54px] md:text-[72px] font-semibold mb-6 tracking-wide leading-none font-montserrat text-white">
            CryptoPulse
          </h1>

          <p className="text-[16px] md:text-[18px] font-montserrat max-w-2xl mb-12 text-white/80 leading-[1.6] font-medium">
            Відстежуйте криптоактиви, налаштовуйте алерти та отримуйте
            AI-аналіз ринку в режимі реального часу. Торгуйте на демо-рахунку
            <br className="hidden md:block" />
            без ризику та отримуйте миттєві сповіщення через Telegram-бота.
          </p>

         <button
            onClick={() => navigate('/register')}
            className="px-[34px] py-[11px] rounded-full tracking-wide font-montserrat font-medium text-[18px] text-white flex items-center justify-center bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(195,139,255,0.4)]"
          >
            Почати відстеження
          </button>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-[34vh] md:h-[45vh] pointer-events-none z-10">
          <DotWave />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#000008] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-[#000008] via-[#000008]/70 to-transparent" />
        </div>
      </section>

      {/* 3. ЧОМУ САМЕ CRYPTOPULSE */}
      <section id="why-cryptopulse" className="relative w-full bg-transparent z-30 flex justify-center overflow-visible transform-gpu">
        
        <img 
          src={firstGradPic} 
          alt="Background glow" 
          className="absolute top-[110%] -translate-y-1/2 left-0 w-[400px] md:w-[700px] h-[150%] object-cover pointer-events-none -z-10 opacity-90 mix-blend-screen" 
        />

        <div className="w-full max-w-[1440px] flex flex-col lg:flex-row lg:items-center pt-24 pb-32 lg:pt-[120px] lg:pb-[200px] px-6 lg:px-[80px] gap-12 lg:gap-[150px] relative z-10">
          
          {/* Ліва частина: Текстовий блок */}
          <div className="flex flex-col items-start w-full lg:w-[515px] lg:min-w-[515px] shrink-0">
            
            {/* БЕЙДЖ */}
            <div className="inline-flex h-[36px] p-[1px] rounded-[18px] bg-gradient-to-r from-[#522E8B] to-[#B3B3B3]/40 mb-4 relative overflow-hidden shadow-[0_0_15px_rgba(82,46,139,0.2)]">
              <div className="relative flex items-center gap-[8px] px-[14px] h-full rounded-[17px] bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_-40%,#05050A_35%,#05050A_65%,rgba(255,255,255,0.18)_140%)]">
                <div className="w-[6px] h-[6px] rounded-full bg-[#FFFFFF] shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10"></div>
                <span className="font-montserrat text-[14px] leading-[20px] tracking-[0.04em] font-semibold uppercase text-[#5C49AA] z-10">
                  Чому саме CryptoPulse?
                </span>
              </div>
            </div>

            {/* Текст */}
            <p className="font-montserrat font-normal text-[20px] leading-[28px] text-white/90">
              Відстежуйте криптоактиви у реальному часі, налаштовуйте персональні алерти
              та отримуйте миттєві сповіщення в Telegram. Торгуйте на демо-рахунку без ризику,
              тестуйте стратегії через бектестинг та отримуйте AI-інсайти для обґрунтованих рішень.
            </p>
          </div>

          {/* Права частина: Картинка з дашбордом */}
          <div className="relative w-full flex justify-center lg:justify-end lg:flex-1 group perspective-[1000px]">
            
            {/* Фіолетова підсвітка суто під картинкою дашборду */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[450px] h-[300px] md:h-[450px] bg-[#522E8B]/25 blur-[120px] rounded-full pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-80 z-0"></div>
            
            <img 
              src={whyCryptoPic} 
              alt="CryptoPulse Interface" 
              className="relative z-10 w-full max-w-[700px] h-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-[1.02]" 
            />
          </div>

        </div>
      </section>

      {/* 4. КЛЮЧОВІ ФУНКЦІЇ */}
      <section id="features" className="relative pt-[120px] pb-[120px] px-4 md:px-6 lg:px-[80px] flex flex-col items-center z-20 bg-[#000008] transform-gpu overflow-hidden w-full">
        
        {/* БЕЙДЖ */}
        <div className="inline-flex h-[36px] p-[1px] rounded-[18px] bg-gradient-to-r from-[#522E8B] to-[#B3B3B3]/40 mb-6 relative overflow-hidden shadow-[0_0_15px_rgba(82,46,139,0.2)]">
          <div className="relative flex items-center gap-[8px] px-[14px] h-full rounded-[17px] bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_-40%,#05050A_35%,#05050A_65%,rgba(255,255,255,0.18)_140%)]">
            <div className="w-[6px] h-[6px] rounded-full bg-[#FFFFFF] shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10"></div>
            <span className="font-montserrat text-[14px] leading-[20px] tracking-[0.04em] font-semibold uppercase text-[#5C49AA] z-10">
              ОСНОВНІ ФУНКЦІЇ САЙТУ
            </span>
          </div>
        </div>

        <h2 className="text-[36px] md:text-[44px] font-montserrat font-medium mb-[90px] md:mb-[120px] text-center leading-[46px] md:leading-[56px] max-w-[624px] text-white">
          Ключові функції для
          <br className="hidden md:block"/>
          відстеження криптовалют
        </h2>

        {/* ТАЙМЛАЙН КОНТЕЙНЕР */}
        <div className="w-full max-w-[1280px] overflow-x-auto lg:overflow-x-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="relative min-w-[900px] lg:min-w-full w-full flex justify-between items-center h-[340px] px-[40px] lg:px-[140px]">
            
            {/* Головна горизонтальна лінія */}
            <div className="absolute top-1/2 left-0 w-full h-[1px] -translate-y-1/2 bg-[linear-gradient(90deg,rgba(82,46,139,0)_0%,#522E8B_10%,#522E8B_90%,rgba(82,46,139,0)_100%)] z-0"></div>

            {/* Вузли таймлайну */}
            {[
              { top: true, text: "Огляд ринку\nта дашборд" },
              { top: false, text: "Криптоактиви\nу реальному часі" },
              { top: true, text: "Demo Trading\nта бектестинг стратегій" },
              { top: false, text: "Персональні алерти\nта Watchlist" },
              { top: true, text: "Миттєві сповіщення\nчерез Telegram" },
              { top: false, text: "PulseAI\nрозумний асистент" },
              { top: true, text: "Аналітика\nта AI-сигнали" },
            ].map((item, index) => (
              <div key={index} className="relative w-[2px] h-full flex justify-center shrink-0 z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[8px] h-[8px] rounded-full bg-[#A78BFA] shadow-[0_0_10px_rgba(167,139,250,0.8)] z-20"></div>

                {item.top ? (
                  <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 flex flex-col items-center z-0">
                    <p className="text-center font-montserrat font-normal text-[14px] lg:text-[16px] leading-[20px] lg:leading-[24px] text-white/80 whitespace-pre-line mb-[12px] min-w-[200px] lg:min-w-[240px]">
                      {item.text}
                    </p>
                    <div className="w-[1px] h-[100px] lg:h-[139px] bg-gradient-to-t from-[#522E8B] to-transparent"></div>
                  </div>
                ) : (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 flex flex-col items-center z-0">
                    <div className="w-[1px] h-[100px] lg:h-[139px] bg-gradient-to-b from-[#522E8B] to-transparent mb-[12px]"></div>
                    <p className="text-center font-montserrat font-normal text-[14px] lg:text-[16px] leading-[20px] lg:leading-[24px] text-white/80 whitespace-pre-line min-w-[200px] lg:min-w-[240px]">
                      {item.text}
                    </p>
                  </div>
                )}
              </div>
            ))}
            
          </div>
        </div>
      </section>

      {/* 5. ПЕРЕВАГИ СЕРВІСУ */}
      <section id="benefits" className="relative w-full bg-transparent z-30 flex justify-center pt-[100px] pb-[160px] overflow-visible transform-gpu">
        
        {/* ФОНОВА КАРТИНКА (туманчик справа) */}
        <img 
          src={secondGradPic} 
          alt="Background glow right" 
          className="absolute top-[-20%] right-0 w-[300px] md:w-[430px] h-[65%] object-cover pointer-events-none -z-10 opacity-80 mix-blend-screen" 
        />

        <div className="w-full max-w-[1440px] px-6 lg:px-[80px] flex flex-col relative z-10 items-center lg:items-start">
          
          {/* Заголовок і Бейдж */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left mb-[60px] max-w-[624px] w-full">
            
            {/* ОНОВЛЕНИЙ БЕЙДЖ (з туманчиком) */}
            <div className="inline-flex h-[36px] p-[1px] rounded-[18px] bg-gradient-to-r from-[#522E8B] to-[#B3B3B3]/40 mb-6 relative overflow-hidden shadow-[0_0_15px_rgba(82,46,139,0.2)]">
              <div className="relative flex items-center gap-[8px] px-[14px] h-full rounded-[17px] bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_-40%,#05050A_35%,#05050A_65%,rgba(255,255,255,0.18)_140%)]">
                <div className="w-[6px] h-[6px] rounded-full bg-[#FFFFFF] shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10"></div>
                <span className="font-montserrat text-[14px] leading-[20px] tracking-[0.04em] font-semibold uppercase text-[#5C49AA] z-10">
                  ПЕРЕВАГИ СЕРВІСУ
                </span>
              </div>
            </div>

            <h2 className="text-[36px] md:text-[44px] font-montserrat font-medium leading-[46px] md:leading-[56px] text-white">
              Чому варто користуватися
              <br className="hidden lg:block"/>
              нашим сервісом
            </h2>
            <p className="font-montserrat font-normal text-[16px] leading-[26px] text-white/55 mt-4">
              Все в одному місці — демо-торгівля,<br className="hidden lg:block"/> бектестинг стратегій та розумні алерти.
            </p>
          </div>

          {/* Карточки переваг (4 в ряд) */}
          <div className="flex flex-col lg:flex-row gap-[32px] w-full max-w-[1280px]">
            
            {[
              {
                num: "01",
                title: "ВІДСТЕЖЕННЯ ЦІН\nКРИПТОВАЛЮТ",
                text: "Система відстежує ціни\nкриптовалют у реальному\nчасі та оновлює дашборд\nз актуальною динамікою"
              },
              {
                num: "02",
                title: "ДЕМО-ТОРГІВЛЯ\nТА БЕКТЕСТИНГ\nСТРАТЕГІЙ",
                text: "Торгуйте на демо-рахунку\n($25,000) без ризику\nта тестуйте стратегії\nна реальних ринкових даних"
              },
              {
                num: "03",
                title: "ПЕРСОНАЛЬНІ\nАЛЕРТИ\nТА TELEGRAM\nСПОВІЩЕННЯ",
                text: "Налаштовуйте алерти\nдля криптовалют\nі отримуйте сповіщення\nв Telegram"
              },
              {
                num: "04",
                title: "ВИКОРИСТОВУЙТЕ\nШІ-АСИСТЕНТА",
                text: "Отримуйте швидкий аналіз\nринку, підказки та інсайти\nу реальному часі\nдля обґрунтованих рішень"
              }
            ].map((card, idx) => (
              
              /* Обгортка картки. bg-gradient-to-r робить рамку зліва-направо (2C1969 -> 8348C1 -> FFFFFF) з прозорістю 60% */
              <div key={idx} className="relative w-full lg:w-[296px] lg:min-w-[296px] h-auto lg:h-[410px] rounded-[28px] p-[1px] bg-gradient-to-r from-[#522E8B]/40 via-[#8348C1]/40 to-[#B3B3B3]/40 shrink-0 group transition-all duration-300 hover:-translate-y-2">
                
                {/* Легесеньке світіння ЗА карткою */}
                <div className="absolute inset-0 bg-[#8348C1]/10 blur-[30px] rounded-[28px] -z-10 transition-opacity duration-300 group-hover:bg-[#8348C1]/20"></div>

                {/* Внутрішній чорний фон картки */}
                <div className="w-full h-full rounded-[27px] bg-[#000000] px-[24px] py-[32px] flex flex-col items-start text-left">
                  
                  {/* Кружечок з цифрою (40x40). bg-gradient-to-r створює градієнт зліва-направо (100% непрозорий) */}
                  <div className="w-[40px] h-[40px] rounded-full p-[1px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[48%] to-[#FFFFFF] mb-[14px] shrink-0">
                    <div className="w-full h-full rounded-full bg-[#000000] flex items-center justify-center">
                      
                      {/* Цифра всередині (теж має градієнт зліва направо) */}
                      <span className="font-montserrat font-medium text-[16px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[48%] to-[#FFFFFF] bg-clip-text text-transparent">
                        {card.num}
                      </span>
                    </div>
                  </div>

                  {/* Заголовок картки */}
                  <h3 className="font-montserrat font-medium text-[22px] leading-[32px] tracking-[0.04em] text-white uppercase whitespace-pre-line mb-4 w-full max-w-[248px]">
                    {card.title}
                  </h3>
                  
                  {/* Опис картки (притискається до низу завдяки mt-auto) */}
                  <p className="font-montserrat font-normal text-[15.5px] leading-[24px] text-[#D1D1D1] whitespace-pre-line mt-auto w-full max-w-[248px]">
                    {card.text}
                  </p>
                </div>
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* 6. ЯК ЦЕ ПРАЦЮЄ */}
      <section id="how-it-works" className="py-24 px-8 md:px-12 relative z-20 bg-[#000008] flex flex-col items-center transform-gpu">
        
        {/* НОВА ФОНОВА КАРТИНКА (туманчик зліва) */}
        <img 
          src={thirdGradPic} 
          alt="Background glow left" 
          className="absolute top-[-20%] left-[0%] w-[600px] md:w-[500px] h-[70%] object-cover pointer-events-none -z-10 opacity-80 mix-blend-screen" 
        />

        <div className="inline-flex p-[1px] rounded-[16px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[52%] to-[#FFFFFF] mb-8 shadow-[0_0_15px_rgba(131,72,193,0.1)]">
          <div className="flex items-center gap-[8px] px-[12px] py-[8px] bg-[linear-gradient(180deg,rgba(255,255,255,0.15)_-60%,#000008_30%,#000008_70%,rgba(131,72,193,0.2)_160%)] rounded-[15px]">
            <div className="w-[6px] h-[6px] rounded-full bg-[#FFFFFF]"></div>
            <span className="font-montserrat text-[12px] md:text-[13px] uppercase font-semibold tracking-wider text-[#8348C1]">
              ШВИДКИЙ СТАРТ
            </span>
          </div>
        </div>

        <h2 className="text-[32px] md:text-[44px] font-montserrat font-medium mb-20 text-center leading-[1.2] text-white">
          Почніть у кілька кроків
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 max-w-[1300px] w-full mx-auto">
          
          <StepCard 
            number="1"
            title="Створіть акаунт"
            description="Швидка реєстрація — і ви миттєво отримуєте доступ до всіх інструментів платформи CryptoPulse. Створіть свій профіль за пару кліків та почніть роботу."
            imgSrc={welcomeImg} 
          />
          
          <StepCard 
            number="2"
            title="Оберіть план"
            description="Оберіть оптимальний тариф, який найкраще відповідає вашим цілям, і відкрийте розширені функції. Отримайте максимум інструментів для ефективного аналізу."
            imgSrc={plansImg} 
          />
          
          <StepCard 
            number="3"
            title="Відстежуйте криптовалюти"
            description="Слідкуйте за ринком у реальному часі, отримуйте сповіщення про зміни цін та користуйтесь ШІ-помічником для швидкого аналізу і прийняття рішень."
            imgSrc={laptopImg} 
          />
          
        </div>
      </section>

      {/* 7. ТАРИФИ (ІДЕАЛЬНА ПІКСЕЛЬНА ВЕРСТКА) */}
      <section id="pricing" className="py-24 px-6 md:px-10 relative z-20 bg-[#000008] flex flex-col items-center overflow-hidden transform-gpu">
        
        <div className="inline-flex p-[1px] rounded-[16px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[52%] to-[#FFFFFF] mb-8 shadow-[0_0_15px_rgba(131,72,193,0.1)]">
          <div className="flex items-center gap-[8px] px-[12px] py-[8px] bg-[linear-gradient(180deg,rgba(255,255,255,0.15)_-60%,#000008_30%,#000008_70%,rgba(131,72,193,0.2)_160%)] rounded-[15px]">
            <div className="w-[6px] h-[6px] rounded-full bg-[#FFFFFF]"></div>
            <span className="font-montserrat text-[12px] md:text-[13px] uppercase font-semibold tracking-wider text-[#8348C1]">
              ВАРТІСТЬ
            </span>
          </div>
        </div>

        <h2 className="text-[36px] md:text-[44px] font-montserrat font-medium mb-12 text-center leading-[56px] text-white max-w-[842px]">
          Знайдіть план, який відповідає
          <br className="hidden md:block"/>
          вашим потребам
        </h2>

        {/* Перемикач Місяць/Рік */}
        <div className="flex items-center justify-center mb-16">
          <div className="flex items-center bg-white/[0.06] rounded-full p-1 gap-1 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full font-montserrat text-[14px] font-medium transition-all duration-200 ${!isYearly ? "bg-[#8348C1] text-white shadow-[0_2px_12px_rgba(131,72,193,0.4)]" : "text-white/50 hover:text-white/80"}`}
            >
              Місяць
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-montserrat text-[14px] font-medium transition-all duration-200 ${isYearly ? "bg-[#8348C1] text-white shadow-[0_2px_12px_rgba(131,72,193,0.4)]" : "text-white/50 hover:text-white/80"}`}
            >
              Рік
              <span className="bg-[#24FF7A]/15 text-[#24FF7A] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#24FF7A]/25 leading-none">−22%</span>
            </button>
          </div>
        </div>

        {/* Контейнер тарифів */}
        <div className="flex flex-col lg:flex-row justify-center items-stretch gap-6 max-w-[1250px] mx-auto w-full">

          {/* Картка "Безкоштовно" */}
          <div
            className="w-full lg:w-[405px] h-auto rounded-[28px] p-[1px] bg-gradient-to-r from-[#522E8B]/[0.32] to-[#B3B3B3]/[0.32] flex flex-col shrink-0 opacity-0 animate-fade-up transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(131,72,193,0.1)] relative group"
            style={{ animationDelay: '0ms' }}
          >
            <div className="w-full h-full rounded-[27px] bg-[#050508] px-[24px] py-[28px] flex flex-col text-left">
              <h3 className="font-montserrat text-[14px] font-medium text-white mb-[12px]">Безкоштовно</h3>
              <div className="flex items-end gap-1 mb-[24px]">
                <span className="font-montserrat text-[40px] font-normal text-white leading-[40px]">€0</span>
                <span className="font-montserrat text-[13px] text-white/40 mb-[4px]">/місяць</span>
              </div>

              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#8348C1]/40 to-transparent mb-[20px]"></div>

              <ul className="flex flex-col gap-[12px] flex-1 mb-[24px]">
                {[
                  "Доступ до всіх криптоактивів",
                  "Demo Trading ($25,000 стартовий баланс)",
                  "Бектестинг стратегій",
                  "До 5 активів у Watchlist",
                  "Алерти для 1 криптовалюти",
                  "До 3 активних алертів",
                  "Telegram-сповіщення",
                  "До 5 PulseAI-запитів на місяць",
                  "До 3 AI-сигналів на місяць",
                  "Історія алертів до 7 днів",
                ].map((text, idx) => (
                  <li key={idx} className="flex items-start gap-[10px]">
                    <div className="w-[6px] h-[6px] rounded-full bg-white shrink-0 mt-[5px]"></div>
                    <span className="font-montserrat font-normal text-[13px] leading-[1.5] text-white">{text}</span>
                  </li>
                ))}
              </ul>

              <div className="w-full h-[48px] p-[1px] rounded-[28px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[52%] to-[#FFFFFF]">
                <button onClick={() => navigate('/register')} className="w-full h-full bg-[#050508] rounded-[28px] flex items-center justify-center text-[14px] font-montserrat font-medium text-white hover:bg-white/5 transition-colors uppercase tracking-wider cursor-pointer">
                  ПОЧАТИ ЗАРАЗ
                </button>
              </div>
            </div>
          </div>

          {/* Картка "Pro" — bg залишається як є */}
          <div
            className="w-full lg:w-[406px] h-auto rounded-[28px] p-[1px] bg-gradient-to-r from-[#522E8B]/[0.32] to-[#B3B3B3]/[0.32] flex flex-col shrink-0 relative opacity-0 animate-fade-up transform-gpu transition-all duration-300 lg:-translate-y-4 hover:lg:-translate-y-6 z-10 shadow-[0_0_30px_rgba(131,72,193,0.3)]"
            style={{ animationDelay: '200ms' }}
          >
            <div
              className="w-full h-full rounded-[27px] bg-[#0A0516] bg-cover bg-center px-[24px] py-[28px] flex flex-col relative text-left"
              style={{ backgroundImage: `url(${bgForPro})` }}
            >
              <div className="flex justify-between items-start mb-[12px]">
                <h3 className="font-montserrat text-[14px] font-medium text-white">Про</h3>
                <div className="px-[12px] py-[4px] rounded-[16px] border border-[#522E8B]/40 flex items-center justify-center bg-transparent">
                  <span className="font-montserrat font-normal text-[11px] text-[#8348C1]">Популярний</span>
                </div>
              </div>

              {isYearly ? (
                <div className="mb-[20px]">
                  <div className="flex items-baseline gap-2">
                    <span className="font-montserrat text-[40px] font-normal text-white leading-[40px]">€7</span>
                    <span className="font-montserrat text-[13px] text-white/40">/міс</span>
                    <span className="font-montserrat text-[13px] text-white/25 line-through">€9</span>
                  </div>
                  <p className="font-montserrat text-[11px] text-white/35 mt-1">
                    оплата €84/рік <span className="text-[#24FF7A] font-semibold">· економите €24</span>
                  </p>
                </div>
              ) : (
                <div className="flex items-end gap-1 mb-[20px]">
                  <span className="font-montserrat text-[40px] font-normal text-white leading-[40px]">€9</span>
                  <span className="font-montserrat text-[13px] text-white/40 mb-[4px]">/місяць</span>
                </div>
              )}

              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#8348C1]/50 to-transparent mb-[16px]"></div>

              <p className="font-montserrat font-normal text-[13px] text-white mb-[12px]">Все з Безкоштовного, плюс:</p>

              <ul className="flex flex-col gap-[12px] flex-1 mb-[24px]">
                {[
                  "До 15 активів у Watchlist",
                  "Алерти для 5 криптовалют",
                  "До 5 активних алертів для кожної",
                  "До 100 PulseAI-запитів на місяць",
                  "До 10 AI-сигналів на місяць",
                  "AI-розбір після бектестингу",
                  "Історія алертів до 30 днів",
                  "Швидка підтримка",
                ].map((text, idx) => (
                  <li key={idx} className="flex items-start gap-[10px]">
                    <div className="w-[6px] h-[6px] rounded-full bg-white shrink-0 mt-[5px]"></div>
                    <span className="font-montserrat font-normal text-[13px] leading-[1.5] text-white/90">{text}</span>
                  </li>
                ))}
              </ul>

              <button onClick={() => navigate('/register')} className="w-full h-[48px] rounded-[28px] flex items-center justify-center font-montserrat font-medium text-[14px] uppercase tracking-wider bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-white hover:shadow-[0_0_25px_rgba(131,72,193,0.5)] transition-all active:scale-[0.98] cursor-pointer">
                ПОЧАТИ ЗАРАЗ
              </button>
            </div>
          </div>

          {/* Картка "Преміум" */}
          <div
            className="w-full lg:w-[405px] h-auto rounded-[28px] p-[1px] bg-gradient-to-r from-[#522E8B]/[0.32] to-[#B3B3B3]/[0.32] flex flex-col shrink-0 opacity-0 animate-fade-up transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(131,72,193,0.1)] relative group"
            style={{ animationDelay: '400ms' }}
          >
            <div className="w-full h-full rounded-[27px] bg-[#050508] px-[24px] py-[28px] flex flex-col text-left">
              <h3 className="font-montserrat text-[14px] font-medium text-white/70 mb-[12px]">Преміум</h3>
              {isYearly ? (
                <div className="mb-[24px]">
                  <div className="flex items-baseline gap-2">
                    <span className="font-montserrat text-[40px] font-normal text-white leading-[40px]">€15</span>
                    <span className="font-montserrat text-[13px] text-white/40">/міс</span>
                    <span className="font-montserrat text-[13px] text-white/25 line-through">€19</span>
                  </div>
                  <p className="font-montserrat text-[11px] text-white/35 mt-1">
                    оплата €180/рік <span className="text-[#24FF7A] font-semibold">· економите €48</span>
                  </p>
                </div>
              ) : (
                <div className="flex items-end gap-1 mb-[24px]">
                  <span className="font-montserrat text-[40px] font-normal text-white leading-[40px]">€19</span>
                  <span className="font-montserrat text-[13px] text-white/40 mb-[4px]">/місяць</span>
                </div>
              )}

              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#8348C1]/40 to-transparent mb-[20px]"></div>

              <p className="font-montserrat font-normal text-[13px] text-white mb-[12px]">Все з Про, плюс:</p>

              <ul className="flex flex-col gap-[12px] flex-1 mb-[24px]">
                {[
                  "Необмежений Watchlist",
                  "Алерти для 15 криптовалют",
                  "Необмежена кількість алертів",
                  "Необмежені PulseAI-запити",
                  "Необмежені AI-сигнали",
                  "Історія алертів до 3 місяців",
                  "Пріоритетна підтримка",
                ].map((text, idx) => (
                  <li key={idx} className="flex items-start gap-[10px]">
                    <div className="w-[6px] h-[6px] rounded-full bg-white shrink-0 mt-[5px]"></div>
                    <span className="font-montserrat font-normal text-[13px] leading-[1.5] text-white/80">{text}</span>
                  </li>
                ))}
              </ul>

              <div className="w-full h-[48px] p-[1px] rounded-[28px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[52%] to-[#FFFFFF]">
                <button onClick={() => navigate('/register')} className="w-full h-full bg-[#050508] rounded-[28px] flex items-center justify-center text-[14px] font-montserrat font-medium text-white hover:bg-white/5 transition-colors uppercase tracking-wider cursor-pointer">
                  ПОЧАТИ ЗАРАЗ
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>
{/* 8. CЛІДКУЙТЕ ЗА РИНКОМ */}
<section className="pt-[96px] pb-0 px-6 md:px-10 flex flex-col items-center text-center relative z-20 bg-[#000008] overflow-visible transform-gpu w-full mb-[-90px]">
  
  {/* Градієнт зліва */}
  <img
    src={sixthGridPic}
    alt=""
    className="absolute top-0 left-0 w-[578px] h-[850px] object-cover pointer-events-none -z-10 opacity-100 mix-blend-screen"
  />

  {/* Градієнт справа */}
  <img
    src={seventhGridPic}
    alt=""
    className="absolute top-0 right-0 w-[500px] h-[850px] object-cover pointer-events-none -z-10 opacity-100 mix-blend-screen"
  />

  {/* Текстовий блок і кнопка */}
  <div className="relative z-10 flex flex-col items-center w-full max-w-[624px] mb-[56px]">
    <h2 className="font-montserrat font-medium text-[36px] md:text-[44px] leading-[46px] md:leading-[56px] text-white mb-6">
      Слідкуйте за ринком<br />без зайвих зусиль
    </h2>

    <p className="font-montserrat font-light text-[16px] md:text-[20px] leading-[26px] md:leading-[30px] text-white/80 mb-10 w-full">
      Відстежуйте ціни, автоматизуйте сповіщення<br className="hidden md:block" /> та залишайтесь на крок попереду без постійної перевірки графіків
    </p>

    <button
      onClick={() => navigate('/register')}
      className="px-[34px] py-[11px] rounded-full tracking-wide font-montserrat font-medium text-[18px] text-white flex items-center justify-center bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(195,139,255,0.4)]"
    >
      Почати відстеження
    </button>
  </div>

  {/* Картинка дашборду */}
  <div className="relative z-10 w-full max-w-[1062px] mx-auto px-4 md:px-0">
    <img
      src={lastPhoto}
      alt="CryptoPulse Interface"
      className="w-full h-auto object-contain object-top rounded-t-[16px] drop-shadow-[0_-10px_60px_rgba(131,72,193,0.2)]"
    />
  </div>
</section>

{/* 9. FAQ */}
<section id="faq" className="pt-[180px] pb-28 px-6 lg:px-[80px] relative z-30 bg-[#000008] transform-gpu">
  
  {/* Лінія-розділювач між картинкою і FAQ */}
  <div className="absolute top-0 left-0 w-full h-[1px] bg-[linear-gradient(90deg,#000000_0%,#2C1969_18%,#8348C1_50%,#2C1969_82%,#000000_100%)]"></div>

  <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-50">
    
    {/* Ліва частина: Заголовок та Бадж */}
    <div className="flex flex-col items-start lg:w-1/3 shrink-0">
      
      {/* Бадж FAQ з градієнтом рамки та туманом всередині */}
      <div className="inline-flex rounded-[20px] p-[1px] bg-gradient-to-r from-[#FFFFFF] via-[#8348C1] to-[#2C1969] mb-8 relative overflow-hidden group">
        
        {/* Внутрішнє світіння для бейджа */}
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(180deg,rgba(131,72,193,0.15)_0%,rgba(5,5,10,1)_100%)] pointer-events-none"></div>
        
        <div className="relative flex items-center gap-[10px] px-[12px] py-[8px] rounded-[19px] bg-[linear-gradient(180deg,#FFFFFF_-140%,#000008_33%,#000008_67%,#FFFFFF_240%)]">
          <div className="w-[6px] h-[6px] rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
          <span className="font-montserrat text-[13px] uppercase font-semibold tracking-wider text-[#8348C1]">
            FAQ
          </span>
        </div>
      </div>

      <h2 className="font-montserrat font-medium text-[32px] leading-[1.2] text-white">
        Поширені запитання
      </h2>
    </div>

    <img 
      src={eighthGridPic} 
      alt="Background glow left" 
      className="absolute top-[90px] left-[-100px] md:left-[3px] w-[378px] h-[567px] object-cover pointer-events-none -z-10 opacity-70 mix-blend-screen rotate-[-360deg]" 
    />

    {/* Права частина: Акордеон */}
    <div className="lg:flex-1 max-w-[624px] w-full">
      <FaqItem
        question="Що таке CryptoPulse?"
        answer="CryptoPulse — це повноцінна платформа для роботи з криптоактивами: відстежуйте ціни у реальному часі, налаштовуйте персональні алерти та отримуйте миттєві Telegram-сповіщення. Торгуйте на демо-рахунку без ризику, тестуйте стратегії через бектестинг та отримуйте AI-аналіз ринку й сигнали через вбудованого PulseAI-асистента."
      />

      <FaqItem 
        question="Які криптовалюти підтримуються?" 
        answer="Платформа підтримує широкий перелік криптоактивів — від Bitcoin і Ethereum до популярних альткоїнів. У Watchlist можна додати обрані активи для швидкого моніторингу."
      />

      <FaqItem 
        question="Що таке PulseAI та чим він корисний?"
        answer="PulseAI — це ваш персональний розумний асистент на платформі. Він аналізує ринкові тренди, надає коротку аналітику по активах та допомагає приймати обґрунтовані торгові рішення, значно заощаджуючи ваш час на самостійний аналіз графіків."
      />

      <FaqItem 
        question="Як я можу звернутися до служби підтримки?" 
        answer="Ви можете звернутися до нас безпосередньо через розділ «Підтримка» в особистому кабінеті, заповнивши зручну форму зворотного зв'язку. Наша команда оперативно розгляне ваше звернення та допоможе з налаштуванням платформи чи алертів."
      />
    </div>
  </div>
</section>


     {/* 10. ФУТЕР */}
      <footer className="relative w-full h-auto md:h-[253px] px-6 lg:px-[80px] bg-[#000008] z-20 flex flex-col justify-center py-12 md:py-0">
        
        {/* Градієнтна лінія зверху */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-[linear-gradient(90deg,#000000_0%,#8348C1_48%,#2C1969_100%)]"></div>

        <div className="max-w-[1440px] w-full mx-auto flex flex-col md:flex-row justify-between items-start gap-12 md:gap-0">
          
          {/* Ліва частина: Лого та опис */}
          <div className="max-w-[380px]">
            <div className="flex items-center gap-3 mb-5 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
              <img src="/logo-crypro-pulse.svg" alt="CryptoPulse" className="w-7 h-7 object-contain" />
              <div className="text-[18px] font-montserrat tracking-wide">
                <span className="font-light text-white">Crypto</span>
                <span className="font-medium bg-gradient-to-r from-[#ceafef] to-[#9a64d4] bg-clip-text text-transparent">Pulse</span>
              </div>
            </div>
            
            <p className="font-montserrat font-extralight text-[13px] leading-[22px] text-white">
              Відстежуйте ринок, автоматизуйте сповіщення та реагуйте швидше. CryptoPulse робить відстеження крипти простим і ефективним.
            </p>
          </div>

          {/* Права частина: Навігація та Соцмережі (Зсунуто лівіше) */}
          <div className="flex gap-16 lg:gap-[100px] md:pr-[15%] lg:pr-[30px]">
            
            {/* Колонка: Навігація */}
            <div className="flex flex-col gap-[12px]">
              <h4 className="font-montserrat font-semibold text-[13px] leading-[20px] text-white mb-2">Навігація</h4>
              <a href="#why-cryptopulse" className="font-montserrat font-normal text-[13px] leading-[16px] text-[#8B8B8B] hover:text-white transition-colors">Чому CryptoPulse</a>
              <a href="#how-it-works" className="font-montserrat font-normal text-[13px] leading-[16px] text-[#8B8B8B] hover:text-white transition-colors">Як це працює</a>
              <a href="#benefits" className="font-montserrat font-normal text-[13px] leading-[16px] text-[#8B8B8B] hover:text-white transition-colors">Переваги</a>
              <a href="#pricing" className="font-montserrat font-normal text-[13px] leading-[16px] text-[#8B8B8B] hover:text-white transition-colors">Тарифи</a>
              <a href="#faq" className="font-montserrat font-normal text-[13px] leading-[16px] text-[#8B8B8B] hover:text-white transition-colors">FAQ</a>
            </div>

            {/* Колонка: Соцмережі */}
            <div className="flex flex-col gap-[12px]">
              <h4 className="font-montserrat font-semibold text-[13px] leading-[20px] text-white mb-2">Соцмережі</h4>
              <a href="#" className="font-montserrat font-normal text-[13px] leading-[16px] text-[#8B8B8B] hover:text-white transition-colors">Twitter (X)</a>
              <a href="https://t.me/Crypto_Pulse_Official_Bot" target="_blank" rel="noopener noreferrer" className="font-montserrat font-normal text-[13px] leading-[16px] text-[#8B8B8B] hover:text-white transition-colors">Telegram Bot</a>
              <a href="#" className="font-montserrat font-normal text-[13px] leading-[16px] text-[#8B8B8B] hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="font-montserrat font-normal text-[13px] leading-[16px] text-[#8B8B8B] hover:text-white transition-colors">GitHub</a>
            </div>
            
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;