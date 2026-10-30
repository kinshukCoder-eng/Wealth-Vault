import { describe, it, expect } from 'vitest';
import { confirmedStreak, evaluateChallengePeriods, pauseProgress, achievementHistory } from '../utils/challengeProgress';
import reducer, { claimXP, setChallengeTarget, confirmNoSpend, startPurchasePause } from '../features/challenges/challengesSlice';
const now = new Date(2026, 9, 26, 12);
describe('Challenge habits', () => {
  it('requires confirmations and ignores days with expenses', () => {
    expect(confirmedStreak([], [], now)).toBe(0);
    expect(confirmedStreak([], ['2026-10-24','2026-10-25'], now)).toBe(2);
    expect(confirmedStreak([{type:'expense',date:'2026-10-25'}], ['2026-10-24','2026-10-25'], now)).toBe(0);
    expect(confirmedStreak([], ['2026-10-24','2026-10-26'], now)).toBe(1);
  });
  it('waits until the food week ends, applies period targets, and excludes future contributions', () => {
    const challenges = { targets: { 'weekly-food_2026-10-26': 2000, 'monthly-savings_2026-10': 900 } };
    const goals = [{contributions: [{amount:500,date:'2026-10-23'}, {amount:500,date:'2026-10-30'}]}];
    const result = evaluateChallengePeriods([], goals, challenges, now);
    expect(result.food.target).toBe(2000);
    expect(result.food.passed).toBe(false);
    expect(result.savings.value).toBe(500);
    expect(result.savings.passed).toBe(false);
    expect(evaluateChallengePeriods([], [], {}, now, true).food.passed).toBe(true);
  });
  it('preserves legacy rewards, records achievements once, and locks claimed targets', () => {
    const old = {activeChallenges:[],claimedXP:{'weekly-food_2026-10-19':true}};
    let state = reducer(old, claimXP({challengeId:'monthly-savings',periodKey:'2026-10',achievement:{xp:250,name:'Pocket Protector'}}));
    state = reducer(state, claimXP({challengeId:'monthly-savings',periodKey:'2026-10',achievement:{xp:900}}));
    state = reducer(state, setChallengeTarget({key:'monthly-savings_2026-10',value:1}));
    expect(state.targets).toBeUndefined();
    expect(achievementHistory(state).reduce((s,h)=>s+h.xp,0)).toBe(400);
    state = reducer(state, confirmNoSpend('2026-10-26'));
    state = reducer(state, confirmNoSpend('2026-10-26'));
    expect(state.confirmedDays).toHaveLength(1);
  });
  it('starts a fresh waiting timer and requires the item to remain in the vault', () => {
    const pause = {itemId:'v1',name:'Headphones',days:3,startedAt:now.toISOString()};
    const later = new Date(now.getTime()+3*86400000);
    expect(pauseProgress(pause,[{id:'v1'}],now).passed).toBe(false);
    expect(pauseProgress(pause,[{id:'v1'}],later).passed).toBe(true);
    expect(pauseProgress(pause,[],later).passed).toBe(false);
    const state = reducer({activeChallenges:[],claimedXP:{}}, startPurchasePause(pause));
    expect(reducer(state,startPurchasePause({...pause,days:1})).purchasePauses.v1.days).toBe(3);
  });
});
