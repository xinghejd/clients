import {
  AssertCredentialParams,
  CreateCredentialParams,
} from "@bitwarden/common/vault/abstractions/fido2/fido2-client.service.abstraction";

import { sendExtensionMessage } from "../../../autofill/utils";
import { Fido2Port } from "../enums/fido2-port.enum";

import {
  InsecureAssertCredentialParams,
  InsecureCreateCredentialParams,
  Message,
  MessageType,
} from "./messaging/message";
import { MessageWithMetadata, Messenger } from "./messaging/messenger";

(function (globalContext) {
  const messenger = Messenger.forDOMCommunication(window);
  messenger.handler = handleFido2Message;

  const port = chrome.runtime.connect({ name: Fido2Port.InjectedScript });
  port.onDisconnect.addListener(handlePortOnDisconnect);

  async function handleFido2Message(
    message: MessageWithMetadata,
    abortController: AbortController,
  ) {
    const requestId = Date.now().toString();
    const abortHandler = () =>
      chrome.runtime.sendMessage({
        command: "fido2AbortRequest",
        abortedRequestId: requestId,
      });
    abortController.signal.addEventListener("abort", abortHandler);

    try {
      if (message.type === MessageType.CredentialCreationRequest) {
        return handleCredentialCreationRequestMessage(
          requestId,
          message.data as InsecureCreateCredentialParams,
        );
      }

      if (message.type === MessageType.CredentialGetRequest) {
        return handleCredentialGetRequestMessage(
          requestId,
          message.data as InsecureAssertCredentialParams,
        );
      }
    } finally {
      abortController.signal.removeEventListener("abort", abortHandler);
    }

    return undefined;
  }

  async function handleCredentialCreationRequestMessage(
    requestId: string,
    data: InsecureCreateCredentialParams,
  ): Promise<Message | undefined> {
    return respondToCredentialRequest(
      "fido2RegisterCredentialRequest",
      MessageType.CredentialCreationResponse,
      requestId,
      data,
    );
  }

  async function handleCredentialGetRequestMessage(
    requestId: string,
    data: InsecureAssertCredentialParams,
  ): Promise<Message | undefined> {
    return respondToCredentialRequest(
      "fido2GetCredentialRequest",
      MessageType.CredentialGetResponse,
      requestId,
      data,
    );
  }

  async function respondToCredentialRequest(
    command: string,
    type: MessageType.CredentialCreationResponse | MessageType.CredentialGetResponse,
    requestId: string,
    messageData: InsecureCreateCredentialParams | InsecureAssertCredentialParams,
  ): Promise<Message | undefined> {
    const data: CreateCredentialParams | AssertCredentialParams = {
      ...messageData,
      origin: globalContext.location.origin,
      sameOriginWithAncestors: isSameOriginWithAncestors(),
    };

    const result = await sendExtensionMessage(command, { data, requestId });

    if (result && result.error !== undefined) {
      return Promise.reject(result.error);
    }

    return Promise.resolve({ type, result });
  }

  function isSameOriginWithAncestors() {
    try {
      return globalContext.self === globalContext.top;
    } catch {
      return false;
    }
  }

  // Cleanup the messenger and remove the event listener
  function handlePortOnDisconnect() {
    void messenger.destroy();
  }
})(globalThis);
