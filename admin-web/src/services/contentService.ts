import { ContentManifest, ContentVersionHistoryItem, DeviceStatusDoc } from '../types/content';
import { db, doc, getDoc, setDoc, collection, getDocs } from './firebase';

const LOCAL_STORAGE_DRAFT_KEY = 'meatguide_admin_draft_v1';
const LOCAL_STORAGE_PUBLISHED_KEY = 'meatguide_admin_published_v1';
const LOCAL_STORAGE_HISTORY_KEY = 'meatguide_admin_history_v1';
const LOCAL_STORAGE_DEVICES_KEY = 'meatguide_admin_devices_v1';

export const initialDefaultManifest: ContentManifest = {
  schemaVersion: '1.0.0',
  contentVersion: 1,
  updatedAt: new Date().toISOString(),
  publishedBy: 'admin_initial',
  bubbleText: '이 고기가 어떤 부위인지 궁금하신가요?',
  characterImage: {
    url: '/assets/char_mascot.svg',
    alt: '고기 부위 안내 캐릭터',
    mimeType: 'image/svg+xml',
    fileSize: 12400,
    version: '1.0.0'
  },
  porkCategory: {
    title: '돼지고기 특수부위',
    description: '엄선된 최고급 돼지고기 특수부위의 풍미와 식감을 즐겨보세요.',
    items: [
      {
        id: 'pork_ggodle_neck',
        name: '꼬들목살',
        cutPosition: '돼지 목덜미 위쪽 살코기 부위',
        description: '돼지 한 마리당 약 400g만 얻을 수 있는 귀한 특수부위로, 탄력 있는 육질과 꼬들꼬들한 식감이 매력적입니다.',
        taste: '고소함이 짙고 씹을수록 감칠맛이 진하게 배어 나오는 맛',
        texture: '탱글탱글하고 꼬들꼬들하게 씹히는 독보적인 식감',
        recommendation: '첫 점은 구운 소금에 살짝 찍어 고유의 탄력과 육즙을 느껴보세요.',
        order: 1,
        visible: true,
        imageUrl: '/assets/pork_ggodle.svg',
        silhouetteUrl: '/assets/pig_diagram_neck.svg'
      },
      {
        id: 'pork_hangjeong',
        name: '항정살',
        cutPosition: '돼지 뒷덜미 목과 어깨 사이 부위',
        description: '천 겹의 마블링이라 불리는 천겹살로, 살코기 사이에 촘촘히 박힌 마블링이 특징인 최고 인기 특수부위입니다.',
        taste: '담백하면서도 진한 육즙의 부드러운 고소함',
        texture: '아삭아삭하게 씹히면서 부드럽게 녹아내리는 결',
        recommendation: '생와사비나 매콤한 파채와 곁들이면 느끼함을 잡아주어 더욱 맛있습니다.',
        order: 2,
        visible: true,
        imageUrl: '/assets/pork_hangjeong.svg',
        silhouetteUrl: '/assets/pig_diagram_hangjeong.svg'
      },
      {
        id: 'pork_galmaegi',
        name: '갈매기살',
        cutPosition: '돼지의 횡격막과 간 사이에 위치한 부위',
        description: '소고기의 안창살에 해당하는 부위로 기름기가 적고 단백질과 철분이 풍부하여 육향이 매우 뛰어납니다.',
        taste: '소고기를 연상시키는 짙고 깊은 육향과 담백한 풍미',
        texture: '쫄깃쫄깃하면서도 부드러운 살코기의 결',
        recommendation: '타지 않게 자주 뒤집어가며 미디엄 웰로 구운 후 특제 간장소스에 찍어 드세요.',
        order: 3,
        visible: true,
        imageUrl: '/assets/pork_galmaegi.svg',
        silhouetteUrl: '/assets/pig_diagram_galmaegi.svg'
      },
      {
        id: 'pork_gabri',
        name: '가브리살',
        cutPosition: '돼지 등심 앞부분 위쪽의 덧살 부위',
        description: '등심덧살이라고도 하며, 삼겹살보다 연하고 부드러우며 항정살보다 담백한 황금 밸런스를 자랑합니다.',
        taste: '부드럽고 촉촉하며 자극적이지 않은 고급스러운 고소함',
        texture: '연하고 찰지며 씹을 때 육즙이 부드럽게 퍼지는 느낌',
        recommendation: '멜젓이나 볶은 소금에 찍어 본연의 담백한 풍미를 음미해 보세요.',
        order: 4,
        visible: true,
        imageUrl: '/assets/pork_gabri.svg',
        silhouetteUrl: '/assets/pig_diagram_gabri.svg'
      },
      {
        id: 'pork_samgyeop',
        name: '삼겹살',
        cutPosition: '돼지의 갈비 부근에서 뒷다리 전까지의 복부 부위',
        description: '살코기와 지방이 층을 이루어 대한민국 국민 모두가 사랑하는 대표 부위로 고소한 풍미가 일품입니다.',
        taste: '지방의 고소함과 살코기의 감칠맛이 완벽히 조화된 맛',
        texture: '겉은 바삭하고 속은 촉촉한 겉바속촉의 정석',
        recommendation: '노릇하게 바싹 익혀 신선한 상추쌈, 쌈장, 구운 김치와 함께 드세요.',
        order: 5,
        visible: true,
        imageUrl: '/assets/pork_samgyeop.svg',
        silhouetteUrl: '/assets/pig_diagram_belly.svg'
      },
      {
        id: 'pork_songi',
        name: '송이살',
        cutPosition: '돼지 갈비 뼈 안쪽의 소량 특수 특미 부위',
        description: '송이버섯처럼 결이 살아있고 한 마리에서 극소량만 나오는 특수부위로, 부드러운 감칠맛이 특징입니다.',
        taste: '은은한 육향과 씹을수록 퍼지는 깔끔한 고소함',
        texture: '부드러우면서도 결이 촉촉하게 살아있는 독특한 식감',
        recommendation: '소금 기름장에 가볍게 찍어 은은한 육즙과 부드러움을 즐겨보세요.',
        order: 6,
        visible: true,
        imageUrl: '/assets/pork_songi.svg',
        silhouetteUrl: '/assets/pig_diagram_songi.svg'
      }
    ]
  },
  beefRibItem: {
    id: 'beef_rib_single',
    name: '소생갈비살',
    cutPosition: '갈비뼈 사이의 정선된 꽃갈비살 부위',
    description: '갈비뼈 사이에서 정성스럽게 발라낸 최상급 생갈비살로 육즙과 마블링의 조화가 뛰어납니다.',
    taste: '풍부한 육즙과 진한 소고기 고유의 감칠맛',
    texture: '부드러우면서도 씹을수록 터져 나오는 촉촉한 육즙의 식감',
    characteristics: '마블링이 촘촘하여 숯불에 구웠을 때 최상의 풍미를 냅니다.',
    recommendation: '미디엄 웰 정도로 겉면만 노릇하게 구워 와사비나 소금과 함께 드시면 가장 맛있습니다.',
    imageUrl: '/assets/beef_galbi.svg',
    silhouetteUrl: '/assets/cow_diagram_rib.svg'
  },
  kioskErrorTexts: [
    '서버에 접속이 끊겼습니다',
    '서버 접속 오류',
    '네트워크 연결이 끊어졌습니다',
    '서버와의 연결이 원활하지 않습니다'
  ],
  restartGuide: {
    title: '키오스크 서버 연결 오류',
    message: '키오스크 서버 연결 오류가 발생했습니다. 태블릿의 전원을 완전히 껐다가 다시 켜 주세요.',
    cooldownMinutes: 5,
    allowPowerMenu: true
  },
  uiSettings: {
    autoCloseSeconds: 60,
    speechBubbleMode: 'TIMEOUT_THEN_CHAR_ONLY',
    speechBubbleTimeoutSeconds: 8,
    characterDefaultSide: 'RIGHT',
    touchOutsideDismiss: true
  }
};

