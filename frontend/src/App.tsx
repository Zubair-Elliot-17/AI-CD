// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { Layout } from "./components/Layout";
import Benchmarks from "./pages/Benchmarks";
import Detect from "./pages/Detect";
import History, { HistoryDetail } from "./pages/History";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/detect", element: <Detect /> },
      { path: "/benchmarks", element: <Benchmarks /> },
      { path: "/history", element: <History /> },
      { path: "/history/:id", element: <HistoryDetail /> },
      // Routes from the 2025 version, kept so old links still work.
      { path: "/AITextDetectorPage", element: <Navigate to="/detect" replace /> },
      { path: "/HistoryPage", element: <Navigate to="/history" replace /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
