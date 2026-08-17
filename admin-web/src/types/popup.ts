export interface ActivePopupInfo {
  imageUrl: string; // Default fallback (Korean)
  imageUrlKo?: string; // Korean poster image
  imageUrlEn?: string; // English poster image
  imageUrlJa?: string; // Japanese poster image
  version: number;
  updatedAt: string;
  fileName: string;
  fileSize: number;
  checksum: string;
  bubbleText: string;
  bubbleTextKo?: string;
  bubbleTextEn?: string;
  bubbleTextJa?: string;
}

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}

export type SupportedLanguage = 'ko' | 'en' | 'ja';
