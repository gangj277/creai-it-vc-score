"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import WelcomeModal from "@/components/WelcomeModal";
import TipCarousel, { GENERAL_TIPS } from "@/components/TipCarousel";

const LOADING_STAGES = [
  { msg: "아이디어를 접수하고 있습니다...", delay: 0 },
  { msg: "시장 구조를 파악하는 중...", delay: 3000 },
  { msg: "핵심 검증 포인트를 도출하는 중...", delay: 7000 },
  { msg: "맞춤형 질문을 구성하는 중...", delay: 12000 },
  { msg: "거의 다 됐어요!", delay: 18000 },
];

export default function HomePage() {
  const router = useRouter();
  const [ideaText, setIdeaText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [pitchCount, setPitchCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.pitchCount) setPitchCount(data.pitchCount);
      })
      .catch(() => {});
  }, []);

  // Loading stage progression & elapsed timer
  useEffect(() => {
    if (!loading) {
      setLoadingStage(0);
      setElapsed(0);
      return;
    }
    const timers = LOADING_STAGES.slice(1).map((s, i) =>
      setTimeout(() => setLoadingStage(i + 1), s.delay)
    );
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(tick);
    };
  }, [loading]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (ideaText.trim().length < 5) {
      setError("아이디어는 최소 5자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const utmParams: Record<string, string> = {};
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        if (sp.get("utm_source")) utmParams.utmSource = sp.get("utm_source")!;
        if (sp.get("utm_medium")) utmParams.utmMedium = sp.get("utm_medium")!;
        if (sp.get("utm_campaign")) utmParams.utmCampaign = sp.get("utm_campaign")!;
      }

      const response = await fetch("/api/pitch/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaText: ideaText.trim(),
          referrer: document.referrer || undefined,
          userAgent: navigator.userAgent,
          ...utmParams,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "심사 요청에 실패했습니다.");
      }

      router.push(`/questions/${payload.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  }

  const charCount = ideaText.length;
  const charClass = charCount >= 480 ? "at-limit" : charCount >= 400 ? "near-limit" : "";

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(1, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="page landing-page">
      <WelcomeModal />

      {/* Full-screen loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-overlay-bg" aria-hidden="true" />
          <div className="loading-content">
            {/* Progress ring */}
            <div className="loading-ring-wrap">
              <svg viewBox="0 0 120 120" className="loading-ring-svg">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="4" />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="url(#loading-grad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - (loadingStage + 1) / LOADING_STAGES.length)}
                  style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
                />
                <defs>
                  <linearGradient id="loading-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="loading-ring-inner">
                <span className="loading-ring-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20V10M18 20V4M6 20v-4" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Stage message */}
            <div className="loading-stage-msg" key={loadingStage}>
              {LOADING_STAGES[loadingStage].msg}
            </div>

            {/* Progress dots */}
            <div className="loading-stage-dots">
              {LOADING_STAGES.map((_, i) => (
                <span key={i} className={`loading-stage-dot ${i <= loadingStage ? "active" : ""} ${i === loadingStage ? "current" : ""}`} />
              ))}
            </div>

            {/* Tips */}
            <TipCarousel tips={GENERAL_TIPS} />

            {/* Elapsed time */}
            <span className="loading-elapsed">{fmtTime(elapsed)}</span>
          </div>
        </div>
      )}

      <section className="landing-hero">
        {/* Background glow */}
        <div className="landing-bg" aria-hidden="true" />

        {/* Brand Block */}
        <div className="brand-block animate-fade-in">
          <span className="hero-eyebrow">
            <span className="eyebrow-accent">YONSEI UNIV.</span>
            <span className="eyebrow-dot" />
            AI Startup Club
          </span>

          <h1 className="brand-name">CREAI+IT</h1>

          <div className="brand-presents">
            <span className="presents-line" />
            <span className="presents-text">P R E S E N T S</span>
            <span className="presents-line" />
          </div>
        </div>

        {/* Decorative Particles */}
        <div className="hero-particles animate-fade-in delay-1" style={{ opacity: 0 }} aria-hidden="true">
          <span /><span /><span /><span /><span /><span />
        </div>

        {/* Headline */}
        <div className="hero-headline animate-fade-in delay-2" style={{ opacity: 0 }}>
          <h2>
            아이디어 한 줄이면
            <br />
            <span className="accent-text">AI VC가 투자 심사합니다</span>
          </h2>
        </div>

        {/* Info Pills */}
        <div className="info-pills animate-fade-in delay-2" style={{ opacity: 0 }}>
          <span className="info-pill">AI 후속 질문</span>
          <span className="info-pill">VC 투자 판정</span>
          <span className="info-pill">결과 공유</span>
        </div>

        {/* Meta Info */}
        <div className="info-meta animate-fade-in delay-3" style={{ opacity: 0 }}>
          <span><span className="meta-dot accent" />3단계</span>
          <span className="meta-sep">|</span>
          <span><span className="meta-dot violet" />약 2분</span>
        </div>

        {/* Social Proof */}
        {pitchCount !== null && pitchCount > 0 && (
          <div className="social-proof animate-fade-in delay-3" style={{ opacity: 0 }}>
            <strong>{pitchCount.toLocaleString()}</strong>
            <span>개의 아이디어가 심사를 받았습니다</span>
          </div>
        )}

        {/* Form */}
        <div className="pitch-form animate-slide-up delay-4" style={{ opacity: 0 }}>
          <form onSubmit={onSubmit}>
            <div className="pitch-input-wrapper">
              <textarea
                id="idea"
                value={ideaText}
                onChange={(e) => {
                  setIdeaText(e.target.value);
                  setError("");
                }}
                placeholder="예: AI가 내 옷장을 분석해서 매일 코디를 추천해주는 앱"
                maxLength={500}
                disabled={loading}
                autoFocus
              />
              <span className={`char-count ${charClass}`}>
                {charCount}/500
              </span>
            </div>

            {error && (
              <div className="error" style={{ marginTop: "var(--space-md)" }} role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="cta-button"
              disabled={loading || ideaText.trim().length < 5}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  <span>AI VC가 질문을 준비 중...</span>
                </>
              ) : (
                <span>투자 심사 시작하기</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <a
          href="https://creaiitpage.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="landing-footer animate-fade-in delay-5"
          style={{ opacity: 0, textDecoration: "none" }}
        >
          <span>Powered by <strong>CREAI+IT</strong></span>
          <span className="footer-sub">연세대학교 AI 스타트업 학회</span>
        </a>
      </section>
    </div>
  );
}
