import editIcon from "../../assets/icons/pencil-edit.svg";
import trashIcon from "../../assets/icons/trash.svg";
import alarm from "../../assets/icons/alarm.svg";

export default function AlertsPage() {
  return (
   <div className="w-full  px-[40px] pt-[24px] pb-8 text-white">
      
      {/* TOP */}
      <div className="flex justify-between items-start mb-6">
        <p className=" text-white text-[16px] leading-[20px] max-w-[546px] font-normal">
          Створюйте алерти на сайті та отримуйте сповіщення в Telegram,
          коли задана умова буде виконана
        </p>

        <button className="min-w-[165px] h-[44px] px-6 rounded-full flex items-center justify-center bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-white text-[14px] leading-[20px] font-medium transition-transform  duration-300 ease-out hover:scale-105 active:scale-[0.98]">
         Як створити алерт?
        </button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-[24px] w-full">

        {/* CARD 1 */}
        <div className="p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_80px_rgba(131,72,193,0.4),0_8px_25px_rgba(0,0,0,0.5)] hover:-translate-y-1">
          <div className="relative h-full rounded-[28px] bg-[#050506] p-5 text-center overflow-hidden">
            <p className="text-white text-[14px]">Активні алерти</p>

            <div className="flex items-center justify-center gap-2 mt-2">
              <h2 className="text-2xl font-semibold">3</h2>
              <img src={alarm} className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* CARD 2 */}
        <div className="p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_80px_rgba(131,72,193,0.4),0_8px_25px_rgba(0,0,0,0.5)] hover:-translate-y-1">
          <div className="relative h-full rounded-[28px] bg-[#050506] p-5 text-center overflow-hidden">
           <p className="text-white text-[14px] font-normal">Спрацювали сьогодні</p>
           <h2 className="text-2xl font-semibold mt-2">1</h2>
         </div>
       </div>

        {/* CARD 3 */}
        <div className="p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_80px_rgba(131,72,193,0.4),0_8px_25px_rgba(0,0,0,0.5)] hover:-translate-y-1">
          <div className="relative h-full rounded-[28px] bg-[#050506] p-5 text-center overflow-hidden">
           <p className="text-white text-[14px] font-normal">Telegram підключено</p>
           <h2 className="text-2xl font-semibold mt-2">Так</h2>
         </div>
       </div>

        {/* CARD 4 */}
        <div className="p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_80px_rgba(131,72,193,0.4),0_8px_25px_rgba(0,0,0,0.5)] hover:-translate-y-1">
          <div className="relative h-full rounded-[28px] bg-[#050506] p-5 text-center overflow-hidden">
            <p className="text-white text-[14px] font-normal">Останнє сповіщення</p>
            <h2 className="text-2xl font-semibold mt-2">1 година тому</h2>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
         <div className="rounded-[28px] bg-[#050506] overflow-hidden">

           {/* HEADER */}
           <div className="relative flex items-center px-[24px] py-4 text-[#A3A4B0] text-[14px] font-normal bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)]">
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]" />
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

      {/* FOOTER */}
      <p className="text-center text-[#A3A4B0] text-[14px] font-normal leading-[18px] mt-[24px]">
        Сповіщення про спрацювання алертів надсилаються в Telegram
      </p>
    </div>
  );
}