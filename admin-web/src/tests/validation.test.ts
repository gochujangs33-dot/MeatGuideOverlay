import { describe, it, expect } from 'vitest';
import { ContentService, initialDefaultManifest } from '../services/contentService';
import { ContentManifest } from '../types/content';

describe('Admin Web Content Validation Tests', () => {
  it('should validate default initial manifest as valid', () => {
    const result = ContentService.validateForPublish(initialDefaultManifest);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should reject manifest with empty bubbleText', () => {
    const invalidManifest: ContentManifest = {
      ...initialDefaultManifest,
      bubbleText: '   '
    };
    const result = ContentService.validateForPublish(invalidManifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('말풍선'))).toBe(true);
  });

  it('should reject manifest with empty pork items', () => {
    const invalidManifest: ContentManifest = {
      ...initialDefaultManifest,
      porkCategory: {
        ...initialDefaultManifest.porkCategory,
        items: []
      }
    };
    const result = ContentService.validateForPublish(invalidManifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('돼지고기 부위'))).toBe(true);
  });

  it('should strictly reject any beef item other than 소생갈비살', () => {
    const invalidBeefManifest: ContentManifest = {
      ...initialDefaultManifest,
      beefRibItem: {
        ...initialDefaultManifest.beefRibItem,
        name: '한우 안심'
      }
    };
    const result = ContentService.validateForPublish(invalidBeefManifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('소생갈비살'))).toBe(true);
  });

  it('should strictly reject prohibited beef items like 육회 or 뿌리살', () => {
    const yukhoeManifest: ContentManifest = {
      ...initialDefaultManifest,
      beefRibItem: {
        ...initialDefaultManifest.beefRibItem,
        name: '육회'
      }
    };
    const result = ContentService.validateForPublish(yukhoeManifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('소생갈비살') || e.includes('금지된 소고기'))).toBe(true);

    const bbooriInPork: ContentManifest = {
      ...initialDefaultManifest,
      porkCategory: {
        ...initialDefaultManifest.porkCategory,
        items: [
          ...initialDefaultManifest.porkCategory.items,
          {
            id: 'pork_infiltrated',
            name: '뿌리살',
            cutPosition: '',
            description: '',
            taste: '',
            texture: '',
            recommendation: '',
            order: 99,
            visible: true,
            imageUrl: '',
            silhouetteUrl: ''
          }
        ]
      }
    };
    const result2 = ContentService.validateForPublish(bbooriInPork);
    expect(result2.valid).toBe(false);
    expect(result2.errors.some(e => e.includes('금지된 소고기'))).toBe(true);
  });
});
