import React, { useState, useEffect } from 'react';
import { ContentManifest, PorkItem } from '../types/content';
import { RotateCw, X, ArrowLeft } from 'lucide-react';

interface TabletSimulatorProps {
  manifest: ContentManifest;
}

export const TabletSimulator: React.FC<TabletSimulatorProps> = ({ manifest }) => {
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [overlayStage, setOverlayStage] = useState<'categories' | 'pork_list' | 'meat_detail'>('categories');
  const [selectedPorkCut, setSelectedPorkCut] = useState<PorkItem | null>(null);
  const [selectedMeatType, setSelectedMeatType] = useState<'pork' | 'beef'>('pork');
  const [timerSeconds, setTimerSeconds] = useState(manifest.uiSettings.autoCloseSeconds || 60);

  useEffect(() => {
    let interval: any;
    if (isOverlayOpen) {
      setTimerSeconds(manifest.uiSettings.autoCloseSeconds || 60);
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setIsOverlayOpen(false);
            return manifest.uiSettings.autoCloseSeconds || 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOverlayOpen, manifest.uiSettings.autoCloseSeconds]);

  const handleOpenCategory = (type: 'pork' | 'beef') => {
    setSelectedMeatType(type);
    if (type === 'pork') {
      setOverlayStage('pork_list');
    } else {
      setOverlayStage('meat_detail');
    }
  };

  const handleSelectPorkCut = (cut: PorkItem) => {
    setSelectedPorkCut(cut);
    setSelectedMeatType('pork');
    setOverlayStage('meat_detail');
  };

  const isLandscape = orientation === 'landscape';

  return (
    <div className="animate-fade-in">
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
              태블릿 실시간 인터랙티브 시뮬레이터
            </h2>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>
              매장 태블릿 키오스크 화면 위에서 동작하는 보조 오버레이의 실제 UI와 상호작용을 검증합니다.
            </p>
          </div>
          <button
            onClick={() => setOrientation(prev => prev === 'landscape' ? 'portrait' : 'landscape')}
            className="btn btn-secondary"
          >
            <RotateCw size={16} />
            <span>화면 회전 ({isLandscape ? '가로 모드' : '세로 모드'})</span>
          </button>
        </div>
      </div>

      {/* Tablet Frame */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '20px 0',
        background: '#0B0D13',
        borderRadius: '24px',
        border: '1px solid #1E2332'
      }}>
        <div style={{
          width: isLandscape ? '880px' : '520px',
          height: isLandscape ? '550px' : '720px',
          background: '#000000',
          borderRadius: '32px',
          padding: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 0 10px #1E2332',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}>
          {/* Tablet Screen Canvas */}
          <div style={{
            width: '100%',
            height: '100%',
            background: '#121212',
            borderRadius: '20px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Mock Kiosk Background App */}
            <div style={{
              height: '56px',
              background: '#1E1E1E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              borderBottom: '1px solid #2B2B2B'
            }}>
              <span style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '16px' }}>황금 숯불 구이 전문점</span>
              <span style={{ background: '#333333', color: '#FF6F00', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}>
                테이블 03
              </span>
            </div>

            {/* Mock Kiosk Body */}
            <div style={{ flex: 1, padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', opacity: isOverlayOpen ? 0.3 : 1, transition: 'opacity 0.2s' }}>
              {['꼬들목살', '소생갈비살', '항정살', '가브리살', '삼겹살', '송이살'].map((name, i) => (
                <div key={i} style={{ background: '#1E1E1E', borderRadius: '12px', padding: '14px', border: '1px solid #2A2A2A', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>{name}</div>
                    <div style={{ color: '#FF6F00', fontSize: '13px', marginTop: '4px' }}>16,000원</div>
                  </div>
                  <button style={{ marginTop: '10px', background: '#FF6F00', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px', fontSize: '12px', fontWeight: 700 }}>
                    주문 담기
                  </button>
                </div>
              ))}
            </div>

            {/* Mock Kiosk Footer */}
            <div style={{ height: '48px', background: '#1E1E1E', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderTop: '1px solid #2B2B2B' }}>
              <span style={{ fontSize: '12px', color: '#888' }}>키오스크 주문 대기 중</span>
              <button style={{ background: '#FF6F00', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 700 }}>
                주문하기 (0원)
              </button>
            </div>

            {/* FLOATING OVERLAY CHARACTER & BUBBLE (When modal closed) */}
            {!isOverlayOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '180px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  zIndex: 30
                }}
                onClick={() => {
                  setIsOverlayOpen(true);
                  setOverlayStage('categories');
                }}
              >
                {/* Speech Bubble */}
                <div style={{
                  background: '#FFFDF7',
                  border: '2px solid #FFAB91',
                  borderRadius: '14px',
                  padding: '8px 14px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  maxWidth: '220px'
                }}>
                  <p style={{ color: '#212121', fontSize: '12px', fontWeight: 700, margin: 0 }}>
                    {manifest.bubbleText}
                  </p>
                </div>

                {/* Character Button */}
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  boxShadow: '0 6px 16px rgba(229, 57, 53, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#FFFFFF'
                }}>
                  <img src="/assets/char_mascot.svg" alt="Mascot" style={{ width: '56px', height: '56px' }} />
                </div>
              </div>
            )}

            {/* MODAL OVERLAY POPUP DIALOG */}
            {isOverlayOpen && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                zIndex: 40
              }}>
                <div style={{
                  width: '100%',
                  maxWidth: isLandscape ? '680px' : '440px',
                  background: '#FFFFFF',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Header Bar */}
                  <div style={{
                    padding: '12px 18px',
                    background: '#F8F9FA',
                    borderBottom: '1px solid #E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {overlayStage !== 'categories' && (
                        <button
                          onClick={() => {
                            if (overlayStage === 'meat_detail' && selectedMeatType === 'pork') {
                              setOverlayStage('pork_list');
                            } else {
                              setOverlayStage('categories');
                            }
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                        >
                          <ArrowLeft size={20} color="#212121" />
                        </button>
                      )}
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#212121' }}>
                        {overlayStage === 'categories' && '고기 부위 가이드'}
                        {overlayStage === 'pork_list' && manifest.porkCategory.title}
                        {overlayStage === 'meat_detail' && (
                          selectedMeatType === 'pork' ? (selectedPorkCut?.name || '부위 상세') : manifest.beefRibItem.name
                        )}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{timerSeconds}s</span>
                      <button
                        onClick={() => setIsOverlayOpen(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                      >
                        <X size={20} color="#212121" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '16px', maxHeight: '420px', overflowY: 'auto' }}>
                    {/* Stage 1: CATEGORY SELECTOR (EXACTLY TWO CARDS) */}
                    {overlayStage === 'categories' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* Pork Card */}
                        <div
                          onClick={() => handleOpenCategory('pork')}
                          style={{
                            background: 'linear-gradient(135deg, #FFF0F5, #FCE4EC)',
                            border: '2px solid #F48FB1',
                            borderRadius: '16px',
                            padding: '24px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          <img src="/assets/pig_diagram_neck.svg" alt="Pork" style={{ width: '80px', height: '60px' }} />
                          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#C2185B', marginTop: '12px' }}>
                            {manifest.porkCategory.title}
                          </h3>
                          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            {manifest.porkCategory.description}
                          </p>
                        </div>

                        {/* Beef Rib Card (Single) */}
                        <div
                          onClick={() => handleOpenCategory('beef')}
                          style={{
                            background: 'linear-gradient(135deg, #FFF3E0, #FFEBEE)',
                            border: '2px solid #EF9A9A',
                            borderRadius: '16px',
                            padding: '24px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          <img src="/assets/cow_diagram_rib.svg" alt="Beef" style={{ width: '80px', height: '60px' }} />
                          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#B71C1C', marginTop: '12px' }}>
                            {manifest.beefRibItem.name}
                          </h3>
                          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            {manifest.beefRibItem.cutPosition}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Stage 2A: PORK CUTS LIST */}
                    {overlayStage === 'pork_list' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {manifest.porkCategory.items.filter(i => i.visible).map(cut => (
                          <div
                            key={cut.id}
                            onClick={() => handleSelectPorkCut(cut)}
                            style={{
                              background: '#F9FAFB',
                              border: '1px solid #E5E7EB',
                              borderRadius: '12px',
                              padding: '12px',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            <img src={cut.silhouetteUrl || '/assets/pig_diagram_neck.svg'} alt={cut.name} style={{ width: '100%', height: '50px' }} />
                            <div style={{ fontWeight: 800, color: '#212121', fontSize: '14px', marginTop: '6px' }}>
                              {cut.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#C2185B', marginTop: '2px' }}>
                              {cut.cutPosition}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Stage 2B: DETAIL VIEW */}
                    {overlayStage === 'meat_detail' && (
                      <div style={{ display: 'grid', gridTemplateColumns: isLandscape ? '1fr 1.2fr' : '1fr', gap: '16px' }}>
                        {/* Diagram */}
                        <div style={{ textAlign: 'center' }}>
                          <img
                            src={
                              selectedMeatType === 'pork'
                                ? (selectedPorkCut?.silhouetteUrl || '/assets/pig_diagram_neck.svg')
                                : '/assets/cow_diagram_rib.svg'
                            }
                            alt="Diagram"
                            style={{ width: '100%', maxHeight: '160px', borderRadius: '12px' }}
                          />
                          <div style={{ marginTop: '8px', background: '#F3F4F6', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: '#B71C1C', display: 'inline-block' }}>
                            {selectedMeatType === 'pork' ? selectedPorkCut?.cutPosition : manifest.beefRibItem.cutPosition}
                          </div>
                        </div>

                        {/* Text Details */}
                        <div>
                          <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>
                            {selectedMeatType === 'pork' ? selectedPorkCut?.name : manifest.beefRibItem.name}
                          </h4>
                          <p style={{ fontSize: '12px', color: '#4B5563', marginTop: '4px', lineHeight: 1.4 }}>
                            {selectedMeatType === 'pork' ? selectedPorkCut?.description : manifest.beefRibItem.description}
                          </p>

                          <div style={{ marginTop: '8px', background: '#FFFBEB', padding: '8px', borderRadius: '8px', fontSize: '11px' }}>
                            <strong style={{ color: '#D97706' }}>맛과 풍미: </strong>
                            <span style={{ color: '#1F2937' }}>
                              {selectedMeatType === 'pork' ? selectedPorkCut?.taste : manifest.beefRibItem.taste}
                            </span>
                          </div>

                          <div style={{ marginTop: '6px', background: '#ECFDF5', padding: '8px', borderRadius: '8px', fontSize: '11px' }}>
                            <strong style={{ color: '#059669' }}>식감: </strong>
                            <span style={{ color: '#1F2937' }}>
                              {selectedMeatType === 'pork' ? selectedPorkCut?.texture : manifest.beefRibItem.texture}
                            </span>
                          </div>

                          <div style={{ marginTop: '6px', background: '#FEF2F2', padding: '8px', borderRadius: '8px', fontSize: '11px' }}>
                            <strong style={{ color: '#DC2626' }}>추천 꿀팁: </strong>
                            <span style={{ color: '#1F2937' }}>
                              {selectedMeatType === 'pork' ? selectedPorkCut?.recommendation : manifest.beefRibItem.recommendation}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
