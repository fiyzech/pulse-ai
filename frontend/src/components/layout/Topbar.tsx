import { useLocation } from "react-router-dom";
import notificationsIcon from "../../assets/icons/notifications-icon.svg"; 
import logOutIcon from "../../assets/icons/log-out-icon.svg"; 

export default function Topbar() {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("dashboard")) return "Головна";
    if (path.includes("assets") || path.includes("watchlist")) return "Обране";
    if (path.includes("markets")) return "Ринки";
    if (path.includes("alerts")) return "Алерти";
    if (path.includes("settings")) return "Налаштування";
    if (path.includes("profile")) return "Профіль";
    if (path.includes("support")) return "Підтримка";
    if (path.includes("asset")) return "Сторінка активу"; // <--- ДОДАНО РЯДОК
    return "Головна"; 
  };

  return (
    <header className="flex h-[80px] items-center justify-between border-b border-white/5 px-10 bg-[#05050A]/100 backdrop-blur-md sticky top-0 z-[9999]">
      <h1 className="text-[28px] font-montserrat font-semibold text-white/90">{getPageTitle()}</h1>

      <div className="flex items-center gap-4">
        {/* Пошук */}
        <div className="flex h-10 w-[240px] items-center gap-2.5 rounded-full border border-white/10 bg-transparent px-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Пошук" 
            className="bg-transparent border-none outline-none text-[13px] text-white/90 w-full placeholder:text-white/30"
          />
        </div>
        
        {/* Іконка Сповіщень */}
        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-transparent hover:bg-white/5 transition-colors">
          <img src={notificationsIcon} alt="Сповіщення" className="h-5 w-5 opacity-70" />
        </button>

        {/* Іконка Виходу */}
        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-transparent hover:bg-white/5 transition-colors">
          <img src={logOutIcon} alt="Вихід" className="h-5 w-5 opacity-70" />
        </button>
      </div>
    </header>
  );
}