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
  autoRebootEnabled?: boolean; // Default: false
  autoRebootTime?: string; // Default: "10:00"
  screenTimeoutMinutes?: number; // Default: 60 (1 hour), 0 for always on
  popupAutoCloseMinutes?: number; // Default: 5; 0 disables inactivity auto-close
  // Character Placement Position (Batch applied to all tablets)
  characterPosition?: 'RIGHT_TOP' | 'LEFT_TOP'; // Always "LEFT_TOP" (fixed top-left)
}

export interface DeviceStatus {
  id: string;
  deviceUid?: string;
  deviceName?: string;
  appVersionCode?: number;
  appVersionName?: string;
  contentVersion?: number;
  model?: string;
  androidVersion?: string;
  serviceState?: string;
  lastSeen?: unknown;
  // Reported from app v1.0.21
  contentUpdatedAt?: string;
  appUpdatedAt?: unknown;
  kioskPackage?: string;
  autoLaunchKiosk?: boolean;
  overlayPermission?: boolean;
  accessibilityEnabled?: boolean;
  writeSettingsPermission?: boolean;
  popupAutoCloseMinutes?: number;
}

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}

export type SupportedLanguage = 'ko' | 'en' | 'ja';
