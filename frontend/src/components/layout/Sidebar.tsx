import { NavLink, useLocation } from "react-router-dom";

// Імпорти іконок
import dashboardIcon from "../../assets/icons/dashboard-icon.svg";
import watchlistIcon from "../../assets/icons/watchlist-icon.svg";
import marketsIcon from "../../assets/icons/markets-icon.svg";
import tradingIcon from "../../assets/icons/trading-icon.svg";
import alertsIcon from "../../assets/icons/alerts-icon.svg";
import profileIcon from "../../assets/icons/user.svg";
import settingsIcon from "../../assets/icons/settings-icon.svg";
import supportIcon from "../../assets/icons/support-icon.svg";

export default function Sidebar() {
  const location = useLocation();
  const isAssetPage = location.pathname.startsWith("/asset/");
  const sidebarItems = [
    { label: "Головна", icon: dashboardIcon, path: "/dashboard", iconSize: "16px" },
    { label: "Обране", icon: watchlistIcon, path: "/assets", iconSize: "24px" },
    { label: "Ринки", icon: marketsIcon, path: "/markets", iconSize: "22px" },
    { label: "Торгівля", icon: tradingIcon, path: "/trading", iconSize: "22px" },
    { label: "Алерти", icon: alertsIcon, path: "/alerts", iconSize: "20px" },
    { label: "Профіль", icon: profileIcon, path: "/profile", iconSize: "20px" },
  ];

  const bottomItems = [
    { label: "Підтримка", icon: supportIcon, path: "/support", iconSize: "20px" },
    { label: "Налаштування", icon: settingsIcon, path: "/settings", iconSize: "20px" },
  ];

  const activeLinkStyle = {
    background: 
      "linear-gradient(90deg, #6043A4 0%,  #010315 100%) padding-box, " +
      "linear-gradient(90deg, #725998 0%, #291E51 100%) border-box",
  };

  return (
    <aside className="w-[244px] min-w-[244px] shrink-0 border-r border-white/5 bg-[#010004] px-4 py-6 flex flex-col sticky top-0 h-screen z-30 font-montserrat antialiased">
      <div>
        {/* Логотип */}
        <div className="mb-10 flex items-center gap-2 px-6 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
          <div className="flex h-[28px] w-[28px] items-center justify-center shrink-0">
            <img src="/logo-crypro-pulse.svg" alt="CryptoPulse" className="h-full w-full object-contain" />
          </div>
          <div className="text-[19px] tracking-wide">
            <span className="font-light text-white">Crypto</span>
            <span className="font-medium bg-gradient-to-r from-[#ceafef] to-[#9a64d4] bg-clip-text text-transparent">Pulse</span>
          </div>
        </div>

        {/* Навігація */}
        <nav className="space-y-1 px-2">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              style={({ isActive }) => (isActive || (isAssetPage && item.path === "/markets")) ? activeLinkStyle : {}}
              className={({ isActive }) => {
                const isCurrent = isActive || (isAssetPage && item.path === "/markets");
                return (
                `group flex w-full items-center gap-3 rounded-[28px] px-4 py-3 text-left text-[15px] font-montserrat font-regular transition-all duration-300 border border-transparent ${
                  isCurrent
                    ? "text-white shadow-[0_4px_20px_rgba(96,67,164,0.25)]" 
                    : "text-[#6E6F7E] hover:bg-white/[0.04] hover:text-white/90" 
                }`
                );
              }}
            >
              {({ isActive }) => (
                <>
                  <span className="flex w-[24px] h-[24px] justify-center items-center shrink-0">
                    <img
                      src={item.icon}
                      alt={item.label}
                      style={{ width: item.iconSize, height: item.iconSize }}
                      className={`object-contain transition-all duration-300 ${isActive || (isAssetPage && item.path === "/markets") ? 'scale-[1.15] brightness-0 invert opacity-100' : 'brightness-0 invert opacity-[0.45] group-hover:opacity-100 scale-100'}`}
                    />
                  </span>
                  <span className={`transition-all duration-300 ${isActive || (isAssetPage && item.path === "/markets") ? 'font-medium text-white' : ''}`}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto flex flex-col gap-1">
        {/* Нижні лінки */}
        <div className="mb-4 space-y-1 px-2">
          {bottomItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              style={({ isActive }) => isActive ? activeLinkStyle : {}}
              className={({ isActive }) =>
                `group flex w-full items-center gap-3 rounded-[28px] px-4 py-3 text-left text-[15px] font-medium transition-all duration-300 border border-transparent ${
                  isActive
                    ? "text-white shadow-[0_4px_20px_rgba(96,67,164,0.25)]"
                    : "text-[#6E6F7E] hover:bg-white/[0.04] hover:text-white/90"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex w-[24px] h-[24px] justify-center items-center shrink-0">
                    <img 
                      src={item.icon} 
                      alt={item.label} 
                      style={{ width: item.iconSize, height: item.iconSize }}
                      className={`object-contain transition-all duration-300 ${isActive ? 'scale-[1.15] brightness-0 invert opacity-100' : 'brightness-0 invert opacity-[0.45] group-hover:opacity-100 scale-100'}`} 
                    />
                  </span>
                  <span className={`transition-all duration-300 ${isActive ? 'font-semibold text-white' : ''}`}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

      </div>
    </aside>
  );
}
