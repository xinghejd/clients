import { Observable, firstValueFrom } from "rxjs";

import { ActiveUserState, StateProvider } from "../../../platform/state";
import { SendData } from "../models/data/send.data";
import { SendView } from "../models/view/send.view";

import { SEND_USER_DECRYPTED, SEND_USER_ENCRYPTED } from "./key-definitions";

export class SendStateService {
  // Exposed for the possibility to have consuming services the ability to subscribe?
  encryptedState$: Observable<Record<string, SendData>>;
  decryptedState$: Observable<SendView[]>;

  private activeUserEncryptedState: ActiveUserState<Record<string, SendData>>;
  private activeUserDecryptedState: ActiveUserState<SendView[]>;

  constructor(protected stateProvider: StateProvider) {
    this.activeUserEncryptedState = this.stateProvider.getActive(SEND_USER_ENCRYPTED);
    this.encryptedState$ = this.activeUserEncryptedState.state$;

    this.activeUserDecryptedState = this.stateProvider.getActive(SEND_USER_DECRYPTED);
    this.decryptedState$ = this.activeUserDecryptedState.state$;
  }

  // Encrypted goes to disk.
  async getEncryptedSends(): Promise<{ [id: string]: SendData }> {
    return await firstValueFrom(this.encryptedState$);
  }

  async setEncryptedSends(value: { [id: string]: SendData }): Promise<void> {
    await this.activeUserEncryptedState.update(() => value);
  }

  async getDecryptedSends(): Promise<SendView[]> {
    return await firstValueFrom(this.decryptedState$);
  }

  async setDecryptedSends(value: SendView[]): Promise<void> {
    await this.activeUserDecryptedState.update(() => value);
  }
}
