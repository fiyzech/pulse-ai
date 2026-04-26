import { useState } from 'react';

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { 
      id: 0, 
      question: 'Як працює функція "Обране" і скільки активів я можу туди додати?',
      height: '80px',
      answer: 'Функція “Обране” дозволяє зберігати криптоактиви, які вас цікавлять, для швидкого доступу та зручного відстеження.'
    },
    { 
      id: 1, 
      question: 'Які криптовалюти підтримуються?', 
      height: '60px',
      answer: 'CryptoPulse підтримує тисячі криптовалюта — від Bitcoin і Ethereum до нових альткоїнів.'
    },
    { 
      id: 2, 
      question: 'Звідки CryptoPulse бере дані про ціни та новини?',
      height: '60px',
      answer: 'CryptoPulse використовує перевірені джерела даних, включаючи провідні криптобіржі та новинні платформи.'
    },
    { 
      id: 3, 
      question: 'Як налаштувати платформу так, щоб не перевіряти графіки кожні 5 хвилин?',
      height: '80px',
      answer: 'CryptoPulse дозволяє налаштувати сповіщення про зміни цін та важливі події.'
    },
    { 
      id: 4, 
      question: 'Чи можна шукати новини тільки по монетах, які мене цікавлять?',
      height: '80px',
      answer: 'Так, ви можете фільтрувати новини за конкретними криптовалютами для фокусу на важливому.'
    },
    { 
      id: 5, 
      question: 'Як працює відстеження новин на платформі?',
      height: '60px',
      answer: 'CryptoPulse автоматично аналізує новинні потоки та підбирає найважливіші оновлення для вас.'
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
      /* Яскравіша обводка (0.4 замість 0.15) */
      background: linear-gradient(90deg, #522e8b60 0%, rgba(255, 255, 255, 0.19) 100%);
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
      
      <div className="pt-[24px] pl-[40px] pr-[40px] pb-[24px] flex justify-start gap-[24px]">
        
        {/* Картка «Поширені запитання» - Висота зменшена на 10% */}
        <div 
          className="gradient-border-box bg-[#050506] rounded-[32px] pt-8 pb-8 px-[24px] shadow-2xl flex-shrink-0 overflow-y-auto no-scrollbar"
          style={{ width: '546px', height: '685px' }}
        >
          <h2 className="text-[24px] font-medium mb-8 text-white tracking-tight leading-none px-4">Поширені запитання</h2>
          <div className="space-y-3">
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
                  <div className="flex justify-between items-center p-5 relative z-10 h-full">
                    <span className="text-[15px] font-medium text-white pr-4 transition-colors">
                      {faq.question}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 transition-transform ${isActive ? 'text-white rotate-180' : 'text-white/30'}`}>
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </div>
                  {isActive && (
                    <div className="px-6 pb-6 text-[13px] font-normal text-[#A5A5A5] leading-[1.6] relative z-10">
                      {formatAnswer(faq.answer)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Картка «Зв'язатися з підтримкою» - Висота зменшена на 10% */}
        <div 
          className="gradient-border-box bg-[#050506] rounded-[32px] pt-8 pb-8 shadow-2xl flex flex-col flex-shrink-0 no-scrollbar"
          style={{ width: '546px', height: '685px' }}
        >
          <h2 className="text-[24px] font-medium mb-[32px] text-[#FFFFFF] tracking-tight leading-none px-[24px]">
            Зв'язатися з підтримкою
          </h2>
          
          <div className="px-[24px] w-full mb-[48px]">
            <p className="text-[15px] font-normal text-[#A3A4B0] leading-[1.5] w-[498px]">
              Ми тут, щоб допомогти вам. Якщо у вас виникли питання щодо платформи, алертів або відстеження ринку — наша команда швидко знайде рішення.
            </p>
          </div>

          <div className="w-full mt-auto">
            <h3 className="text-[16px] font-medium text-white px-[24px] mb-[20px]">
              Заповніть форму для звернення
            </h3>
            
            <div className="flex flex-col">
              <div className="px-[24px] mb-4">
                <div className="flex mb-[8px]">
                   <label className="text-[12px] font-normal text-[#8A8A8E] w-[235px]">Ім'я</label>
                   <div className="w-[26px]"></div>
                   <label className="text-[12px] font-normal text-[#8A8A8E] w-[235px]">Прізвище</label>
                </div>
                <div className="flex gap-[24px]">
                  <input type="text" placeholder="Введіть Ваше імʼя" className="w-[237px] h-[40px] bg-[#121214] border border-white/[0.05] rounded-full px-5 text-[13px] text-white focus:outline-none focus:border-[#8348C1]/50 placeholder:text-[#5E5E62]" />
                  <input type="text" placeholder="Введіть Ваше прізвище" className="w-[237px] h-[40px] bg-[#121214] border border-white/[0.05] rounded-full px-5 text-[13px] text-white focus:outline-none focus:border-[#8348C1]/50 placeholder:text-[#5E5E62]" />
                </div>
              </div>

              <div className="px-[24px] mb-4">
                <label className="text-[12px] font-normal text-[#8A8A8E] block mb-[8px]">Тема</label>
                <div className="relative w-[498px] h-[40px]">
                  <select className="w-full h-full bg-[#121214] border border-white/[0.05] rounded-full px-5 text-[13px] text-[#5E5E62] appearance-none focus:outline-none focus:border-[#8348C1]/50">
                    <option>Введіть тему звернення</option>
                  </select>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-5 top-1/2 -translate-y-1/2 text-[#5E5E62] pointer-events-none">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </div>

              <div className="px-[24px] mb-[32px]">
                <label className="text-[12px] font-normal text-[#A3A4B0] block mb-[8px]">Опишіть проблему</label>
                <textarea 
                  placeholder="Повідомлення..." 
                  className="w-[498px] h-[100px] bg-[#121214] border border-white/[0.05] rounded-[20px] py-3 px-5 text-[13px] text-white focus:outline-none focus:border-[#8348C1]/50 placeholder:text-[#5E5E62] resize-none"
                ></textarea>
              </div>

              <div className="px-[24px] pb-[8px]">
                <button 
                  className="w-[498px] h-[44px] rounded-full text-[16px] font-medium text-[#FFFFFF] transition-all hover:opacity-90 active:scale-[0.98] shadow-[0_8px_15px_rgba(44,25,105,0.3)]" 
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