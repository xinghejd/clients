import { Observable, firstValueFrom } from "rxjs";

import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { I18nService } from "../../../platform/abstractions/i18n.service";
import { KeyGenerationService } from "../../../platform/abstractions/key-generation.service";
import { KdfType } from "../../../platform/enums";
import { Utils } from "../../../platform/misc/utils";
import { EncArrayBuffer } from "../../../platform/models/domain/enc-array-buffer";
import { EncString } from "../../../platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { UserKey } from "../../../types/key";
import { SendType } from "../enums/send-type";
import { SendData } from "../models/data/send.data";
import { Send } from "../models/domain/send";
import { SendFile } from "../models/domain/send-file";
import { SendText } from "../models/domain/send-text";
import { SendWithIdRequest } from "../models/request/send-with-id.request";
import { SendView } from "../models/view/send.view";
import { SEND_KDF_ITERATIONS } from "../send-kdf";

import { SendStateProvider } from "./send-state.provider.abstraction";
import { SendStateService as SendStateServiceAbstraction } from "./send-state.service.abstraction";
import { InternalSendService as InternalSendServiceAbstraction } from "./send.service.abstraction";

export class SendService implements InternalSendServiceAbstraction {
  readonly sendKeySalt = "bitwarden-send";
  readonly sendKeyPurpose = "send";

  sendViews$: Observable<SendView[]>;

  constructor(
    private cryptoService: CryptoService,
    private i18nService: I18nService,
    private keyGenerationService: KeyGenerationService,
    private stateService: SendStateProvider,
    private sendStateService: SendStateServiceAbstraction,
  ) {
    this.sendViews$ = this.sendStateService.sendViews$;
  }

  async encrypt(
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

  async get(id: string): Promise<SendView> {
    return await firstValueFrom(this.sendStateService.get$("1"));
  }

  get$(id: string): Observable<SendView | undefined> {
    return this.sendStateService.get$(id);
  }

  async getFromState(id: string): Promise<Send> {
    const sends = await this.stateService.getEncryptedSends();
    // eslint-disable-next-line
    if (sends == null || !sends.hasOwnProperty(id)) {
      return null;
    }

    return new Send(sends[id]);
  }

  async getAll(): Promise<Send[]> {
    const sends = await this.stateService.getEncryptedSends();
    const response: Send[] = [];
    for (const id in sends) {
      // eslint-disable-next-line
      if (sends.hasOwnProperty(id)) {
        response.push(new Send(sends[id]));
      }
    }
    return response;
  }

  async getAllDecryptedFromState(): Promise<SendView[]> {
    let decSends = await this.stateService.getDecryptedSends();
    if (decSends != null) {
      return decSends;
    }

    decSends = [];
    const hasKey = await this.cryptoService.hasUserKey();
    if (!hasKey) {
      throw new Error("No user key found.");
    }

    const promises: Promise<any>[] = [];
    const sends = await this.getAll();
    sends.forEach((send) => {
      promises.push(send.decrypt().then((f) => decSends.push(f)));
    });

    await Promise.all(promises);
    decSends.sort(Utils.getSortFunction(this.i18nService, "name"));

    await this.stateService.setDecryptedSends(decSends);
    return decSends;
  }

  async upsert(send: SendData | SendData[]): Promise<any> {
    await this.sendStateService.upsert(send);
  }

  async delete(id: string | string[]): Promise<any> {
    await this.sendStateService.delete(id);
  }

  async replace(sends: { [id: string]: SendData }): Promise<any> {
    await this.sendStateService.replace(sends);
  }

  async getRotatedKeys(newUserKey: UserKey): Promise<SendWithIdRequest[]> {
    if (newUserKey == null) {
      throw new Error("New user key is required for rotation.");
    }

    const sends = await firstValueFrom(this.sendStateService.sends$);
    const requests = await Promise.all(
      sends.map(async (send) => {
        const sendKey = await this.cryptoService.decryptToBytes(send.key);
        send.key = await this.cryptoService.encrypt(sendKey, newUserKey);
        return new SendWithIdRequest(send);
      }),
    );
    // separate return for easier debugging
    return requests;
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

  private async encryptFileData(
    fileName: string,
    data: ArrayBuffer,
    key: SymmetricCryptoKey,
  ): Promise<[EncString, EncArrayBuffer]> {
    const encFileName = await this.cryptoService.encrypt(fileName, key);
    const encFileData = await this.cryptoService.encryptToBytes(new Uint8Array(data), key);
    return [encFileName, encFileData];
  }
}
