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
  imageUrl: '/assets/pork_guide_poster.jpg',
  version: 1,
  updatedAt: new Date().toISOString(),
  fileName: 'pork_guide_poster.jpg',
  fileSize: 455717,
  checksum: 'default_v1_pork_guide',
  bubbleText: '이 고기가 어떤 부위인지 궁금하신가요?'
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
 * Fetches the currently active popup info from Firestore.
 */
export async function fetchActivePopup(): Promise<ActivePopupInfo> {
  try {
    const docRef = doc(firestore, COLLECTION_NAME, DOC_CURRENT);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as ActivePopupInfo;
    }
  } catch (error) {
    console.warn('Failed to fetch from Firestore, using local default:', error);
  }
  return DEFAULT_ACTIVE_POPUP;
}

/**
 * Subscribes to real-time changes of the active popup info.
 */
export function subscribeToActivePopup(callback: (info: ActivePopupInfo) => void): () => void {
  const docRef = doc(firestore, COLLECTION_NAME, DOC_CURRENT);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as ActivePopupInfo);
    } else {
      callback(DEFAULT_ACTIVE_POPUP);
    }
  }, (error) => {
    console.warn('Snapshot listener error, fallback to default:', error);
    callback(DEFAULT_ACTIVE_POPUP);
  });
}

/**
 * Uploads a new image file to Firebase Storage and updates active_popup/current in Firestore.
 */
export async function uploadAndApplyPopupImage(
  file: File,
  currentVersion: number,
  onProgress?: (progressPercent: number) => void
): Promise<ActivePopupInfo> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || '유효하지 않은 이미지 파일입니다.');
  }

  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `popups/${timestamp}_${sanitizedFileName}`;
  const storageRef = ref(storage, storagePath);

  // 1. Upload to Storage
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString()
    }
  });

  const downloadUrl = await new Promise<string>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(progress);
      },
      (error) => {
        console.error('Storage upload error:', error);
        reject(new Error(`이미지 업로드 실패: ${error.message}`));
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

  // 2. Generate simple checksum/hash string
  const simpleChecksum = `crc_${timestamp}_${file.size}`;

  // 3. Create updated popup info
  const newVersion = currentVersion + 1;
  const newPopupInfo: ActivePopupInfo = {
    imageUrl: downloadUrl,
    version: newVersion,
    updatedAt: new Date().toISOString(),
    fileName: file.name,
    fileSize: file.size,
    checksum: simpleChecksum,
    bubbleText: '이 고기가 어떤 부위인지 궁금하신가요?'
  };

  // 4. Update Firestore active_popup/current
  const docRef = doc(firestore, COLLECTION_NAME, DOC_CURRENT);
  await setDoc(docRef, newPopupInfo);

  return newPopupInfo;
}
