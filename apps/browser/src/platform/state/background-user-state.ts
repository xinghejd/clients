import { Subscription } from "rxjs";
import { Jsonify } from "type-fest";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import {
  AbstractMemoryStorageService,
  AbstractStorageService,
} from "@bitwarden/common/platform/abstractions/storage.service";
import { DefaultUserState, KeyDefinition } from "@bitwarden/common/platform/state";

import { portNameBuilder } from "./port-builder";

export class BackgroundUserState<T> extends DefaultUserState<T> {
  private _portSubscriptions = new Map<chrome.runtime.Port, Subscription>();
  private _lastId: string;

  constructor(
    keyDefinition: KeyDefinition<T>,
    accountService: AccountService,
    encryptService: EncryptService,
    memoryStorageService: AbstractMemoryStorageService,
    secureStorageService: AbstractStorageService,
    diskStorageService: AbstractStorageService
  ) {
    super(
      keyDefinition,
      accountService,
      encryptService,
      memoryStorageService,
      secureStorageService,
      diskStorageService
    );

    chrome.runtime.onConnect.addListener((port) => {
      if (port.name !== this.portName) {
        return;
      }

      port.onDisconnect.addListener(this.onDisconnect.bind(this));
      port.onMessage.addListener(this.onMessageFromForeground.bind(this));
      const subscription = this.state$.subscribe((value) => {
        this.sendValue(port, value);
      });

      this._portSubscriptions.set(port, subscription);
    });
  }

  private onDisconnect(port: chrome.runtime.Port) {
    this._portSubscriptions.get(port)?.unsubscribe();
    this._portSubscriptions.delete(port);
  }

  private async onMessageFromForeground(message: {
    expectedId: string;
    key: string;
    data: string;
  }) {
    if (message.expectedId !== this._lastId) {
      // Ignore out of sync messages
      return;
    }

    const jsonObj = JSON.parse(message.data) as Jsonify<T>;
    await this.saveToStorage(message.key, this.keyDefinition.deserializer(jsonObj));
  }

  private sendValue(port: chrome.runtime.Port, value: T) {
    port.postMessage({ id: this._lastId, data: JSON.stringify(value) });
  }

  private get portName() {
    return portNameBuilder(this.keyDefinition, "user");
  }
}
