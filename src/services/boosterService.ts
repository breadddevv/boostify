import * as fs from "fs";
import * as path from "path";

export interface BoosterRecord {
  userId: string;
  username: string;
  boosting: boolean;
  boostCount: number;
  customRoleId: string | null;
  privateChannelId: string | null;
  firstBoostAt: string;
  lastUpdatedAt: string;
}

export interface BoosterStore {
  boosters: Record<string, BoosterRecord>;
  totalBoosts: number;
}

const DATA_PATH = path.join(process.cwd(), "data", "boosters.json");

function ensureDataDir(): void {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readStore(): BoosterStore {
  ensureDataDir();
  if (!fs.existsSync(DATA_PATH)) {
    return { boosters: {}, totalBoosts: 0 };
  }
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw) as BoosterStore;
}

function writeStore(store: BoosterStore): void {
  ensureDataDir();
  fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export function getBooster(userId: string): BoosterRecord | null {
  const store = readStore();
  return store.boosters[userId] ?? null;
}

export function getAllBoosters(): BoosterRecord[] {
  const store = readStore();
  return Object.values(store.boosters);
}

export function getActiveBoosters(): BoosterRecord[] {
  return getAllBoosters().filter((b) => b.boosting);
}

export function getTotalBoosts(): number {
  return readStore().totalBoosts;
}

export function registerBoost(userId: string, username: string): BoosterRecord {
  const store = readStore();
  const existing = store.boosters[userId];

  if (existing) {
    existing.boosting = true;
    existing.boostCount += 1;
    existing.username = username;
    existing.lastUpdatedAt = new Date().toISOString();
    store.totalBoosts += 1;
    writeStore(store);
    return existing;
  }

  const record: BoosterRecord = {
    userId,
    username,
    boosting: true,
    boostCount: 1,
    customRoleId: null,
    privateChannelId: null,
    firstBoostAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };

  store.boosters[userId] = record;
  store.totalBoosts += 1;
  writeStore(store);
  return record;
}

export function removeBoost(userId: string): BoosterRecord | null {
  const store = readStore();
  const existing = store.boosters[userId];
  if (!existing) return null;

  existing.boosting = false;
  existing.lastUpdatedAt = new Date().toISOString();
  writeStore(store);
  return existing;
}

export function addBoostCount(userId: string, amount: number): BoosterRecord | null {
  const store = readStore();
  const existing = store.boosters[userId];
  if (!existing) return null;

  existing.boostCount = Math.max(0, existing.boostCount + amount);
  existing.lastUpdatedAt = new Date().toISOString();
  store.totalBoosts += amount;
  writeStore(store);
  return existing;
}

export function removeBoostCount(userId: string, amount: number): BoosterRecord | null {
  const store = readStore();
  const existing = store.boosters[userId];
  if (!existing) return null;

  existing.boostCount = Math.max(0, existing.boostCount - amount);
  existing.lastUpdatedAt = new Date().toISOString();
  store.totalBoosts = Math.max(0, store.totalBoosts - amount);
  writeStore(store);
  return existing;
}

export function setCustomRole(userId: string, roleId: string | null): void {
  const store = readStore();
  const existing = store.boosters[userId];
  if (!existing) return;

  existing.customRoleId = roleId;
  existing.lastUpdatedAt = new Date().toISOString();
  writeStore(store);
}

export function setPrivateChannel(userId: string, channelId: string | null): void {
  const store = readStore();
  const existing = store.boosters[userId];
  if (!existing) return;

  existing.privateChannelId = channelId;
  existing.lastUpdatedAt = new Date().toISOString();
  writeStore(store);
}