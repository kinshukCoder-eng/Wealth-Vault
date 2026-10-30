import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import PocketPalPage from '../pages/PocketPalPage';
import TransactionModal from '../components/forms/TransactionModal';
import MoneyPulse from '../components/shared/MoneyPulse';
import { ToolsPage } from "../pages/ToolsPage";
import { ChallengesPage } from "../pages/ChallengesPage";
import WantVaultPage from "../pages/WantVaultPage";
import GoalsPage from "../pages/GoalsPage";
import TransactionsPage from "../pages/TransactionsPage";
import ConfirmDialog from "../components/feedback/ConfirmDialog";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import InsightsPage from '../pages/InsightsPage';
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import transactionsReducer, { addTransaction } from "../features/transactions/transactionsSlice";
import goalsReducer from "../features/goals/goalsSlice";
import vaultReducer from "../features/vault/vaultSlice";
import budgetReducer from "../features/budget/budgetSlice";
import challengesReducer from "../features/challenges/challengesSlice";
import pocketPalReducer from "../features/pocketPal/pocketPalSlice";
import { ThemeProvider } from "../contexts/ThemeContext";
import { UIProvider } from "../contexts/UIContext";
import { selectFinancialStats } from "../features/selectors";
import {
  validateTransaction,
  validateGoal,
  validateContribution,
  validateVaultItem,
  validateBudget,
} from "../utils/validation";

function renderWithProviders(ui, { preloadedState = {} } = {}) {
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
      transactions: [],
      goals: [],
      vault: [],
      budget: { mode: "auto", manualAmounts: {}, defaultManual: 15000, reportingPeriod: "2026-03" },
      challenges: { activeChallenges: [], claimedXP: {} },
      pocketPal: { messages: [] },
      ...preloadedState,
    },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <ThemeProvider>
          <UIProvider>{ui}</UIProvider>
        </ThemeProvider>
      </Provider>
    ),
  };
}

describe("Purchase reflection", () => {
  it("saves a named purchase only on confirmation without changing finances", () => {
    const { store } = renderWithProviders(<ToolsPage />);
    const before = store.getState();
    fireEvent.click(screen.getByRole("button", { name: "Wait on it" }));
    expect(store.getState().vault).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Save to Want Vault" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Item name is required");
    fireEvent.change(screen.getByLabelText("What are you considering?"), { target: { value: "Headphones" } });
    fireEvent.click(screen.getByRole("button", { name: "Save to Want Vault" }));
    expect(store.getState().vault).toHaveLength(1);
    expect(store.getState().vault[0]).toMatchObject({ name: "Headphones", amount: 800 });
    expect(store.getState().transactions).toEqual(before.transactions);
    expect(store.getState().goals).toEqual(before.goals);
    expect(screen.getByLabelText("What-if spending amount")).toHaveValue(3000);
  });

  it("compares prices and handles invalid prices and zero hourly rates", () => {
    const { store } = renderWithProviders(<ToolsPage />);
    fireEvent.click(screen.getByRole("button", { name: /Compare a cheaper option/ }));
    const price = screen.getByLabelText("Alternative price (₹)");
    fireEvent.change(price, { target: { value: "400" } });
    expect(screen.getByText(/4.0 hours · 0.5 workdays saved/)).toBeInTheDocument();
    expect(screen.getByLabelText("Target purchase amount in rupees")).toHaveValue(800);
    expect(screen.getByLabelText("What-if spending amount")).toHaveValue(3000);
    expect(store.getState().vault).toHaveLength(0);
    fireEvent.change(price, { target: { value: "900" } });
    expect(screen.getByText(/Enter a price from/)).toBeInTheDocument();
    fireEvent.change(price, { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("Hourly wage in rupees per hour"), { target: { value: "0" } });
    expect(screen.getByText(/Enter a positive hourly rate/)).toBeInTheDocument();
  });
});

