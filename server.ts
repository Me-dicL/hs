import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API: Generate full clinical reasoning graph
app.post('/api/reasoning/generate', async (req, res) => {
  try {
    const { prompt, patientContext } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Return structured fallback based on prompt keywords if API key is not yet set
      return res.json({
        success: true,
        isSimulated: true,
        caseData: generateSimulatedCase(prompt, patientContext)
      });
    }

    const systemInstruction = `You are MedLogic, an advanced clinical reasoning AI engine designed for board-certified specialist physicians.
Your task is to decompose a complex medical decision query into a structured, transparent Directed Acyclic Graph (DAG) of logical reasoning nodes and connecting edges.
Each node represents a distinct step in the medical decision process:
1. 'Input Analysis' (parsing patient vitals, chief complaint, lab anomalies, risk factors)
2. 'Knowledge Retrieval' (searching clinical guidelines e.g. ACC/AHA, KDIGO, IDSA, GOLD, NCCN)
3. 'Differential Hypothesis' or 'Chain of Thought' (clinical diagnostic formulation, weighting risk-benefit)
4. 'Contraindication Check' / 'Error or Fallback' (identifying drug interactions, allergy blocks, renal/hepatic dose limits, or contradictory data)
5. 'Clinical Treatment Plan' (actionable orders, procedures, monitoring protocols)

Provide a rigorous, transparent breakdown. Include simulated execution metrics (duration in seconds e.g. "0.42s", confidence percentage 0-100, token count, terminal-like error/reasoning traces starting with ">>" or "!!", and guideline citations).
Ensure the graph has 4 to 6 connected nodes with coordinates laid out vertically or branched (x: 180..600, y: 40..600).
Also produce a formal SOAP note (Subjective, Objective, Assessment, Plan).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `Patient / Clinical Prompt:\n${prompt}\n\nAdditional Context:\n${JSON.stringify(patientContext || {})}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            patient: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                age: { type: Type.NUMBER },
                gender: { type: Type.STRING },
                chiefComplaint: { type: Type.STRING },
                vitals: {
                  type: Type.OBJECT,
                  properties: {
                    bp: { type: Type.STRING },
                    hr: { type: Type.STRING },
                    rr: { type: Type.STRING },
                    bt: { type: Type.STRING },
                    spo2: { type: Type.STRING },
                  },
                },
                allergies: { type: Type.ARRAY, items: { type: Type.STRING } },
                history: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  status: { type: Type.STRING, description: "'success' | 'failed' | 'warning' | 'in_progress' | 'overridden'" },
                  duration: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  tokensUsed: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  position: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                    },
                    required: ['x', 'y'],
                  },
                  summary: { type: Type.STRING },
                  errorTrace: { type: Type.ARRAY, items: { type: Type.STRING } },
                  evidence: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        source: { type: Type.STRING },
                        snippet: { type: Type.STRING },
                        grade: { type: Type.STRING },
                      },
                      required: ['id', 'title', 'source', 'snippet'],
                    },
                  },
                },
                required: ['id', 'title', 'description', 'status', 'duration', 'confidence', 'tokensUsed', 'summary', 'position', 'category'],
              },
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  type: { type: Type.STRING, description: "'default' | 'fallback' | 'warning' | 'alternative'" },
                  label: { type: Type.STRING },
                },
                required: ['id', 'source', 'target', 'type'],
              },
            },
            fullClinicalSummary: { type: Type.STRING },
            soapNote: {
              type: Type.OBJECT,
              properties: {
                subjective: { type: Type.STRING },
                objective: { type: Type.STRING },
                assessment: { type: Type.STRING },
                plan: { type: Type.STRING },
              },
              required: ['subjective', 'objective', 'assessment', 'plan'],
            },
          },
          required: ['title', 'patient', 'nodes', 'edges', 'fullClinicalSummary', 'soapNote'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      caseData: {
        id: `case-${Date.now()}`,
        prompt,
        ...parsed,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating medical reasoning:', error);
    // Fallback to simulated case on error
    const fallbackCase = generateSimulatedCase(req.body.prompt || 'Clinical Case', req.body.patientContext);
    return res.json({
      success: true,
      isFallback: true,
      errorNote: error?.message,
      caseData: fallbackCase,
    });
  }
});

