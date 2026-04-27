import editIcon from "../../assets/icons/pencil-edit.svg";
import trashIcon from "../../assets/icons/trash.svg";

export default function AlertsPage() {
  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 pt-6 pb-8 text-white">
      
      {/* TOP */}
      <div className="flex justify-between items-start mb-6">
        <p className="text-white max-w-[520px] leading-relaxed">
          Створюйте алерти на сайті та отримуйте сповіщення в Telegram,
          коли задана умова буде виконана
        </p>

        <button className="px-6 py-2 rounded-full bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)]">
          Створити алерт
        </button>
      </div>

      {/* CARDS */}
      <div className="p-[1px] rounded-2xl bg-[linear-gradient(90deg,#522E8B,#B3B3B3)]">
       <div className="rounded-2xl bg-[#050506] p-5 text-center">
         <p className="text-gray-400">Активні алерти</p>
         <h2 className="text-2xl font-medium mt-2">3</h2>
        </div>

        <div className="rounded-2xl border border-[#6043A4]/30 bg-[#050506] p-5 text-center">
          <p className="text-gray-400">Спрацювали сьогодні</p>
          <h2 className="text-2xl font-medium mt-2">1</h2>
        </div>

        <div className="rounded-2xl border border-[#6043A4]/30 bg-[#050506] p-5 text-center">
          <p className="text-gray-400">Telegram підключено</p>
          <h2 className="text-2xl font-medium mt-2">Так</h2>
        </div>

        <div className="rounded-2xl border border-[#6043A4]/30 bg-[#050506] p-5 text-center">
          <p className="text-gray-400">Останнє сповіщення</p>
          <h2 className="text-2xl font-medium mt-2">1 година тому</h2>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-purple-500/20 bg-[#050506] overflow-hidden">
        
        {/* HEADER */}
        <div className="grid grid-cols-6 px-6 py-4 text-gray-400 border-b border-white/10 bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)]">
          <span>Валюта</span>
          <span>Умова</span>
          <span>Поточна ціна</span>
          <span>Статус</span>
          <span>Telegram</span>
          <span className="text-right">Дії</span>
        </div>

        {/* ROW */}
        <div className="grid grid-cols-6 items-center px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-sm">
              ₿
            </div>
            BTC/USDT
          </div>

          <span>Вище $70,000</span>
          <span>$68,420</span>

         <div className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[13px] font-medium bg-[#25DE28]/15 text-[#25DE28]">
           <span className="h-2 w-2 rounded-full bg-[#25DE28]"></span>
           Активний
         </div>

          <span>Підключено</span>

          <div className="flex justify-end gap-2">
            <button className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
              <img src={editIcon} className="h-4 w-4" />
            </button>

            <button className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
              <img src={trashIcon} className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ROW */}
        <div className="grid grid-cols-6 items-center px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center text-sm">
              ◆
            </div>
            ETH/USDT
          </div>

          <span>Нижче $3,200</span>
          <span>$3,260</span>

         <div className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[13px] font-medium bg-[#25DE28]/15 text-[#25DE28]">
           <span className="h-2 w-2 rounded-full bg-[#25DE28]"></span>
           Активний
         </div>

          <span>Підключено</span>

          <div className="flex justify-end gap-2">
            <button className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
              <img src={editIcon} className="h-4 w-4" />
            </button>

            <button className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
              <img src={trashIcon} className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ROW */}
        <div className="grid grid-cols-6 items-center px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center text-sm">
              ◆
            </div>
            ETH/USDT
          </div>

          <span>Нижче $3,200</span>
          <span>$3,260</span>

          <div className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[13px] font-medium bg-[#25DE28]/15 text-[#25DE28]">
           <span className="h-2 w-2 rounded-full bg-[#25DE28]"></span>
           Активний
         </div>

          <span>Підключено</span>

          <div className="flex justify-end gap-2">
            <button className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
              <img src={editIcon} className="h-4 w-4" />
            </button>

            <button className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
              <img src={trashIcon} className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <p className="text-center text-gray-500 mt-4">
        Сповіщення про спрацювання алертів надсилаються в Telegram
      </p>
    </div>
  );
}