export const sampleConnectedDevices: DeviceStatusDoc[] = [
  {
    deviceUid: 'tablet_device_table_01',
    deviceName: '테이블-01',
    deviceModel: 'Samsung Galaxy Tab A8',
    androidVersion: 'Android 13 (API 33)',
    appVersion: '1.0.0 (1)',
    contentVersion: 1,
    lastSeenAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    lastSyncSuccessAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    lastSyncError: '',
    selectedKioskPackage: 'com.antigravity.testkiosk'
  },
  {
    deviceUid: 'tablet_device_table_02',
    deviceName: '테이블-02',
    deviceModel: 'Samsung Galaxy Tab A7 Lite',
    androidVersion: 'Android 11 (API 30)',
    appVersion: '1.0.0 (1)',
    contentVersion: 1,
    lastSeenAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    lastSyncSuccessAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    lastSyncError: '',
    selectedKioskPackage: 'com.antigravity.testkiosk'
  },
  {
    deviceUid: 'tablet_device_table_03',
    deviceName: '테이블-03',
    deviceModel: 'Lenovo Tab M10',
    androidVersion: 'Android 12 (API 32)',
    appVersion: '1.0.0 (1)',
    contentVersion: 1,
    lastSeenAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    lastSyncSuccessAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    lastSyncError: '',
    selectedKioskPackage: 'com.antigravity.testkiosk'
  }
];

