import type { TriageLevel, RiskTier, SafetyStatus } from "@/types";

// ─── Triage Badge ─────────────────────────────────────────────────────────────

const TRIAGE_CONFIG: Record<TriageLevel, { label: string; className: string; dot: string }> = {
  red: { label: "Emergency", className: "badge-red", dot: "#ff3b30" },
  orange: { label: "Urgent", className: "badge-orange", dot: "#ff8c00" },
  yellow: { label: "Semi-Urgent", className: "badge-yellow", dot: "#ffd60a" },
  green: { label: "Non-Urgent", className: "badge-green", dot: "#30d158" },
};

export function TriageBadge({ level }: { level: TriageLevel }) {
  const { label, className, dot } = TRIAGE_CONFIG[level];
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.3px",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: dot,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

// ─── Safety Badge ─────────────────────────────────────────────────────────────

const SAFETY_CONFIG: Record<SafetyStatus, { label: string; className: string }> = {
  green: { label: "Safe", className: "badge-green" },
  yellow: { label: "Advisory", className: "badge-yellow" },
  red: { label: "Critical", className: "badge-red" },
};

export function SafetyBadge({ status }: { status: SafetyStatus }) {
  const { label, className } = SAFETY_CONFIG[status];
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────

const RISK_CONFIG: Record<RiskTier, { label: string; className: string }> = {
  low: { label: "Low Risk", className: "badge-green" },
  moderate: { label: "Moderate", className: "badge-yellow" },
  high: { label: "High Risk", className: "badge-orange" },
  critical: { label: "Critical", className: "badge-red" },
};

export function RiskBadge({ tier }: { tier: RiskTier }) {
  const { label, className } = RISK_CONFIG[tier];
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}
