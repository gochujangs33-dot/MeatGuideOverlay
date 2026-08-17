import React, { useState } from 'react';
import { X, LogIn, Shield } from 'lucide-react';
import { auth, signInAnonymously } from '../services/firebase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('admin@meatguide.local');
  const [password, setPassword] = useState('admin1234!');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
      onClose();
    } catch (e: any) {
      console.warn('Anonymous login error, closing modal for local session:', e);
      onClose();
    } finally {
      setLoading(false);
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
        maxWidth: '440px',
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
            <Shield size={20} color="#E53935" />
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>
              관리자 콘솔 인증
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="#94A3B8" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div className="form-group">
            <label className="form-label">관리자 이메일 계정</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '10px',
            padding: '12px',
            fontSize: '12px',
            color: '#93C5FD',
            lineHeight: 1.4
          }}>
            ℹ 로컬 개발/에뮬레이터 환경에서는 <strong>[관리자 로그인]</strong> 클릭 시 즉시 관리자 권한 세션이 활성화됩니다.
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #2D3348',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          background: '#141722'
        }}>
          <button onClick={onClose} className="btn btn-secondary">
            닫기
          </button>
          <button onClick={handleDemoLogin} className="btn btn-primary" disabled={loading}>
            <LogIn size={16} />
            <span>{loading ? '로그인 중...' : '관리자 로그인'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
