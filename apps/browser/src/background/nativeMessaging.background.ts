import { firstValueFrom, map } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { BiometricStateService } from "@bitwarden/common/key-management/biometrics/biometric-state.service";
import { AppIdService } from "@bitwarden/common/platform/abstractions/app-id.service";
import { CryptoFunctionService } from "@bitwarden/common/platform/abstractions/crypto-function.service";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { EncString } from "@bitwarden/common/platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import { UserKey } from "@bitwarden/common/types/key";

import { BrowserApi } from "../platform/browser/browser-api";

import RuntimeBackground from "./runtime.background";

const MessageValidTimeout = 10 * 1000;
const HashAlgorithmForEncryption = "sha1";

type Message = {
  command: string;
  messageId?: number;

  // Filled in by this service
  userId?: string;
  timestamp?: number;

  // Used for sharing secret
  publicKey?: string;
};

type OuterMessage = {
  message: Message | EncString;
  appId: string;
};

type ReceiveMessage = {
  timestamp: number;
  command: string;
  messageId: number;
  response?: any;

  // Unlock key
  keyB64?: string;
  userKeyB64?: string;
};

type ReceiveMessageOuter = {
  command: string;
  appId: string;
  messageId?: number;

  // Should only have one of these.
  message?: EncString;
  sharedSecret?: string;
};

type Callback = {
  resolver: any;
  rejecter: any;
};

export class NativeMessagingBackground {
  private connected = false;
  private connecting: boolean;
  private port: browser.runtime.Port | chrome.runtime.Port;

  private privateKey: Uint8Array = null;
  private publicKey: Uint8Array = null;
  private secureSetupResolve: any = null;
  private sharedSecret: SymmetricCryptoKey;
  private appId: string;
  private validatingFingerprint: boolean;

  private messageId = 0;
  private callbacks = new Map<number, Callback>();

  constructor(
    private cryptoService: CryptoService,
    private cryptoFunctionService: CryptoFunctionService,
    private runtimeBackground: RuntimeBackground,
    private messagingService: MessagingService,
    private appIdService: AppIdService,
    private platformUtilsService: PlatformUtilsService,
    private logService: LogService,
    private authService: AuthService,
    private biometricStateService: BiometricStateService,
    private accountService: AccountService,
  ) {
    if (chrome?.permissions?.onAdded) {
      // Reload extension to activate nativeMessaging
      chrome.permissions.onAdded.addListener((permissions) => {
        if (permissions.permissions?.includes("nativeMessaging")) {
          BrowserApi.reloadExtension();
        }
      });
    }
  }

  async connect() {
    this.appId = await this.appIdService.getAppId();
    await this.biometricStateService.setFingerprintValidated(false);

    return new Promise<void>((resolve, reject) => {
      this.port = BrowserApi.connectNative("com.8bit.bitwarden");

      this.connecting = true;

      const connectedCallback = () => {
        this.connected = true;
        this.connecting = false;
        resolve();
      };

      // Safari has a bundled native component which is always available, no need to
      // check if the desktop app is running.
      if (this.platformUtilsService.isSafari()) {
        connectedCallback();
      }

      this.port.onMessage.addListener(async (message: ReceiveMessageOuter) => {
        switch (message.command) {
          case "connected":
            connectedCallback();
            break;
          case "disconnected":
            if (this.connecting) {
              reject(new Error("startDesktop"));
            }
            this.connected = false;
            this.port.disconnect();
            break;
          case "setupEncryption": {
            // Ignore since it belongs to another device
            if (message.appId !== this.appId) {
              return;
            }

            const encrypted = Utils.fromB64ToArray(message.sharedSecret);
            const decrypted = await this.cryptoFunctionService.rsaDecrypt(
              encrypted,
              this.privateKey,
              HashAlgorithmForEncryption,
            );

            if (this.validatingFingerprint) {
              this.validatingFingerprint = false;
              await this.biometricStateService.setFingerprintValidated(true);
            }
            this.sharedSecret = new SymmetricCryptoKey(decrypted);
            this.secureSetupResolve();
            break;
          }
          case "invalidateEncryption":
            // Ignore since it belongs to another device
            if (message.appId !== this.appId) {
              return;
            }

            this.sharedSecret = null;
            this.privateKey = null;
            this.connected = false;

            if (this.callbacks.has(message.messageId)) {
              this.callbacks.get(message.messageId).rejecter({
                message: "invalidateEncryption",
              });
            }
            return;
          case "verifyFingerprint": {
            if (this.sharedSecret == null) {
              this.validatingFingerprint = true;
              // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              this.showFingerprintDialog();
            }
            break;
          }
          case "wrongUserId":
            if (this.callbacks.has(message.messageId)) {
              this.callbacks.get(message.messageId).rejecter({
                message: "wrongUserId",
              });
            }
            return;
          default:
            // Ignore since it belongs to another device
            if (!this.platformUtilsService.isSafari() && message.appId !== this.appId) {
              return;
            }

            // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.onMessage(message.message);
        }
      });

      this.port.onDisconnect.addListener((p: any) => {
        let error;
        if (BrowserApi.isWebExtensionsApi) {
          error = p.error.message;
        } else {
          error = chrome.runtime.lastError.message;
        }

        this.sharedSecret = null;
        this.privateKey = null;
        this.connected = false;

        this.logService.error("NativeMessaging port disconnected because of error: " + error);

        const reason = error != null ? "desktopIntegrationDisabled" : null;
        reject(new Error(reason));
      });
    });
  }

