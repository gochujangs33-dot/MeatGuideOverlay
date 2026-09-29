import { describe, it, expect } from 'vitest';
import {
  appUpdateState,
  deduplicateTablets,
  isTableDevice,
  isTabletOnline,
  sortTablets
} from '../services/tabletStatus';
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

  it('deduplicates tablets by table name, keeping the latest one and pruning the obsolete one', () => {
    const prunedIds: string[] = [];
    const devices: DeviceStatus[] = [
      {
        id: 'old-17',
        deviceName: '테이블-17',
        lastSeen: at('2026-09-29T16:00:00Z'),
        appVersionCode: 20
      },
      {
        id: 'new-17',
        deviceName: '테이블-17',
        lastSeen: at('2026-09-30T06:00:00Z'),
        appVersionCode: 22
      },
      {
        id: 'tab-01',
        deviceName: '테이블-01',
        lastSeen: at('2026-09-30T05:50:00Z'),
        appVersionCode: 22
      }
    ];

    const result = deduplicateTablets(devices, (staleId) => prunedIds.push(staleId));
    expect(result.map((d) => d.id)).toEqual(['new-17', 'tab-01']);
    expect(prunedIds).toEqual(['old-17']);
  });

  it('identifies valid table devices and filters out test or empty devices', () => {
    expect(isTableDevice({ id: '1', deviceName: '테이블-01' })).toBe(true);
    expect(isTableDevice({ id: '2', deviceName: ' 테이블-17 \n' })).toBe(true);
    expect(isTableDevice({ id: '3', deviceName: '테스트' })).toBe(false);
    expect(isTableDevice({ id: '4', deviceName: 'test-device' })).toBe(false);
    expect(isTableDevice({ id: '5', deviceName: '' })).toBe(false);
    expect(isTableDevice({ id: '6' })).toBe(false);
  });
});
