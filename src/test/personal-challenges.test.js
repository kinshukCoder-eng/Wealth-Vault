import { describe, it, expect } from 'vitest';
import { personalProgress, personalChallengeError, challengeTemplates } from '../utils/personalChallenges';
import reducer, { addPersonalChallenge, claimXP } from '../features/challenges/challengesSlice';
const base = { name: 'Test', type: 'spending', category: 'Shopping', target: 100, days: 7, start: '2026-10-01', end: '2026-10-07' };
describe('Personal challenges', () => {
  it('validates templates and rejects impossible day targets', () => {
    challengeTemplates.forEach(t => expect(personalChallengeError(t)).toBe(''));
    expect(personalChallengeError({...base,type:'no-spend',target:8})).not.toBe('');
    expect(personalChallengeError({...base,target:Infinity})).not.toBe('');
  });
  it('counts only matching spending within dates and waits for the end', () => {
    const tx = [{type:'expense',category:'Shopping',amount:80,date:'2026-10-02'}, {type:'expense',category:'Food',amount:200,date:'2026-10-02'}, {type:'expense',category:'Shopping',amount:200,date:'2026-10-08'}];
    expect(personalProgress(base,tx,[],[],new Date(2026,9,7))).toMatchObject({value:80,passed:false});
    expect(personalProgress(base,tx,[],[],new Date(2026,9,8)).passed).toBe(true);
  });
  it('counts distinct confirmed expense-free days and goal contributions', () => {
    const now = new Date(2026,9,5);
    expect(personalProgress({...base,type:'no-spend'},[{type:'expense',date:'2026-10-02'}],[],['2026-10-01','2026-10-01','2026-10-02','2026-10-06'],now).value).toBe(1);
    expect(personalProgress({...base,type:'savings'},[],[{contributions:[{amount:50,date:'2026-10-03'},{amount:80,date:'2026-10-06'}]}],[],now).value).toBe(50);
  });
  it('adds a saved active challenge and preserves one-time achievement history', () => {
    let state = reducer(undefined,addPersonalChallenge(base));
    const c = state.personalChallenges[0];
    expect(state.activeChallenges).toContain(c.id);
    const action = claimXP({challengeId:c.id,periodKey:c.start,achievement:{name:c.name,xp:100}});
    state = reducer(reducer(state,action),action);
    expect(Object.keys(state.achievements)).toHaveLength(1);
    expect(reducer(state,addPersonalChallenge({...base,target:-1})).personalChallenges).toHaveLength(1);
  });
});