// API: Re-run / modify reasoning from a specific node
app.post('/api/reasoning/retry-node', async (req, res) => {
  try {
    const { caseData, targetNodeId, modificationPrompt, actionType } = req.body;
    if (!caseData || !targetNodeId || !modificationPrompt) {
      return res.status(400).json({ error: 'Missing required parameters (caseData, targetNodeId, modificationPrompt)' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Simulate intelligent node modification
      const updatedCase = simulateNodeOverride(caseData, targetNodeId, modificationPrompt, actionType);
      return res.json({ success: true, caseData: updatedCase, isSimulated: true });
    }

    const systemInstruction = `You are MedLogic's Human-in-the-Loop Clinical Reasoning Engine.
A specialist physician has identified an issue or desires to redefine the reasoning starting from Node ID '${targetNodeId}'.
The physician's correction/instruction: "${modificationPrompt}".

Your job is:
1. Update the target node '${targetNodeId}' with status 'overridden' (or 'success' if resolved), reflect the doctor's correction in the description/summary, and update duration/confidence (usually 99%+ with MD validation).
2. Re-evaluate or replace all downstream child nodes influenced by this node to reflect the physician's new clinical directive.
3. If 'actionType' is 'branch', add a new branch of nodes instead of deleting the original failed path.
4. Update the edges and the SOAP note accordingly.
Maintain all existing valid upstream nodes unchanged. Ensure positions (x, y) are visually balanced without overlapping.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `Existing Case Graph:\n${JSON.stringify(caseData)}\n\nPhysician Intervention on Node ${targetNodeId}:\nDirective: "${modificationPrompt}"\nAction: ${actionType || 'retry'}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            patient: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                age: { type: Type.NUMBER },
                gender: { type: Type.STRING },
                chiefComplaint: { type: Type.STRING },
                vitals: {
                  type: Type.OBJECT,
                  properties: {
                    bp: { type: Type.STRING },
                    hr: { type: Type.STRING },
                    rr: { type: Type.STRING },
                    bt: { type: Type.STRING },
                    spo2: { type: Type.STRING },
                  },
                },
              },
            },
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  status: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  tokensUsed: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  position: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                    },
                    required: ['x', 'y'],
                  },
                  summary: { type: Type.STRING },
                  errorTrace: { type: Type.ARRAY, items: { type: Type.STRING } },
                  doctorCorrection: { type: Type.STRING },
                  isHumanOverridden: { type: Type.BOOLEAN },
                  evidence: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        source: { type: Type.STRING },
                        snippet: { type: Type.STRING },
                        grade: { type: Type.STRING },
                      },
                      required: ['id', 'title', 'source', 'snippet'],
                    },
                  },
                },
                required: ['id', 'title', 'description', 'status', 'duration', 'confidence', 'tokensUsed', 'summary', 'position', 'category'],
              },
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  type: { type: Type.STRING },
                  label: { type: Type.STRING },
                },
                required: ['id', 'source', 'target', 'type'],
              },
            },
            fullClinicalSummary: { type: Type.STRING },
            soapNote: {
              type: Type.OBJECT,
              properties: {
                subjective: { type: Type.STRING },
                objective: { type: Type.STRING },
                assessment: { type: Type.STRING },
                plan: { type: Type.STRING },
              },
              required: ['subjective', 'objective', 'assessment', 'plan'],
            },
          },
          required: ['nodes', 'edges', 'fullClinicalSummary', 'soapNote'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      caseData: {
        ...caseData,
        ...parsed,
      },
    });
  } catch (error: any) {
    console.error('Error in retry-node:', error);
    const updatedCase = simulateNodeOverride(
      req.body.caseData,
      req.body.targetNodeId,
      req.body.modificationPrompt,
      req.body.actionType
    );
    return res.json({ success: true, caseData: updatedCase, isFallback: true });
  }
});

