import { getLocalDateString, getCurrentWeekRange } from './dates';

export const challengeRewards = { 'weekly-food': 150, 'monthly-savings': 250, 'purchase-pause': 100 };
export const challengeNames = { 'weekly-food': 'Food Fighter', 'monthly-savings': 'Pocket Protector', 'purchase-pause': 'Purchase Pause' };
export function shiftDate(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
export function confirmedStreak(transactions, confirmedDays = [], now = new Date()) {
  const expenses = new Set(transactions.filter(t => t.type === 'expense').map(t => t.date.slice(0, 10)));
  const confirmed = new Set(confirmedDays);
  let cursor = now;
  const today = getLocalDateString(now);
  if (!confirmed.has(today) || expenses.has(today)) cursor = shiftDate(cursor, -1);
  let streak = 0;
  while (confirmed.has(getLocalDateString(cursor)) && !expenses.has(getLocalDateString(cursor))) {
    streak++; cursor = shiftDate(cursor, -1);
  }
  return streak;
}
export function evaluateChallengePeriods(transactions, goals, challenges, now = new Date(), previous = false) {
  const today = getLocalDateString(now);
  const week = getCurrentWeekRange(previous ? shiftDate(now, -7) : now);
  const monthDate = new Date(now.getFullYear(), now.getMonth() - (previous ? 1 : 0), 1);
  const month = getLocalDateString(monthDate).slice(0, 7);
  const monthEnd = getLocalDateString(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));
  const foodKey = `weekly-food_${week.start}`;
  const savingsKey = `monthly-savings_${month}`;
  const limit = challenges.targets?.[foodKey] || 1000;
  const target = challenges.targets?.[savingsKey] || 500;
  const spent = transactions.filter(t => t.type === 'expense' && t.category === 'Food' && t.date >= week.start && t.date.slice(0,10) <= week.end && t.date.slice(0,10) <= today).reduce((s,t) => s + Number(t.amount || 0), 0);
  const saved = goals.flatMap(g => g.contributions || []).filter(c => c.date.startsWith(month) && c.date.slice(0,10) <= today).reduce((s,c) => s + Number(c.amount || 0), 0);
  return {
    food: { id: 'weekly-food', key: foodKey, period: week.start, start: week.start, end: week.end, value: spent, target: limit, passed: today > week.end && spent <= limit },
    savings: { id: 'monthly-savings', key: savingsKey, period: month, start: `${month}-01`, end: monthEnd, value: saved, target, passed: saved >= target }
  };
}
export function pauseProgress(pause, vault, now = new Date()) {
  const exists = vault.some(item => item.id === pause.itemId);
  const elapsed = Math.max(0, Math.floor((now.getTime() - Date.parse(pause.startedAt)) / 86400000));
  return { exists, elapsed, remaining: Math.max(0, pause.days - elapsed), passed: exists && elapsed >= pause.days };
}
export function achievementHistory(challenges) {
  return Object.entries(challenges.claimedXP || {}).filter(([, claimed]) => claimed).map(([key]) => {
    const id = Object.keys(challengeRewards).find(id => key.startsWith(`${id}_`));
    return { key, name: challengeNames[id] || 'Challenge', xp: challengeRewards[id] || 0, period: key.slice((id || '').length + 1), legacy: !challenges.achievements?.[key], ...challenges.achievements?.[key] };
  }).reverse();
}
