import React from 'react';
import { MedicalCase } from '../types';
import { FileText, ClipboardList, CheckCircle2, AlertTriangle, ShieldCheck, Copy, Check } from 'lucide-react';

interface RawTextViewProps {
  currentCase: MedicalCase;
}

export const RawTextView: React.FC<RawTextViewProps> = ({ currentCase }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyNote = () => {
    const fullText = `[SOAP Clinical Decision Record]
Case: ${currentCase.title}
Patient: ${currentCase.patient.name} (${currentCase.patient.gender}/${currentCase.patient.age})
Chief Complaint: ${currentCase.patient.chiefComplaint}

[S] Subjective:
${currentCase.soapNote.subjective}

[O] Objective:
${currentCase.soapNote.objective}

[A] Assessment:
${currentCase.soapNote.assessment}

[P] Plan:
${currentCase.soapNote.plan}

[Decision Reasoning Chain Summary]:
${currentCase.fullClinicalSummary}`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 p-6 md:p-10 pb-36">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                SOAP & Clinical Decision Document
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {currentCase.id}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {currentCase.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              환자: {currentCase.patient.name} | {currentCase.patient.gender} | {currentCase.patient.age}세
            </p>
          </div>

          <button
            onClick={handleCopyNote}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">복사 완료</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>의무기록 복사</span>
              </>
            )}
          </button>
        </div>

        {/* SOAP Note Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subjective */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 mb-2.5 text-xs font-bold font-mono text-blue-700 uppercase">
              <span className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                S
              </span>
              <span>Subjective (주관적 증상)</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
              {currentCase.soapNote.subjective}
            </p>
          </div>

          {/* Objective */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 mb-2.5 text-xs font-bold font-mono text-emerald-700 uppercase">
              <span className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                O
              </span>
              <span>Objective (객관적 검사소견)</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
              {currentCase.soapNote.objective}
            </p>
          </div>

          {/* Assessment */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 mb-2.5 text-xs font-bold font-mono text-purple-700 uppercase">
              <span className="w-5 h-5 rounded-md bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                A
              </span>
              <span>Assessment (임상 평가 & 감별진단)</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
              {currentCase.soapNote.assessment}
            </p>
          </div>

          {/* Plan */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 mb-2.5 text-xs font-bold font-mono text-indigo-700 uppercase">
              <span className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                P
              </span>
              <span>Plan (치료 및 모니터링 계획)</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
              {currentCase.soapNote.plan}
            </p>
          </div>
        </div>

        {/* Full Clinical Reasoning Narrative */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              AI 다단계 의사결정 추론 전말 (Full Reasoning Trace)
            </h2>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-800 whitespace-pre-line font-sans">
            {currentCase.fullClinicalSummary}
          </div>
        </div>

        {/* Step-by-Step Node Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>단계별 검증 노드 기록 ({currentCase.nodes.length}개)</span>
          </h3>

          <div className="space-y-3">
            {currentCase.nodes.map((node) => (
              <div
                key={node.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-start gap-3"
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    node.status === 'failed'
                      ? 'bg-red-500'
                      : node.status === 'overridden'
                      ? 'bg-purple-600'
                      : node.status === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-blue-600'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      [{node.id}] {node.title}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                      <span>신뢰도: {node.confidence.toFixed(1)}%</span>
                      <span>•</span>
                      <span>소요시간: {node.duration}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 font-sans mb-1.5">
                    {node.description}
                  </p>
                  <div className="text-xs font-sans text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-900">요약: </span>
                    {node.summary}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
