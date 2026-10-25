import type { Metadata } from "next";
import { LearningEvaluation } from "@/components/learning-evaluation";
export const metadata: Metadata = { title: "Local learning evidence | Marcus" };
export default function EvaluationPage() {
  return <LearningEvaluation />;
}
