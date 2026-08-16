import React from 'react';
import { ReasoningNode } from '../types';
import { CheckCircle2, AlertCircle, AlertTriangle, UserCheck, Clock } from 'lucide-react';

interface NodeCardProps {
  node: ReasoningNode;
  isSelected: boolean;
  onSelect: (node: ReasoningNode) => void;
  onDragStart: (e: React.MouseEvent, node: ReasoningNode) => void;
}

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  isSelected,
  onSelect,
  onDragStart,
}) => {
  const isFailed = node.status === 'failed';
  const isWarning = node.status === 'warning';
  const isOverridden = node.status === 'overridden' || node.isHumanOverridden;

  // Determine dot color
  let dotColor = 'bg-blue-600';
  if (isFailed) dotColor = 'bg-red-500';
  else if (isWarning) dotColor = 'bg-amber-500';
  else if (isOverridden) dotColor = 'bg-purple-600';
  else if (node.category === 'hypothesis') dotColor = 'bg-blue-500';

  // Determine border style
  let borderClasses = 'border border-slate-200 hover:border-slate-300';
  if (isFailed) {
    borderClasses = 'border-2 border-red-500 shadow-sm';
  } else if (isOverridden) {
    borderClasses = 'border-2 border-purple-500/80 bg-purple-50/20';
  } else if (isSelected) {
    borderClasses = 'border-2 border-blue-600 shadow-md ring-2 ring-blue-100';
  }

  return (
    <div
      id={`node-${node.id}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node);
      }}
      onMouseDown={(e) => {
        // Only drag when clicking card body, not buttons
        onDragStart(e, node);
      }}
      style={{
        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
      }}
      className={`absolute w-[300px] sm:w-[320px] rounded-xl bg-white p-5 cursor-grab active:cursor-grabbing transition-shadow select-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${borderClasses}`}
    >
      {/* Top Header: Dot + Monospace Title */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${dotColor} shrink-0`} />
          <h3 className="font-mono font-semibold text-[14.5px] tracking-tight text-slate-900 leading-none">
            {node.title}
          </h3>
        </div>

        {/* Status indicator / ID badge */}
        <div className="flex items-center gap-1.5">
          {isOverridden && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 border border-purple-200">
              <UserCheck className="w-2.5 h-2.5" />
              MD 수정
            </span>
          )}
          {isFailed && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-red-100 text-red-700">
              FAILED
            </span>
          )}
          <span className="text-[11px] font-mono text-slate-500">
            {node.id}
          </span>
        </div>
      </div>

      {/* Description text */}
      <p className="text-[13px] leading-relaxed text-slate-600 font-sans line-clamp-4">
        {node.description}
      </p>

      {/* Footer Metrics (Subtle) */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{node.duration}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>신뢰도:</span>
          <span className={`font-semibold ${isFailed ? 'text-red-600' : node.confidence > 90 ? 'text-emerald-600' : 'text-slate-700'}`}>
            {node.confidence.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};
