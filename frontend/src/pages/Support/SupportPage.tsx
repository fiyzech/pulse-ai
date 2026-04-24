import { useState } from 'react';

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(1);

  const faqs = [
    { 
      id: 0, 
      question: 'Як працює функція "Обране" і скільки активів я можу туди додати?',
      answer: (
        <>
          Функція "Обране" дозволяє зберігати улюблені монети для швидкого доступу на головній панелі. Ви можете додати <strong>необмежену кількість активів</strong>, просто натиснувши на іконку зірочки поруч із назвою монети в загальному списку ринків.
        </>
      )
    },
    { 
      id: 1, 
      question: 'Які криптовалюти підтримуються?', 
      answer: (
        <>
          <span className="text-[#A47CF3] font-medium">CryptoPulse</span> підтримує тисячі криптовалют — від Bitcoin і Ethereum до нових альткоїнів. Ви можете відстежувати будь-які активи, які вас цікавлять, в одному зручному інтерфейсі.
        </>
      )
    },
    { 
      id: 2, 
      question: 'Звідки CryptoPulse бере дані про ціни та новини?',
      answer: (
        <>
          Ми агрегуємо дані в режимі реального часу з провідних світових криптобірж (таких як Binance, Bybit, OKX) та надійних фінансових платформ. Це гарантує, що <span className="text-[#A47CF3] font-medium">CryptoPulse</span> надає максимально точну цінову аналітику та актуальні новинні зведення без затримок.
        </>
      )
    },
    { 
      id: 3, 
      question: 'Як налаштувати платформу так, щоб не перевіряти графіки кожні 5 хвилин?',
      answer: (
        <>
          Для цього ми створили систему розумних сповіщень (алертів). Ви можете вказати бажану ціну або відсоток зміни для конкретної монети. Щойно умова виконається, <span className="text-[#A47CF3] font-medium">CryptoPulse</span> миттєво надішле вам повідомлення, тому ви ніколи не пропустите важливий рух ринку.
        </>
      )
    },
    { 
      id: 4, 
      question: 'Чи можна шукати новини тільки по монетах, які мене цікавлять?',
      answer: (
        <>
          Так, звичайно. У розділі новин ви можете використовувати теги та фільтри за конкретними тикерами (наприклад, BTC, SOL). Крім того, на сторінці кожної окремої монети є спеціальна вкладка, де зібрані лише пов'язані з нею останні події та публікації.
        </>
      )
    },
    { 
      id: 5, 
      question: 'Як працює відстеження новин на платформі?',
      answer: (
        <>
          Наша система автоматично збирає інформацію з сотень перевірених джерел. Ми фільтруємо інформаційний шум і показуємо вам лише найважливіші події, які можуть вплинути на ринок, дозволяючи вам приймати зважені торгові рішення на основі свіжого фундаментального аналізу.
        </>
      )
    },
  ];

  // Єдиний стиль для всіх контурів на сторінці
  const gradientBorderStyle = `
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
  `;

  return (
    <section className="text-[#F2F2F2] p-6 w-full mx-auto bg-transparent font-['Montserrat',sans-serif]">
      <style>{gradientBorderStyle}</style>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* ЛІВА СЕКЦІЯ: Поширені запитання */}
        <div className="gradient-border-box bg-[#050506] rounded-[32px] p-10 shadow-2xl">
          <h2 className="text-[24px] font-medium mb-10 text-white tracking-tight leading-none">Поширені запитання</h2>
          <div className="space-y-4">
            {faqs.map((faq) => {
              const isActive = openFaq === faq.id;
              
              return (
                <div 
                  key={faq.id}
                  onClick={() => setOpenFaq(isActive ? null : faq.id)}
                  className="gradient-border-box transition-all duration-300 rounded-[24px] overflow-hidden cursor-pointer"
                  style={isActive ? {
                    background: 'linear-gradient(180deg, rgba(11, 11, 12, 0) 0%, rgba(48, 27, 82, 0.3) 100%)',
                  } : {
                    background: 'transparent'
                  }}
                >
                  <div className="flex justify-between items-center p-6 relative z-10">
                    <span className={`text-[16px] transition-colors ${isActive ? 'text-white font-medium' : 'text-[#E0E0E0] font-normal'}`}>
                      {faq.question}
                    </span>
                    {isActive ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
                        <path d="m18 15-6-6-6 6"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white/30">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    )}
                  </div>
                  {isActive && faq.answer && (
                    <div className="px-6 pb-7 text-[14px] font-normal text-[#B0B0B8] leading-[1.6] relative z-10">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ПРАВА СЕКЦІЯ: Форма */}
        <div className="gradient-border-box bg-[#050506] rounded-[32px] p-10 shadow-2xl flex flex-col h-full">
          <h2 className="text-[24px] font-medium mb-8 text-white tracking-tight leading-none">Зв'язатися з підтримкою</h2>
          <p className="text-[15px] font-normal text-[#B0B0B8] leading-[1.7] mb-12">
            Ми тут, щоб допомогти вам. Якщо у вас виникли питання щодо платформи, алертів або відстеження ринку — наша команда швидко знайде рішення.
          </p>

          <div className="space-y-8">
            <h3 className="text-[16px] font-medium text-white">Заповніть форму для звернення</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[13px] font-normal text-[#8A8A8E] ml-1">Ім'я</label>
                <input 
                  type="text" 
                  placeholder="Введіть Ваше імʼя" 
                  className="w-full bg-[#121214] border border-white/[0.05] rounded-full py-4 px-7 text-[15px] font-normal text-white focus:outline-none focus:border-[#8348C1]/50 placeholder:text-[#5E5E62] transition-colors"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[13px] font-normal text-[#8A8A8E] ml-1">Прізвище</label>
                <input 
                  type="text" 
                  placeholder="Введіть Ваше прізвище" 
                  className="w-full bg-[#121214] border border-white/[0.05] rounded-full py-4 px-7 text-[15px] font-normal text-white focus:outline-none focus:border-[#8348C1]/50 placeholder:text-[#5E5E62] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[13px] font-normal text-[#8A8A8E] ml-1">Тема</label>
              <div className="relative">
                <select className="w-full bg-[#121214] border border-white/[0.05] rounded-full py-4 px-7 text-[15px] font-normal text-[#5E5E62] appearance-none focus:outline-none focus:border-[#8348C1]/50 transition-colors">
                  <option>Введіть тему звернення</option>
                  <option>Технічна підтримка</option>
                  <option>Співпраця</option>
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E5E62] pointer-events-none">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[13px] font-normal text-[#8A8A8E] ml-1">Опишіть проблему</label>
              <textarea 
                placeholder="Повідомлення..." 
                className="w-full bg-[#121214] border border-white/[0.05] rounded-[24px] py-5 px-7 text-[15px] font-normal text-white focus:outline-none focus:border-[#8348C1]/50 placeholder:text-[#5E5E62] resize-none min-h-[160px] transition-colors"
              ></textarea>
            </div>

            <button 
              className="w-full mt-6 py-5 rounded-full text-[16px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99] shadow-[0_10px_20px_rgba(44,25,105,0.3)]"
              style={{
                background: 'linear-gradient(90deg, #4F2CC9 0%, #8348C1 50%, #A47CF3 100%)'
              }}
            >
              Надіслати
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}