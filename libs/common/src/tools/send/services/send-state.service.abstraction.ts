import { Observable } from "rxjs";

import { EncArrayBuffer } from "../../../platform/models/domain/enc-array-buffer";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { SendData } from "../models/data/send.data";
import { Send } from "../models/domain/send";
import { SendView } from "../models/view/send.view";

export abstract class SendStateService {
  encryptSend: (
    model: SendView,
    file: File | ArrayBuffer,
    password: string,
    key?: SymmetricCryptoKey,
  ) => Promise<[Send, EncArrayBuffer]>;

  sends$: Observable<SendView[]>;
  get$: (id: string) => Observable<Send | undefined>;
  update: (send: SendData) => Promise<Send>;
  delete: (id: string) => Promise<any>;
}
