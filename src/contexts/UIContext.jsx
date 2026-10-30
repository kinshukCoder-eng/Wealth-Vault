import React, { useReducer, useCallback } from "react";
import { UIContext } from "./UIContextDefinition";

const initialUIState = {
  transactionModal: { isOpen: false, editing: null },
  budgetModal: { isOpen: false },
  goalModal: { isOpen: false, editing: null },
  contributionModal: { isOpen: false, goalId: null, goalName: "" },
  vaultModal: { isOpen: false, editing: null },
  confirmDialog: {
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    onConfirm: null,
    isDestructive: false,
  },
  toasts: [],
};

function uiReducer(state, action) {
  switch (action.type) {
    case "OPEN_ADD_TRANSACTION":
      return {
        ...state,
        transactionModal: { isOpen: true, editing: null },
      };
    case "OPEN_EDIT_TRANSACTION":
      return {
        ...state,
        transactionModal: { isOpen: true, editing: action.payload },
      };
    case "CLOSE_TRANSACTION_MODAL":
      return {
        ...state,
        transactionModal: { isOpen: false, editing: null },
      };

    case "OPEN_BUDGET_MODAL":
      return { ...state, budgetModal: { isOpen: true } };
    case "CLOSE_BUDGET_MODAL":
      return { ...state, budgetModal: { isOpen: false } };

    case "OPEN_ADD_GOAL":
      return { ...state, goalModal: { isOpen: true, editing: null } };
    case "OPEN_EDIT_GOAL":
      return { ...state, goalModal: { isOpen: true, editing: action.payload } };
    case "CLOSE_GOAL_MODAL":
      return { ...state, goalModal: { isOpen: false, editing: null } };

    case "OPEN_CONTRIBUTION_MODAL":
      return {
        ...state,
        contributionModal: {
          isOpen: true,
          goalId: action.payload.goalId,
          goalName: action.payload.goalName,
        },
      };
    case "CLOSE_CONTRIBUTION_MODAL":
      return {
        ...state,
        contributionModal: { isOpen: false, goalId: null, goalName: "" },
      };

    case "OPEN_ADD_VAULT":
      return { ...state, vaultModal: { isOpen: true, editing: null } };
    case "OPEN_EDIT_VAULT":
      return { ...state, vaultModal: { isOpen: true, editing: action.payload } };
    case "CLOSE_VAULT_MODAL":
      return { ...state, vaultModal: { isOpen: false, editing: null } };

    case "OPEN_CONFIRM":
      return {
        ...state,
        confirmDialog: {
          isOpen: true,
          title: action.payload.title || "Confirm Action",
          message: action.payload.message || "Are you sure?",
          confirmText: action.payload.confirmText || "Confirm",
          cancelText: action.payload.cancelText || "Cancel",
          onConfirm: action.payload.onConfirm,
          isDestructive: Boolean(action.payload.isDestructive),
        },
      };
    case "CLOSE_CONFIRM":
      return {
        ...state,
        confirmDialog: { ...initialUIState.confirmDialog, isOpen: false },
      };

    case "ADD_TOAST":
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload),
      };

    default:
      return state;
  }
}

export function UIProvider({ children }) {
  const [state, dispatch] = useReducer(uiReducer, initialUIState);

  const openAddTransaction = useCallback(() => {
    dispatch({ type: "OPEN_ADD_TRANSACTION" });
  }, []);

  const openEditTransaction = useCallback((transaction) => {
    dispatch({ type: "OPEN_EDIT_TRANSACTION", payload: transaction });
  }, []);

  const closeTransactionModal = useCallback(() => {
    dispatch({ type: "CLOSE_TRANSACTION_MODAL" });
  }, []);

  const openBudgetModal = useCallback(() => {
    dispatch({ type: "OPEN_BUDGET_MODAL" });
  }, []);

  const closeBudgetModal = useCallback(() => {
    dispatch({ type: "CLOSE_BUDGET_MODAL" });
  }, []);

  const openAddGoal = useCallback(() => {
    dispatch({ type: "OPEN_ADD_GOAL" });
  }, []);

  const openEditGoal = useCallback((goal) => {
    dispatch({ type: "OPEN_EDIT_GOAL", payload: goal });
  }, []);

  const closeGoalModal = useCallback(() => {
    dispatch({ type: "CLOSE_GOAL_MODAL" });
  }, []);

  const openContributionModal = useCallback((goalId, goalName) => {
    dispatch({ type: "OPEN_CONTRIBUTION_MODAL", payload: { goalId, goalName } });
  }, []);

  const closeContributionModal = useCallback(() => {
    dispatch({ type: "CLOSE_CONTRIBUTION_MODAL" });
  }, []);

  const openAddVaultItem = useCallback(() => {
    dispatch({ type: "OPEN_ADD_VAULT" });
  }, []);

  const openEditVaultItem = useCallback((item) => {
    dispatch({ type: "OPEN_EDIT_VAULT", payload: item });
  }, []);

  const closeVaultModal = useCallback(() => {
    dispatch({ type: "CLOSE_VAULT_MODAL" });
  }, []);

  const showConfirm = useCallback(
    ({ title, message, confirmText, cancelText, onConfirm, isDestructive }) => {
      dispatch({
        type: "OPEN_CONFIRM",
        payload: { title, message, confirmText, cancelText, onConfirm, isDestructive },
      });
    },
    []
  );

  const closeConfirm = useCallback(() => {
    dispatch({ type: "CLOSE_CONFIRM" });
  }, []);

  const showToast = useCallback((message, type = "success") => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    dispatch({
      type: "ADD_TOAST",
      payload: { id, message, type },
    });
    setTimeout(() => {
      dispatch({ type: "REMOVE_TOAST", payload: id });
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    dispatch({ type: "REMOVE_TOAST", payload: id });
  }, []);

  const value = {
    ...state,
    openAddTransaction,
    openEditTransaction,
    closeTransactionModal,
    openBudgetModal,
    closeBudgetModal,
    openAddGoal,
    openEditGoal,
    closeGoalModal,
    openContributionModal,
    closeContributionModal,
    openAddVaultItem,
    openEditVaultItem,
    closeVaultModal,
    showConfirm,
    closeConfirm,
    showToast,
    removeToast,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export { useUI } from "./useUI";
export default UIProvider;
