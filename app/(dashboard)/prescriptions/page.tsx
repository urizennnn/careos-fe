"use client";

import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle, Info, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { scriptGuardApi, patientsApi } from "@/lib";
import type { Prescription, PrescriptionFlag } from "@/types";
import { SafetyBadge } from "@/components/Badges";

const FREQUENCY_OPTIONS = ["Once daily", "Twice daily", "Three times daily", "Four times daily", "Every 8 hours", "Every 12 hours", "As needed (PRN)", "Once (stat)", "Weekly"];
const DURATION_OPTIONS = ["1 day", "3 days", "5 days", "7 days", "10 days", "14 days", "30 days", "3 months", "Ongoing"];
const NIGERIAN_DRUGS = [
  "Artemether-Lumefantrine (Coartem)", "Amoxicillin", "Metformin", "Amlodipine", "Lisinopril",
  "Ampicillin", "Ciprofloxacin", "Metronidazole", "Paracetamol", "Ibuprofen", "Diclofenac",
  "Hydroxyurea", "Folic Acid", "Ferrous Sulphate", "Magnesium Sulfate", "Labetalol",
  "Glibenclamide", "Chlorpheniramine", "Omeprazole", "Azithromycin", "Clindamycin",
  "Cotrimoxazole (Bactrim)", "Doxycycline", "Fluconazole", "Nifedipine", "Atenolol",
];

type FormState = {
  patientId: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribingDoctorId: string;
};

