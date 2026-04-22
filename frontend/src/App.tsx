import { RouterProvider } from "react-router-dom";
import { router } from "./routes/AppRouter";

export default function App() {
  return <RouterProvider router={router} />;
}