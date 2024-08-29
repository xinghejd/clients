import { ipcMain } from "electron";

import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
//import { Utils } from "@bitwarden/common/platform/misc/utils";
import { autofill } from "@bitwarden/desktop-napi";

import { WindowMain } from "../../../main/window.main";

import { CommandDefinition } from "./command";

export type RunCommandParams<C extends CommandDefinition> = {
  command: C["name"];
  params: C["input"];
};

export type RunCommandResult<C extends CommandDefinition> = C["output"];

export class NativeAutofillMain {
  private ipcServer: autofill.IpcServer | null;

  constructor(
    private logService: LogService,
    private windowMain: WindowMain,
  ) {}

  async init() {
    ipcMain.handle(
      "autofill.runCommand",
      <C extends CommandDefinition>(
        _event: any,
        params: RunCommandParams<C>,
      ): Promise<RunCommandResult<C>> => {
        return this.runCommand(params);
      },
    );

    this.ipcServer = await autofill.IpcServer.listen(
      "autofill",
      (error: Error | null, data: autofill.PasskeyRegistrationMessage) => {
        if (error) {
          this.logService.error("ERROR autofill.IpcServer.registration", error);
          return;
        }
        this.windowMain.win.webContents.send("autofill.passkeyRegistration", data);
      },

      (error: Error | null, data: autofill.PasskeyAssertionMessage) => {
        if (error) {
          this.logService.error("ERROR autofill.IpcServer.assertion", error);
          return;
        }
        this.windowMain.win.webContents.send("autofill.passkeyAssertion", data);
      },
    );

    ipcMain.on("autofill.completePasskeyRegistration", (event, data) => {
      this.logService.warning("autofill.completePasskeyRegistration", data);
      const { request, response } = data;
      this.ipcServer.completeRegistration(request, response);
    });

    ipcMain.on("autofill.completePasskeyAssertion", (event, data) => {
      this.logService.warning("autofill.completePasskeyAssertion", data);
      const { request, response } = data;
      this.ipcServer.completeAssertion(request, response);
    });
  }

  private async runCommand<C extends CommandDefinition>(
    command: RunCommandParams<C>,
  ): Promise<RunCommandResult<C>> {
    try {
      const result = await autofill.runCommand(JSON.stringify(command));
      const parsed = JSON.parse(result) as RunCommandResult<C>;

      if (parsed.type === "error") {
        this.logService.error(`Error running autofill command '${command.command}':`, parsed.error);
      }

      return parsed;
    } catch (e) {
      this.logService.error(`Error running autofill command '${command.command}':`, e);

      if (e instanceof Error) {
        return { type: "error", error: e.stack ?? String(e) } as RunCommandResult<C>;
      }

      return { type: "error", error: String(e) } as RunCommandResult<C>;
    }
  }
}
