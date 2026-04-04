import { z } from "zod";
import {
  LocalCustomStationsSchema,
  LocalFavouriteIdsSchema,
  LocalGroupsSchema,
  LocalPlaylistsSchema,
} from "../storage/schemas";
import { SettingsSchema } from "../types/settings";

/** Current backup `format` string written on export (see `buildBackupFile` in backup-io). */
export const TAJDIN_BACKUP_FORMAT = "tajdin-backup" as const;
/**
 * Legacy JSON `format` value from older exports; still accepted on import.
 * (String intentionally contains `zeng` for backward compatibility.)
 */
export const LEGACY_ZENG_BACKUP_FORMAT = "zeng-backup" as const;
export const TAJDIN_BACKUP_VERSION = 1 as const;

const BackupFormatLiteral = z.union([
  z.literal(TAJDIN_BACKUP_FORMAT),
  z.literal(LEGACY_ZENG_BACKUP_FORMAT),
]);

export const TajdinBackupDataSchema = z
  .object({
    settings: SettingsSchema.optional(),
    playlists: LocalPlaylistsSchema.optional(),
    groups: LocalGroupsSchema.optional(),
    customStations: LocalCustomStationsSchema.optional(),
    favouriteIds: LocalFavouriteIdsSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.settings === undefined &&
      data.playlists === undefined &&
      data.groups === undefined &&
      data.customStations === undefined &&
      data.favouriteIds === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Backup must include at least one data section",
        path: [],
      });
    }
  });

export const TajdinBackupFileSchema = z.object({
  format: BackupFormatLiteral,
  version: z.literal(TAJDIN_BACKUP_VERSION),
  exportedAt: z.string(),
  data: TajdinBackupDataSchema,
});

export type TajdinBackupFile = z.infer<typeof TajdinBackupFileSchema>;
export type TajdinBackupData = z.infer<typeof TajdinBackupDataSchema>;
