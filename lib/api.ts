/**
 * CareOS API Client
 * Wired to the actual backend at NEXT_PUBLIC_API_URL.
 *
 * Backend uses snake_case entity fields; this layer maps to the camelCase
 * types defined in @/types so the rest of the app stays unaware.
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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

// ─── HTTP helper ─────────────────────────────────────────────────────────────

function getToken() {
  return typeof window !== "undefined"
    ? localStorage.getItem("careos_token")
    : null;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

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
    const msg =
      typeof error.message === "string"
        ? error.message
        : JSON.stringify(error.message);
    return { success: false, data: null as T, error: msg };
  }

  const raw = await res.json();
  // Backend may or may not already wrap in { success, data }
  if ("success" in raw && "data" in raw) return raw as ApiResponse<T>;
  return { success: true, data: raw as T };
}

// ─── Field mappers ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPatient(p: any): Patient {
  return {
    careosId: p.careos_id ?? p.careosId,
    fullName: p.full_name ?? p.fullName,
    dateOfBirth: p.date_of_birth ?? p.dateOfBirth,
    gender: p.gender,
    phoneNumber: p.phone_number ?? p.phoneNumber ?? "",
    hospitalNumber: p.hospital_number ?? p.hospitalNumber,
    bloodGroup: p.blood_group ?? p.bloodGroup,
    genotype: p.genotype,
    allergies: p.allergies ?? [],
    chronicConditions: p.chronic_conditions ?? p.chronicConditions ?? [],
    createdAt: p.created_at ?? p.createdAt ?? new Date().toISOString(),
    updatedAt: p.updated_at ?? p.updatedAt ?? new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEncounterToQueueEntry(e: any): QueueEntry {
  return {
    encounterId: e.encounter_id ?? e.encounterId,
    patientId: e.patient_id ?? e.patientId ?? "",
    patientName: e.patient?.full_name ?? e.patientName ?? "Unknown",
    triageLevel: e.triage_level ?? e.triageLevel ?? "green",
    triageReasoning: e.triage_reasoning ?? e.triageReasoning ?? "",
    chiefComplaint: e.notes ?? e.chiefComplaint ?? "",
    relevantFlags: e.relevantFlags ?? [],
    queueStatus: (e.status ?? e.queueStatus ?? "waiting") as QueueStatus,
    estimatedWaitMinutes: e.estimatedWaitMinutes ?? 0,
    arrivedAt: e.timestamp ?? e.arrivedAt ?? new Date().toISOString(),
    historySummary: e.historySummary,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEncounter(e: any): Encounter {
  return {
    encounterId: e.encounter_id ?? e.encounterId,
    patientId: e.patient_id ?? e.patientId ?? "",
    patientName: e.patient?.full_name ?? e.patientName ?? "Unknown",
    encounterType: e.encounter_type ?? e.encounterType ?? "OPD",
    timestamp: e.timestamp ?? new Date().toISOString(),
    triageLevel: e.triage_level ?? e.triageLevel,
    triageReasoning: e.triage_reasoning ?? e.triageReasoning,
    chiefComplaint: e.notes ?? e.chiefComplaint,
    queueStatus: (e.status ?? e.queueStatus ?? "waiting") as QueueStatus,
    attendingStaffId: e.attending_staff_id ?? e.attendingStaffId,
    relevantFlags: e.relevantFlags ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAssessmentToExtractedRecord(a: any): ExtractedRecord {
  const out = a.structured_output ?? {};
  return {
    extractionId: a.assessment_id ?? a.assessmentId ?? a.extractionId,
    patientId: a.patient_id ?? a.patientId,
    originalImageUrl: a.raw_input_ref ?? a.originalImageUrl ?? "",
    status: a.status ?? a.assessment_status ?? a.processing_status,
    extractedData: {
      fullName: out.full_name,
      dateOfBirth: out.date_of_birth,
      gender: out.gender,
      hospitalNumber: out.hospital_number,
      diagnoses: out.diagnoses ?? [],
      medications: (out.medications ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (m: any) => (typeof m === "string" ? m : `${m.name} ${m.dosage} ${m.frequency}`)
      ),
      allergies: out.allergies ?? [],
      vitals: out.vitals
        ? {
            BP: out.vitals.bp ?? out.vitals.BP,
            Weight: out.vitals.weight ?? out.vitals.Weight,
            Temp: out.vitals.temperature ?? out.vitals.Temp,
          }
        : undefined,
      labResults: (out.lab_results ?? []).reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (acc: Record<string, string>, lr: any) => {
          acc[lr.test] = lr.result;
          return acc;
        },
        {}
      ),
    },
    confidenceScores: {
      overall: a.confidence_score ?? 0,
    },
    humanVerified: a.human_verified ?? false,
    createdAt: a.created_at ?? new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVitalsLog(v: any): VitalsReading {
  return {
    id: v.log_id ?? v.id,
    patientId: v.patient_id ?? v.patientId,
    encounterId: v.encounter_id ?? v.encounterId,
    bloodPressureSystolic: v.bp_systolic ?? v.bloodPressureSystolic,
    bloodPressureDiastolic: v.bp_diastolic ?? v.bloodPressureDiastolic,
    temperature: v.temperature,
    weight: v.weight,
    heartRate: v.heart_rate ?? v.heartRate,
    spo2: v.spo2,
    source: v.source ?? "nurse",
    recordedAt: v.recorded_at ?? v.recordedAt ?? new Date().toISOString(),
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

export const authApi = {
  register: async (input: RegisterInput): Promise<ApiResponse<{ id: string; fullName: string; role: string; email: string }>> => {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        full_name: input.fullName,
        email: input.email,
        password: input.password,
        role: input.role,
      }),
    });
  },

  login: async (creds: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const res = await request<{ access_token?: string; token?: string; staff: Record<string, unknown> }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(creds) }
    );
    if (!res.success || !res.data) return res as unknown as ApiResponse<AuthResponse>;

    const raw = res.data;
    return {
      success: true,
      data: {
        token: (raw.access_token ?? raw.token ?? "") as string,
        staff: {
          id: (raw.staff.staff_id ?? raw.staff.id ?? "") as string,
          fullName: (raw.staff.full_name ?? raw.staff.fullName ?? "") as string,
          role: raw.staff.role as AuthResponse["staff"]["role"],
          facilityId: (raw.staff.facility_id ?? raw.staff.facilityId ?? "BUH-001") as string,
          email: (raw.staff.email ?? "") as string,
        },
      },
    };
  },

  logout: async (): Promise<ApiResponse<void>> => {
    // Stateless JWT — just acknowledge locally
    return { success: true, data: undefined };
  },
};

// ─── Patients ─────────────────────────────────────────────────────────────────

export const patientsApi = {
  search: async (query: string): Promise<ApiResponse<Patient[]>> => {
    // Backend searches by phone or hospital_number; try hospital_number first
    const res = await request<unknown[]>(
      `/patients/search?hospital_number=${encodeURIComponent(query)}`
    );
    if (!res.success) return res as ApiResponse<Patient[]>;
    const results = (res.data ?? []).map(mapPatient);
    return { success: true, data: results };
  },

  getById: async (id: string): Promise<ApiResponse<Patient>> => {
    const res = await request<unknown>(`/patients/${id}`);
    if (!res.success) return res as ApiResponse<Patient>;
    return { success: true, data: mapPatient(res.data) };
  },

  create: async (data: Partial<Patient>): Promise<ApiResponse<Patient>> => {
    const payload = {
      full_name: data.fullName,
      date_of_birth: data.dateOfBirth,
      gender: data.gender,
      phone_number: data.phoneNumber,
      hospital_number: data.hospitalNumber,
      blood_group: data.bloodGroup,
      genotype: data.genotype,
      allergies: data.allergies ?? [],
      chronic_conditions: data.chronicConditions ?? [],
    };
    const res = await request<unknown>("/patients", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.success) return res as ApiResponse<Patient>;
    return { success: true, data: mapPatient(res.data) };
  },
};

// ─── PaperBridge ─────────────────────────────────────────────────────────────

export const paperBridgeApi = {
  uploadAndExtract: async (file: File): Promise<ApiResponse<ExtractedRecord>> => {
    const token = getToken();
    const form = new FormData();
    form.append("image", file);

    const res = await fetch(`${BASE_URL}/paper-bridge/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    if (!res.ok) {
      return { success: false, data: null as unknown as ExtractedRecord, error: "Upload failed" };
    }

    const raw = await res.json();
    // Backend enqueues async processing — return minimal ExtractedRecord
    return {
      success: true,
      data: {
        extractionId: raw.assessmentId ?? raw.data?.assessmentId ?? "",
        originalImageUrl: "",
        status: raw.status ?? raw.data?.status ?? "queued",
        extractedData: {},
        confidenceScores: {},
        humanVerified: false,
        createdAt: new Date().toISOString(),
      },
    };
  },

  verify: async (
    extractionId: string,
    correctedData: ExtractedRecord["extractedData"]
  ): Promise<ApiResponse<ExtractedRecord>> => {
    const payload = {
      full_name: correctedData.fullName,
      date_of_birth: correctedData.dateOfBirth,
      gender: correctedData.gender,
      hospital_number: correctedData.hospitalNumber,
      diagnoses: correctedData.diagnoses,
      medications: correctedData.medications,
      allergies: correctedData.allergies,
      vitals: correctedData.vitals,
      lab_results: correctedData.labResults,
      procedures: correctedData.procedures,
      notes: correctedData.notes,
    };
    const res = await request<unknown>(`/paper-bridge/${extractionId}/verify`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!res.success) return res as ApiResponse<ExtractedRecord>;
    return { success: true, data: mapAssessmentToExtractedRecord(res.data) };
  },

  search: async (query: string): Promise<ApiResponse<Patient[]>> => {
    return patientsApi.search(query);
  },

  getAssessment: async (extractionId: string): Promise<ApiResponse<ExtractedRecord>> => {
    const res = await request<unknown>(`/paper-bridge/${extractionId}`);
    if (!res.success) return res as ApiResponse<ExtractedRecord>;
    return { success: true, data: mapAssessmentToExtractedRecord(res.data) };
  },

  getExtractions: async (): Promise<ApiResponse<ExtractedRecord[]>> => {
    const res = await request<unknown[]>("/paper-bridge/pending");
    if (!res.success) return res as ApiResponse<ExtractedRecord[]>;
    return {
      success: true,
      data: (res.data ?? []).map(mapAssessmentToExtractedRecord),
    };
  },
};

// ─── FirstLine / Triage ───────────────────────────────────────────────────────

export const firstLineApi = {
  getQueue: async (): Promise<ApiResponse<QueueEntry[]>> => {
    const res = await request<unknown[]>("/first-line/queue");
    if (!res.success) return res as ApiResponse<QueueEntry[]>;
    return {
      success: true,
      data: (res.data ?? []).map(mapEncounterToQueueEntry),
    };
  },

  getQueueStats: async (): Promise<ApiResponse<QueueStats>> => {
    // Not yet implemented in backend — derive from queue list
    const queueRes = await request<unknown[]>("/first-line/queue");
    if (!queueRes.success) return queueRes as unknown as ApiResponse<QueueStats>;

    const entries = (queueRes.data ?? []).map(mapEncounterToQueueEntry);
    const waiting = entries.filter((e) => e.queueStatus === "waiting");
    const byLevel = { red: 0, orange: 0, yellow: 0, green: 0 };
    for (const e of waiting) {
      if (e.triageLevel in byLevel) byLevel[e.triageLevel]++;
    }

    return {
      success: true,
      data: {
        totalWaiting: waiting.length,
        byLevel,
        averageWaitMinutes:
          waiting.length > 0
            ? Math.round(
                waiting.reduce((s, e) => s + e.estimatedWaitMinutes, 0) /
                  waiting.length
              )
            : 0,
        throughputToday: 0,
      },
    };
  },

  updateQueueStatus: async (
    encounterId: string,
    status: QueueStatus
  ): Promise<ApiResponse<QueueEntry>> => {
    const res = await request<unknown>(
      `/first-line/encounter/${encounterId}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) }
    );
    if (!res.success) return res as ApiResponse<QueueEntry>;
    return { success: true, data: mapEncounterToQueueEntry(res.data) };
  },

  getEncounter: async (encounterId: string): Promise<ApiResponse<Encounter>> => {
    // Backend doesn't have a dedicated encounter-by-id endpoint yet;
    // fetch from queue and find the matching entry
    const queueRes = await request<unknown[]>("/first-line/queue");
    if (!queueRes.success) return queueRes as unknown as ApiResponse<Encounter>;

    const match = (queueRes.data ?? []).find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => (e.encounter_id ?? e.encounterId) === encounterId
    );
    if (!match) {
      return { success: false, data: null as unknown as Encounter, error: "Not found" };
    }
    return { success: true, data: mapEncounter(match) };
  },
};

// ─── ScriptGuard ─────────────────────────────────────────────────────────────
// Not yet implemented in backend — these calls will fail until the module exists.

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
// Not yet implemented in backend — these calls will fail until the module exists.

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

  logVitals: (patientId: string, vitals: Partial<VitalsReading>) =>
    request<VitalsReading>(`/mamawatch/records/${patientId}/vitals`, {
      method: "POST",
      body: JSON.stringify(vitals),
    }),
};

// ─── Unused export (keeps types in scope) ────────────────────────────────────
export { mapVitalsLog };
