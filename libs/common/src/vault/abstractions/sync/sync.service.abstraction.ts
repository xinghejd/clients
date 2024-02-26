import { Observable } from "rxjs";

import {
  SyncCipherNotification,
  SyncFolderNotification,
  SyncSendNotification,
} from "../../../models/response/notification.response";
import { UserId } from "../../../types/guid";

export abstract class SyncService {
  abstract syncInProgress: boolean;
  abstract lastSync$: Observable<Date | null>;

  abstract getLastSync(): Promise<Date>;
  abstract setLastSync(date: Date, userId?: UserId): Promise<any>;
  abstract fullSync(forceSync: boolean, allowThrowOnError?: boolean): Promise<boolean>;
  abstract syncUpsertFolder(
    notification: SyncFolderNotification,
    isEdit: boolean,
  ): Promise<boolean>;
  abstract syncDeleteFolder(notification: SyncFolderNotification): Promise<boolean>;
  abstract syncUpsertCipher(
    notification: SyncCipherNotification,
    isEdit: boolean,
  ): Promise<boolean>;
  abstract syncDeleteCipher(notification: SyncFolderNotification): Promise<boolean>;
  abstract syncUpsertSend(notification: SyncSendNotification, isEdit: boolean): Promise<boolean>;
  abstract syncDeleteSend(notification: SyncSendNotification): Promise<boolean>;
}
