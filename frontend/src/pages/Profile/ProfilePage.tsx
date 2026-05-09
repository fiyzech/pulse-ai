import userAvatar from "../../assets/images/user_avatar.png";
import editIcon from "../../assets/icons/pencil-edit.svg";

const cardWrapper =
  "p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_100px_rgba(131,72,193,0.3),0_8px_25px_rgba(0,0,0,0.4)]";

export default function ProfilePage() {
  return (
    <div className="w-full h-screen overflow-hidden bg-[#050505] text-white px-[40px] pt-[24px]">
      <div className="flex flex-col gap-[24px] h-full">

        {/* USER */}
        <section className="flex flex-col gap-[24px]">
          <h2 className="text-[24px] leading-[28px] font-semibold text-white">
            Користувач
          </h2>

          <div className={cardWrapper}>
            <div className="relative flex items-center justify-between h-[108px] p-[24px] rounded-[28px] bg-[#050506] overflow-hidden">
              <div className="flex items-center gap-[12px]">
                <img
                  src={userAvatar}
                  className="w-[60px] h-[60px] shrink-0 object-cover rounded-full border border-white/10"
                />

                <div>
                  <div className="flex items-center gap-[12px] mb-[4px]">
                    <span className="text-[20px] leading-[24px] font-semibold text-white">
                      Alexander Mironov
                    </span>

                    <div className="p-[1px] rounded-full bg-[linear-gradient(90deg,#FFFFFF_0%,#8348C1_48%,#2C1969_100%)]">
                      <span className="flex items-center justify-center w-[46px] h-[24px] rounded-full bg-[#0A0A0A] font-normal text-[#5C49AA] text-[12px] leading-[16px]">
                        Pro
                      </span>
                    </div>
                  </div>

                  <span className="text-[14px] leading-[20px] font-extralight text-white">
                    @alexM
                  </span>
                </div>
              </div>

            <div className="absolute top-[24px] right-[24px] group p-[1px] rounded-full bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(131,72,193,0.4)] active:scale-95 cursor-pointer">
             <button className="w-[136px] h-[36px] rounded-full bg-[#0D0D0D] flex items-center justify-center gap-[8px] text-[#A3A4B0] text-[14px] leading-[20px] font-medium transition-all group-hover:bg-opacity-80 cursor-pointer">
               <span className="group-hover:text-white transition-colors">
                  Редагувати
               </span>

                <img src={editIcon} className="w-[20px] h-[20px] opacity-80 transition-all duration-300" />
                
             </button>
            </div>
           </div>
          </div>
        </section>

        {/* PERSONAL INFO */}
        <section className="flex flex-col gap-[24px]">
          <h2 className="text-[24px] leading-[28px] font-semibold text-white">
            Персональна інформація
          </h2>

          <div className={cardWrapper}>
           <div className="relative h-[160px] pt-[24px] pb-[24px] pl-[24px] rounded-[28px] bg-[#050506] overflow-hidden">

            <div className="absolute top-[24px] right-[24px] group p-[1px] rounded-full bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(131,72,193,0.4)] active:scale-95 cursor-pointer">
             <button className="w-[136px] h-[36px] rounded-full bg-[#0D0D0D] flex items-center justify-center gap-[8px] text-[#A3A4B0] text-[14px] leading-[20px] font-medium transition-all group-hover:bg-opacity-80 cursor-pointer">
               <span className="group-hover:text-white transition-colors">
                  Редагувати
               </span>

                <img src={editIcon} className="w-[20px] h-[20px] opacity-80 transition-all duration-300" />
             </button>
            </div>

              <div className="grid grid-cols-[160px_230px_200px] gap-x-[96px] gap-y-[24px]">
                 <div>
                   <p className="text-[#A3A4B0] text-[14px] leading-[20px] font-normal mb-[4px]">
                     Ім'я
                   </p>
                   <p className="text-white text-[14px] leading-[20px] font-normal">
                     Олександр
                   </p>
                 </div>

                 <div>
                   <p className="text-[#A3A4B0] text-[14px] leading-[20px] font-normal mb-[4px]">
                     E-mail
                   </p>
                   <p className="text-white text-[14px] leading-[20px] font-normal">
                     alexmironov@gmail.com
                   </p>
                 </div>

                 <div>
                   <p className="text-[#A3A4B0] text-[14px] leading-[20px] font-normal mb-[4px]">
                     День народження
                   </p>
                   <p className="text-white text-[14px] leading-[20px] font-normal">
                     07.05.2007
                   </p>
                 </div>

                 <div>
                   <p className="text-[#A3A4B0] text-[14px] leading-[20px] font-normal mb-[4px]">
                     Прізвище
                   </p>
                   <p className="text-white text-[14px] leading-[20px] font-normal">
                     Миронов
                   </p>
                 </div>

                 <div>
                   <p className="text-[#A3A4B0] text-[14px] leading-[20px] font-normal mb-[4px]">
                     Телефон
                   </p>
                   <p className="text-white text-[14px] leading-[20px] font-normal">
                     (+380) 98 962 77 13
                   </p>
                 </div>

                 <div>
                   <p className="text-[#A3A4B0] text-[14px] leading-[20px] font-normal mb-[4px]">
                     Регіон
                   </p>
                   <p className="text-white text-[14px] leading-[20px] font-normal">
                     Україна
                   </p>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY */}
        <section className="flex flex-col gap-[24px]">
          <h2 className="text-[24px] leading-[28px] font-semibold text-white">
            Безпека
          </h2>

          <div className={cardWrapper}>
           <div className="relative h-[160px] pt-[24px] pb-[24px] pl-[24px] rounded-[28px] bg-[#050506] overflow-hidden">

            <div className="absolute top-[24px] right-[24px] group p-[1px] rounded-full bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(131,72,193,0.4)] active:scale-95 cursor-pointer">
             <button className="w-[136px] h-[36px] rounded-full bg-[#0D0D0D] flex items-center justify-center gap-[8px] text-[#A3A4B0] text-[14px] leading-[20px] font-medium transition-all group-hover:bg-opacity-80 cursor-pointer">
               <span className="group-hover:text-white transition-colors">
                  Редагувати
               </span>

                <img src={editIcon} className="w-[20px] h-[20px] opacity-80 transition-all duration-300" />  
             </button>
            </div>


              <div className="grid grid-cols-[160px_230px] gap-x-[120px] gap-y-[24px]">
                 <div>
                  <p className="text-[#A3A4B0] text-[14px] leading-[20px] font-normal mb-[4px]">
                   Пароль
                  </p>
                  <p className="text-white text-[14px] leading-[20px] font-normal tracking-[0.15em]">
                   ********
                  </p>
                 </div>
                 
                 <div>
                  <p className="text-[#A3A4B0] text-[14px] leading-[20px] font-normal mb-[4px]">
                   Остання зміна
                  </p>
                  <p className="text-white text-[14px] leading-[20px] font-normal">
                   2 тижні тому
                  </p>
                 </div>

                 <div>
                  <p className="text-[#A3A4B0] text-[14px] leading-[20px] font-normal mb-[4px]">
                   Пристрої
                  </p>
                  <p className="text-white text-[14px] leading-[20px] font-normal">
                   2 активних
                  </p>
                 </div>
                
                 <div>
                  <p className="text-[#A3A4B0] text-[14px] leading-[20px] font-normal mb-[4px]">
                   Останній вхід
                  </p>
                  <p className="text-white text-[14px] leading-[20px] font-normal">
                   Україна, Львів
                  </p>
                 </div>
                </div>
              </div>
           </div>
        </section>

        {/* DELETE BUTTON */}
        <div className="pt-[16px]">
          <div className="group relative w-[210px] h-[44px] p-[1.5px] rounded-full bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(131,72,193,0.4)] active:scale-95 cursor-pointer">
            <button className="w-full h-full rounded-full bg-[#050506] flex items-center justify-center gap-2 text-[#FF0000] text-[14px] font-normal cursor-pointer transition-all duration-300 hover:bg-[#050506] active:scale-[0.98]">
              <span>Видалити акаунт</span>

              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M8.333 9.167V14.167M11.667 9.167V14.167M3.333 5.833H16.667M7.5 5.833V4.167C7.5 3.706 7.873 3.333 8.333 3.333H11.667C12.127 3.333 12.5 3.706 12.5 4.167V5.833M15.833 5.833L15.111 15.944C15.052 16.766 14.368 17.5 13.544 17.5H6.456C5.632 17.5 4.948 16.766 4.889 15.944L4.167 5.833"
                  stroke="#FF0000"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}