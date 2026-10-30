/**
 * Robust local persistence and migration layer for Wealth Vault.
 * Ensures data safety, backward compatibility, and error recovery.
 */

import { demoState } from "../data/demoData";

export const STORAGE_KEYS = {
  STATE_V1: "wealth-vault-state-v1",
  STATE_BACKUP: "wealth-vault-state-v1-backup",
  STATE_V2: "wealth-vault-state-v2",
  THEME: "wealth-vault-theme",
  PAGE: "wealth-vault-page",
};

/**
 * Safely parse JSON from localStorage without throwing.
 * @param {string} key
 * @returns {any|null}
 */
export function safeGetItem(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[WealthVault] Error reading storage key "${key}":`, err);
    return null;
  }
}

/**
 * Safely set JSON to localStorage.
 * @param {string} key
 * @param {any} value
 * @returns {boolean}
 */
export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[WealthVault] Storage quota or access error saving "${key}":`, err);
    return false;
  }
}

/**
 * Migrates a legacy goal to the upgraded schema with contributions.
 * Preserves initial savings so future contributions don't overwrite or double-count.
 */
export function migrateGoal(goal) {
  if (!goal || typeof goal !== "object") return null;

  const target = Number(goal.target) || 0;
  const initialSaved = Number(goal.initialSaved ?? goal.saved ?? 0);
  const monthly = Number(goal.monthly ?? 0);
  const contributions = Array.isArray(goal.contributions) ? goal.contributions : [];

  return {
    id: goal.id || `g_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: String(goal.name || "Untitled Goal"),
    target,
    initialSaved,
    monthly,
    emoji: goal.emoji || "🎯",
    contributions,
  };
}

/**
 * Validates and sanitizes a transaction record.
 */
export function sanitizeTransaction(t) {
  if (!t || typeof t !== "object") return null;
  return {
    id: t.id || `t_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    title: String(t.title || "Untitled"),
    category: String(t.category || "Other"),
    amount: Math.abs(Number(t.amount) || 0),
    type: t.type === "income" ? "income" : "expense",
    date: String(t.date || new Date().toISOString().slice(0, 10)),
  };
}

/**
 * Validates and sanitizes a Want Vault item.
 */
