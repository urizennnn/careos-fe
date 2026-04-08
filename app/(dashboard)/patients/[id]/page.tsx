"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { User, AlertTriangle, Activity, Shield, Heart, ArrowLeft, Loader2 } from "lucide-react";
import { patientsApi, scriptGuardApi } from "@/lib/mock-api";
import type { Patient, Prescription } from "@/types";
import { SafetyBadge } from "@/components/Badges";
import Link from "next/link";

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([patientsApi.getById(id), scriptGuardApi.getPrescriptions(id)]).then(([p, rx]) => {
      if (p.success) setPatient(p.data);
      if (rx.success) setPrescriptions(rx.data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, gap: 12 }}>
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} color="var(--accent)" />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
        Patient not found.{" "}
        <Link href="/patients" style={{ color: "var(--accent)" }}>Back to patients</Link>
      </div>
    );
  }

  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

  return (
    <div>
      {/* Back */}
      <Link href="/patients" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, textDecoration: "none", marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to patients
      </Link>

      {/* Header */}
      <div className="card" style={{ padding: "22px 24px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 18 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <User size={24} color="var(--text-secondary)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: "-0.4px" }}>{patient.fullName}</h1>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace", background: "var(--bg-elevated)", padding: "3px 8px", borderRadius: 4 }}>
              {patient.careosId}
            </span>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
            <Pill label="Age" value={`${age} years`} />
            <Pill label="Gender" value={patient.gender} />
            {patient.bloodGroup && <Pill label="Blood Group" value={patient.bloodGroup} />}
            {patient.genotype && <Pill label="Genotype" value={patient.genotype} />}
            {patient.hospitalNumber && <Pill label="Hospital No." value={patient.hospitalNumber} />}
            <Pill label="Phone" value={patient.phoneNumber} />
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Link href={`/prescriptions?patient=${patient.careosId}`}>
            <ActionBtn icon={Shield} label="Prescribe" color="#10b981" />
          </Link>
          <Link href="/queue">
            <ActionBtn icon={Activity} label="Queue" color="#f59e0b" />
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Allergies */}
        <div className="card" style={{ padding: "18px 20px" }}>
          <SectionHeader icon={AlertTriangle} label="Allergies" color="var(--triage-red)" />
          {patient.allergies.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>No documented allergies</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {patient.allergies.map((a) => (
                <div key={a.substance} style={{ background: "var(--triage-red-bg)", border: "1px solid var(--triage-red-border)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--triage-red)" }}>{a.substance}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>{a.reaction} · {a.severity}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chronic conditions */}
        <div className="card" style={{ padding: "18px 20px" }}>
          <SectionHeader icon={Heart} label="Chronic Conditions" color="var(--triage-orange)" />
          {patient.chronicConditions.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>No chronic conditions recorded</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {patient.chronicConditions.map((c) => (
                <div key={c.name} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{c.name}</div>
                  {c.diagnosedDate && (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      Diagnosed: {new Date(c.diagnosedDate).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                    </div>
                  )}
                  {c.managedWith && c.managedWith.length > 0 && (
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                      Managed with: {c.managedWith.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prescriptions */}
        <div className="card" style={{ padding: "18px 20px", gridColumn: "1 / -1" }}>
          <SectionHeader icon={Shield} label="Prescription History" color="var(--accent)" />
          {prescriptions.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>No prescriptions recorded</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {prescriptions.map((rx) => (
                <div key={rx.prescriptionId} style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--bg-elevated)", borderRadius: 8, padding: "12px 14px", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{rx.drugName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>
                      {rx.dosage} · {rx.frequency} · {rx.duration}
                    </div>
                    {rx.flags.length > 0 && (
                      <div style={{ fontSize: 12, color: "var(--triage-orange)", marginTop: 4 }}>
                        {rx.flags.length} flag{rx.flags.length > 1 ? "s" : ""}: {rx.flags[0].description.slice(0, 80)}...
                      </div>
                    )}
                  </div>
                  <SafetyBadge status={rx.safetyStatus} />
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {new Date(rx.createdAt).toLocaleDateString("en-GB")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
      <span style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}: </span>
      {value}
    </div>
  );
}

function SectionHeader({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <Icon size={15} color={color} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{label}</span>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-default)",
      background: "var(--bg-elevated)", cursor: "pointer", textDecoration: "none",
    }}>
      <Icon size={16} color={color} />
      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
    </div>
  );
}
