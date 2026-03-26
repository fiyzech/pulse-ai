import { createBrowserRouter } from "react-router-dom";

import LandingPage from "../pages/Landing/LandingPage";
import AuthPage from "../pages/Auth/AuthPage";
import PricingPage from "../pages/Pricing/PricingPage";

import MainLayout from "../layouts/MainLayout";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import AssetsPage from "../pages/Assets/AssetsPage";
import AssetDetailsPage from "../pages/AssetDetails/AssetDetailsPage";
import AlertsPage from "../pages/Alerts/AlertsPage";
import TelegramPage from "../pages/Telegram/TelegramPage";
import SettingsPage from "../pages/Settings/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
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
      { path: "assets/:id", element: <AssetDetailsPage /> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "telegram", element: <TelegramPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);