  async callCommand(message: Message): Promise<any> {
    const messageId = this.messageId++;
    const callback = new Promise((resolver, rejecter) => {
      this.callbacks.set(messageId, { resolver, rejecter });
    });
    message.messageId = messageId;
    try {
      await this.send(message);
    } catch (e) {
      this.callbacks.delete(messageId);
      throw e;
    }

    setTimeout(() => {
      if (this.callbacks.has(messageId)) {
        this.callbacks.get(messageId).rejecter({
          message: "timeout",
        });
        this.callbacks.delete(messageId);
      }
    }, 60000);

    return callback;
  }

  async send(message: Message) {
    if (!this.connected) {
      await this.connect();
    }

    message.userId = (await firstValueFrom(this.accountService.activeAccount$))?.id;
    message.timestamp = Date.now();

    if (this.platformUtilsService.isSafari()) {
      this.postMessage(message as any);
    } else {
      this.postMessage({ appId: this.appId, message: await this.encryptMessage(message) });
    }
  }

  async encryptMessage(message: Message) {
    if (this.sharedSecret == null) {
      await this.secureCommunication();
    }

    return await this.cryptoService.encrypt(JSON.stringify(message), this.sharedSecret);
  }

  private postMessage(message: OuterMessage, messageId?: number) {
    // Wrap in try-catch to when the port disconnected without triggering `onDisconnect`.
    try {
      const msg: any = message;
      if (message.message instanceof EncString) {
        // Alternative, backwards-compatible serialization of EncString
        msg.message = {
          encryptedString: message.message.encryptedString,
          encryptionType: message.message.encryptionType,
          data: message.message.data,
          iv: message.message.iv,
          mac: message.message.mac,
        };
      }
      this.port.postMessage(msg);
    } catch (e) {
      this.logService.error("NativeMessaging port disconnected, disconnecting.");

      this.sharedSecret = null;
      this.privateKey = null;
      this.connected = false;

      if (this.callbacks.has(messageId)) {
        this.callbacks.get(messageId).rejecter("invalidateEncryption");
      }
    }
  }

