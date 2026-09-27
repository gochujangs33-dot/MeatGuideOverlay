import { describe, it, expect } from 'vitest';
import { sortTablets, isTabletOnline, appUpdateState } from '../services/tabletStatus';
import type { DeviceStatus } from '../types/popup';

const at = (iso: string) => ({ toDate: () => new Date(iso) });

describe('Tablet status list', () => {
  it('orders tablets by table number naturally, unnamed tablets last', () => {
    const devices: DeviceStatus[] = [
      { id: 'c', deviceName: '테이블-10' },
      { id: 'x' },
      { id: 'a', deviceName: '테이블-2' },
      { id: 'b', deviceName: '테이블-01' }
    ];

    expect(sortTablets(devices).map((d) => d.id)).toEqual(['b', 'a', 'c', 'x']);
  });

  it('treats a tablet as online only if it reported within 10 minutes', () => {
    const now = new Date('2026-09-28T12:00:00Z').getTime();

    expect(isTabletOnline(at('2026-09-28T11:55:00Z'), now)).toBe(true);
    expect(isTabletOnline(at('2026-09-28T11:49:00Z'), now)).toBe(false);
    expect(isTabletOnline(undefined, now)).toBe(false);
  });

  it('compares the installed app with the published release', () => {
    expect(appUpdateState({ id: 'a', appVersionCode: 21 }, 21)).toBe('latest');
    expect(appUpdateState({ id: 'a', appVersionCode: 19 }, 21)).toBe('outdated');
    expect(appUpdateState({ id: 'a' }, 21)).toBe('outdated');
    expect(appUpdateState({ id: 'a', appVersionCode: 19 }, null)).toBe('unknown');
  });
});
