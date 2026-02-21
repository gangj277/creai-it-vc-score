"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import TipCarousel, { buildEvalTipList } from "@/components/TipCarousel";

type VerdictKey = "UNICORN" | "SEED" | "HOLD" | "COME_BACK";

interface DimensionBreakdown {
  key: string;
  dimension: string;
  score: number;
  weight: number;
  confidence: string;
  comment: string;
}

interface EvaluationDetails {
  breakdown: DimensionBreakdown[];
  highlights: string[];
  improvements: string[];
}

interface SessionData {
  id: string;
  publicId: string;
  status: string;
  ideaText: string;
  questions: { question: string }[];
  answers: string[];
  score: number | null;
  verdict: string | null;
  vcComment: string | null;
  percentile: number | null;
  evaluationDetails: EvaluationDetails | null;
}

const EVAL_STAGES = [
  { msg: "심사역들에게 아이디어를 전달하는 중...", icon: "📋" },
  { msg: "시장 기회 분석 중...", icon: "🌍" },
  { msg: "문제-솔루션 적합성 평가 중...", icon: "🎯" },
  { msg: "실행 가능성 검토 중...", icon: "⚙️" },
  { msg: "경쟁 우위 분석 중...", icon: "🛡️" },
  { msg: "성장 잠재력 평가 중...", icon: "🚀" },
  { msg: "최종 보고서를 작성하는 중...", icon: "📝" },
];

const VERDICT_MAP: Record<VerdictKey, { label: string; emoji: string; color: string; className: string; tagline: string }> = {
  UNICORN: { label: "유니콘 후보", emoji: "\uD83E\uDD84", color: "#c084fc", className: "unicorn", tagline: "탑티어 VC가 주목할 아이디어입니다" },
  SEED: { label: "시드 투자", emoji: "\uD83C\uDF31", color: "#34d399", className: "seed", tagline: "성장 가능성이 보이는 아이디어입니다" },
  HOLD: { label: "보류", emoji: "\uD83E\uDD14", color: "#fbbf24", className: "hold", tagline: "조금 더 다듬으면 가능성이 있습니다" },
  COME_BACK: { label: "다시 오세요", emoji: "\uD83D\uDC4B", color: "#fb7185", className: "come_back", tagline: "피벗이 필요한 아이디어입니다" },
};

const DIMENSION_META: Record<string, { icon: string; label: string }> = {
  market: { icon: "\uD83C\uDF0D", label: "시장 기회" },
  solution: { icon: "\uD83C\uDFAF", label: "문제-솔루션" },
  execution: { icon: "\u2699\uFE0F", label: "실행 가능성" },
  competitive: { icon: "\uD83D\uDEE1\uFE0F", label: "경쟁 우위" },
  growth: { icon: "\uD83D\uDE80", label: "성장/바이럴" },
};

function scoreColor(score: number): string {
  if (score >= 80) return "#c084fc";
  if (score >= 60) return "#34d399";
  if (score >= 40) return "#fbbf24";
  return "#fb7185";
}

function scoreGrade(score: number): string {
  if (score >= 80) return "S";
  if (score >= 70) return "A";
  if (score >= 60) return "B+";
  if (score >= 50) return "B";
  if (score >= 40) return "C";
  return "D";
}

/* ---------- Animated Score Counter ---------- */
function AnimatedNumber({ value, delay = 0, duration = 1400 }: { value: number; delay?: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let frame: number;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, value, duration]);

  return <>{display}</>;
}

/* ---------- SVG Score Ring ---------- */
function ScoreRing({ score, color, size = 200 }: { score: number; color: string; size?: number }) {
  const [animated, setAnimated] = useState(false);
  const r = (size - 20) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="result-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
          </linearGradient>
          <filter id="ring-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="rgba(26, 34, 53, 0.8)"
          strokeWidth="6"
        />
        {/* Tick marks */}
        {[...Array(20)].map((_, i) => {
          const angle = (i / 20) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x1 = size / 2 + (r - 3) * Math.cos(rad);
          const y1 = size / 2 + (r - 3) * Math.sin(rad);
          const x2 = size / 2 + (r + 3) * Math.cos(rad);
          const y2 = size / 2 + (r + 3) * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(148, 163, 184, 0.12)"
              strokeWidth="1"
            />
          );
        })}
        {/* Progress arc */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          filter="url(#ring-glow)"
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "center",
            transition: "stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </svg>
      <div className="result-ring-center">
        <span className="result-ring-number" style={{ color }}>
          <AnimatedNumber value={score} delay={600} duration={1800} />
        </span>
        <span className="result-ring-label">/ 100</span>
      </div>
    </div>
  );
}

