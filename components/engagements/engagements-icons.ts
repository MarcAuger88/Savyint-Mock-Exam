import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  CloudCog,
  Factory,
  GraduationCap,
  HeartPulse,
  KeyRound,
  Landmark,
  Network,
  Shirt,
  ShoppingBag,
  PlugZap,
} from "lucide-react";

export const engagementIcons = {
  Landmark,
  HeartPulse,
  KeyRound,
  BriefcaseBusiness,
  Factory,
  ClipboardCheck,
  Building2,
  CloudCog,
  Network,
  BadgeCheck,
  Shirt,
  GraduationCap,
  ShoppingBag,
  PlugZap,
};

export type EngagementIconName = keyof typeof engagementIcons;

export function isEngagementIconName(
  name: string | undefined,
): name is EngagementIconName {
  return Boolean(name && name in engagementIcons);
}
