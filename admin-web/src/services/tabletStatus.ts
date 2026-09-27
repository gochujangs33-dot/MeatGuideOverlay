import type { DeviceStatus } from '../types/popup';

const ONLINE_WINDOW_MS = 10 * 60 * 1000;

export function toDate(value: unknown): Date | null {
  if (!value) return null;
  const timestamp = value as { toDate?: () => Date };
  const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Table order: "테이블-2" before "테이블-10"; tablets without a name go last. */
export function sortTablets(devices: DeviceStatus[]): DeviceStatus[] {
  return [...devices].sort((a, b) => {
    if (!a.deviceName) return b.deviceName ? 1 : 0;
    if (!b.deviceName) return -1;
    return a.deviceName.localeCompare(b.deviceName, 'ko', { numeric: true });
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
