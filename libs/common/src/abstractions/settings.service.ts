import { Observable } from "rxjs";

import { AccountSettingsSettings } from "../platform/models/domain/account";

export abstract class SettingsService {
  abstract settings$: Observable<AccountSettingsSettings>;
  abstract disableFavicon$: Observable<boolean>;

  abstract setEquivalentDomains(equivalentDomains: string[][]): Promise<any>;
  abstract getEquivalentDomains(url: string): Set<string>;
  abstract setDisableFavicon(value: boolean): Promise<any>;
  abstract getDisableFavicon(): boolean;
  abstract clear(userId?: string): Promise<void>;
}
