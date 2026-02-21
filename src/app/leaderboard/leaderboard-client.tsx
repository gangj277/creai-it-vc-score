"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type VerdictKey = "UNICORN" | "SEED" | "HOLD" | "COME_BACK";

interface LeaderboardEntry {
  id: string;
  ideaText: string;
  score: number;
  verdict: VerdictKey;
  percentile: number | null;
  createdAt: string;
}

const VERDICT_MAP: Record<VerdictKey, { label: string; emoji: string; className: string }> = {
  UNICORN: { label: "유니콘 후보", emoji: "\uD83E\uDD84", className: "unicorn" },
  SEED: { label: "시드 투자", emoji: "\uD83C\uDF31", className: "seed" },
  HOLD: { label: "보류", emoji: "\uD83E\uDD14", className: "hold" },
  COME_BACK: { label: "다시 오세요", emoji: "\uD83D\uDC4B", className: "come_back" },
};

type FilterKey = "ALL" | VerdictKey;

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "UNICORN", label: "\uD83E\uDD84 유니콘" },
  { key: "SEED", label: "\uD83C\uDF31 시드" },
  { key: "HOLD", label: "\uD83E\uDD14 보류" },
  { key: "COME_BACK", label: "\uD83D\uDC4B 재도전" },
];

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  return `${months}개월 전`;
}

export default function LeaderboardClient({ entries }: { entries: LeaderboardEntry[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const filtered = filter === "ALL" ? entries : entries.filter((e) => e.verdict === filter);

  return (
    <div className="page leaderboard-page">
      {/* Ambient blobs */}
      <div className="leaderboard-ambient" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Header */}
      <header className={`leaderboard-header ${visible ? "show" : ""}`}>
        <div className="leaderboard-eyebrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 20V10M18 20V4M6 20v-4" />
          </svg>
          AI VC 심사 랭킹
        </div>
        <h1>리더보드</h1>
        <p className="leaderboard-subtitle">
          모든 심사 완료 아이디어를 점수 순으로 확인하세요
        </p>
        <div className="leaderboard-count">
          총 <strong>{entries.length}</strong>개 아이디어
        </div>
      </header>

      {/* Filter tabs */}
      <nav className={`leaderboard-filters ${visible ? "show" : ""}`}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`leaderboard-filter-tab ${filter === tab.key ? "active" : ""}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            {tab.key !== "ALL" && (
              <span className="filter-count">
                {entries.filter((e) => e.verdict === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* List */}
      <div className="leaderboard-list">
        {filtered.length === 0 ? (
          <div className={`leaderboard-empty ${visible ? "show" : ""}`}>
            <p>해당 카테고리에 아이디어가 없습니다</p>
          </div>
        ) : (
          filtered.map((entry, i) => {
            const globalRank = entries.indexOf(entry) + 1;
            const verdict = VERDICT_MAP[entry.verdict];
            return (
              <button
                key={entry.id}
                type="button"
                className={`leaderboard-entry ${visible ? "show" : ""}`}
                style={{ animationDelay: `${Math.min(i * 60, 600)}ms` }}
                onClick={() => router.push(`/result/${entry.id}`)}
              >
                {/* Rank */}
                <div className={`leaderboard-rank ${globalRank <= 3 ? `top-${globalRank}` : ""}`}>
                  {globalRank <= 3 ? (
                    <span className="rank-medal">
                      {globalRank === 1 ? "\uD83E\uDD47" : globalRank === 2 ? "\uD83E\uDD48" : "\uD83E\uDD49"}
                    </span>
                  ) : (
                    <span className="rank-number">#{globalRank}</span>
                  )}
                </div>

                {/* Content */}
                <div className="leaderboard-entry-body">
                  <div className="leaderboard-entry-top">
                    <span className={`leaderboard-verdict-chip ${verdict.className}`}>
                      {verdict.emoji} {verdict.label}
                    </span>
                    <span className="leaderboard-time">{relativeTime(entry.createdAt)}</span>
                  </div>
                  <p className="leaderboard-idea-text">{entry.ideaText}</p>
                </div>

                {/* Score */}
                <div className={`leaderboard-score verdict-${verdict.className}`}>
                  <span className="score-value">{entry.score}</span>
                  <span className="score-label">점</span>
                </div>
              </button>
            );
          })
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