describe("Form Validation Logic", () => {
  it("rejects invalid transaction inputs", () => {
    // Blank title
    expect(validateTransaction({ title: "   ", amount: 100, category: "Food", type: "expense", date: "2026-03-24" }).isValid).toBe(false);
    // Zero amount
    expect(validateTransaction({ title: "Valid", amount: 0, category: "Food", type: "expense", date: "2026-03-24" }).isValid).toBe(false);
    // Negative amount
    expect(validateTransaction({ title: "Valid", amount: -50, category: "Food", type: "expense", date: "2026-03-24" }).isValid).toBe(false);
    // More than 2 decimals
    expect(validateTransaction({ title: "Valid", amount: "10.999", category: "Food", type: "expense", date: "2026-03-24" }).isValid).toBe(false);
    // Valid input
    expect(validateTransaction({ title: "Valid Item", amount: 150.5, category: "Food", type: "expense", date: "2026-03-24" }).isValid).toBe(true);
  });

  it("validates goal inputs", () => {
    expect(validateGoal({ name: "", target: 5000 }).isValid).toBe(false);
    expect(validateGoal({ name: "Phone", target: -100 }).isValid).toBe(false);
    expect(validateGoal({ name: "Phone", target: 50000, monthly: 5000 }).isValid).toBe(true);
  });

  it("validates contribution inputs", () => {
    expect(validateContribution({ amount: 0, date: "2026-03-24" }).isValid).toBe(false);
    expect(validateContribution({ amount: 2000, date: "" }).isValid).toBe(false);
    expect(validateContribution({ amount: 2000, date: "2026-03-24" }).isValid).toBe(true);
  });

  it("validates want vault items", () => {
    expect(validateVaultItem({ name: "", amount: 1000 }).isValid).toBe(false);
    expect(validateVaultItem({ name: "Watch", amount: 0 }).isValid).toBe(false);
    expect(validateVaultItem({ name: "Watch", amount: 3500 }).isValid).toBe(true);
  });

  it("validates budget configuration", () => {
    expect(validateBudget({ mode: "auto" }).isValid).toBe(true);
    expect(validateBudget({ mode: "manual", amount: -500 }).isValid).toBe(false);
    expect(validateBudget({ mode: "manual", amount: 15000 }).isValid).toBe(true);
  });
});

describe("Cross-Screen Consistency & Redux State", () => {
  it("immediately recalculates balance, spending and remaining budget upon adding transaction", () => {
    const { store } = renderWithProviders(<div />);

    expect(selectFinancialStats(store.getState()).balance).toBe(0);

    // Add Income
    store.dispatch(
      addTransaction({
        title: "Stipend",
        amount: 25000,
        category: "Other",
        type: "income",
        date: "2026-03-01",
      })
    );

    let stats = selectFinancialStats(store.getState());
    expect(stats.balance).toBe(25000);
    expect(stats.income).toBe(25000);
    // Auto budget is 80% of 25000 = 20000
    expect(stats.budget).toBe(20000);
    expect(stats.remaining).toBe(20000);

    // Add Expense
    store.dispatch(
      addTransaction({
        title: "Books",
        amount: 3000,
        category: "Other",
        type: "expense",
        date: "2026-03-05",
      })
    );

    stats = selectFinancialStats(store.getState());
    expect(stats.balance).toBe(22000);
    expect(stats.spending).toBe(3000);
    expect(stats.remaining).toBe(17000);
  });
});

