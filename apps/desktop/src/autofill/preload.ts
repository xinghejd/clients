import { ipcRenderer } from "electron";

import type { autofill } from "@bitwarden/desktop-napi";

import { Command } from "../platform/main/autofill/command";
import { RunCommandParams, RunCommandResult } from "../platform/main/autofill/native-autofill.main";

export default {
  runCommand: <C extends Command>(params: RunCommandParams<C>): Promise<RunCommandResult<C>> =>
    ipcRenderer.invoke("autofill.runCommand", params),

  listenPasskeyRegistration: (
    fn: (
      request: autofill.PasskeyRegistrationMessage,
      completeCallback: (response: autofill.PasskeyRegistrationResponse) => void,
    ) => void,
  ) => {
    ipcRenderer.on(
      "autofill.passkeyRegistration",
      (event, request: autofill.PasskeyRegistrationMessage) => {
        fn(request, (response) => {
          ipcRenderer.send("autofill.completePasskeyRegistration", { request, response });
        });
      },
    );
  },

  listenPasskeyAssertion: (
    fn: (
      request: autofill.PasskeyAssertionMessage,
      completeCallback: (response: autofill.PasskeyAssertionResponse) => void,
    ) => void,
  ) => {
    ipcRenderer.on(
      "autofill.passkeyAssertion",
      (event, request: autofill.PasskeyAssertionMessage) => {
        fn(request, (response) => {
          ipcRenderer.send("autofill.completePasskeyAssertion", { request, response });
        });
      },
    );
  },
};
