import { Message, MessageType } from "./messaging/message";
import { Messenger } from "./messaging/messenger";

function isFido2FeatureEnabled(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { command: "checkFido2FeatureEnabled" },
      (response: { result?: boolean }) => resolve(response.result)
    );
  });
}

async function getFromLocalStorage(keys: string | string[]): Promise<Record<string, any>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (storage: Record<string, any>) => resolve(storage));
  });
}

async function isDomainExcluded() {
  // TODO: This is code copied from `notification-bar.tsx`. We should refactor this into a shared function.
  // Look up the active user id from storage
  const activeUserIdKey = "activeUserId";
  let activeUserId: string;

  const activeUserStorageValue = await getFromLocalStorage(activeUserIdKey);
  if (activeUserStorageValue[activeUserIdKey]) {
    activeUserId = activeUserStorageValue[activeUserIdKey];
  }

  // Look up the user's settings from storage
  const userSettingsStorageValue = await getFromLocalStorage(activeUserId);

  const excludedDomains = userSettingsStorageValue[activeUserId]?.settings?.neverDomains;
  return excludedDomains && window.location.hostname in excludedDomains;
}

async function hasActiveUser() {
  const activeUserIdKey = "activeUserId";
  const activeUserStorageValue = await getFromLocalStorage(activeUserIdKey);
  return activeUserStorageValue[activeUserIdKey] !== undefined;
}

const messenger = Messenger.forDOMCommunication(window);

function injectPageScript() {
  // Locate an existing page-script on the page
  const existingPageScript = document.getElementById("bw-fido2-page-script");

  // Inject the page-script if it doesn't exist
  if (!existingPageScript) {
    const s = document.createElement("script");
    s.src = chrome.runtime.getURL("content/fido2/page-script.js");
    s.id = "bw-fido2-page-script";
    (document.head || document.documentElement).appendChild(s);
  } else {
    // If the page-script already exists, send a reconnect message to the page-script
    messenger.sendReconnectCommand();
  }
}

function initializeFido2ContentScript() {
  injectPageScript();

  messenger.handler = async (message, abortController) => {
    const requestId = Date.now().toString();
    const abortHandler = () =>
      chrome.runtime.sendMessage({
        command: "fido2AbortRequest",
        abortedRequestId: requestId,
      });
    abortController.signal.addEventListener("abort", abortHandler);

    if (message.type === MessageType.CredentialCreationRequest) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            command: "fido2RegisterCredentialRequest",
            data: message.data,
            requestId: requestId,
          },
          (response) => {
            if (response.error !== undefined) {
              return reject(response.error);
            }

            resolve({
              type: MessageType.CredentialCreationResponse,
              result: response.result,
            });
          }
        );
      });
    }

    if (message.type === MessageType.CredentialGetRequest) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            command: "fido2GetCredentialRequest",
            data: message.data,
            requestId: requestId,
          },
          (response) => {
            if (response.error !== undefined) {
              return reject(response.error);
            }

            resolve({
              type: MessageType.CredentialGetResponse,
              result: response.result,
            });
          }
        );
      }).finally(() =>
        abortController.signal.removeEventListener("abort", abortHandler)
      ) as Promise<Message>;
    }

    return undefined;
  };
}

async function run() {
  if ((await hasActiveUser()) && (await isFido2FeatureEnabled()) && !(await isDomainExcluded())) {
    initializeFido2ContentScript();

    const port = chrome.runtime.connect({ name: "fido2ContentScriptReady" });
    port.onDisconnect.addListener(() => {
      // Cleanup the messenger and remove the event listener
      messenger.sendDisconnectCommand();
      messenger.destroy();
    });
  }
}

run();
