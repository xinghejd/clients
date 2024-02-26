import { Observable } from "rxjs";
import { SemVer } from "semver";

import { FeatureFlag } from "../../../enums/feature-flag.enum";
import { Region } from "../environment.service";

import { ServerConfig } from "./server-config";

export abstract class ConfigServiceAbstraction {
  abstract serverConfig$: Observable<ServerConfig | null>;
  abstract cloudRegion$: Observable<Region>;
  abstract getFeatureFlag$<T extends boolean | number | string>(
    key: FeatureFlag,
    defaultValue?: T,
  ): Observable<T>;
  abstract getFeatureFlag<T extends boolean | number | string>(
    key: FeatureFlag,
    defaultValue?: T,
  ): Promise<T>;
  abstract checkServerMeetsVersionRequirement$(
    minimumRequiredServerVersion: SemVer,
  ): Observable<boolean>;

  /**
   * Force ConfigService to fetch an updated config from the server and emit it from serverConfig$
   * @deprecated The service implementation should subscribe to an observable and use that to trigger a new fetch from
   * server instead
   */
  abstract triggerServerConfigFetch(): void;
}