  private async onMessage(rawMessage: ReceiveMessage | EncString) {
    let message = rawMessage as ReceiveMessage;
    if (!this.platformUtilsService.isSafari()) {
      message = JSON.parse(
        await this.cryptoService.decryptToUtf8(rawMessage as EncString, this.sharedSecret),
      );
    }

    if (Math.abs(message.timestamp - Date.now()) > MessageValidTimeout) {
      this.logService.error("NativeMessage is to old, ignoring.");
      return;
    }

    const messageId = message.messageId;
    switch (message.command) {
      case "biometricUnlock": {
        if (!this.callbacks.has(messageId)) {
          this.logService.error("Biometric unlock promise not set");
          return;
        }

        this.logService.info("MESSAGE COMMAND", message);
        if (
          ["not available", "not enabled", "not supported", "not unlocked", "canceled"].includes(
            message.response,
          )
        ) {
          this.logService.info("Biometric unlock failed", message.response);
          this.callbacks.get(messageId).rejecter(message.response);
          return;
        }

        // Check for initial setup of biometric unlock
        const enabled = await firstValueFrom(this.biometricStateService.biometricUnlockEnabled$);
        if (enabled === null || enabled === false) {
          if (message.response === "unlocked") {
            await this.biometricStateService.setBiometricUnlockEnabled(true);
          }
          this.logService.info("Ignoring biometric unlock, not enabled");
          break;
        }

        // // Ignore unlock if already unlocked
        // if ((await this.authService.getAuthStatus()) === AuthenticationStatus.Unlocked) {
        //   this.logService.info("Ignoring biometric unlock, already unlocked");
        //   break;
        // }

        if (message.response === "unlocked") {
          try {
            this.logService.info("setting userkey");
            if (message.userKeyB64) {
              const userKey = new SymmetricCryptoKey(
                Utils.fromB64ToArray(message.userKeyB64),
              ) as UserKey;
              const activeUserId = await firstValueFrom(
                this.accountService.activeAccount$.pipe(map((a) => a?.id)),
              );
              this.logService.info("active userid", activeUserId);
              const isUserKeyValid = await this.cryptoService.validateUserKey(
                userKey,
                activeUserId,
              );
              if (isUserKeyValid) {
                this.logService.info("valit setting userkey");
                await this.cryptoService.setUserKey(userKey, activeUserId);
                this.callbacks.get(messageId).resolver("unlocked");
              } else {
                this.logService.error("Unable to verify biometric unlocked userkey");
                await this.cryptoService.clearKeys(activeUserId);
                this.callbacks.get(messageId).rejecter("userkey wrong");
                return;
              }
            } else {
              this.logService.info("no userkey");
              throw new Error("No key received");
            }
          } catch (e) {
            this.logService.error("Unable to set key: " + e);
            this.callbacks.get(messageId).rejecter("userkey wrong");
            return;
          }

          // Verify key is correct by attempting to decrypt a secret
          try {
            const userId = (await firstValueFrom(this.accountService.activeAccount$))?.id;
            await this.cryptoService.getFingerprint(userId);
          } catch (e) {
            this.logService.error("Unable to verify key: " + e);
            await this.cryptoService.clearKeys();
            this.callbacks.get(messageId).rejecter("userkey wrong");
            return;
          }

          // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.runtimeBackground.processMessage({ command: "unlocked" });
        }
        break;
      }
      case "biometricStatus": {
        console.log("messageid", messageId);
        if (!this.callbacks.has(messageId)) {
          this.logService.error("Biometric status promise not set");
          return;
        }
        this.callbacks.get(messageId).resolver(message);
        break;
      }
      case "biometricStatusForUser": {
        if (!this.callbacks.has(messageId)) {
          this.logService.error("Biometric status promise not set");
          return;
        }
        this.callbacks.get(messageId).resolver(message);
        break;
      }
      default:
        this.logService.error("NativeMessage, got unknown command: " + message.command);
        break;
    }

    if (this.callbacks.has(messageId)) {
      this.callbacks.get(messageId).resolver(message);
    }
  }

  private async secureCommunication() {
    const [publicKey, privateKey] = await this.cryptoFunctionService.rsaGenerateKeyPair(2048);
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    const userId = (await firstValueFrom(this.accountService.activeAccount$))?.id;

    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.sendUnencrypted({
      command: "setupEncryption",
      publicKey: Utils.fromBufferToB64(publicKey),
      userId: userId,
      messageId: this.messageId++,
    });

    return new Promise((resolve, reject) => (this.secureSetupResolve = resolve));
  }

  private async sendUnencrypted(message: Message) {
    if (!this.connected) {
      await this.connect();
    }

    message.timestamp = Date.now();

    this.postMessage({ appId: this.appId, message: message });
  }

  private async showFingerprintDialog() {
    const fingerprint = await this.cryptoService.getFingerprint(
      (await firstValueFrom(this.accountService.activeAccount$))?.id,
      this.publicKey,
    );

    this.messagingService.send("showNativeMessagingFinterprintDialog", {
      fingerprint: fingerprint,
    });
  }
}
