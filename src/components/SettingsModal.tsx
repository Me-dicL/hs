import React, { useState } from 'react';
import { X, Sliders, Shield, BrainCircuit, RotateCcw, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetLayout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onResetLayout,
}) => {
  const [thinkingLevel, setThinkingLevel] = useState<'high' | 'low'>('high');
  const [strictSafety, setStrictSafety] = useState(true);
  const [guidelineDatabase, setGuidelineDatabase] = useState('all');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">추론 엔진 및 캔버스 설정</h3>
              <p className="text-xs text-slate-500">MedLogic Engine v3.7</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Thinking Level */}
          <div>
            <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-blue-600" />
              <span>AI 추론 심도 (Reasoning Depth)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setThinkingLevel('high')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  thinkingLevel === 'high'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-slate-900">High (정밀 임상 가이드)</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  다단계 검증, 희귀 금기 교차 검색 및 상세 추론 로그 생성
                </div>
              </button>
              <button
                type="button"
                onClick={() => setThinkingLevel('low')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  thinkingLevel === 'low'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-slate-900">Fast (응급 선별)</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  신속한 1차 감별 및 즉각적인 요약 산출
                </div>
              </button>
            </div>
          </div>

          {/* Safety Guardrails */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>약물 알레르기 & 신독성 강제 차단 가드레일</span>
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  금기 약물 감지 시 즉시 Error/Fallback 노드로 분기
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStrictSafety(!strictSafety)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  strictSafety ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform transform ${
                    strictSafety ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Reset Layout */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800">캔버스 노드 위치 초기화</span>
              <span className="text-[11px] text-slate-500 block">
                사용자가 드래그한 노드 좌표를 기본 트리 구조로 재정렬합니다.
              </span>
            </div>
            <button
              onClick={() => {
                onResetLayout();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>정렬 리셋</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            설정 완료
          </button>
        </div>
      </div>
    </div>
  );
};
