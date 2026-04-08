// ─── Patient Core ────────────────────────────────────────────────────────────

export type Gender = "male" | "female" | "other";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type Genotype = "AA" | "AS" | "SS" | "AC" | "SC";
export type TriageLevel = "red" | "orange" | "yellow" | "green";
export type SafetyStatus = "green" | "yellow" | "red";
export type RiskTier = "low" | "moderate" | "high" | "critical";
export type EncounterType = "OPD" | "emergency" | "antenatal" | "pharmacy";
export type QueueStatus = "waiting" | "in_consultation" | "awaiting_lab" | "discharged" | "referred";

export interface Allergy {
  substance: string;
  severity: "mild" | "moderate" | "severe";
  reaction: string;
}

export interface ChronicCondition {
  name: string;
  diagnosedDate?: string;
  managedWith?: string[];
}

export interface Patient {
  careosId: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phoneNumber: string;
  hospitalNumber?: string;
  bloodGroup?: BloodGroup;
  genotype?: Genotype;
  allergies: Allergy[];
  chronicConditions: ChronicCondition[];
  createdAt: string;
  updatedAt: string;
}

// ─── Vitals ──────────────────────────────────────────────────────────────────

export interface VitalsReading {
  id: string;
  patientId: string;
  encounterId?: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  weight?: number;
  heartRate?: number;
  spo2?: number;
  source: "CHEW" | "self-report" | "nurse";
  recordedAt: string;
}

// ─── Encounters ──────────────────────────────────────────────────────────────

export interface Encounter {
  encounterId: string;
  patientId: string;
  patientName: string;
  encounterType: EncounterType;
  timestamp: string;
  triageLevel?: TriageLevel;
  triageReasoning?: string;
  chiefComplaint?: string;
  queueStatus: QueueStatus;
  attendingStaffId?: string;
  notes?: string;
  relevantFlags?: string[];
  estimatedWaitMinutes?: number;
}

// ─── PaperBridge ─────────────────────────────────────────────────────────────

export interface ExtractedRecord {
  extractionId: string;
  patientId?: string;
  originalImageUrl: string;
  extractedData: {
    fullName?: string;
    dateOfBirth?: string;
    hospitalNumber?: string;
    diagnoses?: string[];
    medications?: string[];
    allergies?: string[];
    vitals?: Record<string, string>;
    labResults?: Record<string, string>;
    procedures?: string[];
    notes?: string;
  };
  confidenceScores: Record<string, number>;
  humanVerified: boolean;
  createdAt: string;
}

// ─── FirstLine / Triage ───────────────────────────────────────────────────────

export interface QueueEntry {
  encounterId: string;
  patientId: string;
  patientName: string;
  triageLevel: TriageLevel;
  triageReasoning: string;
  chiefComplaint: string;
  relevantFlags: string[];
  queueStatus: QueueStatus;
  estimatedWaitMinutes: number;
  arrivedAt: string;
  historySummary?: string;
}

export interface QueueStats {
  totalWaiting: number;
  byLevel: Record<TriageLevel, number>;
  averageWaitMinutes: number;
  throughputToday: number;
}

// ─── ScriptGuard ─────────────────────────────────────────────────────────────

export interface DrugInteractionFlag {
  drugA: string;
  drugB: string;
  severity: "critical" | "moderate" | "mild";
  description: string;
  recommendation: string;
}

export interface PrescriptionFlag {
  type: "drug_interaction" | "drug_condition" | "dosage" | "allergy" | "nafdac";
  severity: "critical" | "moderate" | "mild";
  description: string;
  recommendation: string;
}

export interface Prescription {
  prescriptionId: string;
  patientId: string;
  encounterId: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribingDoctorId: string;
  safetyStatus: SafetyStatus;
  flags: PrescriptionFlag[];
  overrideReason?: string;
  createdAt: string;
}

export interface PrescriptionInput {
  patientId: string;
  encounterId: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribingDoctorId: string;
}

// ─── MamaWatch ───────────────────────────────────────────────────────────────

export interface MaternalRecord {
  id: string;
  patientId: string;
  patientName: string;
  estimatedDueDate: string;
  gravida: number;
  para: number;
  riskScore: number; // 0–100
  riskTier: RiskTier;
  riskFactors: string[];
  nextScheduledVisit?: string;
  referralStatus: "none" | "pending" | "completed";
  lastVisit?: string;
  vitalsHistory: VitalsReading[];
}

export interface MaternalPopulationStats {
  totalEnrolled: number;
  byRiskTier: Record<RiskTier, number>;
  overdueAppointments: number;
  upcomingDueDates: number;
  referralsPending: number;
}

export interface ReferralSummary {
  patientId: string;
  patientName: string;
  generatedAt: string;
  clinicalConcern: string;
  currentFacilityGap: string;
  vitalsHistory: VitalsReading[];
  currentMedications: string[];
  riskScore: number;
  riskFactors: string[];
}

// ─── API Response wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type StaffRole = "doctor" | "nurse" | "pharmacist" | "chew" | "admin" | "clerk";

export interface StaffMember {
  id: string;
  fullName: string;
  role: StaffRole;
  facilityId: string;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  staff: StaffMember;
}
