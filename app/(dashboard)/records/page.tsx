"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, FileImage, Loader2, RefreshCw, Clock3 } from "lucide-react";
import { paperBridgeApi } from "@/lib";
import type { ExtractedRecord, Gender } from "@/types";

type Step = "upload" | "processing" | "verify" | "done";

const POLLABLE_STATUSES = new Set(["queued", "pending", "processing", "running", "in_progress"]);
const READY_STATUSES = new Set(["ready", "completed", "processed", "awaiting_verification", "pending_review"]);
const GENDERS: Gender[] = ["female", "male", "other"];

function normalizeStatus(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function isReady(record: ExtractedRecord | null) {
  return READY_STATUSES.has(normalizeStatus(record?.status)) || Boolean(record?.humanVerified === false && record?.extractedData && Object.keys(record.extractedData).length > 0);
}

function isPollable(record: ExtractedRecord | null) {
  return POLLABLE_STATUSES.has(normalizeStatus(record?.status)) || (!isReady(record) && Boolean(record?.extractionId));
}

function formatStatus(status?: string) {
  const normalized = normalizeStatus(status);
  if (!normalized) return "Unknown";
  return normalized.replaceAll("_", " ").replace(/\b\w/g, (s) => s.toUpperCase());
}

function cleanList(items?: string[]) {
  return (items ?? []).map((item) => item.trim()).filter(Boolean);
}

function parseKeyValueList(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, line) => {
      const [key, ...rest] = line.split(":");
      if (!key || rest.length === 0) return acc;
      acc[key.trim()] = rest.join(":").trim();
      return acc;
    }, {});
}

function stringifyKeyValueList(value?: Record<string, string>) {
  return Object.entries(value ?? {})
    .map(([key, val]) => `${key}: ${val}`)
    .join("\n");
}

