/**
 * Multi-Agent VC Evaluation E2E Test
 *
 * Prerequisites:
 *   - Dev server running on localhost:3003
 *   - Valid OPENAI_API_KEY in .env.local
 *
 * Usage:
 *   npx tsx scripts/test-multi-agent.ts
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3003";

const TEST_IDEA =
  "대학생들의 팀 프로젝트 협업을 AI로 자동화하는 플랫폼. 회의록 자동 생성, 역할 분배 추천, 진행 상황 추적, 무임승차 탐지까지 한 번에 해결합니다.";

async function main() {
  console.log("=".repeat(60));
  console.log("  Multi-Agent VC Evaluation E2E Test");
  console.log("=".repeat(60));
  console.log(`\nServer: ${BASE_URL}`);
  console.log(`Idea: "${TEST_IDEA}"\n`);

  // Step 1: Start pitch session
  console.log("[Step 1] Starting pitch session...");
  const startTime = Date.now();

  const startRes = await fetch(`${BASE_URL}/api/pitch/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ideaText: TEST_IDEA }),
  });

  if (!startRes.ok) {
    const err = await startRes.json();
    console.error("Failed to start pitch:", err);
    process.exit(1);
  }

  const startData = await startRes.json();
  const sessionId = startData.id;
  const questions = startData.questions;
  const questionTime = Date.now() - startTime;

  console.log(`  Session ID: ${sessionId}`);
  console.log(`  Questions generated in ${questionTime}ms`);
  console.log(`  Questions:`);
  for (const q of questions) {
    console.log(`    Q${q.id}. ${q.question}`);
    console.log(`       Options: ${q.options.join(" | ")}`);
  }

  // Step 2: Answer questions (pick first option for each)
  console.log("\n[Step 2] Answering questions (selecting first option)...");
  const answers = questions.map((q: { options: string[] }) => q.options[0]);

  const answerStartTime = Date.now();
  const answerRes = await fetch(`${BASE_URL}/api/pitch/${sessionId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });

  if (!answerRes.ok) {
    const err = await answerRes.json();
    console.error("Failed to submit answers:", err);
    process.exit(1);
  }

  const result = await answerRes.json();
  const evalTime = Date.now() - answerStartTime;
  const totalTime = Date.now() - startTime;

  // Step 3: Display results
  console.log(`\n  Evaluation completed in ${evalTime}ms`);
  console.log("\n" + "=".repeat(60));
  console.log("  RESULTS");
  console.log("=".repeat(60));

  console.log(`\n  Score:      ${result.score}/100`);
  console.log(`  Verdict:    ${result.verdict}`);
  console.log(`  Percentile: top ${result.percentile}%`);
  console.log(`  VC Comment: ${result.vcComment}`);

  // Check for evaluationDetails via direct DB fetch (result page)
  console.log("\n[Step 3] Fetching full result from result page...");
  const resultPageRes = await fetch(`${BASE_URL}/api/pitch/${sessionId}/result`);

  if (resultPageRes.ok) {
    const fullResult = await resultPageRes.json();

    if (fullResult.evaluationDetails) {
      const details = fullResult.evaluationDetails;

      console.log("\n" + "-".repeat(60));
      console.log("  DIMENSION BREAKDOWN");
      console.log("-".repeat(60));

      for (const d of details.breakdown) {
        const bar = "\u2588".repeat(Math.round(d.score / 5)) + "\u2591".repeat(20 - Math.round(d.score / 5));
        console.log(
          `\n  ${d.dimension} (weight: ${d.weight}%)`
        );
        console.log(`    Score: ${d.score}/100 [${bar}] (${d.confidence})`);
        console.log(`    ${d.comment}`);
      }

      console.log("\n" + "-".repeat(60));
      console.log("  HIGHLIGHTS");
      console.log("-".repeat(60));
      for (const h of details.highlights) {
        console.log(`  + ${h}`);
      }

      console.log("\n" + "-".repeat(60));
      console.log("  IMPROVEMENTS");
      console.log("-".repeat(60));
      for (const imp of details.improvements) {
        console.log(`  - ${imp}`);
      }
    } else {
      console.log("  (no evaluationDetails found — might be an older session)");
    }
  } else {
    console.log("  (result API not available, skipping details)");
  }

  console.log("\n" + "=".repeat(60));
  console.log("  TIMING");
  console.log("=".repeat(60));
  console.log(`  Question generation: ${questionTime}ms`);
  console.log(`  Multi-agent evaluation: ${evalTime}ms`);
  console.log(`  Total: ${totalTime}ms`);
  console.log(`\n  Result page: ${BASE_URL}/result/${sessionId}`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
