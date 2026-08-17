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
  Info
} from 'lucide-react';
import { ActivePopupInfo } from '../types/popup';
import {
  fetchActivePopup,
  subscribeToActivePopup,
  uploadAndApplyPopupImage,
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    fetchActivePopup().then(setActivePopup).catch(console.error);

    const unsubscribe = subscribeToActivePopup((info) => {
      setActivePopup(info);
    });

    return () => unsubscribe();
  }, []);

  // Cleanup object URL preview when file changes
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      setPreviewSource('current');
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    setPreviewSource('selected'); // Auto-switch preview to the new file!

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || '유효하지 않은 파일입니다.');
      return;
    }

    setSelectedFile(file);
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
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleCancelSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    setPreviewSource('current');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyToTablet = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await uploadAndApplyPopupImage(
        selectedFile,
        activePopup.version,
        (progress) => setUploadProgress(progress)
      );

      setActivePopup(updated);
      setSelectedFile(null);
      setPreviewUrl(null);
      setPreviewSource('current');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setSuccessMessage(`태블릿 적용이 완료되었습니다. (버전 ${updated.version})`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to apply image:', err);
      setErrorMessage(err.message || '이미지 적용 중 오류가 발생했습니다.');
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
            <FileImage size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              고기 부위 안내 이미지 관리
            </h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>
              태블릿에 표시할 완성된 안내 이미지를 등록하고 적용합니다.
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
      <main style={{ maxWidth: '1320px', margin: '28px auto', padding: '0 24px' }}>
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
          gridTemplateColumns: 'minmax(380px, 480px) minmax(460px, 1fr)',
          gap: '28px',
          alignItems: 'start'
        }}>
          {/* ==================================================== */}
          {/* LEFT COLUMN: Image Registration & Management Area */}
          {/* ==================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 1. New Image Registration Card */}
            <section style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  새 이미지 등록
                </h2>
                {selectedFile && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#FFFBEB',
                    color: '#B45309',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid #FDE68A'
                  }}>
                    미리보기 중 (미적용)
                  </span>
                )}
              </div>

              {/* Drag and Drop Zone or Preview */}
              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    minHeight: '220px',
                    border: `2px dashed ${isDragging ? '#E11D48' : '#CBD5E1'}`,
                    backgroundColor: isDragging ? '#FFF1F2' : '#FAFAFA',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '28px 20px',
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
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                    style={{ display: 'none' }}
                  />

                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '26px',
                    backgroundColor: '#FEE2E2',
                    color: '#E11D48',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px'
                  }}>
                    <UploadCloud size={26} />
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    이미지 파일을 끌어다 놓거나 클릭하여 선택
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
                    완성된 팝업 안내 이미지 한 장을 업로드합니다.
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {['PNG', 'JPG', 'JPEG', 'WebP'].map((fmt) => (
                      <span
                        key={fmt}
                        style={{
                          backgroundColor: '#F1F5F9',
                          color: '#475569',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {fmt}
                      </span>
                    ))}
                    <span style={{ fontSize: '11px', color: '#94A3B8', padding: '3px 4px' }}>
                      (최대 25MB)
                    </span>
                  </div>
                </div>
              ) : (
                /* Selected File Summary Container */
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FAFAFA',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '12px 14px',
                    backgroundColor: '#FFFFFF',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <FileImage size={18} color="#E11D48" />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {selectedFile.name}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        ({formatFileSize(selectedFile.size)})
                      </span>
                    </div>

                    <button
                      onClick={handleCancelSelection}
                      disabled={isUploading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      <X size={16} />
                      <span>선택 취소</span>
                    </button>
                  </div>

                  <div style={{
                    padding: '10px 14px',
                    backgroundColor: '#FFFBEB',
                    borderBottom: '1px solid #FEF3C7',
                    fontSize: '12px',
                    color: '#B45309',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Info size={14} color="#D97706" />
                    <span>우측 태블릿 미리보기에서 실제 화면을 확인한 후 아래 적용 버튼을 누르세요.</span>
                  </div>
                </div>
              )}

              {/* Upload Progress Bar */}
              {isUploading && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>
                    <span>태블릿에 이미지 전송 중...</span>
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
              <div style={{ marginTop: '20px' }}>
                <button
                  onClick={handleApplyToTablet}
                  disabled={!selectedFile || isUploading}
                  style={{
                    width: '100%',
                    height: '50px',
                    backgroundColor: !selectedFile || isUploading ? '#CBD5E1' : '#E11D48',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: !selectedFile || isUploading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: !selectedFile || isUploading ? 'none' : '0 4px 12px rgba(225, 29, 72, 0.25)',
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

            {/* 2. Current Active Image Metadata Card */}
            <section style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  현재 배포 중인 정보
                </h3>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #A7F3D0'
                }}>
                  버전 {activePopup.version}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>파일명:</span>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>{activePopup.fileName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>파일 용량:</span>
                  <span style={{ fontWeight: 600 }}>{formatFileSize(activePopup.fileSize)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>마지막 적용:</span>
                  <span style={{ fontWeight: 600 }}>{formatDate(activePopup.updatedAt)}</span>
                </div>
              </div>
            </section>
          </div>

          {/* ==================================================== */}
          {/* RIGHT COLUMN: Interactive Tablet Preview Viewer */}
          {/* ==================================================== */}
          <div>
            <TabletPreviewViewer
              currentImageUrl={activePopup.imageUrl}
              selectedImageUrl={previewUrl}
              selectedFileName={selectedFile?.name}
              activeSource={previewSource}
              onSourceChange={setPreviewSource}
              bubbleText={activePopup.bubbleText}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
