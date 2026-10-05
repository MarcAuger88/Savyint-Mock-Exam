export type AcademyTrack = {
  id: string;
  title: string;
  description: string;
  packIds: string[];
};

// Ordered learning paths through the academy pack catalog. Packs are matched
// up by id against data/academy-bank.json — add a pack's id here to slot it
// into a track; packs left out show up in an auto-generated "More Topics"
// bucket (see academyTrackViews in academy-data.ts) instead of disappearing.
export const academyTracks: AcademyTrack[] = [
  {
    id: "core-foundations",
    title: "Core Foundations",
    description:
      "The essential Saviynt IGA lifecycle — identity import, correlation, roles, requests, provisioning, and governance.",
    packIds: [
      "ACA-001",
      "ACA-002",
      "ACA-003",
      "ACA-004",
      "ACA-005",
      "ACA-006",
      "ACA-007",
      "ACA-008",
      "ACA-009",
      "ACA-010",
      "ACA-011",
      "ACA-012",
      "ACA-013",
      "ACA-014",
      "ACA-015",
      "ACA-016",
    ],
  },
  {
    id: "identity-administration",
    title: "Identity Administration",
    description:
      "Go deeper on identity risk, access models, and role design once the fundamentals are solid.",
    packIds: ["ACA-017", "ACA-018", "ACA-019", "ACA-020"],
  },
  {
    id: "connectors",
    title: "Connector Track",
    description:
      "Hands-on connector configuration across the systems Saviynt integrates with most.",
    packIds: ["ACA-021", "ACA-022", "ACA-023", "ACA-024", "ACA-025"],
  },
  {
    id: "governance",
    title: "Governance Track",
    description:
      "Advanced governance controls — segregation of duties, risk scoring, certifications, and break-glass access.",
    packIds: ["ACA-026", "ACA-027", "ACA-028", "ACA-029", "ACA-030"],
  },
];
