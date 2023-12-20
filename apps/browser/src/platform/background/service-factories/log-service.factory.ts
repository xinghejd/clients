import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { LogLevelType } from "@bitwarden/common/platform/enums/log-level-type.enum";
import { ConsoleLogService } from "@bitwarden/common/platform/services/console-log.service";
import { LoggingLifetimeService } from "@bitwarden/common/platform/services/logging-lifetime.service";

import { FactoryOptions, CachedServices, factory } from "./factory-options";

type LogServiceFactoryOptions = FactoryOptions & {
  logServiceOptions: {
    isDev: boolean;
    filter?: (level: LogLevelType) => boolean;
  };
};

export type LogServiceInitOptions = LogServiceFactoryOptions;

export function logServiceFactory(
  cache: { logService?: LogService } & CachedServices,
  opts: LogServiceInitOptions,
): Promise<LogService> {
  return factory(cache, "logService", opts, () => {
    const logService = new ConsoleLogService(
      opts.logServiceOptions.isDev,
      opts.logServiceOptions.filter,
    );
    cache.lifetimeServices ??= [];
    cache.lifetimeServices.push(new LoggingLifetimeService(logService));
    return logService;
  });
}
