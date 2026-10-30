import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addPersonalChallenge, toggleChallenge, claimXP } from '../features/challenges/challengesSlice';
import { challengeTemplates, personalChallengeError, personalProgress } from '../utils/personalChallenges';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/dates';

const empty = { name: '', type: 'spending', category: 'All', target: '', days: 7 };
export default function PersonalChallenges({ now, onNotice }) {
  const dispatch = useDispatch();
  const challenges = useSelector(s => s.challenges);
  const transactions = useSelector(s => s.transactions);
  const goals = useSelector(s => s.goals);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const update = (key, value) => setDraft(d => ({ ...d, [key]: value }));
  const categories = [...new Set(['Food', 'Shopping', 'Transport', 'Entertainment', 'Bills', 'Other', ...transactions.filter(t => t.type === 'expense').map(t => t.category)])];
  const describe = c => c.type === 'spending' ? `Keep ${c.category === 'All' ? 'total' : c.category.toLowerCase()} spending within ${formatINR(c.target)}.` : c.type === 'savings' ? `Contribute ${formatINR(c.target)} to your goals.` : `Confirm ${c.target} no-spend days. They need not be consecutive.`;
  return <section className="personal-challenges">
    <div className="challenge-section-head"><div><span className="eyebrow">Make it your own</span><h2>Explore more challenges</h2><p>Choose a starting point or build a challenge around your habits.</p></div><button className="primary-button" onClick={() => { setDraft({ ...empty }); setError(''); }}>Create your own</button></div>
    <div className="challenge-template-grid">{challengeTemplates.map(t => <article className="paper-panel" key={t.name}><h3>{t.name}</h3><p>{describe(t)}</p><small>{t.days} days · 100 XP</small><button className="text-button" onClick={() => { setDraft({ ...t }); setError(''); }}>Customize & start →</button></article>)}</div>
    {draft && <form className="paper-panel personal-challenge-form" aria-label="Create a challenge" onSubmit={e => {
      e.preventDefault(); const data = { ...draft, category: draft.category || 'All', target: Number(draft.target), days: Number(draft.days) };
      const problem = personalChallengeError(data); if (problem) { setError(problem); return; }
      dispatch(addPersonalChallenge(data)); setDraft(null); setError(''); onNotice(`${data.name.trim()} started. Your challenge is saved.`);
    }}>
      <h3>Create your challenge</h3><p>Starts today. Records from today onward count. Each challenge earns 100 XP once.</p>
      <div className="personal-challenge-fields">
        <label>Challenge name<input autoFocus required maxLength={60} value={draft.name} onChange={e => update('name', e.target.value)} placeholder="e.g. My mindful month" /></label>
        <label>Track<select value={draft.type} onChange={e => update('type', e.target.value)}><option value="spending">Spending limit</option><option value="savings">Goal contributions</option><option value="no-spend">No-spend days</option></select></label>
        {draft.type === 'spending' && <label>Expense category<select value={draft.category || 'All'} onChange={e => update('category', e.target.value)}><option value="All">All expenses</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label>}
        <label>{draft.type === 'no-spend' ? 'Target days' : draft.type === 'spending' ? 'Spending limit (₹)' : 'Contribution target (₹)'}<input type="number" required min={draft.type === 'no-spend' ? 1 : 0.01} step={draft.type === 'no-spend' ? 1 : 0.01} value={draft.target} onChange={e => update('target', e.target.value)} /></label>
        <label>Duration (days)<input type="number" required min="1" max="365" step="1" value={draft.days} onChange={e => update('days', e.target.value)} /></label>
      </div>
      <p>{draft.type === 'spending' ? 'Claim after the period ends, once all expenses are recorded.' : draft.type === 'savings' ? 'Only recorded goal contributions count; existing balances do not.' : 'Use the check-ins above. Days with recorded expenses do not count.'}</p>
      {error && <p role="alert">{error}</p>}<div className="challenge-card-actions"><button type="submit" className="primary-button">Start challenge</button><button type="button" className="text-button" onClick={() => setDraft(null)}>Cancel</button></div>
    </form>}
    {(challenges.personalChallenges || []).length > 0 && <><h2 className="personal-challenge-heading">Your personal challenges</h2><div className="challenge-cards">{challenges.personalChallenges.map(c => {
      const p = personalProgress(c, transactions, goals, challenges.confirmedDays, now);
      const complete = challenges.claimedXP[`${c.id}_${c.start}`];
      const active = challenges.activeChallenges.includes(c.id);
      const amount = value => c.type === 'no-spend' ? `${value} days` : formatINR(value);
      const percent = Math.max(0, Math.min(100, p.value / c.target * 100));
      return <article className={`challenge-card ${complete ? 'challenge-completed' : ''}`} key={c.id}>
        <div className="challenge-card-top"><h3>{c.name}</h3><span className="challenge-status">{complete ? 'Completed' : !active ? 'Paused' : p.passed ? 'Ready to claim' : p.closed ? 'Not achieved' : c.type === 'spending' && p.value > c.target ? 'Over limit' : 'Active'}</span></div>
        <p>{describe(c)}</p><p>{formatDate(c.start)} – {formatDate(c.end)}</p>
        <div className="progress-line" role="progressbar" aria-label={`${c.name} progress`} aria-valuenow={Math.round(percent)} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${percent}%` }} /></div>
        <strong>{amount(p.value)} / {amount(c.target)}</strong>
        <p>{c.type === 'spending' ? 'Expenses count throughout the period. Confirm all entries before claiming at the end.' : c.type === 'savings' ? 'Progress follows recorded goal contributions.' : 'Only confirmed, expense-free days count.'}</p>
        <div className="challenge-card-actions">{complete ? <span>✓ +100 XP earned</span> : <><button className="text-button" onClick={() => dispatch(toggleChallenge(c.id))}>{active ? 'Pause' : 'Resume'}</button>{active && p.passed ? <button className="primary-button" onClick={() => { dispatch(claimXP({ challengeId: c.id, periodKey: c.start, achievement: { name: c.name, xp: 100, period: c.start, completedAt: new Date().toISOString() } })); onNotice(`${c.name} completed. +100 XP earned.`); }}>{c.type === 'spending' ? 'Entries complete · Claim +100 XP' : 'Claim +100 XP'}</button> : <small>Reward · 100 XP</small>}</>}</div>
      </article>;
    })}</div></>}
  </section>;
}
