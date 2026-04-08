"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileSearch,
  Activity,
  Shield,
  Heart,
  Users,
  LogOut,
  Stethoscope,
} from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/records", label: "PaperBridge", icon: FileSearch },
  { href: "/queue", label: "FirstLine", icon: Activity },
  { href: "/prescriptions", label: "ScriptGuard", icon: Shield },
  { href: "/maternal", label: "MamaWatch", icon: Heart },
  { href: "/patients", label: "Patients", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        width: 220,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "0",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Stethoscope size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
              CareOS
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              Hospital OS
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "12px 10px" }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: 8,
                marginBottom: 2,
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                background: active ? "var(--accent-subtle)" : "transparent",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                transition: "all 0.15s ease",
                border: active ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                }
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border-subtle)" }}>
        <div
          style={{
            padding: "10px",
            borderRadius: 8,
            marginBottom: 8,
            background: "var(--bg-elevated)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
            Dr. Chukwuma Eze
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            General Practitioner
          </div>
        </div>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            width: "100%",
            borderRadius: 8,
            border: "none",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
