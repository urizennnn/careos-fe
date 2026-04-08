import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: "auto", padding: "28px 32px", background: "var(--bg-base)" }}>
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