export function sanitizeVaultItem(v) {
  if (!v || typeof v !== "object") return null;
  return {
    id: v.id || `v_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: String(v.name || "Untitled Want"),
    amount: Math.abs(Number(v.amount) || 0),
    date: String(v.date || new Date().toISOString()),
  };
}

/**
 * Loads and migrates the initial application state.
 *
 * Rules:
 * 1. If no data exists, load fresh demo data.
 * 2. If stored data exists, preserve intentional empty arrays `[]`.
 * 3. Keep a backup copy of original v1 data before migrating.
 * 4. Migrate goals to support contributions without losing `saved`.
 * 5. Sanitize corrupted entries gracefully.
 *
 * @returns {object} Initial preloaded state for Redux.
 */
export function loadPersistedState() {
  const rawV1 = localStorage.getItem(STORAGE_KEYS.STATE_V1);
  const rawV2 = localStorage.getItem(STORAGE_KEYS.STATE_V2);

  // If v2 already exists, load it
  if (rawV2) {
    try {
      const parsed = JSON.parse(rawV2);
      if (parsed && typeof parsed === "object") {
        return normalizeState(parsed);
      }
    } catch (e) {
      console.error("[WealthVault] Error loading state v2, falling back:", e);
    }
  }

  // If v1 exists, backup and migrate
  if (rawV1) {
    try {
      // Backup original v1 data first
      if (!localStorage.getItem(STORAGE_KEYS.STATE_BACKUP)) {
        localStorage.setItem(STORAGE_KEYS.STATE_BACKUP, rawV1);
      }

      const legacyState = JSON.parse(rawV1);
      if (legacyState && typeof legacyState === "object") {
        const migrated = {
          transactions: Array.isArray(legacyState.transactions)
            ? legacyState.transactions.map(sanitizeTransaction).filter(Boolean)
            : demoState.transactions,
          goals: Array.isArray(legacyState.goals)
            ? legacyState.goals.map(migrateGoal).filter(Boolean)
            : demoState.goals.map(migrateGoal),
          vault: Array.isArray(legacyState.vault)
            ? legacyState.vault.map(sanitizeVaultItem).filter(Boolean)
            : demoState.vault.map(sanitizeVaultItem),
          budget: legacyState.budget || {
            mode: "auto",
            manualAmounts: {},
            defaultManual: 15000,
          },
          challenges: legacyState.challenges || {
            activeChallenges: ["weekly-food", "monthly-savings"],
            claimedXP: {},
          },
          reportingPeriod: legacyState.reportingPeriod || "2026-03",
        };

        // Save migrated state to v2 and keep v1 compatible
        safeSetItem(STORAGE_KEYS.STATE_V2, migrated);
        return migrated;
      }
    } catch (err) {
      console.error("[WealthVault] Malformed v1 state. Preserving raw backup:", err);
      // DO NOT overwrite raw data! Save to backup
      try {
        localStorage.setItem(STORAGE_KEYS.STATE_BACKUP + "-corrupt", rawV1);
      } catch {
        // ignore
      }
    }
  }

  // Truly fresh installation: seed from demoState
  return getFreshDemoState();
}

/**
 * Returns fresh demo state with upgraded schema.
 */
export function getFreshDemoState() {
  return {
    transactions: JSON.parse(JSON.stringify(demoState.transactions)),
    goals: demoState.goals.map(migrateGoal),
    vault: JSON.parse(JSON.stringify(demoState.vault)),
    budget: {
      mode: "auto",
      manualAmounts: {},
      defaultManual: 15000,
    },
    challenges: {
      activeChallenges: ["weekly-food", "monthly-savings"],
      claimedXP: {},
    },
    reportingPeriod: "2026-03",
  };
}

/**
 * Normalizes state structure ensuring arrays and default values exist.
 */
function normalizeState(state) {
  return {
    transactions: Array.isArray(state.transactions)
      ? state.transactions.map(sanitizeTransaction).filter(Boolean)
      : [],
    goals: Array.isArray(state.goals)
      ? state.goals.map(migrateGoal).filter(Boolean)
      : [],
    vault: Array.isArray(state.vault)
      ? state.vault.map(sanitizeVaultItem).filter(Boolean)
      : [],
    budget: state.budget && typeof state.budget === "object"
      ? state.budget
      : { mode: "auto", manualAmounts: {}, defaultManual: 15000 },
    challenges: state.challenges && typeof state.challenges === "object"
      ? state.challenges
      : { activeChallenges: ["weekly-food", "monthly-savings"], claimedXP: {} },
    reportingPeriod: typeof state.reportingPeriod === "string"
      ? state.reportingPeriod
      : "2026-03",
  };
}

/**
 * Saves state to both v2 and legacy v1 (for backward compatibility).
 */
export function persistApplicationState(state) {
  if (!state) return;
  safeSetItem(STORAGE_KEYS.STATE_V2, state);

  // Backward compatible v1 mirror so existing legacy tools reading v1 still work
  try {
    const legacyCompat = {
      transactions: state.transactions || [],
      goals: (state.goals || []).map((g) => {
        const contributionsTotal = (g.contributions || []).reduce(
          (sum, c) => sum + (Number(c.amount) || 0),
          0
        );
        return {
          id: g.id,
          name: g.name,
          target: g.target,
          saved: (Number(g.initialSaved) || 0) + contributionsTotal,
          monthly: g.monthly,
          emoji: g.emoji,
        };
      }),
      vault: state.vault || [],
    };
    safeSetItem(STORAGE_KEYS.STATE_V1, legacyCompat);
  } catch (err) {
    console.warn("[WealthVault] Failed writing legacy v1 mirror:", err);
  }
}
