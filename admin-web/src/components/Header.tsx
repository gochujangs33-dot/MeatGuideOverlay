import React from 'react';
import { Send, Save, LogIn, LogOut } from 'lucide-react';
import { ContentManifest } from '../types/content';
import { User } from '../services/firebase';

interface HeaderProps {
  manifest: ContentManifest;
  isDirty: boolean;
  user: User | null;
  onSaveDraft: () => void;
  onOpenPublishModal: () => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  manifest,
  isDirty,
  user,
  onSaveDraft,
  onOpenPublishModal,
  onOpenLoginModal,
  onLogout
}) => {
  return (
    <header className="header-glass">
      <div className="header-inner">
        {/* Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FF5252, #B71C1C)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(229, 57, 53, 0.35)'
          }}>
            <img src="/assets/char_mascot.svg" alt="Logo" style={{ width: '32px', height: '32px' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
                고기 부위 안내 <span style={{ color: '#E53935' }}>통합 관리자</span>
              </h1>
              <span className="badge badge-primary">v{manifest.contentVersion}</span>
              {isDirty && (
                <span className="badge badge-warning">수정 중 (미게시)</span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
              키오스크 보조 오버레이 앱 실시간 콘텐츠 관리 시스템
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Save Draft */}
          <button
            onClick={onSaveDraft}
            className="btn btn-secondary"
            title="현재 변경사항을 초안으로 임시 저장합니다."
          >
            <Save size={16} />
            <span>초안 저장</span>
          </button>

          {/* Publish Button */}
          <button
            onClick={onOpenPublishModal}
            className="btn btn-primary"
          >
            <Send size={16} />
            <span>태블릿에 게시</span>
          </button>

          {/* User Auth */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '8px' }}>
              <div style={{
                background: '#1F2332',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #2D3348',
                fontSize: '13px',
                color: '#CBD5E1'
              }}>
                <span style={{ color: '#10B981', marginRight: '6px' }}>●</span>
                {user.email || '관리자 (Admin)'}
              </div>
              <button
                onClick={onLogout}
                className="btn btn-secondary"
                style={{ padding: '8px 12px' }}
                title="로그아웃"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="btn btn-secondary"
              style={{ marginLeft: '8px' }}
            >
              <LogIn size={16} />
              <span>로그인</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