export class ContentService {
  /**
   * Load the current published content from Firestore or LocalStorage fallback.
   */
  static async fetchPublishedContent(): Promise<ContentManifest> {
    try {
      const docRef = doc(db, 'published', 'current');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as ContentManifest;
        localStorage.setItem(LOCAL_STORAGE_PUBLISHED_KEY, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('[ContentService] Firestore fetch error, fallback to local storage:', e);
    }

    const localCached = localStorage.getItem(LOCAL_STORAGE_PUBLISHED_KEY);
    if (localCached) {
      try {
        return JSON.parse(localCached);
      } catch (e) {
        // ignore
      }
    }
    return initialDefaultManifest;
  }

  /**
   * Save current draft locally and to Firestore drafts/current if available.
   */
  static async saveDraft(manifest: ContentManifest): Promise<void> {
    localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(manifest));
    try {
      const draftDocRef = doc(db, 'drafts', 'current');
      await setDoc(draftDocRef, { ...manifest, savedAt: new Date().toISOString() });
    } catch (e) {
      console.warn('[ContentService] Could not save draft to Firestore (using local storage):', e);
    }
  }

  /**
   * Load draft.
   */
  static async loadDraft(): Promise<ContentManifest> {
    try {
      const draftDocRef = doc(db, 'drafts', 'current');
      const snap = await getDoc(draftDocRef);
      if (snap.exists()) {
        return snap.data() as ContentManifest;
      }
    } catch (e) {
      // ignore
    }

    const localDraft = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
    if (localDraft) {
      try {
        return JSON.parse(localDraft);
      } catch (e) {
        // ignore
      }
    }
    return this.fetchPublishedContent();
  }

  /**
   * Strict validation before publishing:
   * - Title and speech bubble not empty
   * - Beef menu MUST BE strictly '소생갈비살' (no other beef allowed!)
   * - No prohibited beef items (e.g. 육회, 뿌리살, 업진살) anywhere
   * - At least 1 pork item
   */
  static validateForPublish(manifest: ContentManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!manifest.bubbleText.trim()) {
      errors.push('말풍선 문구를 입력해 주세요.');
    }
    if (!manifest.porkCategory.title.trim()) {
      errors.push('돼지고기 카테고리 제목을 입력해 주세요.');
    }
    if (manifest.porkCategory.items.length === 0) {
      errors.push('최소 1개 이상의 돼지고기 부위가 등록되어야 합니다.');
    }

    for (const [idx, item] of manifest.porkCategory.items.entries()) {
      if (!item.name.trim()) {
        errors.push(`돼지고기 #${idx + 1} 항목의 이름이 비어 있습니다.`);
      }
      if (item.name.includes('육회') || item.name.includes('뿌리살') || item.name.includes('업진살')) {
        errors.push(`금지된 소고기/기타 명칭("${item.name}")은 돼지고기 항목에 포함할 수 없습니다.`);
      }
    }

