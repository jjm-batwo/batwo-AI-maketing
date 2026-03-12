'use client';

import { useState } from 'react';

interface BulkBudgetModalProps {
  onClose: () => void;
  onConfirm: (mode: 'percentage' | 'absolute', value: number) => void;
}

export function BulkBudgetModal({ onClose, onConfirm }: BulkBudgetModalProps) {
  const [mode, setMode] = useState<'percentage' | 'absolute'>('percentage');
  const [value, setValue] = useState<number>(0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-card border border-border rounded-xl p-6 w-96 max-w-full shadow-xl">
        <h2 className="text-xl font-semibold text-foreground mb-4">예산 일괄 변경</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">변경 방식</label>
            <select 
              value={mode}
              onChange={(e) => setMode(e.target.value as 'percentage' | 'absolute')}
              className="w-full border border-input bg-background text-foreground rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="percentage">현재 예산 대비 비율 (%)</option>
              <option value="absolute">고정 금액 (원)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {mode === 'percentage' ? '비율 (%)' : '금액 (원)'}
            </label>
            <input 
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              placeholder={mode === 'percentage' ? '예: 20 (예산 20% 증액)' : '예: 100000'}
              className="w-full border border-input bg-background text-foreground rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {mode === 'percentage' && (
              <p className="text-xs text-muted-foreground mt-1">
                음수를 입력하면 예산이 삭감됩니다. (예: -20)
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
          >
            취소
          </button>
          <button 
            onClick={() => onConfirm(mode, value)}
            className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
