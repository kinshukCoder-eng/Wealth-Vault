import React, { useState, useMemo, useEffect, useRef } from "react";
import "./index.css";
import { demoState, categories, money } from "./data/demoData";
import { derive } from "./utils/calculations";

const nav = [
  ["home", "Home", "bi-house"],
  ["dashboard", "Dashboard", "bi-grid-1x2"],
  ["transactions", "Transactions", "bi-receipt"],
  ["insights", "Insights", "bi-graph-up-arrow"],
  ["goals", "Goals", "bi-bullseye"],
  ["tools", "Smart Tools", "bi-sliders"],
  ["vault", "Want Vault", "bi-box"],
  ["challenges", "Challenges", "bi-trophy"],
  ["pal", "Pocket Pal", "bi-chat-left-text"],
];

const fresh = () => JSON.parse(JSON.stringify(demoState));

function App() {
  const [state, setState] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("wealth-vault-state-v1"));
      return stored ? { ...fresh(), ...stored } : fresh();
    } catch {
      return fresh();
    }
  });

  const [theme, setTheme] = useState(
    () => localStorage.getItem("wealth-vault-theme") || "light"
  );
  const [page, setPage] = useState(
    () => localStorage.getItem("wealth-vault-page") || "home"
  );
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const stats = useMemo(() => derive(state.transactions), [state.transactions]);

  useEffect(() => localStorage.setItem("wealth-vault-state-v1", JSON.stringify(state)), [state]);
  useEffect(() => localStorage.setItem("wealth-vault-theme", theme), [theme]);
  useEffect(() => localStorage.setItem("wealth-vault-page", page), [page]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    return () => document.documentElement.removeAttribute("data-theme");
  }, [theme]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [page]);

  const go = (next) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveTransaction = (item) => {
    setState((s) => ({
      ...s,
      transactions: editing
        ? s.transactions.map((t) => (t.id === editing.id ? { ...item, id: editing.id } : t))
        : [{ ...item, id: `t${Date.now()}` }, ...s.transactions],
    }));
    setModal(false);
    setEditing(null);
  };

  const remove = (id) =>
    setState((s) => ({
      ...s,
      transactions: s.transactions.filter((t) => t.id !== id),
    }));

  return (
    <div className="app-shell" data-theme={theme}>
      <header className="topbar">
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <i className={`bi ${isMenuOpen ? 'bi-x' : 'bi-list'}`}></i>
          </button>
          <button className="brand" onClick={() => { go("home"); setIsMenuOpen(false); }}>
            <div className="brand-mark" style={{background: '#f8a849', color: 'white', overflow: 'hidden'}}><i className="bi bi-wallet2" style={{fontSize: '1rem'}}></i></div>
            <span>
              Wealth Vault<small>your money, decoded</small>
            </span>
          </button>
        </div>
        <nav className={`desktop-nav ${isMenuOpen ? "open" : ""}`}>
          {nav.map(([id, label, icon]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => { go(id); setIsMenuOpen(false); }}
            >
              <i className={`bi ${icon}`}></i>
              {label}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <button
            className="theme-toggle"
            onClick={() => setTheme((c) => (c === "light" ? "dark" : "light"))}
          >
            <i className={`bi ${theme === "light" ? "bi-moon" : "bi-sun"}`}></i>
            <span>{theme === "light" ? "Dark" : "Light"}</span>
          </button>
          <button className="add-button" onClick={() => setModal(true)}>
            <i className="bi bi-plus"></i> <span>Add</span>
          </button>
        </div>
      </header>
      <main>
        {page === "home" && <Home stats={stats} go={go} />}
        {page === "dashboard" && <Dashboard stats={stats} state={state} go={go} />}
        {page === "transactions" && (
          <Transactions
            stats={stats}
            state={state}
            setState={setState}
            setModal={setModal}
            setEditing={setEditing}
            remove={remove}
          />
        )}
        {page === "insights" && <Insights stats={stats} />}
        {page === "goals" && <Goals state={state} setState={setState} />}
        {page === "tools" && <Tools stats={stats} />}
        {page === "vault" && <WantVault state={state} setState={setState} />}
        {page === "challenges" && <Challenges />}
        {page === "pal" && <PocketPal stats={stats} />}
      </main>
      {modal && (
        <TransactionModal
          initial={editing}
          onClose={() => {
            setModal(false);
            setEditing(null);
          }}
          onSave={saveTransaction}
        />
      )}
    </div>
  );
}

export default App;

const Header = ({ eyebrow, title, sub }) => (
  <div className="page-heading reveal">
    <span className="eyebrow">{eyebrow}</span>
    <h1>{title}</h1>
    {sub && <p>{sub}</p>}
  </div>
);

const MoneyPulse = ({ stats }) => (
  <section className="pulse-panel reveal">
    <div>
      <span className="eyebrow">Financial forecast · This Month</span>
      <h2>
        MoneyPulse <span className="pulse-dot"></span>
      </h2>
      <p>Your wallet is finding its rhythm. You're 18% under<br />projected spending.</p>
      <div className="pulse-detail">
        <b>+7 pts</b>
        <span>since last month</span>
      </div>
    </div>
    <div className="score-ring" style={{ "--score": `${75 * 3.6}deg` }}>
      <div>
        <strong>75</strong>
        <span>/ 100</span>
      </div>
    </div>
  </section>
);

function Home({ stats, go }) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy reveal">
          <span className="eyebrow">Student money companion · 01</span>
          <h1>
            Your money<br/>
            has<br />
            <em>a story.</em><br />
            Let’s<br/>
            understand<br/>
            it.
          </h1>
          <p>
            Track your spending, predict your future, and make smarter money
            decisions without making budgeting boring.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => go("dashboard")}>
              Start tracking ↗
            </button>
            <button className="text-button" onClick={() => go("insights")}>
              Explore the story ↓
            </button>
          </div>
        </div>
        <div className="hero-visual reveal">
          <div className="weather-note-home">
            <span>WALLET WEATHER</span>
            <br/><br/>
            <span>...</span>
            <br/><br/>
            <span style={{float: 'right'}}>ecast</span>
          </div>
          <div className="receipt-card-home">
            <div className="receipt-top">
              <span>WEALTH VAULT / 03</span>
              <i className="bi bi-three-dots"></i>
            </div>
            <div className="receipt-balance">
              ₹ 1,580
              <small>current balance</small>
            </div>
            <div className="mini-bars-home">
              <span className="handwriting">small steps<br/>count ↑</span>
              <i style={{ height: "40%" }}></i>
              <i style={{ height: "70%" }}></i>
              <i style={{ height: "55%" }}></i>
              <i style={{ height: "85%" }}></i>
              <i style={{ height: "62%" }}></i>
              <i style={{ height: "100%" }}></i>
            </div>
            <div className="receipt-line">
              <span>THIS MONTH</span>
              <b>₹15,420 spent</b>
            </div>
          </div>
        </div>
      </section>

      <div className="home-steps reveal">
        <div className="home-step">
          <span>01</span>
          <h3>Track</h3>
          <p>See every rupee without the guilt.</p>
        </div>
        <div className="home-step">
          <span>02</span>
          <h3>Understand</h3>
          <p>Find patterns hiding in plain sight.</p>
        </div>
        <div className="home-step">
          <span>03</span>
          <h3>Improve</h3>
          <p>Make one better decision at a time.</p>
        </div>
      </div>

      <div className="home-bottom reveal">
        <div>
          <span className="eyebrow" style={{letterSpacing: '2px'}}>A calmer way to budget</span>
          <h2 style={{fontSize: '3rem', lineHeight: '1.1'}}>Clarity feels better<br/><em>than control.</em></h2>
        </div>
        <MoneyPulse stats={stats} />
      </div>
    </>
  );
}