export default function PrescriptionsPage() {
  const [form, setForm] = useState<FormState>({
    patientId: "COS-001",
    drugName: "",
    dosage: "",
    frequency: "Twice daily",
    duration: "7 days",
    prescribingDoctorId: "DR-001",
  });
  const [result, setResult] = useState<Prescription | null>(null);
  const [checking, setChecking] = useState(false);
  const [patientName, setPatientName] = useState("Folake Adeyemi");
  const [patientSearch, setPatientSearch] = useState("");
  const [drugSuggestions, setDrugSuggestions] = useState<string[]>([]);
  const [showDrugList, setShowDrugList] = useState(false);
  const [recentRx, setRecentRx] = useState<Prescription[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const set = (k: keyof FormState, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handlePatientChange = async (id: string) => {
    set("patientId", id);
    const res = await patientsApi.getById(id);
    if (res.success) setPatientName(res.data.fullName);
  };

  const handleDrugInput = (v: string) => {
    set("drugName", v);
    if (v.length >= 2) {
      setDrugSuggestions(NIGERIAN_DRUGS.filter((d) => d.toLowerCase().includes(v.toLowerCase())).slice(0, 6));
      setShowDrugList(true);
    } else {
      setShowDrugList(false);
    }
  };

  const handleCheck = async () => {
    if (!form.drugName || !form.dosage) return;
    setChecking(true);
    setResult(null);
    const res = await scriptGuardApi.checkPrescription({ ...form, encounterId: "ENC-1001" });
    if (res.success) {
      setResult(res.data);
      setRecentRx((p) => [res.data, ...p].slice(0, 5));
    }
    setChecking(false);
  };

  const handleOverride = async (prescriptionId: string) => {
    const reason = prompt("Enter clinical justification for override:");
    if (!reason) return;
    const res = await scriptGuardApi.overridePrescription(prescriptionId, reason);
    if (res.success) setResult(res.data);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>ScriptGuard</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "4px 0 0" }}>
          Every prescription safety-checked before it reaches the patient
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>
        {/* Prescription form */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>
            New Prescription
          </div>

          {/* Patient selector */}
          <FormRow label="Patient">
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={form.patientId}
                onChange={(e) => handlePatientChange(e.target.value)}
                style={selectStyle}
              >
                <option value="COS-001">Folake Adeyemi (COS-001)</option>
                <option value="COS-002">Alhaji Musa Ibrahim (COS-002)</option>
                <option value="COS-003">Chidinma Okonkwo (COS-003)</option>
                <option value="COS-004">Emmanuel Taiwo Adebisi (COS-004)</option>
                <option value="COS-005">Aisha Bello Usman (COS-005)</option>
              </select>
            </div>
          </FormRow>

          {/* Drug name with autocomplete */}
          <FormRow label="Drug Name">
            <div style={{ position: "relative" }}>
              <input
                value={form.drugName}
                onChange={(e) => handleDrugInput(e.target.value)}
                placeholder="Type drug name..."
                style={inputStyle}
                onBlur={() => setTimeout(() => setShowDrugList(false), 150)}
              />
              {showDrugList && drugSuggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                  background: "var(--bg-overlay)", border: "1px solid var(--border-default)",
                  borderRadius: 8, marginTop: 4, overflow: "hidden",
                }}>
                  {drugSuggestions.map((d) => (
                    <div
                      key={d}
                      onMouseDown={() => { set("drugName", d); setShowDrugList(false); }}
                      style={{
                        padding: "9px 12px", fontSize: 13, cursor: "pointer",
                        color: "var(--text-primary)", borderBottom: "1px solid var(--border-subtle)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormRow>

          {/* Dosage */}
          <FormRow label="Dosage">
            <input
              value={form.dosage}
              onChange={(e) => set("dosage", e.target.value)}
              placeholder="e.g. 500mg, 10mg, 4g IV"
              style={inputStyle}
            />
          </FormRow>

          {/* Frequency */}
          <FormRow label="Frequency">
            <select value={form.frequency} onChange={(e) => set("frequency", e.target.value)} style={selectStyle}>
              {FREQUENCY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </FormRow>

          {/* Duration */}
          <FormRow label="Duration">
            <select value={form.duration} onChange={(e) => set("duration", e.target.value)} style={selectStyle}>
              {DURATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </FormRow>

          <button
            onClick={handleCheck}
            disabled={checking || !form.drugName || !form.dosage}
            style={{
              width: "100%", padding: "12px 0", marginTop: 8, borderRadius: 8, border: "none",
              background: "var(--accent)", color: "white", fontWeight: 600, fontSize: 14,
              cursor: checking || !form.drugName || !form.dosage ? "not-allowed" : "pointer",
              opacity: checking || !form.drugName || !form.dosage ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {checking
              ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Checking safety...</>
              : <><Shield size={16} /> Run Safety Check</>}
          </button>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>

        {/* Result panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Safety result */}
          {result && (
            <div
              className="animate-fade-up"
              style={{
                background: "var(--bg-surface)",
                border: `1px solid ${result.safetyStatus === "red" ? "var(--triage-red-border)" : result.safetyStatus === "yellow" ? "var(--triage-yellow-border)" : "var(--triage-green-border)"}`,
                borderRadius: 12, padding: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>{result.drugName}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                    {result.dosage} · {result.frequency} · {result.duration}
                  </div>
                </div>
                <SafetyBadge status={result.safetyStatus} />
              </div>

              {result.flags.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--triage-green)", fontSize: 14 }}>
                  <CheckCircle size={16} />
                  All safety checks passed. Safe to dispense.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {result.flags.map((flag, i) => (
                    <FlagCard key={i} flag={flag} />
                  ))}
                </div>
              )}

              {result.safetyStatus === "red" && !result.overrideReason && (
                <button
                  onClick={() => handleOverride(result.prescriptionId)}
                  style={{
                    marginTop: 14, width: "100%", padding: "9px 0", borderRadius: 8,
                    border: "1px solid var(--triage-red-border)", background: "transparent",
                    color: "var(--triage-red)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Override with clinical justification
                </button>
              )}
              {result.overrideReason && (
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                  Overridden: {result.overrideReason}
                </div>
              )}
            </div>
          )}

          {/* Recent prescriptions */}
          {recentRx.length > 0 && (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                Recent Checks
              </div>
              {recentRx.map((rx) => (
                <div key={rx.prescriptionId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{rx.drugName}</div>
                  <SafetyBadge status={rx.safetyStatus} />
                </div>
              ))}
            </div>
          )}

          {/* Info card */}
          {!result && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                What ScriptGuard Checks
              </div>
              {[
                { icon: AlertTriangle, color: "#ff3b30", text: "Drug-drug interactions" },
                { icon: AlertTriangle, color: "#ff8c00", text: "Drug-condition contraindications" },
                { icon: Info, color: "#3b82f6", text: "Dosage range validation" },
                { icon: Shield, color: "#30d158", text: "Allergy cross-reactivity" },
                { icon: CheckCircle, color: "#6366f1", text: "NAFDAC registration status" },
              ].map(({ icon: Icon, color, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Icon size={14} color={color} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function FlagCard({ flag }: { flag: PrescriptionFlag }) {
  const [open, setOpen] = useState(flag.severity === "critical");
  const color = flag.severity === "critical" ? "var(--triage-red)" : flag.severity === "moderate" ? "var(--triage-orange)" : "var(--triage-yellow)";
  const bg = flag.severity === "critical" ? "var(--triage-red-bg)" : flag.severity === "moderate" ? "var(--triage-orange-bg)" : "var(--triage-yellow-bg)";
  const border = flag.severity === "critical" ? "var(--triage-red-border)" : flag.severity === "moderate" ? "var(--triage-orange-border)" : "var(--triage-yellow-border)";

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, overflow: "hidden" }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer" }}
        onClick={() => setOpen(!open)}
      >
        <AlertTriangle size={14} color={color} />
        <span style={{ fontSize: 13, fontWeight: 600, color, flex: 1, textTransform: "uppercase", letterSpacing: "0.3px" }}>
          {flag.severity} · {flag.type.replace("_", " ")}
        </span>
        {open ? <ChevronUp size={14} color={color} /> : <ChevronDown size={14} color={color} />}
      </div>
      {open && (
        <div style={{ padding: "0 12px 12px", borderTop: `1px solid ${border}` }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "10px 0 8px", lineHeight: 1.5 }}>{flag.description}</p>
          <div style={{ fontSize: 12, color, fontWeight: 600 }}>→ {flag.recommendation}</div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 11px", borderRadius: 8,
  border: "1px solid var(--border-default)", background: "var(--bg-elevated)",
  color: "var(--text-primary)", fontSize: 13, outline: "none",
};

const selectStyle: React.CSSProperties = {
  width: "100%", padding: "9px 11px", borderRadius: 8,
  border: "1px solid var(--border-default)", background: "var(--bg-elevated)",
  color: "var(--text-primary)", fontSize: 13, outline: "none", cursor: "pointer",
};
