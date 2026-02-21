import { prisma } from "@/lib/prisma";
import type { QuestionItem } from "@/agents/types";
import QuestionsClient from "./questions-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function QuestionsPage({ params }: Props) {
  const { id } = await params;

  const session = await prisma.pitchSession.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      ideaText: true,
      questions: true,
    },
  });

  if (!session) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "var(--space-3xl)" }}>
        <h1>세션을 찾을 수 없습니다</h1>
        <p>잘못된 링크이거나 만료된 세션입니다.</p>
        <a href="/" className="btn" style={{ marginTop: "var(--space-xl)" }}>
          <span>새로운 아이디어 심사받기</span>
        </a>
      </div>
    );
  }

  if (session.status === "COMPLETED") {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "var(--space-3xl)" }}>
        <h1>이미 심사가 완료되었습니다</h1>
        <a href={`/result/${session.id}`} className="btn" style={{ marginTop: "var(--space-xl)" }}>
          <span>결과 보기</span>
        </a>
      </div>
    );
  }

  const questions = (session.questions as unknown as QuestionItem[]) ?? [];

  if (questions.length === 0) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "var(--space-3xl)" }}>
        <h1>질문을 불러올 수 없습니다</h1>
        <a href="/" className="btn" style={{ marginTop: "var(--space-xl)" }}>
          <span>다시 시작하기</span>
        </a>
      </div>
    );
  }

  return (
    <QuestionsClient
      sessionId={session.id}
      ideaText={session.ideaText}
      questions={questions}
    />
  );
}
