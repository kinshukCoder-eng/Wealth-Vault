import { getLocalDateString } from './dates';

export const challengeTemplates = [
  { name: 'Shopping Reset', type: 'spending', category: 'Shopping', target: 1000, days: 7 },
  { name: 'Travel Light', type: 'spending', category: 'Transport', target: 500, days: 7 },
  { name: 'Mindful Week', type: 'spending', category: 'All', target: 3000, days: 7 },
  { name: 'Savings Sprint', type: 'savings', target: 2000, days: 14 },
  { name: 'Three Quiet Days', type: 'no-spend', target: 3, days: 7 },
  { name: 'Ten Days of Less', type: 'no-spend', target: 10, days: 30 },
];

export function personalChallengeError(c) {
  if (!c.name?.trim() || c.name.trim().length > 60) return 'Enter a name of up to 60 characters.';
  if (!['spending', 'savings', 'no-spend'].includes(c.type)) return 'Choose a challenge type.';
  if (!Number.isInteger(c.days) || c.days < 1 || c.days > 365) return 'Choose a duration from 1 to 365 days.';
  if (!Number.isFinite(c.target) || c.target <= 0) return 'Enter a target greater than zero.';
  if (c.type === 'no-spend' && (!Number.isInteger(c.target) || c.target > c.days)) return 'No-spend days must be a whole number within your duration.';
  return '';
}

export function personalProgress(c, transactions, goals, confirmedDays = [], now = new Date()) {
  const today = getLocalDateString(now);
  const inRange = date => date.slice(0, 10) >= c.start && date.slice(0, 10) <= c.end && date.slice(0, 10) <= today;
  const expenses = transactions.filter(t => t.type === 'expense');
  let value;
  if (c.type === 'spending') value = expenses.filter(t => inRange(t.date) && (c.category === 'All' || t.category === c.category)).reduce((sum, t) => sum + Number(t.amount), 0);
  else if (c.type === 'savings') value = goals.flatMap(g => g.contributions || []).filter(t => inRange(t.date)).reduce((sum, t) => sum + Number(t.amount), 0);
  else value = [...new Set(confirmedDays)].filter(date => inRange(date) && !expenses.some(t => t.date.slice(0, 10) === date)).length;
  return { value, closed: today > c.end, passed: c.type === 'spending' ? today > c.end && value <= c.target : value >= c.target };
}
