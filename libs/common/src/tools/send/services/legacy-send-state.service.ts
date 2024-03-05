import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  concatMap,
  distinctUntilChanged,
  filter,
  map,
  share,
  timer,
} from "rxjs";

import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { I18nService } from "../../../platform/abstractions/i18n.service";
import { KeyGenerationService } from "../../../platform/abstractions/key-generation.service";
import { StateService } from "../../../platform/abstractions/state.service";
import { KdfType } from "../../../platform/enums";
import { Utils } from "../../../platform/misc/utils";
import { EncArrayBuffer } from "../../../platform/models/domain/enc-array-buffer";
import { EncString } from "../../../platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { SendType } from "../enums/send-type";
import { SendData } from "../models/data/send.data";
import { Send } from "../models/domain/send";
import { SendFile } from "../models/domain/send-file";
import { SendText } from "../models/domain/send-text";
import { SendView } from "../models/view/send.view";
import { SEND_KDF_ITERATIONS } from "../send-kdf";

import { SendStateService } from "./send-state.service.abstraction";

export type SendStateOptions = {
  cache_ms: number;
};

export class LegacySendStateService implements SendStateService {
  readonly sendKeySalt = "bitwarden-send";
  readonly sendKeyPurpose = "send";
  constructor(
    options: SendStateOptions,
    private cryptoService: CryptoService,
    private i18nService: I18nService,
    private keyGenerationService: KeyGenerationService,
    private stateService: StateService,
  ) {
    // TODO: Does this need a pipe?
    this.encryptedSends$ = this._encryptedSends.asObservable();

    this.stateService.activeAccountUnlocked$
      .pipe(
        concatMap(async (unlocked) => {
          if (Utils.global.bitwardenContainerService == null) {
            return;
          }

          if (!unlocked) {
            this._encryptedSends.next([]);
            return;
          }

          const data = await this.stateService.getEncryptedSends();
          this._encryptedSends.next(Object.values(data || {}).map((f) => new Send(f)));
        }),
      )
      .subscribe();

    this.sends$ = this._encryptedSends.pipe(
      filter((es) => es !== null),
      concatMap((s) => {
        return this.decryptSends(s);
      }),
      share({
        // cache sends in a replay subject because decryption is expensive
        connector: () => new ReplaySubject(1),
        resetOnRefCountZero: () => timer(options.cache_ms),
      }),
    );
  }

  async delete(id: string) {
    const currentSends: Send[] = this._encryptedSends.getValue();
    const sends = Object.values(currentSends || {});

    // Find the index of the send to delete
    const indexToDelete = sends.findIndex((s) => s.id === id);

    // If send is not found, return
    if (indexToDelete === -1) {
      return;
    }

    // Remove the send at the found index
    sends.splice(indexToDelete, 1);

    // Update the send view
    this._encryptedSends.next(sends);
  }

  async encryptSend(
    model: SendView,
    file: File | ArrayBuffer,
    password: string,
    key?: SymmetricCryptoKey,
  ): Promise<[Send, EncArrayBuffer]> {
    let fileData: EncArrayBuffer = null;
    const send = new Send();
    send.id = model.id;
    send.type = model.type;
    send.disabled = model.disabled;
    send.hideEmail = model.hideEmail;
    send.maxAccessCount = model.maxAccessCount;

    if (model.key == null) {
      const key = await this.keyGenerationService.createKeyWithPurpose(
        128,
        this.sendKeyPurpose,
        this.sendKeySalt,
      );
      model.key = key.material;
      model.cryptoKey = key.derivedKey;
    }

    if (password != null) {
      const passwordKey = await this.keyGenerationService.deriveKeyFromPassword(
        password,
        model.key,
        KdfType.PBKDF2_SHA256,
        { iterations: SEND_KDF_ITERATIONS },
      );
      send.password = passwordKey.keyB64;
    }

    send.key = await this.cryptoService.encrypt(model.key, key);
    send.name = await this.cryptoService.encrypt(model.name, model.cryptoKey);
    send.notes = await this.cryptoService.encrypt(model.notes, model.cryptoKey);

    if (send.type === SendType.Text) {
      send.text = new SendText();
      send.text.text = await this.cryptoService.encrypt(model.text.text, model.cryptoKey);
      send.text.hidden = model.text.hidden;
    } else if (send.type === SendType.File) {
      send.file = new SendFile();
      if (file != null) {
        if (file instanceof ArrayBuffer) {
          const [name, data] = await this.encryptFileData(
            model.file.fileName,
            file,
            model.cryptoKey,
          );
          send.file.fileName = name;
          fileData = data;
        } else {
          fileData = await this.parseFile(send, file, model.cryptoKey);
        }
      }
    }

    return [send, fileData];
  }

