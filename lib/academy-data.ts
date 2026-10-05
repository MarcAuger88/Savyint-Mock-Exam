import rawAcademyBank from "@/data/academy-bank.json";
import { academyTracks, type AcademyTrack } from "@/lib/academy-tracks";

const difficultyAliases: Record<string, string> = {
  foundation: "easy",
  beginner: "easy",
  intermediate: "medium",
  advanced: "hard",
};

function normalizeDifficulty(value: string): string {
  return difficultyAliases[value.toLowerCase()] ?? value.toLowerCase();
}

export type AcademyPack = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  estimatedMinutes?: number;
  description?: string;
  learningObjectives?: string[];
  questions: unknown[];
};

function normalizeBank(value: unknown): AcademyPack[] {
  return Array.isArray(value)
    ? (value as AcademyPack[])
    : [value as AcademyPack];
}

export const academyPacks = normalizeBank(rawAcademyBank);

export type AcademyPackSummary = {
  category: string;
  packId: string;
  title: string;
  difficulty: string;
  estimatedMinutes?: number;
  questionCount: number;
};

export const academyCategories: AcademyPackSummary[] = academyPacks.map((p) => ({
  category: p.category,
  packId: p.id,
  title: p.title,
  difficulty: normalizeDifficulty(p.difficulty),
  estimatedMinutes: p.estimatedMinutes,
  questionCount: p.questions.length,
}));

const packById = new Map(academyCategories.map((p) => [p.packId, p]));

export type AcademyTrackView = AcademyTrack & { packs: AcademyPackSummary[] };

export const academyTrackViews: AcademyTrackView[] = academyTracks.map((track) => ({
  ...track,
  packs: track.packIds
    .map((packId) => packById.get(packId))
    .filter((pack): pack is AcademyPackSummary => Boolean(pack)),
}));

const trackedPackIds = new Set(academyTracks.flatMap((track) => track.packIds));
const untrackedPacks = academyCategories.filter((p) => !trackedPackIds.has(p.packId));

if (untrackedPacks.length > 0) {
  academyTrackViews.push({
    id: "more-topics",
    title: "More Topics",
    description: "Additional packs not yet assigned to a learning path.",
    packIds: untrackedPacks.map((p) => p.packId),
    packs: untrackedPacks,
  });
}

/** First pack, in track order, whose id isn't in `completedPackIds` and passes `isPackAvailable`. */
export function getNextRecommendedPack(
  completedPackIds: ReadonlySet<string>,
  isPackAvailable: (pack: AcademyPackSummary) => boolean = () => true,
): { track: AcademyTrackView; pack: AcademyPackSummary } | null {
  for (const track of academyTrackViews) {
    for (const pack of track.packs) {
      if (!completedPackIds.has(pack.packId) && isPackAvailable(pack)) {
        return { track, pack };
      }
    }
  }
  return null;
}
