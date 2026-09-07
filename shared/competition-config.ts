/** Homepage featured slider slots (admin Featured slider page). */
export const FEATURED_SLOT_COUNT = 5;

type CompetitionVisibility = {
  isActive?: boolean | null;
  status?: string | null;
};

/** Live on the public site and operational admin tools. */
export function isCompetitionLive(competition: CompetitionVisibility) {
  return competition.isActive === true && (competition.status ?? "active") === "active";
}

/** Archived or otherwise hidden from public listings. */
export function isCompetitionArchived(competition: CompetitionVisibility) {
  if (competition.status === "archived") return true;
  return competition.isActive === false;
}
