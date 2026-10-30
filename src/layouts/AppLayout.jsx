import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopBar from "../components/navigation/TopBar";
import TransactionModal from "../components/forms/TransactionModal";
import GoalModal from "../components/forms/GoalModal";
import ContributionModal from "../components/forms/ContributionModal";
import VaultModal from "../components/forms/VaultModal";
import BudgetModal from "../components/forms/BudgetModal";
import ConfirmDialog from "../components/feedback/ConfirmDialog";
import ToastContainer from "../components/feedback/ToastContainer";
import { useTheme } from "../contexts/ThemeContext";
import { STORAGE_KEYS } from "../utils/persistence";

const PAGE_TITLES = {
  "/": "Wealth Vault — Your Money, Decoded",
  "/dashboard": "Dashboard — Wealth Vault",
  "/transactions": "Transactions Ledger — Wealth Vault",
  "/insights": "Spending Insights — Wealth Vault",
  "/goals": "Savings Goals — Wealth Vault",
  "/tools": "Smart Tools — Wealth Vault",
  "/vault": "Want Vault — Wealth Vault",
  "/challenges": "Budget Battle & Challenges — Wealth Vault",
  "/pal": "Pocket Pal — Wealth Vault",
};

export function AppLayout() {
  const { theme } = useTheme();
  const location = useLocation();

  // Update page title
  useEffect(() => {
    document.title = PAGE_TITLES[location.pathname] || "Wealth Vault";
    // Store current page as saved fallback
    try {
      const pageKey = location.pathname === "/" ? "home" : location.pathname.slice(1);
      localStorage.setItem(STORAGE_KEYS.PAGE, pageKey);
    } catch {
      // ignore
    }
  }, [location.pathname]);

  // Handle reveal animations for new route renders and dynamic items
  useEffect(() => {
    const prefersReducedMotion =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false;

    const revealElements = document.querySelectorAll(".reveal");

    if (prefersReducedMotion || typeof IntersectionObserver !== "function") {
      revealElements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.08 }
    );

    revealElements.forEach((el) => observer.observe(el));

    // Also observe future dynamic additions via MutationObserver
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList?.contains("reveal")) {
              observer.observe(node);
            }
            node.querySelectorAll?.(".reveal").forEach((el) => observer.observe(el));
          }
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname]);

  return (
    <div className="app-shell" data-theme={theme}>
      <TopBar />
      <main id="main-content">
        <Outlet />
      </main>

      {/* Global Form Modals & Dialogs */}
      <TransactionModal />
      <GoalModal />
      <ContributionModal />
      <VaultModal />
      <BudgetModal />
      <ConfirmDialog />
      <ToastContainer />
    </div>
  );
}

export default AppLayout;
