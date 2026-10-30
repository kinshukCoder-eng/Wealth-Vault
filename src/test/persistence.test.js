import { describe, it, expect, beforeEach } from "vitest";
import {
  loadPersistedState,
  STORAGE_KEYS,
  migrateGoal,
  persistApplicationState,
} from "../utils/persistence";

describe("Persistence & Migration Layer", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads demo data on genuinely fresh install when no storage exists", () => {
    const state = loadPersistedState();
    expect(state.transactions.length).toBeGreaterThan(0);
    expect(state.goals.length).toBeGreaterThan(0);
    expect(state.vault.length).toBeGreaterThan(0);
  });

  it("preserves intentional empty arrays without reseeding demo data", () => {
    // User intentionally cleared their transactions
    const legacyState = {
      transactions: [],
      goals: [],
      vault: [],
    };
    localStorage.setItem(STORAGE_KEYS.STATE_V1, JSON.stringify(legacyState));

    const migrated = loadPersistedState();
    expect(migrated.transactions).toEqual([]);
    expect(migrated.goals).toEqual([]);
    expect(migrated.vault).toEqual([]);
  });

  it("migrates legacy goals and preserves initial savings without double-counting", () => {
    const legacyGoal = {
      id: "g1",
      name: "New Phone",
      target: 60000,
      saved: 15000,
      monthly: 5000,
      emoji: "📱",
    };

    const migrated = migrateGoal(legacyGoal);
    expect(migrated.id).toBe("g1");
    expect(migrated.initialSaved).toBe(15000);
    expect(migrated.contributions).toEqual([]);

    // Adding a contribution to this goal
    const newContrib = { id: "c1", amount: 5000, date: "2026-03-25" };
    migrated.contributions.push(newContrib);

    const totalSaved =
      migrated.initialSaved +
      migrated.contributions.reduce((sum, c) => sum + c.amount, 0);
    expect(totalSaved).toBe(20000);
  });

  it("creates a safe backup before migrating legacy v1 data", () => {
    const rawV1 = JSON.stringify({ transactions: [{ id: "t1", title: "Test", amount: 100 }] });
    localStorage.setItem(STORAGE_KEYS.STATE_V1, rawV1);

    loadPersistedState();
    expect(localStorage.getItem(STORAGE_KEYS.STATE_BACKUP)).toBe(rawV1);
  });

  it("handles corrupt JSON gracefully and preserves raw backup", () => {
    const corrupt = "{bad json string: 123";
    localStorage.setItem(STORAGE_KEYS.STATE_V1, corrupt);

    const fallback = loadPersistedState();
    // Fallback should safely return a valid state
    expect(fallback).toBeDefined();
    expect(Array.isArray(fallback.transactions)).toBe(true);
    // And corrupt data is backed up safely
    expect(localStorage.getItem(STORAGE_KEYS.STATE_BACKUP + "-corrupt")).toBe(corrupt);
  });

  it("mirrors state to legacy v1 for backward compatibility", () => {
    const testState = {
      transactions: [{ id: "t1", title: "Tea", amount: 20, type: "expense", date: "2026-03-24" }],
      goals: [{ id: "g1", name: "Bike", target: 50000, initialSaved: 10000, monthly: 2000, contributions: [{ id: "c1", amount: 5000 }] }],
      vault: [],
      budget: { mode: "auto" },
      challenges: { activeChallenges: [] },
      reportingPeriod: "2026-03",
    };

    persistApplicationState(testState);
    const mirrorV1 = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATE_V1));
    expect(mirrorV1).toBeDefined();
    expect(mirrorV1.transactions.length).toBe(1);
    expect(mirrorV1.goals[0].saved).toBe(15000); // 10000 + 5000
  });
});
