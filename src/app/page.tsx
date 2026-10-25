import { LessonPlayer } from "@/components/lesson-player";
import { pieceSafetyLesson } from "@/domain/curriculum/piece-safety";
export default function Home() {
  return <LessonPlayer lesson={pieceSafetyLesson} />;
}
