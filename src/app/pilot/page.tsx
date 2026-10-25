import type { Metadata } from "next";
import { PilotGuide } from "@/components/pilot-guide";
export const metadata: Metadata = { title: "Pilot guide | Quiet Chess" };
export default function PilotPage() {
  return <PilotGuide />;
}
