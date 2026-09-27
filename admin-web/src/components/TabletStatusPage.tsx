import React, { useEffect, useMemo, useState } from 'react';
import { collection, firestore, onSnapshot } from '../services/firebase';
import { appUpdateState, fetchLatestAppVersionCode, isTabletOnline, sortTablets, toDate } from '../services/tabletStatus';
import type { DeviceStatus } from '../types/popup';
import './TabletStatusPage.css';

const KIOSK_APP_NAMES: Record<string, string> = {
  'com.erum.epos': 'erum 이오더',
  'com.antigravity.testkiosk': '가상 테스트 키오스크'
};

const NOT_REPORTED = '앱 v1.0.21 이상에서 표시';

function formatDateTime(value: unknown): string {
  const date = toDate(value);
  if (!date) return '기록 없음';
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function onOff(value: boolean | undefined, on = '켜짐', off = '꺼짐'): React.ReactNode {
  if (value === undefined) return <span className="ts-muted">{NOT_REPORTED}</span>;
  return <span className={value ? 'ts-ok' : 'ts-bad'}>{value ? on : off}</span>;
}

/** Mobile page listing every tablet's number, app version and settings. */
export const TabletStatusPage: React.FC = () => {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [latestCode, setLatestCode] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetchLatestAppVersionCode().then(setLatestCode);
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    const unsubscribe = onSnapshot(
      collection(firestore, 'devices'),
      (snapshot) => {
        setLoadError(null);
        setDevices(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<DeviceStatus, 'id'>) })));
      },
      (error) => {
        console.warn('Failed to load tablets:', error);
        setLoadError('태블릿 목록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.');
      }
    );
    return () => {
      window.clearInterval(timer);
      unsubscribe();
    };
  }, []);

  const tablets = useMemo(() => sortTablets(devices), [devices]);
  const onlineCount = tablets.filter((d) => isTabletOnline(d.lastSeen, now)).length;
  const outdatedCount = tablets.filter((d) => appUpdateState(d, latestCode) === 'outdated').length;
  const selected = tablets.find((d) => d.id === selectedId) ?? null;

  return (
    <div className="ts-page">
      <header className="ts-header">
        <h1>태블릿 현황</h1>
        <div className="ts-summary">
          <span>전체 <b>{tablets.length}</b>대</span>
          <span>온라인 <b className="ts-ok">{onlineCount}</b>대</span>
          <span>업데이트 필요 <b className={outdatedCount ? 'ts-bad' : ''}>{outdatedCount}</b>대</span>
        </div>
        {latestCode !== null && <div className="ts-latest">최신 앱 버전 코드: {latestCode}</div>}
      </header>

      {loadError && <div className="ts-error">{loadError}</div>}
      {!loadError && tablets.length === 0 && <div className="ts-empty">등록된 태블릿이 없습니다.</div>}

      <ul className="ts-list">
        {tablets.map((device) => {
          const online = isTabletOnline(device.lastSeen, now);
          const update = appUpdateState(device, latestCode);
          return (
            <li key={device.id}>
              <button type="button" className="ts-card" onClick={() => setSelectedId(device.id)}>
                <div className="ts-card-top">
                  <span className="ts-name">{device.deviceName || '이름 없는 태블릿'}</span>
                  <span className={`ts-dot ${online ? 'on' : 'off'}`}>{online ? '온라인' : '오프라인'}</span>
                </div>
                <div className="ts-card-bottom">
                  <span className="ts-version">v{device.appVersionName || '?'}</span>
                  {update !== 'unknown' && (
                    <span className={`ts-badge ${update}`}>{update === 'latest' ? '최신' : '업데이트 필요'}</span>
                  )}
                  <span className="ts-seen">{formatDateTime(device.lastSeen)}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {selected && (
        <div className="ts-sheet-backdrop" onClick={() => setSelectedId(null)}>
          <section className="ts-sheet" onClick={(e) => e.stopPropagation()} aria-label="태블릿 상세">
            <div className="ts-sheet-head">
              <h2>{selected.deviceName || '이름 없는 태블릿'}</h2>
              <button type="button" className="ts-close" onClick={() => setSelectedId(null)}>닫기</button>
            </div>

            <h3>버전</h3>
            <dl>
              <dt>앱 버전</dt>
              <dd>v{selected.appVersionName || '?'} ({selected.appVersionCode ?? '?'})</dd>
              <dt>앱 업데이트 날짜</dt>
              <dd>{selected.appUpdatedAt ? formatDateTime(selected.appUpdatedAt) : <span className="ts-muted">{NOT_REPORTED}</span>}</dd>
              <dt>콘텐츠 버전</dt>
              <dd>v{selected.contentVersion ?? '?'}</dd>
              <dt>콘텐츠 업데이트 날짜</dt>
              <dd>{selected.contentUpdatedAt ? formatDateTime(selected.contentUpdatedAt) : <span className="ts-muted">{NOT_REPORTED}</span>}</dd>
              <dt>마지막 보고</dt>
              <dd>{formatDateTime(selected.lastSeen)}</dd>
            </dl>

            <h3>설정</h3>
            <dl>
              <dt>감시 키오스크 앱</dt>
              <dd>
                {selected.kioskPackage
                  ? KIOSK_APP_NAMES[selected.kioskPackage] ?? selected.kioskPackage
                  : <span className="ts-muted">{NOT_REPORTED}</span>}
              </dd>
              <dt>부팅 시 키오스크 자동 실행</dt>
              <dd>{onOff(selected.autoLaunchKiosk, '사용', '사용 안 함')}</dd>
              <dt>다른 앱 위에 표시</dt>
              <dd>{onOff(selected.overlayPermission)}</dd>
              <dt>접근성 오류 감지</dt>
              <dd>{onOff(selected.accessibilityEnabled)}</dd>
              <dt>시스템 설정 변경</dt>
              <dd>{onOff(selected.writeSettingsPermission)}</dd>
              <dt>팝업 자동 닫힘</dt>
              <dd>
                {selected.popupAutoCloseMinutes === undefined
                  ? <span className="ts-muted">{NOT_REPORTED}</span>
                  : selected.popupAutoCloseMinutes === 0 ? '사용 안 함' : `${selected.popupAutoCloseMinutes}분`}
              </dd>
            </dl>

            <h3>기기</h3>
            <dl>
              <dt>모델</dt>
              <dd>{selected.model || '?'}</dd>
              <dt>Android</dt>
              <dd>{selected.androidVersion || '?'}</dd>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
};
