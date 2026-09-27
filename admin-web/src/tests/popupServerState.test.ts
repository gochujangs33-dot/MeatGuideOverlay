import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    doc: vi.fn(() => ({ path: 'active_popup/current' })),
    getDoc: vi.fn(),
    onSnapshot: vi.fn()
  };
});

import { getDoc, onSnapshot } from 'firebase/firestore';
import { fetchActivePopup, subscribeToActivePopup, DEFAULT_ACTIVE_POPUP } from '../services/popupService';

const serverDoc = {
  imageUrl: 'https://firebasestorage.googleapis.com/v0/b/app/o/popups%2F9_ko.png?alt=media',
  imageUrlKo: 'https://firebasestorage.googleapis.com/v0/b/app/o/popups%2F9_ko.png?alt=media',
  imageUrlEn: 'https://firebasestorage.googleapis.com/v0/b/app/o/popups%2F9_en.png?alt=media',
  imageUrlJa: 'https://firebasestorage.googleapis.com/v0/b/app/o/popups%2F9_ja.png?alt=media',
  version: 15,
  updatedAt: '2026-09-20T00:00:00.000Z',
  fileName: 'poster_ko.png',
  fileSize: 1000,
  checksum: 'crc_1_v15',
  bubbleText: '오늘의 추천 부위',
  bubbleTextKo: '오늘의 추천 부위',
  bubbleTextEn: "Today's pick",
  bubbleTextJa: '本日のおすすめ',
  popupAutoCloseMinutes: 5,
  characterPosition: 'LEFT_TOP'
};

describe('Active popup server state', () => {
  beforeEach(() => {
    vi.mocked(getDoc).mockReset();
    vi.mocked(onSnapshot).mockReset();
  });

  it('reports a listener error instead of replacing the state with defaults', () => {
    let errorHandler: ((error: Error) => void) | undefined;
    vi.mocked(onSnapshot).mockImplementation(((_ref: unknown, _next: unknown, onError: (e: Error) => void) => {
      errorHandler = onError;
      return () => undefined;
    }) as never);
    const onChange = vi.fn();
    const onError = vi.fn();

    subscribeToActivePopup(onChange, onError);
    errorHandler?.(new Error('resource-exhausted'));

    expect(onChange).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('fails the initial load instead of returning defaults when the server is unreachable', async () => {
    vi.mocked(getDoc).mockRejectedValue(new Error('client is offline'));

    await expect(fetchActivePopup()).rejects.toThrow();
  });

  it('uses defaults only when the server has no popup document yet', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false, data: () => undefined } as never);

    await expect(fetchActivePopup()).resolves.toEqual(DEFAULT_ACTIVE_POPUP);
  });

  it('returns the server document when it exists', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => serverDoc } as never);

    const info = await fetchActivePopup();

    expect(info.version).toBe(15);
    expect(info.imageUrlEn).toBe(serverDoc.imageUrlEn);
  });
});
