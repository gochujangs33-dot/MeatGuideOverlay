export interface CharacterImage {
  url: string;
  alt: string;
  mimeType: string;
  fileSize: number;
  version: string;
}

export interface PorkItem {
  id: string;
  name: string;
  cutPosition: string;
  description: string;
  taste: string;
  texture: string;
  recommendation: string;
  order: number;
  visible: boolean;
  imageUrl: string;
  silhouetteUrl: string;
}

export interface PorkCategory {
  title: string;
  description: string;
  items: PorkItem[];
}

export interface BeefRibItem {
  id: string;
  name: string;
  cutPosition: string;
  description: string;
  taste: string;
  texture: string;
  characteristics: string;
  recommendation: string;
  imageUrl: string;
  silhouetteUrl: string;
}

export interface RestartGuide {
  title: string;
  message: string;
  cooldownMinutes: number;
  allowPowerMenu: boolean;
}

export interface UiSettings {
  autoCloseSeconds: number;
  speechBubbleMode: 'ALWAYS' | 'TIMEOUT_THEN_CHAR_ONLY' | 'CHAR_ONLY';
  speechBubbleTimeoutSeconds: number;
  characterDefaultSide: 'LEFT' | 'RIGHT';
  touchOutsideDismiss: boolean;
}

export interface ContentManifest {
  schemaVersion: string;
  contentVersion: number;
  updatedAt: string;
  publishedBy: string;
  bubbleText: string;
  characterImage: CharacterImage;
  porkCategory: PorkCategory;
  beefRibItem: BeefRibItem;
  kioskErrorTexts: string[];
  restartGuide: RestartGuide;
  uiSettings: UiSettings;
}

export interface DeviceStatusDoc {
  deviceUid: string;
  deviceName: string;
  deviceModel: string;
  androidVersion: string;
  appVersion: string;
  contentVersion: number;
  lastSeenAt: string;
  lastSyncSuccessAt: string;
  lastSyncError: string;
  selectedKioskPackage: string;
}

export interface ContentVersionHistoryItem {
  version: number;
  publishedAt: string;
  publishedBy: string;
  summary: string;
  manifest: ContentManifest;
}
