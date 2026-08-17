/**
 * Client-side auto-translation service for MeatGuideOverlay speech bubble phrases.
 * Translates Korean text to English (en) and Japanese (ja) with smart phrase fallbacks.
 */

const MEAT_GUIDE_FALLBACKS: Record<string, { en: string; ja: string }> = {
  '이 고기가 어떤 부위인지 궁금하신가요?': {
    en: 'Wondering which cut of meat this is?',
    ja: 'このお肉がどの部位か気になりますか？'
  },
  '고기 부위가 궁금하시면 눌러보세요!': {
    en: 'Tap here to learn about this cut of meat!',
    ja: 'お肉の部位が気になる方はタップしてください！'
  },
  '맛있는 고기 부위 안내': {
    en: 'Delicious Meat Cuts Guide',
    ja: '美味しいお肉の部位案内'
  },
  '어떤 부위인지 확인해보세요!': {
    en: 'Check out which meat cut this is!',
    ja: 'どの部位か確認してみましょう！'
  }
};

/**
 * Translates text from Korean (ko) to target language (en or ja).
 */
export async function translateFromKorean(
  koreanText: string,
  targetLang: 'en' | 'ja'
): Promise<string> {
  const trimmed = koreanText.trim();
  if (!trimmed) return '';

  // Check cached dictionary fallbacks first
  if (MEAT_GUIDE_FALLBACKS[trimmed]) {
    return MEAT_GUIDE_FALLBACKS[trimmed][targetLang];
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=${targetLang}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((item: any) => item[0]).filter(Boolean).join('');
        if (translated) {
          return translated;
        }
      }
    }
  } catch (err) {
    console.warn(`[Auto-Translate] API call failed for ${targetLang}, checking heuristics:`, err);
  }

  // Fallback heuristics if offline or network blocked
  if (targetLang === 'en') {
    return `Guide: ${trimmed}`;
  } else {
    return `案内: ${trimmed}`;
  }
}

/**
 * Translates Korean text to both English and Japanese simultaneously.
 */
export async function autoTranslateKoreanToAll(
  koreanText: string
): Promise<{ en: string; ja: string }> {
  const trimmed = koreanText.trim();
  if (!trimmed) {
    return { en: '', ja: '' };
  }

  const [enResult, jaResult] = await Promise.all([
    translateFromKorean(trimmed, 'en'),
    translateFromKorean(trimmed, 'ja')
  ]);

  return {
    en: enResult,
    ja: jaResult
  };
}
