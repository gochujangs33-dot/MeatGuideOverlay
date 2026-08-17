export interface ActivePopupInfo {
  imageUrl: string;
  version: number;
  updatedAt: string;
  fileName: string;
  fileSize: number;
  checksum: string;
  bubbleText?: string;
}

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}