// API: AI Clinical Copilot Chat Endpoint (Gemini)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, caseData, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Intelligent fallback
      let reply = '';
      if (/조영제|신부전|CKD|eGFR/i.test(message)) {
        reply = `현재 환자는 eGFR 24 mL/min(CKD 4기)로 조영제 유발 급성 신손상(CIN) 고위험군입니다. 그러나 STEMI의 경우 'Time is Muscle' 원칙에 따라 Primary PCI를 지연해서는 안 됩니다. 따라서 IVUS를 병행하여 조영제 사용량을 30mL 이내로 극소화(Ultra-low contrast)하고 생리식염수 수액 주입을 병행하는 것이 최적의 전략입니다.`;
      } else if (/페니실린|알레르기|항생제/i.test(message)) {
        reply = `환자는 과거 페니실린 복용 시 아나필락시스 쇼크 병력이 있으므로, 3세대 세팔로스포린조차 1~2% 교차반응 우려가 있습니다. 따라서 교차반응이 없는 모노박탐계인 아즈트레오남(Aztreonam 2g q8h) 단독 또는 아미카신 병용 요법이 가장 안전합니다.`;
      } else {
        reply = `선생님께서 문의하신 '${message}'에 대해 현재 증례 [${caseData?.title || 'Current Case'}]의 임상 지침 및 다단계 추론 노드를 종합 검토하였습니다. 필요 시 우측 Node Inspector의 'Retry from here'를 통해 이 가설을 그래프에 직접 반영하실 수 있습니다.`;
      }
      return res.json({ success: true, reply, isSimulated: true });
    }

    const systemInstruction = `You are MedLogic Copilot, an expert AI Clinical Decision Assistant speaking with a board-certified physician.
You are assisting in analyzing a specific patient case and its multi-step reasoning DAG.
Current Case Context:
Title: ${caseData?.title || 'Unknown Case'}
Patient Profile: ${JSON.stringify(caseData?.patient || {})}
Summary of Decision: ${caseData?.fullClinicalSummary || ''}
Nodes in DAG: ${JSON.stringify(
      caseData?.nodes?.map((n: any) => ({
        id: n.id,
        title: n.title,
        status: n.status,
        summary: n.summary,
        errorTrace: n.errorTrace,
      })) || []
    )}

Respond in Korean with professional medical terminology (한국어 의학용어 및 가이드라인 인용), precise rationale, and direct references to relevant nodes where applicable. Keep the tone collegial, evidence-based, concise, and clinically actionable.`;

    const conversationContents = (history || []).map((h: any) => `${h.sender === 'user' ? 'Physician' : 'MedLogic'}: ${h.text}`).join('\n');
    const promptWithHistory = `${conversationContents}\nPhysician: ${message}\nMedLogic:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: promptWithHistory,
      config: {
        systemInstruction,
      },
    });

    return res.json({
      success: true,
      reply: response.text || '응답을 생성할 수 없습니다.',
    });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return res.json({
      success: true,
      reply: `[Gemini 응답 생성 중 오류 발생]: 임상 지침 기본 원칙에 따라 환자의 활력징후 및 장기 기능(신/간)을 최우선으로 모니터링하시기 바랍니다. (${error?.message || 'Unknown error'})`,
      isFallback: true,
    });
  }
});

// API: AI-suggested Node Corrections (Gemini)
app.post('/api/reasoning/suggest-node-fixes', async (req, res) => {
  try {
    const { node, caseData } = req.body;
    if (!node) {
      return res.status(400).json({ error: 'Node is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        success: true,
        suggestions: [
          '해당 노드에 신기능(eGFR 24) 저하에 따른 약물 감량 적용',
          '금기 약물 배제 및 대체 1차 권고 치료로 전환',
          '추가 임상 검사(Troponin-I/IVUS) 지시 반영',
        ],
      });
    }

    const systemInstruction = `You are a clinical decision support assistant.
