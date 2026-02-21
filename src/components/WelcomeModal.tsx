"use client";

import { useEffect, useState, useCallback } from "react";
import s from "./WelcomeModal.module.css";

const STORAGE_KEY = "creai_vc_welcome_seen";

export default function WelcomeModal() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // SSR or storage blocked
    }
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Staggered entrance stages
  useEffect(() => {
    if (!visible) return;
    const timers = [
      setTimeout(() => setStage(1), 100),  // backdrop
      setTimeout(() => setStage(2), 400),  // card
      setTimeout(() => setStage(3), 700),  // badge
      setTimeout(() => setStage(4), 900),  // brand name
      setTimeout(() => setStage(5), 1200), // divider + subtitle
      setTimeout(() => setStage(6), 1500), // description
      setTimeout(() => setStage(7), 1800), // buttons
    ];
    return () => timers.forEach(clearTimeout);
  }, [visible]);

  const dismiss = useCallback(() => {
    setClosing(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setTimeout(() => setVisible(false), 500);
  }, []);

  if (!visible) return null;

  const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

  return (
    <div
      className={cx(s.overlay, stage >= 1 && s.overlayShow, closing && s.overlayClosing)}
      onClick={dismiss}
    >
      <div
        className={cx(s.card, stage >= 2 && s.cardShow, closing && s.cardClosing)}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative glow orbs */}
        <div className={cx(s.orb, s.orb1)} aria-hidden="true" />
        <div className={cx(s.orb, s.orb2)} aria-hidden="true" />

        {/* Grid decoration */}
        <div className={s.grid} aria-hidden="true" />

        {/* Badge */}
        <div className={cx(s.badge, stage >= 3 && s.reveal)}>
          <span className={s.badgeDot} />
          연세대학교 AI 스타트업 학회
        </div>

        {/* Brand Name */}
        <h1 className={cx(s.brand, stage >= 4 && s.brandVisible)}>
          {"CREAI+IT".split("").map((char, i) => (
            <span
              key={i}
              className={s.letter}
              style={{ animationDelay: stage >= 4 ? `${i * 60}ms` : "0ms" }}
            >
              {char}
            </span>
          ))}
        </h1>

        {/* Divider */}
        <div className={cx(s.divider, stage >= 5 && s.reveal, stage >= 5 && s.dividerVisible)}>
          <span className={s.divLine} />
          <span className={s.divText}>AI / IT 창업 학회</span>
          <span className={s.divLine} />
        </div>

        {/* Subtitle */}
        <p className={cx(s.subtitle, stage >= 5 && s.reveal)}>
          기술의 경계를 넘어, 가치를 창출합니다
        </p>

        {/* Description */}
        <p className={cx(s.desc, stage >= 6 && s.reveal)}>
          최신 AI 기술을 활용해 혁신적인 솔루션을 만드는
          <br />
          연세대학교 창업 학회입니다.
          <br />
          <span className={s.descHighlight}>15억+ 투자유치 &middot; 50+ 멤버 &middot; 7+개 팀 창업 중</span>
        </p>

        {/* Buttons */}
        <div className={cx(s.actions, stage >= 7 && s.reveal)}>
          <button type="button" className={s.ctaPrimary} onClick={dismiss}>
            <span>AI VC 심사 시작하기</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <a
            href="https://creaiitpage.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className={s.ctaSecondary}
            onClick={() => {
              try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
            }}
          >
            <span>CREAI+IT 더 알아보기</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        </div>

        {/* Floating particles */}
        <div className={s.particles} aria-hidden="true">
          {[...Array(8)].map((_, i) => (
            <span key={i} className={cx(s.particle, s[`p${i}`])} />
          ))}
        </div>
      </div>
    </div>
  );
}
