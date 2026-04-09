/**
 * CareOS Mock API
 * Mirrors the real API interface 100% — same function signatures, same return shapes.
 * Swap between real and mock via USE_MOCK env flag.
 *
 * All data is realistic: Nigerian names, Nigerian drug names, Nigerian hospital scenarios.
 */

import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  Patient,
  ExtractedRecord,
  QueueEntry,
  QueueStats,
  Prescription,
  PrescriptionInput,
  MaternalRecord,
  MaternalPopulationStats,
  ReferralSummary,
  Encounter,
  QueueStatus,
  VitalsReading,
} from "@/types";

// ─── Utility ─────────────────────────────────────────────────────────────────

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const MOCK_PATIENTS: Patient[] = [
  {
    careosId: "COS-001",
    fullName: "Folake Adeyemi",
    dateOfBirth: "1997-03-14",
    gender: "female",
    phoneNumber: "+2348031234567",
    hospitalNumber: "BUH/2024/04521",
    bloodGroup: "B+",
    genotype: "AA",
    allergies: [{ substance: "Penicillin", severity: "severe", reaction: "Anaphylaxis" }],
    chronicConditions: [
      { name: "Mild Hypertension", diagnosedDate: "2023-06-01", managedWith: ["Lifestyle modification"] },
    ],
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2026-04-01T10:00:00Z",
  },
  {
    careosId: "COS-002",
    fullName: "Alhaji Musa Ibrahim",
    dateOfBirth: "1958-11-22",
    gender: "male",
    phoneNumber: "+2348055556789",
    hospitalNumber: "BUH/2022/00123",
    bloodGroup: "O+",
    genotype: "AS",
    allergies: [],
    chronicConditions: [
      { name: "Type 2 Diabetes Mellitus", diagnosedDate: "2018-03-10", managedWith: ["Metformin 500mg", "Glibenclamide"] },
      { name: "Hypertension", diagnosedDate: "2019-07-05", managedWith: ["Amlodipine 10mg", "Lisinopril 10mg"] },
    ],
    createdAt: "2022-05-20T09:00:00Z",
    updatedAt: "2026-03-28T14:00:00Z",
  },
  {
    careosId: "COS-003",
    fullName: "Chidinma Okonkwo",
    dateOfBirth: "2001-07-07",
    gender: "female",
    phoneNumber: "+2347012345678",
    hospitalNumber: "BUH/2025/08832",
    bloodGroup: "A+",
    genotype: "SS",
    allergies: [{ substance: "Aspirin", severity: "moderate", reaction: "GI bleeding risk" }],
    chronicConditions: [
      { name: "Sickle Cell Disease (HbSS)", diagnosedDate: "2001-09-01", managedWith: ["Hydroxyurea", "Folic Acid"] },
    ],
    createdAt: "2025-02-14T11:00:00Z",
    updatedAt: "2026-04-05T09:00:00Z",
  },
  {
    careosId: "COS-004",
    fullName: "Emmanuel Taiwo Adebisi",
    dateOfBirth: "1985-12-30",
    gender: "male",
    phoneNumber: "+2348169876543",
    hospitalNumber: "BUH/2023/03344",
    bloodGroup: "AB+",
    genotype: "AA",
    allergies: [],
    chronicConditions: [],
    createdAt: "2023-09-01T10:00:00Z",
    updatedAt: "2026-04-08T08:00:00Z",
  },
  {
    careosId: "COS-005",
    fullName: "Aisha Bello Usman",
    dateOfBirth: "1992-05-19",
    gender: "female",
    phoneNumber: "+2348077654321",
    hospitalNumber: "BUH/2024/07120",
    bloodGroup: "O-",
    genotype: "AC",
    allergies: [],
    chronicConditions: [
      { name: "Gestational Hypertension", diagnosedDate: "2026-01-15" },
    ],
    createdAt: "2024-08-03T07:30:00Z",
    updatedAt: "2026-04-07T16:00:00Z",
  },
];

