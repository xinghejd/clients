import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  concatMap,
  distinctUntilChanged,
  filter,
  of,
  share,
  timer,
} from "rxjs";

import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { I18nService } from "../../../platform/abstractions/i18n.service";
import { StateService } from "../../../platform/abstractions/state.service";
import { Utils } from "../../../platform/misc/utils";
import { SendData } from "../models/data/send.data";
import { Send } from "../models/domain/send";
import { SendView } from "../models/view/send.view";

import { SendStateOptions, AsymmetricalSendState } from "./asymmetrical-send-state.abstraction";

export class LegacySendStateService implements AsymmetricalSendState {
  readonly sendKeySalt = "bitwarden-send";
  readonly sendKeyPurpose = "send";
  constructor(
    options: SendStateOptions,
    private cryptoService: CryptoService,
    private i18nService: I18nService,
    private stateService: StateService,
  ) {
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

    this.sendViews$ = this._encryptedSends.pipe(
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

    this.sends$ = this._encryptedSends;
  }

  // If the data hasn't loaded, this has no value.
  // If the data has loaded, it has an array value
  // No sends -> Empty array
  // Some sends -> An array with items in it
  readonly sendViews$: Observable<SendView[]>;

  // If the data hasn't loaded, this has no value.
  // If the data has loaded, it has an array value
  // No sends -> Empty array
  // Some sends -> An array with items in it
  readonly sends$: Observable<Send[]>;

  // If the data hasn't loaded, this stores `null`
  // If the data has loaded, it stores an array.
  // No sends -> Empty array
  // Some sends -> An array with items in it
  private readonly _encryptedSends: BehaviorSubject<Send[]> = new BehaviorSubject(null);

  get$(id: string): Observable<SendView | undefined> {
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
      concatMap((sends) => {
        const send = sends.find((o) => o.id === id);
        if (send) {
          return this.decryptSend(send);
        } else {
          return of(undefined); // Return undefined if the send is not found
        }
      }),
    );
  }

  async delete(id: string | string[]) {
    let sends = await this.stateService.getEncryptedSends();

    if (sends == null) {
      sends = {};
    }

    if (Array.isArray(id)) {
      id.forEach((i) => {
        delete sends[i];
      });
    } else {
      delete sends[id];
    }

    // Update the send view
    await this.replace(sends);
  }

  async update(send: SendData | SendData[]) {
    let sends = await this.stateService.getEncryptedSends();

    if (sends == null) {
      sends = {};
    }

    if (Array.isArray(send)) {
      send.forEach((s) => {
        sends[s.id] = s;
      });
    } else {
      sends[send.id] = send;
    }
    await this.replace(sends);
  }

  async replace(sendsMap: { [id: string]: SendData }): Promise<any> {
    const sends = Object.values(sendsMap || {}).map((f) => new Send(f));
    this._encryptedSends.next(sends);
    await this.stateService.setEncryptedSends(sendsMap);
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

  private decryptSend(send: Send): Promise<SendView> {
    return send.decrypt();
  }
}
