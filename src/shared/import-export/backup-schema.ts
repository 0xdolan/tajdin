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
/** Legacy label from pre–Tajdîn exports; still accepted on import. */
export const ZENG_BACKUP_FORMAT = "zeng-backup" as const;
export const TAJDIN_BACKUP_VERSION = 1 as const;
/** @deprecated Use {@link TAJDIN_BACKUP_VERSION}. */
export const ZENG_BACKUP_VERSION = TAJDIN_BACKUP_VERSION;

const BackupFormatLiteral = z.union([
  z.literal(TAJDIN_BACKUP_FORMAT),
  z.literal(ZENG_BACKUP_FORMAT),
]);

export const ZengBackupDataSchema = z
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

export const ZengBackupFileSchema = z.object({
  format: BackupFormatLiteral,
  version: z.literal(TAJDIN_BACKUP_VERSION),
  exportedAt: z.string(),
  data: ZengBackupDataSchema,
});

export type ZengBackupFile = z.infer<typeof ZengBackupFileSchema>;
export type ZengBackupData = z.infer<typeof ZengBackupDataSchema>;
