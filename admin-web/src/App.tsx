import React, { useState, useEffect } from 'react';
import { ContentManifest, ContentVersionHistoryItem, DeviceStatusDoc } from './types/content';
import { ContentService, initialDefaultManifest } from './services/contentService';
import { auth, onAuthStateChanged, User } from './services/firebase';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { Dashboard } from './components/Dashboard';
import { PorkCategoryEditor } from './components/PorkCategoryEditor';
import { BeefRibEditor } from './components/BeefRibEditor';
import { GeneralSettingsEditor } from './components/GeneralSettingsEditor';
import { TabletSimulator } from './components/TabletSimulator';
import { VersionHistory } from './components/VersionHistory';
import { PublishModal } from './components/PublishModal';
import { LoginModal } from './components/LoginModal';

export const App: React.FC = () => {
  const [manifest, setManifest] = useState<ContentManifest>(initialDefaultManifest);
  const [history, setHistory] = useState<ContentVersionHistoryItem[]>([]);
  const [devices, setDevices] = useState<DeviceStatusDoc[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDirty, setIsDirty] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    // 1. Listen to Auth State
    const unsubscribeAuth = onAuthStateChanged(auth, u => {
      setUser(u);
    });

    // 2. Load Content Draft or Published
    ContentService.loadDraft().then(data => {
      setManifest(data);
    });

    // 3. Load Version History & Devices
    loadHistoryAndDevices();

    return () => unsubscribeAuth();
  }, []);

  const loadHistoryAndDevices = async () => {
    const hist = await ContentService.fetchVersionHistory();
    setHistory(hist);
    const devs = await ContentService.fetchConnectedDevices();
    setDevices(devs);
  };

  const handleUpdateManifest = (updated: ContentManifest) => {
    setManifest(updated);
    setIsDirty(true);
  };

  const handleSaveDraft = async () => {
    await ContentService.saveDraft(manifest);
    setIsDirty(false);
    alert('초안이 안전하게 저장되었습니다.');
  };

  const handleConfirmPublish = async (summary: string) => {
    const newVersion = await ContentService.publishContent(manifest, user?.uid || 'admin_user', summary);
    setManifest(prev => ({ ...prev, contentVersion: newVersion }));
    setIsDirty(false);
    await loadHistoryAndDevices();
    alert(`성공: 버전 v${newVersion}이 모든 태블릿에 실시간 배포되었습니다!`);
  };

  const handleRestoreVersion = async (item: ContentVersionHistoryItem) => {
    if (confirm(`버전 v${item.version} ("${item.summary}")의 내용으로 복원하시겠습니까?`)) {
      setManifest(item.manifest);
      setIsDirty(true);
      setActiveTab('pork');
      alert(`v${item.version} 콘텐츠가 편집기에 로드되었습니다. 확인 후 [태블릿에 게시]를 눌러주세요.`);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        manifest={manifest}
        isDirty={isDirty}
        user={user}
        onSaveDraft={handleSaveDraft}
        onOpenPublishModal={() => setIsPublishModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Body */}
      <main className="main-content">
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === 'dashboard' && (
          <Dashboard
            manifest={manifest}
            devices={devices}
            onRefreshDevices={loadHistoryAndDevices}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'pork' && (
          <PorkCategoryEditor
            porkCategory={manifest.porkCategory}
            onChange={updated => handleUpdateManifest({ ...manifest, porkCategory: updated })}
          />
        )}

        {activeTab === 'beef' && (
          <BeefRibEditor
            beefRibItem={manifest.beefRibItem}
            onChange={updated => handleUpdateManifest({ ...manifest, beefRibItem: updated })}
          />
        )}

        {activeTab === 'settings' && (
          <GeneralSettingsEditor
            manifest={manifest}
            onChange={handleUpdateManifest}
          />
        )}

        {activeTab === 'simulator' && (
          <TabletSimulator manifest={manifest} />
        )}

        {activeTab === 'history' && (
          <VersionHistory
            history={history}
            currentVersion={manifest.contentVersion}
            onRestoreVersion={handleRestoreVersion}
          />
        )}
      </main>

      {/* Modals */}
      <PublishModal
        manifest={manifest}
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onConfirmPublish={handleConfirmPublish}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};
