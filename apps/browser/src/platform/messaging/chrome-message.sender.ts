import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { CommandDefinition, MessageSender } from "@bitwarden/common/platform/messaging";
import { getCommand } from "@bitwarden/common/platform/messaging/internal";

export class ChromeMessageSender implements MessageSender {
  constructor(private readonly logService: LogService) {}

  send<T extends object>(
    commandDefinition: string | CommandDefinition<T>,
    payload: object | T = {},
  ): void {
    const command = getCommand(commandDefinition);
    chrome.runtime.sendMessage(Object.assign(payload, { command: command }), () => {
      if (chrome.runtime.lastError) {
        if (
          chrome.runtime.lastError.message ===
          "Could not establish connection. Receiving end does not exist."
        ) {
          this.logService.debug(`Receiving end didn't exist for command '${command}'`);
        } else {
          this.logService.warning(
            `Error while sending message with command '${command}': ${chrome.runtime.lastError.message}`,
          );
        }
      }
    });
  }
}
