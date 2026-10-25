import type { Metadata } from "next";
import { AdaptivePractice } from "@/components/adaptive-practice";
export const metadata: Metadata = { title: "Learning practice | Marcus" };
export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ practice?: string }>;
}) {
  const { practice } = await searchParams;
  return <AdaptivePractice requestedExerciseId={practice} />;
}
