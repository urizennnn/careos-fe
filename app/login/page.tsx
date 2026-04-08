"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi } from "@/lib";

const ROLES = [
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "chew", label: "CHEW" },
  { value: "admin", label: "Admin" },
];

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--border-default)",
  background: "var(--bg-elevated)",
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box" as const,
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  marginBottom: 7,
};

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("doctor");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const res = await authApi.login({ email, password });
    if (res.success) {
      localStorage.setItem("careos_token", res.data.token);
      router.push("/dashboard");
    } else {
      setError(res.error ?? "Invalid credentials.");
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await authApi.register({ fullName, email, password, role });
    if (res.success) {
      setSuccess("Account created. You can now sign in.");
      setMode("login");
      setFullName("");
      setPassword("");
    } else {
      setError(res.error ?? "Registration failed.");
    }
    setLoading(false);
  };

  const submit = mode === "login" ? handleLogin : handleRegister;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)", padding: 24 }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: `linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 0 40px rgba(59,130,246,0.3)" }}>
            <Stethoscope size={26} color="white" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.8px", color: "var(--text-primary)" }}>CareOS</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>AI-Powered Hospital Operating System</div>
        </div>

        <div className="card" style={{ padding: "32px 30px" }}>
          {/* Tab toggle */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--bg-base)", borderRadius: 8, padding: 4 }}>
            {(["login", "register"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setMode(tab); setError(""); setSuccess(""); }}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: mode === tab ? "var(--bg-elevated)" : "transparent",
                  color: mode === tab ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: mode === tab ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {tab === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Full Name</label>
              <input style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Chukwuma Eze" />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@hospital.ng" />
          </div>

          {mode === "register" && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                style={{ ...inputStyle, paddingRight: 40 }}
                placeholder={mode === "register" ? "Min 6 characters" : ""}
              />
              <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: "var(--triage-red)", marginBottom: 14, padding: "8px 12px", background: "var(--triage-red-bg)", borderRadius: 7, border: "1px solid var(--triage-red-border)" }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ fontSize: 13, color: "var(--triage-green)", marginBottom: 14, padding: "8px 12px", background: "var(--triage-green-bg)", borderRadius: 7, border: "1px solid var(--triage-green-border)" }}>
              {success}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", background: "var(--accent)", color: "white", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.8 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {loading
              ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> {mode === "login" ? "Signing in..." : "Creating account..."}</>
              : mode === "login" ? "Sign In" : "Create Account"}
          </button>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--text-muted)" }}>
          Harvard Health Systems Innovation Lab Hackathon 2026 · Nigerian Hub
        </div>
      </div>
    </div>
  );
}
