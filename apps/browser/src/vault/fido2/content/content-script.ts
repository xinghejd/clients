import {
  AssertCredentialParams,
  CreateCredentialParams,
} from "@bitwarden/common/vault/abstractions/fido2/fido2-client.service.abstraction";

import { sendExtensionMessage } from "../../../autofill/utils";
import { Fido2Port } from "../enums/fido2-port.enum";

import {
  CredentialCreationRequest,
  CredentialGetRequest,
  Message,
  MessageType,
} from "./messaging/message";
import { MessageWithMetadata, Messenger } from "./messaging/messenger";

(function (globalContext) {
  if (globalContext.document.contentType !== "text/html") {
    return;
  }

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
          <CredentialCreationRequest & Metadata>(<unknown>message),
        );
      }

      if (message.type === MessageType.CredentialGetRequest) {
        return handleCredentialGetRequestMessage(
          requestId,
          <CredentialGetRequest & Metadata>(<unknown>message),
        );
      }
    } finally {
      abortController.signal.removeEventListener("abort", abortHandler);
    }

    return undefined;
  }

  async function handleCredentialCreationRequestMessage(
    requestId: string,
    message: CredentialCreationRequest & Metadata,
  ): Promise<Message | undefined> {
    const data: CreateCredentialParams = {
      ...message.data,
      origin: window.location.origin,
      sameOriginWithAncestors: isSameOriginWithAncestors(),
    };

    const registerCredentialResponse = await sendExtensionMessage(
      "fido2RegisterCredentialRequest",
      { data, requestId },
    );

    if (registerCredentialResponse && registerCredentialResponse.error !== undefined) {
      return Promise.reject(registerCredentialResponse.error);
    }

    return Promise.resolve({
      type: MessageType.CredentialCreationResponse,
      result: registerCredentialResponse,
    });
  }

  async function handleCredentialGetRequestMessage(
    requestId: string,
    message: CredentialGetRequest & Metadata,
  ): Promise<Message | undefined> {
    const data: AssertCredentialParams = {
      ...message.data,
      origin: window.location.origin,
      sameOriginWithAncestors: isSameOriginWithAncestors(),
    };

    const getCredentialResponse = await sendExtensionMessage("fido2GetCredentialRequest", {
      data,
      requestId,
    });

    if (getCredentialResponse && getCredentialResponse.error !== undefined) {
      return Promise.reject(getCredentialResponse.error);
    }

    return Promise.resolve({
      type: MessageType.CredentialGetResponse,
      result: getCredentialResponse,
    });
  }

  function isSameOriginWithAncestors() {
    try {
      return window.self === window.top;
    } catch {
      return false;
    }
  }

  // Cleanup the messenger and remove the event listener
  function handlePortOnDisconnect() {
    void messenger.destroy();
  }
})(globalThis);
