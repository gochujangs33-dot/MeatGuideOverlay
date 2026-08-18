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
  // Tablet Power & Sleep Schedule Settings (Batch applied to all tablets)
  autoRebootEnabled?: boolean; // Default: true
  autoRebootTime?: string; // Default: "10:00"
  screenTimeoutMinutes?: number; // Default: 60 (1 hour), 0 for always on
}

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}

export type SupportedLanguage = 'ko' | 'en' | 'ja';
