"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi } from "@/lib";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("chukwuma@babcockhospital.ng");
  const [password, setPassword] = useState("password");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const res = await authApi.login({ email, password });
    if (res.success) {
      if (typeof window !== "undefined") {
        localStorage.setItem("careos_token", res.data.token);
      }
      router.push("/dashboard");
    } else {
      setError("Invalid credentials. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        padding: 24,
      }}
    >
      {/* Background grid effect */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
            boxShadow: "0 0 40px rgba(59,130,246,0.3)",
          }}>
            <Stethoscope size={26} color="white" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.8px", color: "var(--text-primary)" }}>CareOS</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>
            AI-Powered Hospital Operating System
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "32px 30px" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 22 }}>
            Sign in to your account
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 7 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: "1px solid var(--border-default)", background: "var(--bg-elevated)",
                color: "var(--text-primary)", fontSize: 14, outline: "none",
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 7 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{
                  width: "100%", padding: "10px 40px 10px 12px", borderRadius: 8,
                  border: "1px solid var(--border-default)", background: "var(--bg-elevated)",
                  color: "var(--text-primary)", fontSize: 14, outline: "none",
                }}
              />
              <button
                onClick={() => setShowPw(!showPw)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: "var(--triage-red)", marginBottom: 14, padding: "8px 12px", background: "var(--triage-red-bg)", borderRadius: 7, border: "1px solid var(--triage-red-border)" }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 8, border: "none",
              background: "var(--accent)", color: "white", fontWeight: 700, fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.8 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Signing in...</> : "Sign In"}
          </button>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

          {/* Demo hint */}
          <div style={{ marginTop: 18, padding: "10px 12px", background: "var(--bg-elevated)", borderRadius: 7, border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Demo credentials
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Use any email + password — mock mode is active
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--text-muted)" }}>
          Harvard Health Systems Innovation Lab Hackathon 2026 · Nigerian Hub
        </div>
      </div>
    </div>
  );
}
