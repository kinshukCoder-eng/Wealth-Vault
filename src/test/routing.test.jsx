import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import transactionsReducer from "../features/transactions/transactionsSlice";
import goalsReducer from "../features/goals/goalsSlice";
import vaultReducer from "../features/vault/vaultSlice";
import budgetReducer from "../features/budget/budgetSlice";
import challengesReducer from "../features/challenges/challengesSlice";
import pocketPalReducer from "../features/pocketPal/pocketPalSlice";
import { ThemeProvider } from "../contexts/ThemeContext";
import { UIProvider } from "../contexts/UIContext";
import { routes } from "../app/router";

function renderRoute(initialEntries = ["/"]) {
  const store = configureStore({
    reducer: {
      transactions: transactionsReducer,
      goals: goalsReducer,
      vault: vaultReducer,
      budget: budgetReducer,
      challenges: challengesReducer,
      pocketPal: pocketPalReducer,
    },
    preloadedState: {
      transactions: [
        { id: "t1", title: "Coffee", category: "Food", amount: 150, type: "expense", date: "2026-03-24" },
      ],
      goals: [],
      vault: [],
      budget: { mode: "auto", manualAmounts: {}, defaultManual: 15000, reportingPeriod: "2026-03" },
      challenges: { activeChallenges: [], claimedXP: {} },
      pocketPal: { messages: [] },
    },
  });

  const memoryRouter = createMemoryRouter(routes, { initialEntries });

  return render(
    <Provider store={store}>
      <ThemeProvider>
        <UIProvider>
          <RouterProvider router={memoryRouter} />
        </UIProvider>
      </ThemeProvider>
    </Provider>
  );
}

describe("Router & Layout Integration", () => {
  it("renders Home page at '/'", () => {
    renderRoute(["/"]);
    expect(screen.getByRole("heading", { level: 1, name: /Your money/i })).toBeInTheDocument();
    expect(screen.getByText(/Start tracking/i)).toBeInTheDocument();
  });

  it("renders Dashboard page at '/dashboard'", () => {
    renderRoute(["/dashboard"]);
    expect(screen.getByRole("heading", { level: 1, name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByText(/Current balance/i)).toBeInTheDocument();
  });

  it("renders Transactions page at '/transactions'", () => {
    renderRoute(["/transactions"]);
    expect(screen.getByRole("heading", { level: 1, name: /Every rupee has a receipt/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search receipts/i)).toBeInTheDocument();
  });

  it("renders Insights page at '/insights'", () => {
    renderRoute(["/insights"]);
    expect(screen.getByRole("heading", { level: 1, name: /The story behind your spending/i })).toBeInTheDocument();
    expect(screen.getByText(/Money Detective/i)).toBeInTheDocument();
  });

  it("renders Goals page at '/goals'", () => {
    renderRoute(["/goals"]);
    expect(screen.getByRole("heading", { level: 1, name: /Give your next chapter a number/i })).toBeInTheDocument();
    expect(screen.getByText(/What are you saving for\?/i)).toBeInTheDocument();
  });

  it("renders Smart Tools page at '/tools'", () => {
    renderRoute(["/tools"]);
    expect(screen.getByRole("heading", { level: 1, name: /Try the decision on first/i })).toBeInTheDocument();
    expect(screen.getByText(/Wallet What-If/i)).toBeInTheDocument();
  });

  it("renders Want Vault page at '/vault'", () => {
    renderRoute(["/vault"]);
    expect(screen.getByRole("heading", { level: 1, name: /Want Vault/i })).toBeInTheDocument();
    expect(screen.getByText(/Put it in the vault/i)).toBeInTheDocument();
  });

  it("renders Challenges page at '/challenges'", () => {
    renderRoute(["/challenges"]);
    expect(screen.getByRole("heading", { level: 1, name: /Budget Battle/i })).toBeInTheDocument();
    expect(screen.getByText(/Food Fighter/i)).toBeInTheDocument();
  });

  it("renders Pocket Pal page at '/pal'", () => {
    renderRoute(["/pal"]);
    expect(screen.getByRole("heading", { level: 1, name: /Ask the question behind the question/i })).toBeInTheDocument();
    expect(screen.getByText(/Pocket Pal says/i)).toBeInTheDocument();
  });

  it("renders NotFoundPage for unknown routes", () => {
    renderRoute(["/unknown-route-123"]);
    expect(screen.getByRole("heading", { level: 1, name: /Page not found/i })).toBeInTheDocument();
    expect(screen.getByText(/Back to Home/i)).toBeInTheDocument();
  });
});
