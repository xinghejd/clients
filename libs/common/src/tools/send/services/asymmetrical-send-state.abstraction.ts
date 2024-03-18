import { Observable } from "rxjs";

import { SendData } from "../models/data/send.data";
import { Send } from "../models/domain/send";
import { SendView } from "../models/view/send.view";

export type SendStateOptions = {
  cache_ms: number;
};

export abstract class AsymmetricalSendState {
  /**
   * Provides a SendView[] after decrypting the encrypted sends
   * updates after a change on the encryptedSends BehaviourObject
   * so it will change after an update, delete or replace
   * @returns An observable that listens to the sendViews observable
   */
  sendViews$: Observable<SendView[]>;

  /**
   * Provides Send[] that returns an encrypted sends array
   * updates after a change on the encryptedSends BehaviourObject
   * so it will change after an update, delete or replace
   * @returns An observable that listens to the sends observable
   */
  sends$: Observable<Send[]>;

  /**
   * Provides a send for a determined id
   * updates after a change occurs to the send that matches the id
   * @param id The id of the desired send
   * @returns An observable that listens to the value of the desired send
   */
  get$: (id: string) => Observable<SendView | undefined>;

  /**
   * Changes or creates a send on the encrypted sends list
   * @param send a SendData object that contains the necessary data to construct a Send
   * @returns The updated Send
   */
  update: (send: SendData | SendData[]) => Promise<void>;

  /**
   * Deletes a send on the encrypted sends list
   * @param id a SendData object that contains the necessary data to construct a Send
   * @returns void
   */
  delete: (id: string | string[]) => Promise<any>;

  /**
   * Replaces the whole encrypted sends list
   * @param
   */
  replace: (sends: { [id: string]: SendData }) => Promise<void>;
}
