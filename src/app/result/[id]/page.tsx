import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getVerdictByKey } from "@/lib/verdicts";
import type { VerdictKey } from "@/lib/verdicts";
import { env } from "@/lib/env";
import ResultClient from "./result-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const session = await prisma.pitchSession.findUnique({
    where: { id },
    select: { score: true, verdict: true, ideaText: true, publicId: true },
  });

  if (!session || !session.score || !session.verdict) {
    return {
      title: "AI VC 투자 심사 결과 | CREAI+IT",
    };
  }

  const verdictConfig = getVerdictByKey(session.verdict as VerdictKey);
  const ideaPreview = session.ideaText.slice(0, 50) + (session.ideaText.length > 50 ? "..." : "");
  const title = `${verdictConfig.emoji} ${verdictConfig.label} (${session.score}점) | AI VC 심사`;
  const description = `"${ideaPreview}" - AI VC 투자 심사 결과: ${verdictConfig.label} ${session.score}/100점`;
  const ogImageUrl = `${env.baseUrl}/api/share/${session.publicId}/image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ko_KR",
      images: [
        {
          url: ogImageUrl,
          width: 1080,
          height: 1920,
          alt: `AI VC 투자 심사 결과: ${verdictConfig.label}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params;

  const session = await prisma.pitchSession.findUnique({
    where: { id },
    select: {
      id: true,
      publicId: true,
      status: true,
      ideaText: true,
      questions: true,
      answers: true,
      score: true,
      verdict: true,
      vcComment: true,
      percentile: true,
      evaluationDetails: true,
      createdAt: true,
    },
  });

  if (!session) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "var(--space-3xl)" }}>
        <h1>결과를 찾을 수 없습니다</h1>
        <p>잘못된 링크이거나 만료된 결과입니다.</p>
        <a href="/" className="btn" style={{ marginTop: "var(--space-xl)" }}>
          <span>새로운 아이디어 심사받기</span>
        </a>
      </div>
    );
  }

  return (
    <ResultClient
      session={{
        id: session.id,
        publicId: session.publicId,
        status: session.status,
        ideaText: session.ideaText,
        questions: (session.questions as { question: string }[] | null) ?? [],
        answers: (session.answers as string[] | null) ?? [],
        score: session.score,
        verdict: session.verdict,
        vcComment: session.vcComment,
        percentile: session.percentile,
        evaluationDetails: session.evaluationDetails as unknown as {
          breakdown: { key: string; dimension: string; score: number; weight: number; confidence: string; comment: string }[];
          highlights: string[];
          improvements: string[];
        } | null,
      }}
    />
  );
}