  private async decryptSends(sends: Send[]): Promise<SendView[]> {
    const decSends: SendView[] = [];
    const hasKey = await this.cryptoService.hasUserKey();
    if (!hasKey) {
      throw new Error("No user key found.");
    }

    const promises: Promise<any>[] = [];
    sends.forEach((send) => {
      promises.push(send.decrypt().then((f) => decSends.push(f)));
    });

    await Promise.all(promises);
    decSends.sort(Utils.getSortFunction(this.i18nService, "name"));

    await this.stateService.setDecryptedSends(decSends);
    return decSends;
  }

  // If the data hasn't loaded, this has no value.
  // If the data has loaded, it has an array value
  // No sends -> Empty array
  // Some sends -> An array with items in it
  readonly sends$: Observable<SendView[]>;

  // If the data hasn't loaded, this stores `null`
  // If the data has loaded, it stores an array.
  // No sends -> Empty array
  // Some sends -> An array with items in it
  private readonly _encryptedSends: BehaviorSubject<Send[]> = new BehaviorSubject(null);

  // TODO: If nothing ever needs an encrypted send, delete this.
  readonly encryptedSends$: Observable<Send[]>;

  get$(id: string): Observable<Send | undefined> {
    return this._encryptedSends.pipe(
      distinctUntilChanged((oldSends, newSends) => {
        const oldSend = oldSends.find((oldSend) => oldSend.id === id);
        const newSend = newSends.find((newSend) => newSend.id === id);
        if (!oldSend || !newSend) {
          // If either oldSend or newSend is not found, consider them different
          return false;
        }

        // Compare each property of the old and new Send objects
        const allPropertiesSame = Object.keys(newSend).every((key) => {
          if (
            (oldSend[key as keyof Send] != null && newSend[key as keyof Send] === null) ||
            (oldSend[key as keyof Send] === null && newSend[key as keyof Send] != null)
          ) {
            // If a key from either old or new send is not found, and the key from the other send has a value, consider them different
            return false;
          }

          switch (key) {
            case "name":
            case "notes":
            case "key":
              if (oldSend[key] === null && newSend[key] === null) {
                return true;
              }

              return oldSend[key].encryptedString === newSend[key].encryptedString;
            case "text":
              if (oldSend[key].text == null && newSend[key].text == null) {
                return true;
              }
              if (
                (oldSend[key].text != null && newSend[key].text == null) ||
                (oldSend[key].text == null && newSend[key].text != null)
              ) {
                return false;
              }
              return oldSend[key].text.encryptedString === newSend[key].text.encryptedString;
            case "file":
              //Files are never updated so never will be changed.
              return true;
            case "revisionDate":
            case "expirationDate":
            case "deletionDate":
              if (oldSend[key] === null && newSend[key] === null) {
                return true;
              }
              return oldSend[key].getTime() === newSend[key].getTime();
            default:
              // For other properties, compare directly
              return oldSend[key as keyof Send] === newSend[key as keyof Send];
          }
        });

        return allPropertiesSame;
      }),
      map((sends) => sends.find((o) => o.id === id)),
    );
  }

  async update(send: SendData) {
    const currentSends: Send[] = this._encryptedSends.getValue();
    const encryptedSend = new Send(send);

    //If we modify directly the currentSends, the distinctUntilChanged method on get$ does not work as expected
    const sends = Object.values(currentSends || {});

    const existingEncryptedSendIndex = currentSends.findIndex((s) => s.id === encryptedSend.id);
    if (existingEncryptedSendIndex !== -1) {
      // If found, update the existing send
      sends[existingEncryptedSendIndex] = encryptedSend;
    } else {
      // Otherwise, add the encryptedSends to sends array
      sends.push(encryptedSend);
    }

    // update the send view
    this._encryptedSends.next(sends);

    return encryptedSend;
  }

  private async encryptFileData(
    fileName: string,
    data: ArrayBuffer,
    key: SymmetricCryptoKey,
  ): Promise<[EncString, EncArrayBuffer]> {
    const encFileName = await this.cryptoService.encrypt(fileName, key);
    const encFileData = await this.cryptoService.encryptToBytes(new Uint8Array(data), key);
    return [encFileName, encFileData];
  }

  private parseFile(send: Send, file: File, key: SymmetricCryptoKey): Promise<EncArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async (evt) => {
        try {
          const [name, data] = await this.encryptFileData(
            file.name,
            evt.target.result as ArrayBuffer,
            key,
          );
          send.file.fileName = name;
          resolve(data);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => {
        reject("Error reading file.");
      };
    });
  }
}
