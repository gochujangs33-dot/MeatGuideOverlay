import type { DeviceStatus } from '../types/popup';
import { firestore } from './firebase';
import { doc, deleteDoc } from 'firebase/firestore';

const ONLINE_WINDOW_MS = 10 * 60 * 1000;

export function toDate(value: unknown): Date | null {
  if (!value) return null;
  const timestamp = value as { toDate?: () => Date; seconds?: number };
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (typeof timestamp.seconds === 'number') return new Date(timestamp.seconds * 1000);
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function cleanDeviceName(name?: string): string {
  if (!name) return '';
  return name.trim();
}

/** Check if the device is a valid dining table (filters out '테스트', empty names, etc.) */
export function isTableDevice(device: DeviceStatus): boolean {
  const name = cleanDeviceName(device.deviceName);
  if (!name) return false;
  if (name === '테스트' || name.toLowerCase().includes('test')) return false;
  return true;
}

/**
 * Deduplicate tablets by table name.
 * If multiple documents have the exact same table name (e.g. after an app update or reinstall),
 * the most recently active device (by lastSeen, then appVersionCode) is retained,
 * and any older duplicate is pruned.
 */
export function deduplicateTablets(
  devices: DeviceStatus[],
  onPruneObsolete?: (obsoleteId: string) => void
): DeviceStatus[] {
  const groups = new Map<string, DeviceStatus[]>();
  const nameless: DeviceStatus[] = [];

  for (const device of devices) {
    const cleaned = cleanDeviceName(device.deviceName);
    if (!cleaned) {
      nameless.push(device);
      continue;
    }
    const list = groups.get(cleaned) ?? [];
    list.push({ ...device, deviceName: cleaned });
    groups.set(cleaned, list);
  }

  const result: DeviceStatus[] = [];

  for (const [, list] of groups.entries()) {
    if (list.length === 1) {
      result.push(list[0]);
      continue;
    }

    // Sort by lastSeen descending, then appVersionCode descending
    list.sort((a, b) => {
      const timeA = toDate(a.lastSeen)?.getTime() ?? 0;
      const timeB = toDate(b.lastSeen)?.getTime() ?? 0;
      if (timeA !== timeB) return timeB - timeA;
      return (b.appVersionCode ?? 0) - (a.appVersionCode ?? 0);
    });

    // The first one is the freshest/latest
    result.push(list[0]);

    // Prune stale duplicates
    if (onPruneObsolete) {
      for (let i = 1; i < list.length; i++) {
        onPruneObsolete(list[i].id);
      }
    }
  }

  result.push(...nameless);
  return result;
}

/** Table order: "테이블-2" before "테이블-10"; tablets without a name go last. */
export function sortTablets(devices: DeviceStatus[]): DeviceStatus[] {
  return [...devices].sort((a, b) => {
    const nameA = cleanDeviceName(a.deviceName);
    const nameB = cleanDeviceName(b.deviceName);
    if (!nameA) return nameB ? 1 : 0;
    if (!nameB) return -1;
    return nameA.localeCompare(nameB, 'ko', { numeric: true });
  });
}

/** Tablets report every 5 minutes; no report for 10 minutes means offline. */
export function isTabletOnline(lastSeen: unknown, now: number = Date.now()): boolean {
  const date = toDate(lastSeen);
  return date !== null && now - date.getTime() < ONLINE_WINDOW_MS;
}

export function appUpdateState(
  device: DeviceStatus,
  latestVersionCode: number | null
): 'latest' | 'outdated' | 'unknown' {
  if (latestVersionCode === null) return 'unknown';
  return (device.appVersionCode ?? 0) >= latestVersionCode ? 'latest' : 'outdated';
}

/** Delete a device document from Firestore. */
export async function deleteTabletDevice(deviceId: string): Promise<void> {
  try {
    await deleteDoc(doc(firestore, 'devices', deviceId));
  } catch (error) {
    console.error(`Failed to delete tablet device ${deviceId}:`, error);
    throw error;
  }
}

/** Version code of the app release published on Firebase Hosting, or null if unavailable. */
export async function fetchLatestAppVersionCode(): Promise<number | null> {
  try {
    const response = await fetch('/updates/release.json', { cache: 'no-store' });
    if (!response.ok) return null;
    const release = await response.json();
    return typeof release.versionCode === 'number' ? release.versionCode : null;
  } catch {
    return null;
  }
}

