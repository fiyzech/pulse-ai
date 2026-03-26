import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/assets", label: "Assets" },
  { to: "/alerts", label: "Alerts" },
  { to: "/telegram", label: "Telegram" },
  { to: "/settings", label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-white/10 bg-white/5 p-4">
      <div className="mb-8 text-2xl font-bold">PulseAI</div>

      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `rounded-xl px-4 py-3 transition ${
                isActive
                  ? "bg-white text-black"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}