const MOCK_QUEUE: QueueEntry[] = [
  {
    encounterId: "ENC-1001",
    patientId: "COS-001",
    patientName: "Folake Adeyemi",
    triageLevel: "red",
    triageReasoning: "Patient reports severe headache, leg swelling, and blurred vision at 28 weeks gestation. Presentation consistent with pre-eclampsia. Requires immediate assessment.",
    chiefComplaint: "Severe headache, leg swelling, blurred vision — 28 weeks pregnant",
    relevantFlags: ["Pregnant (28 weeks)", "History of mild hypertension", "Penicillin allergy"],
    queueStatus: "waiting",
    estimatedWaitMinutes: 0,
    arrivedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    historySummary: "28F. Previous mild hypertension (managed w/ lifestyle). Malaria tx (ACTs) 4 months ago. 2 previous pregnancies.",
  },
  {
    encounterId: "ENC-1002",
    patientId: "COS-002",
    patientName: "Alhaji Musa Ibrahim",
    triageLevel: "orange",
    triageReasoning: "Elderly diabetic with chest tightness and dizziness. On multiple cardiac medications. Risk of drug interaction or cardiac event — requires prompt evaluation.",
    chiefComplaint: "Chest tightness, dizziness for 2 days",
    relevantFlags: ["Type 2 DM", "Hypertension", "On 5+ medications", "Age 67"],
    queueStatus: "waiting",
    estimatedWaitMinutes: 20,
    arrivedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    historySummary: "67M. T2DM (2018), HTN (2019). On Metformin, Glibenclamide, Amlodipine, Lisinopril.",
  },
  {
    encounterId: "ENC-1003",
    patientId: "COS-003",
    patientName: "Chidinma Okonkwo",
    triageLevel: "orange",
    triageReasoning: "Sickle cell patient with acute bone pain crisis and fever of 38.9°C. Risk of acute chest syndrome progression.",
    chiefComplaint: "Severe bone pain in legs and back, fever",
    relevantFlags: ["HbSS Sickle Cell Disease", "Aspirin allergy", "Fever 38.9°C"],
    queueStatus: "in_consultation",
    estimatedWaitMinutes: 0,
    arrivedAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    encounterId: "ENC-1004",
    patientId: "COS-004",
    patientName: "Emmanuel Taiwo Adebisi",
    triageLevel: "yellow",
    triageReasoning: "Persistent cough with mild fever for 5 days. No danger signs. Requires evaluation for URTI vs early pneumonia.",
    chiefComplaint: "Persistent cough, mild fever — 5 days",
    relevantFlags: [],
    queueStatus: "waiting",
    estimatedWaitMinutes: 45,
    arrivedAt: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    encounterId: "ENC-1005",
    patientId: "COS-005",
    patientName: "Aisha Bello Usman",
    triageLevel: "yellow",
    triageReasoning: "Routine antenatal visit. No acute complaints. Blood pressure to be monitored given gestational hypertension history.",
    chiefComplaint: "Routine antenatal check — 34 weeks",
    relevantFlags: ["Pregnant (34 weeks)", "Gestational Hypertension"],
    queueStatus: "waiting",
    estimatedWaitMinutes: 55,
    arrivedAt: new Date(Date.now() - 90 * 60000).toISOString(),
  },
  {
    encounterId: "ENC-1006",
    patientId: "COS-004",
    patientName: "Adaeze Nwosu",
    triageLevel: "green",
    triageReasoning: "Routine medication refill for hypertension. Stable, no acute symptoms.",
    chiefComplaint: "Medication refill — Amlodipine",
    relevantFlags: ["Hypertension (stable)"],
    queueStatus: "waiting",
    estimatedWaitMinutes: 80,
    arrivedAt: new Date(Date.now() - 120 * 60000).toISOString(),
  },
];

