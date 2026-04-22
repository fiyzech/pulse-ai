import { NavLink } from "react-router-dom";

import dashboardIcon from "../../assets/icons/dashboard-icon.svg";
import watchlistIcon from "../../assets/icons/watchlist-icon.svg";
import marketsIcon from "../../assets/icons/markets-icon.svg"; 
import alertsIcon from "../../assets/icons/alerts-icon.svg";
import profileIcon from "../../assets/icons/user.svg"; 
import settingsIcon from "../../assets/icons/settings-icon.svg";
import supportIcon from "../../assets/icons/support-icon.svg";

export default function Sidebar() {
  const sidebarItems = [
    { label: "Головна", icon: dashboardIcon, path: "/dashboard" },
    { label: "Обране", icon: watchlistIcon, path: "/assets" }, 
    { label: "Ринки", icon: marketsIcon, path: "/markets" }, 
    { label: "Алерти", icon: alertsIcon, path: "/alerts" },
    { label: "Профіль", icon: profileIcon, path: "/profile" },
  ];

  const bottomItems = [
    { label: "Підтримка", icon: supportIcon, path: "/support" },
    { label: "Налаштування", icon: settingsIcon, path: "/settings" },
  ];

  return (
    <aside className="w-[260px] border-r border-white/5 bg-[#08080C] px-5 py-6 flex flex-col sticky top-0 h-screen z-30">
      <div>
        {/* Логотип */}
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center">
            <img 
              src="/logo-crypro-pulse.svg" 
              alt="CryptoPulse" 
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-[20px] font-bold tracking-wide text-white">
            CryptoPulse
          </span>
        </div>

        {/* Навігація */}
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left text-[15px] font-medium transition-all ${
                  isActive
                    ? "bg-[#1A1433] text-white" // Зробив солідний темно-фіолетовий колір як у Фігмі
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/90" // Більш приглушений сірий для неактивних
                }`
              }
            >
              <span className="flex w-5 justify-center">
                {item.icon.length > 5 ? (
                  <img 
                    src={item.icon} 
                    alt={item.label} 
                    className={`h-5 w-5 transition-opacity ${item.path === '/dashboard' ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`} 
                  />
                ) : (
                  <span className="text-lg flex items-center justify-center h-5 w-5">{item.icon}</span>
                )}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto flex flex-col gap-1">
        {/* Нижні лінки */}
        <div className="mb-4 space-y-1">
          {bottomItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left text-[15px] font-medium transition-all ${
                  isActive
                    ? "bg-[#1A1433] text-white"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/90"
                }`
              }
            >
              <span className="flex w-5 justify-center">
                {item.icon.length > 5 ? (
                  <img 
                    src={item.icon} 
                    alt={item.label} 
                    className="h-5 w-5 opacity-50 transition-opacity group-hover:opacity-100" 
                  />
                ) : (
                  <span className="text-lg flex items-center justify-center h-5 w-5">{item.icon}</span>
                )}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* PulseAI блок - тепер з вирівнюванням по лівому краю */}
        <div className="rounded-2xl border border-white/5 bg-[#0D0D14] p-4 cursor-pointer hover:bg-[#12121C] transition-colors flex flex-col items-start text-left">
          <div className="flex items-center gap-2.5 mb-1.5">
            {/* Іконка зірочки */}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 0L9.5 5.5L15 7L9.5 8.5L8 14L6.5 8.5L1 7L6.5 5.5L8 0Z" fill="white" fillOpacity="0.9"/>
            </svg>
            <span className="text-[14px] font-semibold text-white">
              Активуйте PulseAI
            </span>
          </div>
          <p className="text-[12px] text-white/40 leading-[1.4]">
            Відкрий всі можливості<br />CryptoPulse
          </p>
        </div>
      </div>
    </aside>
  );
}