/* ---------- Pentagon Radar Chart ---------- */
function RadarChart({ breakdown, animated }: { breakdown: DimensionBreakdown[]; animated: boolean }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 70;
  const levels = 4;

  function polarToXY(angle: number, r: number): [number, number] {
    const rad = ((angle - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  const angles = breakdown.map((_, i) => (i / breakdown.length) * 360);

  // Grid lines
  const gridPaths = [];
  for (let level = 1; level <= levels; level++) {
    const r = (level / levels) * maxR;
    const points = angles.map((a) => polarToXY(a, r));
    gridPaths.push(points.map((p) => p.join(",")).join(" "));
  }

  // Data polygon
  const dataPoints = breakdown.map((d, i) => {
    const r = animated ? (d.score / 100) * maxR : 0;
    return polarToXY(angles[i], r);
  });
  const dataPath = dataPoints.map((p) => p.join(",")).join(" ");

  // Axis labels
  const labelPoints = angles.map((a) => polarToXY(a, maxR + 22));

  return (
    <div className="result-radar">
      <svg viewBox={`0 0 ${size} ${size}`} className="result-radar-svg">
        <defs>
          <linearGradient id="radar-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        {/* Grid */}
        {gridPaths.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="rgba(148, 163, 184, 0.08)"
            strokeWidth="1"
          />
        ))}
        {/* Axis lines */}
        {angles.map((a, i) => {
          const [x, y] = polarToXY(a, maxR);
          return (
            <line
              key={i}
              x1={cx} y1={cy} x2={x} y2={y}
              stroke="rgba(148, 163, 184, 0.06)"
              strokeWidth="1"
            />
          );
        })}
        {/* Data area */}
        <polygon
          points={dataPath}
          fill="url(#radar-fill)"
          stroke="#22d3ee"
          strokeWidth="1.5"
          strokeLinejoin="round"
          style={{ transition: "all 1.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p[0]} cy={p[1]} r="3"
            fill={scoreColor(breakdown[i].score)}
            style={{
              transition: "all 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
              filter: `drop-shadow(0 0 4px ${scoreColor(breakdown[i].score)})`,
            }}
          />
        ))}
        {/* Labels */}
        {labelPoints.map((p, i) => {
          const meta = DIMENSION_META[breakdown[i].key] || { icon: "", label: breakdown[i].dimension };
          return (
            <text
              key={i}
              x={p[0]} y={p[1]}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(148, 163, 184, 0.6)"
              fontSize="7"
              fontWeight="600"
            >
              {meta.icon}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- Evaluating Screen ---------- */
function EvaluatingScreen() {
  const [stage, setStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const evalTips = useMemo(() => buildEvalTipList(["market", "solution", "execution", "competitive", "growth", "general"]), []);

  useEffect(() => {
    const intervals = [3000, 8000, 16000, 24000, 32000, 42000];
    const timers = intervals.map((ms, i) =>
      setTimeout(() => setStage(i + 1), ms)
    );
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(tick);
    };
  }, []);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(1, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="page result-page">
      <div className="loading-overlay eval-overlay static">
        <div className="loading-overlay-bg" aria-hidden="true" />
        <div className="loading-content">
          <div className="eval-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <path d="M12 20V10M18 20V4M6 20v-4" />
            </svg>
            AI VC 심사 진행 중
          </div>

          <div className="eval-nodes">
            {EVAL_STAGES.map((s, i) => (
              <div key={i} className={`eval-node ${i < stage ? "done" : i === stage ? "active" : ""}`}>
                <span className="eval-node-icon">{s.icon}</span>
                <span className="eval-node-label">{s.msg.replace("...", "").replace(" 중", "")}</span>
                {i < stage && (
                  <svg className="eval-node-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-success)" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
                {i === stage && <span className="eval-node-pulse" />}
              </div>
            ))}
          </div>

          <div className="loading-stage-msg" key={stage}>
            {EVAL_STAGES[stage].msg}
          </div>

          <div className="eval-progress-track">
            <div
              className="eval-progress-fill"
              style={{
                width: `${((stage + 1) / EVAL_STAGES.length) * 100}%`,
                transition: "width 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>

          <TipCarousel tips={evalTips} />

          <span className="loading-elapsed">{fmtTime(elapsed)}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main Component ---------- */
export default function ResultClient({ session }: { session: SessionData }) {
  const [copied, setCopied] = useState(false);
  const [igToast, setIgToast] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [stage, setStage] = useState(0);
  const [expandedDim, setExpandedDim] = useState<string | null>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 100),
      setTimeout(() => setStage(2), 400),
      setTimeout(() => setStage(3), 900),
      setTimeout(() => setStage(4), 1300),
      setTimeout(() => setStage(5), 1700),
      setTimeout(() => setStage(6), 2300),
      setTimeout(() => setStage(7), 2800),
    ];

    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

    fetch(`/api/pitch/${session.id}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName: "result_view" }),
    }).catch(() => {});

    return () => timers.forEach(clearTimeout);
  }, [session.id]);

  const logEvent = useCallback(
    (eventName: string) => {
      fetch(`/api/pitch/${session.id}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventName }),
      }).catch(() => {});
    },
    [session.id]
  );

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/result/${session.id}?utm_source=share&utm_medium=link`
    : "";

  const verdict = session.verdict ? VERDICT_MAP[session.verdict as VerdictKey] : null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      logEvent("share_link_copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      logEvent("share_link_copied");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function nativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `AI VC 심사 결과: ${verdict?.label ?? ""} (${session.score}점)`,
        text: `내 아이디어가 AI VC한테 "${verdict?.label}" 판정을 받았어! 너도 심사받아봐`,
        url: shareUrl,
      });
      logEvent("share_native");
    } catch {
      // user cancelled
    }
  }

  async function shareInstagram() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setIgToast(true);
    logEvent("share_instagram");
    setTimeout(() => setIgToast(false), 3000);
    // Small delay so user sees the toast before app switch
    setTimeout(() => {
      window.location.href = "instagram://app";
    }, 300);
  }

  if (session.status === "FAILED") {
    return (
      <div className="page result-page" style={{ textAlign: "center", paddingTop: "var(--space-3xl)" }}>
        <div className="result-fail-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-danger)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1>심사에 실패했습니다</h1>
        <p style={{ maxWidth: 400, margin: "var(--space-md) auto var(--space-xl)", color: "var(--text-muted)" }}>
          AI VC가 현재 바쁜 것 같습니다. 잠시 후 다시 시도해주세요.
        </p>
        <a href="/" className="cta-button" style={{ display: "inline-flex", width: "auto", padding: "14px 32px" }}>
          <span>다시 심사받기</span>
        </a>
      </div>
    );
  }

  if (!session.score || !verdict) {
    return <EvaluatingScreen />;
  }

  const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");
  const details = session.evaluationDetails;

  return (
    <div className={`page result-page verdict-theme-${verdict.className}`}>
      {/* Ambient effects */}
      <div className="result-ambient" aria-hidden="true" />
      <div className="result-ambient-secondary" aria-hidden="true" />

      {/* Section 1: Verdict Hero */}
      <section className={cx("result-hero", stage >= 1 && "show")}>
        <div className="result-completed-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
          심사 완료
        </div>

        <div className={cx("result-verdict-area", stage >= 2 && "show")}>
          <div className={`verdict-badge ${verdict.className}`}>
            {verdict.emoji} {verdict.label}
          </div>
          <p className="verdict-tagline">{verdict.tagline}</p>
        </div>

        <div className={cx("result-score-area", stage >= 2 && "show")}>
          <ScoreRing score={session.score} color={verdict.color} />
          {session.percentile != null && (
            <p className="percentile" style={{ color: verdict.color }}>
              상위 {session.percentile}%
            </p>
          )}
        </div>
      </section>

      {/* Section 2: Idea Quote */}
      <section className={cx("result-idea-section", stage >= 3 && "show")}>
        <div className="result-idea-quote">
          <svg className="result-quote-mark" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" opacity="0.15">
            <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
          </svg>
          {session.ideaText}
        </div>
      </section>

      {/* Section 3: VC Memo */}
      {session.vcComment && (
        <section className={cx("result-memo-section", stage >= 4 && "show")}>
          <div className="result-memo-header">
            <div className="result-memo-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20V10M18 20V4M6 20v-4" />
              </svg>
            </div>
            <div>
              <span className="result-memo-name">AI VC Lead Partner</span>
              <span className="result-memo-role">Investment Memo</span>
            </div>
          </div>
          <div className="result-memo-body">
            {session.vcComment}
          </div>
        </section>
      )}

      {/* Section 4: Multi-Agent Breakdown (the big upgrade) */}
      {details && (
        <section className={cx("result-breakdown-section", stage >= 5 && "show")}>
          {/* Section Header */}
          <div className="breakdown-section-header">
            <div className="breakdown-header-line" />
            <span className="breakdown-header-text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20V10M18 20V4M6 20v-4" />
              </svg>
              전문 심사역 분석
            </span>
            <div className="breakdown-header-line" />
          </div>

          {/* Radar + Summary Grid */}
          <div className="breakdown-overview">
            {/* Radar chart */}
            <div className="breakdown-radar-wrap">
              <RadarChart breakdown={details.breakdown} animated={stage >= 5} />
            </div>
            {/* Quick scores */}
            <div className="breakdown-quick-scores">
              {details.breakdown.map((d, i) => {
                const color = scoreColor(d.score);
                const meta = DIMENSION_META[d.key] || { icon: "", label: d.dimension };
                return (
                  <div
                    key={d.key}
                    className="quick-score-row"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <span className="quick-score-icon">{meta.icon}</span>
                    <span className="quick-score-label">{meta.label}</span>
                    <div className="quick-score-bar-wrap">
                      <div
                        className="quick-score-bar"
                        style={{
                          width: stage >= 5 ? `${d.score}%` : "0%",
                          background: `linear-gradient(90deg, ${color}99, ${color})`,
                          boxShadow: `0 0 8px ${color}30`,
                          transitionDelay: `${i * 80 + 200}ms`,
                        }}
                      />
                    </div>
                    <span className="quick-score-value" style={{ color }}>
                      {stage >= 5 ? d.score : 0}
                    </span>
                    <span className="quick-score-grade" style={{ color }}>{scoreGrade(d.score)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail Cards */}
          <div className="breakdown-details">
            {details.breakdown.map((d, i) => {
              const color = scoreColor(d.score);
              const meta = DIMENSION_META[d.key] || { icon: "", label: d.dimension };
              const isExpanded = expandedDim === d.key;
              const grade = scoreGrade(d.score);
              return (
                <button
                  key={d.key}
                  type="button"
                  className={cx("breakdown-card", isExpanded && "expanded")}
                  style={{ animationDelay: `${i * 60}ms` }}
                  onClick={() => setExpandedDim(isExpanded ? null : d.key)}
                >
                  {/* Top row: left-aligned info flow */}
                  <div className="breakdown-card-top">
                    <span className="breakdown-card-dot" style={{ background: color, boxShadow: `0 0 8px ${color}50` }} />
                    <div className="breakdown-card-info">
                      <span className="breakdown-card-dim">{meta.label}</span>
                      <span className="breakdown-card-weight">{d.weight}%</span>
                    </div>
                    <div className="breakdown-card-score-area">
                      <span className="breakdown-card-score" style={{ color }}>{d.score}</span>
                      <span className="breakdown-card-grade" style={{ color: `${color}90` }}>{grade}</span>
                    </div>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2"
                      className={cx("breakdown-card-chevron", isExpanded && "open")}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>

                  {/* Score bar — always visible */}
                  <div className="breakdown-card-bar-track">
                    <div
                      className="breakdown-card-bar-fill"
                      style={{
                        width: stage >= 5 ? `${d.score}%` : "0%",
                        background: `linear-gradient(90deg, ${color}60, ${color})`,
                        boxShadow: `0 0 10px ${color}20`,
                        transitionDelay: `${i * 80 + 300}ms`,
                      }}
                    />
                  </div>

                  {/* Expanded detail panel */}
                  <div className={cx("breakdown-card-body", isExpanded && "visible")}>
                    <div className="breakdown-card-detail">
                      <p className="breakdown-card-comment">{d.comment}</p>
                      <div className="breakdown-card-meta">
                        <span className="breakdown-card-confidence" style={{ borderColor: `${color}25`, color: `${color}cc` }}>
                          {d.confidence === "high" ? "높은 확신" : d.confidence === "medium" ? "보통 확신" : "낮은 확신"}
                        </span>
                        <span className="breakdown-card-dim-full">{d.dimension}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Highlights & Improvements */}
          <div className="breakdown-insights">
            {details.highlights.length > 0 && (
              <div className="insight-block">
                <div className="insight-block-header positive">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <path d="M22 4L12 14.01l-3-3" />
                  </svg>
                  <span>핵심 강점</span>
                </div>
                {details.highlights.map((h, i) => (
                  <div key={i} className="insight-item positive">
                    <span className="insight-bullet">+</span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            )}
            {details.improvements.length > 0 && (
              <div className="insight-block">
                <div className="insight-block-header warning">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 9v4M12 17h.01" />
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <span>개선 포인트</span>
                </div>
                {details.improvements.map((imp, i) => (
                  <div key={i} className="insight-item warning">
                    <span className="insight-bullet">-</span>
                    <span>{imp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Section 5: Share */}
      <section className={cx("result-share-section", stage >= 6 && "show")}>
        <p className="result-share-label">결과를 공유해보세요</p>
        <div className="result-share-buttons">
          {isMobile && (
            <button type="button" className="result-share-btn ig" onClick={shareInstagram}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              <span>인스타 공유</span>
            </button>
          )}

          <button type="button" className={cx("result-share-btn", copied && "copied")} onClick={copyLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {copied ? (
                <path d="M20 6L9 17l-5-5" />
              ) : (
                <>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </>
              )}
            </svg>
            <span>{copied ? "복사됨!" : "링크 복사"}</span>
          </button>

          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button type="button" className="result-share-btn" onClick={nativeShare}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>공유하기</span>
            </button>
          )}

          <a href="/" className="result-share-btn" onClick={() => logEvent("retry_click")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M1 4v6h6M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
            </svg>
            <span>다시 심사</span>
          </a>
        </div>

        {/* Instagram toast */}
        <div className={cx("ig-toast", igToast && "show")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          링크가 복사되었습니다! 인스타에서 붙여넣기 해주세요
        </div>
      </section>

      {/* Section 6: CREAI+IT CTA */}
      <section className={cx("result-creait-section", stage >= 7 && "show")}>
        <div className="result-creait-card">
          <div className="result-creait-glow" aria-hidden="true" />
          <span className="result-creait-eyebrow">
            <span className="result-creait-dot" />
            연세대학교 AI 창업 학회
          </span>
          <span className="result-creait-brand">CREAI+IT</span>
          <p className="result-creait-desc">
            최신 AI 기술로 혁신적인 솔루션을 만드는 창업 학회입니다.
            <br />
            함께 아이디어를 현실로 만들어보세요.
          </p>
          <a
            href="https://creaiitpage.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="result-creait-cta"
            onClick={() => logEvent("cta_apply_click")}
          >
            <span>CREAI+IT 알아보기</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        </div>
      </section>

      {/* Watermark */}
      <div className={cx("result-watermark", stage >= 7 && "show")}>
        Powered by CREAI+IT
      </div>
    </div>
  );
}
