import React, { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { selectTransactions } from "../features/selectors";
import {
  deleteTransaction,
  resetTransactions,
} from "../features/transactions/transactionsSlice";
import { categories } from "../data/demoData";
import Header from "../components/shared/Header";
import { formatINR } from "../utils/currency";
import { formatDate, formatPeriodLabel } from "../utils/dates";
import { useUI } from "../contexts/UIContext";

export function TransactionsPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const transactions = useSelector(selectTransactions);
  const { openAddTransaction, openEditTransaction, showConfirm, showToast } = useUI();

  // URL is the single source of truth for ledger filter state
  const search = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "All";
  const dateFilter = searchParams.get("date") || "";
  const rawMonth = searchParams.get("month") || "";
  const monthFilter = /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth) ? rawMonth : "";
  const sortOrder = searchParams.get("sort") || "newest";

  const updateParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!value || value === "All" || (key === "sort" && value === "newest")) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((t) => {
        return (
          t.title.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.date.toLowerCase().includes(query)
        );
      });
    }

    if (categoryFilter !== "All") {
      result = result.filter((t) => t.category === categoryFilter);
    }

    if (dateFilter) {
      result = result.filter((t) => t.date === dateFilter);
    }

    if (monthFilter) result = result.filter(t => t.date.startsWith(monthFilter));

    // Sort order
    result.sort((a, b) => {
      if (sortOrder === "newest") {
        return (b.date || "").localeCompare(a.date || "") || b.id.localeCompare(a.id);
      }
      if (sortOrder === "oldest") {
        return (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id);
      }
      if (sortOrder === "highest") {
        return Number(b.amount) - Number(a.amount);
      }
      if (sortOrder === "lowest") {
        return Number(a.amount) - Number(b.amount);
      }
      return 0;
    });

    return result;
  }, [transactions, search, categoryFilter, dateFilter, monthFilter, sortOrder]);

  const filteredSpending = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [filteredTransactions]);

  const handleDelete = (transaction) => {
    showConfirm({
      title: "Remove Transaction?",
      message: `Are you sure you want to remove "${transaction.title}" (${formatINR(transaction.amount)}) from your ledger?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      isDestructive: true,
      onConfirm: () => {
        dispatch(deleteTransaction(transaction.id));
        showToast(`Removed "${transaction.title}"`);
      },
    });
  };

  const handleResetDemo = () => {
    showConfirm({
      title: "Reset Demo Transactions?",
      message:
        "This will restore original sample transactions. Your goals, want vault, and custom budgets will remain intact.",
      confirmText: "Reset Transactions",
      cancelText: "Keep Current",
      isDestructive: true,
      onConfirm: () => {
        dispatch(resetTransactions());
        clearFilters();
        showToast("Transaction ledger reset to demo data");
      },
    });
  };

  return (
    <div className="page-wrap transactions-page">
      <Header
        eyebrow="Your ledger · local only"
        title="Every rupee has a receipt."
        sub="A clear, private record of where your month is going."
      />

      <section className="ledger-toolbar reveal" aria-label="Transaction filters">
        <div className="search-box">
          <i className="bi bi-search"></i>
          <input
            type="search"
            placeholder="Search receipts..."
            value={search}
            onChange={(e) => updateParam("search", e.target.value)}
            aria-label="Search transactions by title, category or date"
          />
          {search && (
            <button
              type="button"
              className="search-clear"
              onClick={() => updateParam("search", "")}
              aria-label="Clear search query"
            >
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => updateParam("category", e.target.value)}
          aria-label="Filter transactions by category"
        >
          <option value="All">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          value={sortOrder}
          onChange={(e) => updateParam("sort", e.target.value)}
          aria-label="Sort transactions"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="highest">Highest amount</option>
          <option value="lowest">Lowest amount</option>
        </select>

        <div className="date-filter">
          <i className="bi bi-calendar3"></i>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => updateParam("date", e.target.value)}
            aria-label="Filter transactions by exact date"
          />
        </div>

        <button
          type="button"
          className="primary-button ledger-add-button"
          onClick={openAddTransaction}
        >
          <i className="bi bi-plus"></i> Add transaction
        </button>

        <button
          type="button"
          className="text-button ledger-reset-button"
          onClick={handleResetDemo}
          title="Reset demo transactions only"
        >
          Reset demo
        </button>
      </section>

      <section className="ledger reveal">
        <div className="ledger-summary">
          <div>
            <span className="ledger-count">
              {monthFilter && <span>{formatPeriodLabel(monthFilter)} · </span>}
              {filteredTransactions.length}{" "}
              {filteredTransactions.length === 1 ? "receipt" : "receipts"} shown
            </span>

            {(search || categoryFilter !== "All" || dateFilter || monthFilter || sortOrder !== "newest") && (
              <button
                type="button"
                className="clear-filters"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="ledger-total">
            <small>filtered spending</small>
            <strong>{formatINR(filteredSpending)}</strong>
          </div>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="ledger-list" role="feed" aria-label="Transaction records">
            {filteredTransactions.map((transaction) => {
              const isIncome = transaction.type === "income";

              return (
                <article
                  key={transaction.id}
                  className={`ledger-item ${isIncome ? "is-income" : "is-expense"}`}
                >
                  <span
                    className={`category-icon ${
                      isIncome ? "income-icon" : "expense-icon"
                    }`}
                  >
                    <i
                      className={`bi ${
                        isIncome ? "bi-arrow-down-left" : "bi-arrow-up-right"
                      }`}
                    ></i>
                  </span>

                  <div className="ledger-main">
                    <strong>{transaction.title}</strong>
                    <div className="ledger-meta">
                      <span>{transaction.category}</span>
                      <span>·</span>
                      <span>{formatDate(transaction.date)}</span>
                    </div>
                  </div>

                  <div
                    className={`ledger-amount ${
                      isIncome ? "income-amount" : "expense-amount"
                    }`}
                  >
                    {isIncome ? "+" : "−"}
                    {formatINR(transaction.amount)}
                  </div>

                  <div className="ledger-actions">
                    <button
                      type="button"
                      className="ledger-action"
                      onClick={() => openEditTransaction(transaction)}
                      aria-label={`Edit ${transaction.title}`}
                      title="Edit transaction"
                    >
                      <i className="bi bi-pencil"></i>
                    </button>

                    <button
                      type="button"
                      className="ledger-action ledger-delete"
                      onClick={() => handleDelete(transaction)}
                      aria-label={`Delete ${transaction.title}`}
                      title="Delete transaction"
                    >
                      <i className="bi bi-trash3"></i>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="ledger-empty">
            <div className="ledger-empty-icon">
              <i className="bi bi-receipt"></i>
            </div>
            <h3>No receipts found.</h3>
            <p>
              Try changing your filters or add a new transaction to your ledger.
            </p>
            <div className="ledger-empty-actions">
              <button
                type="button"
                className="text-button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={openAddTransaction}
              >
                + Add transaction
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default TransactionsPage;
