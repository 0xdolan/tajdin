import { z } from "zod";
import {
  LocalCustomStationsSchema,
  LocalFavouriteIdsSchema,
  LocalGroupsSchema,
  LocalPlaylistsSchema,
} from "../storage/schemas";
import { SettingsSchema } from "../types/settings";

export const ZENG_BACKUP_FORMAT = "zeng-backup" as const;
export const ZENG_BACKUP_VERSION = 1 as const;

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
  format: z.literal(ZENG_BACKUP_FORMAT),
  version: z.literal(ZENG_BACKUP_VERSION),
  exportedAt: z.string(),
  data: ZengBackupDataSchema,
});

export type ZengBackupFile = z.infer<typeof ZengBackupFileSchema>;
export type ZengBackupData = z.infer<typeof ZengBackupDataSchema>;
