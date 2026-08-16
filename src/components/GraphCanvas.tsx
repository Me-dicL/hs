import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ReasoningNode, ReasoningEdge } from '../types';
import { NodeCard } from './NodeCard';
import { Plus, Minus, Maximize2, RotateCcw } from 'lucide-react';

interface GraphCanvasProps {
  nodes: ReasoningNode[];
  edges: ReasoningEdge[];
  selectedNodeId: string | null;
  onSelectNode: (node: ReasoningNode) => void;
  onUpdateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onUpdateNodePosition,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Dragging individual node
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.45));
  const handleFitView = useCallback(() => {
    if (!nodes.length || !containerRef.current) return;
    const minX = Math.min(...nodes.map((n) => n.position.x));
    const maxX = Math.max(...nodes.map((n) => n.position.x + 320));
    const minY = Math.min(...nodes.map((n) => n.position.y));
    const maxY = Math.max(...nodes.map((n) => n.position.y + 180));

    const containerWidth = containerRef.current.clientWidth || 800;
    const containerHeight = containerRef.current.clientHeight || 600;

    const graphWidth = maxX - minX + 120;
    const graphHeight = maxY - minY + 120;

    const newZoom = Math.min(
      Math.max(Math.min(containerWidth / graphWidth, containerHeight / graphHeight, 1), 0.55),
      1.1
    );

    const newPanX = (containerWidth - (maxX + minX) * newZoom) / 2;
    const newPanY = (containerHeight - (maxY + minY) * newZoom) / 2;

    setZoom(newZoom);
    setPan({ x: Math.max(newPanX, 20), y: Math.max(newPanY, 20) });
  }, [nodes]);

  // Handle canvas background dragging for pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary mouse button
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    } else if (draggingNodeId) {
      const newX = (e.clientX - pan.x) / zoom - dragOffset.x;
      const newY = (e.clientY - pan.y) / zoom - dragOffset.y;
      onUpdateNodePosition(draggingNodeId, {
        x: Math.round(newX),
        y: Math.round(newY),
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.4), 2.2));
  };

  const handleNodeDragStart = (e: React.MouseEvent, node: ReasoningNode) => {
    e.stopPropagation();
    setDraggingNodeId(node.id);
    setDragOffset({
      x: (e.clientX - pan.x) / zoom - node.position.x,
      y: (e.clientY - pan.y) / zoom - node.position.y,
    });
  };

  // Node dimension constants for calculating edge bezier paths
  const NODE_WIDTH = 320;
  const NODE_HEIGHT = 160;

  // Generate SVG Bezier curve between source and target
  const renderEdge = (edge: ReasoningEdge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) return null;

    // Anchor points: Source bottom-center, Target top-center
    const sx = sourceNode.position.x + NODE_WIDTH / 2;
    const sy = sourceNode.position.y + NODE_HEIGHT;
    const tx = targetNode.position.x + NODE_WIDTH / 2;
    const ty = targetNode.position.y;

    // Bezier control points
    const dy = Math.abs(ty - sy) * 0.55;
    const c1x = sx;
    const c1y = sy + dy;
    const c2x = tx;
    const c2y = ty - dy;

    const pathData = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`;

    const isFallback = edge.type === 'fallback';
    const isWarning = edge.type === 'warning';
    const isAlternative = edge.type === 'alternative';

    let strokeColor = '#2563eb'; // blue-600
    let markerId = 'arrowhead-blue';
    let strokeDasharray = 'none';

    if (isFallback) {
      strokeColor = '#ef4444'; // red-500
      markerId = 'arrowhead-red';
      strokeDasharray = '5,4'; // Dotted/dashed red like in image
    } else if (isWarning) {
      strokeColor = '#f59e0b'; // amber-500
      markerId = 'arrowhead-amber';
      strokeDasharray = '4,4';
    } else if (isAlternative) {
      strokeColor = '#9333ea'; // purple-600
      markerId = 'arrowhead-purple';
    }

    return (
      <g key={edge.id}>
        {/* Glow/Hover background line */}
        <path
          d={pathData}
          fill="none"
          stroke="transparent"
          strokeWidth="16"
          className="hover:stroke-blue-500/10 cursor-pointer transition-colors"
        />
        {/* Main Edge Path */}
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeDasharray={strokeDasharray}
          markerEnd={`url(#${markerId})`}
          className="transition-all duration-200"
        />
        {/* Optional Edge Label */}
        {edge.label && (
          <text
            x={(sx + tx) / 2}
            y={(sy + ty) / 2}
            fill="#64748b"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="middle"
            className="bg-white px-1"
          >
            {edge.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      id="reasoning-graph-canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="relative flex-1 h-full w-full overflow-hidden bg-slate-50/50 cursor-default select-none"
      style={{
        backgroundImage: `radial-gradient(#94a3b8 0.85px, transparent 0.85px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {/* Transformable Canvas Layer */}
      <div
        className="absolute origin-top-left will-change-transform"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: '4000px',
          height: '4000px',
        }}
      >
        {/* SVG Connectors Layer */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            {/* Blue Arrowhead */}
            <marker
              id="arrowhead-blue"
              markerWidth="9"
              markerHeight="9"
              refX="8"
              refY="4.5"
              orient="auto"
            >
              <polygon points="0 0, 9 4.5, 0 9" fill="#2563eb" />
            </marker>
            {/* Red Arrowhead */}
            <marker
              id="arrowhead-red"
              markerWidth="9"
              markerHeight="9"
              refX="8"
              refY="4.5"
              orient="auto"
            >
              <polygon points="0 0, 9 4.5, 0 9" fill="#ef4444" />
            </marker>
            {/* Amber Arrowhead */}
            <marker
              id="arrowhead-amber"
              markerWidth="9"
              markerHeight="9"
              refX="8"
              refY="4.5"
              orient="auto"
            >
              <polygon points="0 0, 9 4.5, 0 9" fill="#f59e0b" />
            </marker>
            {/* Purple Arrowhead */}
            <marker
              id="arrowhead-purple"
              markerWidth="9"
              markerHeight="9"
              refX="8"
              refY="4.5"
              orient="auto"
            >
              <polygon points="0 0, 9 4.5, 0 9" fill="#9333ea" />
            </marker>
          </defs>

          {edges.map(renderEdge)}
        </svg>

        {/* Nodes Layer */}
        {nodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            onSelect={onSelectNode}
            onDragStart={handleNodeDragStart}
          />
        ))}
      </div>

      {/* Floating Zoom & Canvas Controls (Bottom Left - Exact match to screenshot) */}
      <div className="absolute left-5 bottom-5 z-20 flex flex-col bg-white border border-slate-200/90 rounded-xl shadow-md overflow-hidden divide-y divide-slate-100">
        <button
          id="zoom-in-btn"
          onClick={handleZoomIn}
          title="Zoom In"
          aria-label="확대"
          className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          id="zoom-out-btn"
          onClick={handleZoomOut}
          title="Zoom Out"
          aria-label="축소"
          className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          id="fit-view-btn"
          onClick={handleFitView}
          title="Fit to Screen"
          aria-label="화면 맞춤"
          className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Canvas Status / Helper Hint */}
      <div className="absolute top-4 left-5 z-10 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/80 backdrop-blur-xs border border-slate-200/60 text-[11px] font-mono text-slate-500 shadow-2xs">
          <span>노드 개수: {nodes.length}</span>
          <span>•</span>
          <span>줌: {Math.round(zoom * 100)}%</span>
          <span>•</span>
          <span className="hidden sm:inline">노드 클릭 시 우측 인스펙터에서 수정 가능</span>
        </div>
      </div>
    </div>
  );
};
