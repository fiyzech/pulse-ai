import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Імпорти картинок
import phoneImg from '../../assets/images/phone.png';
import figureImg from '../../assets/images/figure.svg';
import welcomeImg from '../../assets/images/welcome_bage.svg';
import plansImg from '../../assets/images/plans.svg';
import laptopImg from '../../assets/images/laptop.svg';

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
    <div 
      className={`mb-3 rounded-[16px] border border-[#2C1969] transition-all duration-300 overflow-hidden ${
        isOpen ? 'bg-[linear-gradient(180deg,rgba(131,72,193,0.1)_0%,rgba(5,5,10,1)_100%)] shadow-[0_10px_30px_rgba(0,0,0,0.2)]' : 'bg-[#05050A]'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-5 py-4 text-left transition-colors group"
      >
        <span className="font-montserrat font-medium text-[16px] text-white group-hover:text-[#A78BFA]">
          {question}
        </span>
        <svg 
          width="18" height="18" viewBox="0 0 24 24" fill="none" 
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 9L12 15L18 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-4 font-montserrat font-light text-[14px] leading-[22px] text-white/60 border-t border-white/5 pt-3">
          {answer || 'Детальна відповідь на це запитання знаходиться в процесі наповнення.'}
        </div>
      </div>
    </div>
  );
};

// --- КОМПОНЕНТ ТЕЛЕФОНУ ---
const PhoneMockup: React.FC = () => {
  return (
    <div className="relative w-full flex justify-center lg:justify-start lg:flex-1 group perspective-[1000px]">
      <div className="absolute top-1/2 left-1/2 lg:left-[160px] -translate-x-1/2 -translate-y-1/2 w-[250px] h-[400px] bg-[#7E50ED]/20 blur-[100px] rounded-full pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-70"></div>
      
      <div className="relative z-10 w-full max-w-[280px] md:max-w-[340px] drop-shadow-[0_20px_40px_rgba(126,80,237,0.2)] rounded-[40px] p-[1px] bg-gradient-to-br from-[#8348C1]/50 to-[#2C1969]/50 transition-transform duration-500 hover:rotate-y-[-5deg] hover:scale-[1.02]">
        <div className="relative w-full h-full bg-[#05050A] rounded-[39px] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none rounded-[39px] shadow-[inset_0_0_40px_rgba(131,72,193,0.3),inset_0_0_15px_rgba(131,72,193,0.5)] z-20 mix-blend-screen"></div>
          <img
            src={phoneImg} 
            alt="App interface"
            className="w-full h-auto object-contain relative z-10"
          />
        </div>
      </div>
    </div>
  );
};

// --- КАРТКА ФУНКЦІЇ ---
const FeatureCard: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => {
  return (
    <div className="p-[1px] rounded-[16px] bg-gradient-to-b from-white/20 via-[#8348C1]/20 to-[#2C1969]/50 shadow-[0_0_15px_rgba(131,72,193,0.05)] transition-transform hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(131,72,193,0.15)] group h-full transform-gpu">
      <div className="flex flex-col items-center justify-center text-center h-full min-h-[110px] px-4 py-7 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_-20%,#05050A_30%,#05050A_70%,rgba(131,72,193,0.15)_120%)] rounded-[15px]">
        <p className="font-montserrat font-light text-[15px] text-white/70 group-hover:text-white/90 transition-colors leading-[1.6]">
          {title}
          <br />
          {subtitle}
        </p>
      </div>
    </div>
  );
};

// --- КОМПОНЕНТ ЕЛЕМЕНТА ПЕРЕВАГИ ---
const BenefitItem: React.FC<{ title: string; description: string }> = ({ title, description }) => {
  return (
    <div className="relative flex gap-6 py-10 group transform-gpu">
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#8348C1]/50 to-transparent group-last:hidden"></div>

      <div className="flex-shrink-0 mt-1">
        <div className="w-[52px] h-[52px] rounded-full p-[1px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[52%] to-[#FFFFFF] shadow-[0_0_15px_rgba(131,72,193,0.15)] transition-transform duration-300 group-hover:scale-110">
          <div className="w-full h-full rounded-full bg-[#000008] flex items-center justify-center transition-colors duration-300 group-hover:bg-[#0A0516]">
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.6667 3.5L5.25 9.91667L2.33333 7" stroke="#8348C1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col pt-1">
        <h3 className="font-montserrat font-medium text-[24px] leading-[32px] tracking-[0.04em] uppercase mb-4 text-white transition-colors duration-300 group-hover:text-[#ceafef]">
          {title}
        </h3>
        <p className="font-montserrat font-normal text-[16px] leading-[24px] text-white/70 transition-colors duration-300 group-hover:text-white/90">
          {description}
        </p>
      </div>
    </div>
  );
};

// --- КОМПОНЕНТ КАРТКИ "ЯК ЦЕ ПРАЦЮЄ" ---
const StepCard: React.FC<{ number: string; title: string; description: string; imgSrc: string }> = ({ number, title, description, imgSrc }) => {
  return (
    <div className="relative flex flex-col px-8 py-10 rounded-[16px] border border-[#2C1969] bg-[#05050A] mt-10 md:mt-0 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(131,72,193,0.2)] group transform-gpu">
      <div className="absolute -top-[30px] -left-[15px] lg:-left-[30px] w-[60px] h-[60px] rounded-full p-[1px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[52%] to-[#FFFFFF] shadow-[0_0_15px_rgba(131,72,193,0.3)] z-10 transition-transform duration-500 group-hover:scale-110">
        <div className="w-full h-full rounded-full bg-[#000000] flex items-center justify-center">
            <span className="font-montserrat font-medium text-[24px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[52%] to-[#FFFFFF] bg-clip-text text-transparent">
                {number}
            </span>
        </div>
      </div>

      <div className="w-full flex justify-center mb-10 h-[220px] relative">
         <div className="absolute inset-0 bg-[#8348C1]/0 group-hover:bg-[#8348C1]/10 blur-[40px] rounded-full transition-colors duration-500"></div>
        <img 
          src={imgSrc} 
          alt={title} 
          className="h-full w-auto object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-105 relative z-10" 
        />
      </div>

      <h3 className="font-montserrat font-medium text-[24px] leading-[32px] text-white mb-4 transition-colors duration-300 group-hover:text-[#ceafef]">
        {title}
      </h3>
      
      <p className="font-montserrat font-normal text-[16px] leading-[24px] text-white/70 transition-colors duration-300 group-hover:text-white/90">
        {description}
      </p>
    </div>
  );
};


// --- ГОЛОВНА СТОРІНКА ---
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);

  const navLinks = [
    { label: 'Чому CryptoPulse', href: '#why-cryptopulse' },
    { label: 'Функції', href: '#features' },
    { label: 'Переваги', href: '#benefits' }, 
    { label: 'Як це працює', href: '#how-it-works' },
    { label: 'Тарифи', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
   <div className="relative flex flex-col bg-[#000008] overflow-x-hidden text-white font-montserrat antialiased">
      
      {/* 1. НАВІГАЦІЯ */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center py-5 px-6 md:px-12 bg-[#000008]/95 border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
          <img src="/logo-crypro-pulse.svg" alt="CryptoPulse" className="w-7 h-7 object-contain" />
          <div className="text-[18px] font-montserrat tracking-wide">
            <span className="font-light text-white">Crypto</span>
            <span className="font-medium bg-gradient-to-r from-[#ceafef] to-[#9a64d4] bg-clip-text text-transparent">Pulse</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-10 text-[16px] font-montserrat font-light text-white/90">
          {navLinks.map((item) => (
            <a key={item.label} href={item.href} className="hover:text-white transition-colors">
              {item.label}
            </a>
          ))}
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="hidden md:flex h-[44px] p-[1px] rounded-[28px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[52%] to-[#FFFFFF] transition-all hover:shadow-[0_0_15px_rgba(131,72,193,0.3)] group transform-gpu"
        >
          <div className="flex items-center justify-center h-full px-[24px] rounded-[27px] bg-[#000008] group-hover:bg-[#120B1D] transition-colors">
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
            Створюйте персональні сповіщення для криптовалют і отримуйте
            повідомлення, коли ціна досягає потрібного рівня.
            <br className="hidden md:block" />
            Усі сповіщення миттєво надходять через Telegram-бота.
          </p>

          <button
            onClick={() => navigate('/dashboard')}
            className="px-[34px] py-[11px] rounded-full tracking-wide font-montserrat font-medium text-[18px] text-white bg-gradient-to-r from-[#3D1B7C] to-[#B783FF] transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(183,131,255,0.4)]"
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
      <section id="why-cryptopulse" className="relative w-full bg-[#000008] z-20 flex justify-center overflow-hidden transform-gpu">
       <div className="w-full max-w-[1440px] flex flex-col lg:flex-row lg:items-center pt-20 pb-20 lg:pt-[120px] lg:pb-[120px] pl-6 lg:pl-[80px] pr-6 lg:pr-[80px] gap-12 lg:gap-[250px]">
          
          <div className="flex flex-col items-start w-full lg:w-[515px] lg:min-w-[515px] shrink-0">
            <div className="inline-flex p-[1px] rounded-[16px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[52%] to-[#FFFFFF] mb-8 shadow-[0_0_15px_rgba(131,72,193,0.1)]">
              <div className="flex items-center gap-[8px] px-[12px] py-[8px] bg-[linear-gradient(180deg,rgba(255,255,255,0.15)_-60%,#000008_30%,#000008_70%,rgba(131,72,193,0.2)_160%)] rounded-[15px]">
                <div className="w-[6px] h-[6px] rounded-full bg-[#FFFFFF]"></div>
                <span className="font-montserrat text-[13px] uppercase font-semibold tracking-wider text-[#8348C1]">
                  Чому саме CryptoPulse?
                </span>
              </div>
            </div>

            <p className="font-montserrat font-light text-[20px] leading-[28px] text-[#FFFFFF]">
              Налаштовуйте персональні сповіщення про зміну цін криптовалют і отримуйте
              повідомлення, коли ринок досягає заданих вами умов. Система автоматично відстежує
              коливання вартості активів та миттєво надсилає сповіщення через Telegram.
            </p>
          </div>

          <PhoneMockup />

        </div>
      </section>

      {/* 4. КЛЮЧОВІ ФУНКЦІЇ */}
      <section id="features" className="relative py-24 px-6 md:px-10 flex flex-col items-center z-20 bg-[#000008] transform-gpu">
        
        <div className="inline-flex p-[1px] rounded-[16px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[52%] to-[#FFFFFF] mb-8 shadow-[0_0_15px_rgba(131,72,193,0.1)]">
          <div className="flex items-center gap-[8px] px-[10px] py-[6px] bg-[linear-gradient(180deg,rgba(255,255,255,0.15)_-60%,#000008_30%,#000008_70%,rgba(131,72,193,0.2)_160%)] rounded-[15px]">
            <div className="w-[6px] h-[6px] rounded-full bg-[#FFFFFF]"></div>
            <span className="font-montserrat text-[12px] md:text-[13px] uppercase tracking-wider text-[#8348C1]">
              ОСНОВНІ ФУНКЦІЇ САЙТУ
            </span>
          </div>
        </div>

        <h2 className="text-[32px] md:text-[44px] font-montserrat font-medium mb-16 text-center leading-[1.2] text-white">
          Ключові функції для
          <br />
          відстеження криптовалют
        </h2>

        <div className="flex flex-col gap-6 max-w-[1200px] w-full mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard title="Реєстрація" subtitle="та авторизація користувачів" />
            <FeatureCard title="Перегляд списку" subtitle="криптовалютних активів" />
            <FeatureCard title="Детальна" subtitle="інформація про актив" />
            <FeatureCard title="Створення сповіщень" subtitle="про зміну ціни активу" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:justify-center gap-6">
            <div className="w-full lg:w-[calc(25%-18px)]">
              <FeatureCard title="Перегляд та керування" subtitle="створеними сповіщеннями" />
            </div>
            <div className="w-full lg:w-[calc(25%-18px)]">
              <FeatureCard title="Отримання" subtitle="сповіщень у Telegram" />
            </div>
            <div className="w-full lg:w-[calc(25%-18px)]">
              <FeatureCard title="Перегляд" subtitle="історії сповіщень" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. ПЕРЕВАГИ СЕРВІСУ */}
      <section id="benefits" className="relative w-full bg-[#000008] z-20 flex justify-center py-24 transform-gpu">
        <div className="w-full max-w-[1440px] px-6 lg:px-[80px] flex flex-col lg:flex-row gap-16 lg:gap-[150px] items-start">
          
          <div className="flex flex-col w-full lg:w-[624px] shrink-0">
            <div className="inline-flex self-start p-[1px] rounded-[16px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[52%] to-[#FFFFFF] mb-8 shadow-[0_0_15px_rgba(131,72,193,0.1)]">
              <div className="flex items-center gap-[8px] px-[12px] py-[8px] bg-[linear-gradient(180deg,rgba(255,255,255,0.15)_-60%,#000008_30%,#000008_70%,rgba(131,72,193,0.2)_160%)] rounded-[15px]">
                <div className="w-[6px] h-[6px] rounded-full bg-[#FFFFFF]"></div>
                <span className="font-montserrat text-[13px] uppercase font-semibold tracking-wider text-[#8348C1]">
                  ПЕРЕВАГИ СЕРВІСУ
                </span>
              </div>
            </div>

            <h2 className="text-[36px] md:text-[44px] font-montserrat font-medium mb-12 leading-[56px] text-white">
              Чому варто користуватися
              <br className="hidden lg:block"/>
              нашим сервісом
            </h2>

            <div className="relative w-full flex justify-center mt-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#7E50ED]/20 blur-[120px] rounded-full pointer-events-none transform-gpu"></div>
              <img 
                src={figureImg} 
                alt="3D Abstract Shape" 
                className="relative z-10 w-[80%] max-w-[400px] h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              />
            </div>
          </div>

          <div className="flex-1 w-full lg:pt-[10px]">
            <div className="flex flex-col">
              <BenefitItem 
                title="ВІДСТЕЖЕННЯ ЦІН КРИПТОВАЛЮТ" 
                description="Система автоматично відстежує зміни цін криптовалют у реальному часі та оновлює дані на дашборді, щоб ви завжди бачили актуальну вартість і динаміку ринку" 
              />
              <BenefitItem 
                title="ЗРУЧНИЙ ІНТЕРФЕЙС ДЛЯ РОБОТИ З АКТИВАМИ ТА СПОВІЩЕННЯМИ" 
                description="Інтуїтивний інтерфейс дозволяє легко керувати криптоактивами, швидко переглядати інформацію та налаштовувати сповіщення про важливі зміни на ринку" 
              />
              <BenefitItem 
                title="ПЕРСОНАЛЬНІ АЛЕРТИ ТА TELEGRAM СПОВІЩЕННЯ" 
                description="Налаштовуйте індивідуальні алерти для криптовалют і отримуйте миттєві сповіщення через Telegram-бота, коли ціна досягає заданого рівня або відбуваються важливі зміни на ринку." 
              />
              <BenefitItem 
                title="ВИКОРИСТОВУЙТЕ ШІ-АСИСТЕНТА" 
                description="Отримуйте швидкий аналіз ринку, підказки та інсайти в реальному часі, щоб приймати більш обґрунтовані рішення." 
              />
            </div>
          </div>

        </div>
      </section>

      {/* 6. ЯК ЦЕ ПРАЦЮЄ */}
      <section id="how-it-works" className="py-24 px-8 md:px-12 relative z-20 bg-[#000008] flex flex-col items-center transform-gpu">
        
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
            description="Швидка реєстрація — і ви отримуєте доступ до всіх можливостей CryptoPulse."
            imgSrc={welcomeImg} 
          />
          
          <StepCard 
            number="2"
            title="Обери план"
            description="Підключи тариф, який відповідає твоїм потребам, і відкрий розширені функції."
            imgSrc={plansImg} 
          />
          
          <StepCard 
            number="3"
            title="Відстежуй криптовалюти"
            description="Слідкуй за ринком у реальному часі, отримуй сповіщення про зміни цін та користуйся ШІ-помічником для швидкого аналізу і прийняття рішень."
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
        <div className="flex items-center justify-center gap-4 mb-16">
          <span className={`font-montserrat text-[16px] transition-colors duration-300 ${!isYearly ? 'text-white' : 'text-white/50'}`}>Місяць</span>
          
          <div 
            className="w-[48px] h-[26px] rounded-full bg-[#120924] border border-[#2C1969] p-[3px] cursor-pointer relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] transition-colors hover:border-[#8348C1]"
            onClick={() => setIsYearly(!isYearly)}
          >
            <div className={`w-[18px] h-[18px] rounded-full bg-[#A78BFA] shadow-[0_0_8px_rgba(167,139,250,0.8)] absolute top-[3px] transition-transform duration-300 ease-out ${isYearly ? 'translate-x-[22px]' : 'translate-x-0'}`}></div>
          </div>
          
          <span className={`font-montserrat text-[16px] transition-colors duration-300 ${isYearly ? 'text-white' : 'text-white/50'}`}>Рік</span>
        </div>

        {/* Контейнер тарифів */}
        <div className="flex flex-col lg:flex-row justify-center items-center lg:items-center gap-6 max-w-[1250px] mx-auto w-full">
          
          {/* Картка "Безкоштовно" */}
          <div 
            className="w-full lg:w-[405px] h-auto lg:min-h-[456px] rounded-[24px] border border-[#2C1969] bg-[#000008] p-8 flex flex-col text-left opacity-0 animate-fade-up transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(131,72,193,0.1)] relative group"
            style={{ animationDelay: '0ms' }}
          >
            <h3 className="font-montserrat text-[16px] font-medium text-white mb-4">Безкоштовно</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-montserrat text-[48px] font-medium text-white leading-none">€0</span>
              <span className="font-montserrat text-[14px] text-white/50">/{isYearly ? 'рік' : 'місяць'}</span>
            </div>
            
            {/* Згасаюча лінія */}
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#2C1969] to-transparent mb-6 transition-colors duration-300 group-hover:via-[#8348C1]/70"></div>
            
            {/* Список з Montserrat (Шрифт 16px, Line Height 20px) */}
            <ul className="flex flex-col gap-[14px] mb-8">
              <li className="flex items-center gap-3">
                <div className="w-[4px] h-[4px] rounded-full bg-white shrink-0"></div>
                <span className="font-montserrat font-normal text-[16px] leading-[20px] text-white">Відстеження до 60 криптовалют</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-[4px] h-[4px] rounded-full bg-white shrink-0"></div>
                <span className="font-montserrat font-normal text-[16px] leading-[20px] text-white">Оновлення даних кожних 60 секунд</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-[4px] h-[4px] rounded-full bg-white shrink-0"></div>
                <span className="font-montserrat font-normal text-[16px] leading-[20px] text-white">До 3 активних алертів</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-[4px] h-[4px] rounded-full bg-white shrink-0"></div>
                <span className="font-montserrat font-normal text-[16px] leading-[20px] text-white">Telegram сповіщення</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-[4px] h-[4px] rounded-full bg-white shrink-0"></div>
                <span className="font-montserrat font-normal text-[16px] leading-[20px] text-white">Історія сповіщень до 7 днів</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-[4px] h-[4px] rounded-full bg-white shrink-0"></div>
                <span className="font-montserrat font-regular text-[16px] leading-[20px] text-white">Базовий Dashboard</span>
              </li>
            </ul>
            
            <div className="mt-auto">
              <div className="w-full h-[48px] p-[1px] rounded-[8px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[52%] to-[#FFFFFF]">
                <button className="w-full h-full bg-[#000008] rounded-[7px] flex items-center justify-center text-[14px] font-montserrat font-medium text-white hover:bg-white/5 transition-colors uppercase tracking-wider">
                  ПОЧАТИ ЗАРАЗ
                </button>
              </div>
            </div>
          </div>

          {/* Картка "Pro" */}
<div 
  className="w-full lg:w-[406px] h-auto lg:min-h-[490px] rounded-[24px] p-[1px] relative opacity-0 animate-fade-up transform-gpu transition-all duration-300 lg:-translate-y-4 hover:lg:-translate-y-6 z-10 shadow-[0_0_30px_rgba(131,72,193,0.3)] bg-gradient-to-b from-[#8348C1] via-[#2C1969] to-[#FFFFFF]/20" 
  style={{ animationDelay: '200ms' }}
>
  <div 
    className="w-full h-full rounded-[23px] bg-[#0A0516] bg-cover bg-center p-8 flex flex-col relative text-left"
    style={{ backgroundImage: `url(${bgForPro})` }}
  >
    {/* Бадж "Популярний" */}
    <div className="flex justify-between items-start mb-4">
      <h3 className="font-montserrat text-[16px] font-normal text-white">Pro</h3>
      <div className="px-3 py-1 rounded-full border border-[#8348C1] text-[11px] font-montserrat font-normal text-[#ceafef] bg-[#8348C1]/20 backdrop-blur-md">
        Популярний
      </div>
    </div>
    
    <div className="flex items-baseline gap-1 mb-6">
      <span className="font-montserrat font-medium text-[48px] text-white leading-none">€{isYearly ? '70' : '7'}</span>
      <span className="font-montserrat font-normal text-[14px] text-white/50">/{isYearly ? 'рік' : 'місяць'}</span>
    </div>
    
    {/* Роздільна лінія */}
    <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#8348C1]/70 to-transparent mb-6"></div>
    
    <p className="font-montserrat font-normal text-[15px] text-white mb-3">Все з Free, +:</p>
    
    <ul className="flex flex-col gap-[14px] mb-8">
      {[
        "Відстеження до 100 криптовалют",
        "Оновлення даних кожні 15 секунд",
        "Повна інтеграція з Telegram",
        "Розширені типи алертів",
        "Історія сповіщень до 90 днів",
        "До 5 Watchlist",
        "Експорт даних у CSV",
        "Портфоліо трекер (прибуток/збиток)",
        "Швидка підтримка"
      ].map((text, idx) => (
        <li key={idx} className="flex items-center gap-3">
          <div className="w-[4px] h-[4px] rounded-full bg-white shrink-0"></div>
          <span className="font-montserrat font-normal text-[16px] leading-[20px] text-white/90">{text}</span>
        </li>
      ))}
    </ul>
    
    <button className="w-full h-[48px] mt-auto rounded-[8px] font-montserrat font-medium text-[14px] uppercase tracking-wider bg-gradient-to-r from-[#6B37C6] to-[#9B64E5] text-white hover:shadow-[0_0_20px_rgba(155,100,229,0.4)] transition-all active:scale-[0.98]">
      ПОЧАТИ ЗАРАЗ
    </button>
  </div>
</div>

          {/* Картка "Бізнес" */}
          <div 
            className="w-full lg:w-[405px] h-auto lg:min-h-[456px] rounded-[24px] border border-[#2C1969] bg-[#000008] p-8 flex flex-col text-left opacity-0 animate-fade-up transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(131,72,193,0.1)] relative group"
            style={{ animationDelay: '400ms' }}
          >
            <h3 className="font-montserrat text-[16px] font-normal text-white/70 mb-4">Бізнес</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-montserrat font-medium text-[48px] text-white leading-none">€{isYearly ? '190' : '19'}</span>
              <span className="font-montserrat font-normal text-[14px] text-white/50">/{isYearly ? 'рік' : 'місяць'}</span>
            </div>
            
            {/* Згасаюча лінія */}
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#2C1969] to-transparent mb-6 transition-colors duration-300 group-hover:via-[#8348C1]/70"></div>
            
            <p className="font-montserrat font-normal text-[15px] text-white mb-3">Все з Pro, +:</p>
            
            {/* Список з Montserrat (Шрифт 16px, Line Height 20px) */}
            <ul className="flex flex-col gap-[14px] mb-8">
              <li className="flex items-center gap-3">
                <div className="w-[4px] h-[4px] rounded-full bg-white shrink-0"></div>
                <span className="font-montserrat font-normal text-[16px] leading-[20px] text-white/80">Необмежена кількість активів</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-[4px] h-[4px] rounded-full bg-white shrink-0"></div>
                <span className="font-montserrat font-normal text-[16px] leading-[20px] text-white/80">Необмежена кількість алертів</span>
              </li>
              
              <li className="flex items-center gap-3">
                <div className="w-[4px] h-[4px] rounded-full bg-white shrink-0"></div>
                <span className="font-montserrat font-normal text-[16px] leading-[20px] text-white/80">AI помічник</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-[4px] h-[4px] rounded-full bg-white shrink-0"></div>
                <span className="font-montserrat font-normal text-[16px] leading-[20px] text-white/80">Розширена аналітика</span>
              </li>
              
              <li className="flex items-center gap-3">
                <div className="w-[4px] h-[4px] rounded-full bg-white shrink-0"></div>
                <span className="font-montserrat font-normal text-[16px] leading-[20px] text-white/80">Необмежена історія даних</span>
              </li>
              
            </ul>
            
            <div className="mt-auto">
              {/* Кнопка з градієнтною рамкою */}
              <div className="w-full h-[48px] p-[1px] rounded-[8px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] via-[52%] to-[#FFFFFF]">
                <button className="w-full h-full bg-[#000008] rounded-[7px] flex items-center justify-center text-[14px] font-montserrat font-medium text-white hover:bg-white/5 transition-colors uppercase tracking-wider">
                  ПОЧАТИ ЗАРАЗ
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 8. CЛІДКУЙТЕ ЗА РИНКОМ */}
      <section className="py-24 px-6 md:px-10 flex flex-col items-center justify-center text-center relative z-20 overflow-hidden transform-gpu">
        {/* Фонове світіння залишаємо для акценту */}
       
        <div className="relative z-10 flex flex-col items-center w-full max-w-[624px]">
          <h2 className="font-montserrat font-medium text-[36px] md:text-[44px] leading-[46px] md:leading-[56px] text-white mb-6">
            Слідкуйте за ринком<br />без зайвих зусиль
          </h2>
          
          <p className="font-montserrat font-light text-[16px] md:text-[20px] leading-[26px] md:leading-[24px] text-white/80 mb-10 w-full">
            Відстежуйте ціни, автоматизуйте сповіщення<br className="hidden md:block"/> та залишайтесь на крок попереду без постійної перевірки графіків
          </p>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="px-[40px] py-[14px] rounded-full font-montserrat font-medium text-[16px] text-white bg-gradient-to-r from-[#4A269C] to-[#9C65E8] transition-all hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(156,101,232,0.4)] active:scale-[0.98]"
          >
            Почати відстеження
          </button>
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="py-32 px-6 lg:px-[80px] relative z-20 bg-[#000008] transform-gpu">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Ліва частина: Заголовок */}
          <div className="flex flex-col items-start lg:w-1/3">
            <div className="inline-flex p-[1px] rounded-[16px] bg-gradient-to-r from-[#FFFFFF] via-[#8348C1] via-[48%] to-[#2C1969] mb-8">
              <div className="flex items-center gap-[8px] px-[12px] py-[6px] bg-[#05050A] rounded-[15px]">
                <div className="w-[6px] h-[6px] rounded-full bg-white"></div>
                <span className="font-montserrat text-[13px] uppercase font-semibold tracking-wider text-[#8348C1]">
                  FAQ
                </span>
              </div>
            </div>

            <h2 className="font-montserrat font-medium text-[32px] leading-[66px] tracking-[0.04em] text-white">
              Поширені запитання
            </h2>
          </div>

          {/* Права частина: Список питань */}
          <div className="lg:flex-1 max-w-[624px]">
            <FaqItem
              question="Що таке CryptoPulse?"
              answer="CryptoPulse — це зручний сервіс для автоматичного відстеження цін на криптовалюти зі зручними сповіщеннями прямо у ваш Telegram. Ви самі задаєте умови, а ми слідкуємо за ринком 24/7."
            />
            <FaqItem 
              question="Які криптовалюти підтримуються?" 
              answer="CryptoPulse підтримує тисячі криптовалют — від Bitcoin і Ethereum до нових альткоїнів. Ви можете відстежувати будь-які активи, які вас цікавлять, в одному зручному інтерфейсі."
            />
            <FaqItem question="Чи можу я користуватися CryptoPulse з мобільного пристрою?" />
            <FaqItem question="Як я можу звернутися до служби підтримки?" />
          </div>
        </div>
      </section>



      {/* 10. ФУТЕР */}
      <footer className="py-8 px-6 md:px-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] font-medium text-white/40 z-20 bg-[#000008]">
        <div className="flex items-center gap-2">
          <img src="/logo-crypro-pulse.svg" alt="CryptoPulse" className="w-5 h-5 opacity-40 grayscale" />
          <span>© 2024 CryptoPulse. Всі права захищено.</span>
        </div>
        <div className="flex gap-8">
          <a href="#" className="hover:text-white transition-colors">Умови використання</a>
          <a href="#" className="hover:text-white transition-colors">Політика конфіденційності</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;