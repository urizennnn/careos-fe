"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, User, ChevronRight, Plus } from "lucide-react";
import { patientsApi } from "@/lib/mock-api";
import type { Patient } from "@/types";
import Link from "next/link";

export default function PatientsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState(true);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    const res = await patientsApi.search(q);
    if (res.success) setResults(res.data);
    setLoading(false);
    setInitial(false);
  }, []);

  // Load all on mount
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
          style={{
            display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8,
            border: "none", background: "var(--accent)", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}
        >
          <Plus size={15} /> New Patient
        </button>
      </div>

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patients... (e.g. 'Folake', 'BUH/2024', 'COS-001')"
          style={{
            width: "100%", padding: "11px 14px 11px 40px", borderRadius: 10,
            border: "1px solid var(--border-default)", background: "var(--bg-surface)",
            color: "var(--text-primary)", fontSize: 14, outline: "none",
          }}
        />
      </div>

      {/* Results */}
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
                    {p.hospitalNumber && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.hospitalNumber}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()}y · {p.gender}
                    </span>
                    {p.bloodGroup && (
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Blood: {p.bloodGroup}</span>
                    )}
                    {p.genotype && (
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Genotype: {p.genotype}</span>
                    )}
                    {p.chronicConditions.length > 0 && (
                      <span style={{ fontSize: 12, color: "var(--triage-orange)" }}>
                        {p.chronicConditions.map((c) => c.name).join(", ")}
                      </span>
                    )}
                    {p.allergies.length > 0 && (
                      <span style={{ fontSize: 12, color: "var(--triage-red)" }}>
                        ⚠ {p.allergies.map((a) => a.substance).join(", ")} allergy
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
