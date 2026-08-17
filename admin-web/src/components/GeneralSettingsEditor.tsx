import React, { useState } from 'react';
import { ContentManifest, RestartGuide, UiSettings } from '../types/content';
import { Plus, Trash2, ShieldAlert, Sliders, MessageSquare } from 'lucide-react';

interface GeneralSettingsEditorProps {
  manifest: ContentManifest;
  onChange: (updated: ContentManifest) => void;
}

export const GeneralSettingsEditor: React.FC<GeneralSettingsEditorProps> = ({
  manifest,
  onChange
}) => {
  const [newErrorText, setNewErrorText] = useState('');

  const handleAddErrorText = () => {
    if (!newErrorText.trim()) return;
    if (manifest.kioskErrorTexts.includes(newErrorText.trim())) {
      alert('이미 등록된 오류 문구입니다.');
      return;
    }
    onChange({
      ...manifest,
      kioskErrorTexts: [...manifest.kioskErrorTexts, newErrorText.trim()]
    });
    setNewErrorText('');
  };

  const handleDeleteErrorText = (index: number) => {
    if (manifest.kioskErrorTexts.length <= 1) {
      alert('최소 1개 이상의 오류 감지 문구가 필요합니다.');
      return;
    }
    const updated = manifest.kioskErrorTexts.filter((_, i) => i !== index);
    onChange({ ...manifest, kioskErrorTexts: updated });
  };

  const handleUpdateRestartGuide = (field: keyof RestartGuide, value: any) => {
    onChange({
      ...manifest,
      restartGuide: { ...manifest.restartGuide, [field]: value }
    });
  };

  const handleUpdateUiSettings = (field: keyof UiSettings, value: any) => {
    onChange({
      ...manifest,
      uiSettings: { ...manifest.uiSettings, [field]: value }
    });
  };

  return (
    <div className="animate-fade-in">
      {/* 1. Speech Bubble Settings */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <MessageSquare size={20} color="#E53935" />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
            캐릭터 및 말풍선 노출 설정
          </h2>
        </div>

        <div className="form-group">
          <label className="form-label">말풍선 기본 문구</label>
          <input
            type="text"
            className="form-input"
            value={manifest.bubbleText}
            onChange={e => onChange({ ...manifest, bubbleText: e.target.value })}
          />
        </div>

        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">말풍선 표시 모드</label>
            <select
              className="form-select"
              value={manifest.uiSettings.speechBubbleMode}
              onChange={e => handleUpdateUiSettings('speechBubbleMode', e.target.value)}
            >
              <option value="TIMEOUT_THEN_CHAR_ONLY">일정 시간 노출 후 캐릭터만 표시 (권장)</option>
              <option value="ALWAYS">상시 말풍선 노출</option>
              <option value="CHAR_ONLY">말풍선 숨김 (캐릭터만 표시)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">말풍선 자동 숨김 시간 (초)</label>
            <input
              type="number"
              min="3"
              max="60"
              className="form-input"
              value={manifest.uiSettings.speechBubbleTimeoutSeconds}
              onChange={e => handleUpdateUiSettings('speechBubbleTimeoutSeconds', parseInt(e.target.value) || 8)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">캐릭터 기본 정렬 위치</label>
            <select
              className="form-select"
              value={manifest.uiSettings.characterDefaultSide}
              onChange={e => handleUpdateUiSettings('characterDefaultSide', e.target.value)}
            >
              <option value="RIGHT">화면 우측 가장자리</option>
              <option value="LEFT">화면 좌측 가장자리</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Kiosk Server Error Detection Settings */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <ShieldAlert size={20} color="#F59E0B" />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
            키오스크 서버 연결 오류 감지 설정
          </h2>
        </div>

        <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '16px' }}>
          접근성 서비스가 지정된 키오스크 화면에서 아래 문구를 실시간 감지하면 직원용 재부팅 안내창을 띄웁니다.
        </p>

        {/* Error Phrases List */}
        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {manifest.kioskErrorTexts.map((text, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: '#141722',
                border: '1px solid #2D3348',
                borderRadius: '8px'
              }}
            >
              <span style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 600 }}>{text}</span>
              <button
                onClick={() => handleDeleteErrorText(idx)}
                className="btn btn-outline-danger"
                style={{ padding: '4px 8px' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add Error Phrase Input */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="추가할 감지 오류 문구 (예: 서버 연결이 끊겼습니다)"
            value={newErrorText}
            onChange={e => setNewErrorText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddErrorText(); }}
          />
          <button onClick={handleAddErrorText} className="btn btn-secondary" style={{ flexShrink: 0 }}>
            <Plus size={16} />
            <span>오류 문구 추가</span>
          </button>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">직원 안내창 제목</label>
            <input
              type="text"
              className="form-input"
              value={manifest.restartGuide.title}
              onChange={e => handleUpdateRestartGuide('title', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">중복 방지 쿨다운 시간 (분)</label>
            <input
              type="number"
              min="1"
              max="60"
              className="form-input"
              value={manifest.restartGuide.cooldownMinutes}
              onChange={e => handleUpdateRestartGuide('cooldownMinutes', parseInt(e.target.value) || 5)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">직원용 재부팅 안내 본문</label>
          <textarea
            className="form-textarea"
            value={manifest.restartGuide.message}
            onChange={e => handleUpdateRestartGuide('message', e.target.value)}
          />
        </div>
      </div>

      {/* 3. General UI & Auto Close */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Sliders size={20} color="#3B82F6" />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
            설명 팝업 동작 설정
          </h2>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">팝업 무입력 자동 닫기 시간 (초)</label>
            <input
              type="number"
              min="10"
              max="300"
              className="form-input"
              value={manifest.uiSettings.autoCloseSeconds}
              onChange={e => handleUpdateUiSettings('autoCloseSeconds', parseInt(e.target.value) || 60)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">바깥 영역 터치 시 닫기</label>
            <select
              className="form-select"
              value={manifest.uiSettings.touchOutsideDismiss ? 'true' : 'false'}
              onChange={e => handleUpdateUiSettings('touchOutsideDismiss', e.target.value === 'true')}
            >
              <option value="true">허용 (바깥 터치 시 즉시 닫힘)</option>
              <option value="false">금지 (오직 닫기 버튼으로만 닫힘)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
