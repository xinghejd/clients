import { Observable } from "rxjs";

import { SyncEventArgs } from "../../types/sync-event-args";

export abstract class SyncNotifierService {
  abstract sync$: Observable<SyncEventArgs>;
  abstract next(event: SyncEventArgs): void;
}
