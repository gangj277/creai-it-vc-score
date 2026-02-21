"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Metrics = {
  pitchCount: number;
  completedCount: number;
  failedCount: number;
  averageScore: number;
  verdictDistribution: {
    unicorn: number;
    seed: number;
    hold: number;
    comeBack: number;
  };
  resultViews: number;
  landingClicks: number;
  applyClicks: number;
  shareCount: number;
};

function MetricCard({
  label, value, color = "var(--accent)", delay,
}: {
  label: string; value: number | string; color?: string; delay: number;
}) {
  return (
    <article className="kpi animate-slide-up" style={{ opacity: 0, animationDelay: `${delay}ms` }}>
      <p className="label" style={{ marginBottom: "var(--space-sm)" }}>{label}</p>
      <p className="value" style={{ color }}>{value}</p>
    </article>
  );
}

function VerdictBar({ label, count, total, color, emoji }: {
  label: string; count: number; total: number; color: string; emoji: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ marginBottom: "var(--space-md)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-xs)", fontSize: "0.85rem" }}>
        <span style={{ color: "var(--text-secondary)" }}>{emoji} {label}</span>
        <span style={{ color, fontWeight: 700 }}>{count} ({pct.toFixed(1)}%)</span>
      </div>
      <div style={{ height: 8, background: "var(--bg-elevated)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: color,
          borderRadius: "var(--radius-full)", transition: "width 1s ease-out",
        }} />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await fetch("/api/admin/metrics", { cache: "no-store" });
      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const payload = (await response.json()) as Metrics & { error?: string };
      if (!response.ok) {
        setError(payload.error || "지표 조회 실패");
        setLoading(false);
        return;
      }
      setMetrics(payload);
      setLoading(false);
    };
    void fetchMetrics();
  }, [router]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  if (loading) {
    return (
      <div className="page">
        <div className="grid four">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  const completionRate = metrics && metrics.pitchCount > 0
    ? ((metrics.completedCount / metrics.pitchCount) * 100).toFixed(1)
    : "0";

  return (
    <div className="page">
      {/* Header */}
      <section className="card animate-fade-in" style={{ marginBottom: "var(--space-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-md)", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-xs)" }}>
              AI VC 심사 대시보드
            </h1>
            <p className="muted" style={{ margin: 0 }}>
              피치 심사 유입, 완료율, 판정 분포를 실시간으로 확인합니다.
            </p>
          </div>
          <button className="secondary" onClick={logout}>
            <span>로그아웃</span>
          </button>
        </div>
      </section>

      {error && (
        <div className="error" style={{ marginBottom: "var(--space-lg)" }} role="alert">{error}</div>
      )}

      {metrics && (
        <>
          {/* Key Metrics */}
          <section style={{ marginBottom: "var(--space-xl)" }}>
            <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--space-md)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              핵심 지표
            </h2>
            <div className="grid four">
              <MetricCard label="전체 피치" value={metrics.pitchCount.toLocaleString()} color="var(--accent)" delay={100} />
              <MetricCard label="완료" value={metrics.completedCount.toLocaleString()} color="var(--accent-success)" delay={150} />
              <MetricCard label="실패" value={metrics.failedCount.toLocaleString()} color="var(--accent-danger)" delay={200} />
              <MetricCard label="평균 점수" value={metrics.averageScore.toFixed(1)} color="#c084fc" delay={250} />
            </div>
          </section>

          {/* Verdict Distribution */}
          <section style={{ marginBottom: "var(--space-xl)" }}>
            <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--space-md)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              판정 분포
            </h2>
            <div className="card">
              <VerdictBar label="유니콘 후보" count={metrics.verdictDistribution.unicorn} total={metrics.completedCount} color="#c084fc" emoji={"\uD83E\uDD84"} />
              <VerdictBar label="시드 투자" count={metrics.verdictDistribution.seed} total={metrics.completedCount} color="#34d399" emoji={"\uD83C\uDF31"} />
              <VerdictBar label="보류" count={metrics.verdictDistribution.hold} total={metrics.completedCount} color="#fbbf24" emoji={"\uD83E\uDD14"} />
              <VerdictBar label="다시 오세요" count={metrics.verdictDistribution.comeBack} total={metrics.completedCount} color="#f87171" emoji={"\uD83D\uDC4B"} />
            </div>
          </section>

          {/* Funnel Metrics */}
          <section style={{ marginBottom: "var(--space-xl)" }}>
            <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--space-md)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              퍼널 지표
            </h2>
            <div className="grid four">
              <MetricCard label="결과 조회" value={metrics.resultViews.toLocaleString()} color="var(--violet)" delay={300} />
              <MetricCard label="공유 횟수" value={metrics.shareCount.toLocaleString()} color="var(--accent)" delay={350} />
              <MetricCard label="홈페이지 CTA" value={metrics.landingClicks.toLocaleString()} color="var(--accent-warning)" delay={400} />
              <MetricCard label="지원하기 CTA" value={metrics.applyClicks.toLocaleString()} color="var(--accent-success)" delay={450} />
            </div>
          </section>

          {/* Completion Rate */}
          <section>
            <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--space-md)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              전환율
            </h2>
            <div className="card animate-slide-up" style={{ opacity: 0, animationDelay: "500ms" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-md)" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>심사 완료율</span>
                <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-success)" }}>{completionRate}%</span>
              </div>
              <div style={{ height: 8, background: "var(--bg-elevated)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${completionRate}%`,
                  background: "linear-gradient(90deg, var(--accent-success), #34d399)",
                  borderRadius: "var(--radius-full)", transition: "width 1s ease-out",
                }} />
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "var(--space-sm)", marginBottom: 0 }}>
                {metrics.completedCount} / {metrics.pitchCount} 피치 완료
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