function Dashboard({ stats, state, go }) {
  const recent = state.transactions.filter((t) => t.type === "expense").slice(0, 4);
  return (
    <div className="page-wrap">
      <Header
        eyebrow="Tuesday, 24 March 2026"
        title="Good afternoon, Arjun 👋"
        sub="Here’s what your wallet is doing today."
      />
      <div className="stats-grid reveal">
        <div className="stat-block">
          <span>Current balance</span>
          <strong>₹ 1,580</strong>
        </div>
        <div className="stat-block">
          <span>Monthly income</span>
          <strong>₹20,000</strong>
        </div>
        <div className="stat-block">
          <span>Monthly spending</span>
          <strong>₹15,120</strong>
        </div>
        <div className="stat-block">
          <span>Left to plan</span>
          <strong>₹0</strong>
        </div>
      </div>
      <MoneyPulse stats={stats} />
      
      <div className="row g-4 mt-1">
        <div className="col-lg-8">
          <section className="paper-panel reveal">
            <div className="panel-head">
              <span className="eyebrow">Spending pulse</span>
              <h2>This month, by category</h2>
              <span className="eyebrow" style={{color: 'var(--accent-primary)', textTransform:'none', letterSpacing:'normal'}}>the pattern is looking good</span>
            </div>
            <div className="bar-chart">
              {[
                ["Bills", 5280],
                ["Food", 3800],
                ["Transport", 990],
                ["Education", 2000],
                ["Subscription", 600],
                ["Shopping", 2400],
                ["Entertainment", 520]
              ].map(([key, value]) => (
                <div key={key} className="bar-row">
                  <span>{key}</span>
                  <div>
                    <i style={{ width: `${Math.min(100, (value / 5280) * 100)}%` }}></i>
                  </div>
                  <b>₹{value.toLocaleString('en-IN')}</b>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="col-lg-4">
          <section className="weather-panel reveal">
            <span className="eyebrow">Wallet weather</span>
            <div className="weather-icon">☀️</div>
            <h2>Sunny.</h2>
            <p>You’re currently 18% under your projected monthly spending.</p>
            <button className="text-button" style={{color:'#1a232c'}} onClick={() => go("insights")}>
              Read the forecast ↗
            </button>
          </section>
        </div>
      </div>
      
      <section className="paper-panel reveal recent-panel mt-4">
        <div className="panel-head" style={{borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '0'}}>
          <h2 style={{fontSize: '1.5rem'}}>Recent receipts</h2>
          <button className="text-button" style={{fontSize: '0.8rem'}} onClick={() => go("transactions")}>
            View ledger →
          </button>
        </div>
        <div className="recent-receipts-list">
          {recent.map((t) => (
            <div key={t.id} className="receipt-row">
              <span className="category-icon">
                <i className="bi bi-bag"></i>
              </span>
              <div>
                <strong>{t.title}</strong>
                <small>{t.category} · {t.date}</small>
              </div>
              <b>−₹{t.amount.toLocaleString('en-IN')}</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Transactions({ stats, state, setState, setModal, setEditing, remove }) {
  return (
    <div className="page-wrap">
      <Header
        eyebrow="Your ledger · local only"
        title="Every rupee has a receipt."
        sub="A clear, private record of where your month is going."
      />
      <div className="ledger-toolbar reveal">
        <div className="search-box">
          <i className="bi bi-search"></i>
          <input placeholder="Search receipts" />
        </div>
        <select><option>All</option></select>
        <select><option>Newest</option></select>
        <select><option>dd-mm-yyyy</option></select>
        <button className="primary-button" onClick={() => { setEditing(null); setModal(true); }}>
          + Add transaction
        </button>
        <button className="text-button">Reset demo</button>
      </div>
      <section className="ledger reveal">
        <div className="ledger-summary">
          <span>10 receipts shown</span>
          <strong>₹15,120 <small style={{fontSize: '0.65rem', fontFamily:'var(--font-mono)'}}>spent this month</small></strong>
        </div>
        {[
          ["Coffee runs", "Food", "2026-03-18", 1570, "expense"],
          ["Movie night", "Entertainment", "2026-03-16", 520, "expense"],
          ["Sneakers", "Shopping", "2026-03-14", 2400, "expense"],
          ["Streaming stack", "Subscription", "2026-03-11", 600, "expense"],
          ["Food delivery", "Food", "2026-03-10", 700, "expense"],
          ["Design course", "Education", "2026-03-08", 2000, "expense"],
          ["Metro card", "Transport", "2026-03-05", 990, "expense"],
          ["Groceries", "Food", "2026-03-04", 1450, "expense"],
          ["Hostel + utilities", "Bills", "2026-03-02", 5280, "expense"],
          ["Campus stipend", "Income", "2026-03-01", 20000, "income"]
        ].map(([title, cat, date, amt, type], i) => (
          <div key={i} className="ledger-item">
            <span className="category-icon" style={type === 'income' ? {background:'#dcfce7', color:'#166534'} : {background:'#fce7e7', color:'var(--accent-primary)'}}>
              <i className={`bi ${type === 'income' ? 'bi-check2' : 'bi-arrow-up-right'}`}></i>
            </span>
            <div className="ledger-main">
              <strong>{title}</strong>
              <small>{cat} · {date}</small>
            </div>
            <b style={type === 'income' ? {color: '#166534'} : {}}>{type === 'income' ? '+' : '-'}₹{amt.toLocaleString('en-IN')}</b>
            <i className="bi bi-pencil" style={{color:'var(--text-secondary)'}}></i>
            <i className="bi bi-trash3" style={{color:'var(--text-secondary)'}}></i>
          </div>
        ))}
      </section>
    </div>
  );
}

function Insights({ stats }) {
  return (
    <div className="page-wrap">
      <Header
        eyebrow="Understand · patterns, not guilt"
        title="The story behind your spending."
        sub="A few signals worth noticing this month."
      />
      <div className="insight-lead reveal">
        <span className="insight-number">01</span>
        <div>
          <span className="eyebrow">Money Detective</span>
          <h2>You spent ₹15,120 this month.</h2>
          <p>Bills is your biggest category at ₹5,280. That’s the clearest place to experiment gently next month.</p>
        </div>
        <span className="annotation">look closer →</span>
      </div>
      <div className="insights-row reveal">
        <div className="insight-card">
          <div className="insight-icon"><i className="bi bi-droplet"></i></div>
          <span className="eyebrow">Signal detected</span>
          <h2>Money Leaks</h2>
          <p>Small purchases are quietly adding up. Your coffee and delivery runs make up 24% of food spending.</p>
          <button className="text-button" style={{fontSize: '0.75rem'}}>See the receipts ↗</button>
        </div>
        <div className="insight-card">
          <div className="insight-icon"><i className="bi bi-radar"></i></div>
          <span className="eyebrow">Signal detected</span>
          <h2>Impulse Radar</h2>
          <p>Weekend spending is 2.3× higher than weekdays. Try a 24-hour pause before the next big want.</p>
          <button className="text-button" style={{fontSize: '0.75rem'}}>See the receipts ↗</button>
        </div>
      </div>
      
      <div className="month-predictor reveal">
        <div className="predictor-head">
          <div>
            <span className="eyebrow">Month predictor</span>
            <h3>Where the month is headed</h3>
          </div>
          <span className="forecast-chip">Forecast · ₹23,130</span>
        </div>
        <div className="predict-cols">
          <div className="predict-col">
            <small>Current</small>
            <strong>₹15,120</strong>
          </div>
          <div>→</div>
          <div className="predict-col">
            <small>Projected</small>
            <strong style={{color:'var(--accent-primary)'}}>₹23,130</strong>
          </div>
          <div className="predict-col">
            <small>Budget</small>
            <strong>₹12,000</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function Goals({ state, setState }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");

  const goals = state.goals || [];

  const handleAddGoal = () => {
    const trimmedName = name.trim();
    const numericTarget = Number(target);

    if (!trimmedName || !numericTarget || numericTarget <= 0) {
      return;
    }

    const newGoal = {
      id: `g${Date.now()}`,
      name: trimmedName,
      target: numericTarget,
      saved: 0,
      monthly: 0,
      emoji: "◌",
    };

    setState((s) => ({
      ...s,
      goals: [newGoal, ...(s.goals || [])],
    }));

    setName("");
    setTarget("");
  };

  const deleteGoal = (id) => {
  setState((s) => ({
    ...s,
    goals: (s.goals || []).filter((goal) => goal.id !== id),
  }));
  };

  const calculateProgress = (goal) => {
    if (!goal.target) return 0;

    return Math.min(
      100,
      Math.round((Number(goal.saved || 0) / Number(goal.target)) * 100)
    );
  };

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("en-IN");
  };

  const getGoalMessage = (goal) => {
    const saved = Number(goal.saved || 0);
    const monthly = Number(goal.monthly || 0);
    const target = Number(goal.target || 0);

    if (saved >= target) {
      return "You've reached this goal. Future you says thank you.";
    }

    if (monthly > 0) {
      const remaining = target - saved;
      const months = Math.ceil(remaining / monthly);

      return `At your current saving rate, you could get there in approximately ${months} months.`;
    }

    return "Every saved rupee brings this a little closer.";
  };

  return (
    <div className="page-wrap">
      <Header
        eyebrow="Improve · future you"
        title="Give your next chapter a number."
        sub="Goals turn a vague wish into a gentle monthly plan."
      />

      <div className="row g-4">
        <div className="col-lg-8">
          {goals.map((goal) => {
  const progress = calculateProgress(goal);

  return (
    <section
      className="goal-card reveal"
      key={goal.id}
      style={{ marginBottom: "1rem" }}
    >
      <div className="goal-symbol">
        {goal.emoji || "◌"}
      </div>

      <div className="goal-copy" style={{ flex: 1 }}>
        <span className="eyebrow">
          Target · ₹{formatMoney(goal.target)}
        </span>

        <h2>{goal.name}</h2>

        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
          }}
        >
          {getGoalMessage(goal)}
        </p>

        <div className="progress-line">
          <i style={{ width: `${progress}%` }}></i>
        </div>

        <div className="goal-meta">
          <b>₹{formatMoney(goal.saved)} saved</b>
          <span>{progress}% complete</span>
        </div>
      </div>

      <div className="goal-actions">
        <button
          className="goal-remove"
          onClick={() => deleteGoal(goal.id)}
        >
          Remove ×
        </button>
      </div>
    </section>
  );
  })}
        </div>

        <div className="col-lg-4">
          <section className="goal-form-box reveal">
            <span className="eyebrow">New intention</span>

            <h2
              style={{
                fontSize: "1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              What are you saving for?
            </h2>

            <input
              type="text"
              placeholder="e.g. A new laptop"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="number"
              min="1"
              placeholder="50000"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />

            <button
              className="primary-button"
              style={{
                width: "100%",
                justifyContent: "center",
              }}
              onClick={handleAddGoal}
              disabled={!name.trim() || !target || Number(target) <= 0}
            >
              Add goal ↗
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function WantVault({ state, setState }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const vaultItems = state.vault || [];

  const handleSave = () => {
    const trimmedName = name.trim();
    const numericAmount = Number(amount);

    // Don't create an incomplete vault item.
    if (!trimmedName || !numericAmount || numericAmount <= 0) {
      return;
    }

    const newItem = {
      id: `v${Date.now()}`,
      name: trimmedName,
      amount: numericAmount,
      date: new Date().toISOString(),
    };

    setState((s) => ({
      ...s,
      vault: [newItem, ...(s.vault || [])],
    }));

    // Clear the form after saving.
    setName("");
    setAmount("");
  };

  const deleteVaultItem = (id) => {
    setState((s) => ({
      ...s,
      vault: (s.vault || []).filter((item) => item.id !== id),
    }));
  };

  const calculateDays = (dateStr) => {
    const diffTime = Math.abs(new Date() - new Date(dateStr));
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
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
          {vaultItems.length === 0 && (
            <p style={{ color: "var(--text-secondary)" }}>
              Your vault is empty. Save a want you're eyeing to let it cool
              off before buying.
            </p>
          )}

          {vaultItems.map((item) => (
            <div
              key={item.id}
              className="vault-item reveal"
              style={{ marginBottom: "1rem" }}
            >
              <div>
                <span className="eyebrow">
                  Cooling-off · {calculateDays(item.date)} days
                </span>

                <h2>{item.name}</h2>

                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  Still thinking about it? That's useful information.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "0.5rem",
                }}
              >
                <div className="price">
                  ₹ {Number(item.amount).toLocaleString("en-IN")}
                </div>

                <button
                  onClick={() => deleteVaultItem(item.id)}
                  style={{
                    color: "var(--accent-primary)",
                    fontSize: "0.85rem",
                  }}
                >
                  Remove ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="col-lg-5">
          <section className="goal-form-box reveal">
            <span className="eyebrow">Save a want</span>

            <h2
              style={{
                fontSize: "1.75rem",
                marginBottom: "1.5rem",
              }}
            >
              Put it in the vault.
            </h2>

            <input
              type="text"
              placeholder="What are you eyeing?"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="number"
              min="1"
              placeholder="2000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <button
              className="primary-button mt-2"
              onClick={handleSave}
              disabled={!name.trim() || !amount || Number(amount) <= 0}
            >
              Save to Want Vault
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function Challenges() {
  return (
    <div className="page-wrap">
      <Header
        eyebrow="Improve · tiny wins"
        title="Budget Battle"
        sub="Make the good choice feel a little more visible."
      />
      <div className="dark-box reveal">
        <div>
          <span className="eyebrow">Zero-day streak</span>
          <h2 style={{fontSize:'2.5rem', marginBottom:'1rem'}}>🔥 5 days without an unnecessary spend.</h2>
          <p style={{color:'#9ca3af', fontSize:'0.9rem'}}>Essential expenses don't break your streak.</p>
        </div>
        <div className="streak-circle">
          <strong>5</strong>
          <span>days</span>
        </div>
      </div>
      <div className="challenge-grid reveal">
        <div className="challenge-card">
          <span className="eyebrow" style={{color:'var(--accent-primary)'}}>01 · Food fighter</span>
          <h3>Stay under ₹1,000 this week.</h3>
          <div className="progress-line"><i style={{width:'70%'}}></i></div>
          <div className="goal-meta"><b>₹720 / ₹1,000</b></div>
        </div>
        <div className="challenge-card">
          <span className="eyebrow" style={{color:'var(--accent-primary)'}}>02 · Pocket Protector</span>
          <h3>Save ₹500 this month.</h3>
          <div className="progress-line"><i style={{width:'100%'}}></i></div>
          <div className="goal-meta"><b>+250 XP earned</b></div>
        </div>
      </div>
    </div>
  );
}

function PocketPal({ stats }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { text, sender: "user" }]);
    setInput("");

    setTimeout(() => {
      let botResponse = "I'm still learning! Ask me about your spending, budget, or savings.";
      const lower = text.toLowerCase();
      
      if (lower.includes("where") || lower.includes("most") || lower.includes("go")) {
        const topCategory = Object.entries(stats.categories).sort((a,b) => b[1] - a[1])[0];
        if (topCategory) {
          botResponse = `Most of your money went to ${topCategory[0]} (₹${topCategory[1].toLocaleString('en-IN')}).`;
        } else {
          botResponse = "You haven't spent anything yet!";
        }
      } else if (lower.includes("afford") || lower.includes("can i")) {
        botResponse = `You have ₹${stats.balance.toLocaleString('en-IN')} in your current balance. Your remaining budget is ₹${stats.remaining.toLocaleString('en-IN')}. Depending on your goals, a ₹3,000 purchase might be tight!`;
      } else if (lower.includes("save")) {
        botResponse = `If you stick to your budget, you could save around ₹${(stats.income - stats.budget).toLocaleString('en-IN')} this month.`;
      } else if (lower.includes("balance") || lower.includes("current")) {
        botResponse = `Your current balance is ₹${stats.balance.toLocaleString('en-IN')}.`;
      } else if (lower.includes("too much") || lower.includes("spend")) {
        botResponse = `You have spent ₹${stats.spending.toLocaleString('en-IN')} so far out of your ₹${stats.budget.toLocaleString('en-IN')} budget.`;
      } else if (lower.includes("projected") || lower.includes("forecast")) {
        botResponse = `Based on your current habits, your projected spending is ₹${stats.projected.toLocaleString('en-IN')}.`;
      }

      setMessages(prev => [...prev, { text: botResponse, sender: "bot" }]);
    }, 600);
  };

  return (
    <div className="page-wrap">
      <Header
        eyebrow="Pocket Pal · Your money, decoded"
        title="Ask the question behind the question."
        sub="A structured guide to your own data. Private and local."
      />
      <div className="pal-box reveal mt-4">
        {messages.length === 0 ? (
          <>
            <div className="insight-icon" style={{background:'#1c2127', color:'white', border:'none'}}><i className="bi bi-chat-square-text"></i></div>
            <span className="eyebrow" style={{color:'rgba(0,0,0,0.6)'}}>Pocket Pal says</span>
            <h2>Ask me where your money went, what you can afford, or how to save this month.</h2>
          </>
        ) : (
          <div className="chat-history" style={{marginBottom: '2rem', maxHeight: '400px', overflowY: 'auto'}}>
            {messages.map((msg, i) => (
              <div key={i} style={{marginBottom: '1rem', textAlign: msg.sender === 'user' ? 'right' : 'left'}}>
                <span style={{
                  display: 'inline-block',
                  background: msg.sender === 'user' ? 'var(--accent-primary)' : 'white',
                  color: msg.sender === 'user' ? 'white' : '#1c2127',
                  padding: '0.75rem 1.25rem',
                  borderRadius: msg.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                  border: msg.sender === 'bot' ? '1px solid rgba(0,0,0,0.1)' : 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  maxWidth: '85%',
                  lineHeight: '1.5'
                }}>
                  {msg.text}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
        
        <div className="pal-input-wrap">
          <input 
            placeholder="Type a message..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
          />
          <button className="primary-button" style={{borderRadius:'2px', padding:'0.5rem 1.25rem'}} onClick={() => handleSend(input)}>Ask Pal ↗</button>
        </div>
        
        <div className="pal-tags" style={{flexWrap: 'wrap', marginTop: '1rem'}}>
          <button className="pal-tag" onClick={() => handleSend("Where did most of my money go?")}>Where did most of my money go?</button>
          <button className="pal-tag" onClick={() => handleSend("Can I afford ₹3,000?")}>Can I afford ₹3,000?</button>
          <button className="pal-tag" onClick={() => handleSend("How much can I save?")}>How much can I save?</button>
          <button className="pal-tag" onClick={() => handleSend("What is my current balance?")}>What is my current balance?</button>
          <button className="pal-tag" onClick={() => handleSend("Did I spend too much?")}>Did I spend too much?</button>
          <button className="pal-tag" onClick={() => handleSend("What's my projected spending?")}>What's my projected spending?</button>
        </div>
        <div className="pal-footer mt-4">Pocket Pal is online</div>
      </div>
    </div>
  );
}

function Tools({ stats }) {
  return (
    <div className="page-wrap">
      <Header
        eyebrow="Decide · before you spend"
        title="Try the decision on first."
        sub="A small pause can make the future feel more visible."
      />
      <div className="row g-4 mt-2 reveal">
        <div className="col-lg-6">
          <div className="tool-box">
            <div style={{gridColumn: '1 / -1'}}>
              <span className="eyebrow">Wallet What-If</span>
              <h2>What if I spend ₹3,000?</h2>
              <div className="progress-line"><i style={{width:'30%'}}></i></div>
            </div>
            <div>
              <span className="eyebrow">New balance</span>
              <strong style={{fontSize:'1.5rem', fontFamily:'var(--font-serif)'}}>₹1,580</strong>
            </div>
            <div>
              <span className="eyebrow">Budget impact</span>
              <strong style={{fontSize:'1.5rem', fontFamily:'var(--font-serif)'}}>25%</strong>
            </div>
            <div style={{gridColumn: '1 / -1'}}>
              <span className="eyebrow">Savings impact</span>
              <strong style={{fontSize:'1.5rem', fontFamily:'var(--font-serif)'}}>₹3,000</strong>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="tool-box dark">
            <div style={{gridColumn: '1 / -1'}}>
              <span className="eyebrow">Money → Time</span>
              <h2>What does a purchase cost in hours?</h2>
              <input type="number" defaultValue="100" />
            </div>
            <div style={{gridColumn: '1 / -1'}}>
              <strong style={{fontSize:'2.5rem', fontFamily:'var(--font-serif)', color:'var(--accent-primary)'}}>8.0 hrs</strong>
              <div style={{fontSize:'0.75rem', fontFamily:'var(--font-mono)', color:'#9ca3af', marginTop:'0.5rem'}}>for an ₹800 purchase at ₹100/hour</div>
            </div>
          </div>
        </div>
        <div className="col-lg-12">
          <div className="tool-box green mt-2">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <span className="eyebrow">Spendless</span>
                <h2>Think with your future self.</h2>
                <p style={{fontSize:'0.85rem'}}>If you trim your next food order by ₹400, you preserve that money for your laptop fund. No shame, just information.</p>
              </div>
              <button className="primary-button" style={{background:'var(--accent-primary)'}}>Think again →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionModal({ initial, onClose, onSave }) {
  const [title, setTitle] = useState(initial ? initial.title : "");
  const [amount, setAmount] = useState(initial ? initial.amount : "");
  const [category, setCategory] = useState(initial ? initial.category : categories[0]);
  const [type, setType] = useState(initial ? initial.type : "expense");
  const [date, setDate] = useState(initial ? initial.date : new Date().toISOString().split("T")[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !amount) return;
    onSave({
      title,
      amount: Number(amount),
      category,
      type,
      date,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 style={{fontFamily:'var(--font-serif)', fontSize:'2rem', marginBottom:'2rem'}}>{initial ? "Edit Receipt" : "New Receipt"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What was it for?" required />
          </div>
          <div className="form-group">
            <label>Amount (₹)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="text-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