Analyze this reasoning node in the context of the medical case and provide 3 short, specific clinical correction directives (1 sentence each in Korean) that a doctor might apply to fix or improve this node.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `Case: ${caseData?.title}\nPatient: ${JSON.stringify(caseData?.patient)}\nNode: ${JSON.stringify(node)}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['suggestions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{"suggestions":[]}');
    return res.json({ success: true, suggestions: parsed.suggestions || [] });
  } catch (error: any) {
    return res.json({
      success: true,
      suggestions: [
        '해당 노드에 환자 신기능(eGFR 24) 감량 기준 추가 반영',
        '치료 가이드라인 Class I 권고로 승격 검토',
        '추가 감별진단 가설(대동맥 박리 배제) 브랜치 생성',
      ],
    });
  }
});

// Helper: Intelligent Fallback Simulator for instant responses
function generateSimulatedCase(prompt: string, patientContext?: any) {
  const isAllergy = /알레르기|allergy|penicillin|항생제/i.test(prompt);
  const isChest = /흉통|chest pain|stemi|심근경색|cardiac/i.test(prompt);

  return {
    id: `case-${Date.now()}`,
    title: isChest ? 'Acute Coronary Syndrome Evaluation' : isAllergy ? 'Infection Workup with Anaphylaxis Risk' : 'Clinical Decision Reasoning Workflow',
    prompt,
    patient: {
      id: 'PT-7701',
      name: '김*현 (M/58)',
      age: 58,
      gender: '남성',
      chiefComplaint: prompt.slice(0, 40) + '...',
      vitals: {
        bp: '135/85 mmHg',
        hr: '84 bpm',
        rr: '18 /min',
        bt: '37.1 °C',
        spo2: '97%',
      },
      allergies: isAllergy ? ['Penicillin (Severe Angioedema)'] : ['None reported'],
      history: ['Hypertension', 'Dyslipidemia'],
    },
    nodes: [
      {
        id: 'N-001',
        title: 'Input Analysis',
        description: 'Analyzing the incoming user query to identify core semantic intent, entities, and required logical constraints for the reasoning engine.',
        status: 'success',
        duration: '0.38s',
        confidence: 98.2,
        tokensUsed: 420,
        category: 'input',
        position: { x: 380, y: 40 },
        summary: '입력된 환자 증상 및 의무기록 파라미터 파싱을 완료하고 주요 진단 후보군을 초기화했습니다.',
        errorTrace: [
          '>> Parsing clinical entities: [Query: ' + prompt.slice(0, 30) + '...]',
          '>> Extracted medical terms and normalized against SNOMED-CT / ICD-10.',
          '>> Target constraints initialized.'
        ],
        evidence: [
          {
            id: 'E-01',
            title: 'Diagnostic Decision Support Guidelines',
            source: 'Clinical Decision Support Review (2024)',
            snippet: 'Structured entity extraction reduces diagnostic omission rates by 34%.',
            grade: 'Class I (Level A)'
          }
        ]
      },
      {
        id: 'N-002',
        title: 'Knowledge Retrieval',
        description: 'Executing high-dimensional vector searches across the knowledge base to retrieve the most relevant context chunks for synthesis.',
        status: 'success',
        duration: '0.52s',
        confidence: 95.4,
        tokensUsed: 680,
        category: 'retrieval',
        position: { x: 180, y: 220 },
        summary: '최신 진료지침 데이터베이스로부터 증상별 표준 치료 프로토콜 및 금기 사항을 성공적으로 검색했습니다.',
        errorTrace: [
          '>> Query vector generated (1536 dim).',
          '>> Retrieved 4 high-relevance clinical guideline chunks.',
          '>> Validated context similarity threshold: 0.92.'
        ],
        evidence: [
          {
            id: 'E-02',
            title: 'Standard of Care Protocol Matrix',
            source: 'UpToDate Clinical Guide',
            snippet: 'Evidence-based first-line interventions tailored to clinical severity.'
          }
        ]
      },
      {
        id: 'N-004',
        title: 'Error/Fallback',
        description: 'Triggered fallback mechanism due to unresolvable ambiguity in input analysis or knowledge base timeout.',
        status: 'failed',
        duration: '0.45s',
        confidence: 12.4,
        tokensUsed: 845,
        category: 'fallback',
        position: { x: 580, y: 220 },
        summary: 'The node encountered a critical failure due to unresolvable semantic ambiguity in the input parameters. The reasoning engine could not securely constrain the path, resulting in a forced fallback execution.',
        errorTrace: [
          '>> Evaluating retrieved contexts against primary constraint \'safety\'.',
          '>> Discarding context chunk ID-74 (irrelevant to scope).',
          '!! Constraint violation detected: Context divergence exceeds threshold.',
          '!! Aborting execution and routing to fallback handler.'
        ],
        evidence: [
          {
            id: 'E-03',
            title: 'Safety Guardrails in Automated Clinical Diagnostics',
            source: 'Lancet Digital Health',
            snippet: 'Fail-safe mechanisms must halt automated prescribing when critical contraindications or missing variables exist.'
          }
        ]
      },
      {
        id: 'N-003',
        title: 'Chain of Thought',
        description: 'Synthesizing retrieved data against logical constraints to generate a coherent reasoning path and validate intermediate conclusions.',
        status: 'success',
        duration: '0.64s',
        confidence: 91.8,
        tokensUsed: 1120,
        category: 'hypothesis',
        position: { x: 180, y: 400 },
        summary: '환자 상태에 따른 위험도 분류 및 감별 진단을 수행하여 최적의 치료 경로를 도출하였습니다.',
        errorTrace: [
          '>> Step 1: Synthesizing clinical presentation and vital signs.',
          '>> Step 2: Ruling out life-threatening red flags.',
          '>> Step 3: Generating optimal targeted therapeutic approach.'
        ],
        evidence: [
          {
            id: 'E-04',
            title: 'Clinical Practice Recommendations',
            source: 'BMJ Best Practice',
            snippet: 'Multi-step clinical reasoning enhances diagnostic accuracy.'
          }
        ]
      },
      {
        id: 'N-005',
        title: 'Clinical Action Plan',
        description: 'Final recommendation synthesis including pharmacotherapy, procedure specifics, and monitoring protocol.',
        status: 'success',
        duration: '0.41s',
        confidence: 96.7,
        tokensUsed: 750,
        category: 'treatment',
        position: { x: 180, y: 580 },
        summary: '확정된 진단 가설에 따른 약물 처방, 추가 혈액/영상 검사 오더 및 입원/경과 관찰 계획을 수립했습니다.',
        errorTrace: [
          '>> Verified drug interaction safety matrix: No severe interactions.',
          '>> Formulated laboratory monitoring schedule (CBC, Chemistry at 24h).',
          '>> Plan ready for physician sign-off.'
        ]
      }
    ],
    edges: [
      { id: 'E-01-02', source: 'N-001', target: 'N-002', type: 'default' },
      { id: 'E-01-04', source: 'N-001', target: 'N-004', type: 'fallback' },
      { id: 'E-02-03', source: 'N-002', target: 'N-003', type: 'default' },
      { id: 'E-03-05', source: 'N-003', target: 'N-005', type: 'default' }
    ],
    fullClinicalSummary: `[AI 임상 의사결정 분석 결과]
