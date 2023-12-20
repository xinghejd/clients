import { Inject, Injectable } from "@angular/core";

import { ApplicationLifetimeService } from "@bitwarden/common/platform/abstractions/application-lifetime.service";
import { ApplicationLifetimeHandler } from "@bitwarden/common/platform/services/application-lifetime.handler";

@Injectable({ providedIn: "root" })
export class AngularApplicationLifetimeHandler extends ApplicationLifetimeHandler {
  constructor(
    @Inject(ApplicationLifetimeService) applicationLifetimeServices: ApplicationLifetimeService[],
  ) {
    super(applicationLifetimeServices);
  }
}
