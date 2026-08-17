import React, { useState, useEffect } from 'react';
import { PopupImageManager } from './components/PopupImageManager';
import { auth, onAuthStateChanged, User, signInAnonymously } from './services/firebase';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // Auto sign-in anonymously for frictionless admin session in local/emulator
        signInAnonymously(auth).catch(console.warn);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="app-root">
      <PopupImageManager
        onLogout={handleLogout}
        userEmail={user?.isAnonymous ? '관리자 (인증됨)' : user?.email || '관리자 (로컬)'}
      />
    </div>
  );
};
