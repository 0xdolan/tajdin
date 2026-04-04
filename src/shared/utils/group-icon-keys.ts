/**
 * Allowed {@link import("../types/group").Group.iconKey} values (Heroicons-style ids for UI).
 */
export const GROUP_ICON_KEYS = [
  "folder",
  "musical-note",
  "radio",
  "globe-alt",
  "heart",
  "star",
  "tag",
  "users",
] as const;

export type GroupIconKey = (typeof GROUP_ICON_KEYS)[number];

export const DEFAULT_GROUP_ICON_KEY: GroupIconKey = "folder";

export function isValidGroupIconKey(key: string): key is GroupIconKey {
  return (GROUP_ICON_KEYS as readonly string[]).includes(key);
}

export function groupIconLabel(key: GroupIconKey): string {
  const labels: Record<GroupIconKey, string> = {
    folder: "Folder",
    "musical-note": "Musical note",
    radio: "Radio",
    "globe-alt": "Globe",
    heart: "Heart",
    star: "Star",
    tag: "Tag",
    users: "Users",
  };
  return labels[key];
}
