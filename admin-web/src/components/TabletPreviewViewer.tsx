import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCw,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle,
  X,
  Move
} from 'lucide-react';
import { SupportedLanguage } from '../types/popup';

interface Props {
  currentImages: { ko: string; en: string; ja: string };
  selectedImages: { ko: string | null; en: string | null; ja: string | null };
  activeSource: 'current' | 'selected';
  onSourceChange: (source: 'current' | 'selected') => void;
  bubbleTexts: { ko: string; en: string; ja: string };
}

export const TabletPreviewViewer: React.FC<Props> = ({
  currentImages,
  selectedImages,
  activeSource,
  onSourceChange,
  bubbleTexts
}) => {
  const [isLandscape, setIsLandscape] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<'16:10' | '16:9' | '4:3'>('16:10');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Popup Modal Language Tab Selection: 'ko' | 'en' | 'ja'
  const [popupLang, setPopupLang] = useState<SupportedLanguage>('ko');

  // Speech Bubble 3-Second Automatic Language Rotation
  const [bubbleLang, setBubbleLang] = useState<SupportedLanguage>('ko');
  const [bubbleFade, setBubbleFade] = useState<boolean>(true);

  // Zoom & Pan state
  const [scale, setScale] = useState<number>(1.0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragTimeRef = useRef<number>(0);
  const hasMovedRef = useRef<boolean>(false);
  const touchDistanceRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Speech bubble 3-second interval cycle: KR -> EN -> JA -> KR
  useEffect(() => {
    if (isOpen) return;

    const interval = setInterval(() => {
      setBubbleFade(false); // start fade-out
      setTimeout(() => {
        setBubbleLang((prev) => {
          if (prev === 'ko') return 'en';
          if (prev === 'en') return 'ja';
          return 'ko';
        });
        setBubbleFade(true); // fade-in new text
      }, 150);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Current active bubble text based on rotating language
  const currentBubbleText = bubbleTexts[bubbleLang] || bubbleTexts.ko;

  // Active displayed image URL for current popupLang
  const displayedImageUrl = activeSource === 'selected' && selectedImages[popupLang]
    ? selectedImages[popupLang]!
    : (currentImages[popupLang] || currentImages.ko);

  const handleResetPreview = useCallback(() => {
    setIsLandscape(true);
    setAspectRatio('16:10');
    setIsOpen(false);
    setPopupLang('ko');
    setScale(1.0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleOpenPopup = () => {
    setIsOpen(true);
    setPopupLang('ko');
    setScale(1.0);
    setPosition({ x: 0, y: 0 });
  };

  const handleClosePopup = () => {
    setIsOpen(false);
    setScale(1.0);
    setPosition({ x: 0, y: 0 });
  };

  const handleSwitchPopupLanguage = (lang: SupportedLanguage) => {
    setPopupLang(lang);
    setScale(1.0);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!isOpen) return;
    e.preventDefault();

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setScale((prev) => {
      const nextScale = Math.min(Math.max(prev * zoomFactor, 1.0), 5.0);
      if (nextScale <= 1.0) {
        setPosition({ x: 0, y: 0 });
      }
      return nextScale;
    });
  };

  // Mouse Down - start panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isOpen) return;
    e.stopPropagation();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = { ...position };
    dragTimeRef.current = Date.now();
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  // Mouse Move - pan image freely
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isOpen || !isDragging) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 3) {
      hasMovedRef.current = true;
    }

    setPosition({
      x: startPosRef.current.x + dx,
      y: startPosRef.current.y + dy
    });
  };

  // Mouse Up - finish panning
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isOpen) return;
    e.stopPropagation();
    setIsDragging(false);

    const elapsed = Date.now() - dragTimeRef.current;
    if (!hasMovedRef.current && elapsed < 250 && e.target === e.currentTarget) {
      handleClosePopup();
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isOpen) return;

    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
      hasMovedRef.current = true;
    } else if (e.touches.length === 1) {
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startPosRef.current = { ...position };
      dragTimeRef.current = Date.now();
      hasMovedRef.current = false;
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isOpen) return;

    if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const factor = newDist / touchDistanceRef.current;

      setScale((prev) => Math.min(Math.max(prev * factor, 1.0), 5.0));
      touchDistanceRef.current = newDist;
      hasMovedRef.current = true;
    } else if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 4) {
        hasMovedRef.current = true;
      }

      setPosition({
        x: startPosRef.current.x + dx,
        y: startPosRef.current.y + dy
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isOpen) return;
    setIsDragging(false);
    touchDistanceRef.current = null;

    const elapsed = Date.now() - dragTimeRef.current;
    if (!hasMovedRef.current && elapsed < 250 && e.target === e.currentTarget) {
      handleClosePopup();
    }
  };

  const hasAnySelected = selectedImages.ko || selectedImages.en || selectedImages.ja;

  // Dimensions based on orientation & aspect ratio
  const getAspectRatioPadding = () => {
    if (aspectRatio === '16:10') return isLandscape ? '62.5%' : '160%';
    if (aspectRatio === '16:9') return isLandscape ? '56.25%' : '177.77%';
    return isLandscape ? '75%' : '133.33%';
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #E2E8F0',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Header & Status Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            태블릿 미리보기 뷰어
          </h2>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
            말풍선 상단에 KR / EN / JA가 표시되며, 팝업 좌측 상단에서 언어를 변경합니다.
          </p>
        </div>

        {/* Source Status Badge */}
        {activeSource === 'selected' ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            color: '#B45309',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700
          }}>
            <AlertTriangle size={14} color="#D97706" />
            <span>미리보기 중 (미적용)</span>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#059669',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700
          }}>
            <CheckCircle2 size={14} color="#059669" />
            <span>현재 적용 이미지 표시 중</span>
          </div>
        )}
      </div>

      {/* Control Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        padding: '10px 14px',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Source Switcher */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#E2E8F0', padding: '3px', borderRadius: '8px' }}>
          <button
            onClick={() => onSourceChange('current')}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              borderRadius: '6px',
              backgroundColor: activeSource === 'current' ? '#FFFFFF' : 'transparent',
              color: activeSource === 'current' ? '#0F172A' : '#64748B',
              cursor: 'pointer',
              boxShadow: activeSource === 'current' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            현재 적용 이미지
          </button>
          <button
            onClick={() => hasAnySelected && onSourceChange('selected')}
            disabled={!hasAnySelected}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              borderRadius: '6px',
              backgroundColor: activeSource === 'selected' ? '#E11D48' : 'transparent',
              color: activeSource === 'selected' ? '#FFFFFF' : (!hasAnySelected ? '#94A3B8' : '#64748B'),
              cursor: !hasAnySelected ? 'not-allowed' : 'pointer',
              boxShadow: activeSource === 'selected' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            새 이미지 미리보기
          </button>
        </div>

        {/* Orientation & Ratio & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Orientation Toggle */}
          <button
            onClick={() => setIsLandscape(!isLandscape)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <RotateCw size={13} />
            <span>{isLandscape ? '세로 보기' : '가로 보기'}</span>
          </button>

          {/* Aspect Ratio Selector */}
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as any)}
            style={{
              padding: '5px 8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <option value="16:10">16:10</option>
            <option value="16:9">16:9</option>
            <option value="4:3">4:3</option>
          </select>

          {/* Reset Preview */}
          <button
            onClick={handleResetPreview}
            title="미리보기 초기화"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              color: '#64748B',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} />
            <span>초기화</span>
          </button>
        </div>
      </div>

      {/* Tablet Device Frame */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E293B',
        borderRadius: '16px',
        padding: '24px 16px',
        overflow: 'hidden',
        minHeight: '460px'
      }}>
        {/* Tablet Outer Body */}
        <div style={{
          width: isLandscape ? '100%' : '340px',
          maxWidth: isLandscape ? '580px' : '340px',
          backgroundColor: '#0F172A',
          borderRadius: '24px',
          padding: '12px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1)',
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Tablet Screen Container */}
          <div
            ref={containerRef}
            style={{
              position: 'relative',
              width: '100%',
              paddingTop: getAspectRatioPadding(),
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              overflow: 'hidden',
              userSelect: 'none'
            }}
          >
            {/* Screen Inner Content Absolute Wrapper */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#F1F5F9'
            }}>
              {/* Stylized Kiosk Mock Background */}
              <div style={{
                flex: 1,
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {/* Mock Kiosk Header */}
                <div style={{
                  height: '28px',
                  backgroundColor: '#E2E8F0',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 10px',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ width: '80px', height: '10px', backgroundColor: '#CBD5E1', borderRadius: '4px' }} />
                  <div style={{ width: '40px', height: '10px', backgroundColor: '#CBD5E1', borderRadius: '4px' }} />
                </div>

                {/* Mock Menu Grid (Muted Placeholder) */}
                <div style={{
                  flex: 1,
                  display: 'grid',
                  gridTemplateColumns: isLandscape ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                  gap: '8px'
                }}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        opacity: 0.8
                      }}
                    >
                      <div style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: '4px' }} />
                      <div style={{ width: '60%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '3px' }} />
                      <div style={{ width: '40%', height: '8px', backgroundColor: '#CBD5E1', borderRadius: '3px' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Pig Mascot Character & Speech Bubble (Ultra-Miniature, Top-Right positioned) */}
              {!isOpen && (
                <div
                  onClick={handleOpenPopup}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    zIndex: 20
                  }}
                >
                  {/* Ultra-Mini Speech Bubble: Top "KR/EN/JA" Badge + Bottom Text */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    border: '0.8px solid #F48FB1',
                    borderRadius: '5px',
                    padding: '2px 5px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    maxWidth: '85px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px'
                  }}>
                    {/* Top: Language Code (KR / EN / JA) */}
                    <div>
                      <span style={{
                        fontSize: '6.5px',
                        fontWeight: 800,
                        backgroundColor: '#FFF0F5',
                        color: '#E11D48',
                        padding: '0px 2.5px',
                        borderRadius: '2px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.2px',
                        display: 'inline-block',
                        lineHeight: 1.05
                      }}>
                        {bubbleLang === 'ko' ? 'KR' : bubbleLang === 'en' ? 'EN' : 'JA'}
                      </span>
                    </div>

                    {/* Bottom: Speech Bubble Text Content */}
                    <div style={{
                      fontSize: '7.5px',
                      fontWeight: 700,
                      color: '#0F172A',
                      lineHeight: 1.15,
                      opacity: bubbleFade ? 1 : 0,
                      transition: 'opacity 0.15s ease-in-out'
                    }}>
                      {currentBubbleText}
                    </div>
                  </div>

                  {/* Ultra-Mini Pig Mascot Character Avatar */}
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '10px',
                    backgroundColor: '#FFE0B2',
                    border: '1px solid #E11D48',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 5px rgba(225, 29, 72, 0.25)',
                    transition: 'transform 0.15s ease'
                  }}>
                    <img
                      src="/assets/char_mascot.svg"
                      alt="돼지 캐릭터 마스코트"
                      style={{ width: '15px', height: '15px', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              )}

                  {/* FULL-SCREEN MODAL POPUP IMAGE VIEWER */}
                  {isOpen && (
                    <div
                      onWheel={handleWheel}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 30,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        overflow: 'hidden'
                      }}
                    >
                      {/* TOP-LEFT: Half-Sized Vertical Language Selector Buttons [ 한글 / English / 日本語 ] */}
                      <div style={{
                        position: 'absolute',
                        left: '8px',
                        top: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        zIndex: 40,
                        pointerEvents: 'auto',
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        backdropFilter: 'blur(6px)',
                        padding: '2px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.15)'
                      }}>
                        {(['ko', 'en', 'ja'] as SupportedLanguage[]).map((lang) => {
                          const labels: Record<SupportedLanguage, string> = {
                            ko: '한글',
                            en: 'English',
                            ja: '日本語'
                          };
                          const isActive = popupLang === lang;
                          return (
                            <button
                              key={lang}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSwitchPopupLanguage(lang);
                              }}
                              style={{
                                padding: '2px 5px',
                                borderRadius: '4px',
                                border: 'none',
                                fontSize: '8.5px',
                                fontWeight: 700,
                                backgroundColor: isActive ? '#E11D48' : 'transparent',
                                color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                                cursor: 'pointer',
                                transition: 'all 0.12s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {labels[lang]}
                            </button>
                          );
                        })}
                      </div>

                      {/* TOP-RIGHT: Half-Sized Close Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClosePopup();
                        }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          backgroundColor: 'rgba(15, 23, 42, 0.65)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          padding: '3px 7px',
                          fontSize: '9px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          backdropFilter: 'blur(6px)',
                          zIndex: 40,
                          pointerEvents: 'auto'
                        }}
                      >
                        <X size={11} />
                        <span>닫기</span>
                      </button>

                      {/* Zoomable & Pannable Image Container */}
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                          transformOrigin: 'center center',
                          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                          pointerEvents: 'none'
                        }}
                      >
                        <img
                          src={displayedImageUrl}
                          alt={`고기 부위 안내 팝업 (${popupLang})`}
                          style={{
                            maxWidth: '90%',
                            maxHeight: '92%',
                            objectFit: 'contain',
                            display: 'block'
                          }}
                        />
                      </div>

                      {/* Bottom Zoom & Drag Minimal Indicator */}
                      <div style={{
                        position: 'absolute',
                        bottom: '6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.55)',
                        backdropFilter: 'blur(4px)',
                        color: 'rgba(255, 255, 255, 0.85)',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 600,
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Move size={10} />
                          <span>드래그 이동</span>
                        </div>
                        <span>·</span>
                        <span>{scale.toFixed(1)}x</span>
                      </div>
                    </div>
                  )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div style={{
        marginTop: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        color: '#94A3B8'
      }}>
        <Info size={13} />
        <span>미리보기는 선택한 화면 비율을 기준으로 표시됩니다. 실제 기기의 시스템 표시 영역에 따라 약간 다를 수 있습니다.</span>
      </div>
    </div>
  );
};
