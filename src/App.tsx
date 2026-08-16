import React, { useState } from 'react';
import { MedicalCase, ReasoningNode } from './types';
import { PRESET_CASES } from './presetCases';
import { Header } from './components/Header';
import { GraphCanvas } from './components/GraphCanvas';
import { NodeInspector } from './components/NodeInspector';
import { BottomToolbar } from './components/BottomToolbar';
import { RawTextView } from './components/RawTextView';
import { PatientDetailsModal } from './components/PatientDetailsModal';
import { SettingsModal } from './components/SettingsModal';
import { DoctorChatDrawer } from './components/DoctorChatDrawer';

export default function App() {
  const [allCases, setAllCases] = useState<MedicalCase[]>(PRESET_CASES);
  const [currentCase, setCurrentCase] = useState<MedicalCase>(PRESET_CASES[0]);
  
  // Default selected node is N-004 (Failed Fallback) to match user's screenshot
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('N-004');
  const [viewMode, setViewMode] = useState<'graph' | 'raw_text'>('graph');

  // Modals and Drawers
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  // Loading state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNodeRetrying, setIsNodeRetrying] = useState(false);

  // Selected node object
  const selectedNode = currentCase.nodes.find((n) => n.id === selectedNodeId) || null;

  // Handle selecting a case from header
  const handleSelectCase = (c: MedicalCase) => {
    setCurrentCase(c);
    // Find failed or first node
    const failedNode = c.nodes.find((n) => n.status === 'failed');
    setSelectedNodeId(failedNode ? failedNode.id : c.nodes[0]?.id || null);
  };

  // Handle node selection
  const handleSelectNode = (node: ReasoningNode) => {
    setSelectedNodeId(node.id);
  };

  // Handle node coordinate drag & drop
  const handleUpdateNodePosition = (nodeId: string, position: { x: number; y: number }) => {
    setCurrentCase((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, position } : n)),
    }));
  };

  // Reset layout to default hierarchical coordinates
  const handleResetLayout = () => {
    const defaultPositions: Record<string, { x: number; y: number }> = {
      'N-001': { x: 380, y: 40 },
      'N-002': { x: 180, y: 220 },
      'N-004': { x: 580, y: 220 },
      'N-003': { x: 180, y: 400 },
      'N-005': { x: 180, y: 580 },
    };

    setCurrentCase((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n, idx) => ({
        ...n,
        position: defaultPositions[n.id] || { x: 280, y: 50 + idx * 170 },
      })),
    }));
  };

  // Execute new prompt from bottom toolbar
  const handleExecutePrompt = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/reasoning/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          patientContext: currentCase.patient,
        }),
      });

      const data = await res.json();
      if (data.success && data.caseData) {
        setAllCases((prev) => [data.caseData, ...prev]);
        setCurrentCase(data.caseData);
        const failedNode = data.caseData.nodes.find((n: ReasoningNode) => n.status === 'failed');
        setSelectedNodeId(failedNode ? failedNode.id : data.caseData.nodes[0]?.id || null);
      }
    } catch (err) {
      console.error('Failed to generate reasoning:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Retry / Modify from a specific node
  const handleRetryFromNode = async (
    nodeId: string,
    modificationPrompt: string,
    actionType: 'retry' | 'branch'
  ) => {
    setIsNodeRetrying(true);
    try {
      const res = await fetch('/api/reasoning/retry-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseData: currentCase,
          targetNodeId: nodeId,
          modificationPrompt,
          actionType,
        }),
      });

      const data = await res.json();
      if (data.success && data.caseData) {
        setCurrentCase(data.caseData);
        setAllCases((prev) =>
          prev.map((c) => (c.id === data.caseData.id ? data.caseData : c))
        );
        setSelectedNodeId(nodeId);
      }
    } catch (err) {
      console.error('Failed to retry node:', err);
    } finally {
      setIsNodeRetrying(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Top Navigation Header */}
      <Header
        currentCase={currentCase}
        allCases={allCases}
        onSelectCase={handleSelectCase}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenPatientInfo={() => setIsPatientModalOpen(true)}
        onOpenChat={() => setIsChatDrawerOpen(true)}
        isGenerating={isGenerating}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Central Workspace (Graph Canvas or Raw Text) */}
        <main className="flex-1 flex flex-col relative overflow-hidden h-full">
          {viewMode === 'graph' ? (
            <GraphCanvas
              nodes={currentCase.nodes}
              edges={currentCase.edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              onUpdateNodePosition={handleUpdateNodePosition}
            />
          ) : (
            <RawTextView currentCase={currentCase} />
          )}

          {/* Bottom Floating Control Bar (Graph/Raw toggle & logic prompt bar) */}
          <BottomToolbar
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            onExecutePrompt={handleExecutePrompt}
            isGenerating={isGenerating}
          />
        </main>

        {/* Right Sidebar: Node Inspector (Exact match to screenshot) */}
        <NodeInspector
          node={selectedNode}
          onRetryFromNode={handleRetryFromNode}
          isProcessing={isNodeRetrying}
        />
      </div>

      {/* Modals & Drawers */}
      <PatientDetailsModal
        patient={currentCase.patient}
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onResetLayout={handleResetLayout}
      />

      <DoctorChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        currentCase={currentCase}
      />
    </div>
  );
}
