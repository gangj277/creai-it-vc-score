"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "로그인 실패");
      }

      router.push("/admin");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ display: "flex", alignItems: "center", minHeight: "calc(100dvh - 200px)" }}>
      <section
        className={`card ${mounted ? "animate-scale-in" : ""}`}
        style={{ maxWidth: 440, width: "100%", margin: "0 auto" }}
      >
        <div style={{ textAlign: "center", marginBottom: "var(--space-xl)" }}>
          <div
            style={{
              width: 64, height: 64, margin: "0 auto var(--space-lg)",
              background: "var(--accent-soft)", borderRadius: "var(--radius-md)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h1 style={{ marginBottom: "var(--space-sm)" }}>관리자 로그인</h1>
          <p className="muted" style={{ margin: 0 }}>AI VC 심사 대시보드에 접근하려면 로그인이 필요합니다.</p>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: "var(--space-lg)" }}>
            <label htmlFor="email">이메일</label>
            <input
              id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@creai.it" required autoComplete="email" autoFocus
            />
          </div>

          <div style={{ marginBottom: "var(--space-lg)" }}>
            <label htmlFor="password">비밀번호</label>
            <input
              id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********" required autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error" style={{ marginBottom: "var(--space-lg)" }} role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !email || !password} style={{ width: "100%" }}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-sm)" }}>
                <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                <span>확인 중...</span>
              </span>
            ) : (
              <span>로그인</span>
            )}
          </button>
        </form>

        <div style={{ marginTop: "var(--space-xl)", paddingTop: "var(--space-lg)", borderTop: "1px solid var(--border-subtle)", textAlign: "center" }}>
          <a href="/" style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            메인 페이지로 돌아가기
          </a>
        </div>
      </section>
    </div>
  );
}
