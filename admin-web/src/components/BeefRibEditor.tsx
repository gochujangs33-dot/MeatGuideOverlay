import React from 'react';
import { BeefRibItem } from '../types/content';
import { AlertCircle, Lock } from 'lucide-react';

interface BeefRibEditorProps {
  beefRibItem: BeefRibItem;
  onChange: (updated: BeefRibItem) => void;
}

export const BeefRibEditor: React.FC<BeefRibEditorProps> = ({
  beefRibItem,
  onChange
}) => {
  const handleUpdate = (field: keyof BeefRibItem, value: any) => {
    onChange({ ...beefRibItem, [field]: value });
  };

  return (
    <div className="animate-fade-in">
      {/* Strict Domain Policy Notice */}
      <div className="card" style={{
        marginBottom: '24px',
        borderLeft: '4px solid #EF5350',
        background: 'rgba(239, 83, 80, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <AlertCircle size={22} color="#EF5350" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
              소고기 단일 품목 정책 (소생갈비살 전용)
            </h3>
            <p style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '4px', lineHeight: 1.5 }}>
              본 매장 키오스크 보조 시스템의 소고기 안내는 <strong>소생갈비살 1종류만 단독 지원</strong>하며,
              육회, 뿌리살, 업진살 등 기타 소고기 메뉴 추가는 엄격히 제한됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* Editor Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
            소생갈비살 부위 상세 정보 편집
          </h2>
          <span className="badge badge-primary">
            <Lock size={12} style={{ marginRight: '4px' }} />
            고정 품목 (소생갈비살)
          </span>
        </div>

        <div className="grid-2">
          {/* Left Column */}
          <div>
            <div className="form-group">
              <label className="form-label">메뉴명 (소생갈비살 고정)</label>
              <input
                type="text"
                className="form-input"
                value={beefRibItem.name}
                disabled
                style={{ opacity: 0.8, cursor: 'not-allowed', background: '#12141C' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">부위 위치 설명</label>
              <input
                type="text"
                className="form-input"
                value={beefRibItem.cutPosition}
                onChange={e => handleUpdate('cutPosition', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">부위 다이어그램</label>
              <input
                type="text"
                className="form-input"
                value="소 부위 안내도 (꽃갈비살 부위 강조)"
                disabled
                style={{ opacity: 0.8, background: '#12141C' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">맛과 풍미</label>
              <input
                type="text"
                className="form-input"
                value={beefRibItem.taste}
                onChange={e => handleUpdate('taste', e.target.value)}
              />
            </div>
          </div>

          {/* Right Column */}
          <div>
            <div className="form-group">
              <label className="form-label">식감</label>
              <input
                type="text"
                className="form-input"
                value={beefRibItem.texture}
                onChange={e => handleUpdate('texture', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">부위 특징</label>
              <input
                type="text"
                className="form-input"
                value={beefRibItem.characteristics}
                onChange={e => handleUpdate('characteristics', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">부위 상세 설명</label>
              <textarea
                className="form-textarea"
                value={beefRibItem.description}
                onChange={e => handleUpdate('description', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">매장 추천 설명 (굽기 꿀팁)</label>
              <textarea
                className="form-textarea"
                value={beefRibItem.recommendation}
                onChange={e => handleUpdate('recommendation', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
