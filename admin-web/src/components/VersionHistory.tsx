import React from 'react';
import { ContentVersionHistoryItem } from '../types/content';
import { History, RotateCcw, Calendar, User } from 'lucide-react';

interface VersionHistoryProps {
  history: ContentVersionHistoryItem[];
  currentVersion: number;
  onRestoreVersion: (item: ContentVersionHistoryItem) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  history,
  currentVersion,
  onRestoreVersion
}) => {
  return (
    <div className="animate-fade-in">
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History size={22} color="#E53935" />
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
              콘텐츠 배포 이력 및 복원
            </h2>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>
              이전에 게시되었던 콘텐츠 스냅샷 목록을 확인하고, 필요 시 특정 버전으로 즉시 복원할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {history.map(item => {
          const isCurrent = item.version === currentVersion;
          return (
            <div
              key={item.version}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderLeft: isCurrent ? '4px solid #E53935' : '1px solid #2D3348'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className={`badge ${isCurrent ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
                  v{item.version}
                </span>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '15px' }}>
                      {item.summary || `버전 ${item.version} 배포`}
                    </span>
                    {isCurrent && (
                      <span className="badge badge-success" style={{ fontSize: '11px' }}>
                        현재 활성 버전
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '12px', color: '#94A3B8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      {new Date(item.publishedAt).toLocaleString('ko-KR')}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={13} />
                      게시자: {item.publishedBy}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                {!isCurrent && (
                  <button
                    onClick={() => onRestoreVersion(item)}
                    className="btn btn-secondary"
                    style={{ fontSize: '13px', padding: '8px 14px' }}
                  >
                    <RotateCcw size={14} />
                    <span>이 버전으로 복원</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
