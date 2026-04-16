import { Link, useLocation } from "react-router-dom";
import userIcon from "../../assets/icons/user.svg";
import alertsIcon from "../../assets/icons/alerts-icon.svg"; // Якщо дзвіночок в іншому файлі, підстав його сюди

export default function Topbar() {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("dashboard")) return "Dashboard";
    if (path.includes("assets") || path.includes("watchlist")) return "Watchlist";
    if (path.includes("markets")) return "Markets";
    if (path.includes("alerts")) return "Alerts";
    if (path.includes("settings")) return "Settings";
    if (path.includes("profile")) return "Profile";
    return "Dashboard";
  };

  return (
    <header className="flex h-[80px] items-center justify-between border-b border-white/5 px-10 bg-[#05050A]/80 backdrop-blur-md sticky top-0 z-20">
      <h1 className="text-[20px] font-semibold text-white/90">{getPageTitle()}</h1>

      <div className="flex items-center gap-6">
        {/* Пошук - вузька пігулка */}
        <div className="flex h-10 w-[240px] items-center gap-2.5 rounded-full border border-white/10 bg-[#0A0A0F] px-4">
          <span className="text-[14px] text-white/40">⌕</span>
          <input 
            type="text" 
            placeholder="Search" 
            className="bg-transparent border-none outline-none text-[13px] text-white/90 w-full placeholder:text-white/30"
          />
        </div>
        
        {/* Іконка Alerts (Дзвіночок) */}
        <Link to="/alerts" className="text-white/50 hover:text-white transition-colors">
          {alertsIcon.length > 5 ? (
            <img src={alertsIcon} alt="Alerts" className="h-5 w-5" />
          ) : (
            <span className="text-xl">🔔</span> // Фолбек, якщо іконки дзвіночка ще нема
          )}
        </Link>

        {/* Іконка Профілю - квадратна з заокругленнями */}
        <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
          {userIcon.length > 5 ? (
            <img src={userIcon} alt="Profile" className="h-4 w-4 opacity-80" />
          ) : (
            <span className="text-sm">👤</span>
          )}
        </Link>
      </div>
    </header>
  );
}