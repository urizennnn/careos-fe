"use client";

import { useEffect, useState } from "react";
import { Heart, TrendingUp, AlertTriangle, Calendar, ExternalLink, Loader2 } from "lucide-react";
import { mamaWatchApi } from "@/lib";
import type { MaternalRecord, MaternalPopulationStats, ReferralSummary, VitalsReading } from "@/types";
import { RiskBadge } from "@/components/Badges";

export default function MaternalPage() {
  const [stats, setStats] = useState<MaternalPopulationStats | null>(null);
  const [records, setRecords] = useState<MaternalRecord[]>([]);
  const [selected, setSelected] = useState<MaternalRecord | null>(null);
  const [referral, setReferral] = useState<ReferralSummary | null>(null);
  const [generatingReferral, setGeneratingReferral] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([mamaWatchApi.getPopulationStats(), mamaWatchApi.getAllRecords()]).then(
      ([s, r]) => {
        if (s.success) setStats(s.data);
        if (r.success) {
          const sorted = [...r.data].sort((a, b) => b.riskScore - a.riskScore);
          setRecords(sorted);
          setSelected(sorted[0]);
        }
        setLoading(false);
      }
    );
  }, []);

  const handleGenerateReferral = async (patientId: string) => {
    setGeneratingReferral(true);
    const res = await mamaWatchApi.generateReferral(patientId);
    if (res.success) setReferral(res.data);
    setGeneratingReferral(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, gap: 12 }}>
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} color="var(--accent)" />
        <span style={{ color: "var(--text-secondary)" }}>Loading MamaWatch...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>MamaWatch</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "4px 0 0" }}>
          Continuous maternal risk monitoring · catch danger signs weeks before crisis
        </p>
      </div>

      {/* Stats bar */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Enrolled", value: stats.totalEnrolled, color: "var(--accent)" },
            { label: "Critical", value: stats.byRiskTier.critical, color: "var(--triage-red)" },
            { label: "High Risk", value: stats.byRiskTier.high, color: "var(--triage-orange)" },
            { label: "Overdue", value: stats.overdueAppointments, color: "var(--triage-yellow)" },
            { label: "Referrals Pending", value: stats.referralsPending, color: "var(--triage-orange)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>
        {/* Patient list */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
            Enrolled Patients
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {records.map((r) => (
              <div
                key={r.id}
                onClick={() => { setSelected(r); setReferral(null); }}
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  border: `1px solid ${selected?.id === r.id ? "var(--border-strong)" : "var(--border-subtle)"}`,
                  background: selected?.id === r.id ? "var(--bg-elevated)" : "var(--bg-surface)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{r.patientName}</div>
                  <RiskBadge tier={r.riskTier} />
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  G{r.gravida}P{r.para} · EDD: {new Date(r.estimatedDueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>
                <div style={{ marginTop: 8 }}>
                  <RiskScoreBar score={r.riskScore} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Patient header */}
            <div className="card" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                    {selected.patientName}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    G{selected.gravida}P{selected.para} · Risk score: <strong style={{ color: "var(--text-primary)" }}>{selected.riskScore}/100</strong>
                  </div>
                </div>
                <RiskBadge tier={selected.riskTier} />
              </div>

              {/* Risk factors */}
              {selected.riskFactors.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                    Risk Factors
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {selected.riskFactors.map((f) => (
                      <span
                        key={f}
                        style={{
                          fontSize: 12, color: "var(--triage-orange)",
                          background: "var(--triage-orange-bg)", border: "1px solid var(--triage-orange-border)",
                          padding: "3px 9px", borderRadius: 6,
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <InfoChip icon={Calendar} text={`Next visit: ${selected.nextScheduledVisit ? new Date(selected.nextScheduledVisit).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}`} />
                <InfoChip icon={Calendar} text={`EDD: ${new Date(selected.estimatedDueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`} />
              </div>
            </div>

            {/* BP Trend Chart */}
            <div className="card" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <TrendingUp size={16} color="var(--accent)" />
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Blood Pressure Trend</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}>
                  {selected.vitalsHistory.length} readings
                </span>
              </div>
              <BPTrendChart readings={selected.vitalsHistory} />
            </div>

            {/* Referral section */}
            {(selected.riskTier === "critical" || selected.riskTier === "high") && (
              <div
                style={{
                  background: "var(--triage-red-bg)", border: "1px solid var(--triage-red-border)",
                  borderRadius: 12, padding: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <AlertTriangle size={16} color="var(--triage-red)" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--triage-red)" }}>
                    Referral recommended
                  </span>
                </div>

                {!referral ? (
                  <button
                    onClick={() => handleGenerateReferral(selected.patientId)}
                    disabled={generatingReferral}
                    style={{
                      padding: "9px 18px", borderRadius: 8, border: "1px solid var(--triage-red-border)",
                      background: "transparent", color: "var(--triage-red)", fontWeight: 600, fontSize: 13,
                      cursor: generatingReferral ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                  >
                    {generatingReferral
                      ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating...</>
                      : <><ExternalLink size={14} /> Generate Referral Summary</>}
                  </button>
                ) : (
                  <ReferralCard referral={referral} />
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "var(--triage-red)" : score >= 60 ? "var(--triage-orange)" : score >= 40 ? "var(--triage-yellow)" : "var(--triage-green)";
  return (
    <div style={{ background: "var(--bg-elevated)", borderRadius: 4, height: 5, overflow: "hidden" }}>
      <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.5s ease" }} />
    </div>
  );
}

function InfoChip({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", background: "var(--bg-elevated)", padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border-subtle)" }}>
      <Icon size={12} />
      {text}
    </div>
  );
}

function BPTrendChart({ readings }: { readings: VitalsReading[] }) {
  if (readings.length === 0) return <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No readings recorded</div>;

  const valid = readings.filter((r) => r.bloodPressureSystolic && r.bloodPressureDiastolic);
  if (valid.length === 0) return null;

  const W = 560, H = 180, PAD = { top: 20, bottom: 40, left: 50, right: 20 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const allVals = valid.flatMap((r) => [r.bloodPressureSystolic!, r.bloodPressureDiastolic!]);
  const minVal = Math.max(50, Math.min(...allVals) - 10);
  const maxVal = Math.min(200, Math.max(...allVals) + 10);

  const xScale = (i: number) => PAD.left + (i / Math.max(valid.length - 1, 1)) * chartW;
  const yScale = (v: number) => PAD.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

  const systolicPoints = valid.map((r, i) => `${xScale(i)},${yScale(r.bloodPressureSystolic!)}`).join(" ");
  const diastolicPoints = valid.map((r, i) => `${xScale(i)},${yScale(r.bloodPressureDiastolic!)}`).join(" ");

  // Danger line at 140 systolic
  const dangerY = yScale(140);
  const dangerInChart = dangerY >= PAD.top && dangerY <= PAD.top + chartH;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        {/* Grid lines */}
        {[minVal, (minVal + maxVal) / 2, maxVal].map((v) => {
          const y = yScale(v);
          return (
            <g key={v}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <text x={PAD.left - 6} y={y + 4} fill="rgba(255,255,255,0.3)" fontSize={10} textAnchor="end">{Math.round(v)}</text>
            </g>
          );
        })}

        {/* Danger threshold line at 140 */}
        {dangerInChart && (
          <>
            <line x1={PAD.left} y1={dangerY} x2={W - PAD.right} y2={dangerY} stroke="rgba(255,59,48,0.4)" strokeWidth={1} strokeDasharray="4,4" />
            <text x={W - PAD.right + 4} y={dangerY + 4} fill="rgba(255,59,48,0.6)" fontSize={9}>140</text>
          </>
        )}

        {/* Systolic line */}
        <polyline points={systolicPoints} fill="none" stroke="#ff8c00" strokeWidth={2} strokeLinejoin="round" />
        {/* Diastolic line */}
        <polyline points={diastolicPoints} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" />

        {/* Data points */}
        {valid.map((r, i) => (
          <g key={i}>
            <circle cx={xScale(i)} cy={yScale(r.bloodPressureSystolic!)} r={4} fill="#ff8c00" />
            <circle cx={xScale(i)} cy={yScale(r.bloodPressureDiastolic!)} r={4} fill="#3b82f6" />
            <text
              x={xScale(i)}
              y={H - 6}
              fill="rgba(255,255,255,0.3)"
              fontSize={9}
              textAnchor="middle"
            >
              {new Date(r.recordedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 20, paddingLeft: PAD.left, marginTop: 8 }}>
        {[{ color: "#ff8c00", label: "Systolic" }, { color: "#3b82f6", label: "Diastolic" }].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
            <div style={{ width: 16, height: 2, background: color, borderRadius: 1 }} />
            {label}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,59,48,0.6)" }}>
          <div style={{ width: 16, height: 1, borderTop: "1px dashed rgba(255,59,48,0.4)" }} />
          Danger threshold (140)
        </div>
      </div>
    </div>
  );
}

function ReferralCard({ referral }: { referral: ReferralSummary }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Referral Summary Generated</div>
      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
        <strong>Clinical concern:</strong> {referral.clinicalConcern}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
        <strong>Facility gap:</strong> {referral.currentFacilityGap}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        <strong>Risk score:</strong> {referral.riskScore}/100 · <strong>Readings included:</strong> {referral.vitalsHistory.length}
      </div>
      <button
        onClick={() => window.print()}
        style={{
          marginTop: 4, padding: "8px 16px", borderRadius: 8,
          border: "1px solid var(--triage-red-border)", background: "transparent",
          color: "var(--triage-red)", fontSize: 13, cursor: "pointer", fontWeight: 600, width: "fit-content",
        }}
      >
        Print referral document
      </button>
    </div>
  );
}
