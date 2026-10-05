import { Progress } from "@/components/ui/progress";

type ExamProgressProps = {
  completedQuestions: number;
  totalQuestions: number;
};

export function ExamProgress({
  completedQuestions,
  totalQuestions,
}: ExamProgressProps) {
  const value = (completedQuestions / totalQuestions) * 100;

  return (
    <div className="border-t border-white/10 bg-neutral-900/50 px-4 py-3">
      <Progress
        value={value}
        aria-label={`Answered ${completedQuestions} of ${totalQuestions}`}
        className="h-2 bg-neutral-800 [&_[data-slot=progress-indicator]]:bg-blue-500"
      />
    </div>
  );
}
