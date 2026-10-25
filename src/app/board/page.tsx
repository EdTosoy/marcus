import type { Metadata } from "next";
import { PracticeBoard } from "@/components/practice-board";
export const metadata: Metadata = { title: "Practice board | Marcus" };
export default function BoardPage() {
  return <PracticeBoard />;
}
