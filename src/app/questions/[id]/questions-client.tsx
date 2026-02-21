"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import TipCarousel, { buildEvalTipList } from "@/components/TipCarousel";

interface QuestionItem {
  id: number;
  question: string;
  hint: string;
  options: string[];
}

const EVAL_STAGES = [
  { msg: "답변을 종합하고 있습니다...", icon: "📋" },
  { msg: "시장 기회 분석 중...", icon: "🌍" },
  { msg: "문제-솔루션 적합성 평가 중...", icon: "🎯" },
  { msg: "실행 가능성 검토 중...", icon: "⚙️" },
  { msg: "경쟁 우위 분석 중...", icon: "🛡️" },
  { msg: "성장 잠재력 평가 중...", icon: "🚀" },
  { msg: "최종 보고서를 작성하는 중...", icon: "📝" },
];

const QUESTION_ICONS = [
  <svg key="q1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>,
  <svg key="q2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>,
  <svg key="q3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>,
];

export default function QuestionsClient({
  sessionId,
  ideaText,
  questions,
}: {
  sessionId: string;
  ideaText: string;
  questions: QuestionItem[];
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(questions.map(() => ""));
  const [customMode, setCustomMode] = useState<boolean[]>(questions.map(() => false));
  const [loading, setLoading] = useState(false);
  const [evalStage, setEvalStage] = useState(0);
  const [evalElapsed, setEvalElapsed] = useState(0);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [selectedChip, setSelectedChip] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    fetch(`/api/pitch/${sessionId}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName: "questions_view" }),
    }).catch(() => {});
  }, [sessionId]);

  // Evaluation loading stage progression
  useEffect(() => {
    if (!loading) {
      setEvalStage(0);
      setEvalElapsed(0);
      return;
    }
    const intervals = [2000, 6000, 14000, 22000, 30000, 40000];
    const timers = intervals.map((ms, i) =>
      setTimeout(() => setEvalStage(i + 1), ms)
    );
    const tick = setInterval(() => setEvalElapsed((e) => e + 1), 1000);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(tick);
    };
  }, [loading]);

  useEffect(() => {
    if (customMode[currentStep]) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [currentStep, customMode]);


  const totalSteps = questions.length;
  const currentAnswer = answers[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const canProceed = currentAnswer.trim().length >= 1;
  const allAnswered = answers.every((a) => a.trim().length >= 1);
  const progress = ((currentStep + 1) / totalSteps) * 100;

  function updateAnswer(value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentStep] = value;
      return next;
    });
    setError("");
  }

  function goNext() {
    if (!canProceed) return;
    setSelectedChip(null);
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  }

  function goPrev() {
    setSelectedChip(null);
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  const handleSubmit = useCallback(async () => {
    if (!allAnswered || loading) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/pitch/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "심사 요청에 실패했습니다.");
      }

      router.push(`/result/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setLoading(false);
    }
  }, [allAnswered, loading, sessionId, answers, router]);

  function handleOptionSelect(optionText: string, optionIndex: number) {
    if (loading) return;
    updateAnswer(optionText);
    setSelectedChip(optionIndex);
  }

  function toggleCustomMode() {
    setCustomMode((prev) => {
      const next = [...prev];
      next[currentStep] = !next[currentStep];
      return next;
    });
    // Clear answer when switching modes
    if (!customMode[currentStep]) {
      // Switching TO custom mode — clear option-based answer
      setSelectedChip(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (isLastStep && allAnswered) {
        handleSubmit();
      } else if (canProceed) {
        goNext();
      }
    }
  }

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(1, "0")}:${String(s % 60).padStart(2, "0")}`;
  const evalTips = useMemo(() => buildEvalTipList(["market", "solution", "execution", "competitive", "growth", "general"]), []);

  return (
    <div className="page">
      {/* Full-screen evaluation overlay */}
      {loading && (
        <div className="loading-overlay eval-overlay">
          <div className="loading-overlay-bg" aria-hidden="true" />
          <div className="loading-content">
            {/* Title */}
            <div className="eval-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                <path d="M12 20V10M18 20V4M6 20v-4" />
              </svg>
              AI VC 심사 진행 중
            </div>

            {/* Specialist nodes */}
            <div className="eval-nodes">
              {EVAL_STAGES.map((s, i) => (
                <div key={i} className={`eval-node ${i < evalStage ? "done" : i === evalStage ? "active" : ""}`}>
                  <span className="eval-node-icon">{s.icon}</span>
                  <span className="eval-node-label">{s.msg.replace("...", "").replace(" 중", "")}</span>
                  {i < evalStage && (
                    <svg className="eval-node-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-success)" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                  {i === evalStage && <span className="eval-node-pulse" />}
                </div>
              ))}
            </div>

            {/* Active stage message */}
            <div className="loading-stage-msg" key={evalStage}>
              {EVAL_STAGES[evalStage].msg}
            </div>

            {/* Progress bar */}
            <div className="eval-progress-track">
              <div
                className="eval-progress-fill"
                style={{
                  width: `${((evalStage + 1) / EVAL_STAGES.length) * 100}%`,
                  transition: "width 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </div>

            {/* Tips */}
            <TipCarousel tips={evalTips} />

            {/* Elapsed */}
            <span className="loading-elapsed">{fmtTime(evalElapsed)}</span>
          </div>
        </div>
      )}

      {/* Ambient Floating Blobs */}
      <div className="questions-ambient" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Progress Bar */}
      <div
        className="questions-progress"
        style={{
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.5s",
        }}
      >
        <div className="progress-header">
          <span className="progress-label">
            질문 {currentStep + 1} / {totalSteps}
          </span>
          <span className="progress-pct">{Math.round(progress)}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Step Dots */}
      <div className="step-dots">
        {questions.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`step-dot ${i === currentStep ? "active" : ""} ${i < currentStep || answers[i].trim().length >= 1 ? "completed" : ""}`}
            onClick={() => {
              setSelectedChip(null);
              setCurrentStep(i);
            }}
            aria-label={`질문 ${i + 1}`}
          />
        ))}
      </div>

      {/* Idea Context */}
      <div
        className="idea-context"
        style={{
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.5s 0.1s",
        }}
      >
        &ldquo;{ideaText}&rdquo;
      </div>

      {/* Question Card */}
      <div className="questions-container">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className={`question-slide ${i === currentStep ? "active" : ""}`}
            style={{
              transform:
                i === currentStep
                  ? "translateX(0) scale(1)"
                  : i < currentStep
                    ? "translateX(-30px) scale(0.98)"
                    : "translateX(30px) scale(0.98)",
              opacity: i === currentStep ? 1 : 0,
              pointerEvents: i === currentStep ? "auto" : "none",
              position: i === currentStep ? "relative" : "absolute",
              visibility: i === currentStep ? "visible" : "hidden",
            }}
          >
            <div className="card question-card">
              <div className="question-number">
                <span>{QUESTION_ICONS[i] || i + 1}</span>
              </div>
              <h2 className="question-text">{q.question}</h2>
              <p className="question-hint">{q.hint}</p>

              {/* Option Chips (default mode) */}
              {!customMode[i] && q.options && q.options.length > 0 ? (
                <div className="option-chips-area">
                  <div className="option-chips">
                    {q.options.map((opt, oi) => {
                      const isSelected = i === currentStep && selectedChip === oi && answers[i] === opt;
                      const isAnswered = answers[i] === opt && i !== currentStep;
                      return (
                        <button
                          key={oi}
                          type="button"
                          className={`option-chip ${isSelected || isAnswered ? "selected" : ""}`}
                          onClick={() => handleOptionSelect(opt, oi)}
                          disabled={loading}
                        >
                          <span className="option-chip-text">{opt}</span>
                          {(isSelected || isAnswered) && (
                            <svg className="option-chip-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="custom-input-toggle"
                    onClick={toggleCustomMode}
                    disabled={loading}
                  >
                    직접 입력하기
                  </button>
                </div>
              ) : (
                /* Custom Text Input Mode */
                <div className="custom-input-area">
                  <textarea
                    ref={i === currentStep ? textareaRef : undefined}
                    value={answers[i]}
                    onChange={(e) => updateAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="답변을 입력해주세요..."
                    maxLength={1000}
                    disabled={loading}
                  />
                  <div className="char-info">
                    <span className={`char-count ${answers[i].length >= 5 ? "valid" : ""}`}>
                      {answers[i].length}/1000
                    </span>
                    {answers[i].length > 0 && answers[i].length < 5 && (
                      <span className="char-hint">최소 5자 이상</span>
                    )}
                    {answers[i].length === 0 && (
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        Cmd+Enter로 다음
                      </span>
                    )}
                  </div>
                  {q.options && q.options.length > 0 && (
                    <button
                      type="button"
                      className="custom-input-toggle"
                      onClick={toggleCustomMode}
                      disabled={loading}
                    >
                      선택지로 돌아가기
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="error" style={{ marginTop: "var(--space-md)", maxWidth: 580, margin: "var(--space-md) auto 0" }} role="alert">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="questions-nav">
        <button
          type="button"
          className="secondary"
          onClick={currentStep === 0 ? () => router.push("/") : goPrev}
          disabled={loading}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>{currentStep === 0 ? "처음으로" : "이전"}</span>
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !allAnswered}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                <span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                <span>AI VC가 심사 중...</span>
              </span>
            ) : (
              <>
                <span>투자 심사 받기</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={!canProceed}
          >
            <span>다음</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Watermark */}
      <a
        href="https://creaiitpage.vercel.app"
        target="_blank"
        rel="noopener noreferrer"
        className="page-watermark"
      >
        Powered by CREAI+IT
      </a>
    </div>
  );
}
