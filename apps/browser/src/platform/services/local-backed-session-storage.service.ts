import { Subject } from "rxjs";
import { Jsonify } from "type-fest";

import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { KeyGenerationService } from "@bitwarden/common/platform/abstractions/key-generation.service";
import {
  AbstractMemoryStorageService,
  ObservableStorageService,
  StorageUpdate,
} from "@bitwarden/common/platform/abstractions/storage.service";
import { EncString } from "@bitwarden/common/platform/models/domain/enc-string";
import { MemoryStorageOptions } from "@bitwarden/common/platform/models/domain/storage-options";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";

import { BrowserApi } from "../browser/browser-api";
import { devFlag } from "../decorators/dev-flag.decorator";
import { devFlagEnabled } from "../flags";
import { MemoryStoragePortMessage } from "../storage/port-messages";
import { portName } from "../storage/port-name";

import BrowserLocalStorageService from "./browser-local-storage.service";
import BrowserMemoryStorageService from "./browser-memory-storage.service";

const keys = {
  encKey: "localEncryptionKey",
  sessionKey: "session",
};

export class LocalBackedSessionStorageService
  extends AbstractMemoryStorageService
  implements ObservableStorageService
{
  private cache = new Map<string, unknown>();
  private localStorage = new BrowserLocalStorageService();
  private sessionStorage = new BrowserMemoryStorageService();
  private updatesSubject = new Subject<StorageUpdate>();
  private _ports: chrome.runtime.Port[] = [];

  constructor(
    private encryptService: EncryptService,
    private keyGenerationService: KeyGenerationService,
  ) {
    super();

    this.setupPortListener();
  }

  get valuesRequireDeserialization(): boolean {
    return true;
  }

  get updates$() {
    return this.updatesSubject.asObservable();
  }

  async get<T>(key: string, options?: MemoryStorageOptions<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    return await this.getBypassCache(key, options);
  }

  async getBypassCache<T>(key: string, options?: MemoryStorageOptions<T>): Promise<T> {
    const session = await this.getLocalSession(await this.getSessionEncKey());
    if (session == null || !Object.keys(session).includes(key)) {
      return null;
    }

    let value = session[key];
    if (options?.deserializer != null) {
      value = options.deserializer(value as Jsonify<T>);
    }

    this.cache.set(key, value);
    return this.cache.get(key) as T;
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) != null;
  }

  async save<T>(key: string, obj: T): Promise<void> {
    if (obj == null) {
      return await this.remove(key);
    }

    this.cache.set(key, obj);
    await this.updateLocalSessionValue(key, obj);
    this.updatesSubject.next({ key, updateType: "save" });
  }

  async remove(key: string): Promise<void> {
    this.cache.delete(key);
    await this.updateLocalSessionValue(key, null);
    this.updatesSubject.next({ key, updateType: "remove" });
  }

  private async updateLocalSessionValue<T>(key: string, obj: T) {
    const sessionEncKey = await this.getSessionEncKey();
    const localSession = (await this.getLocalSession(sessionEncKey)) ?? {};
    localSession[key] = obj;
    await this.setLocalSession(localSession, sessionEncKey);
  }

  async getLocalSession(encKey: SymmetricCryptoKey): Promise<Record<string, unknown>> {
    const local = await this.localStorage.get<string>(keys.sessionKey);

    if (local == null) {
      return null;
    }

    if (devFlagEnabled("storeSessionDecrypted")) {
      return local as any as Record<string, unknown>;
    }

    const sessionJson = await this.encryptService.decryptToUtf8(new EncString(local), encKey);
    if (sessionJson == null) {
      // Error with decryption -- session is lost, delete state and key and start over
      await this.setSessionEncKey(null);
      await this.localStorage.remove(keys.sessionKey);
      return null;
    }
    return JSON.parse(sessionJson);
  }

  async setLocalSession(session: Record<string, unknown>, key: SymmetricCryptoKey) {
    if (devFlagEnabled("storeSessionDecrypted")) {
      await this.setDecryptedLocalSession(session);
    } else {
      await this.setEncryptedLocalSession(session, key);
    }
  }

  @devFlag("storeSessionDecrypted")
  async setDecryptedLocalSession(session: Record<string, unknown>): Promise<void> {
    // Make sure we're storing the jsonified version of the session
    const jsonSession = JSON.parse(JSON.stringify(session));
    if (session == null) {
      await this.localStorage.remove(keys.sessionKey);
    } else {
      await this.localStorage.save(keys.sessionKey, jsonSession);
    }
  }

  async setEncryptedLocalSession(session: Record<string, unknown>, key: SymmetricCryptoKey) {
    const jsonSession = JSON.stringify(session);
    const encSession = await this.encryptService.encrypt(jsonSession, key);

    if (encSession == null) {
      return await this.localStorage.remove(keys.sessionKey);
    }
    await this.localStorage.save(keys.sessionKey, encSession.encryptedString);
  }

  async getSessionEncKey(): Promise<SymmetricCryptoKey> {
    let storedKey = await this.sessionStorage.get<SymmetricCryptoKey>(keys.encKey);
    if (storedKey == null || Object.keys(storedKey).length == 0) {
      const generatedKey = await this.keyGenerationService.createKeyWithPurpose(
        128,
        "ephemeral",
        "bitwarden-ephemeral",
      );
      storedKey = generatedKey.derivedKey;
      await this.setSessionEncKey(storedKey);
      return storedKey;
    } else {
      return SymmetricCryptoKey.fromJSON(storedKey);
    }
  }

  async setSessionEncKey(input: SymmetricCryptoKey): Promise<void> {
    if (input == null) {
      await this.sessionStorage.remove(keys.encKey);
    } else {
      await this.sessionStorage.save(keys.encKey, input);
    }
  }

  private setupPortListener() {
    BrowserApi.addListener(chrome.runtime.onConnect, this.handlePortOnConnect);
    this.updates$.subscribe((update) => {
      this.broadcastMessage({
        action: "subject_update",
        data: update,
      });
    });
  }

  private handlePortOnConnect = (port: chrome.runtime.Port) => {
    if (port.name !== portName(chrome.storage.session)) {
      return;
    }

    this._ports.push(port);

    port.onDisconnect.addListener(this.handlePortOnDisconnect);
    port.onMessage.addListener(this.onMessageFromForeground);
    // Initialize the new memory storage service with existing data
    this.sendMessageTo(port, {
      action: "initialization",
      data: Array.from(this.cache.keys()),
    });
  };

  private handlePortOnDisconnect = (port: chrome.runtime.Port) => {
    this._ports.splice(this._ports.indexOf(port), 1);
    port.onMessage.removeListener(this.onMessageFromForeground);
  };

  private onMessageFromForeground = async (
    message: MemoryStoragePortMessage,
    port: chrome.runtime.Port,
  ) => {
    if (message.originator === "background") {
      return;
    }

    let result: unknown = null;

    switch (message.action) {
      case "get":
      case "getBypassCache":
      case "has": {
        result = await this[message.action](message.key);
        break;
      }
      case "save":
        await this.save(message.key, JSON.parse((message.data as string) ?? null) as unknown);
        break;
      case "remove":
        await this.remove(message.key);
        break;
    }

    this.sendMessageTo(port, {
      id: message.id,
      key: message.key,
      data: JSON.stringify(result),
    });
  };

  private broadcastMessage(data: Omit<MemoryStoragePortMessage, "originator">) {
    this._ports.forEach((port) => {
      this.sendMessageTo(port, data);
    });
  }

  private sendMessageTo(
    port: chrome.runtime.Port,
    data: Omit<MemoryStoragePortMessage, "originator">,
  ) {
    port.postMessage({
      ...data,
      originator: "background",
    });
  }
}
