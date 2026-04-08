"use client";

import { useCallback, useState } from "react";
import { Upload, CheckCircle, XCircle, AlertCircle, FileImage, Loader2 } from "lucide-react";
import { paperBridgeApi } from "@/lib";
import type { ExtractedRecord } from "@/types";

type Step = "upload" | "processing" | "verify" | "done";

export default function RecordsPage() {
  const [step, setStep] = useState<Step>("upload");
  const [extracted, setExtracted] = useState<ExtractedRecord | null>(null);
  const [edited, setEdited] = useState<ExtractedRecord["extractedData"]>({});
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(file));
    setStep("processing");

    const res = await paperBridgeApi.uploadAndExtract(file);
    if (res.success) {
      setExtracted(res.data);
      setEdited(res.data.extractedData);
      setStep("verify");
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleVerify = async () => {
    if (!extracted) return;
    setSaving(true);
    await paperBridgeApi.verify(extracted.extractionId, edited);
    setSaving(false);
    setStep("done");
  };

  const reset = () => {
    setStep("upload");
    setExtracted(null);
    setEdited({});
    setPreview(null);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>PaperBridge</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "4px 0 0" }}>
          Photograph a patient folder — AI extracts structured clinical data in seconds
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
        {(["upload", "processing", "verify", "done"] as Step[]).map((s, i) => {
          const stepIdx = ["upload", "processing", "verify", "done"].indexOf(step);
          const thisIdx = i;
          const done = stepIdx > thisIdx;
          const active = stepIdx === thisIdx;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: done ? "var(--triage-green)" : active ? "var(--accent)" : "var(--bg-elevated)",
                  border: `2px solid ${done ? "var(--triage-green)" : active ? "var(--accent)" : "var(--border-default)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  color: done || active ? "white" : "var(--text-muted)",
                  transition: "all 0.2s",
                }}>
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

      {/* Upload step */}
      {step === "upload" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
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
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <FileImage size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
            Drop patient record image here
          </div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
            or click to browse · JPEG, PNG, HEIC supported
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Works with handwritten notes, hospital cards, lab results, prescriptions
          </div>
        </div>
      )}

      {/* Processing step */}
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
            AI is reading the record...
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Extracting diagnoses, medications, vitals, allergies, and lab results
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Verify step */}
      {step === "verify" && extracted && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Original image */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
              Original Document
            </div>
            <div className="card" style={{ padding: 0, overflow: "hidden", aspectRatio: "3/4", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)" }}>
              {preview ? (
                <img src={preview} alt="Original" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Image preview</div>
              )}
            </div>
          </div>

          {/* Extracted data */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
              AI Extracted Data — Review & Confirm
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

              <ExtractField
                label="Notes"
                value={edited.notes ?? ""}
                confidence={0.82}
                onChange={(v) => setEdited((p) => ({ ...p, notes: v }))}
                multiline
              />

              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button
                  onClick={handleVerify}
                  disabled={saving}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                    background: "var(--accent)", color: "white", fontWeight: 600, fontSize: 14,
                    cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={14} />}
                  {saving ? "Saving..." : "Confirm & Save Record"}
                </button>
                <button
                  onClick={reset}
                  style={{
                    padding: "10px 16px", borderRadius: 8,
                    border: "1px solid var(--border-default)",
                    background: "transparent", color: "var(--text-secondary)",
                    fontSize: 14, cursor: "pointer",
                  }}
                >
                  <XCircle size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Done step */}
      {step === "done" && (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <CheckCircle size={48} color="var(--triage-green)" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            Record digitized successfully
          </div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 28 }}>
            Patient profile has been created and is now searchable in CareOS
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                padding: "10px 24px", borderRadius: 8, border: "none",
                background: "var(--accent)", color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}
            >
              Digitize another record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
  label, value, confidence, onChange, multiline = false,
}: {
  label: string; value: string; confidence?: number; onChange: (v: string) => void; multiline?: boolean;
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
            width: "100%", padding: "8px 10px", borderRadius: 7,
            border: `1px solid ${lowConf ? "var(--triage-orange-border)" : "var(--border-default)"}`,
            background: "var(--bg-overlay)", color: "var(--text-primary)", fontSize: 13,
            resize: "vertical", outline: "none", fontFamily: "inherit",
          }}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%", padding: "8px 10px", borderRadius: 7,
            border: `1px solid ${lowConf ? "var(--triage-orange-border)" : "var(--border-default)"}`,
            background: "var(--bg-overlay)", color: "var(--text-primary)", fontSize: 13,
            outline: "none",
          }}
        />
      )}
    </div>
  );
}

function ListField({
  label, items, confidence, onChange,
}: {
  label: string; items: string[]; confidence?: number; onChange: (v: string[]) => void;
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
          <div key={i} style={{ display: "flex", gap: 6 }}>
            <input
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              style={{
                flex: 1, padding: "7px 10px", borderRadius: 7,
                border: "1px solid var(--border-default)",
                background: "var(--bg-overlay)", color: "var(--text-primary)", fontSize: 13, outline: "none",
              }}
            />
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...items, ""])}
          style={{
            padding: "6px 10px", borderRadius: 7, border: "1px dashed var(--border-default)",
            background: "transparent", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", textAlign: "left",
          }}
        >
          + Add {label.toLowerCase().slice(0, -1)}
        </button>
      </div>
    </div>
  );
}
