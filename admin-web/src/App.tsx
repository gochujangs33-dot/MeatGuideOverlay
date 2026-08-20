import React, { FormEvent, useEffect, useState } from 'react';
import { PopupImageManager } from './components/PopupImageManager';
import {
  auth,
  doc,
  firestore,
  getDoc,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  User
} from './services/firebase';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsAuthLoading(true);
      setUser(currentUser);

      if (!currentUser) {
        setIsAdmin(false);
        setIsAuthLoading(false);
        return;
      }

      try {
        const adminDocument = await getDoc(doc(firestore, 'admins', currentUser.uid));
        const hasAdminAccess = adminDocument.exists();
        setIsAdmin(hasAdminAccess);
        if (!hasAdminAccess) {
          setAuthError('이 계정에는 관리자 권한이 없습니다.');
        }
      } catch (error) {
        console.error('Failed to verify administrator claim:', error);
        setIsAdmin(false);
        setAuthError('관리자 권한을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      } finally {
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setIsSigningIn(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const adminDocument = await getDoc(doc(firestore, 'admins', credential.user.uid));
      if (!adminDocument.exists()) {
        await auth.signOut();
        setAuthError('이 계정에는 관리자 권한이 없습니다.');
      }
    } catch (error) {
      console.error('Administrator sign-in failed:', error);
      setAuthError('로그인에 실패했습니다. 이메일, 비밀번호 및 관리자 권한을 확인해 주세요.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card" aria-live="polite">관리자 권한을 확인하고 있습니다…</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="admin-login-page">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <div className="admin-login-mark">MG</div>
          <h1>MeatGuide 관리자</h1>
          <p>팝업 이미지와 태블릿 설정을 관리하려면 관리자 계정으로 로그인하세요.</p>

          <label className="form-label" htmlFor="admin-email">이메일</label>
          <input
            id="admin-email"
            className="form-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />

          <label className="form-label" htmlFor="admin-password">비밀번호</label>
          <input
            id="admin-password"
            className="form-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {authError && <div className="admin-login-error" role="alert">{authError}</div>}

          <button className="btn btn-primary admin-login-submit" type="submit" disabled={isSigningIn}>
            {isSigningIn ? '로그인 중…' : '관리자 로그인'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-root">
      <PopupImageManager onLogout={handleLogout} userEmail={user.email || '관리자'} />
    </div>
  );
};
