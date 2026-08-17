import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  FileImage,
  RefreshCw,
  Sparkles,
  LogOut,
  MessageSquare,
  Globe,
  Languages
} from 'lucide-react';
import { ActivePopupInfo, SupportedLanguage } from '../types/popup';
import {
  fetchActivePopup,
  subscribeToActivePopup,
  uploadAndApplyMultiLangPopup,
  validateImageFile,
  DEFAULT_ACTIVE_POPUP
} from '../services/popupService';
import { TabletPreviewViewer } from './TabletPreviewViewer';

interface Props {
  onLogout: () => void;
  userEmail?: string | null;
}

export const PopupImageManager: React.FC<Props> = ({ onLogout, userEmail }) => {
  const [activePopup, setActivePopup] = useState<ActivePopupInfo>(DEFAULT_ACTIVE_POPUP);

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

  // Active source toggle for the preview viewer: 'current' vs 'selected'
  const [previewSource, setPreviewSource] = useState<'current' | 'selected'>('current');

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time updates of active popup
  useEffect(() => {
    fetchActivePopup().then((info) => {
      setActivePopup(info);
      setBubbleTexts({
        ko: info.bubbleTextKo || info.bubbleText || DEFAULT_ACTIVE_POPUP.bubbleTextKo!,
        en: info.bubbleTextEn || DEFAULT_ACTIVE_POPUP.bubbleTextEn!,
        ja: info.bubbleTextJa || DEFAULT_ACTIVE_POPUP.bubbleTextJa!
      });
    }).catch(console.error);

    const unsubscribe = subscribeToActivePopup((info) => {
      setActivePopup(info);
      setBubbleTexts({
        ko: info.bubbleTextKo || info.bubbleText || DEFAULT_ACTIVE_POPUP.bubbleTextKo!,
        en: info.bubbleTextEn || DEFAULT_ACTIVE_POPUP.bubbleTextEn!,
        ja: info.bubbleTextJa || DEFAULT_ACTIVE_POPUP.bubbleTextJa!
      });
    });

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

  const hasChanges = hasAnyFileSelected || hasBubbleTextChanged;

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
        (progress) => setUploadProgress(progress)
      );

      setActivePopup(updated);
      setSelectedFiles({ ko: null, en: null, ja: null });
      setPreviewSource('current');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setSuccessMessage(`태블릿 다국어(한·영·일) 적용이 완료되었습니다. (버전 ${updated.version})`);
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
              고기 부위 안내 다국어 관리 (한·영·일)
            </h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>
              3개 국어(한글/영어/일어) 팝업 이미지 및 3초 순환 말풍선 문구를 통합 관리합니다.
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
          <button
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
          </button>
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
            {/* 1. Speech Bubble Text Multi-Language Customization */}
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
                    말풍선 3초 순환 문구 (한·영·일)
                  </h2>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#FFF0F5',
                  color: '#E11D48',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  3초마다 자동 순환
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 14px 0' }}>
                태블릿 키오스크 화면에서 돼지 캐릭터 옆 말풍선이 3초 주기로 한글 ➔ 영어 ➔ 일본어로 자동 순환합니다.
              </p>

              {/* 3 Language Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Korean */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    <span>🇰🇷 한국어 (기본)</span>
                  </label>
                  <input
                    type="text"
                    value={bubbleTexts.ko}
                    onChange={(e) => setBubbleTexts((prev) => ({ ...prev, ko: e.target.value }))}
                    placeholder="이 고기가 어떤 부위인지 궁금하신가요?"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13px',
                      color: '#0F172A',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                </div>

                {/* English */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    <span>🇺🇸 English (영어)</span>
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
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Japanese */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    <span>🇯🇵 日本語 (일본어)</span>
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
                      outline: 'none'
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
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px', fontWeight: 600 }}>
                  선택된 언어: <strong>{langMetadata[activeUploadLang].flag} {langMetadata[activeUploadLang].label}</strong> ({langMetadata[activeUploadLang].hint})
                </div>

                {!selectedFiles[activeUploadLang] ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      minHeight: '160px',
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
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileSelect(e.target.files[0], activeUploadLang);
                        }
                      }}
                      style={{ display: 'none' }}
                    />

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
                      {langMetadata[activeUploadLang].label} 이미지 선택 또는 드래그
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      PNG, JPG, JPEG, WebP (최대 25MB)
                    </div>
                  </div>
                ) : (
                  /* Selected File Box */
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FAFAFA',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '10px 12px',
                      backgroundColor: '#FFFFFF',
                      borderBottom: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <FileImage size={16} color="#E11D48" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {selectedFiles[activeUploadLang]!.name}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>
                          ({formatFileSize(selectedFiles[activeUploadLang]!.size)})
                        </span>
                      </div>

                      <button
                        onClick={() => handleCancelSelection(activeUploadLang)}
                        disabled={isUploading}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748B',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        <X size={14} />
                        <span>선택 취소</span>
                      </button>
                    </div>
                    <div style={{ padding: '8px 12px', backgroundColor: '#FFFBEB', fontSize: '11px', color: '#B45309' }}>
                      우측 태블릿 뷰어 상단 <strong>[{langMetadata[activeUploadLang].label}]</strong> 탭을 누르면 선택한 이미지가 미리 표시됩니다.
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>
                    <span>태블릿에 다국어 데이터 전송 중...</span>
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

              {/* Single Apply Button */}
              <div style={{ marginTop: '16px' }}>
                <button
                  onClick={handleApplyToTablet}
                  disabled={!hasChanges || isUploading}
                  style={{
                    width: '100%',
                    height: '50px',
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
                    boxShadow: !hasChanges || isUploading ? 'none' : '0 4px 12px rgba(225, 29, 72, 0.25)',
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
                      <span>다국어(한·영·일) 태블릿에 적용</span>
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
            />
          </div>
        </div>
      </main>
    </div>
  );
};
