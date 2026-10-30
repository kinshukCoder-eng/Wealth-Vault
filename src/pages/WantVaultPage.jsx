import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectVault } from "../features/selectors";
import { addVaultItem, deleteVaultItem } from "../features/vault/vaultSlice";
import { addTransaction } from "../features/transactions/transactionsSlice";
import Header from "../components/shared/Header";
import { formatINR } from "../utils/currency";
import { calculateElapsedDays, getLocalDateString } from "../utils/dates";
import { validateVaultItem } from "../utils/validation";
import { useUI } from "../contexts/UIContext";

export function WantVaultPage() {
  const dispatch = useDispatch();
  const vaultItems = useSelector(selectVault);
  const { openEditVaultItem, showConfirm, showToast } = useUI();

  // Sidebar form
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleAddWant = (e) => {
    e.preventDefault();
    const validation = validateVaultItem({ name, amount });
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({ name: true, amount: true });
      return;
    }

    dispatch(
      addVaultItem({
        name: name.trim(),
        amount: Number(amount),
        date: new Date().toISOString(),
      })
    );

    showToast(`Added "${name.trim()}" to Want Vault`);
    setName("");
    setAmount("");
    setErrors({});
    setTouched({});
  };

  const handleDelete = (item) => {
    showConfirm({
      title: "Remove Saved Want?",
      message: `Are you sure you want to remove "${item.name}" from your Want Vault?`,
      confirmText: "Remove",
      cancelText: "Keep in Vault",
      isDestructive: true,
      onConfirm: () => {
        dispatch(deleteVaultItem(item.id));
        showToast(`Removed "${item.name}"`);
      },
    });
  };

  const handleConvertToExpense = (item) => {
    showConfirm({
      title: "Decided to Buy?",
      message: `Record "${item.name}" as an expense of ${formatINR(item.amount)} in your ledger and remove it from your Want Vault?`,
      confirmText: "Buy & Record Expense",
      cancelText: "Still Thinking",
      isDestructive: false,
      onConfirm: () => {
        dispatch(
          addTransaction({
            title: item.name,
            amount: Number(item.amount),
            category: "Shopping",
            type: "expense",
            date: getLocalDateString(),
          })
        );
        dispatch(deleteVaultItem(item.id));
        showToast(`Recorded "${item.name}" as expense in ledger`);
      },
    });
  };

  return (
    <div className="page-wrap">
      <Header
        eyebrow="Decide · wants can wait"
        title="Want Vault"
        sub="Keep the want. Add a little space around it."
      />

      <div className="row g-4 mt-2">
        <div className="col-lg-7">
          {vaultItems.length === 0 ? (
            <div className="paper-panel reveal" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
              <i className="bi bi-box" style={{ fontSize: "2.5rem", color: "var(--text-secondary)" }}></i>
              <h3 style={{ margin: "1rem 0 0.5rem" }}>Your vault is empty</h3>
              <p style={{ color: "var(--text-secondary)", maxWidth: "420px", margin: "0 auto" }}>
                Save a want you're eyeing to let it cool off. Research shows a 48-hour pause saves thousands in impulsive buys.
              </p>
            </div>
          ) : (
            vaultItems.map((item) => {
              const days = calculateElapsedDays(item.date);

              return (
                <div
                  key={item.id}
                  className="vault-item reveal"
                  style={{ marginBottom: "1rem" }}
                >
                  <div style={{ flex: 1 }}>
                    <span className="eyebrow">
                      Cooling-off · {days === 0 ? "Saved today" : `${days} ${days === 1 ? "day" : "days"}`}
                    </span>
                    <h2>{item.name}</h2>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                        margin: "0.5rem 0",
                      }}
                    >
                      {days >= 7
                        ? "It's been a week! If you still genuinely need it, you can buy with clarity."
                        : "Still thinking about it? That's useful information. Give it time to breathe."}
                    </p>

                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="text-button"
                        style={{ fontSize: "0.8rem", padding: 0 }}
                        onClick={() => openEditVaultItem(item)}
                      >
                        <i className="bi bi-pencil" style={{ marginRight: "4px" }}></i>
                        Edit
                      </button>

                      <button
                        type="button"
                        className="text-button"
                        style={{ fontSize: "0.8rem", padding: 0, color: "var(--accent-primary)" }}
                        onClick={() => handleConvertToExpense(item)}
                      >
                        <i className="bi bi-cart-check" style={{ marginRight: "4px" }}></i>
                        Ready to Buy ↗
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "0.75rem",
                    }}
                  >
                    <div className="price">{formatINR(item.amount)}</div>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      aria-label={`Remove ${item.name} from vault`}
                      style={{
                        color: "var(--accent-primary)",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      Remove ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Save Form */}
        <div className="col-lg-5">
          <section className="goal-form-box reveal">
            <span className="eyebrow">Save a want</span>
            <h2 style={{ fontSize: "1.75rem", marginBottom: "1.5rem" }}>
              Put it in the vault.
            </h2>

            <form onSubmit={handleAddWant} noValidate>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label htmlFor="new-vault-name" style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  What are you eyeing?
                </label>
                <input
                  id="new-vault-name"
                  type="text"
                  placeholder="e.g. Mechanical keyboard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={touched.name && Boolean(errors.name)}
                />
                {touched.name && errors.name && (
                  <span className="form-error" style={{ color: "var(--accent-primary)", fontSize: "0.8rem" }}>
                    {errors.name}
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label htmlFor="new-vault-amount" style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Estimated Price (₹)
                </label>
                <input
                  id="new-vault-amount"
                  type="number"
                  min="1"
                  placeholder="2000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-invalid={touched.amount && Boolean(errors.amount)}
                />
                {touched.amount && errors.amount && (
                  <span className="form-error" style={{ color: "var(--accent-primary)", fontSize: "0.8rem" }}>
                    {errors.amount}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="primary-button"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Save to Want Vault
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default WantVaultPage;
