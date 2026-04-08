"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, User, ChevronRight, Plus, X } from "lucide-react";
import { patientsApi } from "@/lib";
import type { Patient } from "@/types";
import Link from "next/link";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENOTYPES = ["AA", "AS", "SS", "AC", "SC"];

const fieldStyle = { marginBottom: 14 };
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "var(--text-muted)", textTransform: "uppercase",
  letterSpacing: "0.5px", marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1px solid var(--border-default)", background: "var(--bg-elevated)",
  color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box",
};

function NewPatientModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Patient) => void }) {
  const [form, setForm] = useState({
    fullName: "", dateOfBirth: "", gender: "female" as "male" | "female" | "other",
    phoneNumber: "", hospitalNumber: "", bloodGroup: "", genotype: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.fullName) { setError("Full name is required."); return; }
    setSaving(true);
    setError("");
    const res = await patientsApi.create(form);
    if (res.success) {
      onCreated(res.data);
      onClose();
    } else {
      setError(res.error ?? "Failed to create patient.");
    }
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div className="card" style={{ position: "relative", width: "100%", maxWidth: 480, padding: 28, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>New Patient</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}>
            <X size={18} />
          </button>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Full Name *</label>
          <input style={inputStyle} value={form.fullName} onChange={set("fullName")} placeholder="e.g. Folake Adeyemi" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Date of Birth</label>
            <input style={inputStyle} type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
          </div>
          <div>
            <label style={labelStyle}>Gender</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={form.gender} onChange={set("gender")}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input style={inputStyle} value={form.phoneNumber} onChange={set("phoneNumber")} placeholder="+2348031234567" />
          </div>
          <div>
            <label style={labelStyle}>Hospital Number</label>
            <input style={inputStyle} value={form.hospitalNumber} onChange={set("hospitalNumber")} placeholder="BUH/2024/00001" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Blood Group</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={form.bloodGroup} onChange={set("bloodGroup")}>
              <option value="">Unknown</option>
              {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Genotype</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={form.genotype} onChange={set("genotype")}>
              <option value="">Unknown</option>
              {GENOTYPES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 13, color: "var(--triage-red)", marginBottom: 14, padding: "8px 12px", background: "var(--triage-red-bg)", borderRadius: 7 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={submit} disabled={saving} style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: "var(--accent)", color: "white", fontWeight: 600, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.8 : 1 }}>
            {saving ? "Saving..." : "Create Patient"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    const res = await patientsApi.search(q);
    if (res.success) setResults(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { search(""); }, [search]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>Patients</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "4px 0 0" }}>
            Search by name, CareOS ID, or hospital number
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8, border: "none", background: "var(--accent)", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
        >
          <Plus size={15} /> New Patient
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patients... (e.g. 'Folake', 'BUH/2024', 'COS-001')"
          style={{ width: "100%", padding: "11px 14px 11px 40px", borderRadius: 10, border: "1px solid var(--border-default)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: 14, outline: "none" }}
        />
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", fontSize: 14, padding: "40px 0", textAlign: "center" }}>Searching...</div>
      ) : results.length === 0 ? (
        <div className="card" style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
          No patients found
        </div>
      ) : (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {results.map((p) => (
            <Link key={p.careosId} href={`/patients/${p.careosId}`} style={{ textDecoration: "none" }}>
              <div
                className="card"
                style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <User size={18} color="var(--text-secondary)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>{p.fullName}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{p.careosId}</span>
                    {p.hospitalNumber && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.hospitalNumber}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()}y · {p.gender}
                    </span>
                    {p.bloodGroup && <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Blood: {p.bloodGroup}</span>}
                    {p.genotype && <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Genotype: {p.genotype}</span>}
                    {p.chronicConditions.length > 0 && (
                      <span style={{ fontSize: 12, color: "var(--triage-orange)" }}>{p.chronicConditions.map((c) => c.name).join(", ")}</span>
                    )}
                    {p.allergies.length > 0 && (
                      <span style={{ fontSize: 12, color: "var(--triage-red)" }}>⚠ {p.allergies.map((a) => a.substance).join(", ")} allergy</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <NewPatientModal
          onClose={() => setShowModal(false)}
          onCreated={(p) => setResults((prev) => [p, ...prev])}
        />
      )}
    </div>
  );
}
