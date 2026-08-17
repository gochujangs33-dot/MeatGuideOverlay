import React, { useState } from 'react';
import { PorkCategory, PorkItem } from '../types/content';
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';

interface PorkCategoryEditorProps {
  porkCategory: PorkCategory;
  onChange: (updated: PorkCategory) => void;
}

export const PorkCategoryEditor: React.FC<PorkCategoryEditorProps> = ({
  porkCategory,
  onChange
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    porkCategory.items[0]?.id || null
  );

  const selectedItem = porkCategory.items.find(i => i.id === selectedItemId) || porkCategory.items[0];

  const handleUpdateItem = (field: keyof PorkItem, value: any) => {
    if (!selectedItem) return;
    const updatedItems = porkCategory.items.map(item => {
      if (item.id === selectedItem.id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange({ ...porkCategory, items: updatedItems });
  };

  const handleAddItem = () => {
    const newId = `pork_custom_${Date.now()}`;
    const newItem: PorkItem = {
      id: newId,
      name: '신규 돼지 특수부위',
      cutPosition: '부위 위치 설명',
      description: '부위의 상세 설명을 입력하세요.',
      taste: '고소하고 깊은 풍미',
      texture: '쫄깃하고 부드러운 식감',
      recommendation: '소금 또는 와사비와 함께 드세요.',
      order: porkCategory.items.length + 1,
      visible: true,
      imageUrl: '/assets/pork_ggodle.svg',
      silhouetteUrl: '/assets/pig_diagram_neck.svg'
    };
    onChange({ ...porkCategory, items: [...porkCategory.items, newItem] });
    setSelectedItemId(newId);
  };

  const handleDeleteItem = (id: string) => {
    if (porkCategory.items.length <= 1) {
      alert('최소 1개 이상의 돼지고기 부위가 유지되어야 합니다.');
      return;
    }
    const updated = porkCategory.items.filter(i => i.id !== id);
    onChange({ ...porkCategory, items: updated });
    if (selectedItemId === id) {
      setSelectedItemId(updated[0]?.id || null);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= porkCategory.items.length) return;

    const itemsCopy = [...porkCategory.items];
    const temp = itemsCopy[index];
    itemsCopy[index] = itemsCopy[targetIndex];
    itemsCopy[targetIndex] = temp;

    // re-assign order index
    const reordered = itemsCopy.map((item, idx) => ({ ...item, order: idx + 1 }));
    onChange({ ...porkCategory, items: reordered });
  };

  const handleToggleVisibility = (id: string) => {
    const updated = porkCategory.items.map(i => {
      if (i.id === id) return { ...i, visible: !i.visible };
      return i;
    });
    onChange({ ...porkCategory, items: updated });
  };

  return (
    <div className="animate-fade-in">
      {/* Category Header Editor */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px' }}>
          돼지고기 카테고리 기본 설정
        </h2>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">카테고리 표시 제목</label>
            <input
              type="text"
              className="form-input"
              value={porkCategory.title}
              onChange={e => onChange({ ...porkCategory, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">카테고리 요약 설명</label>
            <input
              type="text"
              className="form-input"
              value={porkCategory.description}
              onChange={e => onChange({ ...porkCategory, description: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Main Two-Column Pork Cuts Management */}
      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Left Column: Cuts List with Actions */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
              특수부위 메뉴 목록 ({porkCategory.items.length}개)
            </h3>
            <button onClick={handleAddItem} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>
              <Plus size={16} />
              <span>메뉴 추가</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {porkCategory.items.map((item, idx) => {
              const isSelected = item.id === selectedItem?.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: isSelected ? '#252A3C' : '#141722',
                    border: `1px solid ${isSelected ? '#E53935' : '#2D3348'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', width: '20px' }}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, color: item.visible ? '#FFFFFF' : '#64748B' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                        {item.cutPosition}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleVisibility(item.id)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 8px' }}
                      title={item.visible ? '메뉴 숨김' : '메뉴 표시'}
                    >
                      {item.visible ? <Eye size={14} color="#10B981" /> : <EyeOff size={14} color="#64748B" />}
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="btn btn-secondary"
                      style={{ padding: '6px 8px' }}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === porkCategory.items.length - 1}
                      className="btn btn-secondary"
                      style={{ padding: '6px 8px' }}
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="btn btn-outline-danger"
                      style={{ padding: '6px 8px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Cut Details Editor */}
        {selectedItem && (
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px' }}>
              부위 상세 정보 편집: <span style={{ color: '#E53935' }}>{selectedItem.name}</span>
            </h3>

            <div className="form-group">
              <label className="form-label">고기 부위 이름</label>
              <input
                type="text"
                className="form-input"
                value={selectedItem.name}
                onChange={e => handleUpdateItem('name', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">부위 위치 설명</label>
              <input
                type="text"
                className="form-input"
                value={selectedItem.cutPosition}
                onChange={e => handleUpdateItem('cutPosition', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">부위 안내도 다이어그램 선택</label>
              <select
                className="form-select"
                value={selectedItem.silhouetteUrl}
                onChange={e => handleUpdateItem('silhouetteUrl', e.target.value)}
              >
                <option value="/assets/pig_diagram_neck.svg">목덜미 부위 (꼬들목살)</option>
                <option value="/assets/pig_diagram_hangjeong.svg">목/어깨 덧살 부위 (항정살)</option>
                <option value="/assets/pig_diagram_galmaegi.svg">횡격막 부위 (갈매기살)</option>
                <option value="/assets/pig_diagram_gabri.svg">등심 덧살 부위 (가브리살)</option>
                <option value="/assets/pig_diagram_belly.svg">복부 뱃살 부위 (삼겹살)</option>
                <option value="/assets/pig_diagram_songi.svg">갈비 안쪽 특미 부위 (송이살)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">부위 상세 설명</label>
              <textarea
                className="form-textarea"
                value={selectedItem.description}
                onChange={e => handleUpdateItem('description', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">맛과 풍미</label>
              <input
                type="text"
                className="form-input"
                value={selectedItem.taste}
                onChange={e => handleUpdateItem('taste', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">식감</label>
              <input
                type="text"
                className="form-input"
                value={selectedItem.texture}
                onChange={e => handleUpdateItem('texture', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">매장 추천 설명</label>
              <textarea
                className="form-textarea"
                value={selectedItem.recommendation}
                onChange={e => handleUpdateItem('recommendation', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
