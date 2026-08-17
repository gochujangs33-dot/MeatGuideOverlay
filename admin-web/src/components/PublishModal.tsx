import React, { useState } from 'react';
import { ContentManifest } from '../types/content';
import { ContentService } from '../services/contentService';
import { X, Send, AlertTriangle, ShieldCheck } from 'lucide-react';

interface PublishModalProps {
  manifest: ContentManifest;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPublish: (summary: string) => Promise<void>;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  manifest,
  isOpen,
  onClose,
  onConfirmPublish
}) => {
  const [summary, setSummary] = useState('정기 메뉴 및 안내 문구 업데이트');
  const [isPublishing, setIsPublishing] = useState(false);

  if (!isOpen) return null;

  const validation = ContentService.validateForPublish(manifest);
  const nextVersion = (manifest.contentVersion || 1) + 1;

  const handlePublish = async () => {
    if (!validation.valid) return;
    setIsPublishing(true);
    try {
      await onConfirmPublish(summary);
      onClose();
    } catch (e: any) {
      alert(`게시 실패: ${e.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        background: '#181B26',
        borderRadius: '20px',
        border: '1px solid #2D3348',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #2D3348',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Send size={20} color="#E53935" />
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>
              태블릿 실시간 콘텐츠 게시
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="#94A3B8" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Validation Errors if any */}
          {!validation.valid && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #EF4444',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontWeight: 700, marginBottom: '6px' }}>
                <AlertTriangle size={18} />
                <span>게시 전 필수 검증 항목 오류 ({validation.errors.length}건)</span>
              </div>
              <ul style={{ paddingLeft: '20px', color: '#FCA5A5', fontSize: '13px', lineHeight: 1.5 }}>
                {validation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Verification Checklist */}
          {validation.valid && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 700, marginBottom: '6px' }}>
                <ShieldCheck size={18} />
                <span>모든 게시 검증 통과 (v{nextVersion} 배포 준비 완료)</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6EE7B7' }}>
                ✓ 돼지고기 {manifest.porkCategory.items.length}종 항목 검증 완료<br />
                ✓ 소생갈비살 단일 품목 정책 준수 (기타 소고기 없음)<br />
                ✓ 말풍선 및 서버 오류 감지 문구 정상
              </p>
            </div>
          )}

          {/* Publish Summary Input */}
          <div className="form-group">
            <label className="form-label">배포 변경 요약 메모</label>
            <input
              type="text"
              className="form-input"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="예: 꼬들목살 설명 보강 및 추천 굽기 문구 수정"
            />
          </div>

          <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5 }}>
            ※ [게시] 버튼을 누르면 매장에 연결된 모든 키오스크 태블릿의 고기 부위 안내 앱에 <strong>앱 재시작 없이 즉시 반영</strong>됩니다.
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #2D3348',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          background: '#141722'
        }}>
          <button onClick={onClose} className="btn btn-secondary" disabled={isPublishing}>
            취소
          </button>
          <button
            onClick={handlePublish}
            disabled={!validation.valid || isPublishing}
            className="btn btn-primary"
          >
            <Send size={16} />
            <span>{isPublishing ? '게시 중...' : `v${nextVersion} 실시간 배포 실행`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
