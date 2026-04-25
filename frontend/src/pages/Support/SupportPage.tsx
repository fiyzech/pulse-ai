import { useState } from 'react';

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { 
      id: 0, 
      question: 'Як працює функція "Обране" і скільки активів я можу туди додати?',
      height: '88px',
      answer: 'Функція “Обране” дозволяє зберігати криптоактиви, які вас цікавлять, для швидкого доступу та зручного відстеження. Ви можете додати необмежену кількість активів і сформувати власний список без зайвих обмежень.'
    },
    { 
      id: 1, 
      question: 'Які криптовалюти підтримуються?', 
      height: '64px',
      answer: 'CryptoPulse підтримує тисячі криптовалюта — від Bitcoin і Ethereum до нових альткоїнів. Ви можете відстежувати будь-які активи, які вас цікавлять, в одному зручному інтерфейсі.'
    },
    { 
      id: 2, 
      question: 'Звідки CryptoPulse бере дані про ціни та новини?',
      height: '64px',
      answer: 'CryptoPulse використовує перевірені джерела даних, включаючи провідні криптобіржі та новинні платформи. Це дозволяє отримувати актуальні ціни в режимі реального часу та свіжі новини з надійних джерел.'
    },
    { 
      id: 3, 
      question: 'Як налаштувати платформу так, щоб не перевіряти графіки кожні 5 хвилин?',
      height: '82px',
      answer: 'CryptoPulse дозволяє налаштувати сповіщення про зміни цін та важливі події. Ви будете отримувати повідомлення лише тоді, коли це дійсно потрібно, без необхідності постійно перевіряти графіки вручну.'
    },
    { 
      id: 4, 
      question: 'Чи можна шукати новини тільки по монетах, які мене цікавлять?',
      height: '88px',
      answer: 'Так, ви можете фільтрувати новини за конкретними криптовалютами. Це допомагає отримувати лише релевантну інформацію про ті активи, які є у вашому фокусі.'
    },
    { 
      id: 5, 
      question: 'Як працює відстеження новин на платформі?',
      height: '64px',
      answer: 'CryptoPulse автоматично аналізує новинні потоки та підбирає найважливіші оновлення для вас. Ви отримуєте структуровану стрічку новин, яка допомагає швидко орієнтуватися в подіях крипторинку.'
    },
  ];

  const formatAnswer = (text: string) => {
    const parts = text.split(/(CryptoPulse)/g);
    return parts.map((part, index) => 
      part === 'CryptoPulse' 
        ? <span key={index} style={{ color: '#AA54F4' }}>{part}</span> 
        : part
    );
  };

  const globalStyles = `
    .gradient-border-box {
      position: relative;
      border: 1px solid transparent;
      background-clip: padding-box;
    }
    .gradient-border-box::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      padding: 1px; 
      border-radius: inherit; 
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, 0.15) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `;

  return (
    <section className="text-[#F2F2F2] w-full mx-auto bg-transparent font-['Montserrat',sans-serif]">
      <style>{globalStyles}</style>
      
      <div className="pt-[32px] pl-[40px] pr-[40px] pb-[35px] flex justify-start gap-[24px]">
        
        {/* Картка «Поширені запитання» */}
        <div 
          className="gradient-border-box bg-[#050506] rounded-[32px] pt-10 pb-10 px-[24px] shadow-2xl flex-shrink-0 overflow-y-auto no-scrollbar"
          style={{ width: '546px', height: '761px' }}
        >
          <h2 className="text-[24px] font-medium mb-10 text-white tracking-tight leading-none px-4">Поширені запитання</h2>
          <div className="space-y-4">
            {faqs.map((faq) => {
              const isActive = openFaq === faq.id;
              return (
                <div 
                  key={faq.id}
                  onClick={() => setOpenFaq(isActive ? null : faq.id)}
                  className="gradient-border-box transition-all duration-300 rounded-[24px] overflow-hidden cursor-pointer w-[498px] mx-auto"
                  style={{ 
                    minHeight: faq.height,
                    background: isActive ? 'linear-gradient(180deg, rgba(11, 11, 12, 0) 0%, rgba(82, 46, 139, 0.3) 100%)' : 'transparent'
                  }}
                >
                  <div className="flex justify-between items-center p-6 relative z-10 h-full">
                    <span className="text-[16px] font-medium text-white pr-4 transition-colors">
                      {faq.question}
                    </span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className={`flex-shrink-0 transition-transform ${isActive ? 'text-white rotate-180' : 'text-white/30'}`}
                    >
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </div>
                  {isActive && (
                    <div className="px-6 pb-7 text-[14px] font-normal text-[#6D6D6D] leading-[1.6] relative z-10">
                      {formatAnswer(faq.answer)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Картка «Зв'язатися з підтримкою» */}
        <div 
          className="gradient-border-box bg-[#050506] rounded-[32px] pt-10 pb-10 shadow-2xl flex flex-col flex-shrink-0 no-scrollbar"
          style={{ width: '546px', height: '761px' }}
        >
          <h2 className="text-[24px] font-medium mb-[48px] text-[#FFFFFF] tracking-tight leading-none px-[24px]">
            Зв'язатися з підтримкою
          </h2>
          
          <div className="px-[24px] w-full mb-[82px]">
            <p className="text-[16px] font-normal text-[#A3A4B0] leading-[1.5] w-[498px]">
              Ми тут, щоб допомогти вам. Якщо у вас виникли питання щодо платформи, алертів або відстеження ринку — наша команда швидко знайде рішення.
            </p>
          </div>

          <div className="w-full">
            <h3 className="text-[16px] font-medium text-white px-[24px] mb-[24px]">
              Заповніть форму для звернення
            </h3>
            
            <div className="flex flex-col">
              {/* ПІБ секція */}
              <div className="px-[24px] mb-6">
                <div className="flex mb-[12px]">
                   <label className="text-[13px] font-normal text-[#8A8A8E] w-[235px] h-[16px]">Ім'я</label>
                   <div className="w-[26px]"></div>
                   <label className="text-[13px] font-normal text-[#8A8A8E] w-[235px] h-[16px]">Прізвище</label>
                </div>
                <div className="flex gap-[24px]">
                  <input type="text" placeholder="Введіть Ваше імʼя" className="w-[237px] h-[44px] bg-[#121214] border border-white/[0.05] rounded-full px-6 text-[14px] text-white focus:outline-none focus:border-[#8348C1]/50 placeholder:text-[#5E5E62] transition-colors" />
                  <input type="text" placeholder="Введіть Ваше прізвище" className="w-[237px] h-[44px] bg-[#121214] border border-white/[0.05] rounded-full px-6 text-[14px] text-white focus:outline-none focus:border-[#8348C1]/50 placeholder:text-[#5E5E62] transition-colors" />
                </div>
              </div>

              {/* Тема */}
              <div className="px-[24px] mb-6">
                <label className="text-[13px] font-normal text-[#8A8A8E] block w-[360px] h-[16px] mb-[12px]">Тема</label>
                <div className="relative w-[498px] h-[44px]">
                  <select className="w-full h-full bg-[#121214] border border-white/[0.05] rounded-full px-6 text-[14px] text-[#5E5E62] appearance-none focus:outline-none focus:border-[#8348C1]/50 transition-colors">
                    <option>Введіть тему звернення</option>
                    <option>Технічна підтримка</option>
                    <option>Співпраця</option>
                  </select>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-6 top-1/2 -translate-y-1/2 text-[#5E5E62] pointer-events-none">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </div>

              {/* Опишіть проблему: regular 12, колір A3A4B0, 120x16 в одну стрічку */}
              <div className="px-[24px] mb-[40px]">
                <label className="text-[12px] font-normal text-[#A3A4B0] block w-[120px] h-[16px] mb-[12px] whitespace-nowrap overflow-hidden">
                  Опишіть проблему
                </label>
                <textarea 
                  placeholder="Повідомлення..." 
                  className="w-[498px] h-[132px] bg-[#121214] border border-white/[0.05] rounded-[24px] py-4 px-6 text-[14px] text-white focus:outline-none focus:border-[#8348C1]/50 placeholder:text-[#5E5E62] resize-none transition-colors"
                ></textarea>
              </div>

              {/* Кнопка */}
              <div className="px-[24px] pb-[24px]">
                <button 
                  className="w-[498px] h-[44px] rounded-full text-[16px] font-medium text-[#FFFFFF] transition-all hover:opacity-90 active:scale-[0.99] shadow-[0_10px_20px_rgba(44,25,105,0.3)]" 
                  style={{ background: 'linear-gradient(90deg, #4F2CC9 0%, #8348C1 50%, #A47CF3 100%)' }}
                >
                  Надіслати
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}