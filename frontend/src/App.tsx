import { RouterProvider } from "react-router-dom";
import { AccountProvider } from "./context/AccountContext";
import { router } from "./routes/AppRouter";
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  return (
    <AccountProvider>
      <RouterProvider router={router} />
      <Analytics />
    </AccountProvider>
  );
}
