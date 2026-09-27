import React, { useEffect, useState } from 'react';
import { PopupImageManager } from './components/PopupImageManager';
import { TabletStatusPage } from './components/TabletStatusPage';
import {
  auth,
  onAuthStateChanged,
  signInAnonymously,
  User
} from './services/firebase';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (disposed) return;
      setIsAuthLoading(true);
      setUser(currentUser);

      if (!currentUser) {
        try {
          setAuthError(null);
          await signInAnonymously(auth);
        } catch (error) {
          console.error('Automatic anonymous sign-in failed:', error);
          if (!disposed) {
            setAuthError('자동 접속에 실패했습니다. Firebase 익명 로그인을 활성화해 주세요.');
            setIsAuthLoading(false);
          }
        }
      } else {
        setIsAuthLoading(false);
      }
    });

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  if (isAuthLoading) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card" aria-live="polite">관리자 페이지에 자동 접속하고 있습니다…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card" role="alert">
          <div className="admin-login-mark">MG</div>
          <h1>MeatGuide 관리자</h1>
          <p>{authError || '자동 접속을 완료하지 못했습니다. 페이지를 새로고침해 주세요.'}</p>
        </div>
      </div>
    );
  }

  // Phone-friendly tablet list: https://meatguideoverlay.web.app/tablets
  if (window.location.pathname.replace(/\/+$/, '') === '/tablets') {
    return <TabletStatusPage />;
  }

  return (
    <div className="app-root">
      <PopupImageManager userEmail="자동 접속" />
    </div>
  );
};
