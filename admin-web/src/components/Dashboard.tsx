import React from 'react';
import { ContentManifest, DeviceStatusDoc } from '../types/content';
import { RefreshCw, Layers, Smartphone, MessageSquare } from 'lucide-react';

interface DashboardProps {
  manifest: ContentManifest;
  devices: DeviceStatusDoc[];
  onRefreshDevices: () => void;
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  manifest,
  devices,
  onRefreshDevices,
  onNavigateTab
}) => {
  return (
    <div className="animate-fade-in">
      {/* Metric Cards Row */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        {/* Card 1: Content Status */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>배포 중인 콘텐츠 버전</span>
            <Layers size={20} color="#E53935" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF' }}>
            v{manifest.contentVersion}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
            마지막 업데이트: {new Date(manifest.updatedAt).toLocaleString('ko-KR')}
          </div>
        </div>

        {/* Card 2: Registered Menus */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>등록 메뉴 수</span>
            <span className="badge badge-success">정상 운영</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF' }}>
            돼지 {manifest.porkCategory.items.length}종 + 소 1종
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
            소고기: <span style={{ color: '#EF5350', fontWeight: 700 }}>소생갈비살</span> (단일 품목 엄격 제한)
          </div>
        </div>

        {/* Card 3: Connected Tablets */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>연결된 키오스크 태블릿</span>
            <Smartphone size={20} color="#10B981" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF' }}>
            {devices.length}대 운영 중
          </div>
          <div style={{ fontSize: '12px', color: '#10B981', marginTop: '6px' }}>
            ● 전 기기 최신 버전 v{manifest.contentVersion} 동기화 완료
          </div>
        </div>
      </div>

      {/* Live Speech Bubble Banner */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #1A1D2B, #23283B)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(229, 57, 53, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <MessageSquare size={24} color="#E53935" />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>현재 노출 중인 말풍선 문구</span>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
              "{manifest.bubbleText}"
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            className="btn btn-secondary"
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            문구 변경
          </button>
        </div>
      </div>

      {/* Connected Tablet Devices Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
              연결된 태블릿 실시간 모니터링
            </h2>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>
              매장 내 키오스크 태블릿의 앱 버전, 콘텐츠 버전 및 동기화 상태입니다.
            </p>
          </div>
          <button
            onClick={onRefreshDevices}
            className="btn btn-secondary"
            style={{ fontSize: '13px', padding: '8px 12px' }}
          >
            <RefreshCw size={14} />
            <span>새로고침</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2D3348', color: '#94A3B8' }}>
                <th style={{ padding: '12px 16px' }}>상태</th>
                <th style={{ padding: '12px 16px' }}>기기 식별명</th>
                <th style={{ padding: '12px 16px' }}>모델 및 OS</th>
                <th style={{ padding: '12px 16px' }}>감시 키오스크</th>
                <th style={{ padding: '12px 16px' }}>적용 콘텐츠 버전</th>
                <th style={{ padding: '12px 16px' }}>마지막 동기화</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(device => {
                const isSynced = device.contentVersion === manifest.contentVersion;
                return (
                  <tr key={device.deviceUid} style={{ borderBottom: '1px solid #1E2332' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-success">
                        온라인
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#FFFFFF' }}>
                      {device.deviceName}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#CBD5E1' }}>
                      {device.deviceModel} ({device.androidVersion})
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94A3B8', fontFamily: 'monospace' }}>
                      {device.selectedKioskPackage || 'com.antigravity.testkiosk'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${isSynced ? 'badge-primary' : 'badge-warning'}`}>
                        v{device.contentVersion}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748B' }}>
                      {new Date(device.lastSyncSuccessAt).toLocaleTimeString('ko-KR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
