/**
 * Storage abstraction:
 * - Production (Netlify): uses @netlify/blobs
 * - Local dev (npm run dev): uses JSON files in /data/
 */

import { Lead, Activity } from './types';

// ─── Detect environment ───────────────────────────────────────────────────────

function isNetlify() {
  return !!(process.env.NETLIFY || process.env.NETLIFY_LOCAL || process.env.NETLIFY_BLOBS_CONTEXT);
}

// ─── Netlify Blobs backend ────────────────────────────────────────────────────

async function blobsGetAll<T>(storeName: string): Promise<T[]> {
  const { getStore } = await import('@netlify/blobs');
  const store = getStore(storeName);
  const { blobs } = await store.list();
  if (blobs.length === 0) return [];
  const results = await Promise.all(blobs.map(b => store.get(b.key, { type: 'json' })));
  return results.filter(Boolean) as T[];
}

async function blobsGet<T>(storeName: string, key: string): Promise<T | null> {
  const { getStore } = await import('@netlify/blobs');
  const store = getStore(storeName);
  return store.get(key, { type: 'json' });
}

async function blobsSet(storeName: string, key: string, value: unknown): Promise<void> {
  const { getStore } = await import('@netlify/blobs');
  const store = getStore(storeName);
  await store.set(key, JSON.stringify(value));
}

async function blobsDelete(storeName: string, key: string): Promise<void> {
  const { getStore } = await import('@netlify/blobs');
  const store = getStore(storeName);
  await store.delete(key);
}

// ─── Local file backend ───────────────────────────────────────────────────────

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

function localPath(store: string) {
  return path.join(DATA_DIR, `${store}.json`);
}

function localRead<T>(store: string): Record<string, T> {
  const p = localPath(store);
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

function localWrite<T>(store: string, data: Record<string, T>) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(localPath(store), JSON.stringify(data, null, 2));
}

async function localGetAll<T>(storeName: string): Promise<T[]> {
  const data = localRead<T>(storeName);
  return Object.values(data);
}

async function localGet<T>(storeName: string, key: string): Promise<T | null> {
  return localRead<T>(storeName)[key] ?? null;
}

async function localSet(storeName: string, key: string, value: unknown) {
  const data = localRead(storeName);
  data[key] = value;
  localWrite(storeName, data);
}

async function localDelete(storeName: string, key: string) {
  const data = localRead(storeName);
  delete data[key];
  localWrite(storeName, data);
}

// ─── Unified API ──────────────────────────────────────────────────────────────

async function getAll<T>(store: string): Promise<T[]> {
  return isNetlify() ? blobsGetAll<T>(store) : localGetAll<T>(store);
}
async function get<T>(store: string, key: string): Promise<T | null> {
  return isNetlify() ? blobsGet<T>(store, key) : localGet<T>(store, key);
}
async function set(store: string, key: string, value: unknown): Promise<void> {
  return isNetlify() ? blobsSet(store, key, value) : localSet(store, key, value);
}
async function del(store: string, key: string): Promise<void> {
  return isNetlify() ? blobsDelete(store, key) : localDelete(store, key);
}

// ─── Lead operations ──────────────────────────────────────────────────────────

const LEADS = 'finfo-leads';

export async function getAllLeads(): Promise<Lead[]> {
  const leads = await getAll<Lead>(LEADS);
  return leads.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getLead(id: string): Promise<Lead | null> {
  return get<Lead>(LEADS, id);
}

export async function saveLead(lead: Lead): Promise<void> {
  await set(LEADS, lead.id, lead);
}

export async function deleteLead(id: string): Promise<void> {
  await del(LEADS, id);
  await del(ACTIVITIES, id);
}

// ─── Activity operations ──────────────────────────────────────────────────────

const ACTIVITIES = 'finfo-activities';

export async function getActivities(leadId: string): Promise<Activity[]> {
  return (await get<Activity[]>(ACTIVITIES, leadId)) ?? [];
}

export async function addActivity(leadId: string, activity: Activity): Promise<void> {
  const existing = await getActivities(leadId);
  await set(ACTIVITIES, leadId, [activity, ...existing]);
}
