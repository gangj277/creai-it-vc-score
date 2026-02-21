export type VerdictKey = "UNICORN" | "SEED" | "HOLD" | "COME_BACK";

export interface VerdictConfig {
  key: VerdictKey;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  minScore: number;
  maxScore: number;
  percentileLabel: string;
}

export const VERDICT_CONFIG: Record<VerdictKey, VerdictConfig> = {
  UNICORN: {
    key: "UNICORN",
    label: "유니콘 후보",
    emoji: "\uD83E\uDD84",
    color: "#a78bfa",
    bgColor: "rgba(167, 139, 250, 0.15)",
    minScore: 80,
    maxScore: 100,
    percentileLabel: "상위 5%",
  },
  SEED: {
    key: "SEED",
    label: "시드 투자",
    emoji: "\uD83C\uDF31",
    color: "#34d399",
    bgColor: "rgba(52, 211, 153, 0.15)",
    minScore: 60,
    maxScore: 79,
    percentileLabel: "상위 20%",
  },
  HOLD: {
    key: "HOLD",
    label: "보류",
    emoji: "\uD83E\uDD14",
    color: "#fbbf24",
    bgColor: "rgba(251, 191, 36, 0.15)",
    minScore: 40,
    maxScore: 59,
    percentileLabel: "",
  },
  COME_BACK: {
    key: "COME_BACK",
    label: "다시 오세요",
    emoji: "\uD83D\uDC4B",
    color: "#f87171",
    bgColor: "rgba(248, 113, 113, 0.15)",
    minScore: 0,
    maxScore: 39,
    percentileLabel: "",
  },
};

export function getVerdictForScore(score: number): VerdictConfig {
  if (score >= 80) return VERDICT_CONFIG.UNICORN;
  if (score >= 60) return VERDICT_CONFIG.SEED;
  if (score >= 40) return VERDICT_CONFIG.HOLD;
  return VERDICT_CONFIG.COME_BACK;
}

export function getVerdictByKey(key: VerdictKey): VerdictConfig {
  return VERDICT_CONFIG[key];
}
