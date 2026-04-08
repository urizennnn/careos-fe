/**
 * CareOS API Client
 * All real backend API calls live here.
 * Base URL is configured via NEXT_PUBLIC_API_URL env variable.
 *
 * The backend guy owns the other side — this file is the contract.
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
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("careos_token") : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Unknown error" }));
    return { success: false, data: null as T, error: error.message };
  }

  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (creds: LoginCredentials) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(creds),
    }),

  logout: () => request<void>("/auth/logout", { method: "POST" }),
};

// ─── Patients ─────────────────────────────────────────────────────────────────

export const patientsApi = {
  search: (query: string) =>
    request<Patient[]>(`/patients/search?q=${encodeURIComponent(query)}`),

  getById: (id: string) => request<Patient>(`/patients/${id}`),

  create: (data: Partial<Patient>) =>
    request<Patient>("/patients", { method: "POST", body: JSON.stringify(data) }),
};

// ─── PaperBridge ─────────────────────────────────────────────────────────────

export const paperBridgeApi = {
  uploadAndExtract: async (file: File): Promise<ApiResponse<ExtractedRecord>> => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("careos_token") : null;
    const form = new FormData();
    form.append("image", file);

    const res = await fetch(`${BASE_URL}/paperbridge/extract`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    if (!res.ok) {
      return { success: false, data: null as unknown as ExtractedRecord, error: "Upload failed" };
    }
    return res.json();
  },

  verify: (extractionId: string, correctedData: ExtractedRecord["extractedData"]) =>
    request<ExtractedRecord>(`/paperbridge/${extractionId}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ correctedData, humanVerified: true }),
    }),

  search: (query: string) =>
    request<Patient[]>(`/paperbridge/search?q=${encodeURIComponent(query)}`),

  getExtractions: () => request<ExtractedRecord[]>("/paperbridge/extractions"),
};

// ─── FirstLine / Triage ───────────────────────────────────────────────────────

export const firstLineApi = {
  getQueue: () => request<QueueEntry[]>("/firstline/queue"),

  getQueueStats: () => request<QueueStats>("/firstline/queue/stats"),

  updateQueueStatus: (encounterId: string, status: QueueStatus) =>
    request<QueueEntry>(`/firstline/queue/${encounterId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getEncounter: (encounterId: string) =>
    request<Encounter>(`/firstline/encounters/${encounterId}`),
};

// ─── ScriptGuard ─────────────────────────────────────────────────────────────

export const scriptGuardApi = {
  checkPrescription: (input: PrescriptionInput) =>
    request<Prescription>("/scriptguard/check", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getPrescriptions: (patientId: string) =>
    request<Prescription[]>(`/scriptguard/prescriptions?patientId=${patientId}`),

  overridePrescription: (prescriptionId: string, reason: string) =>
    request<Prescription>(`/scriptguard/prescriptions/${prescriptionId}/override`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

// ─── MamaWatch ───────────────────────────────────────────────────────────────

export const mamaWatchApi = {
  getPopulationStats: () =>
    request<MaternalPopulationStats>("/mamawatch/stats"),

  getAllRecords: () =>
    request<MaternalRecord[]>("/mamawatch/records"),

  getRecord: (patientId: string) =>
    request<MaternalRecord>(`/mamawatch/records/${patientId}`),

  generateReferral: (patientId: string) =>
    request<ReferralSummary>(`/mamawatch/records/${patientId}/referral`, {
      method: "POST",
    }),

  logVitals: (patientId: string, vitals: Partial<import("@/types").VitalsReading>) =>
    request<import("@/types").VitalsReading>(`/mamawatch/records/${patientId}/vitals`, {
      method: "POST",
      body: JSON.stringify(vitals),
    }),
};
