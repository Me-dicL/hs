export type NodeStatus = 'success' | 'failed' | 'warning' | 'in_progress' | 'overridden';

export type NodeCategory = 
  | 'input' 
  | 'retrieval' 
  | 'hypothesis' 
  | 'analysis' 
  | 'contraindication' 
  | 'treatment' 
  | 'fallback';

export interface ClinicalEvidence {
  id: string;
  title: string;
  source: string;
  snippet: string;
  grade?: string; // e.g. "Class I (Level A)"
  doiOrUrl?: string;
}

export interface ReasoningNode {
  id: string; // e.g. "N-001"
  title: string;
  description: string;
  status: NodeStatus;
  duration: string; // e.g. "0.45s"
  confidence: number; // 0 to 100
  tokensUsed: number;
  summary: string;
  errorTrace?: string[];
  evidence?: ClinicalEvidence[];
  doctorCorrection?: string;
  isHumanOverridden?: boolean;
  position: { x: number; y: number };
  category: NodeCategory;
  clinicalNotes?: string;
  parentId?: string;
}

export interface ReasoningEdge {
  id: string;
  source: string;
  target: string;
  type: 'default' | 'fallback' | 'warning' | 'alternative';
  label?: string;
}

export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  vitals: {
    bp: string;
    hr: string;
    rr: string;
    bt: string;
    spo2: string;
  };
  labs?: Record<string, string>;
  allergies?: string[];
  history?: string[];
}

export interface MedicalCase {
  id: string;
  title: string;
  patient: PatientProfile;
  prompt: string;
  nodes: ReasoningNode[];
  edges: ReasoningEdge[];
  fullClinicalSummary: string;
  soapNote: SoapNote;
  createdAt: string;
}
