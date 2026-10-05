import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { CategoryPerformanceResult } from "@/components/results/types";

type CategoryPerformanceCardProps = {
  categoryPerformance: CategoryPerformanceResult[];
};

export function CategoryPerformanceCard({
  categoryPerformance,
}: CategoryPerformanceCardProps) {
  return (
    <Card className="border border-white/10 bg-neutral-900/80 text-neutral-50 ring-0">
      <CardHeader className="px-6 py-5">
        <CardTitle className="text-lg text-white">
          Category Performance
        </CardTitle>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          {categoryPerformance.map((result) => (
            <div
              key={result.category}
              className="rounded-lg border border-white/10 bg-neutral-950/50 p-4"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <Badge
                  variant="outline"
                  className="border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                >
                  {result.category}
                </Badge>
                <span className="text-neutral-300">
                  {result.earnedPoints}/{result.totalPoints} pts /{" "}
                  {result.percentage}%
                </span>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                {result.correct}/{result.total} correct
              </p>
              <Progress
                value={result.percentage}
                className="mt-3 h-2 bg-neutral-800"
              />
            </div>
          ))}
        </div>
      </CardHeader>
    </Card>
  );
}
