import { RouterProvider } from "react-router-dom";
import { AccountProvider } from "./context/AccountContext";
import { router } from "./routes/AppRouter";

export default function App() {
  return (
    <AccountProvider>
      <RouterProvider router={router} />
    </AccountProvider>
  );
}
