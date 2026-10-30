import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { toggleChallenge, claimXP, setChallengeTarget, confirmNoSpend, undoNoSpend, startPurchasePause } from '../features/challenges/challengesSlice';
import Header from '../components/shared/Header';
import PersonalChallenges from '../components/PersonalChallenges';
import { formatINR } from '../utils/currency';
import { formatDate, getLocalDateString, parseLocalDate } from '../utils/dates';
import { challengeRewards, challengeNames, confirmedStreak, evaluateChallengePeriods, pauseProgress, achievementHistory, shiftDate } from '../utils/challengeProgress';

function TargetForm({ challenge, locked, onSave }) {
  const [value, setValue] = useState(String(challenge.target));
  const [error, setError] = useState('');
  return <form className="challenge-target" onSubmit={e => {
    e.preventDefault();
    if (!Number.isFinite(Number(value)) || Number(value) <= 0) { setError('Enter an amount greater than ₹0.'); return; }
    onSave(Number(value)); setError('');
  }}>
    <label htmlFor={`${challenge.id}-target`}>{challenge.id === 'weekly-food' ? 'Weekly food limit (₹)' : 'Monthly savings target (₹)'}</label>
    <div><input id={`${challenge.id}-target`} type="number" min="0.01" step="0.01" value={value} disabled={locked} onChange={e => setValue(e.target.value)} required /><button type="submit" className="text-button" disabled={locked}>Save target</button></div>
    {error && <p role="alert">{error}</p>}
  </form>;
}
function Progress({ value, target, label }) {
  const percent = Math.max(0, Math.min(100, Math.round(value / target * 100)));
  return <div className="progress-line" role="progressbar" aria-label={label} aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${percent}%` }} /></div>;
}

export function ChallengesPage() {
  const dispatch = useDispatch();
  const challenges = useSelector(s => s.challenges);
  const transactions = useSelector(s => s.transactions);
  const goals = useSelector(s => s.goals);
  const vault = useSelector(s => s.vault);
  const [now, setNow] = useState(() => new Date());
  const [previous, setPrevious] = useState(false);
  const [itemId, setItemId] = useState('');
  const [days, setDays] = useState('3');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  const today = getLocalDateString(now);
  const yesterday = getLocalDateString(shiftDate(now, -1));
  const active = challenges.activeChallenges || [];
  const claimed = challenges.claimedXP || {};
  const history = achievementHistory(challenges);
  const periods = evaluateChallengePeriods(transactions, goals, challenges, now, previous);
  const streak = confirmedStreak(transactions, challenges.confirmedDays, now);
  const pauses = Object.values(challenges.purchasePauses || {});
  const availableItems = vault.filter(item => !challenges.purchasePauses?.[item.id]);
  const recordAchievement = (id, period, extra = {}) => {
    dispatch(claimXP({ challengeId: id, periodKey: period, achievement: {
      name: challengeNames[id], xp: challengeRewards[id], period, completedAt: new Date().toISOString(), ...extra
    }}));
    setNotice(`${challengeNames[id]} completed. +${challengeRewards[id]} XP earned.`);
  };
  return <div className="page-wrap challenges-page">
    <Header eyebrow="Improve · tiny wins" title="Budget Battle" sub="Build money habits, one deliberate choice at a time." />
    <div className="challenge-summary" aria-label="Challenge summary">
      <div><strong>{history.reduce((sum, h) => sum + h.xp, 0)}</strong><span>Total XP</span></div>
      <div><strong>{history.length}</strong><span>Achievements</span></div>
      <div><strong>{Object.values(evaluateChallengePeriods(transactions, goals, challenges, now)).filter(c => active.includes(c.id) && !claimed[c.key]).length + (challenges.personalChallenges || []).filter(c => active.includes(c.id) && !claimed[`${c.id}_${c.start}`] && today <= c.end).length + pauses.filter(p => !claimed[`purchase-pause_${p.itemId}`] && vault.some(v => v.id === p.itemId)).length}</strong><span>Active challenges</span></div>
    </div>
    {notice && <div className="challenge-celebration" role="status" key={notice}>✓ {notice}</div>}

    <section className="dark-box challenge-streak">
      <div><span className="eyebrow">Confirmed no-spend days</span><h2>{streak} {streak === 1 ? 'day' : 'days'} in your streak.</h2>
        <p>Confirm a day after you’ve finished spending. Only confirmed days without recorded expenses count. An unconfirmed day breaks the streak; today can stay pending until evening.</p>
        <div className="challenge-checkins">{[yesterday, today].map(date => {
          const spent = transactions.some(t => t.type === 'expense' && t.date.slice(0,10) === date);
          const checked = (challenges.confirmedDays || []).includes(date);
          return <div key={date}><span>{date === today ? 'Today' : 'Yesterday'} · {formatDate(date)}</span>
            {spent ? <span>Expense recorded — not a no-spend day.</span> : <button type="button" className="text-button" onClick={() => dispatch(checked ? undoNoSpend(date) : confirmNoSpend(date))}>{checked ? 'Confirmed ✓ · Undo' : 'Confirm no spending'}</button>}
          </div>;
        })}</div>
      </div><div className="streak-circle" aria-label={`${streak} confirmed days`}><strong>{streak}</strong><span>days</span></div>
    </section>

    <div className="challenge-section-head"><div><h2>Your challenges</h2><p>Targets apply to the selected period. Pausing hides reward actions; recorded spending and savings still count.</p></div>
      <label>Review period <select value={previous ? 'previous' : 'current'} onChange={e => setPrevious(e.target.value === 'previous')}><option value="current">This week / month</option><option value="previous">Last week / month</option></select></label>
    </div>
    <div className="challenge-cards">{Object.values(periods).map(c => {
      const isFood = c.id === 'weekly-food';
      const joined = active.includes(c.id);
      const completed = Boolean(claimed[c.key]);
      const closed = today > c.end;
      const over = isFood && c.value > c.target;
      const status = completed ? 'Completed' : !joined ? 'Paused' : c.passed ? 'Ready to claim' : closed ? 'Not achieved' : over ? 'Over limit' : 'Active';
      const daysLeft = Math.max(0, Math.round((parseLocalDate(c.end) - parseLocalDate(today)) / 86400000));
      return <section className={`challenge-card ${completed ? 'challenge-completed' : ''}`} key={c.key}>
        <div className="challenge-card-top"><span className="eyebrow">{challengeNames[c.id]}</span><span className={`challenge-status ${over && !completed ? 'is-over' : ''}`}>{status}</span></div>
        <h3>{isFood ? `Keep food spending within ${formatINR(c.target)}.` : `Put ${formatINR(c.target)} toward your goals.`}</h3>
        <p>{formatDate(c.start)} – {formatDate(c.end)} · {closed ? 'Period ended' : daysLeft === 0 ? 'Ends today' : `${daysLeft} days left`}</p>
        <Progress value={c.value} target={c.target} label={`${challengeNames[c.id]} progress`} />
        <div className="challenge-metrics"><strong>{formatINR(c.value)} / {formatINR(c.target)}</strong><span>{isFood ? over ? `${formatINR(c.value-c.target)} over limit` : `${formatINR(c.target-c.value)} left to spend` : `${formatINR(Math.max(0,c.target-c.value))} left to save`}</span></div>
        <TargetForm key={`${c.key}-${c.target}`} challenge={c} locked={completed || closed} onSave={value => { dispatch(setChallengeTarget({ key: c.key, value })); setNotice('Target updated for this period.'); }} />
        <p>{isFood ? 'Rewards unlock after the week ends. Confirm your food entries are complete before claiming.' : 'Progress comes from recorded goal contributions, not your wallet balance.'}</p>
        <div className="challenge-card-actions">
          <Link className="text-button" to={isFood ? '/transactions?category=Food' : '/goals'}>{isFood ? 'View food expenses →' : 'Contribute to a goal →'}</Link>
          {!completed && <button type="button" className="text-button" onClick={() => dispatch(toggleChallenge(c.id))}>{joined ? 'Pause' : 'Join'}</button>}
        </div>
        {completed ? <p className="challenge-earned">✓ +{challengeRewards[c.id]} XP earned</p> : joined && c.passed ? <button type="button" className="primary-button" onClick={() => recordAchievement(c.id, c.period, { target: c.target, value: c.value })}>{isFood ? 'Entries complete · Claim' : 'Claim'} +{challengeRewards[c.id]} XP</button> : <small>Reward · {challengeRewards[c.id]} XP</small>}
      </section>;
    })}</div>

    <PersonalChallenges now={now} onNotice={setNotice} />
    <section className="paper-panel purchase-pause-panel">
      <span className="eyebrow">Purchase Pause · 100 XP</span><h2>Let a want wait.</h2><p>Choose an item in Want Vault and a waiting period. The clock starts when you begin; keep it in the vault until the time is up. Each item can earn this reward once.</p>
      {availableItems.length ? <form className="pause-start" onSubmit={e => {
        e.preventDefault(); const item = availableItems.find(v => v.id === itemId); if (!item) return;
        dispatch(startPurchasePause({ itemId: item.id, name: item.name, days: Number(days), startedAt: new Date().toISOString() })); setItemId(''); setNotice('Your purchase pause has started.');
      }}><label>Want Vault item<select required value={itemId} onChange={e => setItemId(e.target.value)}><option value="">Choose a saved want</option>{availableItems.map(item => <option key={item.id} value={item.id}>{item.name} · {formatINR(item.amount)}</option>)}</select></label>
      <label>Wait for<select value={days} onChange={e => setDays(e.target.value)}>{[1,3,7,14,30].map(n => <option key={n} value={n}>{n} {n === 1 ? 'day' : 'days'}</option>)}</select></label><button type="submit" className="primary-button">Start waiting</button></form> : <p>No unstarted items available. Save a new want to begin.</p>}
      <Link to="/vault" className="text-button">Open Want Vault →</Link>
      <div className="purchase-pause-list">{pauses.map(p => {
        const progress = pauseProgress(p, vault, now); const complete = claimed[`purchase-pause_${p.itemId}`];
        return <article key={p.itemId}><div className="challenge-card-top"><h3>{p.name}</h3><span className="challenge-status">{complete ? 'Completed' : !progress.exists ? 'Item removed' : progress.passed ? 'Ready to reconsider' : 'Waiting'}</span></div>
          <Progress value={Math.min(progress.elapsed,p.days)} target={p.days} label={`${p.name} waiting progress`} />
          <p>{complete ? '✓ +100 XP earned' : !progress.exists ? 'This item is no longer in Want Vault, so it cannot earn a reward.' : progress.passed ? `Your ${p.days}-day wait is complete.` : `${progress.remaining} ${progress.remaining === 1 ? 'day' : 'days'} remaining · Started ${formatDate(p.startedAt)}`}</p>
          {!complete && progress.passed && <button type="button" className="primary-button" onClick={() => recordAchievement('purchase-pause', p.itemId, { name: `Purchase Pause · ${p.name}`, days: p.days })}>Claim +100 XP</button>}
        </article>;
      })}</div>
    </section>
    <section className="paper-panel challenge-history"><span className="eyebrow">Your progress, remembered</span><h2>Achievement history</h2>
      <p>XP is a personal milestone, not a cash reward. Past achievements stay in your history when records change.</p>
      {history.length ? <ul>{history.map(h => <li key={h.key}><div><strong>{h.name}</strong><span>{h.completedAt ? `Earned ${formatDate(h.completedAt)}` : `Previously claimed · ${h.period}`}{h.target ? ` · Target ${formatINR(h.target)}` : ''}</span></div><b>+{h.xp} XP</b></li>)}</ul> : <p>Complete a challenge and claim its reward to start your history.</p>}
    </section>
  </div>;
}
export default ChallengesPage;

