import { createBrowserRouter, Navigate } from "react-router-dom";

import LandingPage from "../pages/Landing/LandingPage";
import LoginPage from "../pages/Login/LoginPage";
import RegisterPage from "../pages/Register/RegisterPage";
import SelectPlanPage from "../pages/Select/SelectPlanPage";

import MainLayout from "../layouts/MainLayout";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import AssetsPage from "../pages/Assets/AssetsPage";
import AlertsPage from "../pages/Alerts/AlertsPage";
import SettingsPage from "../pages/Settings/SettingsPage";
import ProfilePage from "../pages/Profile/ProfilePage";
import AssetPage from "../pages/Asset/AssetPage";
import MarketsPage from "../pages/Markets/MarketsPage";
import SupportPage from "../pages/Support/SupportPage";
import NewsPage from "../pages/News/NewsPage";
import TradingPage from "../pages/Trading/TradingPage";
export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/select-plan", element: <SelectPlanPage /> },
  // Dead stubs → redirect to real pages
  { path: "/auth", element: <Navigate to="/register" replace /> },
  { path: "/pricing", element: <Navigate to="/select-plan" replace /> },
  // Trading is a standalone fullscreen page — no layout wrapper
  { path: "/trading", element: <TradingPage /> },
  { path: "/trading/:symbol", element: <TradingPage /> },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "dashboard", element: <DashboardPage /> },
      { path: "assets", element: <AssetsPage /> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "telegram", element: <Navigate to="/assets" replace /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "markets", element: <MarketsPage /> },
      { path: "support", element: <SupportPage /> },
      { path: "asset/:symbol", element: <AssetPage /> },
      { path: "news", element: <NewsPage /> },
    ],
  },
]);
