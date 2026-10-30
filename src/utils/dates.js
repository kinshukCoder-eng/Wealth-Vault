/**
 * Date and reporting period utilities for Wealth Vault.
 * Avoids timezone shifts by using local calendar dates.
 */

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 * @returns {string}
 */
export function getLocalDateString(dateObj = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a Date object at local midnight.
 * @param {string} dateStr
 * @returns {Date|null}
 */
export function parseLocalDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  // Match YYYY-MM-DD or ISO timestamp
  const parts = dateStr.slice(0, 10).split("-");
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }

  const date = new Date(year, month, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a date string (YYYY-MM-DD) into display format "24 Mar 2026".
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return "";
  const parsed = parseLocalDate(dateStr);
  if (!parsed) return dateStr;

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats today's date for header display (e.g. "Tuesday, 24 March 2026").
 * @param {Date} [dateObj]
 * @returns {string}
 */
export function formatHeaderDate(dateObj = new Date()) {
  return dateObj.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Gets a month-year period key (e.g., "2026-03") from a date or date string.
 * @param {string|Date} dateOrStr
 * @returns {string}
 */
export function getPeriodKey(dateOrStr) {
  if (!dateOrStr) return "";
  if (typeof dateOrStr === "string") {
    return dateOrStr.slice(0, 7);
  }
  const year = dateOrStr.getFullYear();
  const month = String(dateOrStr.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Returns formatted label for a period key (e.g. "2026-03" -> "March 2026").
 * @param {string} periodKey
 * @returns {string}
 */
export function formatPeriodLabel(periodKey) {
  if (!periodKey || periodKey === "all") return "All Time";
  const [year, month] = periodKey.split("-");
  if (!year || !month) return periodKey;
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

/**
 * Checks if a transaction date falls into the given period.
 * If period is 'all', always returns true.
 * @param {string} transactionDate YYYY-MM-DD
 * @param {string} periodKey YYYY-MM or 'all'
 * @returns {boolean}
 */
export function isInPeriod(transactionDate, periodKey) {
  if (!periodKey || periodKey === "all") return true;
  if (!transactionDate) return false;
  return transactionDate.startsWith(periodKey);
}

/**
 * Calculates cooling-off elapsed days accurately.
 * Handles future or invalid dates gracefully without returning negative numbers.
 * @param {string} dateStr
 * @returns {number}
 */
export function calculateElapsedDays(dateStr) {
  if (!dateStr) return 0;
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return 0;

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  if (diffMs <= 0) return 0;

  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Checks whether a given date is a weekend (Saturday or Sunday).
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isWeekend(dateStr) {
  const d = parseLocalDate(dateStr);
  if (!d) return false;
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday=0, Saturday=6
}

/**
 * Gets start and end date of the current ISO week (Monday to Sunday).
 * @param {Date} [refDate]
 * @returns {{ start: string, end: string }}
 */
export function getCurrentWeekRange(refDate = new Date()) {
  const d = new Date(refDate);
  const day = d.getDay();
  // ISO week: Monday is day 1, Sunday is day 7
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: getLocalDateString(monday),
    end: getLocalDateString(sunday),
  };
}

/**
 * Days in a month for a period key "YYYY-MM".
 * @param {string} periodKey
 * @returns {number}
 */
export function getDaysInPeriod(periodKey) {
  if (!periodKey || periodKey === "all") return 30;
  const [yearStr, monthStr] = periodKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (Number.isNaN(year) || Number.isNaN(month)) return 30;
  return new Date(year, month, 0).getDate();
}

/**
 * Checks if period is the current calendar month.
 * @param {string} periodKey
 * @returns {boolean}
 */
export function isCurrentPeriod(periodKey) {
  if (!periodKey || periodKey === "all") return false;
  return periodKey === getPeriodKey(new Date());
}

/**
 * Checks if period is in the past compared to current calendar month.
 * @param {string} periodKey
 * @returns {boolean}
 */
export function isPastPeriod(periodKey) {
  if (!periodKey || periodKey === "all") return false;
  const current = getPeriodKey(new Date());
  return periodKey < current;
}
