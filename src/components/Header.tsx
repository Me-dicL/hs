import React from 'react';
import { GitBranch, Bell, Settings, User, FileText, Activity, ShieldAlert, Sparkles } from 'lucide-react';
import { MedicalCase } from '../types';

interface HeaderProps {
  currentCase: MedicalCase;
  allCases: MedicalCase[];
  onSelectCase: (c: MedicalCase) => void;
  onOpenSettings: () => void;
  onOpenPatientInfo: () => void;
  onOpenChat: () => void;
  isGenerating?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentCase,
  allCases,
  onSelectCase,
  onOpenSettings,
  onOpenPatientInfo,
  onOpenChat,
  isGenerating,
}) => {
  return (
    <header className="h-14 border-b border-slate-200 bg-white px-5 flex items-center justify-between z-30 shrink-0 select-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <GitBranch className="w-5 h-5 rotate-90" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-[17px] tracking-tight text-slate-900 font-sans">
              AILogic Canvas
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
              Clinical Decision Support
            </span>
          </div>
        </div>

        {/* Case Switcher Dropdown */}
        <div className="hidden md:flex items-center ml-4 pl-4 border-l border-slate-200">
          <label htmlFor="case-select" className="text-xs text-slate-500 mr-2 font-medium">임상 케이스:</label>
          <select
            id="case-select"
            value={currentCase.id}
            onChange={(e) => {
              const selected = allCases.find((c) => c.id === e.target.value);
              if (selected) onSelectCase(selected);
            }}
            className="text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md py-1 px-2.5 outline-none focus:ring-1 focus:ring-blue-500 max-w-[280px] truncate cursor-pointer transition-colors"
          >
            {allCases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          {/* Patient Quick Info Button */}
          <button
            id="patient-info-btn"
            onClick={onOpenPatientInfo}
            className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md shadow-2xs transition-colors"
            title="환자 상세 정보 및 활력징후 확인"
          >
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>{currentCase.patient.name}</span>
            <span className="text-slate-500">({currentCase.patient.gender}/{currentCase.patient.age}세)</span>
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {isGenerating && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium animate-pulse">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>AI 추론 연산 중...</span>
          </div>
        )}

        {/* AI Doctor Chat Drawer button */}
        <button
          id="open-doctor-chat-btn"
          onClick={onOpenChat}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50/70 border border-slate-200 rounded-lg transition-colors"
          title="AI 임상 어시스턴트와 직접 질의응답"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">AI 전문의 상담</span>
        </button>

        {/* Notification Bell */}
        <button
          id="notifications-btn"
          aria-label="알림"
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>

        {/* Settings */}
        <button
          id="settings-btn"
          onClick={onOpenSettings}
          aria-label="설정"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-xs ring-2 ring-slate-100 shadow-2xs overflow-hidden">
            <span className="text-[11px]">MD</span>
          </div>
          <div className="hidden xl:block text-left text-xs">
            <div className="font-semibold text-slate-800 leading-tight">Dr. Kim, MD</div>
            <div className="text-[10px] text-slate-600">순환기내과 전문의</div>
          </div>
        </div>
      </div>
    </header>
  );
};