입력된 환자 증상("${prompt}")에 대해 AI가 단계별 추론을 수행하였습니다.
우측 상단의 N-004 노드에서 특정 제약조건 충돌이 감지되어 대체 경로가 제안되었습니다.
의사는 노드 인스펙터에서 수정 사항을 입력하여 이 노드부터 즉시 재계산 및 가설 브랜칭을 수행할 수 있습니다.`,
    soapNote: {
      subjective: `Patient presented with: ${prompt}`,
      objective: 'Vitals stable. Initial labs within actionable range.',
      assessment: 'Clinical presentation evaluated by multi-stage AI reasoning graph.',
      plan: '1. Validate diagnostic hypothesis\n2. Order confirmatory labs & imaging\n3. Implement physician-adjusted therapeutic regimen'
    },
    createdAt: new Date().toISOString()
  };
}

// Helper: Simulate node modification when doctor edits
function simulateNodeOverride(caseData: any, targetNodeId: string, modificationPrompt: string, actionType?: string) {
  const updatedNodes = caseData.nodes.map((node: any) => {
    if (node.id === targetNodeId) {
      return {
        ...node,
        title: node.title.replace('Error/Fallback', 'Doctor Override / Corrected Constraint'),
        status: 'overridden',
        confidence: 99.4,
        duration: '0.18s (MD Override)',
        summary: `[전문의 수정 반영됨] ${modificationPrompt}`,
        doctorCorrection: modificationPrompt,
        isHumanOverridden: true,
        errorTrace: [
          `>> Physician Intervention: "${modificationPrompt}"`,
          '>> Constraint ambiguity manually resolved by attending specialist.',
          '>> Override validated. Downstream reasoning recalculated without fallback error.'
        ]
      };
    }
    return node;
  });

  // If there is an edge that was a fallback, convert it to an alternative or active path
  const updatedEdges = caseData.edges.map((edge: any) => {
    if (edge.target === targetNodeId || edge.source === targetNodeId) {
      return {
        ...edge,
        type: 'alternative',
        label: 'MD Corrected'
      };
    }
    return edge;
  });

  // Also add a new downstream resolution node if target was a leaf node
  const hasChild = updatedEdges.some((e: any) => e.source === targetNodeId);
  if (!hasChild) {
    const targetNode = updatedNodes.find((n: any) => n.id === targetNodeId);
    const newNodeId = `N-${Date.now().toString().slice(-3)}`;
    const newResolutionNode = {
      id: newNodeId,
      title: 'Resolved Clinical Execution',
      description: `Direct execution path resulting from physician correction: "${modificationPrompt.slice(0, 50)}..."`,
      status: 'success',
      duration: '0.31s',
      confidence: 98.7,
      tokensUsed: 620,
      category: 'treatment',
      position: {
        x: (targetNode?.position?.x || 500),
        y: (targetNode?.position?.y || 250) + 180
      },
      summary: `전문의의 임상 가설 수정("${modificationPrompt}")을 수용하여 맞춤 처방 및 안전 모니터링 프로토콜을 즉시 활성화하였습니다.`,
      errorTrace: [
        '>> Branch active from physician override.',
        '>> Re-running safety guardrails on modified parameters... PASS.',
        '>> Final orders generated.'
      ]
    };
    updatedNodes.push(newResolutionNode);
    updatedEdges.push({
      id: `E-${targetNodeId}-${newNodeId}`,
      source: targetNodeId,
      target: newNodeId,
      type: 'default',
      label: 'Recalculated Branch'
    });
  }

  return {
    ...caseData,
    nodes: updatedNodes,
    edges: updatedEdges,
    fullClinicalSummary: `${caseData.fullClinicalSummary}\n\n[의사 수정 이력]: 노드 ${targetNodeId}에 대해 "${modificationPrompt}" 지시사항이 반영되어 추론 경로가 성공적으로 재계산되었습니다.`,
    soapNote: {
      ...caseData.soapNote,
      plan: `${caseData.soapNote.plan}\n* [MD Correction on ${targetNodeId}]: ${modificationPrompt}`
    }
  };
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MedLogic server running on http://localhost:${PORT}`);
  });
}

startServer();
