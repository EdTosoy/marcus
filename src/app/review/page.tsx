import type { Metadata } from "next";
import { GameReview } from "@/components/game-review";
export const metadata: Metadata = { title: "Game review | Marcus" };
export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const { game } = await searchParams;
  return <GameReview gameId={game} />;
}