export default function RecordsPage() {
  const [step, setStep] = useState<Step>("upload");
  const [extracted, setExtracted] = useState<ExtractedRecord | null>(null);
  const [edited, setEdited] = useState<ExtractedRecord["extractedData"]>({});
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [pending, setPending] = useState<ExtractedRecord[]>([]);
  const [error, setError] = useState("");

  const kvFields = useMemo(
    () => ({
      vitals: stringifyKeyValueList(edited.vitals),
      labResults: stringifyKeyValueList(edited.labResults),
    }),
    [edited.labResults, edited.vitals]
  );

  const syncAssessment = useCallback((record: ExtractedRecord) => {
    setExtracted(record);
    setEdited(record.extractedData ?? {});
    if (isReady(record)) {
      setStep("verify");
    } else if (isPollable(record)) {
      setStep("processing");
    }
  }, []);

  const loadPending = useCallback(async () => {
    setLoadingPending(true);
    const res = await paperBridgeApi.getExtractions();
    if (res.success) {
      setPending(res.data);
    }
    setLoadingPending(false);
  }, []);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  useEffect(() => {
    if (!extracted?.extractionId || !isPollable(extracted)) return;

    let cancelled = false;
    const timer = window.setInterval(async () => {
      const res = await paperBridgeApi.getAssessment(extracted.extractionId);
      if (!res.success || cancelled) return;
      syncAssessment(res.data);
      if (isReady(res.data)) {
        window.clearInterval(timer);
        void loadPending();
      }
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [extracted, loadPending, syncAssessment]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setError("");
    setPreview(URL.createObjectURL(file));
    setStep("processing");

    const res = await paperBridgeApi.uploadAndExtract(file);
    if (!res.success) {
      setError(res.error ?? "Upload failed.");
      setStep("upload");
      return;
    }

    if (!res.data.extractionId) {
      setError("Upload succeeded but no assessment ID was returned by the backend.");
      setStep("upload");
      return;
    }

    setExtracted(res.data);
    setEdited({});

    const next = await paperBridgeApi.getAssessment(res.data.extractionId);
    if (next.success) {
      syncAssessment(next.data);
      void loadPending();
    } else {
      setError(next.error ?? "Assessment created, but the frontend could not fetch its status yet.");
    }
  }, [loadPending, syncAssessment]);

  const openAssessment = useCallback(async (item: ExtractedRecord) => {
    setError("");
    setPreview(item.originalImageUrl || null);
    const res = await paperBridgeApi.getAssessment(item.extractionId);
    if (!res.success) {
      setError(res.error ?? "Failed to load assessment.");
      return;
    }
    syncAssessment(res.data);
  }, [syncAssessment]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const handleVerify = async () => {
    if (!extracted) return;
    setSaving(true);
    setError("");
    const res = await paperBridgeApi.verify(extracted.extractionId, {
      ...edited,
      diagnoses: cleanList(edited.diagnoses),
      medications: cleanList(edited.medications),
      allergies: cleanList(edited.allergies),
      procedures: cleanList(edited.procedures),
      vitals: parseKeyValueList(kvFields.vitals),
      labResults: parseKeyValueList(kvFields.labResults),
      notes: edited.notes?.trim(),
    });
    setSaving(false);

    if (!res.success) {
      setError(res.error ?? "Verification failed.");
      return;
    }

    setExtracted(res.data);
    setEdited(res.data.extractedData);
    setStep("done");
    void loadPending();
  };

  const reset = () => {
    setStep("upload");
    setExtracted(null);
    setEdited({});
    setPreview(null);
    setError("");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, alignItems: "start" }}>
      <div>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>PaperBridge</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "4px 0 0" }}>
            Upload a record, wait for OCR, then review and verify structured patient data
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28, flexWrap: "wrap" }}>
          {(["upload", "processing", "verify", "done"] as Step[]).map((s, i) => {
            const stepIdx = ["upload", "processing", "verify", "done"].indexOf(step);
            const done = stepIdx > i;
            const active = stepIdx === i;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: done ? "var(--triage-green)" : active ? "var(--accent)" : "var(--bg-elevated)",
                      border: `2px solid ${done ? "var(--triage-green)" : active ? "var(--accent)" : "var(--border-default)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: done || active ? "white" : "var(--text-muted)",
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "var(--text-primary)" : "var(--text-muted)", textTransform: "capitalize" }}>
                    {s === "processing" ? "Processing" : s === "verify" ? "Verify" : s === "done" ? "Done" : "Upload"}
                  </span>
                </div>
                {i < 3 && <div style={{ width: 40, height: 1, background: "var(--border-default)", margin: "0 12px" }} />}
              </div>
            );
          })}
        </div>

        {error && (
          <div style={{ fontSize: 13, color: "var(--triage-red)", marginBottom: 16, padding: "10px 12px", background: "var(--triage-red-bg)", borderRadius: 8, border: "1px solid var(--triage-red-border)" }}>
            {error}
          </div>
        )}

        {step === "upload" && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            style={{
              border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border-default)"}`,
              borderRadius: 16,
              padding: "60px 40px",
              textAlign: "center",
              background: dragOver ? "var(--accent-subtle)" : "var(--bg-surface)",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <FileImage size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
              Drop patient record image here
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
              or click to browse
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              The frontend now waits for the backend assessment before opening verification
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="card" style={{ padding: 48, textAlign: "center" }}>
            {preview && (
              <img
                src={preview}
                alt="Uploaded record"
                style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 8, marginBottom: 24, opacity: 0.5, filter: "blur(2px)" }}
              />
            )}
            <Loader2 size={36} color="var(--accent)" style={{ animation: "spin 1s linear infinite", marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
              OCR job in progress
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>
              Polling assessment <span style={{ fontFamily: "monospace" }}>{extracted?.extractionId ?? "..."}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Current status: {formatStatus(extracted?.status)}
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {step === "verify" && extracted && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                Original Document
              </div>
              <div className="card" style={{ padding: 0, overflow: "hidden", aspectRatio: "3/4", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)" }}>
                {preview ? (
                  <img src={preview} alt="Original" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : extracted.originalImageUrl ? (
                  <img src={extracted.originalImageUrl} alt="Original" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Image preview unavailable</div>
                )}
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Review And Verify
                </div>
                <span style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                  {extracted.extractionId}
                </span>
              </div>
              <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                <ExtractField
                  label="Full Name"
                  value={edited.fullName ?? ""}
                  confidence={extracted.confidenceScores.fullName}
                  onChange={(v) => setEdited((p) => ({ ...p, fullName: v }))}
                />
                <ExtractField
                  label="Date of Birth"
                  value={edited.dateOfBirth ?? ""}
                  confidence={extracted.confidenceScores.dateOfBirth}
                  onChange={(v) => setEdited((p) => ({ ...p, dateOfBirth: v }))}
                />

                <div>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                      Gender
                    </span>
                  </div>
                  <select
                    value={edited.gender ?? "female"}
                    onChange={(e) => setEdited((p) => ({ ...p, gender: e.target.value as Gender }))}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 7,
                      border: "1px solid var(--border-default)",
                      background: "var(--bg-overlay)",
                      color: "var(--text-primary)",
                      fontSize: 13,
                      outline: "none",
                    }}
                  >
                    {GENDERS.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender[0].toUpperCase() + gender.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <ExtractField
                  label="Hospital Number"
                  value={edited.hospitalNumber ?? ""}
                  confidence={extracted.confidenceScores.hospitalNumber}
                  onChange={(v) => setEdited((p) => ({ ...p, hospitalNumber: v }))}
                />

                <ListField
                  label="Diagnoses"
                  items={edited.diagnoses ?? []}
                  confidence={extracted.confidenceScores.diagnoses}
                  onChange={(v) => setEdited((p) => ({ ...p, diagnoses: v }))}
                />
                <ListField
                  label="Medications"
                  items={edited.medications ?? []}
                  confidence={extracted.confidenceScores.medications}
                  onChange={(v) => setEdited((p) => ({ ...p, medications: v }))}
                />
                <ListField
                  label="Allergies"
                  items={edited.allergies ?? []}
                  confidence={extracted.confidenceScores.allergies}
                  onChange={(v) => setEdited((p) => ({ ...p, allergies: v }))}
                />
                <ListField
                  label="Procedures"
                  items={edited.procedures ?? []}
                  confidence={extracted.confidenceScores.procedures}
                  onChange={(v) => setEdited((p) => ({ ...p, procedures: v }))}
                />

                <ExtractField
                  label="Vitals"
                  value={kvFields.vitals}
                  confidence={extracted.confidenceScores.vitals}
                  onChange={(v) => setEdited((p) => ({ ...p, vitals: parseKeyValueList(v) }))}
                  multiline
                />
                <ExtractField
                  label="Lab Results"
                  value={kvFields.labResults}
                  confidence={extracted.confidenceScores.labResults}
                  onChange={(v) => setEdited((p) => ({ ...p, labResults: parseKeyValueList(v) }))}
                  multiline
                />
                <ExtractField
                  label="Notes"
                  value={edited.notes ?? ""}
                  confidence={extracted.confidenceScores.notes}
                  onChange={(v) => setEdited((p) => ({ ...p, notes: v }))}
                  multiline
                />

                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                  <button
                    onClick={handleVerify}
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 8,
                      border: "none",
                      background: "var(--accent)",
                      color: "white",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: saving ? "not-allowed" : "pointer",
                      opacity: saving ? 0.7 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={14} />}
                    {saving ? "Saving..." : "Verify Assessment"}
                  </button>
                  <button
                    onClick={reset}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 8,
                      border: "1px solid var(--border-default)",
                      background: "transparent",
                      color: "var(--text-secondary)",
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="card" style={{ padding: 48, textAlign: "center" }}>
            <CheckCircle size={48} color="var(--triage-green)" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              Record verified successfully
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 28 }}>
              The verified assessment has been submitted to the backend
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={reset}
                style={{
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--accent)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Digitize another record
              </button>
            </div>
          </div>
        )}
      </div>

      <aside className="card" style={{ padding: 18, position: "sticky", top: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Pending Review</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
              Ready but unverified assessments
            </div>
          </div>
          <button
            onClick={() => void loadPending()}
            disabled={loadingPending}
            style={{ border: "none", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", padding: 4 }}
          >
            <RefreshCw size={15} style={loadingPending ? { animation: "spin 1s linear infinite" } : undefined} />
          </button>
        </div>

        {loadingPending ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "10px 0" }}>Loading...</div>
        ) : pending.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "10px 0" }}>No pending assessments</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pending.map((item) => (
              <button
                key={item.extractionId}
                onClick={() => void openAssessment(item)}
                style={{
                  textAlign: "left",
                  border: "1px solid var(--border-default)",
                  background: extracted?.extractionId === item.extractionId ? "var(--bg-elevated)" : "var(--bg-surface)",
                  borderRadius: 10,
                  padding: 12,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace", marginBottom: 4 }}>
                  {item.extractionId}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                  {item.extractedData.fullName || item.extractedData.hospitalNumber || "Unnamed assessment"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                  <Clock3 size={12} />
                  <span>{formatStatus(item.status)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}

function ConfidenceIndicator({ score }: { score?: number }) {
  if (score === undefined) return null;
  const pct = Math.round(score * 100);
  const color = pct >= 90 ? "var(--triage-green)" : pct >= 75 ? "var(--triage-yellow)" : "var(--triage-orange)";
  return (
    <span style={{ fontSize: 11, color, fontWeight: 600, marginLeft: 6 }}>
      {pct}% confidence
    </span>
  );
}

function ExtractField({
  label,
  value,
  confidence,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  confidence?: number;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const lowConf = confidence !== undefined && confidence < 0.8;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
          {label}
        </span>
        <ConfidenceIndicator score={confidence} />
        {lowConf && <AlertCircle size={12} color="var(--triage-orange)" style={{ marginLeft: 6 }} />}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 7,
            border: `1px solid ${lowConf ? "var(--triage-orange-border)" : "var(--border-default)"}`,
            background: "var(--bg-overlay)",
            color: "var(--text-primary)",
            fontSize: 13,
            resize: "vertical",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 7,
            border: `1px solid ${lowConf ? "var(--triage-orange-border)" : "var(--border-default)"}`,
            background: "var(--bg-overlay)",
            color: "var(--text-primary)",
            fontSize: 13,
            outline: "none",
          }}
        />
      )}
    </div>
  );
}

function ListField({
  label,
  items,
  confidence,
  onChange,
}: {
  label: string;
  items: string[];
  confidence?: number;
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
          {label}
        </span>
        <ConfidenceIndicator score={confidence} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {items.map((item, i) => (
          <div key={`${label}-${i}`} style={{ display: "flex", gap: 6 }}>
            <input
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              style={{
                flex: 1,
                padding: "7px 10px",
                borderRadius: 7,
                border: "1px solid var(--border-default)",
                background: "var(--bg-overlay)",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}
            >
              x
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...items, ""])}
          style={{
            padding: "6px 10px",
            borderRadius: 7,
            border: "1px dashed var(--border-default)",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: 12,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          + Add {label.toLowerCase().endsWith("s") ? label.toLowerCase().slice(0, -1) : label.toLowerCase()}
        </button>
      </div>
    </div>
  );
}
