"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Clock, User, ChevronRight, AlertCircle } from "lucide-react";
import { firstLineApi } from "@/lib";
import type { QueueEntry, TriageLevel, QueueStatus } from "@/types";
import { TriageBadge } from "@/components/Badges";
import Link from "next/link";

const TRIAGE_ORDER: TriageLevel[] = ["red", "orange", "yellow", "green"];

const STATUS_OPTIONS: { value: QueueStatus; label: string }[] = [
  { value: "waiting", label: "Waiting" },
  { value: "in_consultation", label: "In Consultation" },
  { value: "awaiting_lab", label: "Awaiting Lab" },
  { value: "discharged", label: "Discharged" },
  { value: "referred", label: "Referred" },
];

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "Just now";
  if (diff === 1) return "1 min ago";
  return `${diff} min ago`;
}

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterLevel, setFilterLevel] = useState<TriageLevel | "all">("all");

  const fetchQueue = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    const res = await firstLineApi.getQueue();
    if (res.success) setQueue(res.data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchQueue();
    // Poll every 30s to simulate real-time updates
    const interval = setInterval(() => fetchQueue(), 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleStatusChange = async (encounterId: string, status: QueueStatus) => {
    await firstLineApi.updateQueueStatus(encounterId, status);
    setQueue((prev) =>
      prev.map((e) => (e.encounterId === encounterId ? { ...e, queueStatus: status } : e))
    );
  };

  const sorted = [...queue]
    .filter((e) => filterLevel === "all" || e.triageLevel === filterLevel)
    .filter((e) => e.queueStatus !== "discharged" && e.queueStatus !== "referred")
    .sort((a, b) => {
      const levelDiff = TRIAGE_ORDER.indexOf(a.triageLevel) - TRIAGE_ORDER.indexOf(b.triageLevel);
      if (levelDiff !== 0) return levelDiff;
      return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime();
    });

  const counts = TRIAGE_ORDER.reduce((acc, level) => {
    acc[level] = queue.filter((e) => e.triageLevel === level && e.queueStatus === "waiting").length;
    return acc;
  }, {} as Record<TriageLevel, number>);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>FirstLine Queue</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "4px 0 0" }}>
            {queue.length} active patients · updates every 30s
          </p>
        </div>
        <button
          onClick={() => fetchQueue(true)}
          disabled={refreshing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid var(--border-default)",
            background: "var(--bg-surface)",
            color: "var(--text-secondary)",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* Triage level summary bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {TRIAGE_ORDER.map((level) => (
          <button
            key={level}
            onClick={() => setFilterLevel(filterLevel === level ? "all" : level)}
            className={`badge-${level}`}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              cursor: "pointer",
              textAlign: "left",
              border: filterLevel === level ? undefined : undefined,
              opacity: filterLevel !== "all" && filterLevel !== level ? 0.4 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700 }}>{counts[level]}</div>
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {level === "red" ? "Emergency" : level === "orange" ? "Urgent" : level === "yellow" ? "Semi-Urgent" : "Non-Urgent"}
            </div>
          </button>
        ))}
      </div>

      {/* Queue list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Loading queue...</div>
      ) : sorted.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
          No patients in queue
        </div>
      ) : (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((entry) => (
            <QueueCard key={entry.encounterId} entry={entry} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}

function QueueCard({
  entry,
  onStatusChange,
}: {
  entry: QueueEntry;
  onStatusChange: (id: string, s: QueueStatus) => void;
}) {
  const [expanded, setExpanded] = useState(entry.triageLevel === "red");
  const isCritical = entry.triageLevel === "red";

  return (
    <div
      className={isCritical ? "pulse-critical" : ""}
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${isCritical ? "var(--triage-red-border)" : "var(--border-subtle)"}`,
        borderLeft: `3px solid var(--triage-${entry.triageLevel})`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Main row */}
      <div
        style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--bg-elevated)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <User size={16} color="var(--text-secondary)" />
        </div>

        {/* Patient info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>
              {entry.patientName}
            </span>
            <TriageBadge level={entry.triageLevel} />
            {entry.queueStatus !== "waiting" && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  background: "var(--bg-elevated)",
                  padding: "2px 8px",
                  borderRadius: 10,
                  border: "1px solid var(--border-subtle)",
                  textTransform: "capitalize",
                }}
              >
                {entry.queueStatus.replace("_", " ")}
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {entry.chiefComplaint}
          </div>
        </div>

        {/* Time + wait */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)", fontSize: 12 }}>
            <Clock size={12} />
            {timeAgo(entry.arrivedAt)}
          </div>
          {entry.estimatedWaitMinutes > 0 && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              ~{entry.estimatedWaitMinutes}min wait
            </div>
          )}
        </div>

        <ChevronRight
          size={16}
          color="var(--text-muted)"
          style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}
        />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "14px 18px", background: "var(--bg-elevated)" }}>
          {/* Triage reasoning */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>
              AI Triage Reasoning
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              <AlertCircle size={13} style={{ marginRight: 6, verticalAlign: "middle", color: `var(--triage-${entry.triageLevel})` }} />
              {entry.triageReasoning}
            </div>
          </div>

          {/* Flags */}
          {entry.relevantFlags.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                Flags
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {entry.relevantFlags.map((flag) => (
                  <span
                    key={flag}
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      background: "var(--bg-overlay)",
                      border: "1px solid var(--border-subtle)",
                      padding: "3px 9px",
                      borderRadius: 6,
                    }}
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* History summary */}
          {entry.historySummary && (
            <div style={{ marginBottom: 14, fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
              {entry.historySummary}
            </div>
          )}

          {/* Status control */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Update status:</span>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onStatusChange(entry.encounterId, opt.value)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border-default)",
                  background: entry.queueStatus === opt.value ? "var(--accent-subtle)" : "transparent",
                  color: entry.queueStatus === opt.value ? "var(--accent)" : "var(--text-secondary)",
                  fontSize: 12,
                  cursor: "pointer",
                  fontWeight: entry.queueStatus === opt.value ? 600 : 400,
                }}
              >
                {opt.label}
              </button>
            ))}
            <Link
              href={`/patients/${entry.patientId}`}
              style={{
                marginLeft: "auto",
                fontSize: 12,
                color: "var(--accent)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Full patient record →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
