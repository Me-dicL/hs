import { MedicalCase } from './types';

export const PRESET_CASES: MedicalCase[] = [
  {
    id: 'case-001',
    title: 'Acute Coronary Syndrome vs. Contrast Nephropathy Risk',
    prompt: '62세 남성, 2시간 전 시작된 흉골 하부 압박통(NRS 8/10), 식은땀 동반. 당뇨 및 만성 신장병(CKD 4기, eGFR 24 mL/min) 기왕력. 심전도상 V1-V4 ST분절 상승 의심. 긴급 관상동맥 조영술(CAG) 및 약물 요법 가이드라인 제시 요청.',
    patient: {
      id: 'PT-9042',
      name: '이*진 (M/62)',
      age: 62,
      gender: '남성',
      chiefComplaint: '급성 흉골 하부 압박성 통증 및 호흡곤란',
      vitals: {
        bp: '148/92 mmHg',
        hr: '98 bpm',
        rr: '22 /min',
        bt: '36.8 °C',
        spo2: '95% (Room Air)'
      },
      labs: {
        'Serum Creatinine': '3.1 mg/dL',
        'eGFR': '24 mL/min/1.73m²',
        'Troponin I': '1.82 ng/mL (High)',
        'CK-MB': '32.4 ng/mL'
      },
      allergies: ['과거 조영제 경미한 두드러기 이력'],
      history: ['제2형 당뇨병 15년', '고혈압', 'CKD stage 4']
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
        summary: '환자의 주소(급성 흉통) 및 심전도 소견(STEMI 의심), 고위험 기저질환(CKD 4기, eGFR 24)을 핵심 의사결정 파라미터로 추출 완료하였습니다.',
        errorTrace: [
          '>> Parsing clinical entities: [Age: 62, Symptom: Chest Pain, Onset: 2h ago]',
          '>> Detected high-risk comorbidities: CKD stage 4 (eGFR 24 mL/min), Diabetes Mellitus',
          '>> Normalizing ICD-10 query tokens: I21.0 (STEMI), N18.4 (CKD 4)',
          '>> Target constraints initialized: Reperfusion window vs. Contrast-induced Nephropathy (CIN) risk threshold.'
        ],
        evidence: [
          {
            id: 'E-01',
            title: '2023 ESC Guidelines for the management of acute coronary syndromes',
            source: 'European Heart Journal (2023)',
            snippet: 'Primary PCI remains the preferred reperfusion strategy in STEMI patients within 12h of symptom onset.',
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
        summary: 'ACC/AHA STEMI 가이드라인과 KDIGO 급성 신손상 예방 지침을 교차 검색하여 긴급 관류요법 및 신기능 보호 프로토콜 컨텍스트를 확보했습니다.',
        errorTrace: [
          '>> Executing embedding search on Guideline Vector DB (k=5)...',
          '>> Retrieved context chunk ID-129 (ACC/AHA Primary PCI in Renal Impairment).',
          '>> Retrieved context chunk ID-304 (KDIGO hydration and low-osmolar contrast guidelines).',
          '>> Verification score: 0.941. Context validated without semantic drift.'
        ],
        evidence: [
          {
            id: 'E-02',
            title: 'KDIGO Clinical Practice Guideline for Acute Kidney Injury',
            source: 'Kidney Int Suppl (2020)',
            snippet: 'Minimize iodinated contrast volume, use iso-osmolar or low-osmolar contrast, and maintain isotonic saline hydration.',
            grade: 'Class I (Level B)'
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
          '>> Evaluating retrieved contexts against primary constraint \'performance\'.',
          '>> Discarding context chunk ID-74 (irrelevant to scope).',
          '!! Constraint violation detected: Context divergence exceeds threshold (STEMI time-critical PCI vs. CKD Stage 4 contrast volume restriction conflict).',
          '!! Aborting standard non-invasive routing and routing to fallback handler.'
        ],
        evidence: [
          {
            id: 'E-03',
            title: 'Safety of Coronary Angiography in Advanced Chronic Kidney Disease',
            source: 'JACC (2022)',
            snippet: 'Pre-procedural contrast-volume-to-eGFR ratio should be strictly calculated to prevent urgent dialysis requirements.'
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
        summary: '급성 전벽 ST분절 상승 심근경색(STEMI) 환자로, 신부전 우려보다 심근 괴사 방지가 우선되므로 최소 조영제(Ultra-low contrast)를 사용한 긴급 일차적 관상동맥 중재술(Primary PCI)을 권고합니다.',
        errorTrace: [
          '>> Step 1: Evaluating urgency -> Time is Muscle (Symptom onset 2h < 12h golden hour).',
          '>> Step 2: Risk-benefit weighting: Risk of irreversible cardiac arrest (High) vs. Risk of acute-on-chronic renal deterioration (Moderate).',
          '>> Step 3: Synthesis -> Proceed with emergent PCI with biplane angiography & pre/post isotonic hydration.'
        ],
        evidence: [
          {
            id: 'E-04',
            title: 'AHA/ACC Guideline for Coronary Artery Revascularization',
            source: 'Circulation (2022)',
            snippet: 'In patients with CKD presenting with STEMI, Primary PCI should NOT be delayed for renal protective strategies that delay reperfusion.',
            grade: 'Class I (Level A)'
          }
        ]
      },
      {
        id: 'N-005',
        title: 'Clinical Treatment Plan',
        description: 'Final recommendation synthesis including pharmacotherapy, procedure specifics, and monitoring protocol.',
        status: 'success',
        duration: '0.41s',
        confidence: 96.7,
        tokensUsed: 750,
        category: 'treatment',
        position: { x: 180, y: 580 },
        summary: '1. 아스피린 300mg + 티카그렐러 180mg 부하 투여. 2. 생리식염수 수액 주입 병행. 3. 최소 조영제(Contrast Volume < 30mL) 이용한 Primary PCI 시행. 4. 시술 후 24/48시간 크레아티닌 추적.',
        errorTrace: [
          '>> Dosing verification for renal clearance: Aspirin (Standard), Ticagrelor (No renal adjustment needed, preferred over Clopidogrel).',
          '>> Contrast volume limit set: Contrast volume / eGFR ratio < 2.0 (Max contrast: 48 mL).',
          '>> Final clinical pathway approved by safety guardrails.'
        ],
        evidence: [
          {
            id: 'E-05',
            title: 'Renal-sparing techniques in emergent cardiac catheterization',
            source: 'Catheterization and Cardiovascular Interventions',
            snippet: 'Zero/ultra-low contrast PCI with intravascular ultrasound (IVUS) guidance demonstrates superior preservation of residual renal function.'
          }
        ]
      }
    ],
    edges: [
      { id: 'E-01-02', source: 'N-001', target: 'N-002', type: 'default' },
      { id: 'E-01-04', source: 'N-001', target: 'N-004', type: 'fallback' },
      { id: 'E-02-03', source: 'N-002', target: 'N-003', type: 'default' },
      { id: 'E-03-05', source: 'N-003', target: 'N-005', type: 'default' }
    ],
    fullClinicalSummary: `[임상 의사결정 요약]
62세 남성 환자는 CKD 4기 기저질환을 동반한 급성 ST분절 상승 심근경색(STEMI) 소견을 보이고 있습니다.
AI 추론 엔진은 조영제 신독성 위험(N-004 Fallback 검토)과 긴급 재관류 이득을 교차 분석하였으며, 심근 생존을 위해 '최소 조영제 유도 긴급 Primary PCI'를 최종 권고합니다.
의사의 판단에 따라 N-004 노드(조영제 대체 또는 IVUS 단독 중재술)부터 가설을 수정하여 새로운 추론 경로를 시뮬레이션할 수 있습니다.`,
    soapNote: {
      subjective: '62세 남성, 2시간 전 시작된 흉골 하부 압박감(NRS 8/10), 발한, 호흡곤란 호소. 당뇨 15년, 고혈압, CKD 4기.',
      objective: 'BP 148/92, HR 98, SpO2 95%. EKG: V1-V4 ST elevation. Troponin-I 1.82 ng/mL. Cr 3.1 mg/dL (eGFR 24).',
      assessment: '1. Acute Anterior STEMI (Symptom onset 2h)\n2. Underlying Chronic Kidney Disease Stage 4 (High risk for CIN)',
      plan: '1. DAPT loading: Aspirin 300mg + Ticagrelor 180mg PO\n2. Emergent Cath lab activation for Primary PCI\n3. Renal protection: Isotonic Saline hydration, ultra-low contrast protocol (IVUS guidance)\n4. Serial cardiac enzyme & renal function monitoring'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'case-002',
    title: 'Severe Sepsis with Penicillin Anaphylaxis History',
    prompt: '54세 여성, 발열(39.1°C), 혈압 85/50 mmHg, 맥박 124회/분, 호흡 28회/분. 우측 늑골척추각 압통(CVAT (+)). 소변 백혈구 다수. 과거 페니실린 복용 시 후두부종 및 쇼크 경험. 경험적 항생제 요법 추천 요청.',
    patient: {
      id: 'PT-8821',
      name: '박*희 (F/54)',
      age: 54,
      gender: '여성',
      chiefComplaint: '고열, 오한, 저혈압 및 우측 옆구리 통증',
      vitals: {
        bp: '85/50 mmHg (MAP 61.6)',
        hr: '124 bpm',
        rr: '28 /min',
        bt: '39.1 °C',
        spo2: '93% (Room Air)'
      },
      labs: {
        'WBC': '19,800 /uL (Seg 88%)',
        'Serum Lactate': '3.4 mmol/L (Elevated)',
        'Creatinine': '1.4 mg/dL',
        'Urine WBC': '> 50 /HPF'
      },
      allergies: ['Penicillin (Anaphylactic shock / Angioedema)'],
      history: ['재발성 요로감염', '신결석 병력']
    },
    nodes: [
      {
        id: 'N-101',
        title: 'Input Analysis & qSOFA',
        description: 'Evaluating vital signs and clinical presentation against Sepsis-3 definitions and IgE-mediated drug hypersensitivity.',
        status: 'success',
        duration: '0.34s',
        confidence: 99.1,
        tokensUsed: 390,
        category: 'input',
        position: { x: 380, y: 40 },
        summary: 'qSOFA 3점(저혈압, 빈호흡, 빈맥), Lactate 3.4로 패혈성 쇼크(Septic Shock) 초기 단계 판정. 페니실린 아나필락시스 심각도 중증 확인.',
        errorTrace: [
          '>> Scoring: SBP 85 (<100) = 1, RR 28 (>=22) = 1, HR 124 = Sepsis criteria met.',
          '>> Drug Alert Triggered: Penicillin IgE-mediated anaphylaxis history.'
        ]
      },
      {
        id: 'N-102',
        title: 'Antimicrobial Selection',
        description: 'Cross-referencing urinary tract pathogen prevalence (E. coli, Klebsiella) against beta-lactam cross-reactivity matrix.',
        status: 'warning',
        duration: '0.48s',
        confidence: 76.5,
        tokensUsed: 620,
        category: 'contraindication',
        position: { x: 200, y: 220 },
        summary: '1차 권고약물인 세프트리악손(3세대 세팔로스포린)은 페니실린 중증 아나필락시스 환자에서 교차반응(약 1~2%) 위험 존재로 주의 필요.',
        errorTrace: [
          '>> Evaluating Ceftriaxone vs. Meropenem vs. Fluoroquinolones / Aztreonam.',
          '?? Warning: Standard guideline recommends 3rd gen Cephalosporin, but allergy history warrants extreme caution.'
        ]
      },
      {
        id: 'N-103',
        title: 'Allergy Conflict Flag',
        description: 'Automated safety check halting standard beta-lactam monotherapy.',
        status: 'failed',
        duration: '0.29s',
        confidence: 25.0,
        tokensUsed: 450,
        category: 'fallback',
        position: { x: 560, y: 220 },
        summary: '전통적 Ampicillin/Sulbactam 및 Piperacillin/Tazobactam 처방이 아나필락시스 금기 규칙에 의해 전면 차단되었습니다.',
        errorTrace: [
          '!! BLOCKED: Penicillin derivative detected in candidate pool.',
          '!! Cross-allergy guardrail activated: Halting standard empiric sepsis bundle.'
        ]
      },
      {
        id: 'N-104',
        title: 'Optimized Regimen Synthesis',
        description: 'Safe alternative selection utilizing non-cross reactive monobactam (Aztreonam) or Fluoroquinolone + Aminoglycoside.',
        status: 'success',
        duration: '0.55s',
        confidence: 94.8,
        tokensUsed: 890,
        category: 'treatment',
        position: { x: 380, y: 400 },
        summary: '아즈트레오남(Aztreonam 2g IV q8h) + 반코마이신(Vancomycin) 병용 또는 아미카신(Amikacin) 추가 요법 권고. 즉시 30mL/kg 수액 소생술 시행.',
        errorTrace: [
          '>> Aztreonam selected: Lacks side-chain cross-reactivity with penicillin (except ceftazidime).',
          '>> Hydration order: Crystalloid 30 mL/kg within 3 hours.'
        ]
      }
    ],
    edges: [
      { id: 'E-101-102', source: 'N-101', target: 'N-102', type: 'default' },
      { id: 'E-101-103', source: 'N-101', target: 'N-103', type: 'fallback' },
      { id: 'E-102-104', source: 'N-102', target: 'N-104', type: 'default' },
      { id: 'E-103-104', source: 'N-103', target: 'N-104', type: 'warning' }
    ],
    fullClinicalSummary: `[패혈성 쇼크 및 중증 약물 알레르기 임상 결정]
우측 급성 신우신염 기인의 패혈성 쇼크 의심 환자입니다.
페니실린 아나필락시스 병력으로 인해 표준 베타락탐(페니실린계/카바페넴계 주의) 사용이 제한되며, 안전한 대안으로 아즈트레오남(Aztreonam) 기반 경험적 항생제 및 수액 소생술을 제안합니다.`,
    soapNote: {
      subjective: '54세 여성, 고열, 오한, 우측 옆구리 통증. 과거 페니실린 쇼크 이력.',
      objective: 'BP 85/50, HR 124, BT 39.1. Right CVAT (+). WBC 19.8k, Lactate 3.4 mmol/L.',
      assessment: '1. Septic Shock secondary to Acute Pyelonephritis (APN)\n2. Severe Penicillin Allergy (History of Anaphylaxis)',
      plan: '1. Rapid crystalloid resuscitation (30 mL/kg)\n2. Blood & Urine cultures x 2 sets immediately\n3. IV Aztreonam 2g q8h (+/- Vancomycin 15-20mg/kg)\n4. Norepinephrine infusion if MAP < 65 after fluid bolus'
    },
    createdAt: new Date().toISOString()
  }
];
