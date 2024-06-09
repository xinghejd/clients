import { switchMap, firstValueFrom, Subject, delay, merge, tap } from "rxjs";

import { CommandDefinition, MessageListener } from "@bitwarden/common/platform/messaging";
import {
  DIRTY_FORM_MEMORY,
  ActiveUserStateProvider,
  UserKeyDefinition,
} from "@bitwarden/common/platform/state";

type DirtyFormState = {
  key: string;
  value: string;
};

export class DirtyFormStateService {
  private static readonly KEY_DEF = UserKeyDefinition.record(DIRTY_FORM_MEMORY, "dirty-form-record", {
    deserializer: (jsonValue) => jsonValue,
    clearOn: ["lock", "logout"],
  });

  static readonly COMMANDS = {
    SAVE: new CommandDefinition<DirtyFormState>(
        "dirtyForm_saveState",
    ),
    CLEAR: new CommandDefinition<DirtyFormState>(
        "dirtyForm_clearState",
    ),
  } as const;

  private readonly state = this.activeUserStateProvider.get(DirtyFormStateService.KEY_DEF);

  /** Clear state after 2min */
  private clearTimerSub = new Subject<void>();
  private clearTimer$ = this.clearTimerSub.pipe(
    delay(120000)
  );

  constructor(
    private messageListener: MessageListener,

    // would it be fine to instead use global state and just clear on lock/logout?
    private activeUserStateProvider: ActiveUserStateProvider,
  ) {}

  /** Initialize MessageListeners */
  init() {
    this.messageListener
      .messages$(DirtyFormStateService.COMMANDS.SAVE)
      .pipe(switchMap(async (command) => this.updateState(command)))
      .subscribe();

    // merge([
    //     this.messageListener.messages$(new CommandDefinition("tabChanged")),
    //     // this.clearTimer$
    // ]).pipe(
    //     tap(() => console.log('foo CLEAR ALL')),
    //     switchMap(() => this.clearAll())
    // ).subscribe();
  }

  /** Update state and set a timer to erase said state */
  private async updateState({ key, value }: DirtyFormState) {
    await this.state.update((state) => ({ ...state, [key]: value }));
    this.clearTimerSub.next();
  }

  private async clearAll() {
    await this.state.update(() => ({}));
  }

  static hasDirtyFormState = (
    activeUserStateProvider: ActiveUserStateProvider,
  ): Promise<boolean> => {
    const state = activeUserStateProvider.get(DirtyFormStateService.KEY_DEF);
    return firstValueFrom(state.state$).then((state) => state != null);
  };

  static getDirtyFormState = (key: string, activeUserStateProvider: ActiveUserStateProvider) => {
    const state = activeUserStateProvider.get(DirtyFormStateService.KEY_DEF);
    return firstValueFrom(state.state$).then((state) => state?.[key]);
  };
}