const MOCK_VITALS_HISTORY: VitalsReading[] = [
  { id: "V1", patientId: "COS-001", bloodPressureSystolic: 118, bloodPressureDiastolic: 78, weight: 62, source: "nurse", recordedAt: "2026-01-15T09:00:00Z" },
  { id: "V2", patientId: "COS-001", bloodPressureSystolic: 122, bloodPressureDiastolic: 80, weight: 65, source: "CHEW", recordedAt: "2026-02-12T10:00:00Z" },
  { id: "V3", patientId: "COS-001", bloodPressureSystolic: 130, bloodPressureDiastolic: 84, weight: 68, source: "CHEW", recordedAt: "2026-03-05T09:30:00Z" },
  { id: "V4", patientId: "COS-001", bloodPressureSystolic: 138, bloodPressureDiastolic: 88, weight: 71, source: "CHEW", recordedAt: "2026-03-26T10:00:00Z" },
  { id: "V5", patientId: "COS-001", bloodPressureSystolic: 158, bloodPressureDiastolic: 100, weight: 74, source: "nurse", recordedAt: "2026-04-08T08:45:00Z" },
];

const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    prescriptionId: "RX-001",
    patientId: "COS-001",
    encounterId: "ENC-1001",
    drugName: "Magnesium Sulfate",
    dosage: "4g IV loading dose",
    frequency: "Once, then 1g/hr maintenance",
    duration: "24 hours",
    prescribingDoctorId: "DR-001",
    safetyStatus: "green",
    flags: [],
    createdAt: new Date().toISOString(),
  },
  {
    prescriptionId: "RX-002",
    patientId: "COS-002",
    encounterId: "ENC-1002",
    drugName: "Metformin 500mg",
    dosage: "500mg",
    frequency: "Twice daily",
    duration: "30 days",
    prescribingDoctorId: "DR-002",
    safetyStatus: "yellow",
    flags: [
      {
        type: "drug_condition",
        severity: "moderate",
        description: "Metformin should be used with caution given patient's age (67) and potential renal impairment. Monitor creatinine levels.",
        recommendation: "Confirm recent eGFR before dispensing. Hold if eGFR < 30 mL/min.",
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    prescriptionId: "RX-003",
    patientId: "COS-001",
    encounterId: "ENC-1001",
    drugName: "Ampicillin 500mg",
    dosage: "500mg",
    frequency: "Four times daily",
    duration: "7 days",
    prescribingDoctorId: "DR-001",
    safetyStatus: "red",
    flags: [
      {
        type: "allergy",
        severity: "critical",
        description: "Patient has documented severe Penicillin allergy (Anaphylaxis). Ampicillin is a penicillin-class antibiotic — high cross-reactivity risk.",
        recommendation: "STOP. Use alternative antibiotic. Consider Azithromycin or Clindamycin depending on indication.",
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

const MOCK_MATERNAL_RECORDS: MaternalRecord[] = [
  {
    id: "MAT-001",
    patientId: "COS-001",
    patientName: "Folake Adeyemi",
    estimatedDueDate: "2026-07-01",
    gravida: 3,
    para: 2,
    riskScore: 88,
    riskTier: "critical",
    riskFactors: ["Rapidly rising BP across 5 visits", "Leg edema", "Blurred vision (self-reported)", "History of mild hypertension", "Weight gain >4kg in 2 weeks"],
    nextScheduledVisit: "2026-04-15",
    referralStatus: "pending",
    lastVisit: "2026-04-08",
    vitalsHistory: MOCK_VITALS_HISTORY,
  },
  {
    id: "MAT-002",
    patientId: "COS-005",
    patientName: "Aisha Bello Usman",
    estimatedDueDate: "2026-05-20",
    gravida: 1,
    para: 0,
    riskScore: 52,
    riskTier: "moderate",
    riskFactors: ["Gestational hypertension", "Primigravida", "BP trending upward"],
    nextScheduledVisit: "2026-04-10",
    referralStatus: "none",
    lastVisit: "2026-04-08",
    vitalsHistory: [
      { id: "V6", patientId: "COS-005", bloodPressureSystolic: 125, bloodPressureDiastolic: 82, weight: 70, source: "CHEW", recordedAt: "2026-02-20T10:00:00Z" },
      { id: "V7", patientId: "COS-005", bloodPressureSystolic: 130, bloodPressureDiastolic: 85, weight: 73, source: "CHEW", recordedAt: "2026-03-20T10:00:00Z" },
      { id: "V8", patientId: "COS-005", bloodPressureSystolic: 136, bloodPressureDiastolic: 88, weight: 76, source: "nurse", recordedAt: "2026-04-08T09:00:00Z" },
    ],
  },
  {
    id: "MAT-003",
    patientId: "COS-004",
    patientName: "Ngozi Eze",
    estimatedDueDate: "2026-09-10",
    gravida: 2,
    para: 1,
    riskScore: 18,
    riskTier: "low",
    riskFactors: [],
    nextScheduledVisit: "2026-04-22",
    referralStatus: "none",
    lastVisit: "2026-04-01",
    vitalsHistory: [
      { id: "V9", patientId: "COS-004", bloodPressureSystolic: 110, bloodPressureDiastolic: 70, weight: 58, source: "CHEW", recordedAt: "2026-03-15T10:00:00Z" },
      { id: "V10", patientId: "COS-004", bloodPressureSystolic: 112, bloodPressureDiastolic: 72, weight: 60, source: "CHEW", recordedAt: "2026-04-01T09:00:00Z" },
    ],
  },
];

const MOCK_EXTRACTED_RECORD: ExtractedRecord = {
  extractionId: "EX-001",
  patientId: "COS-001",
  originalImageUrl: "/mock/patient-card.jpg",
  extractedData: {
    fullName: "Folake Adeyemi",
    dateOfBirth: "14/03/1997",
    hospitalNumber: "BUH/2024/04521",
    diagnoses: ["Mild Hypertension (Htn)", "Malaria (P. falciparum) — resolved"],
    medications: ["ACTs (Artemether-Lumefantrine) — completed", "Lifestyle modification for Htn"],
    allergies: ["Penicillin — severe"],
    vitals: { BP: "130/85", Weight: "62kg", Temp: "36.8°C" },
    labResults: { "Malaria RDT": "Positive (resolved)", "HB": "11.2 g/dL" },
    procedures: ["Malaria rapid diagnostic test"],
    notes: "Patient advised on sodium restriction and regular BP monitoring. Return in 4 weeks.",
  },
  confidenceScores: {
    fullName: 0.97,
    dateOfBirth: 0.91,
    hospitalNumber: 0.99,
    diagnoses: 0.88,
    medications: 0.85,
    allergies: 0.93,
    vitals: 0.94,
    labResults: 0.78,
  },
  humanVerified: false,
  createdAt: new Date().toISOString(),
};

// ─── Mock API Implementation ──────────────────────────────────────────────────

export const authApi = {
  register: async (_input: { fullName: string; email: string; password: string; role: string }): Promise<ApiResponse<{ id: string; fullName: string; role: string; email: string }>> => {
    await delay(600);
    return ok({ id: "DR-001", fullName: _input.fullName, role: _input.role, email: _input.email });
  },
  login: async (_creds: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    await delay(800);
    return ok({
      token: "mock_jwt_token_careos_2026",
      staff: { id: "DR-001", fullName: "Dr. Chukwuma Eze", role: "doctor", facilityId: "BUH-001", email: "chukwuma@babcockhospital.ng" },
    });
  },
  logout: async (): Promise<ApiResponse<void>> => {
    await delay(300);
    return ok(undefined);
  },
};

export const patientsApi = {
  search: async (query: string): Promise<ApiResponse<Patient[]>> => {
    await delay(500);
    const q = query.toLowerCase();
    const results = MOCK_PATIENTS.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.hospitalNumber?.toLowerCase().includes(q) ||
        p.careosId.toLowerCase().includes(q)
    );
    return ok(results);
  },
  getById: async (id: string): Promise<ApiResponse<Patient>> => {
    await delay(400);
    const p = MOCK_PATIENTS.find((p) => p.careosId === id);
    if (!p) return { success: false, data: null as unknown as Patient, error: "Patient not found" };
    return ok(p);
  },
  create: async (data: Partial<Patient>): Promise<ApiResponse<Patient>> => {
    await delay(700);
    const newPatient: Patient = {
      careosId: `COS-${String(MOCK_PATIENTS.length + 1).padStart(3, "0")}`,
      fullName: data.fullName ?? "Unknown",
      dateOfBirth: data.dateOfBirth ?? "1990-01-01",
      gender: data.gender ?? "female",
      phoneNumber: data.phoneNumber ?? "",
      allergies: data.allergies ?? [],
      chronicConditions: data.chronicConditions ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return ok(newPatient);
  },
};

export const paperBridgeApi = {
  uploadAndExtract: async (_file: File): Promise<ApiResponse<ExtractedRecord>> => {
    await delay(2200); // simulate OCR processing time
    return ok({ ...MOCK_EXTRACTED_RECORD, extractionId: `EX-${Date.now()}`, status: "queued", createdAt: new Date().toISOString() });
  },
  getAssessment: async (extractionId: string): Promise<ApiResponse<ExtractedRecord>> => {
    await delay(700);
    return ok({ ...MOCK_EXTRACTED_RECORD, extractionId, status: "ready" });
  },
  verify: async (extractionId: string, correctedData: ExtractedRecord["extractedData"]): Promise<ApiResponse<ExtractedRecord>> => {
    await delay(500);
    return ok({ ...MOCK_EXTRACTED_RECORD, extractionId, status: "verified", extractedData: correctedData, humanVerified: true });
  },
  search: async (query: string): Promise<ApiResponse<Patient[]>> => {
    await delay(600);
    return patientsApi.search(query);
  },
  getExtractions: async (): Promise<ApiResponse<ExtractedRecord[]>> => {
    await delay(500);
    return ok([{ ...MOCK_EXTRACTED_RECORD, status: "ready" }]);
  },
};

export const firstLineApi = {
  getQueue: async (): Promise<ApiResponse<QueueEntry[]>> => {
    await delay(400);
    return ok([...MOCK_QUEUE]);
  },
  getQueueStats: async (): Promise<ApiResponse<QueueStats>> => {
    await delay(300);
    return ok({
      totalWaiting: 5,
      byLevel: { red: 1, orange: 1, yellow: 2, green: 1 },
      averageWaitMinutes: 40,
      throughputToday: 34,
    });
  },
  updateQueueStatus: async (encounterId: string, status: QueueStatus): Promise<ApiResponse<QueueEntry>> => {
    await delay(400);
    const entry = MOCK_QUEUE.find((e) => e.encounterId === encounterId);
    if (!entry) return { success: false, data: null as unknown as QueueEntry, error: "Encounter not found" };
    return ok({ ...entry, queueStatus: status });
  },
  getEncounter: async (encounterId: string): Promise<ApiResponse<Encounter>> => {
    await delay(400);
    const q = MOCK_QUEUE.find((e) => e.encounterId === encounterId);
    if (!q) return { success: false, data: null as unknown as Encounter, error: "Not found" };
    return ok({ ...q, encounterType: "OPD" as const, timestamp: q.arrivedAt });
  },
};

export const scriptGuardApi = {
  checkPrescription: async (input: PrescriptionInput): Promise<ApiResponse<Prescription>> => {
    await delay(1200);
    // Simulate allergy detection for penicillin-class drugs
    const isPenicillinClass = ["ampicillin", "amoxicillin", "penicillin", "cloxacillin"].some((d) =>
      input.drugName.toLowerCase().includes(d)
    );
    const patient = MOCK_PATIENTS.find((p) => p.careosId === input.patientId);
    const hasPenicillinAllergy = patient?.allergies.some((a) => a.substance.toLowerCase().includes("penicillin"));

    const flags = isPenicillinClass && hasPenicillinAllergy
      ? [{
          type: "allergy" as const,
          severity: "critical" as const,
          description: `Patient has documented severe Penicillin allergy. ${input.drugName} is a penicillin-class drug — high anaphylaxis risk.`,
          recommendation: "STOP. Use alternative antibiotic (e.g., Azithromycin, Clindamycin).",
        }]
      : [];

    const safetyStatus = flags.some((f) => f.severity === "critical") ? "red" : flags.length > 0 ? "yellow" : "green";

    return ok({
      prescriptionId: `RX-${Date.now()}`,
      ...input,
      safetyStatus,
      flags,
      createdAt: new Date().toISOString(),
    });
  },
  getPrescriptions: async (_patientId: string): Promise<ApiResponse<Prescription[]>> => {
    await delay(400);
    return ok(MOCK_PRESCRIPTIONS);
  },
  overridePrescription: async (prescriptionId: string, reason: string): Promise<ApiResponse<Prescription>> => {
    await delay(500);
    const rx = MOCK_PRESCRIPTIONS.find((r) => r.prescriptionId === prescriptionId);
    if (!rx) return { success: false, data: null as unknown as Prescription, error: "Not found" };
    return ok({ ...rx, overrideReason: reason, safetyStatus: "yellow" });
  },
};

export const mamaWatchApi = {
  getPopulationStats: async (): Promise<ApiResponse<MaternalPopulationStats>> => {
    await delay(400);
    return ok({
      totalEnrolled: 3,
      byRiskTier: { low: 1, moderate: 1, high: 0, critical: 1 },
      overdueAppointments: 0,
      upcomingDueDates: 2,
      referralsPending: 1,
    });
  },
  getAllRecords: async (): Promise<ApiResponse<MaternalRecord[]>> => {
    await delay(500);
    return ok(MOCK_MATERNAL_RECORDS);
  },
  getRecord: async (patientId: string): Promise<ApiResponse<MaternalRecord>> => {
    await delay(400);
    const r = MOCK_MATERNAL_RECORDS.find((m) => m.patientId === patientId);
    if (!r) return { success: false, data: null as unknown as MaternalRecord, error: "Record not found" };
    return ok(r);
  },
  generateReferral: async (patientId: string): Promise<ApiResponse<ReferralSummary>> => {
    await delay(1000);
    const record = MOCK_MATERNAL_RECORDS.find((m) => m.patientId === patientId);
    const patient = MOCK_PATIENTS.find((p) => p.careosId === patientId);
    if (!record || !patient) return { success: false, data: null as unknown as ReferralSummary, error: "Not found" };
    return ok({
      patientId,
      patientName: patient.fullName,
      generatedAt: new Date().toISOString(),
      clinicalConcern: "Rapid upward BP trajectory across 5 antenatal visits with concurrent edema and visual disturbance — pre-eclampsia with severe features.",
      currentFacilityGap: "Current facility lacks blood bank, ICU capability, and neonatal intensive care unit required for pre-eclampsia management with possible preterm delivery.",
      vitalsHistory: record.vitalsHistory,
      currentMedications: patient.chronicConditions.flatMap((c) => c.managedWith ?? []),
      riskScore: record.riskScore,
      riskFactors: record.riskFactors,
    });
  },
  logVitals: async (patientId: string, vitals: Partial<VitalsReading>): Promise<ApiResponse<VitalsReading>> => {
    await delay(500);
    return ok({
      id: `V-${Date.now()}`,
      patientId,
      source: vitals.source ?? "nurse",
      recordedAt: new Date().toISOString(),
      ...vitals,
    } as VitalsReading);
  },
};
