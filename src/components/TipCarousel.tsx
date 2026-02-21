"use client";

import { useState, useCallback } from "react";

interface Tip {
  emoji: string;
  text: string;
  source?: string;
}

export const GENERAL_TIPS: Tip[] = [
  { emoji: "💡", text: "VC는 '이 팀이 왜 이 문제를 풀어야 하는가'를 가장 먼저 봅니다.", source: "Sequoia Capital" },
  { emoji: "📊", text: "스타트업의 90%는 실패하지만, 그중 42%는 시장 수요가 없어서입니다.", source: "CB Insights" },
  { emoji: "🦄", text: "유니콘 기업의 평균 IPO까지 소요 기간은 약 7년입니다." },
  { emoji: "🔄", text: "성공한 스타트업의 65%가 원래 아이디어에서 크게 피벗했습니다.", source: "Startup Genome" },
  { emoji: "🎯", text: "Airbnb는 처음 3명의 VC에게 거절당했지만, 지금 시가총액 80조원입니다." },
  { emoji: "💰", text: "시드 라운드에서 VC가 가장 중요시하는 건 '팀'과 '시장 크기'입니다." },
  { emoji: "📱", text: "Instagram은 출시 첫 주에 10만 유저를 달성했습니다." },
  { emoji: "🎪", text: "Y Combinator 합격률은 약 1.5%로 하버드 합격률(3.4%)보다 낮습니다." },
  { emoji: "🚀", text: "초기 스타트업의 핵심 지표는 MRR(월간 반복 수익)보다 리텐션입니다." },
  { emoji: "🤝", text: "좋은 피치는 문제 정의에 50%, 솔루션에 30%, 팀에 20%를 할애합니다." },
  { emoji: "⚡", text: "Slack은 게임 회사 Tiny Speck의 내부 커뮤니케이션 도구에서 시작했습니다." },
  { emoji: "🌏", text: "한국 스타트업 생태계는 세계 5위 규모로, 유니콘 22개를 보유하고 있습니다." },
];

export const EVAL_TIPS: Record<string, Tip[]> = {
  market: [
    { emoji: "🌍", text: "TAM(전체 시장)보다 SAM(도달 가능 시장)이 투자자에게 더 중요합니다." },
    { emoji: "📈", text: "시장 성장률이 20% 이상이면 VC가 '매력적인 시장'으로 분류합니다." },
    { emoji: "🔍", text: "시장 규모는 Top-Down(리서치)과 Bottom-Up(단가×고객수) 두 방식으로 검증하세요." },
  ],
  solution: [
    { emoji: "🎯", text: "10배 더 좋거나, 10배 더 싸야 고객이 기존 솔루션에서 넘어옵니다." },
    { emoji: "💊", text: "VC는 '비타민(nice-to-have)'보다 '진통제(must-have)' 제품을 선호합니다." },
    { emoji: "🧪", text: "MVP는 완벽할 필요 없습니다. 핵심 가설 하나만 검증하면 됩니다." },
  ],
  execution: [
    { emoji: "⚙️", text: "실행력은 '얼마나 빨리 학습하고 반복하는가'로 측정됩니다." },
    { emoji: "🏃", text: "좋은 스타트업은 2주 스프린트로 가설을 세우고, 실험하고, 학습합니다." },
    { emoji: "🛠️", text: "기술적 해자(moat)는 시간이 지날수록 복제가 어려워야 합니다." },
  ],
  competitive: [
    { emoji: "🛡️", text: "Peter Thiel: '경쟁하지 말고, 독점하라.'", source: "Zero to One" },
    { emoji: "🏰", text: "네트워크 효과, 전환 비용, 규모의 경제 — 이 세 가지가 대표적인 경쟁 해자입니다." },
    { emoji: "⚔️", text: "대기업이 안 하는 이유가 '못 해서'인지 '안 해서'인지 구분하는 게 핵심입니다." },
  ],
  growth: [
    { emoji: "🚀", text: "바이럴 계수(K-factor)가 1 이상이면 유저가 유저를 데려옵니다." },
    { emoji: "📣", text: "초기 스타트업에서 가장 효과적인 성장 채널은 '창업자의 직접 영업'입니다." },
    { emoji: "🔁", text: "리텐션이 좋은 제품은 CAC(고객 획득 비용)를 감당할 수 있습니다." },
  ],
  general: [
    { emoji: "📝", text: "좋은 투자 메모는 한 문장으로 왜 투자하는지 설명할 수 있어야 합니다." },
    { emoji: "🎬", text: "최종 보고서는 5개 전문 심사역의 의견을 종합하여 작성됩니다." },
    { emoji: "🏆", text: "80점 이상이면 '유니콘 후보', 60점 이상이면 '시드 투자' 판정을 받습니다." },
  ],
};

/** Build ordered tip list for evaluation: tips matching each stage, then general pool */
export function buildEvalTipList(stageKeys: string[]): Tip[] {
  const tips: Tip[] = [];
  const seen = new Set<string>();
  for (const key of stageKeys) {
    for (const tip of EVAL_TIPS[key] || []) {
      if (!seen.has(tip.text)) {
        tips.push(tip);
        seen.add(tip.text);
      }
    }
  }
  for (const tip of GENERAL_TIPS) {
    if (!seen.has(tip.text)) {
      tips.push(tip);
      seen.add(tip.text);
    }
  }
  return tips;
}

export default function TipCarousel({ tips }: { tips: Tip[] }) {
  const [index, setIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % tips.length);
    setAnimKey((k) => k + 1);
  }, [tips.length]);

  const tip = tips[index];

  return (
    <button type="button" className="tip-carousel" onClick={next}>
      <div className="tip-card" key={animKey}>
        <span className="tip-emoji">{tip.emoji}</span>
        <p className="tip-text">{tip.text}</p>
        {tip.source && <span className="tip-source">— {tip.source}</span>}
      </div>
      <div className="tip-footer">
        <span className="tip-counter">{index + 1} / {tips.length}</span>
        <span className="tip-next">
          탭하여 다음 팁
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </button>
  );
}
