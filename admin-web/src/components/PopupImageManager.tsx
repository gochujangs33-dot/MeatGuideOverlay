import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Sparkles,
  LogOut,
  MessageSquare,
  Globe,
  Languages,
  Wand2,
  Power,
  Clock
} from 'lucide-react';
import { ActivePopupInfo, DeviceStatus, SupportedLanguage } from '../types/popup';
import { collection, firestore, onSnapshot } from '../services/firebase';
import {
  fetchActivePopup,
  subscribeToActivePopup,
  uploadAndApplyMultiLangPopup,
  validateImageFile,
  DEFAULT_ACTIVE_POPUP
} from '../services/popupService';
import { autoTranslateKoreanToAll } from '../services/translationService';
import { TabletPreviewViewer } from './TabletPreviewViewer';

interface Props {
  onLogout?: () => void;
  userEmail?: string | null;
}

export const PopupImageManager: React.FC<Props> = ({ onLogout, userEmail }) => {
  const [activePopup, setActivePopup] = useState<ActivePopupInfo>(DEFAULT_ACTIVE_POPUP);
  const [deviceStatuses, setDeviceStatuses] = useState<DeviceStatus[]>([]);
  const expectedAppVersionCode = 17;

  // Selected files per language
  const [selectedFiles, setSelectedFiles] = useState<{
    ko: File | null;
    en: File | null;
    ja: File | null;
  }>({
    ko: null,
    en: null,
    ja: null
  });

  // Local object URLs for previews
  const [previewUrls, setPreviewUrls] = useState<{
    ko: string | null;
    en: string | null;
    ja: string | null;
  }>({
    ko: null,
    en: null,
    ja: null
  });

  // Current active editing language tab in admin upload panel
  const [activeUploadLang, setActiveUploadLang] = useState<SupportedLanguage>('ko');
  const fileTargetLangRef = useRef<SupportedLanguage>('ko');

  // Editable Speech Bubble Texts in 3 languages
  const [bubbleTexts, setBubbleTexts] = useState<{
    ko: string;
    en: string;
    ja: string;
  }>({
    ko: DEFAULT_ACTIVE_POPUP.bubbleTextKo || '이 고기가 어떤 부위인지 궁금하신가요?',
    en: DEFAULT_ACTIVE_POPUP.bubbleTextEn || 'Wondering which cut of meat this is?',
    ja: DEFAULT_ACTIVE_POPUP.bubbleTextJa || 'このお肉がどの部位か気になりますか？'
  });

  // Automatic reboot is retired (app v1.0.17+); every save keeps it off.
  const [popupAutoCloseMinutes, setPopupAutoCloseMinutes] = useState<number>(5);
  // The kiosk helper is fixed to the top-left corner on every tablet.
  const characterPosition = 'LEFT_TOP' as const;

  // Auto-translation state
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [autoTranslatedFlag, setAutoTranslatedFlag] = useState<boolean>(false);
  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Active source toggle for the preview viewer: 'current' vs 'selected'
  const [previewSource, setPreviewSource] = useState<'current' | 'selected'>('current');

  // Saving is blocked until the real server state has been loaded at least once.
  const [isServerStateLoaded, setIsServerStateLoaded] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time updates of active popup
  useEffect(() => {
    const applyServerState = (info: ActivePopupInfo) => {
      setActivePopup(info);
      setBubbleTexts({
        ko: info.bubbleTextKo || info.bubbleText || DEFAULT_ACTIVE_POPUP.bubbleTextKo!,
        en: info.bubbleTextEn || DEFAULT_ACTIVE_POPUP.bubbleTextEn!,
        ja: info.bubbleTextJa || DEFAULT_ACTIVE_POPUP.bubbleTextJa!
      });
      setPopupAutoCloseMinutes(Math.max(0, Math.min(720, info.popupAutoCloseMinutes ?? 5)));
      setIsServerStateLoaded(true);
    };
    const reportLoadError = (error: unknown) => {
      console.error('Failed to load active popup:', error);
      setErrorMessage('서버에서 현재 설정을 불러오지 못했습니다. 기존 설정을 덮어쓰지 않도록 적용을 막았습니다. 네트워크를 확인한 뒤 새로고침해 주세요.');
    };

    fetchActivePopup().then(applyServerState).catch(reportLoadError);
    const unsubscribe = subscribeToActivePopup(applyServerState, reportLoadError);

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, 'devices'),
      (snapshot) => {
        setDeviceStatuses(snapshot.docs.map((device) => ({
          id: device.id,
          ...(device.data() as Omit<DeviceStatus, 'id'>)
        })));
      },
      (error) => {
        console.warn('Failed to load tablet statuses:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Update object URL previews when files change
  useEffect(() => {
    const urls: { ko: string | null; en: string | null; ja: string | null } = {
      ko: selectedFiles.ko ? URL.createObjectURL(selectedFiles.ko) : null,
      en: selectedFiles.en ? URL.createObjectURL(selectedFiles.en) : null,
      ja: selectedFiles.ja ? URL.createObjectURL(selectedFiles.ja) : null
    };
    setPreviewUrls(urls);

    const hasAny = !!(selectedFiles.ko || selectedFiles.en || selectedFiles.ja);
    if (hasAny) {
      setPreviewSource('selected');
    } else {
      setPreviewSource('current');
    }

    return () => {
      if (urls.ko) URL.revokeObjectURL(urls.ko);
      if (urls.en) URL.revokeObjectURL(urls.en);
      if (urls.ja) URL.revokeObjectURL(urls.ja);
    };
  }, [selectedFiles]);

  // Execute Translation Function
  const handlePerformTranslation = async (koreanText: string) => {
    if (!koreanText.trim()) return;

    setIsTranslating(true);
    try {
      const translated = await autoTranslateKoreanToAll(koreanText);
      setBubbleTexts((prev) => ({
        ...prev,
        en: translated.en,
        ja: translated.ja
      }));
      setAutoTranslatedFlag(true);
    } catch (err) {
      console.warn('Auto translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Handle Korean input change with debounced auto-translation
  const handleKoreanBubbleTextChange = (text: string) => {
    setBubbleTexts((prev) => ({ ...prev, ko: text }));
    setAutoTranslatedFlag(false);

    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current);
    }

    if (text.trim().length > 1) {
      translationTimeoutRef.current = setTimeout(() => {
        handlePerformTranslation(text);
      }, 650);
    }
  };

  const handleFileSelect = (file: File, lang: SupportedLanguage) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(`[${lang.toUpperCase()}] ${validation.error || '유효하지 않은 파일입니다.'}`);
      return;
    }

    setSelectedFiles((prev) => ({
      ...prev,
      [lang]: file
    }));
  };

  const openFilePicker = (lang: SupportedLanguage) => {
    fileTargetLangRef.current = lang;
    setActiveUploadLang(lang);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0], activeUploadLang);
    }
  };

  const handleCancelSelection = (lang: SupportedLanguage) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [lang]: null
    }));
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasAnyFileSelected = !!(selectedFiles.ko || selectedFiles.en || selectedFiles.ja);
  const hasBubbleTextChanged =
    bubbleTexts.ko.trim() !== (activePopup.bubbleTextKo || activePopup.bubbleText || '').trim() ||
    bubbleTexts.en.trim() !== (activePopup.bubbleTextEn || '').trim() ||
    bubbleTexts.ja.trim() !== (activePopup.bubbleTextJa || '').trim();

  const hasPowerSettingsChanged =
    popupAutoCloseMinutes !== (activePopup.popupAutoCloseMinutes ?? 5);

  const hasChanges = isServerStateLoaded && (hasAnyFileSelected || hasBubbleTextChanged || hasPowerSettingsChanged);

  const handleApplyToTablet = async () => {
    if (!hasChanges) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await uploadAndApplyMultiLangPopup(
        selectedFiles,
        bubbleTexts,
        activePopup,
        (progress) => setUploadProgress(progress),
        {
          autoRebootEnabled: false,
          // Tablets stay on while open; staff turn the screen off after closing.
          screenTimeoutMinutes: 0,
          popupAutoCloseMinutes,
          characterPosition
        }
      );

      setActivePopup(updated);
      setSelectedFiles({ ko: null, en: null, ja: null });
      setPreviewSource('current');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setSuccessMessage(`태블릿 적용이 완료되었습니다. (버전 ${updated.version})`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to apply popup:', err);
      setErrorMessage(err.message || '적용 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '미등록';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const formatDeviceLastSeen = (value: unknown) => {
    if (!value) return '연결 기록 없음';
    try {
      const timestamp = value as { toDate?: () => Date };
      const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(String(value));
      return formatDate(date.toISOString());
    } catch {
      return '시간 확인 중';
    }
  };

  const isDeviceOnline = (value: unknown) => {
    if (!value) return false;
    try {
      const timestamp = value as { toDate?: () => Date };
      const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(String(value));
      return Date.now() - date.getTime() < 10 * 60 * 1000;
    } catch {
      return false;
    }
  };

  const currentActiveImages = {
    ko: activePopup.imageUrlKo || activePopup.imageUrl,
    en: activePopup.imageUrlEn || activePopup.imageUrl,
    ja: activePopup.imageUrlJa || activePopup.imageUrl
  };

  const langMetadata: Record<SupportedLanguage, { label: string; flag: string; hint: string }> = {
    ko: { label: '한국어', flag: '🇰🇷', hint: '기본 한글 팝업 이미지' },
    en: { label: 'English', flag: '🇺🇸', hint: '영어 팝업 이미지 (English Menu Poster)' },
    ja: { label: '日本語', flag: '🇯🇵', hint: '일본어 팝업 이미지 (日本語案内ポスター)' }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', color: '#1E293B', fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Top Header Bar */}
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '16px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: '#FFF0F5',
            padding: '8px',
            borderRadius: '10px',
            color: '#E11D48',
            display: 'flex'
          }}>
            <Globe size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              고기 부위 안내 다국어 관리 (한·영·일 자동 번역)
            </h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>
              한글 문구를 입력하면 영어·일본어로 자동 번역되며 3초마다 순환합니다.
            </p>
          </div>
        </div>

        {/* Right Admin Profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {userEmail && (
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
              {userEmail}
            </span>
          )}
          {onLogout && <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={16} />
            <span>로그아웃</span>
          </button>}
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1380px', margin: '28px auto', padding: '0 24px' }}>
        {/* Banner Alert Messages */}
        {successMessage && (
          <div style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#166534',
            boxShadow: '0 2px 4px rgba(22, 101, 52, 0.05)'
          }}>
            <CheckCircle2 size={20} color="#16A34A" />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#991B1B',
            boxShadow: '0 2px 4px rgba(153, 27, 27, 0.05)'
          }}>
            <AlertCircle size={20} color="#DC2626" />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{errorMessage}</span>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(420px, 540px) minmax(480px, 1fr)',
          gap: '28px',
          alignItems: 'start'
        }}>
          {/* ==================================================== */}
          {/* LEFT COLUMN: Multi-Language Registration & Management Area */}
          {/* ==================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 0. Connected Tablet Status */}
            <section style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    연결된 태블릿 현황
                  </h2>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0' }}>
                    설정 마법사에서 입력한 테이블 번호와 설치된 앱 버전을 표시합니다.
                  </p>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0F766E', backgroundColor: '#F0FDFA', padding: '4px 8px', borderRadius: '6px' }}>
                  {deviceStatuses.length}대 등록
                </span>
              </div>

              {deviceStatuses.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#94A3B8', backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '12px' }}>
                  아직 상태를 보고한 태블릿이 없습니다. 태블릿 앱을 실행하고 인터넷에 연결해 주세요.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[...deviceStatuses]
                    .sort((a, b) => (a.deviceName || a.id).localeCompare(b.deviceName || b.id, 'ko'))
                    .map((device) => {
                      const isLatest = (device.appVersionCode || 0) >= expectedAppVersionCode;
                      const online = isDeviceOnline(device.lastSeen);
                      return (
                        <div key={device.id} style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', backgroundColor: '#F8FAFC' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                              {device.deviceName || '이름 미지정 태블릿'}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: isLatest ? '#059669' : '#DC2626' }}>
                              {isLatest ? '최신 앱' : '업데이트 필요'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px', fontSize: '11px', color: '#64748B' }}>
                            <span>앱 v{device.appVersionName || '확인 중'}</span>
                            <span>콘텐츠 v{device.contentVersion ?? '-'}</span>
                            <span style={{ color: online ? '#059669' : '#94A3B8' }}>{online ? '온라인' : '오프라인'}</span>
                          </div>
                          <div style={{ marginTop: '4px', fontSize: '10px', color: '#94A3B8' }}>
                            {device.model || '모델 확인 중'} · 마지막 보고 {formatDeviceLastSeen(device.lastSeen)}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </section>

            {/* 1. Speech Bubble Text Multi-Language Auto-Translation Card */}
            <section style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={18} color="#E11D48" />
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    말풍선 문구 자동 번역 (한글 ➔ 영·일)
                  </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isTranslating ? (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#EFF6FF',
                      color: '#2563EB',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      <RefreshCw size={11} className="spin-animation" />
                      <span>번역 중...</span>
                    </span>
                  ) : autoTranslatedFlag ? (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#ECFDF5',
                      color: '#059669',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid #A7F3D0'
                    }}>
                      ✓ 자동 번역됨
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#FFF0F5',
                      color: '#E11D48',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      3초 순환
                    </span>
                  )}
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 14px 0' }}>
                한글 문구를 입력하면 영어와 일본어로 <strong>실시간 자동 번역</strong>되어 태블릿에서 3초마다 순환합니다.
              </p>

              {/* 3 Language Inputs with Auto-Translate */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* 1. Korean Input with Instant Auto-Translate Button */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                      <span>🇰🇷 한국어 문구 (입력 시 자동 번역)</span>
                    </label>
                    <button
                      onClick={() => handlePerformTranslation(bubbleTexts.ko)}
                      disabled={isTranslating || !bubbleTexts.ko.trim()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#FFF0F5',
                        border: '1px solid #FBCFE8',
                        color: '#E11D48',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        cursor: isTranslating || !bubbleTexts.ko.trim() ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Wand2 size={12} />
                      <span>AI 번역 실행</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={bubbleTexts.ko}
                    onChange={(e) => handleKoreanBubbleTextChange(e.target.value)}
                    placeholder="예: 이 고기가 어떤 부위인지 궁금하신가요?"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '2px solid #E11D48',
                      fontSize: '13px',
                      color: '#0F172A',
                      fontWeight: 700,
                      outline: 'none',
                      backgroundColor: '#FFF'
                    }}
                  />
                </div>

                {/* 2. English (Auto-translated / Editable) */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    <span>🇺🇸 English (자동 번역 결과)</span>
                    <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>직접 수정 가능</span>
                  </label>
                  <input
                    type="text"
                    value={bubbleTexts.en}
                    onChange={(e) => setBubbleTexts((prev) => ({ ...prev, en: e.target.value }))}
                    placeholder="Wondering which cut of meat this is?"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13px',
                      color: '#0F172A',
                      fontWeight: 600,
                      outline: 'none',
                      backgroundColor: '#F8FAFC'
                    }}
                  />
                </div>

                {/* 3. Japanese (Auto-translated / Editable) */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    <span>🇯🇵 日本語 (자동 번역 결과)</span>
                    <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>직접 수정 가능</span>
                  </label>
                  <input
                    type="text"
                    value={bubbleTexts.ja}
                    onChange={(e) => setBubbleTexts((prev) => ({ ...prev, ja: e.target.value }))}
                    placeholder="このお肉がどの部位か気になりますか？"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13px',
                      color: '#0F172A',
                      fontWeight: 600,
                      outline: 'none',
                      backgroundColor: '#F8FAFC'
                    }}
                  />
                </div>
              </div>
            </section>

            {/* 2. Multi-Language Popup Images Registration Card */}
            <section style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Languages size={18} color="#E11D48" />
                  <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    언어별 팝업 이미지 등록
                  </h2>
                </div>
                {hasAnyFileSelected && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#FFFBEB',
                    color: '#B45309',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid #FDE68A'
                  }}>
                    새 이미지 선택됨 (미적용)
                  </span>
                )}
              </div>

              {/* Language Selection Tabs for Upload: [ 한국어 | English | 日本語 ] */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
                backgroundColor: '#F1F5F9',
                padding: '4px',
                borderRadius: '10px',
                marginBottom: '16px'
              }}>
                {(['ko', 'en', 'ja'] as SupportedLanguage[]).map((lang) => {
                  const meta = langMetadata[lang];
                  const isSelected = activeUploadLang === lang;
                  const hasFile = !!selectedFiles[lang];
                  return (
                    <button
                      key={lang}
                      onClick={() => setActiveUploadLang(lang)}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                        color: isSelected ? '#E11D48' : '#475569',
                        boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>{meta.flag}</span>
                      <span>{meta.label}</span>
                      {hasFile && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '3px', backgroundColor: '#E11D48' }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Upload Drop Zone for Currently Selected Language */}
              <div style={{ marginBottom: '16px' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileSelect(file, fileTargetLangRef.current);
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px', fontWeight: 600 }}>
                  선택된 언어: <strong>{langMetadata[activeUploadLang].flag} {langMetadata[activeUploadLang].label}</strong> ({langMetadata[activeUploadLang].hint})
                </div>

                {!selectedFiles[activeUploadLang] ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => openFilePicker(activeUploadLang)}
                    style={{
                      minHeight: '150px',
                      border: `2px dashed ${isDragging ? '#E11D48' : '#CBD5E1'}`,
                      backgroundColor: isDragging ? '#FFF1F2' : '#FAFAFA',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '21px',
                      backgroundColor: '#FEE2E2',
                      color: '#E11D48',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px'
                    }}>
                      <UploadCloud size={22} />
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
                      {langMetadata[activeUploadLang].label} 이미지 파일 선택 또는 드래그
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      PNG, JPG, JPEG, WebP (최대 25MB)
                    </div>
                  </div>
                ) : (
                  /* Selected File Box with Image Thumbnail Preview */
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '12px',
                    border: '1.5px solid #E11D48',
                    backgroundColor: '#FFF1F2',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}>
                      {/* Image Thumbnail */}
                      {previewUrls[activeUploadLang] && (
                        <div style={{
                          width: '56px',
                          height: '76px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: '1px solid #FDA4AF',
                          backgroundColor: '#FFFFFF',
                          flexShrink: 0
                        }}>
                          <img
                            src={previewUrls[activeUploadLang]!}
                            alt="선택된 이미지 미리보기"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )}

                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            backgroundColor: '#E11D48',
                            color: '#FFFFFF',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>
                            선택 완료
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {selectedFiles[activeUploadLang]!.name}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          용량: {formatFileSize(selectedFiles[activeUploadLang]!.size)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCancelSelection(activeUploadLang)}
                        disabled={isUploading}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          color: '#64748B',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '6px 10px',
                          borderRadius: '6px'
                        }}
                      >
                        <X size={14} />
                        <span>취소</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3-Language Registered Image Overview Grid List */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
                  🖼️ 3개국어 이미지 등록 현황 리스트
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px'
                }}>
                  {(['ko', 'en', 'ja'] as SupportedLanguage[]).map((lang) => {
                    const meta = langMetadata[lang];
                    const hasSelected = !!selectedFiles[lang];
                    const displayUrl = previewUrls[lang] || currentActiveImages[lang];

                    return (
                      <div
                        key={lang}
                        onClick={() => setActiveUploadLang(lang)}
                        style={{
                          border: activeUploadLang === lang ? '2px solid #E11D48' : '1px solid #E2E8F0',
                          backgroundColor: activeUploadLang === lang ? '#FFF1F2' : '#FFFFFF',
                          borderRadius: '10px',
                          padding: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                            {meta.flag} {meta.label}
                          </span>
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            backgroundColor: hasSelected ? '#FEF3C7' : '#ECFDF5',
                            color: hasSelected ? '#D97706' : '#059669',
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}>
                            {hasSelected ? '새 이미지' : '배포 중'}
                          </span>
                        </div>

                        {/* Mini Thumbnail Image */}
                        <div style={{
                          width: '100%',
                          height: '95px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#F8FAFC',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {displayUrl ? (
                            <img
                              src={displayUrl}
                              alt={`${meta.label} 포스터`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>이미지 없음</div>
                          )}
                        </div>

                        {/* File details & Change button */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px' }}>
                          <span style={{ color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>
                            {hasSelected ? selectedFiles[lang]!.name : '등록됨'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openFilePicker(lang);
                            }}
                            style={{
                              backgroundColor: activeUploadLang === lang ? '#E11D48' : '#F1F5F9',
                              color: activeUploadLang === lang ? '#FFFFFF' : '#334155',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '3px 7px',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {hasSelected ? '교체' : '선택'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>
                    <span>태블릿에 데이터 전송 및 설정 적용 중...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      backgroundColor: '#E11D48',
                      transition: 'width 0.2s ease'
                    }} />
                  </div>
                </div>
              )}
            </section>

            {/* 4. Tablet Power & Sleep Schedule Management Card */}
            <section style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Power size={18} color="#E11D48" />
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    팝업 설정 (모든 태블릿 일괄 적용)
                  </h2>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  전체 기기 원클릭 동기화
                </span>
              </div>

              {/* C. Popup Inactivity Auto-Close */}
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '14px 16px',
                marginTop: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Clock size={16} color="#0F766E" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                    팝업 무터치 자동 닫힘
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    (팝업을 연 뒤 터치가 없으면 자동 닫힘)
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {[
                    { label: '1분', value: 1 },
                    { label: '5분 (기본)', value: 5 },
                    { label: '10분', value: 10 },
                    { label: '30분', value: 30 },
                    { label: '1시간', value: 60 },
                    { label: '사용 안 함', value: 0 }
                  ].map((option) => {
                    const isSelected = popupAutoCloseMinutes === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPopupAutoCloseMinutes(option.value)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: isSelected ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
                          backgroundColor: isSelected ? '#F0FDFA' : '#FFFFFF',
                          color: isSelected ? '#0F766E' : '#475569',
                          fontSize: '12px',
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer'
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#475569' }}>직접 입력:</span>
                  <input
                    type="number"
                    min="0"
                    max="720"
                    value={popupAutoCloseMinutes}
                    onChange={(e) => setPopupAutoCloseMinutes(Math.max(0, Math.min(720, parseInt(e.target.value) || 0)))}
                    style={{
                      width: '80px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#64748B' }}>분 (0 = 자동 닫힘 안 함)</span>
                </div>
              </div>

              {/* Single Apply Button */}
              <div style={{ marginTop: '18px' }}>
                <button
                  onClick={handleApplyToTablet}
                  disabled={!hasChanges || isUploading}
                  style={{
                    width: '100%',
                    height: '52px',
                    backgroundColor: !hasChanges || isUploading ? '#CBD5E1' : '#E11D48',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: !hasChanges || isUploading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: !hasChanges || isUploading ? 'none' : '0 4px 14px rgba(225, 29, 72, 0.3)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw size={18} className="spin-animation" />
                      <span>태블릿에 적용 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>태블릿에 적용</span>
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* 3. Current Active Images Status */}
            <section style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '18px 22px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  현재 배포 중인 다국어 버전 정보
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  padding: '2px 7px',
                  borderRadius: '6px',
                  border: '1px solid #A7F3D0'
                }}>
                  버전 {activePopup.version}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#475569' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>마지막 업데이트:</span>
                  <span style={{ fontWeight: 600 }}>{formatDate(activePopup.updatedAt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>등록된 언어:</span>
                  <span style={{ fontWeight: 700, color: '#E11D48' }}>🇰🇷 한국어 · 🇺🇸 English · 🇯🇵 日本語</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>캐릭터 상주 위치:</span>
                  <span style={{ fontWeight: 700, color: '#E11D48' }}>
                    👈 좌측 상단 고정 (말풍선 우측)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>화면 절전 시간:</span>
                  <span style={{ fontWeight: 700, color: '#7C3AED' }}>
                    항상 켜짐 (영업 종료 후 직접 끄기)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>팝업 무터치 자동 닫힘:</span>
                  <span style={{ fontWeight: 700, color: '#0F766E' }}>
                    {activePopup.popupAutoCloseMinutes === 0 ? '사용 안 함' : `${activePopup.popupAutoCloseMinutes ?? 5}분`}
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* ==================================================== */}
          {/* RIGHT COLUMN: Interactive Tablet Preview Viewer */}
          {/* ==================================================== */}
          <div>
            <TabletPreviewViewer
              currentImages={currentActiveImages}
              selectedImages={previewUrls}
              activeSource={previewSource}
              onSourceChange={setPreviewSource}
              bubbleTexts={bubbleTexts}
              characterPosition={characterPosition}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
