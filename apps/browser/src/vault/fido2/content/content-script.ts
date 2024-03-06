import {
  AssertCredentialParams,
  CreateCredentialParams,
} from "@bitwarden/common/vault/abstractions/fido2/fido2-client.service.abstraction";

import { sendExtensionMessage } from "../../../autofill/utils";
import { Fido2Port } from "../enums/fido2-port.enum";

import { Message, MessageType } from "./messaging/message";
import { Messenger } from "./messaging/messenger";

function isSameOriginWithAncestors() {
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
}
const messenger = Messenger.forDOMCommunication(window);

function initializeFido2ContentScript() {
  void sendExtensionMessage("triggerFido2PageScriptInjection");

  messenger.handler = async (message, abortController) => {
    const requestId = Date.now().toString();
    const abortHandler = () =>
      chrome.runtime.sendMessage({
        command: "fido2AbortRequest",
        abortedRequestId: requestId,
      });
    abortController.signal.addEventListener("abort", abortHandler);

    if (message.type === MessageType.CredentialCreationRequest) {
      return new Promise<Message | undefined>((resolve, reject) => {
        const data: CreateCredentialParams = {
          ...message.data,
          origin: window.location.origin,
          sameOriginWithAncestors: isSameOriginWithAncestors(),
        };

        chrome.runtime.sendMessage(
          {
            command: "fido2RegisterCredentialRequest",
            data,
            requestId: requestId,
          },
          (response) => {
            if (response && response.error !== undefined) {
              return reject(response.error);
            }

            resolve({
              type: MessageType.CredentialCreationResponse,
              result: response,
            });
          },
        );
      });
    }

    if (message.type === MessageType.CredentialGetRequest) {
      return new Promise<Message | undefined>((resolve, reject) => {
        const data: AssertCredentialParams = {
          ...message.data,
          origin: window.location.origin,
          sameOriginWithAncestors: isSameOriginWithAncestors(),
        };

        chrome.runtime.sendMessage(
          {
            command: "fido2GetCredentialRequest",
            data,
            requestId: requestId,
          },
          (response) => {
            if (response && response.error !== undefined) {
              return reject(response.error);
            }

            resolve({
              type: MessageType.CredentialGetResponse,
              result: response,
            });
          },
        );
      }).finally(() =>
        abortController.signal.removeEventListener("abort", abortHandler),
      ) as Promise<Message>;
    }

    return undefined;
  };
}

async function run() {
  initializeFido2ContentScript();

  const port = chrome.runtime.connect({ name: Fido2Port.InjectedScript });
  port.onDisconnect.addListener(() => {
    // Cleanup the messenger and remove the event listener
    void messenger.destroy();
  });
}

// Only run the script if the document is an HTML document
if (document.contentType === "text/html") {
  void run();
}
