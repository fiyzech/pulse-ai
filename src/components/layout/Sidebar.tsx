import { NavLink } from "react-router-dom";

import dashboardIcon from "../../assets/icons/dashboard-icon.svg";
import watchlistIcon from "../../assets/icons/watchlist-icon.svg";
import marketsIcon from "../../assets/icons/markets-icon.svg"; // <-- ДОДАЛИ МАРКЕТИ
import alertsIcon from "../../assets/icons/alerts-icon.svg";
import settingsIcon from "../../assets/icons/settings-icon.svg";
import supportIcon from "../../assets/icons/support-icon.svg";

export default function Sidebar() {
  const sidebarItems = [
    { label: "Dashboard", icon: dashboardIcon, path: "/dashboard" },
    { label: "Watchlist", icon: watchlistIcon, path: "/assets" }, // Перейменували на Watchlist як у макеті
    { label: "Markets", icon: marketsIcon, path: "/markets" }, // Замість Телеграму
    { label: "Alerts", icon: alertsIcon, path: "/alerts" },
  ];

  const bottomItems = [
    { label: "Support", icon: supportIcon, path: "/support" },
    { label: "Settings", icon: settingsIcon, path: "/settings" },
  ];

  return (
    <aside className="w-[260px] border-r border-white/5 bg-[#05050A]/90 px-5 py-6 backdrop-blur-xl flex flex-col sticky top-0 h-screen z-30">
      <div>
        {/* Логотип */}
        <div className="mb-12 flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center">
            <img 
              src="/logo-crypro-pulse.svg" 
              alt="CryptoPulse" 
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-[20px] font-semibold tracking-wide text-white">
            CryptoPulse
          </span>
        </div>

        {/* Навігація */}
        <nav className="space-y-1.5">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `group flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left text-[15px] font-medium transition-all ${
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/90"
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

      <div className="mt-auto space-y-1.5">
        {bottomItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `group flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left text-[15px] font-medium transition-all ${
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-white/50 hover:bg-white/[0.04] hover:text-white/90"
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

        {/* PulseAI блок (зробив стильнішим під макет) */}
        <div className="mt-6 rounded-2xl border border-white/5 bg-[#0D0D12] p-4 text-center cursor-pointer hover:bg-[#12121A] transition-colors">
          <div className="text-[13px] font-semibold text-white mb-1">
            Активуйте PulseAI
          </div>
          <p className="text-[11px] text-white/40">
            Ваш особистий крипто-помічник
          </p>
        </div>
      </div>
    </aside>
  );
}