import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import ScrollToTop from "../components/ScrollToTop";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#010004] text-white">
      <ScrollToTop />
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