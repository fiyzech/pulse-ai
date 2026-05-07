import { createBrowserRouter } from "react-router-dom";

import LandingPage from "../pages/Landing/LandingPage";
import AuthPage from "../pages/Auth/AuthPage";
import LoginPage from "../pages/Login/LoginPage";
import RegisterPage from "../pages/Register/RegisterPage";
import PricingPage from "../pages/Pricing/PricingPage";
import MarketsPage from "../pages/Markets/MarketsPage";
import SupportPage from "../pages/Support/SupportPage";
import MainLayout from "../layouts/MainLayout";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import AssetsPage from "../pages/Assets/AssetsPage";
import AlertsPage from "../pages/Alerts/AlertsPage";
import TelegramPage from "../pages/Telegram/TelegramPage";
import SettingsPage from "../pages/Settings/SettingsPage";
import ProfilePage from "../pages/Profile/ProfilePage";
import AssetPage from "../pages/Asset/AssetPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/auth",
    element: <AuthPage />,  
  },
  {
    path: "/pricing",
    element: <PricingPage />,
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "dashboard", element: <DashboardPage /> },
      { path: "assets", element: <AssetsPage /> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "telegram", element: <TelegramPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "markets", element: <MarketsPage /> },
      { path: "support", element: <SupportPage /> },
      { path: "asset/:symbol", element: <AssetPage /> },
    ],
  },
]);