import React, { useState } from 'react';
import { GitBranch, FileText, Play, Sparkles, MessageSquare } from 'lucide-react';

interface BottomToolbarProps {
  viewMode: 'graph' | 'raw_text';
  onChangeViewMode: (mode: 'graph' | 'raw_text') => void;
  onExecutePrompt: (prompt: string) => Promise<void>;
  isGenerating: boolean;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  viewMode,
  onChangeViewMode,
  onExecutePrompt,
  isGenerating,
}) => {
  const [promptInput, setPromptInput] = useState('');

  const quickPrompts = [
    '62세 남성, 흉골 하부 압박통, CKD 4기(eGFR 24), STEMI 의심 시술 및 약물 가이드',
    '54세 여성, 패혈성 쇼크 의심, 과거 페니실린 아나필락시스 쇼크 병력, 경험적 항생제',
    '71세 남성, 급성 편측마비 발생 3시간, 고혈압 및 와파린 복용 중, IV tPA 적응증 평가',
    '28세 여성, 당뇨병성 케톤산증(DKA) 혈당 450, K+ 3.2 mEq/L, 인슐린 및 칼륨 교정',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isGenerating) return;
    await onExecutePrompt(promptInput);
    setPromptInput('');
  };

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2.5 w-[92%] max-w-2xl pointer-events-auto">
      {/* View Mode Toggle Switch (Exact look from screenshot: [ 그래프 | 원본 텍스트 ]) */}
      <div className="inline-flex p-1 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-md">
        <button
          id="view-mode-graph-btn"
          type="button"
          onClick={() => onChangeViewMode('graph')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === 'graph'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>그래프</span>
        </button>

        <button
          id="view-mode-raw-btn"
          type="button"
          onClick={() => onChangeViewMode('raw_text')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === 'raw_text'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>원본 텍스트</span>
        </button>
      </div>

      {/* Main Prompt Bar - Exact Match to Screenshot */}
      <form
        onSubmit={handleSubmit}
        className="w-full bg-white/95 backdrop-blur-md border border-slate-300/90 rounded-2xl p-1.5 shadow-lg flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all"
      >
        <div className="pl-3 text-slate-400">
          <MessageSquare className="w-4 h-4" />
        </div>
        <input
          id="logic-prompt-input"
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder="Enter logic prompt to trace... (환자 임상 증상 또는 의학 질의 입력)"
          disabled={isGenerating}
          className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none font-sans"
        />

        <button
          id="execute-logic-prompt-btn"
          type="submit"
          disabled={!promptInput.trim() || isGenerating}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>추론 중...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Execute</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Prompt Pills for Doctors */}
      <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5 no-scrollbar">
        <span className="text-[11px] text-slate-600 whitespace-nowrap font-medium">
          빠른 시나리오:
        </span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onExecutePrompt(qp)}
            className="text-[10.5px] text-slate-700 bg-white/90 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/90 rounded-full px-2.5 py-0.5 whitespace-nowrap transition-colors shadow-2xs cursor-pointer"
          >
            {qp.slice(0, 22)}...
          </button>
        ))}
      </div>
    </div>
  );
};
