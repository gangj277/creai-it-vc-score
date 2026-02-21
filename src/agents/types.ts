export type VerdictKey = "UNICORN" | "SEED" | "HOLD" | "COME_BACK";

export interface QuestionItem {
  id: number;
  question: string;
  hint: string;
  options: string[];
}

/* ---------- Specialist Agent ---------- */

export type ConfidenceLevel = "high" | "medium" | "low";

export type DimensionKey = "market" | "solution" | "execution" | "competitive" | "growth";

export interface SpecialistResult {
  score: number;
  confidence: ConfidenceLevel;
  comment: string;
}

export interface DimensionScore {
  key: DimensionKey;
  dimension: string;
  score: number;
  weight: number;
  confidence: ConfidenceLevel;
  comment: string;
}

/* ---------- Synthesizer Agent ---------- */

export interface SynthesizerResult {
  vcComment: string;
  percentile: number;
  highlights: string[];
  improvements: string[];
}

/* ---------- Final Evaluation Result ---------- */

export interface EvaluationDetails {
  breakdown: DimensionScore[];
  highlights: string[];
  improvements: string[];
}

export interface VCEvaluationResult {
  score: number;
  verdict: VerdictKey;
  vcComment: string;
  percentile: number;
  evaluationDetails: EvaluationDetails;
}
