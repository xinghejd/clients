import { EMPTY, Subscription } from "rxjs";

import { ApplicationLifetimeService } from "../abstractions/application-lifetime.service";
import { LogService } from "../abstractions/log.service";

export class LoggingLifetimeService implements ApplicationLifetimeService {
  constructor(private logService: LogService) {}

  onStart(): Subscription {
    this.logService.info("[LoggingLifetimeService]: onStart");
    return EMPTY.subscribe();
  }
}
