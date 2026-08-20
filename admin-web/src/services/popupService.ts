import {
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage';
import { firestore, storage } from './firebase';
import { ActivePopupInfo, UploadValidationResult } from '../types/popup';

const COLLECTION_NAME = 'active_popup';
const DOC_CURRENT = 'current';

export const DEFAULT_ACTIVE_POPUP: ActivePopupInfo = {
  imageUrl: '/assets/pork_guide_poster_ko.jpg',
  imageUrlKo: '/assets/pork_guide_poster_ko.jpg',
  imageUrlEn: '/assets/pork_guide_poster_en.jpg',
  imageUrlJa: '/assets/pork_guide_poster_ja.jpg',
  version: 1,
  updatedAt: new Date().toISOString(),
  fileName: 'pork_guide_poster.jpg',
  fileSize: 455717,
  checksum: 'default_v1_pork_guide',
  bubbleText: '이 고기가 어떤 부위인지 궁금하신가요?',
  bubbleTextKo: '이 고기가 어떤 부위인지 궁금하신가요?',
  bubbleTextEn: 'Wondering which cut of meat this is?',
  bubbleTextJa: 'このお肉がどの部位か気になりますか？',
  autoRebootEnabled: true,
  autoRebootTime: '10:00',
  screenTimeoutMinutes: 60,
  characterPosition: 'RIGHT_TOP'
};

/**
 * Validates an image file before upload.
 * Supports PNG, JPG, JPEG, WebP up to 25MB.
 */
export function validateImageFile(file: File): UploadValidationResult {
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  const fileNameLower = file.name.toLowerCase();
  const hasValidExt = allowedExtensions.some(ext => fileNameLower.endsWith(ext));
  const hasValidMime = allowedMimeTypes.includes(file.type);

  if (!hasValidExt && !hasValidMime) {
    return {
      valid: false,
      error: '지원되지 않는 파일 형식입니다. PNG, JPG, JPEG, WebP 이미지를 선택해주세요.'
    };
  }

  // Max 25MB
  const MAX_BYTES = 25 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return {
      valid: false,
      error: '파일 용량이 너무 큽니다. 25MB 이하의 이미지를 업로드해주세요.'
    };
  }

  return { valid: true };
}

/**
 * Helper to upload a single file to Firebase Storage.
 */
async function uploadSingleFile(
  file: File,
  langPrefix: string,
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `popups/${timestamp}_${langPrefix}_${sanitizedFileName}`;
  const storageRef = ref(storage, storagePath);

  try {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        language: langPrefix
      }
    });

    return await new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress?.(progress);
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  } catch (e) {
    console.error(`Firebase Storage upload failed for ${langPrefix}:`, e);
    throw new Error(`[${langPrefix.toUpperCase()}] 이미지 업로드에 실패했습니다. 네트워크와 관리자 권한을 확인한 뒤 다시 시도해 주세요.`);
  }
}

/**
 * Fetches the currently active popup info from Firestore.
 */
export async function fetchActivePopup(): Promise<ActivePopupInfo> {
  try {
    const docRef = doc(firestore, COLLECTION_NAME, DOC_CURRENT);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as ActivePopupInfo;
      return {
        ...DEFAULT_ACTIVE_POPUP,
        ...data,
        imageUrlKo: data.imageUrlKo || data.imageUrl || DEFAULT_ACTIVE_POPUP.imageUrlKo,
        imageUrlEn: data.imageUrlEn || data.imageUrl || DEFAULT_ACTIVE_POPUP.imageUrlEn,
        imageUrlJa: data.imageUrlJa || data.imageUrl || DEFAULT_ACTIVE_POPUP.imageUrlJa,
        bubbleTextKo: data.bubbleTextKo || data.bubbleText || DEFAULT_ACTIVE_POPUP.bubbleTextKo,
        bubbleTextEn: data.bubbleTextEn || DEFAULT_ACTIVE_POPUP.bubbleTextEn,
        bubbleTextJa: data.bubbleTextJa || DEFAULT_ACTIVE_POPUP.bubbleTextJa
      };
    }
  } catch (error) {
    console.warn('Failed to fetch from Firestore, checking localStorage:', error);
  }

  try {
    const cached = localStorage.getItem('meatguide_active_popup');
    if (cached) {
      return JSON.parse(cached) as ActivePopupInfo;
    }
  } catch (_) {}

  return DEFAULT_ACTIVE_POPUP;
}

/**
 * Subscribes to real-time changes of the active popup info.
 */
