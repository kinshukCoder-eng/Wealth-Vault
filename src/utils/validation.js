/**
 * Form validation utilities for Wealth Vault.
 * Reusable and pure validation logic for accessible forms.
 */

/**
 * Validate a transaction draft.
 * @param {object} values
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateTransaction(values) {
  const errors = {};

  // Title validation
  const title = (values.title || "").trim();
  if (!title) {
    errors.title = "Title is required and cannot be blank.";
  } else if (title.length > 80) {
    errors.title = "Title cannot exceed 80 characters.";
  }

  // Amount validation
  const amountStr = String(values.amount ?? "").trim();
  const amount = Number(amountStr);
  if (!amountStr) {
    errors.amount = "Amount is required.";
  } else if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = "Amount must be a positive number greater than 0.";
  } else if (amount > 100000000) {
    errors.amount = "Amount exceeds the maximum limit of ₹10,00,00,000.";
  } else {
    // Check decimal places up to 2
    const parts = amountStr.split(".");
    if (parts[1] && parts[1].length > 2) {
      errors.amount = "Amount can have at most 2 decimal places.";
    }
  }

  // Category validation
  if (!values.category || !values.category.trim()) {
    errors.category = "Category is required.";
  }

  // Type validation
  if (!["income", "expense"].includes(values.type)) {
    errors.type = "Type must be either Income or Expense.";
  }

  // Date validation
  if (!values.date || !values.date.trim()) {
    errors.date = "Date is required.";
  } else {
    const parts = values.date.split("-");
    if (parts.length !== 3 || Number.isNaN(Date.parse(values.date))) {
      errors.date = "Please enter a valid date in YYYY-MM-DD format.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate a Goal form draft.
 * @param {object} values
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateGoal(values) {
  const errors = {};

  const name = (values.name || "").trim();
  if (!name) {
    errors.name = "Goal name is required.";
  } else if (name.length > 60) {
    errors.name = "Goal name cannot exceed 60 characters.";
  }

  const targetStr = String(values.target ?? "").trim();
  const target = Number(targetStr);
  if (!targetStr) {
    errors.target = "Target amount is required.";
  } else if (!Number.isFinite(target) || target <= 0) {
    errors.target = "Target amount must be greater than 0.";
  }

  if (values.monthly !== undefined && values.monthly !== "") {
    const monthly = Number(values.monthly);
    if (!Number.isFinite(monthly) || monthly < 0) {
      errors.monthly = "Planned monthly contribution cannot be negative.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate a Goal Contribution.
 * @param {object} values
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateContribution(values) {
  const errors = {};

  const amountStr = String(values.amount ?? "").trim();
  const amount = Number(amountStr);
  if (!amountStr) {
    errors.amount = "Contribution amount is required.";
  } else if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = "Contribution amount must be greater than 0.";
  }

  if (!values.date || !values.date.trim()) {
    errors.date = "Date is required.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate a Want Vault item.
 * @param {object} values
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateVaultItem(values) {
  const errors = {};

  const name = (values.name || "").trim();
  if (!name) {
    errors.name = "Item name is required.";
  } else if (name.length > 80) {
    errors.name = "Item name cannot exceed 80 characters.";
  }

  const amountStr = String(values.amount ?? "").trim();
  const amount = Number(amountStr);
  if (!amountStr) {
    errors.amount = "Price is required.";
  } else if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = "Price must be a positive number.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate budget configuration.
 * @param {object} values
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateBudget(values) {
  const errors = {};

  if (values.mode === "manual") {
    const amountStr = String(values.amount ?? "").trim();
    const amount = Number(amountStr);
    if (amountStr === "") {
      errors.amount = "Budget amount is required for manual mode.";
    } else if (!Number.isFinite(amount) || amount < 0) {
      errors.amount = "Budget amount must be 0 or positive.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
