import React from "react";
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import HomePage from "../pages/HomePage";
import DashboardPage from "../pages/DashboardPage";
import TransactionsPage from "../pages/TransactionsPage";
import InsightsPage from "../pages/InsightsPage";
import GoalsPage from "../pages/GoalsPage";
import ToolsPage from "../pages/ToolsPage";
import WantVaultPage from "../pages/WantVaultPage";
import ChallengesPage from "../pages/ChallengesPage";
import PocketPalPage from "../pages/PocketPalPage";
import NotFoundPage from "../pages/NotFoundPage";

export const routes = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "transactions", element: <TransactionsPage /> },
      { path: "insights", element: <InsightsPage /> },
      { path: "goals", element: <GoalsPage /> },
      { path: "tools", element: <ToolsPage /> },
      { path: "vault", element: <WantVaultPage /> },
      { path: "challenges", element: <ChallengesPage /> },
      { path: "pal", element: <PocketPalPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);

export default router;
