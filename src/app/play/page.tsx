import type { Metadata } from "next";
import { PlayGame } from "@/components/play-game";
export const metadata: Metadata = { title: "Play | Marcus" };
export default function PlayPage() {
  return <PlayGame />;
}
