import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#010004] text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(108,43,217,0.18),transparent_22%),radial-gradient(circle_at_40%_55%,rgba(88,35,190,0.14),transparent_24%),linear-gradient(180deg,#060606_0%,#030303_100%)] z-0" />
      <div className="fixed inset-0 pointer-events-none opacity-40 [background:linear-gradient(to_right,rgba(124,58,237,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(124,58,237,0.05)_1px,transparent_1px)] [background-size:120px_120px] z-0" />

      {/* Основний контейнер: додав w-full */}
      <div className="flex min-h-screen w-full relative z-10">
        
        <Sidebar />

        {/* Права частина: додав min-w-0, це КРИТИЧНО для Flexbox, щоб широкі таблиці не ламали сайдбар */}
        <div className="flex min-h-screen flex-1 flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
        
      </div>
    </div>
  );
}