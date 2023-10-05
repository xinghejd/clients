import { Observable, switchMap } from "rxjs";

import { EncryptService } from "../abstractions/encrypt.service";
import { UserState } from "../interfaces/user-state";

import { DerivedStateDefinition, DeriveContext } from "./derived-state-definition";

export class DerivedUserState<TFrom, TTo> {
  state$: Observable<TTo>;

  // TODO: Probably needs to take state service
  /**
   *
   */
  constructor(
    private derivedStateDefinition: DerivedStateDefinition<TFrom, TTo>,
    private encryptService: EncryptService,
    private userState: UserState<TFrom>
  ) {
    this.state$ = userState.state$.pipe(
      switchMap(async (from) => {
        // TODO: How do I get the key?
        const convertedData = await derivedStateDefinition.converter(
          from,
          new DeriveContext(null, encryptService)
        );
        return convertedData;
      })
    );
  }

  async getFromState(): Promise<TTo> {
    const encryptedFromState = await this.userState.getFromState();

    const context = new DeriveContext(null, this.encryptService);

    const decryptedData = await this.derivedStateDefinition.converter(encryptedFromState, context);
    return decryptedData;
  }
}
