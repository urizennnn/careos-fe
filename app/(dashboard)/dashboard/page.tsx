"use client";

import { useEffect, useState } from "react";
import { Activity, FileSearch, Shield, Heart, Users, AlertTriangle, TrendingUp } from "lucide-react";
import { firstLineApi, mamaWatchApi } from "@/lib";
import type { QueueStats, MaternalPopulationStats } from "@/types";
import { TriageBadge } from "@/components/Badges";
import Link from "next/link";

export default function DashboardPage() {
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [maternalStats, setMaternalStats] = useState<MaternalPopulationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([firstLineApi.getQueueStats(), mamaWatchApi.getPopulationStats()]).then(
      ([q, m]) => {
        if (q.success) setQueueStats(q.data);
        if (m.success) setMaternalStats(m.data);
        setLoading(false);
      }
    );
  }, []);

  const MODULES = [
    {
      href: "/records",
      icon: FileSearch,
      label: "PaperBridge",
      desc: "Digitize paper records with AI",
      color: "#6366f1",
      colorBg: "rgba(99,102,241,0.1)",
    },
    {
      href: "/queue",
      icon: Activity,
      label: "FirstLine",
      desc: "AI triage & queue management",
      color: "#f59e0b",
      colorBg: "rgba(245,158,11,0.1)",
    },
    {
      href: "/prescriptions",
      icon: Shield,
      label: "ScriptGuard",
      desc: "Prescription safety validation",
      color: "#10b981",
      colorBg: "rgba(16,185,129,0.1)",
    },
    {
      href: "/maternal",
      icon: Heart,
      label: "MamaWatch",
      desc: "Maternal risk monitoring",
      color: "#f43f5e",
      colorBg: "rgba(244,63,94,0.1)",
    },
  ];

  return (
    <div className="stagger">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" }}>
          Good morning, Dr. Chukwuma 👋
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: 14, margin: "6px 0 0" }}>
          Babcock University Hospital · Wednesday, April 8, 2026
        </p>
      </div>

      {/* Critical alert if red in queue */}
      {!loading && queueStats && queueStats.byLevel.red > 0 && (
        <div
          className="pulse-critical"
          style={{
            background: "var(--triage-red-bg)",
            border: "1px solid var(--triage-red-border)",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <AlertTriangle size={18} color="var(--triage-red)" />
          <span style={{ color: "var(--triage-red)", fontWeight: 600, fontSize: 14 }}>
            {queueStats.byLevel.red} emergency patient{queueStats.byLevel.red > 1 ? "s" : ""} in queue requiring immediate attention
          </span>
          <Link
            href="/queue"
            style={{
              marginLeft: "auto",
              color: "var(--triage-red)",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              border: "1px solid var(--triage-red-border)",
              padding: "4px 12px",
              borderRadius: 6,
            }}
          >
            View Queue →
          </Link>
        </div>
      )}

      {/* Stats row */}
      {!loading && queueStats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          {(["red", "orange", "yellow", "green"] as const).map((level) => (
            <div key={level} className="card" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: `var(--triage-${level})` }}>
                {queueStats.byLevel[level]}
              </div>
              <div style={{ marginTop: 6 }}>
                <TriageBadge level={level} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick stats row */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Avg Wait Time
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginTop: 6 }}>
              {queueStats?.averageWaitMinutes ?? "—"}<span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-secondary)", marginLeft: 4 }}>min</span>
            </div>
          </div>
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Patients Today
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginTop: 6 }}>
              {queueStats?.throughputToday ?? "—"}
            </div>
          </div>
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Pregnancies Enrolled
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginTop: 6 }}>
              {maternalStats?.totalEnrolled ?? "—"}
              {maternalStats?.referralsPending ? (
                <span style={{ fontSize: 12, color: "var(--triage-orange)", marginLeft: 8 }}>
                  {maternalStats.referralsPending} referral pending
                </span>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Module cards */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 14, marginTop: 0, letterSpacing: "-0.2px" }}>
          Modules
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {MODULES.map(({ href, icon: Icon, label, desc, color, colorBg }) => (
            <Link
              key={href}
              href={href}
              style={{ textDecoration: "none" }}
            >
              <div
                className="card"
                style={{
                  padding: "20px 22px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: colorBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>{label}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 3 }}>{desc}</div>
                </div>
                <div style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 18, alignSelf: "center" }}>→</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
