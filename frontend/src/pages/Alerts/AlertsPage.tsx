import editIcon from "../../assets/icons/pencil-edit.svg";
import trashIcon from "../../assets/icons/trash.svg";
import alarm from "../../assets/icons/alarm.svg";

export default function AlertsPage() {
  return (
    <div className="w-full px-[40px] pt-[24px] pb-8 text-white font-montserrat">
      
      {/* 1. ВЕРХНЯ ЧАСТИНА — Кнопка без підсвітки, тільки анімація */}
      <div className="flex justify-between items-start mb-6">
        <p className="text-white text-[16px] leading-[20px] max-w-[546px] font-normal">
          Створюйте алерти на сайті та отримуйте сповіщення в Telegram,
          коли задана умова буде виконана
        </p>

<<<<<<< HEAD
        <button className="min-w-[165px] h-[44px] px-6 rounded-full flex items-center justify-center bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-white text-[14px] leading-[20px] font-medium transition-transform  duration-300 ease-out hover:scale-105 active:scale-[0.98]">
         Як створити алерт?
=======
        <button className="min-w-[165px] h-[44px] px-6 rounded-full flex items-center justify-center bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-white text-[14px] font-medium transition-transform duration-300 hover:scale-105 active:scale-95">
          Створити алерт
>>>>>>> 4bf9b99a1ef91200ca4bc20a038eea94b364c6f2
        </button>
      </div>

      {/* 2. КАРТКИ (КВАДРАТИ) — Залишив яскравішу підсвітку, як ти просив раніше */}
      <div className="grid grid-cols-4 gap-4 mb-[24px] w-full">
        {[
          { label: "Активні алерти", value: "3", icon: alarm },
          { label: "Спрацювали сьогодні", value: "1" },
          { label: "Telegram підключено", value: "Так" },
          { label: "Останнє сповіщення", value: "1 година тому" },
        ].map((item, idx) => (
          <div 
            key={idx} 
            className="p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] transition-all duration-500 hover:shadow-[0_15px_45px_rgba(131,72,193,0.3)] hover:-translate-y-1 group"
          >
            <div className="relative h-full rounded-[28px] bg-[#050506] p-5 text-center transition-colors group-hover:bg-[#08080a]">
              <p className="text-[#A3A4B0] text-[14px] font-normal">{item.label}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <h2 className="text-2xl font-semibold text-white">{item.value}</h2>
                {item.icon && <img src={item.icon} className="w-5 h-5" alt="icon" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. ТАБЛИЦЯ — Статична, без анімацій та підсвіток */}
      <div className="p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_8px_25px_rgba(0,0,0,0.35)]">
        <div className="rounded-[28px] bg-[#050506] overflow-hidden">
          
          {/* HEADER */}
          <div className="flex items-center px-[24px] py-4 text-[#A3A4B0] text-[14px] border-b border-white/10 bg-[linear-gradient(90deg,rgba(96,67,164,0.1)_0%,rgba(1,3,21,0.1)_100%)]">
            <div className="w-[120px]">Валюта</div>
            <div className="w-[140px] ml-[80px]">Умова</div>
            <div className="w-[120px] ml-[80px]">Поточна ціна</div>
            <div className="w-[110px] ml-[80px]">Статус</div>
            <div className="w-[110px] ml-[80px]">Telegram</div>
            <div className="flex-1 text-right pr-4">Дії</div>
          </div>

          {/* ROWS */}
          {[
            { coin: "BTC/USDT", color: "bg-orange-500", condition: "Вище $80,000", price: "$76,889" },
            { coin: "ETH/USDT", color: "bg-purple-500", condition: "Нижче $3,200", price: "$3,260" },
            { coin: "SOL/USDT", color: "bg-blue-500", condition: "Вище $85,00", price: "$83,80" },
          ].map((row, index, arr) => (
            <div key={index}>
              <div className="flex items-center px-[24px] py-5 transition-colors hover:bg-white/[0.03]">
                <div className="w-[120px] flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${row.color} shrink-0`} />
                  <p className="text-[14px] font-medium text-white">{row.coin}</p>
                </div>

                <div className="w-[140px] ml-[80px] text-[14px] text-white">{row.condition}</div>
                <div className="w-[120px] ml-[80px] text-[14px] text-white">{row.price}</div>

                <div className="w-[110px] ml-[80px]">
                  <span className="inline-flex items-center gap-2 rounded-full px-4 py-[6px] text-[12px] bg-[#25DE28]/10 text-[#25DE28] font-medium">
                    <span className="h-2 w-2 rounded-full bg-[#25DE28]" />
                    Активний
                  </span>
                </div>

                <div className="w-[110px] ml-[80px] text-[14px] text-white">Підключено</div>

                {/* Дії */}
                <div className="flex-1 flex justify-end gap-3 pr-4">
                  <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all hover:scale-110 hover:bg-white/10 active:scale-90">
                    <img src={editIcon} className="h-4 w-4" alt="edit" />
                  </button>
                  <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all hover:scale-110 hover:bg-red-500/20 active:scale-90">
                    <img src={trashIcon} className="h-4 w-4" alt="trash" />
                  </button>
                </div>
              </div>
              {index !== arr.length - 1 && <div className="mx-[24px] h-[1px] bg-white/5" />}
            </div>
          ))}
        </div>
      </div>

<<<<<<< HEAD
      {/* TABLE */}
      <div className="p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
         <div className="rounded-[28px] bg-[#050506] overflow-hidden">

           {/* HEADER */}
           <div className="relative flex items-center px-[24px] py-4 text-[#A3A4B0] text-[14px] font-normal bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)]">
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))]" />
             <div className="w-[55px]">
               <span>Валюта</span>
            </div>

             <div className="ml-[161px] w-[46px]">
               <span>Умова</span>
             </div>

             <div className="ml-[154px] w-[97px]">
               <span>Поточна ціна</span>
             </div>

             <div className="ml-[85px] w-[47px]">
               <span>Статус</span>
             </div>

             <div className="ml-[173px] w-[66px]">
               <span>Telegram</span>
             </div>

             <div className="ml-[132px]">
               <span>Дії</span>
             </div>
           </div>

         {/* ROW 1 */}
         <div className="flex items-center px-[24px] py-4">

           {/* Валюта */}
           <div className="w-[128px] flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-orange-500" />
             <p className="text-[14px] font-medium text-white">
               BTC/USDT
             </p>
          </div>

           {/* Умова */}
           <div className="ml-[102px] w-[123px]">
             <p className="text-[14px] font-normal text-white">
               Вище $80,000
             </p>
           </div>

           {/* Ціна */}
           <div className="ml-[64px] w-[56px]">
             <p className="text-[14px] font-normal text-white">
               $76,889
             </p>
           </div>

           {/* Статус */}
           <div className="ml-[122px] w-[103px]">
             <span className="inline-flex items-center gap-2  rounded-full px-4 py-[6px] text-[12px]  bg-[#25DE28]/10 text-[#25DE28] font-medium">
               <span className="h-2 w-2 rounded-full bg-[#25DE28]"/>
               Активний
             </span>
           </div>

           {/* Telegram */}
           <div className="ml-[120px] w-[89px]">
             <p className="text-[14px] font-normal text-white">
               Підключено
             </p>
           </div>

           {/* Дії */}
           <div className="ml-[107px] flex gap-[16px]">
             <div className="p-[1px] rounded-full bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
               <button className="w-8 h-8 rounded-full bg-[#050506] flex items-center justify-center cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:bg-[#111111] active:scale-95">
                 <img src={editIcon} className="h-4 w-4" />
               </button>
             </div>
    
             <div className="p-[1px] rounded-full bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
               <button className="w-8 h-8 rounded-full bg-[#050506] flex items-center justify-center cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:bg-red-500/50 active:scale-95">
                 <img src={trashIcon} className="h-4 w-4" />
               </button>
             </div>
           </div>
         </div>

         <div className="px-[24px]">
           <div className="h-[1px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]" />
         </div>


         {/* ROW 2 */}
         <div className="flex items-center px-[24px] py-4">

           {/* Валюта */}
           <div className="w-[128px] flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-purple-500" />
             <p className="text-[14px] font-medium text-white">
               ETH/USDT
             </p>
          </div>

           {/* Умова */}
           <div className="ml-[102px] w-[111px]">
             <p className="text-[14px] font-normal text-white">
               Нижче $3,200
             </p>
           </div>

           {/* Ціна */}
           <div className="ml-[76px] w-[46px]">
             <p className="text-[14px] font-normal text-white">
               $3,260
             </p>
           </div>

           {/* Статус */}
           <div className="ml-[133px] w-[103px]">
             <span className="inline-flex items-center gap-2  rounded-full px-4 py-[6px] text-[12px]  bg-[#25DE28]/10 text-[#25DE28] font-medium">
               <span className="h-2 w-2 rounded-full bg-[#25DE28]"/>
               Активний
             </span>
           </div>

           {/* Telegram */}
           <div className="ml-[120px] w-[89px]">
             <p className="text-[14px] font-normal text-white">
               Підключено
             </p>
           </div>

           {/* Дії */}
           <div className="ml-[107px] flex gap-[16px]">
             <div className="p-[1px] rounded-full bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
               <button className="w-8 h-8 rounded-full bg-[#050506] flex items-center justify-center cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:bg-[#111111] active:scale-95">
                 <img src={editIcon} className="h-4 w-4" />
               </button>
             </div>
    
             <div className="p-[1px] rounded-full bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
               <button className="w-8 h-8 rounded-full bg-[#050506] flex items-center justify-center cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:bg-red-500/50 active:scale-95">
                 <img src={trashIcon} className="h-4 w-4" />
               </button>
             </div>
           </div>
         </div>

         <div className="px-[24px]">
           <div className="h-[1px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]" />
         </div>


         {/* ROW 3 */}
         <div className="flex items-center px-[24px] py-4">

           {/* Валюта */}
           <div className="w-[128px] flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-purple-500" />
             <p className="text-[14px] font-medium text-white">
               SOL/USDT
             </p>
          </div>

           {/* Умова */}
           <div className="ml-[102px] w-[102px]">
             <p className="text-[14px] font-normal text-white">
               Вище $85,00
             </p>
           </div>

           {/* Ціна */}
           <div className="ml-[85px] w-[47px]">
             <p className="text-[14px] font-normal text-white">
               $83,80
             </p>
           </div>

           {/* Статус */}
           <div className="ml-[133px] w-[103px]">
             <span className="inline-flex items-center gap-2  rounded-full px-4 py-[6px] text-[12px]  bg-[#25DE28]/10 text-[#25DE28] font-medium">
               <span className="h-2 w-2 rounded-full bg-[#25DE28]"/>
               Активний
             </span>
           </div>

           {/* Telegram */}
           <div className="ml-[120px] w-[89px]">
             <p className="text-[14px] font-normal text-white">
               Підключено
             </p>
           </div>

           {/* Дії */}
           <div className="ml-[107px] flex gap-[16px]">
             <div className="p-[1px] rounded-full bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
               <button className="w-8 h-8 rounded-full bg-[#050506] flex items-center justify-center cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:bg-[#111111] active:scale-95">
                 <img src={editIcon} className="h-4 w-4" />
               </button>
             </div>
    
             <div className="p-[1px] rounded-full bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
               <button className="w-8 h-8 rounded-full bg-[#050506] flex items-center justify-center cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:bg-red-500/50 active:scale-95">
                 <img src={trashIcon} className="h-4 w-4" />
               </button>
             </div>
           </div>
         </div>
        </div>
     </div>

=======
>>>>>>> 4bf9b99a1ef91200ca4bc20a038eea94b364c6f2
      {/* FOOTER */}
      <p className="text-center text-[#A3A4B0] text-[14px] font-normal mt-[24px]">
        Сповіщення про спрацювання алертів надсилаються в Telegram
      </p>
    </div>
  );
}