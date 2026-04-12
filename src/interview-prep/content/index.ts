import type { AppContent, StaticStudyItemDefinition, StaticTopicGroupDefinition, TrackId } from "../types";
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
  itemHref: string | null;
  item: StaticStudyItemDefinition;
}

export function getStudyItemHref(trackId: TrackId, group: StaticTopicGroupDefinition, item: StaticStudyItemDefinition): string | null {
  if (trackId === "leetcode") {
    return `https://awzhenyi.github.io/leetcode/neetcode150/${encodeURIComponent(group.linkTitle ?? group.title)}/${encodeURIComponent(
      item.linkTitle ?? item.title,
    )}/`;
  }

  if (trackId === "hld") {
    const section = item.linkSection ?? group.linkSection;
    if (!section) return null;
    return `https://www.hellointerview.com/learn/system-design/${section}/${item.linkId ?? item.id}`;
  }

  if (trackId === "lld") {
    const section = item.linkSection ?? group.linkSection;
    if (!section) return null;
    return `https://www.hellointerview.com/learn/low-level-design/${section}/${item.linkId ?? item.id}`;
  }

  return null;
}

export function getAllBundledItems(content: AppContent = TRACK_CONTENT): BundledItemRef[] {
  return (Object.keys(content) as TrackId[]).flatMap((trackId) =>
    content[trackId].groups.flatMap((group) =>
      group.items.map((item) => ({
        trackId,
        trackLabel: content[trackId].label,
        groupId: group.id,
        groupTitle: group.title,
        itemHref: getStudyItemHref(trackId, group, item),
        item,
      })),
    ),
  );
}
