import { describe, it, expect } from 'vitest';
import { validateImageFile } from '../services/popupService';

describe('Popup Image Upload Validation Tests', () => {
  it('should accept valid PNG image file', () => {
    const file = new File(['dummy content'], 'poster.png', { type: 'image/png' });
    const result = validateImageFile(file);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept valid JPG / JPEG image file', () => {
    const fileJpg = new File(['dummy content'], 'meat_guide.jpg', { type: 'image/jpeg' });
    const resultJpg = validateImageFile(fileJpg);
    expect(resultJpg.valid).toBe(true);

    const fileJpeg = new File(['dummy content'], 'pork_cuts.jpeg', { type: 'image/jpeg' });
    const resultJpeg = validateImageFile(fileJpeg);
    expect(resultJpeg.valid).toBe(true);
  });

  it('should accept valid WebP image file', () => {
    const file = new File(['dummy content'], 'highres_guide.webp', { type: 'image/webp' });
    const result = validateImageFile(file);
    expect(result.valid).toBe(true);
  });

  it('should reject unsupported file extensions (pdf, txt, exe, zip)', () => {
    const filePdf = new File(['dummy content'], 'manual.pdf', { type: 'application/pdf' });
    const resultPdf = validateImageFile(filePdf);
    expect(resultPdf.valid).toBe(false);
    expect(resultPdf.error).toContain('지원되지 않는 파일 형식');

    const fileTxt = new File(['dummy content'], 'notes.txt', { type: 'text/plain' });
    const resultTxt = validateImageFile(fileTxt);
    expect(resultTxt.valid).toBe(false);
  });

  it('should reject files exceeding 25MB limit', () => {
    // Mock oversized file: 26MB
    const oversizedFile = {
      name: 'giant_poster.png',
      type: 'image/png',
      size: 26 * 1024 * 1024
    } as unknown as File;

    const result = validateImageFile(oversizedFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('25MB 이하');
  });
});
