import React, { useState } from 'react';
import { ReasoningNode } from '../types';
import { 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  ChevronDown, 
  ChevronRight, 
  RotateCw, 
  GitFork, 
  BookOpen, 
  Send, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface NodeInspectorProps {
  node: ReasoningNode | null;
  onRetryFromNode: (nodeId: string, modificationPrompt: string, actionType: 'retry' | 'branch') => Promise<void>;
  isProcessing: boolean;
  onClose?: () => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  node,
  onRetryFromNode,
  isProcessing,
  onClose,
}) => {
  const [modificationText, setModificationText] = useState('');
  const [isErrorTraceOpen, setIsErrorTraceOpen] = useState(true);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(true);

  if (!node) {
    return (
      <aside className="w-80 md:w-96 border-l border-slate-200 bg-white h-full p-6 flex flex-col items-center justify-center text-center select-none text-slate-400">
        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h4 className="font-medium text-sm text-slate-700 mb-1">노드가 선택되지 않았습니다</h4>
        <p className="text-xs text-slate-500 max-w-[220px]">
          좌측 캔버스에서 추론 노드를 클릭하면 상세 검증 로그 및 전문의 수정 인터페이스가 표시됩니다.
        </p>
      </aside>
    );
  }

  const isFailed = node.status === 'failed';
  const isWarning = node.status === 'warning';
  const isOverridden = node.status === 'overridden' || node.isHumanOverridden;

  // Preset quick correction suggestions based on node type
  const quickSuggestions = isFailed
    ? [
        '신독성 조영제 대신 IVUS 유도 초저용량 PCI 프로토콜 적용',
        '페니실린 교차반응 우려로 아즈트레오남(Aztreonam)으로 항생제 교체',
        '불확실성 해소를 위해 응급 Troponin-I 정량 재검 지시',
      ]
    : [
        '해당 노드에 환자 신기능(eGFR 24) 감량 기준 추가 반영',
        '치료 가이드라인 Class I 권고로 승격 검토',
        '추가 감별진단 가설(대동맥 박리 배제) 브랜치 생성',
      ];

  const handleApplyRetry = async (actionType: 'retry' | 'branch' = 'retry') => {
    if (!modificationText.trim()) return;
    await onRetryFromNode(node.id, modificationText, actionType);
    setModificationText('');
  };

  return (
    <aside className="w-80 sm:w-96 lg:w-[410px] border-l border-slate-200 bg-white h-full flex flex-col shrink-0 z-20 shadow-[-1px_0_3px_rgba(0,0,0,0.02)]">
      {/* Top Header - Exact Match to Screenshot */}
      <div className="p-5 pb-4 border-b border-slate-200 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isFailed
                ? 'bg-red-50 text-red-600 border-red-200'
                : isOverridden
                ? 'bg-purple-50 text-purple-600 border-purple-200'
                : isWarning
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}
          >
            {isFailed ? (
              <AlertCircle className="w-5 h-5" />
            ) : isOverridden ? (
              <UserCheck className="w-5 h-5" />
            ) : isWarning ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <h2 className="font-bold text-[17px] tracking-tight text-slate-900 leading-tight">
              Node Inspector
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-xs text-slate-500 font-medium">
                ID: {node.id}
              </span>
              <span className="text-slate-300">|</span>
              <span
                className={`font-mono text-xs font-semibold tracking-wide ${
                  isFailed
                    ? 'text-red-600'
                    : isOverridden
                    ? 'text-purple-600'
                    : isWarning
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {node.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* 2x2 Key Metrics Grid - Exact Match to Screenshot */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Status */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/40">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
              Status
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isFailed
                    ? 'bg-red-500'
                    : isOverridden
                    ? 'bg-purple-600'
                    : isWarning
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
              />
              <span
                className={`font-mono font-bold text-sm ${
                  isFailed
                    ? 'text-red-600'
                    : isOverridden
                    ? 'text-purple-700'
                    : 'text-slate-900'
                }`}
              >
                {isFailed ? 'Failed' : isOverridden ? 'Overridden' : isWarning ? 'Warning' : 'Verified'}
              </span>
            </div>
          </div>

          {/* Duration */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/40">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
              Duration
            </div>
            <div className="font-mono font-bold text-sm text-slate-900">
              {node.duration}
            </div>
          </div>

          {/* Confidence */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/40">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
              Confidence
            </div>
            <div
              className={`font-mono font-bold text-sm ${
                isFailed ? 'text-red-600' : 'text-slate-900'
              }`}
            >
              {node.confidence.toFixed(1)}%
            </div>
          </div>

          {/* Tokens Used */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/40">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
              Tokens Used
            </div>
            <div className="font-mono font-bold text-sm text-slate-900">
              {node.tokensUsed}
            </div>
          </div>
        </div>

        {/* Summary Section - Exact Match */}
        <div>
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
            Summary
          </div>
          <div
            className={`p-3.5 rounded-lg text-[13px] leading-relaxed font-sans ${
              isFailed
                ? 'bg-red-50/40 text-red-900 border border-red-200/80'
                : isOverridden
                ? 'bg-purple-50/50 text-purple-950 border border-purple-200/70'
                : 'bg-slate-50 text-slate-800 border border-slate-200/70'
            }`}
          >
            {node.summary}
          </div>
          {node.doctorCorrection && (
            <div className="mt-2 p-2.5 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 flex items-start gap-2">
              <UserCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-purple-950">전문의 수정 지시:</span>{' '}
                {node.doctorCorrection}
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Error Trace / Execution Logs - Exact Match */}
        {node.errorTrace && node.errorTrace.length > 0 && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsErrorTraceOpen(!isErrorTraceOpen)}
              className="w-full px-3.5 py-2.5 bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-1.5 font-mono">
                {isErrorTraceOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>Error Trace / Reasoning Logs</span>
              </div>
              <span className="text-[10px] text-slate-600 font-mono">
                {node.errorTrace.length} events
              </span>
            </button>

            {isErrorTraceOpen && (
              <div className="p-3.5 bg-slate-900 text-slate-200 font-mono text-[11.5px] leading-relaxed space-y-1.5 overflow-x-auto max-h-48 custom-scrollbar select-text">
                {node.errorTrace.map((line, idx) => {
                  const isAlert = line.startsWith('!!');
                  const isWarn = line.startsWith('??');
                  return (
                    <div
                      key={idx}
                      className={`${
                        isAlert
                          ? 'text-red-400 font-semibold'
                          : isWarn
                          ? 'text-amber-300'
                          : 'text-slate-300'
                      }`}
                    >
                      {line}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Clinical Evidence & Guidelines Citations */}
        {node.evidence && node.evidence.length > 0 && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsEvidenceOpen(!isEvidenceOpen)}
              className="w-full px-3.5 py-2.5 bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-1.5 font-mono">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Clinical Evidence & Guidelines</span>
              </div>
              <span className="text-[10px] text-slate-600 font-mono">
                {node.evidence.length} cited
              </span>
            </button>

            {isEvidenceOpen && (
              <div className="p-3 space-y-2.5 bg-white divide-y divide-slate-100 text-xs">
                {node.evidence.map((ev) => (
                  <div key={ev.id} className="pt-2 first:pt-0">
                    <div className="font-semibold text-slate-900 flex items-center justify-between">
                      <span>{ev.title}</span>
                      {ev.grade && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                          {ev.grade}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                      {ev.source}
                    </div>
                    <div className="text-[11.5px] text-slate-600 mt-1 italic pl-2 border-l-2 border-slate-200">
                      "{ev.snippet}"
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Doctor In-the-Loop Human Override Panel (Bottom) - Exact Match */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="doctor-mod-textarea"
            className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>임상 가설 수정 및 노드 재평가</span>
          </label>
          <span className="text-[10px] text-slate-600">Human-in-the-Loop</span>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {quickSuggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setModificationText(sug)}
              className="text-[10.5px] text-slate-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 rounded-md px-2 py-1 transition-colors text-left truncate max-w-full"
            >
              + {sug}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          id="doctor-mod-textarea"
          rows={3}
          value={modificationText}
          onChange={(e) => setModificationText(e.target.value)}
          placeholder="How should this be modified? / 임상 소견이나 가설 수정 사항을 입력하세요..."
          className="w-full p-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder:text-slate-400 font-sans shadow-2xs"
        />

        {/* Action Buttons */}
        <div className="mt-2.5 flex items-center gap-2">
          <button
            id="retry-from-node-btn"
            disabled={!modificationText.trim() || isProcessing}
            onClick={() => handleApplyRetry('retry')}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-500/10 cursor-pointer disabled:cursor-not-allowed"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? '추론 재계산 중...' : 'Retry from here'}</span>
          </button>

          <button
            id="branch-hypothesis-btn"
            disabled={!modificationText.trim() || isProcessing}
            onClick={() => handleApplyRetry('branch')}
            title="기존 경로를 보존하고 새 가설 분기 생성"
            className="py-2.5 px-3 bg-white hover:bg-slate-100 disabled:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            <GitFork className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">분기 추가</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
