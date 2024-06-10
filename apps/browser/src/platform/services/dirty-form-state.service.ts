import { switchMap, firstValueFrom } from "rxjs";

import { CommandDefinition, MessageListener } from "@bitwarden/common/platform/messaging";
import {
  POPUP_VIEW_MEMORY,
  KeyDefinition,
  GlobalStateProvider,
} from "@bitwarden/common/platform/state";

type DirtyFormState = {
  key: string;
  value: string;
};

/**
 * When to save state:
 * - when a form is made dirty
 *
 * When to clear all state:
 * - 2min after the popup window closes
 * - lock
 * - logout
 * - when a form is made pristine?
 */

export class DirtyFormStateService {
  /** We cannot use `UserKeyDefinition` because we must be able to store state when there is no active user. */
  private static readonly KEY_DEF = KeyDefinition.record(POPUP_VIEW_MEMORY, "dirty-form-record", {
    deserializer: (jsonValue) => jsonValue,
  });

  static readonly COMMANDS = {
    UPDATE: new CommandDefinition<DirtyFormState>("dirtyForm_saveState"),
    CLEAR_ALL: new CommandDefinition("dirtyForm_clearState"),
  } as const;

  // TODO clear on
  private readonly dirtyFormState = this.globalStateProvider.get(DirtyFormStateService.KEY_DEF);

  constructor(
    private messageListener: MessageListener,
    private globalStateProvider: GlobalStateProvider,
  ) {}

  /** Initialize MessageListeners */
  init() {
    this.messageListener
      .messages$(DirtyFormStateService.COMMANDS.UPDATE)
      .pipe(switchMap(async (command) => this.updateDirtyFormStateByKey(command)))
      .subscribe();

    this.messageListener
      .messages$(DirtyFormStateService.COMMANDS.CLEAR_ALL)
      .pipe
      // tap(() => bg.conso),
      // switchMap(async () => this.clearAll())
      ()
      .subscribe();

    // merge([
    //     this.messageListener.messages$(new CommandDefinition("tabChanged")),
    //     // this.clearTimer$
    // ]).pipe(
    //     tap(() => console.log('foo CLEAR ALL')),
    //     switchMap(() => this.clearAll())
    // ).subscribe();
  }

  async clearAll() {
    await this.dirtyFormState.update(() => ({}));
  }

  /** Update state and set a timer to erase said state */
  private async updateDirtyFormStateByKey({ key, value }: DirtyFormState) {
    await this.dirtyFormState.update((state) => ({ ...state, [key]: value }));
  }

  // static hasDirtyFormState = (
  //   globalStateProvider: GlobalStateProvider,
  // ): Promise<boolean> => {
  //   const state = globalStateProvider.get(DirtyFormStateService.KEY_DEF);
  //   return firstValueFrom(state.state$).then((state) => state != null);
  // };

  static getDirtyFormStateByKey = (key: string, globalStateProvider: GlobalStateProvider) => {
    const state = globalStateProvider.get(DirtyFormStateService.KEY_DEF);
    return firstValueFrom(state.state$).then((state) => state?.[key]);
  };
}
