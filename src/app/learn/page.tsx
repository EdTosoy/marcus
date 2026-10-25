import type { Metadata } from "next";
import { AdaptivePractice } from "@/components/adaptive-practice";
export const metadata: Metadata = { title: "Learning practice | Marcus" };
export default function LearnPage() {
  return <AdaptivePractice />;
}