describe('Challenges interactions', () => {
  it('saves targets and starts a purchase pause without modifying other records', () => {
    const { store } = renderWithProviders(<MemoryRouter><ChallengesPage /></MemoryRouter>, { preloadedState: {
      vault: [{ id: 'v1', name: 'Test headphones', amount: 800, date: '2026-01-01' }],
      challenges: { activeChallenges: ['weekly-food', 'monthly-savings'], claimedXP: {} }
    }});
    const before = store.getState();
    fireEvent.change(screen.getByLabelText('Weekly food limit (₹)'), { target: { value: '2000' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save target' })[0]);
    expect(Object.values(store.getState().challenges.targets)).toContain(2000);
    fireEvent.change(screen.getByLabelText('Want Vault item'), { target: { value: 'v1' } });
    fireEvent.change(screen.getByLabelText('Wait for'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start waiting' }));
    expect(store.getState().challenges.purchasePauses.v1.days).toBe(7);
    expect(screen.getByText(/7 days remaining/)).toBeInTheDocument();
    expect(store.getState().vault).toEqual(before.vault);
    expect(store.getState().transactions).toEqual(before.transactions);
    expect(store.getState().goals).toEqual(before.goals);
    expect(screen.getByRole('link', { name: /View food expenses/ })).toHaveAttribute('href', '/transactions?category=Food');
    fireEvent.click(screen.getAllByRole('button', { name: 'Confirm no spending' })[0]);
    expect(store.getState().challenges.confirmedDays).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /Confirmed.*Undo/ }));
    expect(store.getState().challenges.confirmedDays).toHaveLength(0);
  });
});

describe('Custom challenge creation', () => {
  it('creates and pauses a personal challenge without modifying financial records', () => {
    const { store } = renderWithProviders(<MemoryRouter><ChallengesPage /></MemoryRouter>);
    const before = store.getState();
    fireEvent.click(screen.getByRole('button', {name:'Create your own'}));
    fireEvent.change(screen.getByLabelText('Challenge name'), {target:{value:'My quiet week'}});
    fireEvent.change(screen.getByLabelText('Track'), {target:{value:'no-spend'}});
    fireEvent.change(screen.getByLabelText('Target days'), {target:{value:'3'}});
    fireEvent.click(screen.getByRole('button', {name:'Start challenge'}));
    expect(screen.getByRole('heading', {name:'My quiet week'})).toBeInTheDocument();
    expect(store.getState().challenges.personalChallenges[0]).toMatchObject({name:'My quiet week',target:3,days:7});
    fireEvent.click(screen.getByRole('button', {name:'Pause'}));
    expect(screen.getByRole('button', {name:'Resume'})).toBeInTheDocument();
    expect(store.getState().transactions).toEqual(before.transactions);
    expect(store.getState().goals).toEqual(before.goals);
    expect(store.getState().vault).toEqual(before.vault);
  });
});

describe('Audit: confirmed multi-feature actions', () => {
  it('converts one saved want into exactly one shopping expense after confirmation', () => {
    const { store } = renderWithProviders(<><WantVaultPage /><ConfirmDialog /></>, {preloadedState:{vault:[{id:'qa-v',name:'QA Monitor',amount:2000,date:'2026-10-01'}]}});
    fireEvent.click(screen.getByRole('button',{name:/Ready to Buy/}));
    expect(store.getState().transactions).toHaveLength(0);
    fireEvent.click(screen.getByRole('button',{name:'Still Thinking'}));
    expect(store.getState().vault).toHaveLength(1);
    fireEvent.click(screen.getByRole('button',{name:/Ready to Buy/}));
    fireEvent.click(screen.getByRole('button',{name:'Buy & Record Expense'}));
    expect(store.getState().vault).toHaveLength(0);
    expect(store.getState().transactions).toHaveLength(1);
    expect(store.getState().transactions[0]).toMatchObject({title:'QA Monitor',type:'expense',category:'Shopping',amount:2000});
  });
  it('removes a goal and its contributions only after confirmation', () => {
    const { store } = renderWithProviders(<><GoalsPage /><ConfirmDialog /></>, {preloadedState:{goals:[{id:'qa-g',name:'QA Goal',target:5000,initialSaved:0,monthly:100,contributions:[{id:'qa-c',amount:100,date:'2026-10-01'}]}]}});
    fireEvent.click(screen.getByRole('button',{name:'Remove goal QA Goal'}));
    fireEvent.click(screen.getByRole('button',{name:'Keep Goal'}));
    expect(store.getState().goals).toHaveLength(1);
    fireEvent.click(screen.getByRole('button',{name:'Remove goal QA Goal'}));
    fireEvent.click(screen.getByRole('button',{name:'Remove Goal'}));
    expect(store.getState().goals).toHaveLength(0);
    expect(store.getState().transactions).toHaveLength(0);
  });
  it('resets demo transactions without changing goals, vault, budgets, or challenges', () => {
    const { store } = renderWithProviders(<MemoryRouter><TransactionsPage /><ConfirmDialog /></MemoryRouter>, {preloadedState:{transactions:[{id:'qa-t',title:'QA',amount:1,type:'expense',category:'Food',date:'2026-10-01'}],vault:[{id:'qa-v',name:'Keep',amount:20,date:'2026-10-01'}]}});
    const before=store.getState();
    fireEvent.click(screen.getByRole('button',{name:'Reset demo'}));
    fireEvent.click(screen.getByRole('button',{name:'Reset Transactions'}));
    expect(store.getState().transactions).toHaveLength(3);
    for (const key of ['goals','vault','budget','challenges']) expect(store.getState()[key]).toEqual(before[key]);
  });
});

describe('Audit fixes', () => {
  it('preserves the selected period when opening an insight in the ledger', () => {
    renderWithProviders(<MemoryRouter initialEntries={['/insights']}><Routes><Route path='/insights' element={<InsightsPage />} /><Route path='/transactions' element={<TransactionsPage />} /></Routes></MemoryRouter>, {preloadedState:{transactions:[
      {id:'mar',title:'March meal',category:'Food',amount:150,type:'expense',date:'2026-03-24'},
      {id:'oct',title:'October meal',category:'Food',amount:300,type:'expense',date:'2026-10-26'}
    ]}});
    fireEvent.click(screen.getByRole('button',{name:'filter Food receipts →'}));
    expect(screen.getByText('March meal')).toBeInTheDocument();
    expect(screen.queryByText('October meal')).not.toBeInTheDocument();
  });
  it('filters month and category together and can clear both', () => {
    renderWithProviders(<MemoryRouter initialEntries={['/transactions?category=Food&month=2026-10']}><TransactionsPage /></MemoryRouter>, {preloadedState:{transactions:[
      {id:'oct',title:'October meal',category:'Food',amount:300,type:'expense',date:'2026-10-26'},
      {id:'mar',title:'March meal',category:'Food',amount:150,type:'expense',date:'2026-03-24'}
    ]}});
    expect(screen.getByText('October meal')).toBeInTheDocument();
    expect(screen.queryByText('March meal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Clear filters'}));
    expect(screen.getByText('March meal')).toBeInTheDocument();
  });
  it('traps both ends of a dialog and restores its trigger on Escape', () => {
    renderWithProviders(<MemoryRouter><TransactionsPage /><TransactionModal /></MemoryRouter>);
    const trigger=screen.getByRole('button',{name:/^\+ Add transaction$/});
    trigger.focus(); fireEvent.click(trigger);
    const title=screen.getByRole('textbox', {name:'Title'});
    const submit=screen.getByRole('button',{name:'Record Receipt'});
    expect(title).toHaveFocus();
    fireEvent.keyDown(title,{key:'Tab',shiftKey:true}); expect(submit).toHaveFocus();
    fireEvent.keyDown(submit,{key:'Tab'}); expect(title).toHaveFocus();
    expect(trigger.closest('[inert]')).not.toBeNull();
    fireEvent.keyDown(title,{key:'Escape'}); expect(trigger).toHaveFocus();
    expect(trigger.closest('[inert]')).toBeNull();
  });
  it('labels all-time budgets and small overruns accurately', () => {
    render(<MoneyPulse periodKey='all' stats={{score:50,budget:299,spending:300}} />);
    expect(screen.getByText('You are less than 1% over your planned all-time budget.')).toBeInTheDocument();
    expect(screen.queryByText(/monthly budget/)).not.toBeInTheDocument();
  });
});

describe('Pocket Pal frontend', () => {
  beforeEach(() => { vi.useFakeTimers(); Element.prototype.scrollIntoView = vi.fn(); });
  afterEach(() => { vi.useRealTimers(); delete Element.prototype.scrollIntoView; });
  const palState={transactions:[
    {id:'inc',title:'Income',amount:5000,type:'income',category:'Other',date:'2026-03-22'},
    {id:'food',title:'Coffee',amount:150,type:'expense',category:'Food',date:'2026-03-24'},
    {id:'travel',title:'Uber',amount:450,type:'expense',category:'Transport',date:'2026-03-21'}
  ],budget:{mode:'auto',manualAmounts:{},defaultManual:15000,reportingPeriod:'2026-03'}};
  it.each([
    ['Where did most of my money go?','Transport (₹450'],
    ['Can I afford ₹3,000?','your balance will be ₹1,400'],
    ['What is my remaining budget?','leaving ₹3,400'],
    ['What is my current balance?','balance is ₹4,400'],
    ['How much can I save?','retain ₹4,400'],
    ["What's my projected spending?",'projected spending is ₹600'],
  ])('answers the suggestion %s using recorded data', (question,expected) => {
    const {store}=renderWithProviders(<PocketPalPage />, {preloadedState:palState});
    const before=store.getState();
    fireEvent.click(screen.getByRole('button',{name:question}));
    expect(screen.getByText('Pocket Pal is calculating...')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(450));
    expect(store.getState().pocketPal.messages.at(-1).text).toContain(expected);
    for(const key of ['transactions','goals','vault','budget','challenges']) expect(store.getState()[key]).toEqual(before[key]);
  });
  it.each([
    ['Can I afford?', 'How much is the purchase'],
    ['Can I buy ₹9,000?', 'exceeds your current wallet balance'],
    ['Can I spend Rs. 4,000?', 'planned budget by ₹600'],
    ['Hello there', 'Ask me:'],
  ])('handles typed question %s', (question,expected) => {
    const {store}=renderWithProviders(<PocketPalPage />, {preloadedState:palState});
    fireEvent.change(screen.getByLabelText('Ask Pocket Pal a question'),{target:{value:question}});
    fireEvent.submit(screen.getByRole('button',{name:'Ask Pal ↗'}).closest('form'));
    act(() => vi.advanceTimersByTime(450));
    expect(store.getState().pocketPal.messages.at(-1).text).toContain(expected);
  });
  it('blocks empty messages and duplicate sends while calculating', () => {
    const {store}=renderWithProviders(<PocketPalPage />, {preloadedState:palState});
    expect(screen.getByRole('button',{name:'Ask Pal ↗'})).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Ask Pocket Pal a question'),{target:{value:'   '}});
    expect(screen.getByRole('button',{name:'Ask Pal ↗'})).toBeDisabled();
    fireEvent.click(screen.getByRole('button',{name:'What is my current balance?'}));
    fireEvent.click(screen.getByRole('button',{name:'What is my remaining budget?'}));
    act(() => vi.advanceTimersByTime(450));
    expect(store.getState().pocketPal.messages).toHaveLength(2);
  });
  it('clears pending replies as well as messages when confirmed', () => {
    const {store}=renderWithProviders(<><PocketPalPage /><ConfirmDialog /></>, {preloadedState:palState});
    fireEvent.click(screen.getByRole('button',{name:'What is my current balance?'}));
    fireEvent.click(screen.getByRole('button',{name:'Clear conversation'}));
    fireEvent.click(screen.getByRole('button',{name:'Clear Chat'}));
    act(() => vi.advanceTimersByTime(500));
    expect(store.getState().pocketPal.messages).toHaveLength(0);
    expect(screen.getByLabelText('Ask Pocket Pal a question')).not.toBeDisabled();
  });
});

