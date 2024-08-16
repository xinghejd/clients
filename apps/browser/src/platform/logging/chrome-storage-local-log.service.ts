import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { LogLevelType } from "@bitwarden/common/platform/enums";

type SelfAttachments = { minLevel: LogLevelType; printLogs: () => void };

// NOT MEANT FOR PRODUCTION USE
export class ChromeStorageLocalLogService implements LogService {
  constructor() {
    (self as unknown as SelfAttachments).printLogs = () => {
      chrome.storage.local.get(null, (storage) => {
        if (chrome.runtime.lastError) {
          // eslint-disable-next-line no-console
          console.error("Error while retrieving all storage values for printing logs.");
          return;
        }

        Object.entries(storage ?? {})
          .filter(([key]) => key.startsWith("logging_"))
          .forEach(([key, value]) => {
            // eslint-disable-next-line no-console
            console.log(`${key}: ${value}`);
          });
      });
    };

    (self as unknown as SelfAttachments).minLevel = LogLevelType.Warning;
  }

  debug(message?: any, ...optionalParams: any[]): void {
    this.write(LogLevelType.Debug, message, optionalParams);
  }
  info(message?: any, ...optionalParams: any[]): void {
    this.write(LogLevelType.Info, message, optionalParams);
  }
  warning(message?: any, ...optionalParams: any[]): void {
    this.write(LogLevelType.Warning, message, optionalParams);
  }
  error(message?: any, ...optionalParams: any[]): void {
    this.write(LogLevelType.Error, message, optionalParams);
  }
  write(level: LogLevelType, message?: any, ...optionalParams: any[]): void {
    const now = new Date();

    const minLevel = (self as unknown as SelfAttachments).minLevel;

    if (level >= minLevel) {
      chrome.storage.local.set(
        {
          [`logging_${level}_${now.getTime()}`]: `Message: ${JSON.stringify(message)}: Args: ${JSON.stringify(optionalParams)}`,
        },
        () => {
          if (chrome.runtime.lastError) {
            // eslint-disable-next-line no-console
            console.error(`Error while saving ${message} to storage.`);
          }
        },
      );
    }
  }
}
