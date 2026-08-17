import React from 'react';
import { LayoutDashboard, Drumstick, Beef, Settings, Smartphone, History } from 'lucide-react';

interface TabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: '대시보드 & 기기 현황', icon: LayoutDashboard },
    { id: 'pork', label: '돼지고기 특수부위 관리', icon: Drumstick },
    { id: 'beef', label: '소생갈비살 관리', icon: Beef },
    { id: 'settings', label: '말풍선 & 오류/UI 설정', icon: Settings },
    { id: 'simulator', label: '태블릿 실시간 시뮬레이터', icon: Smartphone },
    { id: 'history', label: '게시 이력 & 복원', icon: History }
  ];

  return (
    <nav className="tabs-nav">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