    const beefName = manifest.beefRibItem.name.trim();
    if (beefName !== '소생갈비살') {
      errors.push('소고기 메뉴는 오직 "소생갈비살" 단일 품목이어야 합니다. (현재: ' + beefName + ')');
    }
    if (beefName.includes('육회') || beefName.includes('뿌리살') || beefName.includes('업진살')) {
      errors.push('금지된 소고기 메뉴(육회, 뿌리살, 업진살 등)는 절대 등록할 수 없습니다.');
    }

    if (manifest.kioskErrorTexts.length === 0) {
      errors.push('최소 1개 이상의 서버 오류 감지 문구가 필요합니다.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Publish content to Firestore `published/current` and save historical snapshot to `content_history/{version}`.
   */
  static async publishContent(manifest: ContentManifest, adminUid: string, summary: string = '관리자 웹 게시'): Promise<number> {
    const validation = this.validateForPublish(manifest);
    if (!validation.valid) {
      throw new Error(`게시 유효성 검사 실패:\n${validation.errors.join('\n')}`);
    }

    const newVersion = (manifest.contentVersion || 1) + 1;
    const nowIso = new Date().toISOString();

    const publishPayload: ContentManifest = {
      ...manifest,
      contentVersion: newVersion,
      updatedAt: nowIso,
      publishedBy: adminUid || 'admin_web'
    };

    // Save to Firestore
    try {
      const pubDocRef = doc(db, 'published', 'current');
      await setDoc(pubDocRef, publishPayload);

      const histDocRef = doc(db, 'content_history', `v${newVersion}`);
      await setDoc(histDocRef, {
        version: newVersion,
        publishedAt: nowIso,
        publishedBy: adminUid || 'admin_web',
        summary,
        manifest: publishPayload
      });
    } catch (e) {
      console.warn('[ContentService] Remote publish failed, updating local state:', e);
    }

    // Update LocalStorage cache & history
    localStorage.setItem(LOCAL_STORAGE_PUBLISHED_KEY, JSON.stringify(publishPayload));
    localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(publishPayload));

    const existingHistoryStr = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    const historyList: ContentVersionHistoryItem[] = existingHistoryStr ? JSON.parse(existingHistoryStr) : [];
    historyList.unshift({
      version: newVersion,
      publishedAt: nowIso,
      publishedBy: adminUid || 'admin_web',
      summary,
      manifest: publishPayload
    });
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(historyList.slice(0, 20)));

    return newVersion;
  }

  /**
   * Fetch historical version snapshots.
   */
  static async fetchVersionHistory(): Promise<ContentVersionHistoryItem[]> {
    try {
      const histCol = collection(db, 'content_history');
      const snap = await getDocs(histCol);
      if (!snap.empty) {
        const items = snap.docs.map(d => d.data() as ContentVersionHistoryItem);
        return items.sort((a, b) => b.version - a.version);
      }
    } catch (e) {
      console.warn('[ContentService] History fetch error, reading local storage:', e);
    }

    const localHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    if (localHistory) {
      try {
        return JSON.parse(localHistory);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        version: 1,
        publishedAt: initialDefaultManifest.updatedAt,
        publishedBy: 'system_init',
        summary: '초기 기본 콘텐츠 배포',
        manifest: initialDefaultManifest
      }
    ];
  }

  /**
   * Fetch list of connected tablet devices.
   */
  static async fetchConnectedDevices(): Promise<DeviceStatusDoc[]> {
    try {
      const devCol = collection(db, 'devices');
      const snap = await getDocs(devCol);
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as DeviceStatusDoc);
      }
    } catch (e) {
      console.warn('[ContentService] Device status fetch error, using sample data:', e);
    }

    const localDev = localStorage.getItem(LOCAL_STORAGE_DEVICES_KEY);
    if (localDev) {
      try {
        return JSON.parse(localDev);
      } catch (e) {
        // ignore
      }
    }
    return sampleConnectedDevices;
  }
}
