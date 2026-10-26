import { CategoryTiles } from "@/components/home/CategoryTiles";
import { Chapters } from "@/components/home/Chapters";
import { FilmBand } from "@/components/home/FilmBand";
import { JournalTeaser } from "@/components/home/JournalTeaser";
import { StageHero } from "@/components/home/StageHero";

export default function HomePage() {
  return (
    <>
      <StageHero />
      <Chapters />
      <CategoryTiles />
      <FilmBand />
      <JournalTeaser />
    </>
  );
}
