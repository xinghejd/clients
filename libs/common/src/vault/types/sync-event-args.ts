import { ErrorResponse } from "../../models/response/error.response";
import { SyncResponse } from "../models/response/sync.response";

type SyncStatus = "Started" | "Completed";

/**
 * The reason why a sync completed unsuccessfully
 * - `error`: an un-expected error occurred during the sync
 * - `unneeded`: the sync was not needed due to the vault being up-to-date
 * - `not-authenticated`: the user was not authenticated
 */
type SyncFailedReason = "error" | "unneeded" | "not-authenticated";

type SyncEventArgsBase<T extends SyncStatus> = {
  status: T;
};

type SyncCompletedEventArgsBase<T extends boolean> = SyncEventArgsBase<"Completed"> & {
  successfully: T;
};

type SyncSuccessfullyCompletedEventArgs = SyncCompletedEventArgsBase<true> & {
  data: SyncResponse;
};

type SyncUnsuccessfullyCompletedEventArgsBase<T extends SyncFailedReason> =
  SyncCompletedEventArgsBase<false> & {
    reason: T;
  };

export type SyncError = Error | ErrorResponse;

type SyncErrorEventArgs = SyncUnsuccessfullyCompletedEventArgsBase<"error"> & {
  /**
   * Error that caused the sync to complete unsuccessfully
   */
  error: SyncError;
};

type SyncUnsuccessfullyCompletedEventArgs =
  | SyncUnsuccessfullyCompletedEventArgsBase<"unneeded">
  | SyncUnsuccessfullyCompletedEventArgsBase<"not-authenticated">
  | SyncErrorEventArgs;

export type SyncEventArgs =
  | SyncSuccessfullyCompletedEventArgs
  | SyncUnsuccessfullyCompletedEventArgs
  | SyncEventArgsBase<"Started">;

/**
 * Helper function to filter only on successfully completed syncs
 * @returns a function that can be used in a `.pipe(filter(...))` from an observable
 * @example
 * ```
 * of<SyncEventArgs>({ status: "Completed", successfully: true, data: new SyncResponse() })
 *  .pipe(filter(isSuccessfullyCompleted))
 *  .subscribe(event => {
 *    console.log(event.data);
 *  });
 * ```
 */
export function isSuccessfullyCompleted(
  syncEvent: SyncEventArgs,
): syncEvent is SyncSuccessfullyCompletedEventArgs {
  return syncEvent.status === "Completed" && syncEvent.successfully;
}

/**
 * Helper function to filter only on completed syncs
 * @returns a function that can be used in a `.pipe(filter(...))` from an observable
 * @example
 * ```
 * of<SyncEventArgs>({ status: "Completed", successfully: true, data: new SyncResponse() })
 *  .pipe(filter(isCompleted))
 *  .subscribe(event => {
 *    console.log(event.successfully);
 *  });
 * ```
 */
export function isCompleted(
  syncEvent: SyncEventArgs,
): syncEvent is SyncSuccessfullyCompletedEventArgs | SyncUnsuccessfullyCompletedEventArgs {
  return syncEvent.status === "Completed";
}
