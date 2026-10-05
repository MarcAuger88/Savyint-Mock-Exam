import { HelpCircle } from "lucide-react";
import { engagementIcons, isEngagementIconName } from "./engagements-icons";

type EngagementIconProps = {
  name?: string;
  className?: string;
};

export function EngagementIcon({
  name,
  className = "h-10 w-10 text-blue-300",
}: EngagementIconProps) {
  const Icon = isEngagementIconName(name) ? engagementIcons[name] : undefined;
  const ResolvedIcon = Icon ?? HelpCircle;

  return (
    <ResolvedIcon className={className} strokeWidth={1.75} aria-hidden="true" />
  );
}
