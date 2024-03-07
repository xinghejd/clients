import {
  AssertCredentialParams,
  AssertCredentialResult,
  CreateCredentialParams,
  CreateCredentialResult,
} from "@bitwarden/common/vault/abstractions/fido2/fido2-client.service.abstraction";

type Fido2ExtensionMessage = {
  [key: string]: any;
  command: string;
  hostname?: string;
  origin?: string;
  requestId?: string;
  abortedRequestId?: string;
  data?: AssertCredentialParams | CreateCredentialParams;
};

type Fido2ExtensionMessageEventParams = {
  message: Fido2ExtensionMessage;
  sender: chrome.runtime.MessageSender;
};

type Fido2BackgroundExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  triggerFido2ContentScriptsInjection: ({
    message,
    sender,
  }: Fido2ExtensionMessageEventParams) => Promise<void>;
  fido2AbortRequest: ({ message }: Fido2ExtensionMessageEventParams) => void;
  fido2RegisterCredentialRequest: ({
    message,
    sender,
  }: Fido2ExtensionMessageEventParams) => Promise<CreateCredentialResult>;
  fido2GetCredentialRequest: ({
    message,
    sender,
  }: Fido2ExtensionMessageEventParams) => Promise<AssertCredentialResult>;
};

interface Fido2Background {
  init(): void;
  loadFido2ScriptsOnInstall(): Promise<void>;
}

export { Fido2ExtensionMessage, Fido2BackgroundExtensionMessageHandlers, Fido2Background };