export function subscribeToActivePopup(callback: (info: ActivePopupInfo) => void): () => void {
  const docRef = doc(firestore, COLLECTION_NAME, DOC_CURRENT);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as ActivePopupInfo;
      callback({
        ...DEFAULT_ACTIVE_POPUP,
        ...data,
        imageUrlKo: data.imageUrlKo || data.imageUrl || DEFAULT_ACTIVE_POPUP.imageUrlKo,
        imageUrlEn: data.imageUrlEn || data.imageUrl || DEFAULT_ACTIVE_POPUP.imageUrlEn,
        imageUrlJa: data.imageUrlJa || data.imageUrl || DEFAULT_ACTIVE_POPUP.imageUrlJa,
        bubbleTextKo: data.bubbleTextKo || data.bubbleText || DEFAULT_ACTIVE_POPUP.bubbleTextKo,
        bubbleTextEn: data.bubbleTextEn || DEFAULT_ACTIVE_POPUP.bubbleTextEn,
        bubbleTextJa: data.bubbleTextJa || DEFAULT_ACTIVE_POPUP.bubbleTextJa
      });
    } else {
      callback(DEFAULT_ACTIVE_POPUP);
    }
  }, (error) => {
    console.warn('Snapshot listener error, fallback to default:', error);
    callback(DEFAULT_ACTIVE_POPUP);
  });
}

/**
 * Multi-Language Upload and Apply Function.
 * Uploads any new image files (KO, EN, JA) and updates active_popup/current in Firestore.
 */
export async function uploadAndApplyMultiLangPopup(
  files: { ko: File | null; en: File | null; ja: File | null },
  bubbleTexts: { ko: string; en: string; ja: string },
  currentInfo: ActivePopupInfo,
  onProgress?: (progressPercent: number) => void,
  powerSettings?: {
    autoRebootEnabled?: boolean;
    autoRebootTime?: string;
    screenTimeoutMinutes?: number;
    characterPosition?: 'RIGHT_TOP' | 'LEFT_TOP';
  }
): Promise<ActivePopupInfo> {
  const timestamp = Date.now();
  let urlKo = currentInfo.imageUrlKo || currentInfo.imageUrl;
  let urlEn = currentInfo.imageUrlEn || currentInfo.imageUrl;
  let urlJa = currentInfo.imageUrlJa || currentInfo.imageUrl;
  let mainFileName = currentInfo.fileName;
  let totalFileSize = currentInfo.fileSize;

  // Validate any provided files first
  for (const [lang, file] of Object.entries(files)) {
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(`[${lang.toUpperCase()}] ${validation.error}`);
      }
    }
  }

  // Upload KO image if provided
  if (files.ko) {
    urlKo = await uploadSingleFile(files.ko, 'ko', (p) => onProgress?.(Math.round(p * 0.33)));
    mainFileName = files.ko.name;
    totalFileSize = files.ko.size;
  }

  // Upload EN image if provided
  if (files.en) {
    urlEn = await uploadSingleFile(files.en, 'en', (p) => onProgress?.(33 + Math.round(p * 0.33)));
    if (!files.ko) mainFileName = files.en.name;
  }

  // Upload JA image if provided
  if (files.ja) {
    urlJa = await uploadSingleFile(files.ja, 'ja', (p) => onProgress?.(66 + Math.round(p * 0.34)));
    if (!files.ko && !files.en) mainFileName = files.ja.name;
  }

  const newVersion = currentInfo.version + 1;
  const newPopupInfo: ActivePopupInfo = {
    imageUrl: urlKo, // Base default
    imageUrlKo: urlKo,
    imageUrlEn: urlEn,
    imageUrlJa: urlJa,
    version: newVersion,
    updatedAt: new Date().toISOString(),
    fileName: mainFileName,
    fileSize: totalFileSize,
    checksum: `crc_${timestamp}_v${newVersion}`,
    bubbleText: bubbleTexts.ko.trim() || DEFAULT_ACTIVE_POPUP.bubbleTextKo || '이 고기가 어떤 부위인지 궁금하신가요?',
    bubbleTextKo: bubbleTexts.ko.trim() || DEFAULT_ACTIVE_POPUP.bubbleTextKo || '이 고기가 어떤 부위인지 궁금하신가요?',
    bubbleTextEn: bubbleTexts.en.trim() || DEFAULT_ACTIVE_POPUP.bubbleTextEn || 'Wondering which cut of meat this is?',
    bubbleTextJa: bubbleTexts.ja.trim() || DEFAULT_ACTIVE_POPUP.bubbleTextJa || 'このお肉がどの部位か気になりますか？',
    autoRebootEnabled: powerSettings?.autoRebootEnabled !== undefined ? powerSettings.autoRebootEnabled : (currentInfo.autoRebootEnabled ?? true),
    autoRebootTime: powerSettings?.autoRebootTime || currentInfo.autoRebootTime || '10:00',
    screenTimeoutMinutes: powerSettings?.screenTimeoutMinutes !== undefined ? powerSettings.screenTimeoutMinutes : (currentInfo.screenTimeoutMinutes ?? 60),
    characterPosition: powerSettings?.characterPosition || currentInfo.characterPosition || 'RIGHT_TOP'
  };

  try {
    const docRef = doc(firestore, COLLECTION_NAME, DOC_CURRENT);
    await setDoc(docRef, newPopupInfo);
    onProgress?.(100);
    console.log('Successfully saved to Firestore active_popup/current version', newVersion);
  } catch (e) {
    console.error('Firestore setDoc failed:', e);
    throw new Error('설정을 서버에 저장하지 못했습니다. 관리자 권한과 네트워크 연결을 확인한 뒤 다시 시도해 주세요.');
  }

  return newPopupInfo;
}
