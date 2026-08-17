import { describe, it, expect } from 'vitest';
import { autoTranslateKoreanToAll, translateFromKorean } from '../services/translationService';

describe('Auto-Translation Service Tests', () => {
  it('should translate known meat guide phrase to English and Japanese accurately', async () => {
    const korean = '이 고기가 어떤 부위인지 궁금하신가요?';
    const result = await autoTranslateKoreanToAll(korean);

    expect(result.en).toBe('Wondering which cut of meat this is?');
    expect(result.ja).toBe('このお肉がどの部位か気になりますか？');
  });

  it('should return empty strings for empty input', async () => {
    const result = await autoTranslateKoreanToAll('');
    expect(result.en).toBe('');
    expect(result.ja).toBe('');
  });

  it('should translate fallback phrases gracefully', async () => {
    const phrase = '맛있는 고기 부위 안내';
    const en = await translateFromKorean(phrase, 'en');
    const ja = await translateFromKorean(phrase, 'ja');

    expect(en).toBeTruthy();
    expect(ja).toBeTruthy();
  });
});
