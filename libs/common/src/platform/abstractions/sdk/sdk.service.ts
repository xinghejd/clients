import { Observable } from "rxjs";

import { BitwardenClient } from "@bitwarden/sdk-client";

export abstract class SdkService {
  client$: Observable<BitwardenClient>;
}
