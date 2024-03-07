import { FallbackRequestedError } from "@bitwarden/common/vault/abstractions/fido2/fido2-client.service.abstraction";

import { WebauthnUtils } from "../webauthn-utils";

import { MessageType } from "./messaging/message";
import { Messenger } from "./messaging/messenger";

(function (globalContext) {
  const BrowserPublicKeyCredential = globalContext.PublicKeyCredential;
  const BrowserNavigatorCredentials = navigator.credentials;
  const BrowserAuthenticatorAttestationResponse = globalContext.AuthenticatorAttestationResponse;

  const browserNativeWebauthnSupport = globalContext.PublicKeyCredential != undefined;
  let browserNativeWebauthnPlatformAuthenticatorSupport = false;
  if (!browserNativeWebauthnSupport) {
    // Polyfill webauthn support
    try {
      // credentials is read-only if supported, use type-casting to force assignment
      (navigator as any).credentials = {
        async create() {
          throw new Error("Webauthn not supported in this browser.");
        },
        async get() {
          throw new Error("Webauthn not supported in this browser.");
        },
      };
      globalContext.PublicKeyCredential = class PolyfillPublicKeyCredential {
        static isUserVerifyingPlatformAuthenticatorAvailable() {
          return Promise.resolve(true);
        }
      } as any;
      globalContext.AuthenticatorAttestationResponse =
        class PolyfillAuthenticatorAttestationResponse {} as any;
    } catch {
      /* empty */
    }
  }

  if (browserNativeWebauthnSupport) {
    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    BrowserPublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then((available) => {
      browserNativeWebauthnPlatformAuthenticatorSupport = available;

      if (!available) {
        // Polyfill platform authenticator support
        globalContext.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = () =>
          Promise.resolve(true);
      }
    });
  }

  const browserCredentials = {
    create: navigator.credentials.create.bind(
      navigator.credentials,
    ) as typeof navigator.credentials.create,
    get: navigator.credentials.get.bind(navigator.credentials) as typeof navigator.credentials.get,
  };

  const messenger = ((window as any).messenger = Messenger.forDOMCommunication(window));
  let waitForFocusTimeout: number | NodeJS.Timeout;
  let focusListenerHandler: () => void;

  navigator.credentials.create = createWebAuthnCredential;
  navigator.credentials.get = getWebAuthnCredential;

  /**
   * Creates a new webauthn credential.
   *
   * @param options Options for creating new credentials.
   * @param abortController Abort controller to abort the request if needed.
   * @returns Promise that resolves to the new credential object.
   */
  async function createWebAuthnCredential(
    options?: CredentialCreationOptions,
    abortController?: AbortController,
  ): Promise<Credential> {
    if (!isWebauthnCall(options)) {
      return await browserCredentials.create(options);
    }

    const fallbackSupported =
      (options?.publicKey?.authenticatorSelection?.authenticatorAttachment === "platform" &&
        browserNativeWebauthnPlatformAuthenticatorSupport) ||
      (options?.publicKey?.authenticatorSelection?.authenticatorAttachment !== "platform" &&
        browserNativeWebauthnSupport);
    try {
      const response = await messenger.request(
        {
          type: MessageType.CredentialCreationRequest,
          data: WebauthnUtils.mapCredentialCreationOptions(options, fallbackSupported),
        },
        abortController,
      );

      if (response.type !== MessageType.CredentialCreationResponse) {
        throw new Error("Something went wrong.");
      }

      return WebauthnUtils.mapCredentialRegistrationResult(response.result);
    } catch (error) {
      if (error && error.fallbackRequested && fallbackSupported) {
        await waitForFocus();
        return await browserCredentials.create(options);
      }

      throw error;
    }
  }

  /**
   * Retrieves a webauthn credential.
   *
   * @param options Options for creating new credentials.
   * @param abortController Abort controller to abort the request if needed.
   * @returns Promise that resolves to the new credential object.
   */
  async function getWebAuthnCredential(
    options?: CredentialRequestOptions,
    abortController?: AbortController,
  ): Promise<Credential> {
    if (!isWebauthnCall(options)) {
      return await browserCredentials.get(options);
    }

    const fallbackSupported = browserNativeWebauthnSupport;

    try {
      if (options?.mediation && options.mediation !== "optional") {
        throw new FallbackRequestedError();
      }

      const response = await messenger.request(
        {
          type: MessageType.CredentialGetRequest,
          data: WebauthnUtils.mapCredentialRequestOptions(options, fallbackSupported),
        },
        abortController,
      );

      if (response.type !== MessageType.CredentialGetResponse) {
        throw new Error("Something went wrong.");
      }

      return WebauthnUtils.mapCredentialAssertResult(response.result);
    } catch (error) {
      if (error && error.fallbackRequested && fallbackSupported) {
        await waitForFocus();
        return await browserCredentials.get(options);
      }

      throw error;
    }
  }

  function isWebauthnCall(options?: CredentialCreationOptions | CredentialRequestOptions) {
    return options && "publicKey" in options;
  }

  /**
   * Wait for window to be focused.
   * Safari doesn't allow scripts to trigger webauthn when window is not focused.
   *
   * @param fallbackWait How long to wait when the script is not able to add event listeners to `window.top`. Defaults to 500ms.
   * @param timeout Maximum time to wait for focus in milliseconds. Defaults to 5 minutes.
   * @returns Promise that resolves when window is focused, or rejects if timeout is reached.
   */
  async function waitForFocus(fallbackWait = 500, timeout = 5 * 60 * 1000) {
    try {
      if (globalContext.top.document.hasFocus()) {
        return;
      }
    } catch {
      // Cannot access window.top due to cross-origin frame, fallback to waiting
      return await new Promise((resolve) => globalContext.setTimeout(resolve, fallbackWait));
    }

    const focusPromise = new Promise<void>((resolve) => {
      focusListenerHandler = () => resolve();
      globalContext.top.addEventListener("focus", focusListenerHandler);
    });

    const timeoutPromise = new Promise<void>((_, reject) => {
      waitForFocusTimeout = globalContext.setTimeout(
        () =>
          reject(
            new DOMException("The operation either timed out or was not allowed.", "AbortError"),
          ),
        timeout,
      );
    });

    try {
      await Promise.race([focusPromise, timeoutPromise]);
    } finally {
      clearWaitForFocus();
    }
  }

  function clearWaitForFocus() {
    globalContext.top.removeEventListener("focus", focusListenerHandler);
    if (waitForFocusTimeout) {
      globalContext.clearTimeout(waitForFocusTimeout);
    }
  }

  function destroy() {
    try {
      if (browserNativeWebauthnSupport) {
        navigator.credentials.create = browserCredentials.create;
        navigator.credentials.get = browserCredentials.get;
      } else {
        (navigator as any).credentials = BrowserNavigatorCredentials;
        globalContext.PublicKeyCredential = BrowserPublicKeyCredential;
        globalContext.AuthenticatorAttestationResponse = BrowserAuthenticatorAttestationResponse;
      }
    } catch (e) {
      /** empty */
    }

    clearWaitForFocus();
    void messenger.destroy();
  }

  /**
   * Sets up a listener to handle cleanup or reconnection when the extension's
   * context changes due to being reloaded or unloaded.
   */
  messenger.handler = (message) => {
    const type = message.type;

    // Handle cleanup for disconnect request
    if (type === MessageType.DisconnectRequest) {
      destroy();
    }
  };
})(globalThis);
