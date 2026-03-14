import type { AppContent, StaticStudyItemDefinition, TrackId } from "../types";
import { hldContent } from "./hld";
import { leetcodeContent } from "./leetcode";
import { lldContent } from "./lld";

export const TRACK_CONTENT: AppContent = {
  leetcode: leetcodeContent,
  hld: hldContent,
  lld: lldContent,
};

export interface BundledItemRef {
  trackId: TrackId;
  trackLabel: string;
  groupId: string;
  groupTitle: string;
  item: StaticStudyItemDefinition;
}

export function getAllBundledItems(content: AppContent = TRACK_CONTENT): BundledItemRef[] {
  return (Object.keys(content) as TrackId[]).flatMap((trackId) =>
    content[trackId].groups.flatMap((group) =>
      group.items.map((item) => ({
        trackId,
        trackLabel: content[trackId].label,
        groupId: group.id,
        groupTitle: group.title,
        item,
      })),
    ),
  );
}
