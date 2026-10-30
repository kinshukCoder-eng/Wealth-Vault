/**
 * Currency utilities for Wealth Vault.
 * All monetary amounts are handled in Indian Rupees (INR).
 */

/**
 * Rounds a monetary number to 2 decimal places to avoid floating-point drift.
 * @param {number|string} val
 * @returns {number}
 */
export function roundCurrency(val) {
  const num = Number(val);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Format a number into standard Indian Rupee string (₹).
 * @param {number|string} val
 * @param {object} options
 * @returns {string}
 */
export function formatINR(val, options = {}) {
  const {
    maximumFractionDigits = 0,
    minimumFractionDigits = 0,
    includeSymbol = true,
  } = options;

  const num = Number(val);
  const safeVal = Number.isFinite(num) ? num : 0;

  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(safeVal);

  if (!includeSymbol) {
    return formatted.replace(/[₹\s]/g, "");
  }

  return formatted;
}

/**
 * Backward-compatible helper matching original project signature.
 * @param {number|string} val
 * @returns {string}
 */
export const money = (val) => {
  return formatINR(val, { maximumFractionDigits: 0 });
};

/**
 * Validates whether a value is a valid positive financial amount.
 * @param {any} val
 * @returns {boolean}
 */
export function isValidAmount(val) {
  if (val === null || val === undefined || val === "") return false;
  const num = Number(val);
  return Number.isFinite(num) && num > 0;
}

export function formatBudgetPercent(value) {
  return value > 0 && value < 1 ? 'less than 1%' : `${Math.round(value)}%`;
}
