import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState(1);

  const faqs = [
    { id: 0, question: 'Як працює функція "Обране" і скільки активів я можу туди додати?' },
    { 
      id: 1, 
      question: 'Які криптовалюти підтримуються?', 
      answer: (
        <>
          <span className="text-[#8348C1]">CryptoPulse</span> підтримує тисячі криптовалют — від Bitcoin і Ethereum до нових альткоїнів. Ви можете відстежувати будь-які активи, які вас цікавлять, в одному зручному інтерфейсі.
        </>
      )
    },
    { id: 2, question: 'Звідки CryptoPulse бере дані про ціни та новини?' },
    { id: 3, question: 'Як налаштувати платформу так, щоб не перевіряти графіки кожні 5 хвилин?' },
    { id: 4, question: 'Чи можна шукати новини тільки по монетах, які мене цікавлять?' },
    { id: 5, question: 'Як працює відстеження новин на платформі?' },
  ];

  return (
    <section className="text-white p-6 w-full mx-auto bg-transparent font-['Montserrat',sans-serif]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* ЛІВА СЕКЦІЯ: Поширені запитання */}
        <div className="bg-[#0B0B0C] rounded-[28px] p-8 shadow-2xl border border-white/5">
          <h2 className="text-[24px] font-medium mb-8 text-white leading-none">Поширені запитання</h2>
          <div className="space-y-4">
            {faqs.map((faq) => {
              const isActive = openFaq === faq.id;
              
              return (
                <div 
                  key={faq.id}
                  onClick={() => setOpenFaq(isActive ? null : faq.id)}
                  className="transition-all duration-500 rounded-[22px] overflow-hidden cursor-pointer"
                  style={isActive ? {
                    // Менш насичений фіолетовий градієнт: чорний -> приглушений фіолетовий
                    background: 'linear-gradient(180deg, #050506 0%, #301B52 100%)',
                    // Лише переливаючий контур зліва направо, без білої смужки зверху
                    border: '1px solid',
                    borderImageSource: 'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.2) 100%)',
                    borderImageSlice: 1,
                  } : {
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <div className="flex justify-between items-center p-5">
                    <span className="text-[16px] font-medium text-white">
                      {faq.question}
                    </span>
                    {isActive ? (
                      <ChevronUp className="w-5 h-5 text-white" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                  {isActive && faq.answer && (
                    <div className="px-5 pb-6 text-[14px] font-normal text-[#A3A4B0] leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ПРАВА СЕКЦІЯ: Форма */}
        <div className="bg-[#0B0B0C] rounded-[28px] p-8 shadow-2xl border border-white/5 flex flex-col h-full">
          <h2 className="text-[24px] font-medium mb-6 text-white leading-none">Зв'язатися з підтримкою</h2>
          
          <p className="text-[16px] font-normal text-[#A3A4B0] leading-relaxed mb-10">
            Ми тут, щоб допомогти вам. Якщо у вас виникли питання щодо платформи, алертів або відстеження ринку — наша команда швидко знайде рішення.
          </p>

          <div className="space-y-6">
            <h3 className="text-[16px] font-medium text-white">Заповніть форму для звернення</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[12px] font-normal text-[#A3A4B0] ml-1">Ім'я</label>
                <input 
                  type="text" 
                  placeholder="Введіть Ваше імʼя" 
                  className="w-full bg-white/5 border border-white/5 rounded-full py-3 px-6 text-[16px] font-normal text-white focus:outline-none focus:border-white/20 placeholder:text-[#9E9E9E]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-normal text-[#A3A4B0] ml-1">Прізвище</label>
                <input 
                  type="text" 
                  placeholder="Введіть Ваше прізвище" 
                  className="w-full bg-white/5 border border-white/5 rounded-full py-3 px-6 text-[16px] font-normal text-white focus:outline-none focus:border-white/20 placeholder:text-[#9E9E9E]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-normal text-[#A3A4B0] ml-1">Тема</label>
              <div className="relative">
                <select className="w-full bg-white/5 border border-white/5 rounded-full py-3 px-6 text-[16px] font-normal text-[#9E9E9E] appearance-none focus:outline-none focus:border-white/20">
                  <option>Введіть тему звернення</option>
                  <option>Технічна підтримка</option>
                  <option>Співпраця</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-normal text-[#A3A4B0] ml-1">Опишіть проблему</label>
              <textarea 
                placeholder="Повідомлення..." 
                rows="4"
                className="w-full bg-white/5 border border-white/5 rounded-[22px] py-4 px-6 text-[16px] font-normal text-white focus:outline-none focus:border-white/20 placeholder:text-[#9E9E9E] resize-none"
              ></textarea>
            </div>

            <button 
              className="w-full mt-4 py-4 rounded-full text-[16px] font-medium text-white transition-all shadow-lg active:scale-[0.98]"
              style={{
                background: 'linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%)'
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