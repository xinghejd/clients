import { Jsonify } from "type-fest";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import {
  AbstractMemoryStorageService,
  AbstractStorageService,
} from "@bitwarden/common/platform/abstractions/storage.service";
import { DefaultUserState, KeyDefinition } from "@bitwarden/common/platform/state";

import { portNameBuilder } from "./port-builder";

export class ForegroundUserState<T> extends DefaultUserState<T> {
  private _port: chrome.runtime.Port;
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

    this._port = chrome.runtime.connect({ name: portNameBuilder(keyDefinition, "user") });
    this._port.onMessage.addListener(this.onMessageFromBackground.bind(this));
  }

  protected override async saveToStorage(key: string, data: T): Promise<void> {
    this._port.postMessage({
      id: this._lastId,
      key: key,
      data: JSON.stringify(data),
    });
  }

  private async onMessageFromBackground(message: { id: string; key: string; data: string }) {
    const currentKey = await this.createKey();
    if (message.key !== currentKey) {
      // ignore messages for other keys
      return;
    }

    this._lastId = message.id;

    const jsonObj = JSON.parse(message.data) as Jsonify<T>;
    this.stateSubject.next(this.keyDefinition.deserializer(jsonObj));
  }
}
