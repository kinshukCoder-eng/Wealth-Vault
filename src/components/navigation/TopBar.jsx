import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useUI } from "../../contexts/UIContext";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: "bi-house" },
  { path: "/dashboard", label: "Dashboard", icon: "bi-grid-1x2" },
  { path: "/transactions", label: "Transactions", icon: "bi-receipt" },
  { path: "/insights", label: "Insights", icon: "bi-graph-up-arrow" },
  { path: "/goals", label: "Goals", icon: "bi-bullseye" },
  { path: "/tools", label: "Smart Tools", icon: "bi-sliders" },
  { path: "/vault", label: "Want Vault", icon: "bi-box" },
  { path: "/challenges", label: "Challenges", icon: "bi-trophy" },
  { path: "/pal", label: "Pocket Pal", icon: "bi-chat-left-text" },
];

export function TopBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { openAddTransaction } = useUI();

  const handleNavClick = () => {
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
        >
          <i className={`bi ${isMenuOpen ? "bi-x" : "bi-list"}`}></i>
        </button>

        <Link
          to="/"
          className="brand"
          onClick={handleNavClick}
          aria-label="Wealth Vault Home"
        >
          <div
            className="brand-mark"
          >
            <i className="bi bi-shield-lock" aria-hidden="true"></i>
          </div>
          <span>
            Wealth Vault<small>your money, decoded</small>
          </span>
        </Link>
      </div>

      <nav
        className={`desktop-nav ${isMenuOpen ? "open" : ""}`}
        aria-label="Main Navigation"
      >
        {NAV_ITEMS.map(({ path, label, icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            <i className={`bi ${icon}`}></i>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="top-actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          <i className={`bi ${theme === "light" ? "bi-moon" : "bi-sun"}`}></i>
          <span>{theme === "light" ? "Dark" : "Light"}</span>
        </button>

        <button
          type="button"
          className="add-button"
          onClick={openAddTransaction}
          aria-label="Add transaction"
          title="Add a new transaction"
        >
          <i className="bi bi-plus"></i> <span>Add</span>
        </button>
      </div>
    </header>
  );
}

export default TopBar;
