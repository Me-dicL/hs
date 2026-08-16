import React from 'react';
import { PatientProfile } from '../types';
import { X, Activity, AlertOctagon, FileSpreadsheet, User } from 'lucide-react';

interface PatientDetailsModalProps {
  patient: PatientProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  patient,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">환자 전자의무기록 (EMR) 요약</h3>
              <p className="text-xs text-slate-500 font-mono">Patient ID: {patient.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Patient Overview */}
          <div className="p-3.5 bg-blue-50/40 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
              <span className="text-slate-600 ml-2">({patient.gender}, 만 {patient.age}세)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium text-[11px]">
              응급실 / 입원 평가 중
            </span>
          </div>

          {/* Chief Complaint */}
          <div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              주호소 (Chief Complaint)
            </span>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-sans">
              {patient.chiefComplaint}
            </div>
          </div>

          {/* Vital Signs Grid */}
          <div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-red-500" />
              활력 징후 (Vital Signs)
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <div className="text-[10px] text-slate-500">혈압 (BP)</div>
                <div className="font-mono font-bold text-slate-900 mt-0.5">{patient.vitals.bp}</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <div className="text-[10px] text-slate-500">맥박 (HR)</div>
                <div className="font-mono font-bold text-slate-900 mt-0.5">{patient.vitals.hr}</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <div className="text-[10px] text-slate-500">체온 (BT)</div>
                <div className="font-mono font-bold text-slate-900 mt-0.5">{patient.vitals.bt}</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <div className="text-[10px] text-slate-500">호흡수 (RR)</div>
                <div className="font-mono font-bold text-slate-900 mt-0.5">{patient.vitals.rr}</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center col-span-2">
                <div className="text-[10px] text-slate-500">산소포화도 (SpO2)</div>
                <div className="font-mono font-bold text-slate-900 mt-0.5">{patient.vitals.spo2}</div>
              </div>
            </div>
          </div>

          {/* Labs */}
          {patient.labs && Object.keys(patient.labs).length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                주요 임상병리 검사 수치 (Labs)
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {Object.entries(patient.labs).map(([test, val]) => (
                  <div key={test} className="flex items-center justify-between p-2.5 bg-white">
                    <span className="font-medium text-slate-700">{test}</span>
                    <span className="font-mono font-bold text-slate-900">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Allergies Warning */}
          {patient.allergies && patient.allergies.length > 0 && (
            <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">약물 알레르기 및 금기 이력:</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {patient.allergies.map((al, idx) => (
                    <li key={idx}>{al}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Past Medical History */}
          {patient.history && patient.history.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                기저 병력 (Past Medical History)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {patient.history.map((h, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
